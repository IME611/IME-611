import{spawnSync}from'node:child_process';

function run(command,args){
 const result=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32'});
 if(result.status!==0)process.exit(result.status??1);
}

if(process.env.VERCEL_ENV==='production'){
 console.log('Production build: applying canonical migrations 001-005.');
 run('npm',['run','db:migrate']);
 console.log('Production build: applying isolated relation migration 006.');
 run('node',['scripts/db/apply-relation-migration.mjs']);
 console.log('Production build: verifying base DB health.');
 run('npm',['run','db:health']);
 console.log('Production build: verifying extraction persistence.');
 run('npm',['run','db:verify-extraction']);
 console.log('Production build: verifying relation candidate persistence/evidence chain.');
 run('node',['scripts/db/run-verification-sql.mjs','database/verification/006_verify_relation_candidates.sql']);
 console.log('Production build: idempotently bootstrapping atomic extraction candidates.');
 run('npm',['run','knowledge:bootstrap-extraction']);
 console.log('Production build: idempotently bootstrapping relation candidates.');
 run('node',['scripts/knowledge/bootstrap-relations.mjs']);
}else{
 console.log(`Skipping production DB writes for VERCEL_ENV=${process.env.VERCEL_ENV||'local'}.`);
}

run('npm',['run','build']);
