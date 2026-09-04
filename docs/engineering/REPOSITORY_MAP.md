# Repository Map — E.I.L

The repository is organized by responsibility. Production code should have one obvious home; obsolete alternatives are removed rather than kept beside the active implementation.

## Frontend

`src/main.tsx` — single browser entry point.

`src/app/` — application composition, route orchestration and top-level feature wiring.

`src/core/` — shared frontend domain contracts, stable types, errors and browser persistence. No visual styling.

`src/data/` — curated foundation presentation/fallback data that is still required by the learner product.

`src/features/`
- `accessibility/` — reusable accessibility interaction helpers.
- `crystals/` — saved learner insights and personal collection state/UI.
- `editor/` — creator review and publication controls.
- `journey/` — learning sequence, card reader, source evidence and learner progress.
- `knowledge-dashboard/` — learner home/current progress overview.
- `navigation/` — production navigation allowlist and desktop/mobile navigation.
- `sources/` — source intake and canonical source reader UI.
- `welcome/` — semantic entry screen.

`src/lib/` — small presentation-neutral browser utilities that are genuinely shared/reachable. Do not use this as a dumping ground for product logic.

`src/design/` — neutral UI foundation only: structural layout, responsive behavior and accessibility presentation rules. Product colors/effects are intentionally absent during the UX rebuild.

The frontend prebuild reachability audit starts at `src/main.tsx` and fails if implementation files under `src` become orphaned.

## Backend

`api/` — stable Vercel HTTP route adapters. File paths are public route contracts; keep adapters thin and preserve the 12-function budget.

`server/knowledge/` — canonical source, intake, extraction, matching, relations, learning, publication and quality domain/application logic.

`server/shared/` — infrastructure and helpers shared across server domains.

`server/synthesis/` — synthesis/connection logic that is intentionally separate from canonical source truth.

The server reachability audit treats `api/` and intentional `scripts/` as entry points and fails if implementation files under `server/` become orphaned.

## Canonical data and schema

`data/` — server-side canonical corpus artifacts and mappings. Never replace canonical source truth with summaries.

`database/migrations/` — forward-only schema migrations.

`database/verification/` — read-only schema/data verification SQL.

## Automation and quality

`scripts/db/` — migrations, live database health and deployment preflight.

`scripts/knowledge/` — deterministic knowledge/corpus regression checks and maintenance operations.

`scripts/quality/` — production, security, UI and repository-structure guards.

## Documentation

`docs/product/` — product model, learning architecture and corpus/product working documents.

`docs/engineering/` — current engineering contracts, repository map, UI foundation and operations runbooks.

Root documents (`README.md`, `ARCHITECTURE.md`, `AGENTS.md`, `DEPLOY.md`) describe the repository/product at the highest level.

## Change routing

- frontend orchestration → `src/app/`
- learner navigation → `src/features/navigation/`
- journey behavior/content presentation → `src/features/journey/`
- source intake/reading UI → `src/features/sources/`
- creator review/publication → `src/features/editor/`
- browser persistence/shared frontend contracts → `src/core/`
- generic browser utilities → `src/lib/` only when truly cross-feature
- structural/responsive/accessibility CSS → `src/design/`
- canonical knowledge/domain behavior → `server/knowledge/`
- stable HTTP transport → `api/`
- migrations → `database/migrations/`
- regression/quality enforcement → `scripts/`

If a change appears to require a new parallel implementation of an existing responsibility, consolidate the existing owner instead of adding another drawer.
