# Database

The database contract is migration-driven.

```text
database/
  migrations/     # forward-only canonical schema changes, applied in order
  verification/   # read-only SQL used to verify schema/data invariants
```

There is intentionally no standalone mutable `schema.sql`. The authoritative schema is the result of applying the ordered migrations recorded in `schema_migrations` with checksum verification.

Rules:
- Never edit an already-applied migration; add the next numbered migration.
- HTTP requests never create or migrate schema.
- Verification SQL must remain read-only.
- Production migration execution is owned by `scripts/db/run-migrations.mjs` and deployment preflight.
