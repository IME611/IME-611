# E.I.L UI Foundation — Accessibility First

## Status

The former visual system has been intentionally removed. This phase is not a redesign. It establishes a stable, neutral product surface before any new visual language is chosen.

## Current contract

- No brand palette.
- No Liquid Glass.
- No gradients, decorative shadows, bokeh, visual polish or motion system.
- No feature-specific theme CSS.
- Domain logic, APIs, persistence, provenance, learning graph and review rules stay unchanged.
- The active presentation layer contains only foundation, layout, responsive behavior and accessibility.

## Accessibility baseline

- Semantic `main`, `nav`, `aside`, `section`, headings and form labels.
- Keyboard skip link to `#main-content`.
- Visible `:focus-visible` treatment using system colors.
- Active navigation announces `aria-current="page"`.
- Dialogs retain `role="dialog"`, `aria-modal`, focus trapping, Escape close and focus restoration.
- `prefers-reduced-motion` disables non-essential motion.
- `forced-colors` is supported.
- Coarse-pointer interactive targets are at least 44px high.
- Layout remains usable from 320px mobile widths through desktop.

## Styling boundary

`src/main.tsx` imports only `src/design/index.css`.

`src/design/index.css` imports only:

1. `foundation.css`
2. `layout.css`
3. `responsive.css`
4. `accessibility.css`

No feature may import presentation CSS directly.

## Next phase

Before choosing colors, materials, typography personality or animations, review the product in this neutral state and fix:

1. information architecture,
2. navigation hierarchy,
3. naming and labels,
4. task flows,
5. desktop/mobile ergonomics,
6. accessibility gaps.

Only after those are approved should a new visual design system be introduced.
