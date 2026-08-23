import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";

let csrfToken = "";
const today = new Date().toISOString().slice(0, 10);
const money = (value = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100);
const date = (value) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString() : "—");
const label = (value = "") => String(value).replaceAll("_", " ");

function blankImportDraft(templateKey = "chart_of_accounts") {
  return {
    template_key: templateKey,
    filename: `${templateKey}.csv`,
    csv: "",
    mapping: {},
    mapping_profile_id: "",
    mapping_profile_name: "",
    restaged_from_batch_id: "",
    correction_source_filename: "",
    correction_row_count: 0,
    correction_scope: "",
    cash_account_id: "",
    start_date: "",
    end_date: "",
    opening: "",
    closing: "",
  };
}

function csvHeaders(csv) {
  const headerLine = String(csv || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/, 1)[0];
  if (!headerLine.trim()) return [];
  const headers = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < headerLine.length; index += 1) {
    const character = headerLine[index];
    if (character === '"') {
      if (quoted && headerLine[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      headers.push(value.trim());
      value = "";
    } else value += character;
  }
  headers.push(value.trim());
  return headers.filter(Boolean);
}

function suggestedMapping(template, headers, current = {}) {
  const available = new Map(
    headers.map((header) => [header.toLowerCase().replaceAll(" ", "_"), header]),
  );
  return Object.fromEntries(
    template.fields.map((field) => [
      field.key,
      headers.includes(current[field.key])
        ? current[field.key]
        : available.get(field.key.toLowerCase()) || "",
    ]),
  );
}

function sameHeaders(left, right) {
  return left.length === right.length && left.every((header, index) => header === right[index]);
}

async function api(path, { method = "GET", body, idempotent = true, headers: extraHeaders } = {}) {
  const headers = { Accept: "application/json" };
  Object.assign(headers, extraHeaders);
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET" && csrfToken) headers["X-CSRF-Token"] = csrfToken;
  if (method !== "GET" && idempotent) headers["Idempotency-Key"] = crypto.randomUUID();
  const response = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "The request could not be completed.");
    error.status = response.status;
    error.requestId = payload.request_id;
    throw error;
  }
  if (payload.csrf_token) csrfToken = payload.csrf_token;
  return payload;
}

async function waitForJob(id, onUpdate, timeoutMilliseconds = 120_000) {
  const deadline = Date.now() + timeoutMilliseconds;
  while (Date.now() < deadline) {
    const job = await api(`/api/jobs/${id}`);
    onUpdate?.(job);
    if (job.status === "completed") return job;
    if (["dead_letter", "cancelled"].includes(job.status))
      throw new Error(job.last_error || `Background job ${label(job.status)}.`);
    await new Promise((resolve) => window.setTimeout(resolve, 750));
  }
  throw new Error("The job is still running. Continue tracking it in Reports & jobs.");
}

function useLoad(loader, dependencies = []) {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const refresh = async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      setState({ loading: false, data: await loader(), error: "" });
    } catch (error) {
      setState({ loading: false, data: null, error: error.message });
    }
  };
  useEffect(() => void refresh(), dependencies);
  return { ...state, refresh };
}

const navigation = [
  ["overview", "Overview", "◫"],
  ["journals", "Journal", "⇄"],
  ["revenue", "Revenue", "◎"],
  ["receivables", "Receivables", "▤"],
  ["bank-close", "Bank & close", "✓"],
  ["integrations", "Integrations", "⇆"],
  ["imports", "Imports", "⇩"],
  ["investments", "Investments", "↗"],
  ["fixed-assets", "Fixed assets", "◇"],
  ["reports", "Reports & jobs", "⌁"],
  ["administration", "Administration", "⚙"],
];

function App() {
  const [auth, setAuth] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    api("/api/auth/me")
      .then(setAuth)
      .catch(async (error) => {
        if (error.status !== 401) throw error;
        setNeedsSetup((await api("/setup/status")).needs_setup);
      })
      .finally(() => setChecking(false));
  }, []);
  if (checking)
    return <CenteredStatus title="Opening Folio" detail="Checking your secure session…" />;
  if (!auth)
    return <AuthScreen needsSetup={needsSetup} onAuthenticated={(value) => setAuth(value)} />;
  return <Workspace auth={auth} setAuth={setAuth} />;
}

