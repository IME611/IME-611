# E.I.L Agent / Engineer Map

Read `ARCHITECTURE.md` before changing structure.

## Start here by task
- App boot / routing / shell orchestration → `src/app/`
- Sidebar / mobile navigation → `src/features/shell/`
- Dashboard / current state → `src/features/dashboard/`
- 18-layer learning journey / full source reader → `src/features/journey/`
- Sources / ingestion / corpus → `src/features/knowledge/` and `api/knowledge/`
- Connections / insights / mentor → `src/features/synthesis/` and `api/synthesis/`
- Focus / experiments / reflection → `src/features/evolution/`
- Persistence contracts → `src/core/storage.ts`
- Domain types → `src/core/types.ts`
- Static learning path → `src/data/`
- Liquid Glass / typography / responsive system → `src/styles/`

## Non-negotiable rules
- Never destroy or replace source text with a summary.
- Derived content must stay traceable to source where possible.
- Do not reveal advanced tools earlier just because they exist; respect progressive disclosure.
- Do not add new global CSS version files. Extend the design system instead.
- Do not access `localStorage` directly in new feature code; use the storage adapter.
- Do not hardcode navigation/unlock rules inside feature components; centralize them in app navigation/policy.
- Avoid importing feature internals across feature boundaries.

## Current migration state
The repository is being migrated incrementally from a flat `src/` layout. During migration, some compatibility files may remain at old paths. New work must use the target folders described above.

## Product loop
`Question → Learn → Connect → Understand → Awareness → Experiment → Reflect → Revisit question`

If a proposed feature does not strengthen this loop, challenge why it belongs in E.I.L before implementing it.
