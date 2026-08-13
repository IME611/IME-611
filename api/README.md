# API Route Map

The files in this folder are **public route adapters**. Keep them thin: validate the transport, call a domain/service boundary, map the result to HTTP, and translate known failures into stable status codes.

The deployed Hobby target intentionally stays at **8 Serverless Functions**. Compatibility URLs that no longer have their own function are preserved with Vercel rewrites.

## Knowledge / source domain
- `chapters.js` — serves the 18 canonical chapter sources.
- `import.js` — canonical source ingestion only; no legacy table creation or alternate chunking path.
- `knowledge.js` — consolidated knowledge transport for canonical sources, knowledge items, inbox state, crystal favorites, and taxonomy assignments.

Compatibility rewrites:
- `/api/items` → `/api/knowledge?resource=items`
- `/api/inbox` → `/api/knowledge?resource=inbox`
- `/api/documents` → `/api/knowledge?resource=documents`
- `/api/sources` → `/api/knowledge?resource=sources`

## Synthesis domain
- `atlas.js` — connection / knowledge-map data.
- `insights.js` — cross-source derived patterns and evidence. It also hosts `?mode=core-loop`, `?mode=dashboard`, and `?mode=match` transports.
- `mentor.js` — source-grounded question answering.
- `reviews.js` — review / synthesis workflow.

Compatibility rewrite:
- `/api/match` → `/api/insights?mode=match`

## System domain
- `health.js` — operational health endpoint.

## Route design rule
A route adapter should do only four things:
1. validate request shape,
2. call a domain/service/repository boundary,
3. translate the result into HTTP,
4. map known errors to stable status codes.

Do not create or migrate tables during a request. Do not place UI policy in API routes. Do not mutate canonical source material in derived endpoints. New persistence must be introduced by additive SQL migrations under `database/migrations/`.
