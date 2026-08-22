import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";

const modules = {
  Ledger: "/api/journals",
  Accounts: "/api/accounts",
  "Contracts & Revenue": "/api/saas/overview",
  "Receivables & Collections": "/api/receivables",
  Reports: "/api/saas/overview",
  "Close & Controls": "/api/reconciliation-exceptions",
  "Admin & Users": "/api/ai/history",
};

function App() {
  const [auth, setAuth] = useState(null);
  const [active, setActive] = useState("Contracts & Revenue");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/auth/me").then(async (response) => {
      if (response.ok) setAuth(await response.json());
    });
  }, []);
  useEffect(() => {
    if (!auth) return;
    setError("");
    fetch(modules[active])
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error);
        setData(await response.json());
      })
      .catch((caught) => setError(caught.message));
  }, [active, auth]);
  if (!auth) return null;
  const visible = Object.keys(modules).filter(
    (name) =>
      auth.role !== "read_only" ||
      ["Accounts", "Contracts & Revenue", "Receivables & Collections", "Reports"].includes(name),
  );
  return (
    <section className="module-console" aria-label="Accounting modules">
      <header>
        <div>
          <span className="eyebrow">COMPONENT WORKSPACE</span>
          <h2>{active}</h2>
        </div>
        <span className="role-chip">{auth.role.replace("_", " ")}</span>
      </header>
      <nav aria-label="Module navigation">
        {visible.map((name) => (
          <button
            key={name}
            aria-current={active === name ? "page" : undefined}
            onClick={() => setActive(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      {active === "Reports" && <ReportLinks />}
      {error ? <p role="alert">{error}</p> : <DataSurface value={data} />}
    </section>
  );
}

function ReportLinks() {
  return (
    <div className="report-links" aria-label="Financial statement downloads">
      {["trial_balance", "income_statement", "balance_sheet", "cash_flow"].flatMap((report) =>
        ["pdf", "csv"].map((format) => (
          <a key={`${report}.${format}`} href={`/api/reports/${report}.${format}`}>
            {report.replaceAll("_", " ")} {format.toUpperCase()}
          </a>
        )),
      )}
    </div>
  );
}

function DataSurface({ value, depth = 0 }) {
  if (value == null) return <p aria-live="polite">Loading...</p>;
  if (Array.isArray(value))
    return (
      <div className="data-grid">
        {value.map((item, index) => (
          <DataSurface key={item?.id ?? index} value={item} depth={depth + 1} />
        ))}
      </div>
    );
  if (typeof value === "object")
    return (
      <dl className={depth < 2 ? "data-card" : "data-details"}>
        {Object.entries(value).map(([key, item]) => (
          <React.Fragment key={key}>
            <dt>{key.replaceAll("_", " ")}</dt>
            <dd>
              {typeof item === "object" && item !== null ? (
                <DataSurface value={item} depth={depth + 1} />
              ) : (
                String(item ?? "-")
              )}
            </dd>
          </React.Fragment>
        ))}
      </dl>
    );
  return <span>{String(value)}</span>;
}

const mount = document.querySelector("#react-console");
if (mount) createRoot(mount).render(<App />);
