import{spawnSync}from'node:child_process';

function run(command,args){
 const result=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32'});
 if(result.status!==0)process.exit(result.status??1);
}

run(process.execPath,['scripts/db/ensure-production-migrations.mjs']);

if(process.env.VERCEL_ENV==='production'){
 console.log('Production prebuild: running DB health and mutation-safe quality verification once.');
 run('npm',['run','db:health']);
 run('npm',['run','db:verify-extraction']);
 run('npm',['run','knowledge:bootstrap-extraction']);
 run(process.execPath,['scripts/knowledge/bootstrap-relations.mjs']);
 run(process.execPath,['scripts/knowledge/audit-relation-endpoint-suggestions.mjs']);
 run(process.execPath,['scripts/knowledge/verify-intake-db.mjs']);
 run(process.execPath,['scripts/knowledge/verify-quality-gates.mjs']);
}

const checks=[
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
