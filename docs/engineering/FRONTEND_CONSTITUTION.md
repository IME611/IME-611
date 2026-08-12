# E.I.L Frontend Engineering Constitution

This document is the default engineering standard for all frontend work in E.I.L. It applies to human engineers and AI agents unless a task explicitly documents a justified exception.

## 0. Prime Directive: Frontend Never Invents Domain Truth

The frontend is a presentation and interaction layer. It must never create, promote, or reinterpret canonical knowledge state on its own.

- `SUPPORTED`, `HYPOTHESIS`, provenance completeness, evidence validity, and claim validity are Domain/Backend decisions.
- UI code may display server/domain state, but must not recreate the Provenance Guard in React.
- A local draft can remain a draft/hypothesis. It must never become canonical simply because the UI considers it complete.
- Every user-facing derived claim should be able to reach its canonical source/evidence when the backend supports that trace.
- Failure to reach provenance must fail safely: show uncertainty or a hypothesis state; never fabricate certainty.

## 1. Organize by Feature and Co-locate What Changes Together

Feature-specific components, hooks, API clients, types, state, utilities, and tests belong together.

Preferred shape:

```text
src/features/transformation/
  components/
  hooks/
  model/
  services/
  tests/
  TransformationWorkspace.tsx
```

Promote code to `src/lib/`, `src/core/`, or shared design primitives only after genuine cross-feature reuse emerges. Do not create global `/hooks`, `/utils`, or `/types` dumping grounds for feature-owned code.

## 2. Strict Feature Boundaries

- Features do not import another feature's internal files.
- Cross-feature collaboration goes through public contracts, domain services, or promoted shared abstractions.
- UI must not reach directly into database concerns.
- Backend/domain rules live under `server/`; frontend adapters live with the feature that consumes them.

## 3. Separation of Concerns

### Components
Render UI and handle user interaction. Components should not know database structure or implement business invariants.

### Hooks
Coordinate frontend behavior: query/mutation orchestration, feature state, browser side effects, and interaction state.

### Services/API clients
Own HTTP interaction and response parsing. Components should not scatter raw `fetch()` calls.

### Utilities
Pure functions only. No React, no network calls, no storage side effects.

### Domain
Owns knowledge truth, provenance, validation, lifecycle rules, and canonical state transitions.

## 4. Single Responsibility and File Size

A component should have one clear responsibility. A filename requiring "and" to describe its job is a refactoring signal.

- ~150 lines: review whether extraction improves clarity.
- 250 TSX lines: lint/review warning, not an automatic architectural failure.
- Do not split files merely to satisfy a line-count rule. Split by responsibility.

## 5. Prefer Composition Over Configuration

Use composition, children, and focused primitives instead of mega-components with many boolean/variant props.

Create reusable design primitives only when repetition is real. Avoid speculative abstraction.

## 6. State Ownership

Use the smallest tool that correctly owns the state.

- Simple local UI state → `useState`
- Complex local workflow/state machine → `useReducer`
- Server state → feature query/mutation hooks (TanStack Query may be adopted when justified)
- Low-frequency global/static configuration → React Context
- Shared high-frequency UI state → Zustand only if a real need emerges
- Canonical domain state → backend/domain layer

Do not add Zustand or TanStack Query solely because a convention mentions them. E.I.L is still small; dependencies must earn their place.

Never copy server truth into a second client store unless an explicit offline/editing architecture requires it.

## 7. Data Fetching

Raw API access belongs in co-located service modules or feature hooks, not directly across presentation components.

If/when TanStack Query is introduced, use it as the standard frontend server-state adapter, but keep it outside the Domain. Query hooks must remain co-located by feature, not centralized into one giant `useCustomQuery.ts` file.

Every data-driven UI must intentionally handle:

- loading
- error
- empty
- success
- unavailable/canonical-data-not-ready when relevant

Known-shape content should prefer skeleton states over indefinite spinners.

## 8. useEffect, useMemo, useCallback, React.memo

### `useEffect`
Use only to synchronize with external systems: subscriptions, DOM/browser APIs, timers, third-party libraries, or imperative resources. Cleanup is mandatory when resources are created.

Do not use effects to:

- derive render data
- mirror one state into another
- react to events that can be handled in the event handler

### Memoization
Do not add `useMemo`, `useCallback`, or `React.memo` speculatively. Profile or identify a concrete reference-stability requirement first.

## 9. Unidirectional Data Flow

Data flows down; events flow up.

- Never mutate props.
- Do not let siblings communicate through hidden shared mutations.
- Do not pass raw `setState` or `dispatch` through component APIs; expose intent (`onClose`, `onSelect`, `onAdvance`).

