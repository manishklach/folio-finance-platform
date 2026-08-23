import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import fc from "fast-check";
import { fromCents, toCents, validateJournal } from "../lib/accounting.js";
import { createLedger } from "../lib/db.js";
import { createPlatform } from "../lib/platform.js";
import { allocateCentsByWeight, allocateSignedCentsByWeight } from "../lib/saas.js";

const cents = fc.integer({ min: 1, max: 100_000_000 });

test("property: integer cents round-trip and balanced journal validation are exact", () => {
  fc.assert(
    fc.property(fc.integer({ min: -100_000_000, max: 100_000_000 }), (amount) => {
      assert.equal(toCents(fromCents(amount)), amount);
    }),
    { numRuns: 500 },
  );
  fc.assert(
    fc.property(cents, fc.integer({ min: 1, max: 1000 }), (amount, accountId) => {
      const entry = {
        date: "2026-08-23",
        memo: "Generated balanced journal",
        lines: [
          { account_id: accountId, debit_cents: amount, credit_cents: 0 },
          { account_id: accountId + 1, debit_cents: 0, credit_cents: amount },
        ],
      };
      const balanced = validateJournal(entry);
      assert.equal(balanced.valid, true);
      assert.equal(balanced.debit_cents, balanced.credit_cents);
      entry.lines[1].credit_cents += 1;
      assert.equal(validateJournal(entry).valid, false);
    }),
    { numRuns: 500 },
  );
});

test("property: relative-SSP allocations are exact, deterministic, and never negative", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 100_000_000 }),
      fc.array(fc.integer({ min: 1, max: 10_000_000 }), { minLength: 1, maxLength: 20 }),
      (total, weights) => {
        const first = allocateCentsByWeight(total, weights);
        const second = allocateCentsByWeight(total, weights);
        assert.deepEqual(first, second);
        assert.equal(
          first.reduce((sum, amount) => sum + amount, 0),
          total,
        );
        assert.equal(
          first.every((amount) => Number.isSafeInteger(amount) && amount >= 0),
          true,
        );
      },
    ),
    { numRuns: 1000 },
  );
  assert.deepEqual(allocateCentsByWeight(2, [3, 3, 3, 1]), [1, 1, 0, 0]);
  fc.assert(
    fc.property(
      fc.integer({ min: -100_000_000, max: 100_000_000 }),
      fc.array(fc.integer({ min: 1, max: 10_000_000 }), { minLength: 1, maxLength: 20 }),
      (total, weights) => {
        const allocation = allocateSignedCentsByWeight(total, weights);
        assert.equal(
          allocation.reduce((sum, amount) => sum + amount, 0),
          total,
        );
        assert.equal(
          allocation.every((amount) => Math.sign(amount) === Math.sign(total) || amount === 0),
          true,
        );
      },
    ),
    { numRuns: 500 },
  );
});

test("property: ASC 606 contracts conserve consideration through allocation and schedules", (t) => {
  const ledger = createLedger(":memory:", { seed: true });
  t.after(() => ledger.close());
  const customer = ledger.customers()[0];
  const entity = ledger.entities()[0];
  const product = ledger.products()[0];
  const roundingBoundary = ledger.createContract({
    customer_id: customer.id,
    entity_id: entity.id,
    contract_number: "PROPERTY-ROUNDING-BOUNDARY",
    signed_date: "2026-01-01",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    transaction_price_cents: 2,
    obligations: [3, 3, 3, 1].map((ssp, index) => ({
      product_id: product.id,
      description: `Rounding boundary ${index + 1}`,
      ssp_cents: ssp,
      recognition_method: "straight_line",
    })),
  });
  assert.deepEqual(
    roundingBoundary.obligations.map(({ allocated_price_cents }) => allocated_price_cents),
    [1, 1, 0, 0],
  );
  const increased = ledger.modifyContract({
    contract_id: roundingBoundary.id,
    effective_date: "2026-02-01",
    kind: "price_change",
    description: "Generated exact price increase",
    price_change_cents: 2,
    treatment: "prospective",
  });
  assert.deepEqual(
    increased.obligations.map(({ allocated_price_cents }) => allocated_price_cents),
    [2, 2, 0, 0],
  );
  const modificationsBeforeFailure = increased.modifications.length;
  assert.throws(
    () =>
      ledger.modifyContract({
        contract_id: roundingBoundary.id,
        effective_date: "2026-03-01",
        kind: "price_change",
        description: "Invalid negative allocation",
        price_change_cents: -5,
        treatment: "prospective",
      }),
    /positive transaction price|negative obligation allocation/,
  );
  const afterRejectedChange = ledger.getContract(roundingBoundary.id);
  assert.equal(afterRejectedChange.transaction_price_cents, 4);
  assert.equal(afterRejectedChange.modifications.length, modificationsBeforeFailure);
  let sequence = 0;
  fc.assert(
    fc.property(
      cents,
      fc.array(fc.integer({ min: 1, max: 1_000_000 }), { minLength: 1, maxLength: 8 }),
      (transactionPrice, weights) => {
        sequence += 1;
        const contract = ledger.createContract({
          customer_id: customer.id,
          entity_id: entity.id,
          contract_number: `PROPERTY-${sequence}`,
          signed_date: "2026-01-01",
          start_date: "2026-01-01",
          end_date: "2026-12-31",
          transaction_price_cents: transactionPrice,
          obligations: weights.map((ssp, index) => ({
            product_id: product.id,
            description: `Generated obligation ${index + 1}`,
            ssp_cents: ssp,
            recognition_method: "straight_line",
          })),
        });
        const obligationIds = new Set(contract.obligations.map(({ id }) => id));
        const allocated = contract.obligations.reduce(
          (sum, obligation) => sum + obligation.allocated_price_cents,
          0,
        );
        const scheduled = ledger
          .revenueSchedules()
          .filter(({ obligation_id }) => obligationIds.has(obligation_id))
          .reduce((sum, row) => sum + row.amount_cents, 0);
        assert.equal(allocated, transactionPrice);
        assert.equal(scheduled, transactionPrice);
        assert.equal(
          contract.obligations.every(({ allocated_price_cents }) => allocated_price_cents >= 0),
          true,
        );
      },
    ),
    { numRuns: 100 },
  );
});

