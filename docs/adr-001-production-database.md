# ADR-001: SQLite for the initial production topology

Status: accepted for single-node launch; revisit before horizontal scaling.

Folio retains SQLite for the initial production topology because journal writes are short,
transactional, and organization databases are physically isolated. WAL mode, a five-second busy
timeout, `BEGIN IMMEDIATE` write serialization, versioned control-plane migrations, and checkpointed
snapshots provide a defensible small-scale operating model.

This decision does **not** approve shared-disk clustering or multiple application writers. Move the
control plane and organization ledgers to PostgreSQL before horizontal application scaling, managed
high availability, or write throughput exceeds the single-node load-test envelope. That migration
must preserve integer-cent amounts, foreign keys, posted-entry guards, canonical hashes, and tenant
isolation tests.

## Tenant isolation decision

Folio deliberately uses a control-plane database for identities, organizations, memberships and sessions, plus one physical SQLite ledger database per organization. This is stronger than placing all customers in shared tables and relying on every query author to remember `WHERE org_id = ?`. A repository is created only from the database path resolved through the authenticated membership; request bodies cannot select that path. Every tenant table still carries a non-null UUID `org_id` as defense-in-depth, and opening a database with a different organization UUID fails.

Consequently, ledger repository functions are organization-bound at construction instead of accepting a repeated `orgId` argument. Multi-organization membership and verified organization switching are supported in the control plane. Any future PostgreSQL consolidation into shared tables must change the repository contract to require explicit organization scope on every call and must keep the cross-tenant test suite green.