## 10. TypeScript Standards

Use strict TypeScript.

Preferred compiler direction:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "exactOptionalPropertyTypes": true
}
```

Adopt stricter flags incrementally if legacy code prevents an immediate clean build.

Rules:

- Avoid `any`; use `unknown` and narrow it.
- Avoid non-null assertions except validated boundaries.
- Avoid unsafe `as` casts; validate external payloads.
- Use `interface` for object shapes when extension is useful; `type` for unions/intersections/aliases.
- Prefer string union types over TypeScript enums unless runtime iteration/flags justify otherwise.
- Component props use named `ComponentNameProps` interfaces.
- Stable IDs, never dynamic-list array indexes, are React keys.

## 11. Accessibility Is Required

Every new or touched interaction must consider accessibility.

- semantic HTML first
- native `<button>` for actions
- associated form labels
- keyboard operability
- visible `:focus-visible`
- modal/drawer focus management
- meaningful image alt text, decorative images `alt=""`
- WCAG AA contrast target
- reduced-motion behavior for nonessential animation

Liquid Glass aesthetics never override legibility, focus visibility, or contrast.

## 12. Error Boundaries and Failure Safety

- Route/workspace-level unexpected failures should be caught by Error Boundaries.
- API errors must produce understandable user states.
- Failed provenance or unavailable canonical storage must never silently downgrade truth requirements.
- Destructive user actions need explicit intent and appropriate confirmation.

## 13. Design System Isolation

All visual-system work belongs under `src/design/`.

- Feature logic must not depend on a particular visual theme.
- Do not create `liquid-glass-v5.css`, `v6`, etc.
- Reuse canonical design tokens/primitives.
- Design changes should be replaceable without rewriting Knowledge, LearningPath, Transformation, or Synthesis logic.
- Magic colors, spacing, radii, z-indexes, and motion values should become named design tokens when repeated.

## 14. Performance: Measure Before Optimizing

Do not optimize by superstition.

Proactively address only structurally obvious issues:

- large lists → virtualization when needed
- heavy routes/features → code splitting when bundle evidence justifies it
- media → explicit dimensions and appropriate loading
- proven hot-path rerenders → memoization after profiling

Keep dependencies lean. Prefer a small local implementation when it is clearer and safer than a new package.

## 15. Progressive Disclosure Is Product Architecture

E.I.L is a learning journey, not a control panel.

- Do not surface advanced tools simply because they exist.
- UI visibility follows learning state and user intent.
- Navigation should reflect the user's mental model, not backend nouns.
- A feature should strengthen the loop:

`Question → Learn → Connect → Understand → Awareness → Experiment → Reflect → Revisit`

If it does not, challenge whether it belongs now.

## 16. Source Preservation

Canonical source material is immutable from the perspective of derived UX.

- Never overwrite a complete source with a summary.
- Summaries, claims, insights, explanations, and learning cards are derived layers.
- Source readers must preserve access to original/full content.

## 17. Frontend API Contract Rule

Frontend code should consume stable application-level contracts, not mirror raw SQL/database schemas.

Example:

```text
Component
  ↓
Feature Hook / Service
  ↓
HTTP Route Adapter
  ↓
Application / Domain Service
  ↓
Repository
  ↓
Database
```

Do not skip layers merely because a shortcut is easy today.

## 18. Naming

- Components: `PascalCase.tsx`
- Hooks: `useSomething.ts`
- Utilities/services: `camelCase.ts`
- Types/interfaces: PascalCase, no `I` prefix
- Constants: `UPPER_SNAKE_CASE`
- One primary component per file; tightly coupled tiny helpers may remain local

## 19. Engineering Change Checklist

Before merging structural/frontend work, verify:

- [ ] Does this preserve Domain/Provenance authority?
- [ ] Is feature-owned code co-located?
- [ ] Does every file/component have one clear responsibility?
- [ ] Is data flow one-directional?
- [ ] Are server state and local UI state clearly separated?
- [ ] Are loading/error/empty/unavailable states handled?
- [ ] Is the interaction keyboard-usable and readable?
- [ ] Did we avoid speculative packages and abstractions?
- [ ] Did we avoid adding a new CSS/version layer?
- [ ] Does this strengthen the E.I.L product loop?
- [ ] Does the Preview/Build pass before merge?

## 20. Refactoring Policy

Do not stop product delivery for a repository-wide purity refactor.

Apply this Constitution to:

1. all new code,
2. code being materially changed,
3. legacy hotspots when they block product work.

Prefer incremental improvement with verified builds over large rewrites.
