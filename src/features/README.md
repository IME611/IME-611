# Feature Drawers

Each folder represents one product responsibility. New work belongs in the smallest drawer that owns the behavior.

- `shell/` — navigation shell only. Sidebar, drawer, global chrome.
- `journey/` — learning sequence, chapter reader, question chain, journey progress behavior.
- `evolution/` — awareness → experiment → reflection behavior.
- `dashboard/` — home/current-state composition. Create when dashboard is split out of shell.
- `knowledge/` — ingestion/source/library UI. Create as current generic source UI is extracted from app orchestration.
- `synthesis/` — connections/insights/mentor UI. Create as current views are separated from evolution workspace.

## Internal shape for a mature feature
```text
<feature>/
  components/   visual React pieces specific to the feature
  model/        domain rules/state transitions
  hooks/        React integration around the model
  services/     calls to stable API adapters
  types/        feature-only types
  index.ts      small public API
```

Do not create folders just to hide files. A subfolder should express a responsibility that can be named. Avoid cross-importing feature internals; promote shared behavior to `src/core` or shared UI to reusable components.
