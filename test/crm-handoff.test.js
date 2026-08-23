import assert from "node:assert/strict";
import test from "node:test";
import { createLedger } from "../lib/db.js";
import { runWithRequestContext } from "../lib/request-context.js";

function as(actor, callback) {
  return runWithRequestContext({ actor, role: "accounting_manager" }, callback);
}

test("HubSpot associations become an approved, idempotent ASC 606 contract handoff", () => {
  const ledger = createLedger(":memory:", { seed: true });
  const connection = ledger.configureIntegration({
    provider: "hubspot",
    display_name: "HubSpot production",
    environment: "sandbox",
    credential_secret_ref: "HUBSPOT_CREDENTIAL_REF",
  });
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  const run = ledger.startIntegrationSync({ connection_id: connection.id });
  ledger.ingestIntegrationPage({
    sync_run_id: run.id,
    has_more: false,
    next_cursor: "crm-v1",
    added: [
      {
        object_type: "hubspot_company",
        external_id: "co-1",
        source_version: "v1",
        normalized: { name: "Acme" },
      },
      {
        object_type: "hubspot_product",
        external_id: "prod-1",
        source_version: "v1",
        normalized: { name: "Platform" },
      },
      {
        object_type: "hubspot_line_item",
        external_id: "line-1",
        source_version: "v1",
        normalized: {
          name: "Platform subscription",
          quantity: "2",
          unit_price: "6000",
          amount: "12000",
          product_external_ids: ["prod-1"],
        },
      },
      {
        object_type: "hubspot_deal",
        external_id: "deal-1",
        source_version: "v1",
        normalized: {
          name: "Acme annual",
          amount: "12000",
          currency: "USD",
          close_date: "2026-08-20",
          is_closed_won: true,
          company_external_ids: ["co-1"],
          line_item_external_ids: ["line-1"],
        },
      },
    ],
  });
  const records = ledger.integrationRecords(connection.id);
  const customer = ledger.customers()[0];
  const product = ledger.products()[0];
  as("identity.controller", () => {
    ledger.linkCrmCustomer({
      record_id: records.find((item) => item.object_type === "hubspot_company").id,
      customer_id: customer.id,
      approved: true,
      approval_note: "Verified legal customer identity",
    });
    ledger.linkCrmProduct({
      record_id: records.find((item) => item.object_type === "hubspot_product").id,
      product_id: product.id,
      approved: true,
      approval_note: "Verified product catalog identity",
    });
  });
  const deal = records.find((item) => item.object_type === "hubspot_deal");
  assert.throws(
    () =>
      ledger.completeCloseItem({
        period: "2026-08",
        item_key: "revenue_reviewed",
        evidence: "Revenue review",
      }),
    /CRM source versions/i,
  );
  const preview = ledger.previewCrmRecordApplication({ record_id: deal.id });
  assert.equal(preview.ready, true);
  assert.equal(preview.deal.amount_cents, 1_200_000);
  assert.equal(preview.line_items[0].product_id, product.id);
  const prepared = as("revenue.preparer", () =>
    ledger.prepareCrmRecordApplication({
      record_id: deal.id,
      approved: true,
      approval_note: "Prepared from signed order form",
      entity_id: ledger.entities()[0].id,
      contract_number: "HS-DEAL-1",
      signed_date: "2026-08-20",
      start_date: "2026-09-01",
      end_date: "2027-08-31",
      recognition_method: "straight_line",
    }),
  );
  assert.equal(prepared.proposal.status, "prepared");
  assert.throws(
    () =>
      as("revenue.preparer", () =>
        ledger.approveCrmProposal({
          proposal_id: prepared.proposal.id,
          approved: true,
          approval_note: "Self approval should fail",
        }),
      ),
    /preparer cannot approve/i,
  );
  const approved = as("revenue.controller", () =>
    ledger.approveCrmProposal({
      proposal_id: prepared.proposal.id,
      approved: true,
      approval_note: "Validated order form and SSP policy",
    }),
  );
  assert.equal(approved.status, "approved");
  const applied = as("revenue.controller", () =>
    ledger.applyCrmProposal({ proposal_id: prepared.proposal.id }),
  );
  assert.equal(applied.proposal.status, "applied");
  assert.equal(applied.contract.contract_number, "HS-DEAL-1");
  assert.equal(ledger.applyCrmProposal({ proposal_id: prepared.proposal.id }).duplicate, true);
  assert.equal(ledger.crmOverview(connection.id).metrics.applied, 1);
  assert.equal(
    ledger
      .completeCloseItem({
        period: "2026-08",
        item_key: "revenue_reviewed",
        evidence: "HubSpot proposal applied and contract schedule reviewed",
      })
      .find((item) => item.item_key === "revenue_reviewed").completed,
    1,
  );
  ledger.close();
});

test("HubSpot deal handoff fails closed on association, amount, and source-change ambiguity", () => {
  const ledger = createLedger(":memory:", { seed: true });
  const connection = ledger.configureIntegration({
    provider: "hubspot",
    environment: "sandbox",
    credential_secret_ref: "HUBSPOT_CREDENTIAL_REF",
  });
  ledger.setIntegrationStatus({ connection_id: connection.id, status: "active" });
  const run = ledger.startIntegrationSync({ connection_id: connection.id });
  ledger.ingestIntegrationPage({
    sync_run_id: run.id,
    has_more: false,
    added: [
      {
        object_type: "hubspot_deal",
        external_id: "broken",
        source_version: "v1",
        normalized: {
          amount: "10",
          is_closed_won: true,
          company_external_ids: [],
          line_item_external_ids: [],
        },
      },
    ],
  });
  const preview = ledger.previewCrmRecordApplication({
    record_id: ledger.integrationRecords(connection.id)[0].id,
  });
  assert.equal(preview.ready, false);
  assert.match(preview.issues.join(" "), /exactly one associated|at least one associated/i);
  ledger.close();
});
