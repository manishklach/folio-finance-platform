import { randomUUID } from "node:crypto";
import { z } from "zod";
import { currentActor } from "./request-context.js";

const supported = new Set([
  "stripe_customer",
  "stripe_subscription",
  "stripe_invoice",
  "stripe_credit_note",
  "stripe_charge",
  "stripe_refund",
  "stripe_dispute",
  "stripe_balance_transaction",
  "stripe_payout",
]);

const targetByType = {
  stripe_customer: "customer",
  stripe_subscription: "contract",
  stripe_invoice: "invoice",
  stripe_credit_note: "credit_memo",
  stripe_charge: "customer_payment",
  stripe_refund: "customer_refund",
  stripe_dispute: "invoice_dispute",
  stripe_payout: "bank_feed_transaction",
};

export function migrateStripeReconciliation(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stripe_reconciliation_records (
      id TEXT PRIMARY KEY,
      integration_record_id TEXT NOT NULL UNIQUE REFERENCES integration_records(id),
      connection_id TEXT NOT NULL REFERENCES integration_connections(id),
      object_type TEXT NOT NULL,
      external_id TEXT NOT NULL,
      source_version TEXT NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('added','modified','removed')),
      customer_external_id TEXT,
      invoice_external_id TEXT,
      charge_external_id TEXT,
      payout_external_id TEXT,
      amount_cents INTEGER,
      fee_cents INTEGER,
      net_cents INTEGER,
      currency TEXT,
      provider_status TEXT,
      occurred_on TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending','matched','component','removed','superseded','exception')),
      matched_entity_type TEXT,
      matched_entity_id TEXT,
      supersedes_id TEXT REFERENCES stripe_reconciliation_records(id),
      approved_by TEXT NOT NULL,
      approval_note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS stripe_reconciliation_decisions (
      id TEXT PRIMARY KEY,
      reconciliation_record_id TEXT NOT NULL REFERENCES stripe_reconciliation_records(id),
      entity_type TEXT,
      entity_id TEXT,
      decided_by TEXT NOT NULL,
      rationale TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_stripe_reconciliation_external ON stripe_reconciliation_records(connection_id,object_type,external_id,created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_stripe_reconciliation_status ON stripe_reconciliation_records(status,occurred_on);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_current_match ON stripe_reconciliation_records(connection_id,object_type,external_id) WHERE status IN ('matched','component');
  `);
}

export function createStripeReconciliationRepository(db) {
  function overview(connectionId = null) {
    const where = connectionId ? "WHERE r.connection_id=?" : "";
    const args = connectionId ? [connectionId] : [];
    const records = db
      .prepare(
        `SELECT r.*,c.display_name connection_name FROM stripe_reconciliation_records r JOIN integration_connections c ON c.id=r.connection_id ${where} ORDER BY r.created_at DESC,r.id DESC LIMIT 500`,
      )
      .all(...args);
    return {
      records,
      metrics: {
        matched: records.filter((row) => row.status === "matched").length,
        components: records.filter((row) => row.status === "component").length,
        exceptions: records.filter((row) => row.status === "exception").length,
        pending: records.filter((row) => row.status === "pending").length,
      },
    };
  }

  function preview(record, connection) {
    if (connection.provider !== "stripe" || !supported.has(record.object_type))
      throw bad("Record is not supported by the native Stripe reconciliation workflow");
    const normalized = record.normalized;
    const issues = [];
    if (record.status === "applied") issues.push("Record is already applied");
    if (record.operation === "removed") {
      const previous = currentVersion(record.connection_id, record.object_type, record.external_id);
      if (!previous) issues.push("Removed Stripe object has no applied reconciliation version");
      return basePreview(record, normalized, [], issues, issues.length === 0, "removed");
    }
    const currency = normalized.currency ? String(normalized.currency).toUpperCase() : null;
    if (record.object_type !== "stripe_customer" && !currency)
      issues.push("Stripe record is missing currency");
    if (normalized.amount_cents != null && !Number.isSafeInteger(Number(normalized.amount_cents)))
      issues.push("Stripe amount must be whole cents");
    if (record.object_type === "stripe_charge" && normalized.paid === false)
      issues.push("Only a paid Stripe charge can reconcile to a received payment");
    if (record.object_type === "stripe_payout" && normalized.status !== "paid")
      issues.push("Only a paid Stripe payout can reconcile to bank activity");

    const customerDependent = new Set([
      "stripe_subscription",
      "stripe_invoice",
      "stripe_credit_note",
      "stripe_charge",
      "stripe_refund",
      "stripe_dispute",
    ]);
    if (
      customerDependent.has(record.object_type) &&
      normalized.customer_external_id &&
      !linkedCustomer(record.connection_id, normalized.customer_external_id)
    )
      issues.push("Link the Stripe customer to a Folio customer before reconciling this record");

    if (record.object_type === "stripe_balance_transaction") {
      if (!normalized.payout_external_id)
        issues.push("Balance transaction is not assigned to a payout");
      if (
        ![normalized.amount_cents, normalized.fee_cents, normalized.net_cents].every(
          Number.isSafeInteger,
        )
      )
        issues.push("Balance transaction amount, fee and net must be whole cents");
      if (
        Number.isSafeInteger(normalized.amount_cents) &&
        Number.isSafeInteger(normalized.fee_cents) &&
        Number.isSafeInteger(normalized.net_cents) &&
        normalized.amount_cents - normalized.fee_cents !== normalized.net_cents
      )
        issues.push("Balance transaction does not satisfy gross minus fee equals net");
      return basePreview(record, normalized, [], issues, issues.length === 0, "component");
    }

    let candidates = candidatesFor(record, currency);
    const prior = currentVersion(record.connection_id, record.object_type, record.external_id);
    if (prior?.matched_entity_id)
      candidates = candidates.filter(
        (candidate) => String(candidate.id) === String(prior.matched_entity_id),
      );
    if (!candidates.length)
      issues.push(`No eligible Folio ${targetByType[record.object_type]} candidate found`);
    if (record.object_type === "stripe_payout") {
      const component = payoutComponents(connection.id, record.external_id);
      if (!component.count)
        issues.push("Apply this payout's balance transactions before reconciling it");
      if (component.net_cents !== Number(normalized.amount_cents || 0))
        issues.push("Applied payout components do not equal the Stripe payout amount");
    }
    return basePreview(
      record,
      normalized,
      candidates,
      issues,
      issues.length === 0,
      targetByType[record.object_type],
    );
  }

  function apply(record, connection, input) {
    if (input.approved !== true) throw bad("Explicit Stripe reconciliation approval is required");
    const note = z.string().trim().min(5).max(500).parse(input.approval_note);
    const existing = db
      .prepare("SELECT * FROM stripe_reconciliation_records WHERE integration_record_id=?")
      .get(record.id);
    if (existing) return { duplicate: true, status: "applied", reconciliation: existing };
    const result = preview(record, connection);
    if (!result.ready) return { duplicate: false, status: "error", preview: result };

    let candidate = null;
    if (result.target_type && !["component", "removed"].includes(result.target_type)) {
      const targetId = String(input.target_entity_id || "");
      candidate = result.candidates.find((item) => String(item.id) === targetId);
      if (!candidate) throw bad("Select an eligible reconciliation candidate", 409);
    }
    const id = randomUUID();
    const previous = currentVersion(connection.id, record.object_type, record.external_id);
    const source = record.operation === "removed" && previous ? previous : record.normalized;
    const status =
      record.operation === "removed"
        ? "removed"
        : result.target_type === "component"
          ? "component"
          : "matched";
    const owns = !db.isTransaction;
    if (owns) db.exec("BEGIN IMMEDIATE");
    try {
      if (previous)
        db.prepare(
          "UPDATE stripe_reconciliation_records SET status='superseded',updated_at=CURRENT_TIMESTAMP WHERE id=?",
        ).run(previous.id);
      if (previous && record.object_type === "stripe_balance_transaction")
        db.prepare(
          `UPDATE stripe_reconciliation_records SET status='exception',updated_at=CURRENT_TIMESTAMP
           WHERE connection_id=? AND object_type='stripe_payout' AND external_id=? AND status='matched'`,
        ).run(connection.id, previous.payout_external_id);
      db.prepare(
        `INSERT INTO stripe_reconciliation_records(id,integration_record_id,connection_id,object_type,external_id,source_version,operation,customer_external_id,invoice_external_id,charge_external_id,payout_external_id,amount_cents,fee_cents,net_cents,currency,provider_status,occurred_on,status,matched_entity_type,matched_entity_id,supersedes_id,approved_by,approval_note)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        id,
        record.id,
        connection.id,
        record.object_type,
        record.external_id,
        record.source_version,
        record.operation,
        source.customer_external_id || null,
        source.invoice_external_id || null,
        source.charge_external_id || null,
        source.payout_external_id || null,
        nullableInteger(source.amount_cents),
        nullableInteger(source.fee_cents),
        nullableInteger(source.net_cents),
        source.currency ? String(source.currency).toUpperCase() : null,
        source.provider_status || source.status || null,
        dateOnly(record.effective_at),
        status,
        candidate ? result.target_type : null,
        candidate ? String(candidate.id) : null,
        previous?.id || null,
        currentActor(),
        note,
      );
      db.prepare(
        "INSERT INTO stripe_reconciliation_decisions(id,reconciliation_record_id,entity_type,entity_id,decided_by,rationale) VALUES(?,?,?,?,?,?)",
      ).run(
        randomUUID(),
        id,
        candidate ? result.target_type : null,
        candidate ? String(candidate.id) : null,
        currentActor(),
        note,
      );
      if (owns) db.exec("COMMIT");
      return {
        duplicate: false,
        status: "applied",
        reconciliation: db
          .prepare("SELECT * FROM stripe_reconciliation_records WHERE id=?")
          .get(id),
      };
    } catch (error) {
      if (owns && db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function candidatesFor(record, currency) {
    const n = record.normalized;
    const directCustomerId = linkedCustomer(record.connection_id, n.customer_external_id);
    const customerId =
      directCustomerId ||
      linkedCustomerFromCharge(record.connection_id, n.charge_external_id) ||
      linkedCustomerFromInvoice(record.connection_id, n.invoice_external_id);
    if (record.object_type === "stripe_customer") {
      const existing = linkedCustomer(record.connection_id, record.external_id);
      if (existing)
        return db.prepare("SELECT id,name,segment,region FROM customers WHERE id=?").all(existing);
      return db
        .prepare("SELECT id,name,segment,region FROM customers ORDER BY name LIMIT 200")
        .all();
    }
    if (n.customer_external_id && !directCustomerId) return [];
    if (record.object_type === "stripe_subscription")
      return db
        .prepare(
          "SELECT id,contract_number label,customer_id,transaction_price_cents amount_cents,currency,status FROM contracts WHERE (? IS NULL OR customer_id=?) ORDER BY signed_date DESC LIMIT 200",
        )
        .all(customerId, customerId);
    if (record.object_type === "stripe_invoice")
      return db
        .prepare(
          `SELECT i.id,i.invoice_number label,i.amount_cents,c.currency,c.customer_id,i.status FROM invoices i JOIN contracts c ON c.id=i.contract_id
           WHERE i.amount_cents=? AND UPPER(c.currency)=? AND (? IS NULL OR c.customer_id=?) ORDER BY i.invoice_date DESC LIMIT 100`,
        )
        .all(Number(n.amount_due_cents ?? n.amount_cents), currency, customerId, customerId);
    if (record.object_type === "stripe_credit_note")
      return db
        .prepare(
          `SELECT cm.id,cm.credit_number label,cm.amount_cents,c.currency,c.customer_id,cm.status FROM credit_memos cm JOIN invoices i ON i.id=cm.invoice_id JOIN contracts c ON c.id=i.contract_id
           WHERE cm.amount_cents=? AND UPPER(c.currency)=? AND (? IS NULL OR c.customer_id=?) ORDER BY cm.credit_date DESC LIMIT 100`,
        )
        .all(Number(n.amount_cents), currency, customerId, customerId);
    if (record.object_type === "stripe_charge")
      return db
        .prepare(
          `SELECT p.id,p.payment_number label,p.amount_cents,c.currency,p.customer_id,p.status FROM customer_payments p JOIN entities e ON e.id=p.entity_id LEFT JOIN contracts c ON c.entity_id=e.id AND c.customer_id=p.customer_id
           WHERE p.amount_cents=? AND UPPER(COALESCE(c.currency,e.currency))=? AND (? IS NULL OR p.customer_id=?) GROUP BY p.id ORDER BY p.payment_date DESC LIMIT 100`,
        )
        .all(Number(n.amount_cents), currency, customerId, customerId);
    if (record.object_type === "stripe_refund")
      return db
        .prepare(
          `SELECT r.id,r.refund_number label,r.amount_cents,c.currency,p.customer_id,r.status FROM customer_refunds r JOIN customer_payments p ON p.id=r.payment_id JOIN entities e ON e.id=p.entity_id LEFT JOIN contracts c ON c.entity_id=e.id AND c.customer_id=p.customer_id
           WHERE r.amount_cents=? AND UPPER(COALESCE(c.currency,e.currency))=? AND (? IS NULL OR p.customer_id=?) AND (? IS NULL OR p.id=?) GROUP BY r.id ORDER BY r.refund_date DESC LIMIT 100`,
        )
        .all(
          Number(n.amount_cents),
          currency,
          customerId,
          customerId,
          linkedPaymentFromCharge(record.connection_id, n.charge_external_id),
          linkedPaymentFromCharge(record.connection_id, n.charge_external_id),
        );
    if (record.object_type === "stripe_dispute")
      return db
        .prepare(
          `SELECT d.id,('Dispute '||d.id) label,d.amount_cents,c.currency,c.customer_id,d.status FROM invoice_disputes d JOIN invoices i ON i.id=d.invoice_id JOIN contracts c ON c.id=i.contract_id
           WHERE d.amount_cents=? AND UPPER(c.currency)=? AND (? IS NULL OR c.customer_id=?) ORDER BY d.opened_date DESC LIMIT 100`,
        )
        .all(Number(n.amount_cents), currency, customerId, customerId);
    if (record.object_type === "stripe_payout")
      return db
        .prepare(
          `SELECT t.id,t.description label,t.amount_cents,t.currency,t.transaction_date,t.status FROM bank_feed_transactions t
           WHERE t.amount_cents=? AND UPPER(t.currency)=? AND t.status='matched'
           AND ABS(julianday(t.transaction_date)-julianday(?))<=7 ORDER BY t.transaction_date DESC LIMIT 100`,
        )
        .all(Number(n.amount_cents), currency, n.arrival_on || dateOnly(record.effective_at));
    return [];
  }

  function linkedCustomer(connectionId, externalId) {
    if (!externalId) return null;
    return (
      db
        .prepare(
          "SELECT matched_entity_id FROM stripe_reconciliation_records WHERE connection_id=? AND object_type='stripe_customer' AND external_id=? AND status='matched' ORDER BY created_at DESC LIMIT 1",
        )
        .get(connectionId, externalId)?.matched_entity_id || null
    );
  }

  function currentVersion(connectionId, objectType, externalId) {
    return db
      .prepare(
        `SELECT * FROM stripe_reconciliation_records
         WHERE connection_id=? AND object_type=? AND external_id=? AND status IN ('matched','component','exception')
         ORDER BY created_at DESC,id DESC LIMIT 1`,
      )
      .get(connectionId, objectType, externalId);
  }

  function linkedPaymentFromCharge(connectionId, externalId) {
    if (!externalId) return null;
    return (
      db
        .prepare(
          "SELECT matched_entity_id FROM stripe_reconciliation_records WHERE connection_id=? AND object_type='stripe_charge' AND external_id=? AND status='matched' ORDER BY created_at DESC LIMIT 1",
        )
        .get(connectionId, externalId)?.matched_entity_id || null
    );
  }

  function linkedCustomerFromCharge(connectionId, externalId) {
    const paymentId = linkedPaymentFromCharge(connectionId, externalId);
    return paymentId
      ? db.prepare("SELECT customer_id FROM customer_payments WHERE id=?").get(paymentId)
          ?.customer_id || null
      : null;
  }

  function linkedCustomerFromInvoice(connectionId, externalId) {
    if (!externalId) return null;
    return (
      db
        .prepare(
          `SELECT c.customer_id FROM stripe_reconciliation_records r JOIN invoices i ON i.id=CAST(r.matched_entity_id AS INTEGER) JOIN contracts c ON c.id=i.contract_id
           WHERE r.connection_id=? AND r.object_type='stripe_invoice' AND r.external_id=? AND r.status='matched' ORDER BY r.created_at DESC LIMIT 1`,
        )
        .get(connectionId, externalId)?.customer_id || null
    );
  }

  function payoutComponents(connectionId, payoutExternalId) {
    return db
      .prepare(
        `SELECT COUNT(*) count,COALESCE(SUM(net_cents),0) net_cents,COALESCE(SUM(fee_cents),0) fee_cents
         FROM stripe_reconciliation_records WHERE connection_id=? AND object_type='stripe_balance_transaction' AND payout_external_id=? AND status='component'`,
      )
      .get(connectionId, payoutExternalId);
  }

  return {
    stripeReconciliationOverview: overview,
    previewStripeRecord: preview,
    applyStripeRecord: apply,
  };
}

function basePreview(record, normalized, candidates, issues, ready, targetType) {
  return {
    record: {
      id: record.id,
      object_type: record.object_type,
      external_id: record.external_id,
      operation: record.operation,
      source_version: record.source_version,
      status: record.status,
    },
    normalized,
    target_type: targetType,
    candidates,
    issues: [...new Set(issues)],
    ready: ready && record.status !== "applied",
  };
}

function nullableInteger(value) {
  return value === undefined || value === null ? null : Number(value);
}

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : null;
}

function bad(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
