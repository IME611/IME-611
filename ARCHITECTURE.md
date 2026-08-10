# E.I.L Architecture

## Product thesis
E.I.L is not a document manager and not a generic productivity dashboard. It is a personal-evolution system that turns accumulated source material into a guided process:

**Question → Source → Understanding → Connection → Insight → Awareness → Experiment → Reflection → Deeper understanding.**

The canonical source is preserved in full. Interpretation is always layered on top and must remain traceable back to source material.

## Core product invariants
1. **Source of truth stays intact.** Never overwrite, shorten, or mutate the original source when generating summaries, insights, learning blocks, or recommendations.
2. **Learning precedes intervention.** A new user should not see advanced reflection/action tools before enough context has been built.
3. **Progressive disclosure is product logic, not decoration.** Features unlock because the learner has enough context, not because a menu happens to be hidden.
4. **Every derived insight should be traceable.** Evidence should point back to chapter/source/paragraph whenever possible.
5. **The journey is cumulative and spiral-shaped.** Later layers revisit earlier questions with a richer model.
6. **Actions are experiments, not to-do items.** The goal is feedback and learning, not task completion for its own sake.
7. **Design is a system.** Liquid Glass must come from reusable primitives/tokens, not one-off CSS overrides per screen.

## Target repository structure

```text
src/
  app/                  # bootstrap, shell orchestration, navigation
  core/                 # cross-feature domain types + storage/contracts
  features/
    dashboard/          # current state / journey overview
    journey/            # 18-layer learning journey + reader
    knowledge/          # ingestion, sources, corpus views
    synthesis/          # connections, insights, mentor
    evolution/          # focus, experiments, reflection
    shell/              # sidebar, mobile drawer, global navigation shell
  components/
    glass/               # reusable Liquid Glass primitives
    common/              # generic UI primitives
  data/                  # static learning path / fallback content
  lib/                   # pure utilities and infrastructure helpers
  styles/                # one CSS entrypoint + tokens/material/layout
  types/                 # only if domain types grow beyond core
api/
  knowledge/             # source/corpus endpoints
  synthesis/             # atlas/insights/mentor/matching
  system/                # health and operational endpoints
  _shared/               # shared API helpers

docs/
  product/               # product principles, journey model, terminology
  engineering/           # decisions, migrations, deployment notes
```

## Dependency direction
- `app` may depend on all features.
- features may depend on `core`, `components`, `data`, and `lib`.
- features should not import another feature's internals. Shared behavior moves to `core` or `components`.
- `components` must not depend on product-specific feature state.
- `core` must not depend on React view code.
- CSS enters the application through **one ordered entrypoint**: `src/styles/index.css`.

## State strategy
Today some state is browser-local (`localStorage`). Treat this as an adapter, not the domain model. All local storage access should eventually go through `src/core/storage.ts` so a future account/database implementation can replace the adapter without rewriting feature components.

Stable storage keys should be defined once. Avoid scattering `eil-*` string literals across components.

## Feature extension rule
When adding a feature:
1. Decide which stage of the E.I.L loop it belongs to.
2. Create a folder under `src/features/<feature>`.
3. Export a small public API from that feature folder.
4. Do not add global CSS selectors unless they are design-system primitives.
5. Add navigation/unlock rules centrally, not inside random components.
6. If it derives knowledge, preserve source references.
7. If it changes user state, isolate persistence behind an adapter.

## Design system rule
Do not create `liquid-glass-v5.css`, `v6`, etc. The migration target is:

```text
src/styles/
  tokens.css
  typography.css
  glass.css
  layout.css
  responsive.css
  index.css
```

Future glass components should share the same variables for blur, opacity, edge light, refraction highlight, caustic colors, radius, and shadow depth.

## Migration policy
Refactors happen on a branch and preserve production behavior. Prefer a compatibility period over a big-bang rewrite. Move entrypoints first, then components, then state adapters, then styles/API internals. Delete legacy files only after a successful build/preview proves that no imports remain.

## Definition of healthy architecture
A future engineer or AI agent should be able to answer these questions in under two minutes:
- Where is the journey logic? `src/features/journey`
- Where is feature unlock/navigation logic? `src/app/navigation.ts`
- Where is local persistence? `src/core/storage.ts`
- Where are source/corpus APIs? `api/knowledge`
- Where is synthesis logic? `api/synthesis` + `src/features/synthesis`
- Where is Liquid Glass defined? `src/styles/glass.css` / `src/components/glass`
- Where are product principles documented? `docs/product` and this file
