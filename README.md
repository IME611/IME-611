# E.I.L — Everything I Learned

E.I.L turns source material into a traceable, reviewable knowledge system and then publishes approved knowledge into a learner-facing journey.

## Product law

- Sources are evidence, not chapters.
- Canonical source text is immutable after ingestion; derived knowledge must remain traceable to exact evidence.
- Concepts and topics are deduplicated across sources.
- The learning path is dependency-driven and can grow beyond the 18-item foundation presentation.
- AI may suggest similarity, placement or image descriptions, but it never writes canonical truth by itself.
- Creator approval is required for canonical intake, relation resolution and learner publication.

## Current flow

`source / note / URL / file / image`
→ intake analysis
→ creator decision
→ canonical source + atomic extraction candidates
→ evidence-backed corpus map
→ creator-reviewed relations
→ dependency graph
→ creator-selected learning unit + preview
→ published learner cards + canonical source library

The repository seed contains 18 canonical foundation sources. They provide the current foundation journey; they are not a fixed ceiling on the corpus or learning units.

## Main boundaries

- `server/knowledge/` — canonical knowledge application/domain services.
- `database/migrations/` — forward-only PostgreSQL schema history. Production currently requires migrations 001–012.
- `api/` — 12 thin Vercel Function adapters. New capabilities should reuse an existing adapter unless the function budget changes deliberately.
- `src/features/editor/` — creator review/intake/publication UI.
- `src/features/journey/` and `src/features/knowledge-dashboard/` — learner journey and foundation presentation.
- `src/core/storage.ts` — browser-local preference/progress storage boundary.

See `ARCHITECTURE.md`, `AGENTS.md`, `api/README.md`, and `docs/engineering/LIVE_DB_RUNBOOK.md` for the detailed contracts.

## Local development

Node 24 is the CI baseline.

```bash
npm ci
npm run dev
```

Quality before merge:

```bash
npm run verify:private-beta
npm run build
```

Full deterministic knowledge regressions:

```bash
npm run knowledge:verify
```

## Database

Set `DATABASE_URL` only for the intended database. Production migrations are forward-only and checksum guarded.

```bash
npm run db:migrate
npm run db:health
```

Do not edit an already-applied migration. Add a new migration instead.

## Vercel production

Production uses the repository `vercel-build` script, not a plain frontend-only build:

```bash
npm run vercel-build
```

That path performs the single-deployment production preflight, migrations/DB quality checks once, deterministic regressions for every build unit, TypeScript compilation and the Vite build. The current Hobby deployment stays within 12 Node.js Functions.

Production: `https://ime-611.vercel.app`

## Intentional external / human boundaries

- Relation candidates can remain pending until the creator makes the semantic decision; they are not auto-approved.
- Native semantic/vision Gateway probes are optional. If Vercel AI Gateway billing is unavailable, deterministic/text-description fallbacks keep the intake path safe and canonical writes still require review.
- Visual taste decisions are separate from backend truth: learner UI may be redesigned without changing canonical knowledge rules.
