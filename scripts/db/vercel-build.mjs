import{spawnSync}from'node:child_process';

function run(command,args){
 const result=spawnSync(command,args,{stdio:'inherit',shell:process.platform==='win32'});
 if(result.status!==0)process.exit(result.status??1);
}

console.log(`Vercel build: running single-pass prebuild for VERCEL_ENV=${process.env.VERCEL_ENV||'local'}.`);
run(process.execPath,['scripts/quality/run-prebuild.mjs']);

console.log('Vercel build: compiling TypeScript directly.');
run('npx',['--no-install','tsc','-b']);
console.log('Vercel build: building Vite output directly.');
run('npx',['--no-install','vite','build']);
