# Frontend product data

This folder contains the authored/fallback data that is currently reachable from the learner frontend. It is presentation data, not the canonical source corpus.

Current contents:
- `chapters-embedded.ts` — embedded foundation source/chapter material used by the learner experience and as an offline/fallback catalogue.
- `chapters.ts` — active chapter presentation metadata used by the authored learning path.
- `learning-path.ts` — presentation labels, questions and ordering metadata.
- `learning-paths/` — typed learning-path definitions used by journey state/progress.

Rules:
- Canonical source truth lives server-side and must never be replaced by frontend fallback data.
- Do not keep superseded chapter/taxonomy snapshots here; Git history is the archive.
- New static frontend data belongs here only when it is intentionally imported by the production entry graph.
- The frontend reachability guard will fail the build if an implementation/data module under `src` becomes orphaned.
