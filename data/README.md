# Repository data artifacts

This root-level `data/` directory contains server-side repository artifacts. It is separate from `src/data/`, which is learner presentation/fallback data.

- `chapters.part01.b64` … `chapters.part05.b64` — compressed/base64 corpus parts loaded by `server/shared/corpus.js`. They collectively preserve the 18-source foundation corpus used by repository/bootstrap logic.
- `content-map.json` — point-in-time repository content mapping/reference artifact. It is not a replacement for the live canonical PostgreSQL knowledge graph.

Rules:
- Do not edit corpus parts casually; canonical source integrity matters.
- Do not move these files without updating the server corpus loader and regression checks in the same change.
- New live canonical knowledge belongs in PostgreSQL through the reviewed intake/extraction/publication pipeline, not as ad-hoc JSON files here.
