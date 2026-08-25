# E.I.L Live DB Migration & Production Verification Runbook

## Preconditions

- Run only against the intended PostgreSQL database.
- `DATABASE_URL` must point to that database.
- Set `DATABASE_SSL=false` only when the target explicitly does not require TLS.
- Production schema changes are forward-only. Never edit an already-applied migration.
- Take a provider backup/snapshot before a risky provider-level change; normal E.I.L migrations are additive/compatibility-preserving unless a new migration explicitly documents otherwise.

## Reproducible local checks

CI uses Node 24 and the committed lockfile.

```bash
npm ci
npm run verify:private-beta
npm run build
```

For live DB commands, confirm the target manually before mutation:

```bash
node -e "const u=new URL(process.env.DATABASE_URL); console.log({host:u.hostname,database:u.pathname.slice(1),user:u.username})"
```

## Apply canonical migrations

```bash
DATABASE_URL='postgresql://...' npm run db:migrate
```

The runner currently contains canonical migrations **001–012** and:

- acquires a PostgreSQL advisory migration lock;
- creates/uses `schema_migrations`;
- stores a SHA-256 checksum per migration;
- skips already-applied migrations;
- aborts if an applied migration file changes;
- strips conflicting URL SSL mode query parameters before applying the explicit TLS policy.

Do not manually mark migrations as applied. Do not edit migration checksums.

## Immediate health

```bash
DATABASE_URL='postgresql://...' npm run db:health
```

On the current seed database the important conditions are:

- `ok: true`
- `canonical_sources >= 18`
- `canonical_fragments >= 18`
- `extraction_candidates > 0`
- `migrations_applied >= 12`

Counts may grow as creator-approved sources are added.

Useful ledger check:

```sql
SELECT name, checksum, applied_at
FROM schema_migrations
ORDER BY applied_at, name;
```

## Canonical corpus quality gates

Production preflight runs the live DB checks automatically. To run the main read-only corpus integrity gate directly:

```bash
DATABASE_URL='postgresql://...' node scripts/knowledge/verify-quality-gates.mjs
```

Current gate family: `CORPUS_QUALITY_GATES_V0_5`.

Zero-failure invariants include:

- every active extraction candidate has evidence;
- exact candidate/evidence quotes match source text;
- claims are evidence-backed;
- approved relations cannot have unresolved endpoints;
- review decisions remain attributable/referential;
- intake review status and canonical source links remain consistent;
- published sources/cards have stable learning-unit keys and titles;
- published cards stay inside creator-selected candidates and 40–90 words;
- learner visibility does not leak unpublished repository candidates;
- no fixed `1..18` chapter constraint remains on canonical publication;
- legacy review compatibility schema exists and is migration-owned;
- migrations 001–012 are ledgered with valid checksums.

## Atomic extraction schema verification

```bash
DATABASE_URL='postgresql://...' npm run db:verify-extraction
```

This executes the read-only verification SQL under `database/verification/`.

## Golden thread

The historical Golden Thread verifies Claim → Evidence → SourceFragment → Source plus experiment/reflection traceability against a real canonical fragment:

```bash
DATABASE_URL='postgresql://...' npm run db:golden
```

Use it when modifying the foundational canonical claim/evidence model. It is not a substitute for the newer corpus/intake/publication quality gates.

## Production deployment behavior

Vercel Production runs:

```bash
npm run vercel-build
```

The first Function build unit that claims the deployment lock runs remote migrations and live DB quality checks. Other build units skip the duplicate remote work but still run deterministic regressions, TypeScript and Vite. This avoids running migrations/DB audits 12 times per deployment.

Expected Production log pattern:

```text
Production prebuild: remote preflight claimed (...)
Production prebuild: ensuring canonical migrations 001-012.
...
CORPUS_QUALITY_GATES_V0_5
PASS ...
```

Subsequent build units should say the remote preflight was already claimed.

## Post-deploy verification

After the exact merged deployment is `READY`:

1. confirm `https://ime-611.vercel.app/` returns 200;
2. call `/api/reviews?mode=backend-health` without paid probes and require `ok:true`;
3. require health checks for migrations 010/011/012 and `reviewBoundarySchema` to be true;
4. confirm `semanticProbe` and `visionProbe` are `null` when not requested;
5. confirm an unknown review mode returns 404 and the legacy no-mode review route returns 401 without creator credentials;
6. check Vercel runtime errors;
7. verify the deployment still reports 12 Node.js Functions.

Do not run paid semantic/vision probes merely to make a deployment look green.

## Rollback policy

Prefer forward fixes. If a deployment is bad but the migration succeeded safely, revert/roll back application code and add a new forward migration if schema correction is required. Never rewrite an applied migration to simulate rollback; checksum verification will reject drift.
