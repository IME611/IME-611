# Server domain layer

`server/` owns backend business/application logic. `/api` remains the stable HTTP adapter layer; route URLs should not move when domain logic is reorganized.

Current structure:

```text
server/
  knowledge/        # canonical sources, intake, extraction, corpus map, relations, learning, publication, quality
  learning-paths/   # learning-path services/contracts
  shared/           # shared infrastructure and backend utilities
  synthesis/        # synthesis/connection behavior separated from canonical source truth
```

`server/knowledge/` is organized further into `application/`, `domain/` and `infrastructure/` boundaries where appropriate.

Rules:
- Services return data or throw domain/typed errors; they do not depend on HTTP `req`/`res` objects.
- `/api` validates transport/auth and delegates to server services.
- Canonical source loaders and database infrastructure are shared rather than duplicated per endpoint.
- Derived knowledge carries evidence/provenance references where possible.
- Canonical writes remain creator-authorized and review-gated.
- HTTP request handling never creates or migrates database schema.
- Do not create placeholder server folders for hypothetical future domains; add a drawer only when implemented responsibility exists.
