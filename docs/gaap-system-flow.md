# Folio GAAP engine flow

This document shows how accounting facts become controlled journals, financial statements, disclosures, reconciliations, and SaaS metrics. It reflects the implemented repository flow rather than a conceptual target architecture.

## End-to-end accounting flow

```mermaid
flowchart LR
    start([Economic event])

    subgraph inputs ["Source facts and evidence"]
        contractFacts[/"Contracts, invoices and cash"/]
        workforceFacts[/"Awards, payroll and commissions"/]
        assetFacts[/"Leases, software, debt and acquisitions"/]
        estimateFacts[/"Tax, forecasts, valuations and legal matters"/]
    end

    subgraph governance ["Identity and accounting governance"]
        authCheck{Authenticated member?}
        tenantScope[Bind organization scope]
        policyCheck{Policy or judgment needed?}
        policyRecord[/"Approved basis and evidence"/]
    end

    subgraph engines ["Measurement and subledgers"]
        transactionEngine["Revenue and receivables"]
        scheduleEngine["Lease, award and debt schedules"]
        estimateEngine["Tax, CECL, fair value and contingencies"]
        entityEngine["FX, combinations and consolidation"]
    end

    subgraph ledger ["Controlled general ledger"]
        journalDraft[Draft balanced journal]
        validationGate{Journal valid?}
        approvalGate{Posting authorized?}
        periodGate{Period open?}
        postedLedger[(Immutable posted ledger)]
        auditEvidence[(Hash and audit log)]
    end

    subgraph outputs ["Close and reporting outputs"]
        reconcile["Subledger and GL reconciliations"]
        closeGate{Close checks complete?}
        statements["Six financial statements"]
        disclosures["Topic disclosures and judgments"]
        saasMetrics["SaaS metrics and operating views"]
        externalReview[/"Accountant and auditor review"/]
    end

    start --> contractFacts & workforceFacts & assetFacts & estimateFacts
    contractFacts & workforceFacts & assetFacts & estimateFacts --> authCheck
    authCheck -->|"No"| denied([Request denied])
    authCheck -->|"Yes"| tenantScope
    tenantScope --> policyCheck
    policyCheck -->|"Yes"| policyRecord
    policyRecord --> transactionEngine & scheduleEngine & estimateEngine & entityEngine
    policyCheck -->|"No"| transactionEngine & scheduleEngine & estimateEngine & entityEngine
    transactionEngine & scheduleEngine & estimateEngine & entityEngine --> journalDraft
    journalDraft --> validationGate
    validationGate -->|"No"| rejected([Validation exception])
    validationGate -->|"Yes"| approvalGate
    approvalGate -->|"No"| journalDraft
    approvalGate -->|"Yes"| periodGate
    periodGate -->|"Closed"| rejected
    periodGate -->|"Open"| postedLedger
    postedLedger --> auditEvidence
    postedLedger --> reconcile
    reconcile --> closeGate
    closeGate -->|"Incomplete"| journalDraft
    closeGate -->|"Complete"| statements & disclosures & saasMetrics
    auditEvidence --> externalReview
    statements & disclosures & saasMetrics --> externalReview

    style inputs fill:#C2E5FF,stroke:#3DADFF
    style governance fill:#FFECBD,stroke:#FFC943
    style engines fill:#DCCCFF,stroke:#874FFF
    style ledger fill:#C6FAF6,stroke:#5AD8CC
    style outputs fill:#CDF4D3,stroke:#66D575
    style denied fill:#FFCDC2,stroke:#FF7556
    style rejected fill:#FFCDC2,stroke:#FF7556
```

## Period-close operating flow

```mermaid
flowchart TD
    periodStart([Begin reporting period])
    cutoff[Set period and cutoff dates]
    ingest[Import and enter source facts]
    completeness{Sources complete?}
    exceptions[Resolve missing or duplicate data]
    transact[Post invoices, cash and operating activity]
    schedules[Run revenue, lease, award, debt and software schedules]
    estimates[Run tax, CECL, fair value, FX and contingency estimates]
    judgments[Approve Topic judgments and disclosures]
    reconcileAr[Reconcile AR, unbilled, deferred and unapplied cash]
    reconcileCash[Reconcile bank and cash]
    consolidate[Revalue FX and post eliminations]
    trialBalance[Review trial balance]
    balanced{Balanced and supported?}
    corrections[Draft controlled corrections]
    checklist[Complete close checklist]
    closePeriod[Close accounting period]
    reporting[Generate statements and disclosures]
    signoff[/"External validation and sign-off"/]
    finish([Reporting package complete])

    periodStart --> cutoff --> ingest --> completeness
    completeness -->|"No"| exceptions
    exceptions --> ingest
    completeness -->|"Yes"| transact
    transact --> schedules --> estimates --> judgments
    judgments --> reconcileAr --> reconcileCash --> consolidate --> trialBalance
    trialBalance --> balanced
    balanced -->|"No"| corrections
    corrections --> schedules
    balanced -->|"Yes"| checklist --> closePeriod --> reporting --> signoff --> finish

    style completeness fill:#FFECBD,stroke:#FFC943
    style balanced fill:#FFECBD,stroke:#FFC943
    style exceptions fill:#FFCDC2,stroke:#FF7556
    style corrections fill:#FFCDC2,stroke:#FF7556
    style closePeriod fill:#C6FAF6,stroke:#5AD8CC
    style finish fill:#CDF4D3,stroke:#66D575
```

