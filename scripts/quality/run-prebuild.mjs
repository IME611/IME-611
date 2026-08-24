import{spawnSync}from'node:child_process';

const checks=[
 'scripts/db/ensure-production-migrations.mjs',
 'scripts/knowledge/verify-atomic-extractor.mjs',
 'scripts/knowledge/verify-overlap-engine.mjs',
 'scripts/knowledge/verify-corpus-map.mjs',
 'scripts/knowledge/verify-relation-extractor.mjs',
 'scripts/knowledge/verify-relation-endpoint-suggestions.mjs',
 'scripts/knowledge/verify-intake-workflow.mjs',
 'scripts/knowledge/verify-source-publication.mjs',
 'scripts/knowledge/verify-content-library.mjs',
];

for(const script of checks){
 const result=spawnSync(process.execPath,[script],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status??1);
}
