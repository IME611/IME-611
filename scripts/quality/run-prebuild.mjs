import{spawnSync}from'node:child_process';
import{claimProductionPreflight}from'./production-preflight-lock.mjs';

function run(command,args){
 const result=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32'});
 if(result.status!==0)process.exit(result.status??1);
}

const production=process.env.VERCEL_ENV==='production';
const preflight=claimProductionPreflight();

if(!production){
 run(process.execPath,['scripts/db/ensure-production-migrations.mjs']);
}else if(preflight.run){
 console.log(`Production prebuild: remote preflight claimed (${preflight.reason}); running migrations + DB quality once for this deployment.`);
 run(process.execPath,['scripts/db/ensure-production-migrations.mjs']);
 run('npm',['run','db:health']);
 run('npm',['run','db:verify-extraction']);
 run('npm',['run','knowledge:bootstrap-extraction']);
 run(process.execPath,['scripts/knowledge/bootstrap-relations.mjs']);
 run(process.execPath,['scripts/knowledge/audit-relation-endpoint-suggestions.mjs']);
 run(process.execPath,['scripts/knowledge/verify-intake-db.mjs']);
 run(process.execPath,['scripts/knowledge/verify-quality-gates.mjs']);
}else{
 console.log('Production prebuild: remote preflight already claimed by another build unit; skipping duplicate migrations/DB checks.');
}

const checks=[
 'scripts/quality/verify-production-preflight-lock.mjs',
 'scripts/quality/verify-learner-source-library.mjs',
 'scripts/quality/verify-db-url-normalization.mjs',
 'scripts/quality/verify-learner-journey-coherence.mjs',
 'scripts/quality/verify-review-auth-boundary.mjs',
 'scripts/quality/verify-api-write-surface.mjs',
 'scripts/quality/verify-production-surface.mjs',
 'scripts/quality/verify-ui-foundation.mjs',
 'scripts/quality/verify-repository-layout.mjs',
 'scripts/quality/verify-frontend-reachability.mjs',
 'scripts/quality/verify-server-reachability.mjs',
 'scripts/quality/verify-repository-truth.mjs',
 'scripts/knowledge/verify-dynamic-publication-editor.mjs',
 'scripts/knowledge/verify-atomic-extractor.mjs',
 'scripts/knowledge/verify-overlap-engine.mjs',
 'scripts/knowledge/verify-corpus-map.mjs',
 'scripts/knowledge/verify-relation-extractor.mjs',
 'scripts/knowledge/verify-relation-endpoint-suggestions.mjs',
 'scripts/knowledge/verify-intake-workflow.mjs',
 'scripts/knowledge/verify-source-publication.mjs',
 'scripts/knowledge/verify-backend-completion.mjs',
 'scripts/knowledge/verify-content-library.mjs',
];

for(const script of checks)run(process.execPath,[script]);
