# Frontend feature boundaries

`src/features` contains only learner/creator features that are reachable from the production frontend entry point.

Current drawers:

- `accessibility/` — reusable interaction accessibility helpers such as dialog focus management.
- `crystals/` — personal saved insights and the crystal collection UI/state.
- `editor/` — creator review and publication controls.
- `journey/` — learning sequence, cards, source exhibits, progress and journey state.
- `knowledge-dashboard/` — learner home/current progress overview.
- `navigation/` — the single production navigation configuration and desktop/mobile navigation shells.
- `sources/` — source intake and canonical source reading UI.
- `welcome/` — the semantic entry screen before the learner enters the product.

## Rules

1. A feature folder must own a product responsibility that is currently reachable from `src/main.tsx`.
2. Do not keep dormant, replaced or experimental product implementations in `src/features`. Git history is the archive.
3. Shared product/domain contracts belong in `src/core`; presentation-neutral layout/accessibility CSS belongs in `src/design`.
4. Do not create duplicate feature concepts (for example two dashboard implementations). Extend or replace the existing owner explicitly.
5. Feature internals may use `model/`, `data/`, `services/`, `hooks/` or `components/` only when those subfolders express a real responsibility.
6. The prebuild reachability audit fails when implementation files under `src` are no longer reachable from the production entry point.

Keep the tree small enough that the correct home for a change is obvious without searching through abandoned alternatives.
