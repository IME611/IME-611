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
  console.log('Production build: idempotently bootstrapping PENDING atomic extraction candidates.');
  run('npm', ['run', 'knowledge:bootstrap-extraction']);
} else {
  console.log(`Skipping database migrations and extraction bootstrap for VERCEL_ENV=${process.env.VERCEL_ENV || 'local'}.`);
}

run('npm', ['run', 'build']);
