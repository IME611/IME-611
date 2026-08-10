# Static Product Data

This folder currently contains authored/fallback frontend data. It is not the canonical source corpus.

Target drawers:
- `journey/` — authored learning path, stage/world labels, question bridges.
- `taxonomy/` — knowledge categories and topic taxonomy.
- `fallback/` — fallback chapter metadata/text used only when the source API is unavailable.

Rules:
- Canonical source text lives in server-side `data/` and must remain intact.
- Frontend fallback data must never silently become the source of truth.
- Authored journey logic is product configuration; keep it separate from generated synthesis.
- When moving a data file, update imports in the same commit and verify a preview build before deleting the old path.