## Topic routing flow

```mermaid
flowchart LR
    facts[/New accounting facts/]
    topic{Applicable area?}
    revenue["ASC 606 and 340-40"]
    operating["ASC 350, 718 and 842"]
    estimates["ASC 326, 450, 740 and 820"]
    capital["ASC 470, 480, 805 and 810"]
    reporting["ASC 205, 220, 230, 260, 830 and 855"]
    assess{Deterministic measurement?}
    calculate[Run accounting engine]
    judgment[/Record approved judgment/]
    journal{Journal required?}
    draft[Create balanced draft]
    evidence[(Retain evidence only)]
    controls[Apply posting controls]
    package[Statements and disclosures]

    facts --> topic
    topic -->|"Customer contract"| revenue
    topic -->|"People or assets"| operating
    topic -->|"Estimate or valuation"| estimates
    topic -->|"Capital or control"| capital
    topic -->|"Presentation or event"| reporting
    revenue & operating & estimates & capital & reporting --> assess
    assess -->|"Yes"| calculate
    assess -->|"No"| judgment
    judgment --> calculate
    calculate --> journal
    journal -->|"Yes"| draft --> controls --> package
    journal -->|"No"| evidence --> package

    style topic fill:#FFECBD,stroke:#FFC943
    style assess fill:#FFECBD,stroke:#FFC943
    style journal fill:#FFECBD,stroke:#FFC943
    style judgment fill:#DCCCFF,stroke:#874FFF
    style controls fill:#C6FAF6,stroke:#5AD8CC
    style package fill:#CDF4D3,stroke:#66D575
```

## How to read the diagrams

- Blue input areas are source facts supplied by integrations or accounting users.
- Yellow diamonds are control or judgment gates; the engine does not invent missing facts.
- Violet steps are Topic-specific measurement or accountable judgment work.
- Teal steps are deterministic ledger controls.
- Green outputs are reporting artifacts; they remain subject to external accounting validation.
- Red endpoints represent rejected requests, validation exceptions, or correction loops.

For field-level detail, use the [GAAP API reference](gaap-api.md). For Topic scope and control ownership, use the [coverage matrix](gaap-coverage-matrix.md).

## Implementation traceability

| Layer | Implementation | Responsibility | Primary verification |
| --- | --- | --- | --- |
| Tenant ledger | `lib/db.js` | Core accounts, balanced drafts, authorized posting, as-of trial balance, immutable posted records and hashes | `test/ledger.test.js`, `test/tenancy.test.js` |
| SaaS accounting | `lib/saas.js` | ASC 606 contracts and schedules, invoices, payments, AR reconciliation, commissions, software, metrics, FX and eliminations | `test/saas.test.js` |
| GAAP engines | `lib/gaap.js` | Topic measurement tables, policy/judgment evidence, journals, schedules, remeasurements and disclosures | `test/gaap.test.js` |
| Close operations | `lib/operations.js` | Fiscal configuration, bank reconciliation, evidence attachments, close checklist and exception queue | `test/production.test.js` |
| Financial reports | `lib/reports.js` | Six statement models plus CSV/PDF rendering and cutoff parameters | `test/production.test.js`, `test/gaap.test.js` |
| Identity control plane | `lib/platform.js` | Users, organizations, roles, memberships, sessions, CSRF, idempotency and platform audit | `test/auth.test.js`, `test/api.test.js` |
| HTTP boundary | `server.js` | Authenticated tenant binding, permissions, GAAP routes, report routes and webhook controls | `test/api.test.js`, `test/tenancy.test.js` |
| User workspace | `frontend/main.jsx` | Role-aware modules, GAAP overview and downloadable statement links | Production build gate |
