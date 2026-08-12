# E.I.L Agent / Engineer Map

Read `ARCHITECTURE.md` before changing structure.
Read `docs/engineering/FRONTEND_CONSTITUTION.md` before changing frontend architecture, React components, state, API clients, accessibility, or design-system boundaries.

## Start here by task
- App boot / routing / shell orchestration → `src/app/`
- Sidebar / mobile navigation → `src/features/shell/`
- Dashboard / current state → `src/features/dashboard/`
- 18-layer learning journey / full source reader → `src/features/journey/`
- Sources / ingestion / corpus → `src/features/knowledge/` and `server/knowledge/`
- Connections / insights / mentor / provenance-backed synthesis → `src/features/synthesis/` and `server/synthesis/`
- Focus / experiments / reflection / transformation → `src/features/evolution/` and `src/features/transformation/`
- LearningPath contracts and progress → `src/core/learning-path/` and `src/data/learning-paths/`
- Persistence contracts → `src/core/` and feature-local repository ports
- Liquid Glass / typography / responsive / all visual-system work → `src/design/`
- Public HTTP adapters → `api/` (keep thin; reusable logic belongs in `server/`)

## Non-negotiable product/domain rules
- Never destroy or replace source text with a summary.
- Derived content must remain traceable to canonical source/evidence where the backend supports provenance.
- Frontend must never invent Domain Truth. UI cannot promote an Insight to `SUPPORTED`, declare provenance complete, or bypass evidence validation.
- If canonical provenance is unavailable, fail safely as draft/hypothesis/unknown; never fabricate certainty.
- Do not reveal advanced tools earlier just because they exist; respect progressive disclosure.
- Do not hardcode navigation/unlock rules inside feature components; use LearningPath/app policy.

## Non-negotiable frontend rules
- Feature-owned components, hooks, API clients, types, utilities, state, and tests should be co-located.
- Components render/interact; hooks coordinate frontend behavior; services own HTTP; utilities stay pure; Domain owns truth/invariants.
- Avoid direct raw `fetch()` calls scattered through presentation components.
- Do not add Zustand, TanStack Query, Context, memoization, or another dependency speculatively; add them when a real ownership/performance problem justifies them.
- Do not pass raw `setState`/`dispatch` through component APIs; expose intent callbacks.
- New/touched data-driven UI handles loading, error, empty, success, and unavailable states where relevant.
- Accessibility is required: semantic HTML, keyboard operation, focus-visible, labels, contrast, and reduced-motion considerations.
- Avoid `any` in new TypeScript; prefer `unknown` + validation at boundaries.
- TSX files around 150 lines should be reviewed for responsibility; 250 lines is a warning threshold, not a reason for artificial splitting.

## Design-system rules
- All visual-system work belongs under `src/design/`.
- Do not add new global CSS version files such as `liquid-glass-v5.css`.
- Extend canonical tokens/primitives instead.
- Feature/domain logic must not depend on Liquid Glass or any other theme.
- Visual changes must remain replaceable without rewriting Knowledge, LearningPath, Synthesis, or Transformation logic.

## Repository / migration rules
- Do not access `localStorage` directly in new feature code; use the relevant repository/storage adapter.
- Avoid importing feature internals across feature boundaries.
- Public files in `api/` are deployed URL adapters; keep them thin and do not casually create new routes when an existing adapter can safely multiplex the application action.
- Check Vercel Preview/Build before merging changes that affect runtime or deployment shape.
- The repository is being migrated incrementally from older flat structures. New work uses the target folders above; improve legacy code when touched rather than pausing product delivery for purity refactors.

## Product loop
`Question → Learn → Connect → Understand → Awareness → Experiment → Reflect → Revisit question`

If a proposed feature does not strengthen this loop, challenge why it belongs in E.I.L before implementing it.

## Frontend change checklist
Before merging new or materially changed frontend work, confirm:
- Domain/Provenance authority is preserved.
- Feature code is co-located and responsibilities are clear.
- Server state and local UI state are not duplicated accidentally.
- Loading/error/empty/unavailable states are explicit.
- The interaction is keyboard accessible and readable.
- No unnecessary dependency, abstraction, CSS version layer, or state manager was introduced.
- Preview/build passes.

`docs/engineering/FRONTEND_CONSTITUTION.md` is the detailed source of truth for these frontend rules.
