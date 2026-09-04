# E.I.L Agent / Engineer Map

Read `ARCHITECTURE.md` before changing structure or domain boundaries.
Read `docs/engineering/FRONTEND_CONSTITUTION.md` before changing learner/editor React architecture, state, API clients, accessibility, or UI-foundation boundaries.
Read `docs/engineering/LIVE_DB_RUNBOOK.md` before changing migrations or production DB checks.

## Start here by task

- App orchestration → `src/app/App.tsx`
- Production navigation / route allowlist → `src/features/navigation/`
- Home surface (currently intentionally empty) → `src/features/knowledge-dashboard/`
- Foundation + dynamic learner journey → `src/features/journey/`
- Learner source library / intake modal → `src/features/sources/`
- Creator review / relation resolution / publication placement → `src/features/editor/`
- Browser-local persistence → `src/core/storage.ts` and feature-owned adapters
- Canonical intake / extraction / overlap / corpus map / relations / learning / publication → `server/knowledge/`
- PostgreSQL schema history → `database/migrations/`
- Live DB and deterministic verification → `scripts/db/`, `scripts/knowledge/`, `scripts/quality/`
- Public HTTP adapters → `api/` (12 deployed Vercel Functions; keep thin and multiplex safely)
- UI foundation + approved navigation-shell presentation → `src/design/`

## Non-negotiable product/domain rules

- Sources are evidence, not chapters. The 18 seed sources are a foundation presentation, not a canonical ceiling.
- Never overwrite, shorten, or replace canonical source text with a summary.
- Active derived knowledge must remain traceable to exact source evidence.
- Frontend must never invent Domain Truth or mark uncertain provenance as supported.
- Concepts/topics are deduplicated across sources; source order does not define the ontology.
- Learning sequence is dependency-driven and unbounded. Never reintroduce a fixed `1..18` canonical learning-unit constraint.
- Intake approval, unresolved relation decisions, and learner publication remain creator-controlled.
- AI semantic/vision output is advisory only. It cannot become evidence or bypass review.
- Source approval and learner publication are separate gates.
- Unknown review modes fail closed before DB access.

## Frontend / product-surface rules

- `src/features/navigation/navigation.config.ts` is the single production route allowlist.
- Do not expose dormant prototypes by accepting arbitrary hash routes. Unknown/unauthorized routes normalize to the dashboard.
- Creator content must enter through the canonical intake workflow; do not add local-only note/upload dead ends that look like corpus ingestion.
- Components render/interact; domain services own canonical truth.
- New/touched data-driven UI handles loading, error, empty, success and unavailable states where relevant.
- Accessibility is required: semantic HTML, keyboard operation, focus-visible, labels, contrast and reduced-motion considerations.
- Avoid `any` in new TypeScript; prefer validated `unknown` at boundaries.
- Do not add state libraries, query libraries or dependencies speculatively.
- Do not keep dormant/replaced implementations under `src`; the frontend reachability guard treats Git history as the archive.

## Persistence rules

- Do not access `localStorage` directly from app/feature presentation code; use `src/core/storage.ts` or a dedicated feature adapter.
- Stable storage keys belong in one adapter, not scattered string literals.
- Browser-local preferences/progress are presentation/user state; they are never canonical knowledge.

## API / security rules

- Top-level `api/*.js` files are deployed URL adapters. Keep business logic in `server/`.
- The Hobby project currently has a 12-Function budget. Reuse an existing adapter unless a deliberate platform change is approved.
- Creator-only routes must authorize **before** database access or mutation.
- Public health endpoints are read-only.
- HTTP requests must never create/migrate tables. New persistence is introduced only through additive files under `database/migrations/`.
- Apply schema changes forward-only; never edit an already-applied migration because checksums are enforced.
- Do not weaken hardening/auth or log secrets/raw sensitive payloads for diagnostics.
- Do not keep unreachable backend implementations under `server`; every server module must be reachable from an API or intentional script entry point.

## Build / deployment rules

- CI baseline is Node 24.
- Use the committed lockfile and `npm ci` for reproducible installs.
- Run `npm run verify:private-beta` and `npm run build` before merge.
- Production uses `npm run vercel-build`, which performs the production preflight and deterministic regressions.
- Check the exact-head Vercel Preview before merge and the exact merged Production deployment afterward.
- Production preflight must retain single-deployment migration/DB execution; do not reintroduce duplicate live DB checks per Function build unit.

## UI-foundation rules during the UX rebuild

- `src/design/index.css` is the single CSS entry point.
- `foundation.css` and `accessibility.css` remain neutral system-level baselines.
- The creator has approved a scoped visual direction for the navigation shell, menu cards, saved-card collection and lightweight placeholders: calm light surfaces, dark navy emphasis, restrained gold accents, rounded cards and subtle depth.
- Do not spread that styling into the journey, source/review surfaces or welcome experience without an explicit UX/design decision for those views.
- Do not restore Liquid Glass, old visual primitives, duplicate theme layers or feature-owned CSS.
- Product/domain logic must remain outside `src/design/`.
- Visual presentation must remain replaceable without rewriting canonical knowledge or publication logic.

## Definition of done for autonomous engineering work

Before declaring a technical change complete:

1. deterministic regression coverage exists for the invariant being changed;
2. GitHub quality gate is green on the exact head;
3. Vercel Preview is READY on that same head;
4. merge uses the expected head SHA;
5. Production is READY on the merged commit;
6. relevant live HTTP/DB behavior is verified without unsafe writes;
7. runtime errors are checked;
8. no canonical content, relation decision, publication decision, or paid AI action was fabricated to make a test green.

Human creator decisions (for example semantic relation approval) and subjective visual taste are not replaced by automation.
