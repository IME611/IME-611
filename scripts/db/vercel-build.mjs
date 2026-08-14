import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL_ENV === 'production') {
  console.log('Production build: applying canonical database migrations first.');
  run('npm', ['run', 'db:migrate']);
  console.log('Production build: verifying database foundation including extraction candidate layer.');
  run('npm', ['run', 'db:health']);
  console.log('Production build: exercising extraction candidate persistence with a transactional verification fixture.');
  run('npm', ['run', 'db:verify-extraction']);
  console.log('Production build: idempotently bootstrapping PENDING atomic extraction candidates.');
  run('npm', ['run', 'knowledge:bootstrap-extraction']);
} else {
  console.log(`Skipping database migrations and extraction bootstrap for VERCEL_ENV=${process.env.VERCEL_ENV || 'local'}.`);
  if (process.env.VERCEL_ENV === 'preview') {
    console.log('Preview build: running read-only explicit relation quality audit.');
    run('node', ['scripts/knowledge/audit-relations-preview.mjs']);
  }
}

run('npm', ['run', 'build']);
