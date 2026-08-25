# Deployment

Vercel Production must use the repository `vercel-build` script:

```bash
npm run vercel-build
```

Do **not** replace it with a frontend-only `npm run build`: Production preflight owns canonical migrations, live DB quality gates, deterministic regressions, TypeScript compilation and the Vite output.

Current Production alias: `https://ime-611.vercel.app`

For the complete database and post-deploy procedure, see `docs/engineering/LIVE_DB_RUNBOOK.md`.
