import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL_ENV === 'production') {
  console.log('Production build: ensuring migrations 001-008 before verification.');
  run('node', ['scripts/db/ensure-production-migrations.mjs']);
  console.log('Production build: verifying database foundation including extraction/relation/intake/review layers.');
  run('npm', ['run', 'db:health']);
  console.log('Production build: exercising extraction candidate persistence with a transactional verification fixture.');
  run('npm', ['run', 'db:verify-extraction']);
  console.log('Production build: idempotently bootstrapping PENDING atomic extraction candidates.');
  run('npm', ['run', 'knowledge:bootstrap-extraction']);
  console.log('Production build: verifying intake CHANGE / REJECT / duplicate-safe APPROVE lifecycle.');
  run('node', ['scripts/knowledge/verify-intake-db.mjs']);
  console.log('Production build: enforcing corpus provenance, review, relation, and intake quality gates.');
  run('node', ['scripts/knowledge/verify-quality-gates.mjs']);
} else {
  console.log(`Skipping database migrations and production DB quality verification for VERCEL_ENV=${process.env.VERCEL_ENV || 'local'}.`);
}

run('npm', ['run', 'build']);
