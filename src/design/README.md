# E.I.L UI Foundation

This directory owns presentation only. Product logic, knowledge logic, persistence, API behavior, provenance, review rules and learning-path behavior do not belong here.

## Current phase: accessibility-first reset

The previous visual system was intentionally removed. There is currently **no E.I.L visual theme**: no brand palette, Liquid Glass, gradients, decorative shadows, visual polish layer or welcome-screen pixel-match contract.

The active stylesheet graph is deliberately small:

- `foundation.css` — browser normalization, readable typography and native/system colors.
- `layout.css` — structural layout only.
- `responsive.css` — responsive behavior only.
- `accessibility.css` — keyboard focus, skip navigation, reduced motion, forced colors and touch targets.
- `index.css` — the only stylesheet imported by the application.

## Rules

1. Feature and domain code must not import CSS directly.
2. `src/main.tsx` imports only `src/design/index.css`.
3. A future visual design may replace this presentation layer without changing domain behavior.
4. Accessibility and information architecture are established before visual styling.
5. Do not add brand colors, glass, gradients, animation systems, decorative shadows or theme tokens until the creator approves a new design direction.
6. New CSS must describe either structure, responsiveness or accessibility during this phase.

## Accessibility baseline

The UI must remain operable with keyboard only, expose visible focus, support screen-reader landmarks and dialog semantics, provide a skip link, respect reduced-motion preferences, remain usable in forced-colors mode, and keep coarse-pointer targets at least 44px high.
