# E.I.L UI Foundation

This directory owns presentation only. Product logic, knowledge logic, persistence, API behavior, provenance, review rules and learning-path behavior do not belong here.

## Current phase: navigation-first visual direction

The full-product visual system is still intentionally restrained, but the creator has now approved a scoped visual direction for the **application shell and navigation hub**: calm light surfaces, dark navy emphasis, restrained gold accents, rounded navigation cards and subtle depth.

This approval is limited to the shell/navigation, saved-card collection and lightweight placeholder surfaces. The deeper learner journey, source/review surfaces and welcome experience remain structurally driven until their UX is reviewed separately. Liquid Glass and the removed legacy visual runtime remain out of scope.

The active stylesheet graph remains deliberately small:

- `foundation.css` — browser normalization, readable typography and native/system-color baseline.
- `layout.css` — product layout plus the approved navigation/saved-card presentation.
- `responsive.css` — responsive behavior and mobile shell presentation.
- `accessibility.css` — keyboard focus, skip navigation, reduced motion, forced colors and touch targets.
- `index.css` — the only stylesheet imported by the application.

## Rules

1. Feature and domain code must not import CSS directly.
2. `src/main.tsx` imports only `src/design/index.css`.
3. Product/domain behavior must remain independent from the visual layer.
4. New visual work is introduced only after an explicit product/UX decision; do not silently spread the current navigation styling into unrelated views.
5. Do not restore Liquid Glass, old visual primitives, duplicate theme systems or feature-owned CSS.
6. Keep the navigation shell accessible, replaceable and responsive without changing canonical knowledge or publication logic.

## Accessibility baseline

The UI must remain operable with keyboard only, expose visible focus, support screen-reader landmarks and dialog semantics, provide a skip link, respect reduced-motion preferences, remain usable in forced-colors mode, and keep coarse-pointer targets at least 44px high.
