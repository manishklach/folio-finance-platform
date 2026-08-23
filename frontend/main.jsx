import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";

let csrfToken = "";
const today = new Date().toISOString().slice(0, 10);
const money = (value = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100);
const date = (value) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString() : "—");
const label = (value = "") => String(value).replaceAll("_", " ");

async function api(path, { method = "GET", body, idempotent = true } = {}) {
  const headers = { Accept: "application/json" };
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
  ["reports", "Reports", "⌁"],
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
              can("admin") ? (
                item.status === "configured" ||
                item.status === "paused" ||
                item.status === "error" ? (
                  <button className="small-button" onClick={() => changeStatus(item, "active")}>
                    Activate
                  </button>
                ) : item.status === "active" ? (
                  <button className="small-button" onClick={() => changeStatus(item, "paused")}>
                    Pause
                  </button>
                ) : (
                  "—"
                )
              ) : (
                "—"
              ),
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
    </div>
  );
}

function Imports({ can, notify }) {
  const resource = useLoad(
    () =>
      Promise.all([
        api("/api/imports/templates"),
        api("/api/imports/batches"),
        api("/api/imports/exceptions"),
        api("/api/accounts"),
      ]),
    [],
  );
  const [showStage, setShowStage] = useState(false);
  const [templateKey, setTemplateKey] = useState("chart_of_accounts");
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  if (resource.loading) return <Loading />;
  if (resource.error) return <LoadError error={resource.error} retry={resource.refresh} />;
  const [templates, batches, exceptions, accounts] = resource.data;
  const selectedTemplate = templates.find((item) => item.key === templateKey) || templates[0];

  async function stage(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const options =
        templateKey === "bank_transactions"
          ? {
              cash_account_id: Number(form.get("cash_account_id")),
              start_date: form.get("start_date"),
              end_date: form.get("end_date"),
              opening_cents: Math.round(Number(form.get("opening")) * 100),
              closing_cents: Math.round(Number(form.get("closing")) * 100),
            }
          : {};
      const batch = await api("/api/imports/stage", {
        method: "POST",
        body: {
          template_key: templateKey,
          filename: form.get("filename"),
          csv: form.get("csv"),
          options,
        },
      });
      setPreview(batch);
      setShowStage(false);
      await resource.refresh();
      notify({ kind: "success", message: "Import validated and staged for review." });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function openBatch(id) {
    try {
      setPreview(await api(`/api/imports/batches/${id}`));
    } catch (error) {
      notify({ kind: "error", message: error.message });
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
      const applied = await api(`/api/imports/batches/${preview.id}/apply`, {
        method: "POST",
        body: {},
      });
      setPreview(applied);
      await resource.refresh();
      notify({
        kind: "success",
        message: `${applied.applied_count} validated rows applied with retained lineage.`,
      });
    } catch (error) {
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
      await resource.refresh();
      notify({ kind: "success", message: "Import exception resolved." });
    } catch (error) {
      notify({ kind: "error", message: error.message });
    }
  }

  return (
    <div className="module-flow">
      <ModuleBar
        title="Controlled imports"
        detail="Versioned templates, validation previews, duplicate controls and traceable application"
        action={
          can("operate") && (
            <button className="primary" onClick={() => setShowStage(true)}>
              Stage import
            </button>
          )
        }
      />
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
          value={exceptions.filter((item) => item.status === "open").length}
          detail="Validation or apply issues"
          warning={exceptions.some((item) => item.status === "open")}
        />
      </section>
      <div className="two-column">
        <Panel
          title="Import batches"
          subtitle="Files remain staged until an operator reviews the preview"
        >
          <Table
            columns={["File", "Template", "Rows", "Valid", "Exceptions", "Status", "Review"]}
            rows={batches.map((item) => [
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
          <Table
            columns={["Code", "Severity", "Message", "Status", "Action"]}
            rows={exceptions.slice(0, 20).map((item) => [
              label(item.code),
              <Status value={item.severity} />,
              item.message,
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
                ["Status", <Status value={preview.status} />],
              ]}
            />
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
          <Table
            columns={["CSV row", "Natural key", "Status", "Validation result", "Created record"]}
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
        </Panel>
      )}
      {showStage && (
        <Dialog
          title="Stage a controlled import"
          subtitle="Nothing is applied until validation completes and you approve the row preview."
          close={() => setShowStage(false)}
        >
          <form className="form-stack" onSubmit={stage}>
            <Field
              label="Template"
              name="template_key"
              as="select"
              value={templateKey}
              onChange={(event) => setTemplateKey(event.target.value)}
              options={templates.map((item) => [item.key, `${item.name} · v${item.version}`])}
            />
            <Field label="Source filename" name="filename" placeholder={`${templateKey}.csv`} />
            {templateKey === "bank_transactions" && (
              <>
                <Field
                  label="Cash account"
                  name="cash_account_id"
                  as="select"
                  options={accounts
                    .filter((account) => account.type === "asset")
                    .map((account) => [account.id, `${account.code} · ${account.name}`])}
                />
                <div className="form-grid">
                  <Field label="Statement start" name="start_date" type="date" />
                  <Field label="Statement end" name="end_date" type="date" />
                  <Field label="Opening balance" name="opening" type="number" step="0.01" />
                  <Field label="Closing balance" name="closing" type="number" step="0.01" />
                </div>
              </>
            )}
            <Field
              label="CSV data"
              name="csv"
              as="textarea"
              placeholder={selectedTemplate.sample_header}
              hint={`Expected mapped headers: ${selectedTemplate.fields.map((item) => item.key).join(", ")}. Formula-like text is rejected.`}
            />
            <DialogActions
              close={() => setShowStage(false)}
              label={busy ? "Validating…" : "Validate and preview"}
            />
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
function Reports() {
  const reports = [
    "trial_balance",
    "income_statement",
    "balance_sheet",
    "cash_flow",
    "comprehensive_income",
    "changes_in_equity",
  ];
  return (
    <div className="module-flow">
      <ModuleBar
        title="Financial statements"
        detail="Date-bounded, posted-ledger reports in reviewable and portable formats"
      />
      <div className="report-grid">
        {reports.map((report) => (
          <article className="report-card" key={report}>
            <span aria-hidden="true">⌁</span>
            <div>
              <h2>{label(report)}</h2>
              <p>Generated from posted journals with current report mappings.</p>
            </div>
            <div className="button-row">
              <a className="secondary" href={`/api/reports/${report}.pdf`}>
                PDF
              </a>
              <a className="secondary" href={`/api/reports/${report}.csv`}>
                CSV
              </a>
            </div>
          </article>
        ))}
      </div>
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
function Panel({ title, subtitle, children }) {
  return (
    <section className="panel">
      {title && (
        <header>
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
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
function Table({ columns, rows }) {
  if (!rows.length)
    return <Empty title="Nothing here yet" detail="New records will appear here." />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
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
  useEffect(() => {
    closeRef.current?.focus();
    const handler = (event) => event.key === "Escape" && close();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);
  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <header>
          <div>
            <p className="eyebrow">CONTROLLED WORKFLOW</p>
            <h2 id="dialog-title">{title}</h2>
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
