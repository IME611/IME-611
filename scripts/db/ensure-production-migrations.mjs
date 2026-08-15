import{spawnSync}from'node:child_process';

function run(command,args){
 const result=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32'});
 if(result.status!==0)process.exit(result.status??1);
}

if(process.env.VERCEL_ENV==='production'){
 console.log('Production prebuild: ensuring canonical migrations 001-005.');
 run('npm',['run','db:migrate']);
 console.log('Production prebuild: ensuring relation migration 006.');
 run('node',['scripts/db/apply-relation-migration.mjs']);
 console.log('Production prebuild: ensuring intake migration 007.');
 run('node',['scripts/db/apply-intake-migration.mjs']);
 console.log('Production prebuild: ensuring creator review migration 008.');
 run('node',['scripts/db/apply-review-migration.mjs']);
}else{
 console.log(`Skipping production migrations for VERCEL_ENV=${process.env.VERCEL_ENV||'local'}.`);
}
