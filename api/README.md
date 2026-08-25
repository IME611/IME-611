# API Route Map

Top-level files in `api/` are deployed Vercel Function adapters. Keep them thin: validate transport/auth, call a service/repository boundary, and map results/errors to HTTP. Domain logic belongs under `server/`.

The current Hobby deployment intentionally stays at **12 Node.js Functions**. Do not add a thirteenth top-level `api/*.js` file accidentally; multiplex compatible operations through an existing adapter or make a deliberate platform/budget change.

## Current deployed adapters

- `health.js` — operational health.
- `chapters.js` — curated 18-item foundation presentation compatibility API; not the canonical corpus ceiling.
- `knowledge.js` — consolidated source/items/inbox/document transport. Vercel rewrites expose `/api/sources`, `/api/items`, `/api/inbox`, and `/api/documents` through this adapter.
- `import.js` — authenticated creator ingestion transport into the canonical intake/source pipeline.
- `reviews.js` — creator intake/review/relation/publication console plus read-only intake/backend health modes.
- `corpus-map.js` — corpus map views.
- `relation-summary.js` — relation summary/diagnostic views.
- `learning-graph.js` — dependency graph and learner-safe dynamic publication resources.
- `learning-health.js` — learning graph/sequence health.
- `atlas.js` — connection-map transport retained for supported API consumers.
- `insights.js` — evidence-backed insight/match/core-loop compatibility transport.
- `mentor.js` — source-grounded mentor/query transport.

## Review mode security

`reviews.js` has an explicit mode allowlist.

Creator-authorized modes:
- `intake`
- `relation-resolution`
- `publication-placement`
- `console`
- legacy no-mode compatibility

Public read-only modes:
- `intake-health`
- `backend-health`

Unknown modes return `404 REVIEW_MODE_NOT_FOUND` **before database access**. Creator-only routes authorize before DB access. The retained legacy `knowledge_reviews` table is migration-owned (migration 012); requests never create schema.

## Canonical source / publication distinction

The repository seed currently contains 18 canonical foundation sources, but they are sources rather than a fixed chapter ontology. Learner presentation may use numeric foundation aliases. New learner publication uses stable `learning_unit_key` + creator-controlled `learning_unit_title` and is not limited to 18 units.

Approving a source into the canonical repository does not automatically publish learner cards.

## Route design rule

A route adapter should do only these things:

1. validate method, parameters, payload size and auth where required;
2. call an application/domain/service/repository boundary;
3. translate the result into HTTP;
4. map known failures to stable status codes.

Do not:
- create or migrate tables during a request;
- place learner UI policy in API adapters;
- mutate canonical source material from derived endpoints;
- let semantic/AI suggestions bypass creator review;
- expose a new Function when an existing adapter can safely host the resource/action.

New persistence is introduced by additive SQL migrations under `database/migrations/` and verified by the Production preflight/quality gates.
