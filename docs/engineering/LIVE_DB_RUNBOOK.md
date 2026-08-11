# E.I.L Live DB Migration & Golden Thread Runbook

## Preconditions
- Run only against the intended PostgreSQL database.
- `DATABASE_URL` must point to that database.
- Set `DATABASE_SSL=false` only when the target explicitly does not require TLS.
- Take a provider snapshot/backup before the first live migration.

## 1. Dry safety checks
```bash
npm install
npm run build
```

Confirm the target database manually before mutation:
```bash
node -e "const u=new URL(process.env.DATABASE_URL); console.log({host:u.hostname,database:u.pathname.slice(1),user:u.username})"
```

## 2. Apply migrations 001 + 002
```bash
DATABASE_URL='postgresql://...' npm run db:migrate
```

The runner:
- acquires an advisory migration lock;
- creates `schema_migrations`;
- stores a SHA-256 checksum per migration;
- skips already-applied migrations;
- aborts if an applied migration file later changes.

Migration 001 creates the canonical Knowledge Domain. Migration 002 is additive and preserves all legacy rows while creating explicit legacy-id -> canonical-UUID mappings.

## 3. Immediate health check
```bash
DATABASE_URL='postgresql://...' npm run db:health
```

Expected JSON:
```json
{
  "ok": true,
  "canonical_sources": 1,
  "canonical_fragments": 1,
  "mapped_sources": 1,
  "mapped_fragments": 1,
  "migrations_applied": 2
}
```
Counts will be larger on the real database. The critical condition is `ok: true` and `migrations_applied >= 2`.

Optional provider SQL console checks:
```sql
SELECT name, checksum, applied_at FROM schema_migrations ORDER BY applied_at;
SELECT COUNT(*) FROM sources;
SELECT COUNT(*) FROM source_fragments;
SELECT COUNT(*) FROM legacy_source_mappings;
SELECT COUNT(*) FROM legacy_fragment_mappings;
```

## 4. Backfill integrity verification
Run the read-only file in the provider SQL console:

`database/verification/002_verify_legacy_backfill.sql`

The first four result sets must return zero rows. The summary counts should show all legacy source/chunk rows mapped.

## 5. Golden Thread verification
This uses one real canonical fragment already present after backfill. It creates one evidence-backed Claim, one SUPPORTED Insight, one Experiment and one Reflection, then traces the Insight all the way back to the exact canonical fragment text.

```bash
DATABASE_URL='postgresql://...' npm run db:golden
```

Pass criteria:
- `ok: true`
- `insightStatus: "SUPPORTED"`
- non-empty `claimId`, `insightId`, `experimentId`, `reflectionId`
- `traceRows >= 1`
- the returned `fragmentPreview` belongs to the selected real source
- the exact evidence quote is present in the traced fragment

Combined command:
```bash
DATABASE_URL='postgresql://...' npm run db:verify
```

## 6. Definition of Done
Foundation Live DB is complete only when:
1. migrations 001 and 002 are recorded in `schema_migrations`;
2. backfill verification returns no mismatches or missing mappings;
3. Golden Thread returns a SUPPORTED Insight;
4. the Insight trace resolves to Claim -> Evidence -> SourceFragment -> Source;
5. the traced fragment contains the evidence quote used to construct the Claim.

## Rollback policy
The migrations are additive. Do not delete legacy tables during this stage. If a live verification fails after migration, keep the new canonical tables isolated, disable canonical ingestion (`EIL_CANONICAL_INGESTION` unset/false), inspect the failure, and correct via a new forward migration. Do not edit an already-applied migration because the migration runner will detect checksum drift.