function AuthScreen({ needsSetup, onAuthenticated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      onAuthenticated(
        await api(needsSetup ? "/api/auth/register" : "/api/auth/login", {
          method: "POST",
          idempotent: false,
          headers: needsSetup
            ? { "X-Folio-Bootstrap-Token": form.get("bootstrap_token") }
            : undefined,
          body: {
            email: form.get("email"),
            password: form.get("password"),
            ...(needsSetup
              ? { organization_name: form.get("organization_name"), name: form.get("name") }
              : {}),
          },
        }),
      );
    } catch (caught) {
      setError(caught.message);
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-story" aria-label="Folio product summary">
        <Brand />
        <p className="eyebrow">CONTROLLED ACCOUNTING OPERATIONS</p>
        <h1>Close with confidence, from contract to financial statement.</h1>
        <p>One tenant-isolated workspace for accounting workflows, evidence and reconciliations.</p>
        <ul>
          <li>Every posted entry balances and becomes immutable.</li>
          <li>Every action retains its authenticated actor.</li>
          <li>AI can draft; only authorized people can post.</li>
        </ul>
      </section>
      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="eyebrow">{needsSetup ? "NEW WORKSPACE" : "WELCOME BACK"}</p>
        <h2 id="auth-title">{needsSetup ? "Create your workspace" : "Sign in to Folio"}</h2>
        <p>
          {needsSetup ? "Set up the first administrator." : "Use your organization credentials."}
        </p>
        <form onSubmit={submit} className="form-stack">
          {needsSetup && (
            <>
              <Field label="Organization" name="organization_name" autoComplete="organization" />
              <Field label="Your name" name="name" autoComplete="name" />
              <Field
                label="Deployment bootstrap token"
                name="bootstrap_token"
                type="password"
                autoComplete="off"
                required={false}
                hint="Provided by the person who deployed Folio. Local development may leave this blank."
              />
            </>
          )}
          <Field label="Email" name="email" type="email" autoComplete="email" />
          <Field
            label="Password"
            name="password"
            type="password"
            minLength={12}
            autoComplete={needsSetup ? "new-password" : "current-password"}
            hint={needsSetup ? "At least 12 characters with upper/lowercase and a number." : ""}
          />
          {error && <Alert>{error}</Alert>}
          <button className="primary block" disabled={busy}>
            {busy ? "Please wait…" : needsSetup ? "Create secure workspace" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Workspace({ auth, setAuth }) {
  const [active, setActive] = useState("overview");
  const [notice, setNotice] = useState(null);
  const activeItem = navigation.find(([key]) => key === active);
  const can = (permission) => auth.permissions.includes(permission);
  async function logout() {
    await api("/api/auth/logout", { method: "POST", idempotent: false });
    csrfToken = "";
    setAuth(null);
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-card">
          <span className="workspace-avatar">
            {auth.organization.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{auth.organization.name}</strong>
            <small>USD · Accrual</small>
          </div>
        </div>
        <nav aria-label="Accounting modules">
          {navigation.map(([key, name, icon]) => (
            <button
              key={key}
              aria-current={active === key ? "page" : undefined}
              onClick={() => setActive(key)}
            >
              <span aria-hidden="true">{icon}</span>
              {name}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="avatar">{auth.user.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{auth.user.name}</strong>
            <small>{label(auth.role)}</small>
          </div>
          <button className="text-button" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="workspace-main">
        <header className="page-header">
          <div>
            <p className="eyebrow">FINANCE WORKSPACE</p>
            <h1>{activeItem[1]}</h1>
          </div>
          <span className="role-chip">{label(auth.role)}</span>
        </header>
        {notice && <Toast notice={notice} onClose={() => setNotice(null)} />}
        <Module active={active} auth={auth} can={can} notify={setNotice} setAuth={setAuth} />
      </main>
    </div>
  );
}

function Module({ active, ...props }) {
  const modules = {
    overview: Overview,
    journals: Journals,
    revenue: Revenue,
    receivables: Receivables,
    "bank-close": BankClose,
    integrations: Integrations,
    imports: Imports,
    investments: Investments,
    "fixed-assets": FixedAssets,
    reports: Reports,
    administration: Administration,
  };
  const Component = modules[active];
  return <Component {...props} />;
}

function Integrations({ can, notify }) {
  const resource = useLoad(() => api("/api/integrations/overview"), []);
  const [showForm, setShowForm] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [showMapping, setShowMapping] = useState(false);
  const [applicationPreview, setApplicationPreview] = useState(null);
  const [applicationBusy, setApplicationBusy] = useState(false);
  useEffect(() => {
    if (!selectedConnectionId && resource.data?.connections?.length)
      setSelectedConnectionId(resource.data.connections[0].id);
  }, [resource.data, selectedConnectionId]);
  const workbench = useLoad(
    () =>
      selectedConnectionId
        ? Promise.all([
            api(`/api/integrations/connections/${selectedConnectionId}/records`),
            api(`/api/integrations/mappings?connection_id=${selectedConnectionId}`),
          ])
        : Promise.resolve([[], []]),
    [selectedConnectionId],
  );
  if (resource.loading) return <Loading />;
  if (resource.error) return <LoadError error={resource.error} retry={resource.refresh} />;
  const value = resource.data;
  async function configure(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/integrations/connections", {
        method: "POST",
        body: {
          provider: form.get("provider"),
          display_name: form.get("display_name"),
          environment: form.get("environment"),
          external_account_id: form.get("external_account_id") || null,
          credential_secret_ref: form.get("credential_secret_ref"),
          webhook_secret_ref: form.get("webhook_secret_ref") || null,
          scopes: [],
          settings: {},
        },
      });
      setShowForm(false);
      await resource.refresh();
      notify({
        kind: "success",
        message: "Connector configured without exposing its credentials.",
      });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  async function changeStatus(connection, status) {
    try {
      await api("/api/integrations/connections/status", {
        method: "POST",
        body: { connection_id: connection.id, status },
      });
      await resource.refresh();
      notify({ kind: "success", message: `${connection.display_name} is now ${status}.` });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  async function resolveException(item) {
    try {
      await api("/api/integrations/exceptions/status", {
        method: "POST",
        body: {
          id: item.id,
          status: "resolved",
          resolution: "Reviewed and resolved from the integration operations queue",
        },
      });
      await resource.refresh();
      notify({ kind: "success", message: "Integration exception resolved." });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  async function queueSync(connection) {
    try {
      await api("/api/jobs/provider-syncs", {
        method: "POST",
        body: { connection_id: connection.id, trigger: "manual" },
      });
      notify({
        kind: "success",
        message: `${connection.display_name} synchronization was queued. Track it in Reports & jobs.`,
      });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  async function saveMapping(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fallback = form.get("default");
    try {
      await api("/api/integrations/mappings", {
        method: "POST",
        body: {
          connection_id: selectedConnectionId,
          object_type: form.get("object_type"),
          source_field: form.get("source_field"),
          target_field: form.get("target_field"),
          transform: form.get("transform"),
          required: form.get("required") === "on",
          ...(fallback === "" ? {} : { default: fallback }),
        },
      });
      setShowMapping(false);
      await workbench.refresh();
      notify({ kind: "success", message: "Versioned mapping activated for future previews." });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  async function previewApplication(record) {
    try {
      const preview = await api(`/api/integrations/records/${record.id}/preview`, {
        method: "POST",
        body: {},
      });
      setApplicationPreview(preview);
      if (!preview.ready) await Promise.all([resource.refresh(), workbench.refresh()]);
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  async function approveApplication(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setApplicationBusy(true);
    try {
      const result = await api(`/api/integrations/records/${applicationPreview.record.id}/apply`, {
        method: "POST",
        body: {
          approved: true,
          approval_note: form.get("approval_note"),
          mapping_fingerprint: applicationPreview.mapping_fingerprint,
        },
      });
      setApplicationPreview(null);
      await Promise.all([resource.refresh(), workbench.refresh()]);
      notify(
        result.status === "applied"
          ? {
              kind: "success",
              message: `Draft journal ${result.journal.id} created for independent posting review.`,
            }
          : {
              kind: "error",
              message: "Record could not be applied and was placed in the exception queue.",
            },
      );
    } catch (error) {
      notify({ kind: "error", message: error.message });
    } finally {
      setApplicationBusy(false);
    }
  }

  const [records, mappings] = workbench.data || [[], []];
  const selectedConnection = value.connections.find((item) => item.id === selectedConnectionId);

  return (
    <div className="module-flow">
      <ModuleBar
        title="Connected systems"
        detail="Observable, tenant-scoped data connections without browser-visible secrets"
        action={
          can("admin") && (
            <button className="primary" onClick={() => setShowForm(true)}>
              Configure connector
            </button>
          )
        }
      />
      <section className="kpi-grid">
        <Kpi label="Connections" value={value.connections.length} detail="Configured providers" />
        <Kpi
          label="Active"
          value={value.metrics.active_connections}
          detail="Eligible to synchronize"
        />
        <Kpi
          label="Provider errors"
          value={value.metrics.error_connections}
          detail="Connections needing attention"
          warning={value.metrics.error_connections > 0}
        />
        <Kpi
          label="Exceptions"
          value={value.metrics.open_exceptions}
          detail="Open connector failures"
          warning={value.metrics.open_exceptions > 0}
        />
      </section>
      <div className="two-column">
        <Panel
          title="Connections"
          subtitle="Status, environment and latest successful synchronization"
        >
          <Table
            columns={["Provider", "Connection", "Environment", "Last sync", "Status", "Action"]}
            rows={value.connections.map((item) => [
              label(item.provider),
              item.display_name,
              label(item.environment),
              item.last_synced_at ? new Date(item.last_synced_at).toLocaleString() : "Never",
              <Status value={item.status} />,
              <div className="button-row">
                {item.status === "active" && can("operate") && (
                  <button className="small-button" onClick={() => queueSync(item)}>
                    Sync now
                  </button>
                )}
                {can("admin") &&
                  (item.status === "configured" ||
                  item.status === "paused" ||
                  item.status === "error" ? (
                    <button className="small-button" onClick={() => changeStatus(item, "active")}>
                      Activate
                    </button>
                  ) : item.status === "active" ? (
                    <button className="small-button" onClick={() => changeStatus(item, "paused")}>
                      Pause
                    </button>
                  ) : null)}
              </div>,
            ])}
          />
        </Panel>
        <Panel title="Initial connector catalog" subtitle="Approved production-integration targets">
          <div className="attention-list">
            {value.catalog.map((item) => (
              <div className="attention" key={item.provider}>
                <span className="workspace-avatar small">{item.name.slice(0, 1)}</span>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {label(item.domain)} · {item.capabilities.length} capabilities
                  </small>
                </div>
                <Status value="available" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel
        title="Synchronization history"
        subtitle="Cursors, pages and idempotent source-record outcomes"
      >
        <Table
          columns={[
            "Started",
            "Provider connection",
            "Trigger",
            "Added",
            "Modified",
            "Removed",
            "Status",
          ]}
          rows={value.runs.map((item) => [
            new Date(`${item.started_at}Z`).toLocaleString(),
            value.connections.find((connection) => connection.id === item.connection_id)
              ?.display_name,
            label(item.trigger),
            item.added,
            item.modified,
            item.removed,
            <Status value={item.status} />,
          ])}
        />
      </Panel>
      <Panel
        title="Accounting application workbench"
        subtitle="Review normalized provider records, versioned mappings and draft-journal outcomes"
        action={
          can("admin") && selectedConnection ? (
            <button className="secondary" onClick={() => setShowMapping(true)}>
              Add mapping
            </button>
          ) : null
        }
      >
        {value.connections.length ? (
          <>
            <div className="workflow-toolbar">
              <Field
                label="Connection"
                name="workbench_connection"
                as="select"
                value={selectedConnectionId}
                onChange={(event) => setSelectedConnectionId(event.target.value)}
                options={value.connections.map((item) => [item.id, item.display_name])}
              />
              <span>
                {mappings.length} active mapping{mappings.length === 1 ? "" : "s"} · records become
                drafts, never automatically posted journals
              </span>
            </div>
            {workbench.loading ? (
              <Loading />
            ) : workbench.error ? (
              <LoadError error={workbench.error} retry={workbench.refresh} />
            ) : (
              <Table
                caption="Provider accounting application queue"
                emptyTitle="No synchronized records"
                emptyDetail="Run a provider synchronization to stage normalized records for review."
                columns={["Type", "Provider ID", "Operation", "Effective", "Status", "Action"]}
                rows={records.map((item) => [
                  label(item.object_type),
                  item.external_id,
                  label(item.operation),
                  item.effective_at ? new Date(item.effective_at).toLocaleDateString() : "—",
                  <Status value={item.status} />,
                  ["staged", "error"].includes(item.status) && can("operate") ? (
                    <button className="small-button" onClick={() => previewApplication(item)}>
                      Review mapping
                    </button>
                  ) : item.applied_entity_id ? (
                    `Draft ${item.applied_entity_id}`
                  ) : (
                    "—"
                  ),
                ])}
              />
            )}
          </>
        ) : (
          <Empty
            title="No connector configured"
            detail="Configure a provider connection before building an accounting mapping."
          />
        )}
      </Panel>
      <Panel
        title="Integration exception queue"
        subtitle="Provider failures remain visible until an authorized operator records a disposition"
      >
        <Table
          columns={["Created", "Connection", "Code", "Message", "Status", "Action"]}
          rows={value.dead_letters.map((item) => [
            new Date(`${item.created_at}Z`).toLocaleString(),
            value.connections.find((connection) => connection.id === item.connection_id)
              ?.display_name,
            item.error_code,
            item.error_message,
            <Status value={item.status} />,
            item.status === "open" && can("operate") ? (
              <button className="small-button" onClick={() => resolveException(item)}>
                Resolve
              </button>
            ) : (
              "—"
            ),
          ])}
        />
      </Panel>
      {showForm && (
        <Dialog
          title="Configure connector"
          subtitle="Enter secret-manager reference names only. Tokens and client secrets never belong in this form."
          close={() => setShowForm(false)}
        >
          <form className="form-stack" onSubmit={configure}>
            <div className="form-grid">
              <Field
                label="Provider"
                name="provider"
                as="select"
                options={value.catalog.map((item) => [item.provider, item.name])}
              />
              <Field
                label="Environment"
                name="environment"
                as="select"
                options={[
                  ["sandbox", "Sandbox"],
                  ["production", "Production"],
                ]}
              />
            </div>
            <Field label="Connection name" name="display_name" />
            <Field
              label="External account ID"
              name="external_account_id"
              required={false}
              hint="Required for production; use the provider's tenant, account or company identifier."
            />
            <div className="form-grid">
              <Field
                label="Credential secret reference"
                name="credential_secret_ref"
                placeholder="STRIPE_OAUTH_CONNECTION_01"
                pattern="[A-Z][A-Z0-9_]{2,79}"
              />
              <Field
                label="Webhook secret reference"
                name="webhook_secret_ref"
                required={false}
                placeholder="STRIPE_WEBHOOK_CONNECTION_01"
                pattern="[A-Z][A-Z0-9_]{2,79}"
              />
            </div>
            <DialogActions close={() => setShowForm(false)} label="Save configuration" />
          </form>
        </Dialog>
      )}
      {showMapping && selectedConnection && (
        <Dialog
          title="Add versioned accounting mapping"
          subtitle={`Map one ${selectedConnection.display_name} source field into the controlled journal draft shape.`}
          close={() => setShowMapping(false)}
        >
          <form className="form-stack" onSubmit={saveMapping}>
            <div className="form-grid">
              <Field
                label="Provider object type"
                name="object_type"
                placeholder="bank_transaction"
              />
              <Field label="Source field path" name="source_field" placeholder="amount_cents" />
            </div>
            <div className="form-grid">
              <Field
                label="Journal target"
                name="target_field"
                as="select"
                options={[
                  ["date", "Date"],
                  ["memo", "Memo"],
                  ["amount_cents", "Amount (cents)"],
                  ["debit_account_code", "Debit account code"],
                  ["credit_account_code", "Credit account code"],
                ]}
              />
              <Field
                label="Transform"
                name="transform"
                as="select"
                options={[
                  ["identity", "Use as supplied"],
                  ["date", "ISO date"],
                  ["cents", "Integer cents"],
                  ["lowercase", "Lowercase"],
                  ["uppercase", "Uppercase"],
                ]}
              />
            </div>
            <Field
              label="Fallback value"
              name="default"
              required={false}
              hint="Useful for a fixed Folio account code. Folio increments mapping versions automatically."
            />
            <label className="check-row">
              <input type="checkbox" name="required" />
              Fail validation when the source field and fallback are both empty
            </label>
            <DialogActions close={() => setShowMapping(false)} label="Activate mapping" />
          </form>
        </Dialog>
      )}
      {applicationPreview && (
        <Dialog
          title="Review accounting application"
          subtitle={`${label(applicationPreview.record.object_type)} · ${applicationPreview.record.external_id}`}
          close={() => setApplicationPreview(null)}
        >
          <div className="application-review">
            <div className="source-summary">
              <ReviewValue label="Date" value={applicationPreview.mapped.date || "Not mapped"} />
              <ReviewValue
                label="Amount"
                value={
                  applicationPreview.mapped.amount_cents
                    ? money(applicationPreview.mapped.amount_cents)
                    : "Not mapped"
                }
              />
              <ReviewValue
                label="Debit"
                value={applicationPreview.mapped.debit_account_code || "Not mapped"}
              />
              <ReviewValue
                label="Credit"
                value={applicationPreview.mapped.credit_account_code || "Not mapped"}
              />
            </div>
            <div
              className={applicationPreview.ready ? "control-note" : "control-note warning-note"}
            >
              <strong>
                {applicationPreview.ready ? "Ready for approval" : "Mapping needs attention"}
              </strong>
              <span>
                {applicationPreview.ready
                  ? applicationPreview.mapped.memo
                  : applicationPreview.issues.join(" · ")}
              </span>
            </div>
            {applicationPreview.ready ? (
              <form className="form-stack" onSubmit={approveApplication}>
                <Field
                  label="Approval note"
                  name="approval_note"
                  as="textarea"
                  minLength="5"
                  placeholder="Describe the source evidence and account mapping reviewed."
                />
                <p className="form-hint">
                  Approval creates a draft only. A user with posting permission must independently
                  review and post it from Journals.
                </p>
                <DialogActions
                  close={() => setApplicationPreview(null)}
                  label={applicationBusy ? "Applying…" : "Approve and create draft"}
                />
              </form>
            ) : (
              <div className="dialog-actions">
                <button className="secondary" onClick={() => setApplicationPreview(null)}>
                  Return to mappings
                </button>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}

function Imports({ can, notify }) {
  const [exceptionStatus, setExceptionStatus] = useState("open");
  const [exceptionPage, setExceptionPage] = useState(1);
  const resource = useLoad(
    () =>
      Promise.all([
        api("/api/imports/templates"),
        api("/api/imports/batches"),
        api("/api/accounts"),
        api("/api/imports/mapping-profiles"),
        api("/api/imports/duplicate-policies"),
      ]),
    [],
  );
  const exceptionResource = useLoad(
    () =>
      api(
        `/api/imports/exceptions?status=${encodeURIComponent(exceptionStatus)}&page=${exceptionPage}&page_size=20`,
      ),
    [exceptionStatus, exceptionPage],
  );
  const [showStage, setShowStage] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [draft, setDraft] = useState(blankImportDraft());
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [batchQuery, setBatchQuery] = useState("");
  const [showPolicy, setShowPolicy] = useState(false);
  const [policyDraft, setPolicyDraft] = useState({
    template_key: "customers",
    field_key: "name",
    threshold_percent: "88",
    active: true,
  });
  const [distinctCandidate, setDistinctCandidate] = useState(null);
  const [distinctReason, setDistinctReason] = useState("");
  const [activeJob, setActiveJob] = useState(null);
  if (resource.loading || exceptionResource.loading) return <Loading />;
  if (resource.error || exceptionResource.error)
    return (
      <LoadError
        error={resource.error || exceptionResource.error}
        retry={() => Promise.all([resource.refresh(), exceptionResource.refresh()])}
      />
    );
  const [templates, batches, accounts, mappingProfiles, duplicatePolicies] = resource.data;
  const {
    items: exceptions,
    page: exceptionPagination,
    open_total: openExceptions,
  } = exceptionResource.data;
  const selectedTemplate =
    templates.find((item) => item.key === draft.template_key) || templates[0];
  const selectedMappingProfile = mappingProfiles.find(
    (item) => item.id === draft.mapping_profile_id,
  );
  const headers = csvHeaders(draft.csv);
  const requiredMapped = selectedTemplate.fields
    .filter((field) => field.required)
    .every((field) => draft.mapping[field.key]);
  const visibleBatches = batches.filter((item) =>
    `${item.filename} ${item.template_key} ${item.status}`
      .toLowerCase()
      .includes(batchQuery.trim().toLowerCase()),
  );
  const previewMappingProfile = preview?.mapping_profile_id
    ? mappingProfiles.find((item) => item.id === preview.mapping_profile_id)
    : null;
  const policyTemplate =
    templates.find((item) => item.key === policyDraft.template_key) || templates[0];
  const policyFields = policyTemplate.fields.filter((field) => field.type === "string");

  function openWizard() {
    setDraft(blankImportDraft());
    setWizardStep(1);
    setShowStage(true);
  }

  function updateDraft(values) {
    setDraft((current) => ({ ...current, ...values }));
  }

  function selectTemplate(templateKey) {
    setDraft(blankImportDraft(templateKey));
  }

  function editDuplicatePolicy(templateKey = "customers") {
    const template = templates.find((item) => item.key === templateKey) || templates[0];
    const existing = duplicatePolicies.find((item) => item.template_key === template.key);
    const textFields = template.fields.filter((field) => field.type === "string");
    setPolicyDraft({
      template_key: template.key,
      field_key: existing?.field_key || textFields[0]?.key || "",
      threshold_percent: String(existing?.threshold_percent || 88),
      active: existing?.active ?? true,
    });
    setShowPolicy(true);
  }

  async function saveDuplicatePolicy(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const policy = await api("/api/imports/duplicate-policies", {
        method: "POST",
        body: {
          ...policyDraft,
          threshold_percent: Number(policyDraft.threshold_percent),
        },
      });
      await resource.refresh();
      setShowPolicy(false);
      notify({
        kind: "success",
        message: `${label(policy.template_key)} candidate policy v${policy.version} saved; ${policy.indexed_rows} applied rows indexed.`,
      });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function loadCsvFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) {
      notify({ kind: "error", message: "CSV files are limited to 5 MB." });
      event.target.value = "";
      return;
    }
    const csv = await file.text();
    updateDraft({
      filename: file.name,
      csv,
      mapping: sameHeaders(headers, csvHeaders(csv)) ? draft.mapping : {},
    });
  }

  function downloadTemplate() {
    const blob = new Blob([`${selectedTemplate.sample_header}\n`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedTemplate.key}-v${selectedTemplate.version}-template.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function continueToMapping() {
    if (!draft.filename.trim() || !draft.csv.trim()) {
      notify({ kind: "error", message: "Choose a CSV file or paste CSV data first." });
      return;
    }
    if (!headers.length) {
      notify({ kind: "error", message: "The CSV header row could not be read." });
      return;
    }
    if (
      draft.template_key === "bank_transactions" &&
      ![
        draft.cash_account_id,
        draft.start_date,
        draft.end_date,
        draft.opening,
        draft.closing,
      ].every((value) => String(value).trim())
    ) {
      notify({ kind: "error", message: "Complete every bank statement control total." });
      return;
    }
    updateDraft({ mapping: suggestedMapping(selectedTemplate, headers, draft.mapping) });
    setWizardStep(2);
  }

  function applyMappingProfile(profileId) {
    const profile = mappingProfiles.find((item) => item.id === profileId);
    updateDraft({
      mapping_profile_id: profile?.id || "",
      mapping: profile
        ? suggestedMapping(selectedTemplate, headers, profile.mapping)
        : suggestedMapping(selectedTemplate, headers, draft.mapping),
    });
  }

  async function stage(event) {
    event.preventDefault();
    if (wizardStep !== 3) return;
    setBusy(true);
    try {
      const options =
        draft.template_key === "bank_transactions"
          ? {
              cash_account_id: Number(draft.cash_account_id),
              start_date: draft.start_date,
              end_date: draft.end_date,
              opening_cents: Math.round(Number(draft.opening) * 100),
              closing_cents: Math.round(Number(draft.closing) * 100),
            }
          : {};
      const job = await api("/api/jobs/imports/stage", {
        method: "POST",
        body: {
          template_key: draft.template_key,
          filename: draft.filename,
          csv: draft.csv,
          mapping: draft.mapping,
          mapping_profile_id: draft.mapping_profile_id || undefined,
          restaged_from_batch_id: draft.restaged_from_batch_id || undefined,
          options,
        },
      });
      setActiveJob(job);
      setShowStage(false);
      notify({
        kind: "success",
        message:
          "Import source secured and queued for validation. No accounting records were created.",
      });
      const completed = await waitForJob(job.id, setActiveJob);
      const batch = await api(
        `/api/imports/batches/${completed.result.batch_id}?page=1&page_size=100`,
      );
      let mappingSaved = false;
      let mappingSaveError = "";
      if (draft.mapping_profile_name.trim()) {
        try {
          await api("/api/imports/mapping-profiles", {
            method: "POST",
            body: {
              name: draft.mapping_profile_name,
              template_key: draft.template_key,
              mapping: draft.mapping,
            },
          });
          mappingSaved = true;
        } catch (error) {
          mappingSaveError = error.message;
        }
      }
      setPreview(batch);
      await Promise.all([resource.refresh(), exceptionResource.refresh()]);
      notify({
        kind: mappingSaveError ? "error" : "success",
        message: mappingSaveError
          ? `Import validated, but the optional mapping profile was not saved: ${mappingSaveError}`
          : `Import validation completed and is ready for review${mappingSaved ? "; mapping profile saved" : ""}.`,
      });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function openBatch(id, page = 1) {
    try {
      setPreview(await api(`/api/imports/batches/${id}?page=${page}&page_size=100`));
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }

  async function beginCorrection() {
    setBusy(true);
    try {
      const source = await api(`/api/imports/batches/${preview.id}/correction-source`);
      setDraft({
        ...blankImportDraft(source.template_key),
        filename: source.filename,
        csv: source.csv,
        mapping: source.mapping,
        restaged_from_batch_id: source.source_batch_id,
        correction_source_filename: source.source_filename,
        correction_row_count: source.row_count,
        correction_scope: source.scope,
        cash_account_id: source.options.cash_account_id
          ? String(source.options.cash_account_id)
          : "",
        start_date: source.options.start_date || "",
        end_date: source.options.end_date || "",
        opening:
          source.options.opening_cents === undefined
            ? ""
            : String(source.options.opening_cents / 100),
        closing:
          source.options.closing_cents === undefined
            ? ""
            : String(source.options.closing_cents / 100),
      });
      setWizardStep(1);
      setShowStage(true);
      notify({
        kind: "success",
        message: `${source.row_count} ${source.scope === "full_replacement" ? "source" : "exception"} row${source.row_count === 1 ? "" : "s"} loaded for correction with source lineage.`,
      });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function approveAndApply() {
    setBusy(true);
    try {
      const hasExceptions = preview.error_count > 0 || preview.duplicate_count > 0;
      await api(`/api/imports/batches/${preview.id}/approve`, {
        method: "POST",
        body: { apply_valid_rows: hasExceptions },
      });
      const job = await api("/api/jobs/imports/apply", {
        method: "POST",
        body: { batch_id: preview.id },
      });
      setActiveJob(job);
      notify({ kind: "success", message: "Approved import queued for controlled application." });
      const completed = await waitForJob(job.id, setActiveJob);
      const applied = await api(
        `/api/imports/batches/${completed.result.batch_id}?page=1&page_size=100`,
      );
      setPreview(applied);
      await Promise.all([resource.refresh(), exceptionResource.refresh()]);
      notify({
        kind: "success",
        message: `${applied.applied_count} validated rows applied with retained lineage.`,
      });
    } catch (error) {
      try {
        const refreshedPreview = await api(
          `/api/imports/batches/${preview.id}?page=1&page_size=100`,
        );
        setPreview(refreshedPreview);
        await Promise.all([resource.refresh(), exceptionResource.refresh()]);
      } catch {
        // Preserve the original apply failure when the recovery refresh is unavailable.
      }
      notify({ kind: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function resolveException(item) {
    try {
      await api("/api/imports/exceptions/status", {
        method: "POST",
        body: {
          id: item.id,
          status: "resolved",
          resolution: "Reviewed in the import operations workbench",
        },
      });
      await Promise.all([resource.refresh(), exceptionResource.refresh()]);
      notify({ kind: "success", message: "Import exception resolved." });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }

  async function acceptDistinct(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api(`/api/imports/exceptions/${distinctCandidate.id}/accept-distinct`, {
        method: "POST",
        body: { resolution: distinctReason },
      });
      if (preview?.id === result.batch.id) setPreview(result.batch);
      await Promise.all([resource.refresh(), exceptionResource.refresh()]);
      setDistinctCandidate(null);
      setDistinctReason("");
      notify({
        kind: "success",
        message:
          "Candidate accepted as distinct; the reviewer rationale and match evidence were retained.",
      });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="module-flow">
      <ModuleBar
        title="Controlled imports"
        detail="Versioned templates, validation previews, duplicate controls and traceable application"
        action={
          (can("operate") || can("admin")) && (
            <div className="button-row">
              {can("admin") && (
                <button className="secondary" onClick={() => editDuplicatePolicy()}>
                  Matching policies
                </button>
              )}
              {can("operate") && (
                <button className="primary" onClick={openWizard}>
                  New import
                </button>
              )}
            </div>
          )
        }
      />
      {activeJob && (
        <Panel
          title="Import processing"
          subtitle="Durable work continues if this page closes; retry and failure details remain auditable."
        >
          <div className="review-strip" aria-live="polite">
            <DescriptionList
              items={[
                ["Operation", label(activeJob.kind)],
                ["Status", <Status value={activeJob.status} />],
                ["Attempts", `${activeJob.attempts} of ${activeJob.max_attempts}`],
                [
                  "Outcome",
                  activeJob.result?.batch_id
                    ? `Batch ${activeJob.result.batch_id.slice(0, 8)}…`
                    : activeJob.last_error || "Waiting for a worker",
                ],
              ]}
            />
            {activeJob.status === "completed" && (
              <button className="secondary" onClick={() => setActiveJob(null)}>
                Dismiss
              </button>
            )}
          </div>
        </Panel>
      )}
      <section className="kpi-grid">
        <Kpi label="Templates" value={templates.length} detail="Versioned entity formats" />
        <Kpi
          label="Staged"
          value={batches.filter((item) => item.status === "staged").length}
          detail="Awaiting approval"
        />
        <Kpi
          label="Applied rows"
          value={batches.reduce((sum, item) => sum + item.applied_count, 0)}
          detail="With entity lineage"
        />
        <Kpi
          label="Open exceptions"
          value={openExceptions}
          detail="Validation or apply issues"
          warning={openExceptions > 0}
        />
      </section>
      <Panel
        title="Duplicate candidate controls"
        subtitle="Versioned tenant policies compare normalized text without auto-merging records"
      >
        <Table
          columns={["Template", "Match field", "Threshold", "Indexed history", "Status", "Action"]}
          caption="Configured duplicate candidate policies"
          emptyTitle="Exact-key checks only"
          emptyDetail="An administrator can add a fuzzy candidate policy for a text field."
          rows={duplicatePolicies.map((item) => [
            label(item.template_key),
            label(item.field_key),
            `${item.threshold_percent}% · v${item.version}`,
            item.indexed_rows,
            <Status value={item.active ? "active" : "disabled"} />,
            can("admin") ? (
              <button
                className="small-button"
                onClick={() => editDuplicatePolicy(item.template_key)}
              >
                Configure
              </button>
            ) : (
              "—"
            ),
          ])}
        />
      </Panel>
      <div className="two-column">
        <Panel
          title="Import batches"
          subtitle="Files remain staged until an operator reviews the preview"
        >
          <div className="workflow-toolbar">
            <Field
              label="Find a batch"
              type="search"
              value={batchQuery}
              onChange={(event) => setBatchQuery(event.target.value)}
              placeholder="Filename, template or status"
              required={false}
            />
            <span>{visibleBatches.length} shown</span>
          </div>
          <Table
            columns={["File", "Template", "Rows", "Valid", "Exceptions", "Status", "Review"]}
            caption="Import batches"
            emptyTitle="No matching batches"
            emptyDetail="Change the search or start a new controlled import."
            rows={visibleBatches.map((item) => [
              item.filename,
              label(item.template_key),
              item.row_count,
              item.valid_count,
              item.error_count + item.duplicate_count,
              <Status value={item.status} />,
              <button className="small-button" onClick={() => openBatch(item.id)}>
                Review
              </button>,
            ])}
          />
        </Panel>
        <Panel
          title="Exception queue"
          subtitle="Warnings and blocking rows require an explicit disposition"
        >
          <div className="workflow-toolbar">
            <Field
              label="Exception status"
              as="select"
              value={exceptionStatus}
              onChange={(event) => {
                setExceptionStatus(event.target.value);
                setExceptionPage(1);
              }}
              options={[
                ["open", "Open"],
                ["acknowledged", "Acknowledged"],
                ["resolved", "Resolved"],
                ["ignored", "Ignored"],
                ["all", "All statuses"],
              ]}
            />
            <span>
              {exceptionPagination.total
                ? `${exceptionPagination.from}–${exceptionPagination.to} of ${exceptionPagination.total}`
                : "Queue clear"}
            </span>
          </div>
          <Table
            columns={["Code", "Severity", "Message", "Status", "Resolution", "Action"]}
            caption="Import exception queue"
            emptyTitle="No matching exceptions"
            emptyDetail="This queue is clear for the selected status."
            rows={exceptions.map((item) => [
              label(item.code),
              <Status value={item.severity} />,
              item.message,
              <Status value={item.status} />,
              item.resolution ? `${item.resolution} · ${item.owner || "reviewer"}` : "—",
              item.status === "open" && can("operate") ? (
                item.code === "FUZZY_DUPLICATE" ? (
                  <button
                    className="small-button"
                    onClick={() => {
                      setDistinctCandidate(item);
                      setDistinctReason("");
                    }}
                  >
                    Compare
                  </button>
                ) : (
                  <button className="small-button" onClick={() => resolveException(item)}>
                    Resolve
                  </button>
                )
              ) : (
                "—"
              ),
            ])}
          />
          {exceptionPagination.total_pages > 1 && (
            <nav className="table-pagination" aria-label="Import exception pages">
              <button
                className="secondary"
                disabled={exceptionPagination.page === 1}
                onClick={() => setExceptionPage((page) => page - 1)}
              >
                Previous
              </button>
              <span aria-live="polite">
                Page {exceptionPagination.page} of {exceptionPagination.total_pages}
              </span>
              <button
                className="secondary"
                disabled={exceptionPagination.page === exceptionPagination.total_pages}
                onClick={() => setExceptionPage((page) => page + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </Panel>
      </div>
      {preview && (
        <Panel
          title={`Review ${preview.filename}`}
          subtitle={`SHA-256 ${preview.file_sha256.slice(0, 16)}… · template v${preview.template_version}`}
        >
          <div className="review-strip">
            <DescriptionList
              items={[
                ["Rows", preview.row_count],
                ["Valid", preview.valid_count],
                ["Errors", preview.error_count],
                ["Duplicates", preview.duplicate_count],
                [
                  "Candidate policy",
                  preview.duplicate_policy
                    ? `${label(preview.duplicate_policy.field_key)} · ${preview.duplicate_policy.threshold_percent}% · v${preview.duplicate_policy.version}`
                    : "Exact natural keys only",
                ],
                [
                  "Mapping",
                  previewMappingProfile
                    ? `${previewMappingProfile.name} · v${preview.mapping_profile_version}`
                    : "Exact batch snapshot",
                ],
                [
                  "Correction lineage",
                  preview.restaged_from_batch_id
                    ? `Restaged from ${preview.restaged_from_batch_id.slice(0, 8)}…`
                    : "Original source batch",
                ],
                ["Status", <Status value={preview.status} />],
              ]}
            />
            <div className="button-row">
              {(preview.error_count > 0 ||
                preview.duplicate_count > 0 ||
                preview.status === "failed") &&
                can("operate") && (
                  <button className="secondary" disabled={busy} onClick={beginCorrection}>
                    Correct and restage
                  </button>
                )}
              {preview.status === "staged" && can("operate") && (
                <button
                  className="primary"
                  disabled={busy || !preview.valid_count}
                  onClick={approveAndApply}
                >
                  {busy
                    ? "Applying…"
                    : preview.error_count || preview.duplicate_count
                      ? "Apply valid rows only"
                      : "Approve and apply"}
                </button>
              )}
            </div>
          </div>
          <Table
            columns={["CSV row", "Natural key", "Status", "Validation result", "Created record"]}
            caption={`Validation preview for ${preview.filename}`}
            rows={preview.rows.map((item) => [
              item.row_number,
              item.natural_key,
              <Status value={item.status} />,
              item.errors.length ? item.errors.join("; ") : "Passed",
              item.applied_entity_id
                ? `${label(item.applied_entity_type)} ${item.applied_entity_id}`
                : "—",
            ])}
          />
          {preview.row_page && preview.row_page.total_pages > 1 && (
            <nav className="table-pagination" aria-label="Import validation preview pages">
              <button
                className="secondary"
                disabled={preview.row_page.page === 1 || busy}
                onClick={() => openBatch(preview.id, preview.row_page.page - 1)}
              >
                Previous 100
              </button>
              <span aria-live="polite">
                Rows {preview.row_page.from}–{preview.row_page.to} of {preview.row_page.total_rows}{" "}
                · page {preview.row_page.page} of {preview.row_page.total_pages}
              </span>
              <button
                className="secondary"
                disabled={preview.row_page.page === preview.row_page.total_pages || busy}
                onClick={() => openBatch(preview.id, preview.row_page.page + 1)}
              >
                Next 100
              </button>
            </nav>
          )}
        </Panel>
      )}
      {showPolicy && (
        <Dialog
          title="Duplicate candidate policy"
          subtitle="Choose one text field and a review threshold. Changes are versioned and rebuild the applied-import index."
          close={() => setShowPolicy(false)}
        >
          <form className="form-stack" onSubmit={saveDuplicatePolicy}>
            <Field
              label="Import template"
              as="select"
              value={policyDraft.template_key}
              onChange={(event) => {
                const template = templates.find((item) => item.key === event.target.value);
                const existing = duplicatePolicies.find(
                  (item) => item.template_key === event.target.value,
                );
                const textFields = template.fields.filter((field) => field.type === "string");
                setPolicyDraft({
                  template_key: template.key,
                  field_key: existing?.field_key || textFields[0]?.key || "",
                  threshold_percent: String(existing?.threshold_percent || 88),
                  active: existing?.active ?? true,
                });
              }}
              options={templates
                .filter((template) => template.fields.some((field) => field.type === "string"))
                .map((template) => [template.key, template.name])}
            />
            <Field
              label="Text field to compare"
              as="select"
              value={policyDraft.field_key}
              onChange={(event) =>
                setPolicyDraft((current) => ({ ...current, field_key: event.target.value }))
              }
              options={policyFields.map((field) => [field.key, field.label])}
            />
            <Field
              label="Similarity threshold"
              type="number"
              min="70"
              max="99"
              value={policyDraft.threshold_percent}
              onChange={(event) =>
                setPolicyDraft((current) => ({
                  ...current,
                  threshold_percent: event.target.value,
                }))
              }
              hint="70–99%. Lower values surface more candidates for human review."
            />
            <Field
              label="Policy status"
              as="select"
              value={policyDraft.active ? "active" : "disabled"}
              onChange={(event) =>
                setPolicyDraft((current) => ({
                  ...current,
                  active: event.target.value === "active",
                }))
              }
              options={[
                ["active", "Active — flag matching candidates"],
                ["disabled", "Disabled — exact natural keys only"],
              ]}
            />
            <div className="review-notice" role="note">
              <strong>Review control</strong>
              <span>
                Candidate rows remain blocked until corrected or explicitly accepted as distinct
                with a reviewer rationale. Folio never merges records automatically.
              </span>
            </div>
            <DialogActions
              close={() => setShowPolicy(false)}
              label={busy ? "Saving…" : "Save policy"}
            />
          </form>
        </Dialog>
      )}
      {distinctCandidate && (
        <Dialog
          title="Compare duplicate candidate"
          subtitle={distinctCandidate.message}
          close={() => setDistinctCandidate(null)}
        >
          <form className="form-stack" onSubmit={acceptDistinct}>
            <div className="review-notice" role="note">
              <strong>No automatic merge</strong>
              <span>
                Accepting makes this row eligible for the batch. The similarity evidence, policy
                version, reviewer and rationale remain attached to the import history.
              </span>
            </div>
            <Field
              label="Reviewer rationale"
              as="textarea"
              minLength="8"
              maxLength="500"
              value={distinctReason}
              onChange={(event) => setDistinctReason(event.target.value)}
              hint="Describe the source evidence that proves these are separate records."
            />
            <DialogActions
              close={() => setDistinctCandidate(null)}
              label={busy ? "Recording…" : "Accept as distinct"}
            />
          </form>
        </Dialog>
      )}
      {showStage && (
        <Dialog
          title="New controlled import"
          subtitle="Choose the source, map its columns, then review before server validation. Nothing posts automatically."
          close={() => setShowStage(false)}
        >
          <form className="form-stack" onSubmit={stage}>
            <ol className="wizard-steps" aria-label="Import workflow progress">
              {["Source", "Map columns", "Review"].map((step, index) => (
                <li key={step} aria-current={wizardStep === index + 1 ? "step" : undefined}>
                  <span>{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            {wizardStep === 1 && (
              <>
                <Field
                  label="Import template"
                  as="select"
                  value={draft.template_key}
                  onChange={(event) => selectTemplate(event.target.value)}
                  options={templates.map((item) => [
                    item.key,
                    `${item.name} · version ${item.version}`,
                  ])}
                />
                <div className="template-download">
                  <button type="button" className="secondary" onClick={downloadTemplate}>
                    Download blank {selectedTemplate.name.toLowerCase()} template
                  </button>
                  <span>CSV headers match template version {selectedTemplate.version}.</span>
                </div>
                {draft.restaged_from_batch_id && (
                  <div className="review-notice" role="note">
                    <strong>Correcting {draft.correction_source_filename}</strong>
                    <span>
                      Edit the {draft.correction_row_count} row
                      {draft.correction_row_count === 1 ? "" : "s"} below. The new batch will retain
                      a link to its source.{" "}
                      {draft.correction_scope === "full_replacement"
                        ? "This is a full replacement because the source batch was not applied."
                        : "Previously applied rows are excluded; only exception rows are restaged."}
                    </span>
                  </div>
                )}
                <label className="file-drop">
                  <input type="file" accept=".csv,text/csv" onChange={loadCsvFile} />
                  <strong>{draft.csv ? "Replace CSV file" : "Choose CSV file"}</strong>
                  <span>Up to 5 MB and 10,000 data rows. The file stays tenant-scoped.</span>
                </label>
                <Field
                  label="Source filename"
                  value={draft.filename}
                  onChange={(event) => updateDraft({ filename: event.target.value })}
                  placeholder={`${draft.template_key}.csv`}
                />
                <Field
                  label="CSV data"
                  as="textarea"
                  value={draft.csv}
                  onChange={(event) => {
                    const csv = event.target.value;
                    updateDraft({
                      csv,
                      mapping: sameHeaders(headers, csvHeaders(csv)) ? draft.mapping : {},
                    });
                  }}
                  placeholder={`${selectedTemplate.sample_header}\n`}
                  hint={`Choose a file above or paste its contents. Expected fields: ${selectedTemplate.fields.map((item) => item.key).join(", ")}.`}
                />
                {draft.template_key === "bank_transactions" && (
                  <div className="source-options" aria-label="Bank statement details">
                    <h3>Statement control totals</h3>
                    <Field
                      label="Cash account"
                      as="select"
                      value={draft.cash_account_id}
                      onChange={(event) => updateDraft({ cash_account_id: event.target.value })}
                      options={[
                        ["", "Select a cash account"],
                        ...accounts
                          .filter((account) => account.type === "asset")
                          .map((account) => [account.id, `${account.code} · ${account.name}`]),
                      ]}
                    />
                    <div className="form-grid">
                      <Field
                        label="Statement start"
                        type="date"
                        value={draft.start_date}
                        onChange={(event) => updateDraft({ start_date: event.target.value })}
                      />
                      <Field
                        label="Statement end"
                        type="date"
                        value={draft.end_date}
                        onChange={(event) => updateDraft({ end_date: event.target.value })}
                      />
                      <Field
                        label="Opening balance"
                        type="number"
                        step="0.01"
                        value={draft.opening}
                        onChange={(event) => updateDraft({ opening: event.target.value })}
                      />
                      <Field
                        label="Closing balance"
                        type="number"
                        step="0.01"
                        value={draft.closing}
                        onChange={(event) => updateDraft({ closing: event.target.value })}
                      />
                    </div>
                  </div>
                )}
                <div className="step-actions">
                  <button type="button" className="secondary" onClick={() => setShowStage(false)}>
                    Cancel
                  </button>
                  <button type="button" className="primary" onClick={continueToMapping}>
                    Map columns
                  </button>
                </div>
              </>
            )}
            {wizardStep === 2 && (
              <>
                <div className="source-summary">
                  <div>
                    <span>Source</span>
                    <strong>{draft.filename}</strong>
                  </div>
                  <div>
                    <span>Detected columns</span>
                    <strong>{headers.length}</strong>
                  </div>
                  <div>
                    <span>Target</span>
                    <strong>{selectedTemplate.name}</strong>
                  </div>
                </div>
                <Field
                  label="Use a saved mapping"
                  as="select"
                  required={false}
                  defaultValue=""
                  onChange={(event) => applyMappingProfile(event.target.value)}
                  options={[
                    ["", "Automatic exact-name mapping"],
                    ...mappingProfiles
                      .filter((item) => item.template_key === draft.template_key)
                      .map((item) => [item.id, `${item.name} · version ${item.version}`]),
                  ]}
                  hint="Profiles are tenant-scoped and retain their template version."
                />
                <div className="mapping-list" role="group" aria-label="Column mappings">
                  {selectedTemplate.fields.map((field) => (
                    <div className="mapping-row" key={field.key}>
                      <div>
                        <strong>{field.label}</strong>
                        <small>
                          {field.key} · {field.type} · {field.required ? "required" : "optional"}
                        </small>
                      </div>
                      <span aria-hidden="true">←</span>
                      <Field
                        label={`Source column for ${field.label}`}
                        as="select"
                        required={field.required}
                        value={draft.mapping[field.key] || ""}
                        onChange={(event) =>
                          updateDraft({
                            mapping_profile_id: "",
                            mapping: { ...draft.mapping, [field.key]: event.target.value },
                          })
                        }
                        options={[
                          ["", field.required ? "Select a source column" : "Not mapped"],
                          ...headers.map((header) => [header, header]),
                        ]}
                      />
                    </div>
                  ))}
                </div>
                {can("admin") && (
                  <Field
                    label="Save this mapping for reuse"
                    value={draft.mapping_profile_name}
                    onChange={(event) => updateDraft({ mapping_profile_name: event.target.value })}
                    required={false}
                    placeholder="Optional profile name"
                    hint="Saved only after this file passes server validation."
                  />
                )}
                {!requiredMapped && (
                  <Alert>Map every required target field before continuing.</Alert>
                )}
                <div className="step-actions">
                  <button type="button" className="secondary" onClick={() => setWizardStep(1)}>
                    Back
                  </button>
                  <button
                    type="button"
                    className="primary"
                    disabled={!requiredMapped}
                    onClick={() => setWizardStep(3)}
                  >
                    Review import
                  </button>
                </div>
              </>
            )}
            {wizardStep === 3 && (
              <>
                <div className="review-card">
                  <DescriptionList
                    items={[
                      ["Source file", draft.filename],
                      ["Template", `${selectedTemplate.name} · v${selectedTemplate.version}`],
                      ["Detected columns", headers.length],
                      ["Mapped fields", Object.values(draft.mapping).filter(Boolean).length],
                      [
                        "Correction source",
                        draft.restaged_from_batch_id
                          ? `${draft.correction_source_filename} · ${draft.correction_row_count} rows`
                          : "Original source batch",
                      ],
                      [
                        "Mapping lineage",
                        selectedMappingProfile
                          ? `${selectedMappingProfile.name} · v${selectedMappingProfile.version}`
                          : "Exact batch snapshot",
                      ],
                      ["Saved profile", draft.mapping_profile_name || "Not requested"],
                    ]}
                  />
                </div>
                <Table
                  caption="Import mapping review"
                  columns={["Target field", "Source column", "Requirement"]}
                  rows={selectedTemplate.fields.map((field) => [
                    field.label,
                    draft.mapping[field.key] || "Not mapped",
                    field.required ? "Required" : "Optional",
                  ])}
                />
                <div className="review-notice" role="note">
                  <strong>Next: server validation</strong>
                  <span>
                    Formula-like content, duplicates, types and natural keys are checked before a
                    row preview is created. No accounting record is created at this step.
                  </span>
                </div>
                <div className="step-actions">
                  <button type="button" className="secondary" onClick={() => setWizardStep(2)}>
                    Back
                  </button>
                  <button className="primary" disabled={busy}>
                    {busy ? "Validating source…" : "Stage and validate"}
                  </button>
                </div>
              </>
            )}
          </form>
        </Dialog>
      )}
    </div>
  );
}

function Overview() {
  const resource = useLoad(
    () => Promise.all([api("/api/dashboard"), api("/api/reconciliation-exceptions")]),
    [],
  );
  if (resource.loading) return <Loading />;
  if (resource.error) return <LoadError error={resource.error} retry={resource.refresh} />;
  const [dashboard, exceptions] = resource.data;
  const open = exceptions.filter((item) => item.status !== "resolved");
  return (
    <div className="module-flow">
      <section className="kpi-grid" aria-label="Financial overview">
        <Kpi label="Cash" value={money(dashboard.cash_cents)} detail="Posted cash balance" />
        <Kpi label="Revenue" value={money(dashboard.revenue_cents)} detail="Posted revenue" />
        <Kpi label="Net income" value={money(dashboard.net_income_cents)} detail="Current ledger" />
        <Kpi
          label="Drafts"
          value={dashboard.drafts}
          detail="Awaiting approval"
          warning={dashboard.drafts > 0}
        />
      </section>
      <div className="two-column">
        <Panel title="Monthly performance" subtitle="Revenue and expense activity by posting month">
          <Table
            columns={["Month", "Revenue", "Expenses"]}
            rows={dashboard.monthly.map((row) => [
              row.month,
              money(row.revenue_cents),
              money(row.expense_cents),
            ])}
          />
        </Panel>
        <Panel title="Close attention" subtitle="Open reconciliation items that need an owner">
          {open.length ? (
            <div className="attention-list">
              {open.slice(0, 6).map((item) => (
                <div className="attention" key={item.id}>
                  <span className="status-dot warning" />
                  <div>
                    <strong>{label(item.kind)}</strong>
                    <small>
                      {item.reference} · {money(item.amount_cents)}
                    </small>
                  </div>
                  <Status value={item.status} />
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="Everything reconciles"
              detail="No unresolved reconciliation exceptions."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}

function Journals({ can, notify }) {
  const resource = useLoad(() => Promise.all([api("/api/journals"), api("/api/accounts")]), []);
  const [showForm, setShowForm] = useState(false);
  if (resource.loading) return <Loading />;
  if (resource.error) return <LoadError error={resource.error} retry={resource.refresh} />;
  const [journals, accounts] = resource.data;
  async function create(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Math.round(Number(form.get("amount")) * 100);
    try {
      await api("/api/journals", {
        method: "POST",
        body: {
          date: form.get("date"),
          memo: form.get("memo"),
          source: "manual",
          lines: [
            {
              account_id: Number(form.get("debit_account")),
              description: form.get("description"),
              debit_cents: amount,
            },
            {
              account_id: Number(form.get("credit_account")),
              description: form.get("description"),
              credit_cents: amount,
            },
          ],
        },
      });
      setShowForm(false);
      await resource.refresh();
      notify({ kind: "success", message: "Balanced journal draft saved for approval." });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  async function post(id) {
    if (!window.confirm("Post this journal? Posted entries are immutable.")) return;
    try {
      await api(`/api/journals/${id}/post`, { method: "POST" });
      await resource.refresh();
      notify({ kind: "success", message: "Journal posted and integrity-sealed." });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  return (
    <div className="module-flow">
      <ModuleBar
        title="Journal register"
        detail={`${journals.length} entries with controlled approval and posting`}
        action={
          can("draft") && (
            <button className="primary" onClick={() => setShowForm(true)}>
              New journal
            </button>
          )
        }
      />
      <Panel>
        <Table
          columns={["Date", "Memo", "Source", "Amount", "Status", "Action"]}
          rows={journals.map((item) => [
            date(item.entry_date),
            item.memo,
            label(item.source),
            money(item.total_cents),
            <Status value={item.status} />,
            item.status === "draft" && can("post") ? (
              <button className="small-button" onClick={() => post(item.id)}>
                Post
              </button>
            ) : (
              "—"
            ),
          ])}
        />
      </Panel>
      {showForm && (
        <Dialog
          title="Create balanced journal"
          subtitle="Save a draft for review; this does not post to the ledger."
          close={() => setShowForm(false)}
        >
          <form className="form-stack" onSubmit={create}>
            <div className="form-grid">
              <Field label="Entry date" name="date" type="date" defaultValue={today} />
              <Field label="Amount" name="amount" type="number" min="0.01" step="0.01" />
              <Field
                label="Debit account"
                name="debit_account"
                as="select"
                options={accounts.map((a) => [a.id, `${a.code} · ${a.name}`])}
              />
              <Field
                label="Credit account"
                name="credit_account"
                as="select"
                options={accounts.map((a) => [a.id, `${a.code} · ${a.name}`])}
              />
            </div>
            <Field label="Memo" name="memo" maxLength={240} />
            <Field label="Line description" name="description" maxLength={240} />
            <DialogActions close={() => setShowForm(false)} label="Save draft" />
          </form>
        </Dialog>
      )}
    </div>
  );
}

function Revenue({ can, notify }) {
  const resource = useLoad(() => api("/api/saas/overview"), []);
  if (resource.loading) return <Loading />;
  if (resource.error) return <LoadError error={resource.error} retry={resource.refresh} />;
  const value = resource.data;
  async function recognize() {
    try {
      const result = await api("/api/revenue/recognize", {
        method: "POST",
        body: { as_of: today },
      });
      await resource.refresh();
      notify({
        kind: "success",
        message: `${result.recognized_schedules} revenue schedules recognized.`,
      });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  return (
    <div className="module-flow">
      <ModuleBar
        title="Contract-to-ledger"
        detail="ASC 606 contracts, obligations, billing and recognition"
        action={
          can("operate") && (
            <button className="primary" onClick={recognize}>
              Recognize through today
            </button>
          )
        }
      />
      <section className="kpi-grid">
        <Kpi label="Contracts" value={value.contracts.length} detail="Customer arrangements" />
        <Kpi label="Schedules" value={value.schedules.length} detail="Recognition periods" />
        <Kpi label="Invoices" value={value.invoices.length} detail="Billing records" />
        <Kpi label="RPO" value={money(value.rpo_cents || 0)} detail="Remaining obligations" />
      </section>
      <Panel title="Contracts" subtitle="Signed arrangements and allocated transaction price">
        <Table
          columns={["Contract", "Customer", "Start", "End", "Transaction price"]}
          rows={value.contracts.map((item) => [
            item.contract_number,
            item.customer_name,
            date(item.start_date),
            date(item.end_date),
            money(item.transaction_price_cents),
          ])}
        />
      </Panel>
    </div>
  );
}

function Receivables({ can, notify }) {
  const resource = useLoad(
    () => Promise.all([api("/api/receivables"), api("/api/saas/overview")]),
    [],
  );
  const [action, setAction] = useState(null);
  if (resource.loading) return <Loading />;
  if (resource.error) return <LoadError error={resource.error} retry={resource.refresh} />;
  const [ar, saas] = resource.data;
  const open = ar.invoices.filter((item) => item.balance_cents > 0 && item.status !== "void");
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Math.round(Number(form.get("amount")) * 100);
    let path, body;
    if (action === "invoice") {
      path = "/api/invoices";
      body = {
        contract_id: Number(form.get("contract_id")),
        invoice_number: form.get("number"),
        invoice_date: form.get("date"),
        due_date: form.get("due_date"),
        amount_cents: amount,
      };
    } else {
      path = "/api/receivables/payments";
      const invoiceId = Number(form.get("invoice_id"));
      body = {
        customer_id: Number(form.get("customer_id")),
        payment_number: form.get("number"),
        payment_date: form.get("date"),
        amount_cents: amount,
        method: form.get("method"),
        reference: form.get("reference"),
        applications: invoiceId ? [{ invoice_id: invoiceId, amount_cents: amount }] : [],
      };
    }
    try {
      await api(path, { method: "POST", body });
      setAction(null);
      await resource.refresh();
      notify({
        kind: "success",
        message: action === "invoice" ? "Invoice posted." : "Payment recorded and applied.",
      });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  return (
    <div className="module-flow">
      <ModuleBar
        title="Receivables operations"
        detail={`Aging as of ${date(ar.as_of)}`}
        action={
          can("operate") && (
            <div className="button-row">
              <button className="secondary" onClick={() => setAction("payment")}>
                Record payment
              </button>
              <button className="primary" onClick={() => setAction("invoice")}>
                New invoice
              </button>
            </div>
          )
        }
      />
      <section className="kpi-grid">
        <Kpi
          label="Open AR"
          value={money(ar.aging.total_cents)}
          detail={`${open.length} open invoices`}
        />
        <Kpi
          label="Overdue"
          value={money(ar.aging.overdue_cents)}
          detail="Past due balance"
          warning={ar.aging.overdue_cents > 0}
        />
        <Kpi label="Disputed" value={money(ar.aging.disputed_cents)} detail="Active disputes" />
        <Kpi
          label="GL difference"
          value={money(ar.reconciliation.ar_difference_cents)}
          detail={ar.reconciliation.balanced ? "Subledger agrees" : "Requires resolution"}
          warning={!ar.reconciliation.balanced}
        />
      </section>
      <Panel title="Invoice aging" subtitle="Outstanding customer invoices and application status">
        <Table
          columns={["Invoice", "Customer", "Due", "Original", "Balance", "Status"]}
          rows={ar.invoices.map((item) => [
            item.invoice_number,
            item.customer_name,
            date(item.due_date),
            money(item.amount_cents),
            money(item.balance_cents),
            <Status value={item.status} />,
          ])}
        />
      </Panel>
      {action && (
        <Dialog
          title={action === "invoice" ? "Create customer invoice" : "Record customer payment"}
          subtitle="The resulting accounting entry retains this workflow's audit lineage."
          close={() => setAction(null)}
        >
          <form className="form-stack" onSubmit={submit}>
            {action === "invoice" ? (
              <>
                <Field
                  label="Contract"
                  name="contract_id"
                  as="select"
                  options={saas.contracts.map((c) => [
                    c.id,
                    `${c.contract_number} · ${c.customer_name}`,
                  ])}
                />
                <div className="form-grid">
                  <Field
                    label="Invoice number"
                    name="number"
                    defaultValue={`INV-${Date.now().toString().slice(-6)}`}
                  />
                  <Field label="Amount" name="amount" type="number" min="0.01" step="0.01" />
                  <Field label="Invoice date" name="date" type="date" defaultValue={today} />
                  <Field label="Due date" name="due_date" type="date" defaultValue={today} />
                </div>
              </>
            ) : (
              <>
                <Field
                  label="Customer"
                  name="customer_id"
                  as="select"
                  options={saas.customers.map((c) => [c.id, c.name])}
                />
                <Field
                  label="Apply to invoice (optional)"
                  name="invoice_id"
                  as="select"
                  required={false}
                  options={[
                    ["", "Leave unapplied"],
                    ...open.map((i) => [i.id, `${i.invoice_number} · ${money(i.balance_cents)}`]),
                  ]}
                />
                <div className="form-grid">
                  <Field
                    label="Payment number"
                    name="number"
                    defaultValue={`PAY-${Date.now().toString().slice(-6)}`}
                  />
                  <Field label="Amount" name="amount" type="number" min="0.01" step="0.01" />
                  <Field label="Received date" name="date" type="date" defaultValue={today} />
                  <Field
                    label="Method"
                    name="method"
                    as="select"
                    options={[
                      ["ach", "ACH"],
                      ["wire", "Wire"],
                      ["check", "Check"],
                      ["card", "Card"],
                    ]}
                  />
                </div>
                <Field label="Bank reference" name="reference" required={false} />
              </>
            )}
            <DialogActions close={() => setAction(null)} label="Post and save" />
          </form>
        </Dialog>
      )}
    </div>
  );
}

function BankClose({ can, notify }) {
  const resource = useLoad(
    () =>
      Promise.all([
        api("/api/bank-statements"),
        api("/api/reconciliation-exceptions"),
        api("/api/accounts"),
      ]),
    [],
  );
  const [showImport, setShowImport] = useState(false);
  if (resource.loading) return <Loading />;
  if (resource.error) return <LoadError error={resource.error} retry={resource.refresh} />;
  const [statements, exceptions, accounts] = resource.data;
  async function updateException(item, status) {
    try {
      await api(`/api/reconciliation-exceptions/${item.id}`, {
        method: "POST",
        body: {
          status,
          resolution:
            status === "resolved"
              ? "Reviewed and resolved in the close workbench."
              : "Assigned for investigation.",
        },
      });
      await resource.refresh();
      notify({ kind: "success", message: `Exception ${status}.` });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  async function importStatement(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/bank-statements/import", {
        method: "POST",
        body: {
          cash_account_id: Number(form.get("cash_account_id")),
          start_date: form.get("start_date"),
          end_date: form.get("end_date"),
          opening_cents: Math.round(Number(form.get("opening")) * 100),
          closing_cents: Math.round(Number(form.get("closing")) * 100),
          csv: form.get("csv"),
        },
      });
      setShowImport(false);
      await resource.refresh();
      notify({ kind: "success", message: "Bank statement validated, imported and matched." });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  return (
    <div className="module-flow">
      <ModuleBar
        title="Bank reconciliation & close"
        detail="Cash matching, assigned exceptions and evidence"
        action={
          can("operate") && (
            <button className="primary" onClick={() => setShowImport(true)}>
              Import statement
            </button>
          )
        }
      />
      <div className="two-column">
        <Panel title="Bank statements" subtitle="Imported statements and match status">
          <Table
            columns={["Period", "Closing", "Transactions", "Unmatched", "Status"]}
            rows={statements.map((item) => [
              `${date(item.start_date)} – ${date(item.end_date)}`,
              money(item.closing_cents),
              item.transaction_count,
              item.unmatched_count,
              <Status value={item.status} />,
            ])}
          />
        </Panel>
        <Panel title="Exception queue" subtitle="Resolve material differences before close">
          {exceptions.length ? (
            <div className="attention-list">
              {exceptions.map((item) => (
                <div className="attention exception" key={item.id}>
                  <div>
                    <strong>{label(item.kind)}</strong>
                    <small>
                      {item.reference} · {money(item.amount_cents)}
                    </small>
                  </div>
                  <Status value={item.status} />
                  {can("operate") && item.status === "open" && (
                    <button
                      className="small-button"
                      onClick={() => updateException(item, "acknowledged")}
                    >
                      Acknowledge
                    </button>
                  )}
                  {can("close") && item.status !== "resolved" && (
                    <button
                      className="small-button"
                      onClick={() => updateException(item, "resolved")}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No close exceptions" detail="All synchronized reconciliations agree." />
          )}
        </Panel>
      </div>
      {showImport && (
        <Dialog
          title="Import bank statement"
          subtitle="Validate a versioned CSV before matching it against posted cash entries."
          close={() => setShowImport(false)}
        >
          <form className="form-stack" onSubmit={importStatement}>
            <Field
              label="Cash account"
              name="cash_account_id"
              as="select"
              options={accounts
                .filter((account) => account.type === "asset")
                .map((account) => [account.id, `${account.code} · ${account.name}`])}
            />
            <div className="form-grid">
              <Field label="Start date" name="start_date" type="date" />
              <Field label="End date" name="end_date" type="date" />
              <Field label="Opening balance" name="opening" type="number" step="0.01" />
              <Field label="Closing balance" name="closing" type="number" step="0.01" />
            </div>
            <Field
              label="Statement CSV"
              name="csv"
              as="textarea"
              hint="Required columns: date, description and amount. Include external_id when available. Never paste bank credentials."
            />
            <DialogActions close={() => setShowImport(false)} label="Validate and import" />
          </form>
        </Dialog>
      )}
    </div>
  );
}

function Investments() {
  const resource = useLoad(() => api("/api/investments/overview"), []);
  if (resource.loading) return <Loading />;
  if (resource.error) return <LoadError error={resource.error} retry={resource.refresh} />;
  const value = resource.data;
  return (
    <div className="module-flow">
      <ModuleBar
        title="Investment subledger"
        detail="Positions, measurement models and ledger reconciliation"
      />
      <section className="kpi-grid">
        <Kpi label="Instruments" value={value.instruments.length} detail="Active and disposed" />
        <Kpi
          label="Carrying value"
          value={money(value.totals?.carrying_value_cents || 0)}
          detail="Subledger basis"
        />
        <Kpi
          label="Fair value"
          value={money(value.totals?.fair_value_cents || 0)}
          detail="Latest measurements"
        />
        <Kpi
          label="GL difference"
          value={money(value.reconciliation?.difference_cents || 0)}
          detail="Control reconciliation"
          warning={Boolean(value.reconciliation?.difference_cents)}
        />
      </section>
      <Panel
        title="Positions"
        subtitle="Accounting model, classification and current carrying value"
      >
        <Table
          columns={["Instrument", "Issuer", "Security", "Model", "Status"]}
          rows={value.instruments.map((item) => [
            item.instrument_number,
            item.issuer,
            label(item.security_type),
            label(item.accounting_model),
            <Status value={item.status} />,
          ])}
        />
      </Panel>
    </div>
  );
}
function FixedAssets() {
  const resource = useLoad(() => api("/api/fixed-assets/overview"), []);
  if (resource.loading) return <Loading />;
  if (resource.error) return <LoadError error={resource.error} retry={resource.refresh} />;
  const value = resource.data;
  return (
    <div className="module-flow">
      <ModuleBar
        title="Fixed-asset register"
        detail="PP&E, depreciation, CIP, impairment, disposals and ARO"
      />
      <section className="kpi-grid">
        <Kpi label="Assets" value={value.assets.length} detail="Register records" />
        <Kpi
          label="Gross PP&E"
          value={money(value.totals?.gross_carrying_cents || value.totals?.cost_cents || 0)}
          detail="Capitalized basis"
        />
        <Kpi
          label="Net book value"
          value={money(value.totals?.net_book_value_cents || 0)}
          detail="After depreciation"
        />
        <Kpi
          label="CIP"
          value={money(value.totals?.cip_cents || 0)}
          detail="Construction in progress"
        />
      </section>
      <Panel title="Asset register" subtitle="Class, custody, lifecycle status and carrying value">
        <Table
          columns={[
            "Asset",
            "Description",
            "Class",
            "Placed in service",
            "Net book value",
            "Status",
          ]}
          rows={value.assets.map((item) => [
            item.asset_number,
            item.description,
            item.class_code,
            date(item.placed_in_service_date),
            money(item.net_book_value_cents),
            <Status value={item.status} />,
          ])}
        />
      </Panel>
    </div>
  );
}
function Reports({ can, notify }) {
  const reports = [
    "trial_balance",
    "income_statement",
    "balance_sheet",
    "cash_flow",
    "comprehensive_income",
    "changes_in_equity",
  ];
  const jobs = useLoad(() => api("/api/jobs?limit=100"), []);
  const [asOf, setAsOf] = useState(today);
  useEffect(() => {
    const timer = setInterval(() => void jobs.refresh(), 3000);
    return () => clearInterval(timer);
  }, []);
  async function queueReport(type, format) {
    try {
      await api("/api/jobs/reports", { method: "POST", body: { type, format, as_of: asOf } });
      await jobs.refresh();
      notify({ kind: "success", message: `${label(type)} ${format.toUpperCase()} was queued.` });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  async function jobAction(job, action) {
    try {
      await api(`/api/jobs/${job.id}/${action}`, { method: "POST", idempotent: false });
      await jobs.refresh();
      notify({ kind: "success", message: `Job ${action === "retry" ? "requeued" : "cancelled"}.` });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  return (
    <div className="module-flow">
      <ModuleBar
        title="Financial statements"
        detail="Queue durable statement exports and track all report and connector work"
      />
      <Panel title="Export date" subtitle="Reports use posted entries through this as-of date">
        <Field
          label="As-of date"
          name="as_of"
          type="date"
          value={asOf}
          onChange={(event) => setAsOf(event.target.value)}
        />
      </Panel>
      <div className="report-grid">
        {reports.map((report) => (
          <article className="report-card" key={report}>
            <span aria-hidden="true">⌁</span>
            <div>
              <h2>{label(report)}</h2>
              <p>Generated from posted journals with current report mappings.</p>
            </div>
            <div className="button-row">
              <button
                className="secondary"
                disabled={!can("operate")}
                onClick={() => queueReport(report, "pdf")}
              >
                Queue PDF
              </button>
              <button
                className="secondary"
                disabled={!can("operate")}
                onClick={() => queueReport(report, "csv")}
              >
                Queue CSV
              </button>
            </div>
          </article>
        ))}
      </div>
      <Panel
        title="Background work"
        subtitle="Durable status, retry evidence and completed downloads"
      >
        {jobs.loading ? (
          <Loading />
        ) : jobs.error ? (
          <LoadError error={jobs.error} retry={jobs.refresh} />
        ) : (
          <Table
            columns={[
              "Created",
              "Kind",
              "Output",
              "Attempts",
              "Status",
              "Result or error",
              "Action",
            ]}
            rows={jobs.data.map((job) => [
              new Date(`${job.created_at}Z`).toLocaleString(),
              label(job.kind),
              job.artifact_filename || job.result?.sync_run_id || "—",
              `${job.attempts} / ${job.max_attempts}`,
              <Status value={job.status} />,
              job.last_error ||
                (job.result
                  ? `${job.result.rows ?? ""} ${job.result.rows ? "rows" : job.result.status || "complete"}`
                  : "—"),
              <div className="button-row">
                {job.has_artifact && (
                  <a className="small-button" href={`/api/jobs/${job.id}/download`}>
                    Download
                  </a>
                )}
                {["queued", "retry"].includes(job.status) && can("operate") && (
                  <button className="small-button" onClick={() => jobAction(job, "cancel")}>
                    Cancel
                  </button>
                )}
                {job.status === "dead_letter" && can("operate") && (
                  <button className="small-button" onClick={() => jobAction(job, "retry")}>
                    Retry
                  </button>
                )}
              </div>,
            ])}
          />
        )}
      </Panel>
    </div>
  );
}
function Administration({ auth, setAuth, notify }) {
  async function switchOrg(orgId) {
    try {
      const next = await api("/api/auth/switch-org", {
        method: "POST",
        body: { org_id: orgId },
        idempotent: false,
      });
      setAuth(next);
      notify({ kind: "success", message: `Switched to ${next.organization.name}.` });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }
  return (
    <div className="module-flow">
      <ModuleBar
        title="Workspace administration"
        detail="Identity, organization access and controlled configuration"
      />
      <div className="two-column">
        <Panel title="Signed-in identity">
          <DescriptionList
            items={[
              ["Name", auth.user.name],
              ["Email", auth.user.email],
              ["Role", label(auth.role)],
              ["Permissions", auth.permissions.map(label).join(", ")],
            ]}
          />
        </Panel>
        <Panel
          title="Organization access"
          subtitle="Tenant context comes only from verified membership"
        >
          <div className="attention-list">
            {auth.organizations.map((org) => (
              <div className="attention" key={org.org_id}>
                <span className="workspace-avatar small">{org.name.slice(0, 1)}</span>
                <div>
                  <strong>{org.name}</strong>
                  <small>{label(org.role)}</small>
                </div>
                {org.org_id === auth.organization.id ? (
                  <Status value="current" />
                ) : (
                  <button className="small-button" onClick={() => switchOrg(org.org_id)}>
                    Switch
                  </button>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">F</span>
      <span>Folio</span>
    </div>
  );
}
function Kpi({ label: name, value, detail, warning }) {
  return (
    <article className={`kpi-card${warning ? " warning" : ""}`}>
      <span>{name}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
function Panel({ title, subtitle, action, children }) {
  return (
    <section className="panel">
      {title && (
        <header>
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}
function ReviewValue({ label: name, value }) {
  return (
    <div>
      <span>{name}</span>
      <strong title={String(value)}>{value}</strong>
    </div>
  );
}
function ModuleBar({ title, detail, action }) {
  return (
    <section className="module-bar">
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
      {action && <div>{action}</div>}
    </section>
  );
}
function Table({
  columns,
  rows,
  caption,
  emptyTitle = "Nothing here yet",
  emptyDetail = "New records will appear here.",
}) {
  if (!rows.length) return <Empty title={emptyTitle} detail={emptyDetail} />;
  return (
    <div className="table-wrap">
      <table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => (
              <th scope="col" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, index) => (
                <td key={index}>{cell ?? "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Status({ value }) {
  const normalized = String(value || "unknown").toLowerCase();
  return <span className={`status status-${normalized.replaceAll(" ", "-")}`}>{label(value)}</span>;
}
function DescriptionList({ items }) {
  return (
    <dl className="description-list">
      {items.map(([term, value]) => (
        <React.Fragment key={term}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
function Empty({ title, detail }) {
  return (
    <div className="empty">
      <span aria-hidden="true">✓</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}
function Loading() {
  return <CenteredStatus title="Loading workspace" detail="Retrieving current accounting data…" />;
}
function CenteredStatus({ title, detail }) {
  return (
    <main className="centered-status" aria-live="polite">
      <span className="loader" />
      <h1>{title}</h1>
      <p>{detail}</p>
    </main>
  );
}
function LoadError({ error, retry }) {
  return (
    <Alert
      action={
        <button className="small-button" onClick={retry}>
          Try again
        </button>
      }
    >
      <strong>Could not load this module.</strong> {error}
    </Alert>
  );
}
function Alert({ children, action }) {
  return (
    <div className="alert" role="alert">
      <div>{children}</div>
      {action}
    </div>
  );
}
function Toast({ notice, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`toast toast-${notice.kind}`} role="status">
      <span>{notice.message}</span>
      <button onClick={onClose} aria-label="Dismiss notification">
        ×
      </button>
    </div>
  );
}
function Dialog({ title, subtitle, close, children }) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const closeHandlerRef = useRef(close);
  const returnFocusRef = useRef(document.activeElement);
  closeHandlerRef.current = close;
  useEffect(() => {
    const priorBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    titleRef.current?.focus();
    const handler = (event) => {
      if (event.key === "Escape") return closeHandlerRef.current();
      if (event.key !== "Tab") return;
      const focusable = [
        ...dialogRef.current.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => element.getClientRects().length);
      if (!focusable.length) return event.preventDefault();
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = priorBodyOverflow;
      returnFocusRef.current?.focus?.();
    };
  }, []);
  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <section
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <header>
          <div>
            <p className="eyebrow">CONTROLLED WORKFLOW</p>
            <h2 ref={titleRef} tabIndex="-1" id="dialog-title">
              {title}
            </h2>
            <p>{subtitle}</p>
          </div>
          <button ref={closeRef} className="icon-button" onClick={close} aria-label="Close dialog">
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function DialogActions({ close, label: actionLabel }) {
  return (
    <div className="dialog-actions">
      <button type="button" className="secondary" onClick={close}>
        Cancel
      </button>
      <button className="primary">{actionLabel}</button>
    </div>
  );
}
function Field({ label: fieldLabel, hint, as = "input", options = [], required = true, ...props }) {
  const Control = as;
  return (
    <label className="field">
      <span>{fieldLabel}</span>
      {Control === "select" ? (
        <select required={required} {...props}>
          {options.map(([value, text]) => (
            <option value={value} key={value}>
              {text}
            </option>
          ))}
        </select>
      ) : Control === "textarea" ? (
        <textarea rows={7} required={required} {...props} />
      ) : (
        <input required={required} {...props} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

const root = document.querySelector("#root");
if (root) createRoot(root).render(<App />);
