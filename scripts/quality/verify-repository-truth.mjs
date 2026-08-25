import assert from'node:assert/strict';
import fs from'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const json=path=>JSON.parse(read(path));
const pkg=json('package.json');
const lock=json('package-lock.json');
const workflow=read('.github/workflows/quality-gate.yml');
const deploy=read('DEPLOY.md');
const apiReadme=read('api/README.md');
const runbook=read('docs/engineering/LIVE_DB_RUNBOOK.md');
const agents=read('AGENTS.md');
const architecture=read('ARCHITECTURE.md');
const runner=read('scripts/db/run-migrations.mjs');
const ensure=read('scripts/db/ensure-production-migrations.mjs');

const exact=/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
for(const group of['dependencies','devDependencies'])for(const[name,version]of Object.entries(pkg[group]||{})){
 assert.match(String(version),exact,`${name} must be pinned to an exact version; got ${version}`);
 assert.equal(lock.packages?.['']?.[group]?.[name],version,`${name} must match the committed lockfile root`);
}
assert.equal(lock.lockfileVersion,3,'npm lockfile v3 is required');
assert.match(workflow,/npm ci --no-audit --no-fund/,'CI must install from the committed lockfile with npm ci');
assert.doesNotMatch(workflow,/npm install/,'CI must not resolve a fresh dependency tree');
assert.equal(fs.existsSync('.github/workflows/generate-lock.yml'),false,'one-shot lock generator must not remain in the repository');

assert.match(deploy,/npm run vercel-build/,'deployment docs must preserve the Production preflight build command');
assert.match(deploy,/Do \*\*not\*\* replace it with a frontend-only `npm run build`/,'deployment docs must warn against bypassing Production preflight');
assert.match(apiReadme,/12 Node\.js Functions/,'API route map must state the current 12-function Hobby surface');
assert.doesNotMatch(apiReadme,/8 Serverless Functions/,'stale 8-function guidance must not return');
assert.match(runbook,/001–012/,'DB runbook must describe migrations 001–012');
assert.match(runbook,/npm ci/,'DB runbook must use reproducible dependency installation');
assert.match(runbook,/migrations_applied >= 12/,'DB runbook must require the current migration ledger');
assert.match(runner,/database\/migrations\/012_legacy_review_boundary\.sql/,'canonical migration runner must include migration 012');
assert.match(ensure,/001-012/,'Production migration gate must advertise migrations 001–012');

for(const[path,content]of[['AGENTS.md',agents],['ARCHITECTURE.md',architecture]]){
 assert.doesNotMatch(content,/18-layer learning journey/i,`${path} must not describe the corpus as a fixed 18-layer journey`);
 assert.doesNotMatch(content,/src\/app\/navigation\.ts/,`${path} must not point engineers to the removed parallel navigation map`);
}
for(const stale of['BUILD.md','MVP_READY.md','PR_NOTES.md','_mvp.txt'])assert.equal(fs.existsSync(stale),false,`${stale} is stale MVP marker cruft and must stay removed`);

console.log('PASS repository truth (exact dependency pins + lockfile CI + 12-function/migration/deployment docs aligned)');
