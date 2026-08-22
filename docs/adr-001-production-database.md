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
