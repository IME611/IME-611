# Repository Map — E.I.L

Think of the repository as a cabinet. Each drawer has one responsibility and should be replaceable without opening unrelated drawers.

## Product / UI
`src/app/` — composition, routing/navigation, feature unlock orchestration.

`src/core/` — shared domain contracts, stable types, persistence adapters. No React presentation.

`src/features/`
- `dashboard/` — current state and journey overview.
- `journey/` — the 18-layer spiral learning experience and full-source reader.
- `knowledge/` — source ingestion/library-facing UI.
- `synthesis/` — connections, insights, mentor-facing UI.
- `evolution/` — awareness, experiments, reflection.
- `shell/` — sidebar/mobile/global shell.

`src/design/` — **all visual styling**. This drawer is intentionally isolated so future redesigns do not alter product logic.

`src/data/` — static/fallback product data and the authored learning path. Future migration target: split by `journey/`, `taxonomy/`, and `fallback/` subfolders.

`src/lib/` — pure technical helpers with no product meaning.

## Backend
`api/` — stable public HTTP route adapters. File paths here are URL contracts, so keep them thin rather than moving them casually.

`server/shared/` — backend infrastructure shared by domains (canonical corpus loader etc.).

Future server drawers:
- `server/knowledge/` — corpus, sources, ingestion.
- `server/synthesis/` — atlas, matching, insights, mentor retrieval/synthesis.
- `server/evolution/` — user learning/experiment state once moved server-side.

## Canonical data
`data/` — server-side canonical corpus artifacts and source mapping. Never replace these with summaries.

`database/` — persistence schema/contracts.

## Documentation
`docs/product/` — what E.I.L means and how the learning loop works.
`docs/engineering/` — architecture decisions, repository maps, migrations, deployment notes.

## Change routing
Before editing, identify the drawer:
- visual change → `src/design/`
- journey order/question logic → `src/features/journey/` + authored journey data
- navigation/unlocks → `src/app/`
- source preservation/import → `server/knowledge/` or thin `api/` adapter
- connection/insight/mentor algorithms → `server/synthesis/`
- shared type or persistence contract → `src/core/`

If a change requires editing three unrelated drawers, first ask whether a missing abstraction is causing the coupling.
