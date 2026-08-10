# E.I.L Design Drawer

This folder owns **presentation only**. Product logic, knowledge logic, persistence, API behavior, and journey rules must never live here.

## Rule of isolation
- Application code imports only `src/design/index.css`.
- Feature code must not import CSS files directly.
- A redesign can replace this entire folder without changing domain behavior.
- Do not add `v5`, `v6`, `final-final` style files. Consolidate into named responsibilities.

## Drawers
- `foundations/` — base layout/reset and progressive-display presentation.
- `features/` — temporary feature-specific presentation while components are being normalized.
- `glass/` — Liquid Glass material system.
- `glass/legacy/` — historical passes preserved only so behavior stays stable during migration.
- `glass/current.css` — current visual authority; loaded last.

## Target state
The legacy glass passes will be collapsed into:
- `tokens.css` — colors, radii, spacing, blur, shadows, material variables.
- `typography.css` — one text system.
- `material.css` — reusable Liquid Glass surfaces.
- `components/` — visual primitives such as panel/button/sidebar/search.
- `responsive.css` — viewport-specific presentation.

Design changes must be possible without touching `src/app`, `src/core`, `src/features/*` business logic, `server/`, or `api/`.
