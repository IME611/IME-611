# E.I.L Design Drawer

This folder owns **presentation only**. Product logic, knowledge logic, persistence, API behavior, and journey rules must never live here.

## Rule of isolation
- Application styling enters through `src/design/index.css` only.
- Feature code must not import CSS files directly.
- A redesign can replace this entire folder without changing domain behavior.
- Visual React primitives may live under `src/design/primitives/`, but they must remain stateless and domain-agnostic.
- Do not add `v5`, `v6`, or `final-final` style files. Consolidate into named responsibilities.

## Canonical drawers
- `primitives/tokens.css` — color, blur, translucency, borders, radii, shadows, motion and layout tokens.
- `primitives/primitives.css` — reusable Liquid Glass material behavior.
- `primitives/Glass.tsx` — stateless visual primitives: `GlassSurface`, `GlassCard`, `GlassNavigation`, `GlassButton`, `GlassInput`, `GlassTextarea`, `GlassModal`.
- `foundations/` — base layout/reset and progressive-display presentation.
- `features/` — feature-specific layout only; no domain logic.
- `glass/system.css` — Stage 5 visual authority for the complete product, loaded last.
- `glass/legacy/` and `glass/current.css` — historical compatibility layers; never extend these with new design decisions.

## Liquid Glass contract
Every primary surface uses the same optical model: translucent background sampling, strong top-edge reflection, soft chromatic refraction, restrained inner rim, deep shadow separation, and motion that shifts the highlight rather than moving the content aggressively.

Typography prioritizes readability over spectacle. Long-form source text remains high contrast and stable; provenance, callouts, actions and navigation receive stronger glass treatment. `prefers-reduced-motion` disables non-essential movement.

## Design boundary
Design changes must be possible without touching `src/core`, `server/`, `api/`, persistence rules, provenance rules, or LearningPath logic. Feature files may consume stateless visual primitives, but the primitives may never import from a feature or domain module.
