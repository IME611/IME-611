# UI baseline

The previous visual design system has been removed.

This directory currently contains only:
- `system.css` — functional browser/layout normalization needed to keep the product usable while UX is rebuilt.
- `accessibility.css` — focus, reduced-motion, touch-target and assistive-technology rules.
- `index.css` — the single stylesheet entry point imported by the application.

No product palette, decorative effects, Liquid Glass, gradients, shadows, visual tokens, or branded component styling should be added until the information architecture, navigation, interaction model, responsive behavior and accessibility pass are complete.

Product/domain logic must remain outside this directory.