test("property: posted journal batches preserve trial-balance and hash invariants", (t) => {
  const ledger = createLedger(":memory:", { seed: true });
  t.after(() => ledger.close());
  const accounts = Object.fromEntries(
    ledger.getAccounts().map((account) => [account.code, account.id]),
  );
  fc.assert(
    fc.property(fc.array(cents, { minLength: 1, maxLength: 20 }), (amounts) => {
      for (const amount of amounts) {
        const draft = ledger.createDraft({
          date: "2026-08-23",
          memo: "Generated property journal",
          lines: [
            { account_id: accounts["5100"], debit_cents: amount, credit_cents: 0 },
            { account_id: accounts["2000"], debit_cents: 0, credit_cents: amount },
          ],
        });
        ledger.postJournal(draft.id);
      }
      const accountsAfter = ledger.getAccounts();
      const signedBalance = accountsAfter.reduce(
        (sum, account) =>
          sum +
          (["asset", "expense"].includes(account.type)
            ? account.balance_cents
            : -account.balance_cents),
        0,
      );
      assert.equal(signedBalance, 0);
      assert.equal(ledger.verifyIntegrity().valid, true);
    }),
    { numRuns: 40 },
  );
});

test("property: idempotency results are request- and tenant-bound", (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-idempotency-property-"));
  const platform = createPlatform(join(root, "platform.db"), join(root, "tenants"));
  t.after(() => {
    platform.close();
    rmSync(root, { recursive: true, force: true });
  });
  let sequence = 0;
  fc.assert(
    fc.property(
      fc.uuid(),
      fc.uuid(),
      fc.string({ minLength: 1, maxLength: 100 }),
      (orgId, otherOrgId, payload) => {
        fc.pre(orgId !== otherOrgId);
        sequence += 1;
        const route = "/api/property";
        const key = `property-${sequence}`;
        const hash = `hash:${payload}`;
        const body = { sequence, payload };
        assert.equal(platform.idempotencyReserve(orgId, route, key, hash), true);
        assert.equal(platform.idempotencyReserve(orgId, route, key, hash), false);
        platform.idempotencyComplete(orgId, route, key, 201, body);
        assert.deepEqual(platform.idempotencyLookup(orgId, route, key, hash), {
          status: 201,
          body,
        });
        assert.equal(platform.idempotencyLookup(otherOrgId, route, key, hash), null);
        assert.throws(
          () => platform.idempotencyLookup(orgId, route, key, `${hash}:changed`),
          /reused with a different request/,
        );
      },
    ),
    { numRuns: 100 },
  );
});

test("property: tenant database binding rejects every mismatched organization", (t) => {
  const root = mkdtempSync(join(tmpdir(), "folio-tenant-property-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  let sequence = 0;
  fc.assert(
    fc.property(fc.uuid(), fc.uuid(), (ownerOrgId, otherOrgId) => {
      fc.pre(ownerOrgId !== otherOrgId);
      sequence += 1;
      const path = join(root, `tenant-${sequence}.db`);
      createLedger(path, { seed: false, orgId: ownerOrgId }).close();
      assert.throws(
        () => createLedger(path, { seed: false, orgId: otherOrgId }),
        /organization mismatch/,
      );
    }),
    { numRuns: 25 },
  );
});
