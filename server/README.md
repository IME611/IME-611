# Server domain layer

This folder is the target home for backend business logic that is currently embedded in `/api/*.js` route files.

Keep `/api` as stable HTTP adapters. Move logic here incrementally so route URLs do not change.

Target domains:

```text
server/
  knowledge/   # corpus loading, source preservation, ingestion, documents
  synthesis/   # atlas, matching, insights, mentor/review services
  system/      # operational helpers
  shared/      # validation, errors, filesystem/corpus utilities
```

Rules:
- Services return data or throw typed/domain errors; they do not know about `req`/`res`.
- Canonical source loaders are shared; do not duplicate corpus-decompression logic per endpoint.
- Derived knowledge must carry evidence references where possible.
- Route handlers should become thin wrappers over these services.
