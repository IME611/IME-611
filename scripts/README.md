# Scripts

Operational and regression entry points are grouped by responsibility:

- `db/` — database migrations, health checks, deployment/prebuild orchestration and live DB verification.
- `knowledge/` — deterministic knowledge-pipeline bootstrap, audits and corpus/domain regression checks.
- `quality/` — repository, security, API, UI and build guards. `run-prebuild.mjs` is the central deterministic prebuild check runner.

Rules:
- Put reusable backend business logic in `server/`, not in scripts.
- A script is an intentional executable/maintenance entry point; do not keep abandoned experiments here.
- Production schema changes belong in `database/migrations/`, not inline in scripts or HTTP handlers.
- Frontend/server reachability checks in `quality/` prevent dead implementation code from accumulating again.
