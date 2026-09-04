# E.I.L Architecture

## Product thesis

E.I.L is a corpus-first knowledge system with a learner-facing product on top.

The system accepts source material, preserves canonical source truth, extracts atomic evidence-backed knowledge, deduplicates concepts across sources, asks the creator to resolve uncertain/semantic decisions, builds an emergent dependency graph, and publishes only explicitly approved material to learners.

The 18 repository seed sources currently provide a curated foundation journey. They are **not** the ontology, chapter ceiling, or required order for future knowledge.

## Non-negotiable invariants

1. **Source truth is immutable.** Canonical source text is never rewritten by summaries, AI, UI or publication.
2. **Evidence is traceable.** Active extraction candidates and canonical claims must resolve to exact source evidence.
3. **Sources are not chapters.** Presentation may use legacy chapter aliases, but canonical placement uses stable learning-unit keys.
4. **Taxonomy is emergent.** Concepts and section-topic units are derived from the corpus and deduplicated across sources.
5. **Sequence is dependency-driven.** Source upload order and fixed chapter count do not define the learning graph.
6. **AI has advisory authority only.** Semantic matching and multimodal descriptions can assist review; they cannot bypass creator decisions or become evidence by themselves.
7. **Publication is a separate gate.** Approving a source into the repository does not automatically expose learner cards.
8. **Frontend is presentation.** UI state may choose views and local preferences; it does not invent canonical domain truth.
9. **Unknown write/review routes fail closed.** Creator-only review surfaces require authorization before database access.
10. **Schema changes are forward-only migrations.** HTTP requests never create/migrate tables.
11. **Dormant code is not architecture.** Replaced/unreachable frontend or server implementations are removed; Git history is the archive.

## Knowledge flow

```text
input
  text | topic | note | URL | PDF/DOCX/TXT/MD/CSV/JSON/HTML/XML | image
      ↓
intake normalization + overlap analysis
      ↓
creator review: approve / change / reject
      ↓
canonical Source + SourceFragments
      ↓
atomic ExtractionCandidates + exact Evidence
      ↓
corpus map: canonical concepts + section-topic units
      ↓
RelationCandidates
      ↓
creator endpoint/relation review
      ↓
learning dependency graph
      ↓
creator publication placement + learner-facing title + preview
      ↓
published learning cards + canonical source library
```

## Repository boundaries

```text
server/
  knowledge/
    application/     # intake, extraction, matching, relations, learning, publication, quality
    domain/          # knowledge-domain contracts where present
    infrastructure/  # persistence/external infrastructure where present
  shared/            # shared PostgreSQL/corpus infrastructure
  synthesis/         # synthesis/connection behavior separate from canonical source truth

database/
  migrations/        # forward-only canonical migrations (currently 001–012)
  verification/      # read-only schema/data verification SQL

api/                 # 12 thin Vercel route adapters; multiplex when possible
  _lib/              # HTTP hardening + creator auth helpers

src/
  app/               # application orchestration only
  core/              # shared types + browser storage adapter
  data/              # curated foundation presentation/fallback data
  features/
    navigation/      # single production route/navigation allowlist
    knowledge-dashboard/
    journey/
    sources/
    editor/
    crystals/
    accessibility/
    welcome/
  lib/               # small shared browser utilities only
  design/            # neutral structural/responsive/accessibility UI baseline

scripts/
  db/                 # migrations, health, production preflight
  knowledge/          # deterministic corpus/domain regressions
  quality/            # product/security/build/repository-structure guards
```

## Dependency direction

- `api/` validates transport and delegates to `server/` services; it does not own domain truth or schema creation.
- `server/knowledge/` does not depend on learner React code.
- learner/editor features may call public API boundaries and shared `src/core` adapters.
- feature code should not write `localStorage` directly; browser persistence goes through `src/core/storage.ts` or a dedicated feature adapter.
- production navigation is declared only in `src/features/navigation/navigation.config.ts`. Unknown/unauthorized hashes normalize to the dashboard.
- CSS enters through `src/design/index.css`.
- `src/design/` contains no product domain logic and currently carries no branded visual theme.
- frontend implementation must be reachable from `src/main.tsx`; server implementation must be reachable from `api/` or an intentional `scripts/` entry point.

## Canonical vs presentation identity

Legacy foundation material may carry numeric chapter/source numbers for compatibility. New publication uses:

- `learning_unit_key` — stable machine identity;
- `learning_unit_title` — creator-controlled learner-facing title;
- optional `legacy-chapter:N` aliases for the foundation presentation.

No service may restore a `1..18` ceiling for canonical learning units.

## Review / AI authority

Creator decisions are required at the boundaries where semantic uncertainty can change truth:

- intake approval/rejection/change;
- unresolved relation endpoints and relation approval;
- publication candidate selection, learning-unit placement and publish action.

AI Gateway capability is optional at runtime. When unavailable, deterministic concept-aware matching and creator-supplied image descriptions are safe fallbacks. A configured provider is not reported as a successful live probe unless a probe was explicitly requested and passed.

## Runtime / deployment

- PostgreSQL migrations are checksum recorded in `schema_migrations` and protected by an advisory lock.
- The database schema is migration-driven; there is no parallel mutable `schema.sql` authority.
- Production preflight runs migrations + live DB quality once per Vercel deployment; deterministic code regressions run for every function build unit.
- The Vercel Hobby project currently uses 12 Node.js Functions. Do not add a thirteenth adapter accidentally; reuse/multiplex existing routes.
- Production build entrypoint is `npm run vercel-build`.
- `verify:private-beta` and production prebuild both enforce frontend/server reachability so dead implementations cannot accumulate silently.

## Definition of healthy architecture

An engineer or agent should be able to locate the authoritative boundary quickly:

- source/corpus truth: `server/knowledge/` + PostgreSQL canonical tables;
- migrations: `database/migrations/`;
- production quality: `scripts/knowledge/verify-quality-gates.mjs` + `scripts/quality/run-prebuild.mjs`;
- learner journey: `src/features/journey/`;
- route allowlist: `src/features/navigation/navigation.config.ts`;
- creator review/publication UI: `src/features/editor/`;
- local browser state: `src/core/storage.ts` and dedicated feature adapters;
- API contract map: `api/README.md`;
- repository folder map: `docs/engineering/REPOSITORY_MAP.md`;
- live database operations: `docs/engineering/LIVE_DB_RUNBOOK.md`.
