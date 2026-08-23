import { randomUUID } from "node:crypto";
import { z } from "zod";
import { currentActor } from "./request-context.js";

export function migrateCrmHandoff(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS crm_customer_links (
      id TEXT PRIMARY KEY,
      connection_id TEXT NOT NULL REFERENCES integration_connections(id),
      company_external_id TEXT NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      source_record_id TEXT NOT NULL REFERENCES integration_records(id),
      approved_by TEXT NOT NULL,
      approval_note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(connection_id,company_external_id)
    );
    CREATE TABLE IF NOT EXISTS crm_product_links (
      id TEXT PRIMARY KEY,
      connection_id TEXT NOT NULL REFERENCES integration_connections(id),
      product_external_id TEXT NOT NULL,
      product_id INTEGER NOT NULL REFERENCES products(id),
      source_record_id TEXT NOT NULL REFERENCES integration_records(id),
      approved_by TEXT NOT NULL,
      approval_note TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(connection_id,product_external_id)
    );
    CREATE TABLE IF NOT EXISTS crm_contract_proposals (
      id TEXT PRIMARY KEY,
      integration_record_id TEXT NOT NULL UNIQUE REFERENCES integration_records(id),
      connection_id TEXT NOT NULL REFERENCES integration_connections(id),
      deal_external_id TEXT NOT NULL,
      source_version TEXT NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      entity_id INTEGER NOT NULL REFERENCES entities(id),
      contract_number TEXT NOT NULL,
      signed_date TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      currency TEXT NOT NULL,
      transaction_price_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'prepared' CHECK(status IN ('prepared','approved','applied','superseded','exception')),
      prepared_by TEXT NOT NULL,
      preparation_note TEXT NOT NULL,
      approved_by TEXT,
      approval_note TEXT,
      contract_id INTEGER REFERENCES contracts(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS crm_proposal_obligations (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL REFERENCES crm_contract_proposals(id),
      line_item_external_id TEXT NOT NULL,
      product_id INTEGER NOT NULL REFERENCES products(id),
      description TEXT NOT NULL,
      quantity TEXT NOT NULL,
      line_amount_cents INTEGER NOT NULL,
      ssp_cents INTEGER NOT NULL,
      recognition_method TEXT NOT NULL CHECK(recognition_method IN ('straight_line','point_in_time','usage','milestone')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      UNIQUE(proposal_id,line_item_external_id)
    );
    CREATE INDEX IF NOT EXISTS idx_crm_proposals_status ON crm_contract_proposals(status,start_date);
    CREATE INDEX IF NOT EXISTS idx_crm_proposals_deal ON crm_contract_proposals(connection_id,deal_external_id,created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_proposals_contract_number ON crm_contract_proposals(contract_number) WHERE status IN ('prepared','approved','applied');
    INSERT OR IGNORE INTO schema_migrations(version,name) VALUES(130,'HubSpot CRM controlled contract handoff');
  `);
}

export function createCrmHandoffRepository(db, saas) {
  function overview(connectionId = null) {
    const where = connectionId ? "WHERE p.connection_id=?" : "";
    const args = connectionId ? [connectionId] : [];
    const proposals = db
      .prepare(
        `SELECT p.*,cu.name customer_name,e.name entity_name,c.contract_number applied_contract_number
       FROM crm_contract_proposals p JOIN customers cu ON cu.id=p.customer_id
       JOIN entities e ON e.id=p.entity_id LEFT JOIN contracts c ON c.id=p.contract_id
       ${where} ORDER BY p.created_at DESC LIMIT 250`,
      )
      .all(...args)
      .map((proposal) => ({ ...proposal, obligations: obligations(proposal.id) }));
    return {
      customer_links: links("customer", connectionId),
      product_links: links("product", connectionId),
      proposals,
      metrics: {
        prepared: proposals.filter((item) => item.status === "prepared").length,
        approved: proposals.filter((item) => item.status === "approved").length,
        applied: proposals.filter((item) => item.status === "applied").length,
        exceptions: proposals.filter((item) => item.status === "exception").length,
      },
    };
  }

  function links(kind, connectionId) {
    const table = kind === "customer" ? "crm_customer_links" : "crm_product_links";
    const join = kind === "customer" ? "customers" : "products";
    const local = kind === "customer" ? "customer_id" : "product_id";
    const external = kind === "customer" ? "company_external_id" : "product_external_id";
    const where = connectionId ? "WHERE l.connection_id=?" : "";
    return db
      .prepare(
        `SELECT l.*,l.${external} external_id,x.name local_name FROM ${table} l JOIN ${join} x ON x.id=l.${local} ${where} ORDER BY l.created_at DESC`,
      )
      .all(...(connectionId ? [connectionId] : []));
  }

  function linkCustomer(input) {
    return linkSource("customer", input);
  }

  function linkProduct(input) {
    return linkSource("product", input);
  }

  function linkSource(kind, input) {
    if (input.approved !== true) throw bad("Explicit CRM identity-link approval is required");
    const note = z.string().trim().min(5).max(500).parse(input.approval_note);
    const record = integrationRecord(input.record_id);
    const expected = kind === "customer" ? "hubspot_company" : "hubspot_product";
    if (record.object_type !== expected) throw bad(`Link requires a ${expected} record`);
    assertHubSpot(record.connection_id);
    const localId = z
      .number()
      .int()
      .positive()
      .parse(Number(input[`${kind}_id`]));
    const localTable = kind === "customer" ? "customers" : "products";
    if (!db.prepare(`SELECT id FROM ${localTable} WHERE id=?`).get(localId))
      throw bad(`${kind === "customer" ? "Customer" : "Product"} not found`, 404);
    const table = kind === "customer" ? "crm_customer_links" : "crm_product_links";
    const external = kind === "customer" ? "company_external_id" : "product_external_id";
    const local = `${kind}_id`;
    const existing = db
      .prepare(`SELECT * FROM ${table} WHERE connection_id=? AND ${external}=?`)
      .get(record.connection_id, record.external_id);
    if (existing) {
      if (existing[local] !== localId)
        throw bad("CRM identity is already linked to a different Folio record", 409);
      return existing;
    }
    const id = randomUUID();
    db.prepare(
      `INSERT INTO ${table}(id,connection_id,${external},${local},source_record_id,approved_by,approval_note) VALUES(?,?,?,?,?,?,?)`,
    ).run(id, record.connection_id, record.external_id, localId, record.id, currentActor(), note);
    db.prepare(
      "UPDATE integration_records SET status='applied',applied_entity_type=?,applied_entity_id=?,error_message=NULL WHERE id=?",
    ).run(`crm_${kind}_link`, id, record.id);
    return db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id);
  }

  function previewDeal(input) {
    const record = integrationRecord(input.record_id);
    const connection = assertHubSpot(record.connection_id);
    const issues = [];
    if (record.object_type !== "hubspot_deal")
      issues.push("Contract handoff requires a HubSpot deal");
    if (record.operation === "removed" || record.normalized.archived)
      issues.push("Removed or archived deals cannot become contracts");
    if (record.normalized.is_closed_won !== true)
      issues.push("Only a closed-won HubSpot deal can become a contract proposal");
    if (record.status === "applied")
      issues.push("This source version already has a controlled handoff");
    const companyIds = unique(record.normalized.company_external_ids || []);
    if (companyIds.length !== 1)
      issues.push("Deal must have exactly one associated HubSpot company");
    const customerLink =
      companyIds.length === 1
        ? db
            .prepare(
              "SELECT l.*,c.name customer_name FROM crm_customer_links l JOIN customers c ON c.id=l.customer_id WHERE l.connection_id=? AND l.company_external_id=?",
            )
            .get(connection.id, companyIds[0])
        : null;
    if (companyIds.length === 1 && !customerLink)
      issues.push("Associated HubSpot company must be approved and linked to a Folio customer");
    const lineIds = unique(record.normalized.line_item_external_ids || []);
    if (!lineIds.length) issues.push("Deal must have at least one associated line item");
    const lineItems = lineIds
      .map((id) => latestRecord(connection.id, "hubspot_line_item", id))
      .filter(Boolean);
    if (lineItems.length !== lineIds.length)
      issues.push("Every associated HubSpot line item must be synchronized");
    const resolved = lineItems.map((line) => resolveLineItem(connection.id, line, issues));
    const amount = money(record.normalized.amount, "Deal amount", issues);
    const lineTotal = resolved.reduce((sum, item) => sum + item.line_amount_cents, 0);
    if (lineItems.length && amount !== lineTotal)
      issues.push("HubSpot deal amount must equal the sum of associated line items");
    const currency = String(record.normalized.currency || "USD").toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) issues.push("Deal currency must use a three-letter code");
    const prior = db
      .prepare(
        "SELECT id,status,contract_id FROM crm_contract_proposals WHERE connection_id=? AND deal_external_id=? ORDER BY created_at DESC LIMIT 1",
      )
      .get(connection.id, record.external_id);
    if (prior?.contract_id)
      issues.push(
        "A changed deal with an applied Folio contract requires the contract-modification workflow",
      );
    return {
      record: pickRecord(record),
      customer: customerLink
        ? {
            id: customerLink.customer_id,
            name: customerLink.customer_name,
            company_external_id: companyIds[0],
          }
        : null,
      deal: {
        name: record.normalized.name,
        amount_cents: amount,
        currency,
        close_date: dateOnly(record.normalized.close_date),
      },
      line_items: resolved,
      prior: prior || null,
      issues: unique(issues),
      ready: issues.length === 0,
    };
  }

  function resolveLineItem(connectionId, line, issues) {
    const productIds = unique(
      line.normalized.product_external_ids ||
        (line.normalized.product_external_id ? [line.normalized.product_external_id] : []),
    );
    if (productIds.length !== 1)
      issues.push(`Line item ${line.external_id} must have exactly one associated HubSpot product`);
    const link =
      productIds.length === 1
        ? db
            .prepare(
              "SELECT l.product_id,p.name,p.ssp_cents FROM crm_product_links l JOIN products p ON p.id=l.product_id WHERE l.connection_id=? AND l.product_external_id=?",
            )
            .get(connectionId, productIds[0])
        : null;
    if (productIds.length === 1 && !link)
      issues.push(
        `Line item ${line.external_id} product must be approved and linked to a Folio product`,
      );
    const quantity = positiveDecimal(
      line.normalized.quantity ?? "1",
      `Line item ${line.external_id} quantity`,
      issues,
    );
    const unit = money(
      line.normalized.unit_price ?? line.normalized.price,
      `Line item ${line.external_id} unit price`,
      issues,
    );
    const amount = money(line.normalized.amount, `Line item ${line.external_id} amount`, issues);
    if (Number.isFinite(quantity) && Math.round(unit * quantity) !== amount)
      issues.push(`Line item ${line.external_id} amount must equal unit price times quantity`);
    return {
      external_id: line.external_id,
      description: String(line.normalized.name || "HubSpot line item"),
      quantity: String(line.normalized.quantity ?? "1"),
      unit_price_cents: unit,
      line_amount_cents: amount,
      product_external_id: productIds[0] || null,
      product_id: link?.product_id || null,
      product_name: link?.name || null,
      ssp_cents: link?.ssp_cents || null,
    };
  }

  function prepareProposal(input) {
    if (input.approved !== true) throw bad("Explicit proposal preparation approval is required");
    const note = z.string().trim().min(5).max(500).parse(input.approval_note);
    const review = previewDeal(input);
    if (!review.ready) return { status: "error", preview: review };
    const existing = db
      .prepare("SELECT * FROM crm_contract_proposals WHERE integration_record_id=?")
      .get(input.record_id);
    if (existing) return { duplicate: true, proposal: proposal(existing.id) };
    const dates = {
      signed: requiredDate(input.signed_date, "Signed date"),
      start: requiredDate(input.start_date, "Start date"),
      end: requiredDate(input.end_date, "End date"),
    };
    if (dates.end < dates.start) throw bad("Contract end date cannot precede its start date");
    const entityId = z.number().int().positive().parse(Number(input.entity_id));
    if (!db.prepare("SELECT id FROM entities WHERE id=?").get(entityId))
      throw bad("Entity not found", 404);
    const contractNumber = z.string().trim().min(2).max(80).parse(input.contract_number);
    if (db.prepare("SELECT id FROM contracts WHERE contract_number=?").get(contractNumber))
      throw bad("Contract number already exists", 409);
    if (
      db
        .prepare(
          "SELECT id FROM crm_contract_proposals WHERE contract_number=? AND status IN ('prepared','approved','applied')",
        )
        .get(contractNumber)
    )
      throw bad("Contract number is already reserved by a CRM proposal", 409);
    const method = z
      .enum(["straight_line", "point_in_time", "usage", "milestone"])
      .parse(input.recognition_method || "straight_line");
    const id = randomUUID();
    db.exec("BEGIN IMMEDIATE");
    try {
      const prior = db
        .prepare(
          "SELECT id FROM crm_contract_proposals WHERE connection_id=? AND deal_external_id=? AND status IN ('prepared','approved','exception')",
        )
        .all(review.record.connection_id, review.record.external_id);
      for (const item of prior)
        db.prepare(
          "UPDATE crm_contract_proposals SET status='superseded',updated_at=CURRENT_TIMESTAMP WHERE id=?",
        ).run(item.id);
      db.prepare(
        `INSERT INTO crm_contract_proposals(id,integration_record_id,connection_id,deal_external_id,source_version,customer_id,entity_id,contract_number,signed_date,start_date,end_date,currency,transaction_price_cents,prepared_by,preparation_note)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).run(
        id,
        input.record_id,
        review.record.connection_id,
        review.record.external_id,
        review.record.source_version,
        review.customer.id,
        entityId,
        contractNumber,
        dates.signed,
        dates.start,
        dates.end,
        review.deal.currency,
        review.deal.amount_cents,
        currentActor(),
        note,
      );
      const insert = db.prepare(
        "INSERT INTO crm_proposal_obligations(id,proposal_id,line_item_external_id,product_id,description,quantity,line_amount_cents,ssp_cents,recognition_method,start_date,end_date) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      );
      for (const line of review.line_items)
        insert.run(
          randomUUID(),
          id,
          line.external_id,
          line.product_id,
          line.description,
          line.quantity,
          line.line_amount_cents,
          line.ssp_cents,
          method,
          dates.start,
          dates.end,
        );
      db.prepare(
        "UPDATE integration_records SET status='applied',applied_entity_type='crm_contract_proposal',applied_entity_id=?,error_message=NULL WHERE id=?",
      ).run(id, input.record_id);
      db.prepare(
        "UPDATE integration_dead_letters SET status='resolved',owner=?,resolution='CRM association and contract proposal controls completed',updated_at=CURRENT_TIMESTAMP WHERE integration_record_id=? AND status IN ('open','retrying')",
      ).run(currentActor(), input.record_id);
      db.exec("COMMIT");
      return { duplicate: false, status: "prepared", proposal: proposal(id) };
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function approveProposal(input) {
    if (input.approved !== true) throw bad("Explicit controller approval is required");
    const note = z.string().trim().min(5).max(500).parse(input.approval_note);
    const row = rawProposal(input.proposal_id);
    if (row.status === "approved" || row.status === "applied") return proposal(row.id);
    if (row.status !== "prepared") throw bad("Only a prepared proposal can be approved", 409);
    if (row.prepared_by === currentActor())
      throw bad("Proposal preparer cannot approve the same contract handoff", 409);
    db.prepare(
      "UPDATE crm_contract_proposals SET status='approved',approved_by=?,approval_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    ).run(currentActor(), note, row.id);
    return proposal(row.id);
  }

  function applyProposal(input) {
    const row = rawProposal(input.proposal_id);
    if (row.status === "applied")
      return {
        duplicate: true,
        proposal: proposal(row.id),
        contract: saas.getContract(row.contract_id),
      };
    if (row.status !== "approved")
      throw bad("Controller approval is required before contract creation", 409);
    db.exec("BEGIN IMMEDIATE");
    try {
      const created = saas.createContract({
        customer_id: row.customer_id,
        entity_id: row.entity_id,
        contract_number: row.contract_number,
        signed_date: row.signed_date,
        start_date: row.start_date,
        end_date: row.end_date,
        currency: row.currency,
        transaction_price_cents: row.transaction_price_cents,
        obligations: obligations(row.id).map((item) => ({
          product_id: item.product_id,
          description: item.description,
          ssp_cents: item.ssp_cents,
          recognition_method: item.recognition_method,
          start_date: item.start_date,
          end_date: item.end_date,
        })),
      });
      db.prepare(
        "UPDATE crm_contract_proposals SET status='applied',contract_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      ).run(created.id, row.id);
      db.exec("COMMIT");
      return { duplicate: false, proposal: proposal(row.id), contract: created };
    } catch (error) {
      if (db.isTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  function proposal(id) {
    const row = rawProposal(id);
    return { ...row, obligations: obligations(id) };
  }
  function rawProposal(id) {
    const row = db.prepare("SELECT * FROM crm_contract_proposals WHERE id=?").get(id);
    if (!row) throw bad("CRM contract proposal not found", 404);
    return row;
  }
  function obligations(id) {
    return db
      .prepare(
        "SELECT o.*,p.name product_name,p.sku FROM crm_proposal_obligations o JOIN products p ON p.id=o.product_id WHERE o.proposal_id=? ORDER BY o.id",
      )
      .all(id);
  }
  function integrationRecord(id) {
    const row = db.prepare("SELECT * FROM integration_records WHERE id=?").get(id);
    if (!row) throw bad("Integration record not found", 404);
    return { ...row, normalized: JSON.parse(row.normalized_json) };
  }
  function latestRecord(connectionId, type, externalId) {
    const row = db
      .prepare(
        "SELECT * FROM integration_records WHERE connection_id=? AND object_type=? AND external_id=? AND operation!='removed' ORDER BY effective_at DESC,last_seen_at DESC LIMIT 1",
      )
      .get(connectionId, type, externalId);
    return row ? { ...row, normalized: JSON.parse(row.normalized_json) } : null;
  }
  function assertHubSpot(connectionId) {
    const row = db.prepare("SELECT * FROM integration_connections WHERE id=?").get(connectionId);
    if (!row || row.provider !== "hubspot")
      throw bad("Native CRM handoff requires a HubSpot connection");
    return row;
  }
  return {
    crmOverview: overview,
    linkCrmCustomer: linkCustomer,
    linkCrmProduct: linkProduct,
    previewCrmDeal: previewDeal,
    prepareCrmProposal: prepareProposal,
    approveCrmProposal: approveProposal,
    applyCrmProposal: applyProposal,
  };
}

function money(value, label, issues) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    issues.push(`${label} must be a positive monetary amount`);
    return 0;
  }
  return Math.round(number * 100);
}
function positiveDecimal(value, label, issues) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) issues.push(`${label} must be positive`);
  return number;
}
function requiredDate(value, label) {
  const result = dateOnly(value);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(result) ||
    new Date(`${result}T00:00:00Z`).toISOString().slice(0, 10) !== result
  )
    throw bad(`${label} must use YYYY-MM-DD`);
  return result;
}
function dateOnly(value) {
  return value ? String(value).slice(0, 10) : "";
}
function unique(values) {
  return Array.isArray(values) ? [...new Set(values.map(String).filter(Boolean))] : [];
}
function pickRecord(record) {
  return {
    id: record.id,
    connection_id: record.connection_id,
    object_type: record.object_type,
    external_id: record.external_id,
    source_version: record.source_version,
    operation: record.operation,
    status: record.status,
  };
}
function bad(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}
