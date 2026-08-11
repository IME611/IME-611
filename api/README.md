# API Route Map

The files in this folder are **public route adapters**. Their filenames are part of the deployed URL contract (`/api/<name>`), so do not move them casually into nested folders: doing so changes route URLs and can break the frontend.

The long-term architecture is to keep these files thin and move reusable/domain logic to `server/` folders.

## Knowledge / source domain
- `chapters.js` — serves the 18 canonical chapter sources.
- `documents.js` — document access/metadata.
- `import.js` — source ingestion and preservation.
- `inbox.js` — incoming knowledge workflow.
- `items.js` — knowledge item collection.
- `sources.js` — source-level views/metadata.

## Synthesis domain
- `atlas.js` — connection/knowledge-map data.
- `insights.js` — cross-source derived patterns and evidence. It also hosts the canonical Core Loop transport under `?mode=core-loop` so the Hobby deployment remains within the 12-function limit; the actual Core Loop logic remains in `server/synthesis/`.
- `match.js` — matching/overlap logic.
- `mentor.js` — source-grounded question answering.
- `reviews.js` — review/synthesis workflow.

## System domain
- `health.js` — operational health endpoint.

## Route design rule
A route adapter should eventually do only four things:
1. validate request shape,
2. call a domain service from `server/`,
3. translate service result into HTTP response,
4. map known errors to stable HTTP status codes.

Do not place UI logic or user-interface policy here. Do not mutate canonical source material in derived endpoints.
