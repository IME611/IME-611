import{getDb}from'../../server/shared/postgres.js';
import{previewExplicitRelations}from'../../server/knowledge/application/relations/explicit-relation.service.js';

if(!process.env.DATABASE_URL){
 console.log('RELATION_AUDIT skipped: DATABASE_URL unavailable');
 process.exit(0);
}
const db=getDb();
try{
 const result=await previewExplicitRelations(db,{limit:1000});
 console.log('RELATION_AUDIT_SUMMARY '+JSON.stringify(result.summary));
 console.log('RELATION_AUDIT_SAMPLE '+JSON.stringify(result.relations.slice(0,40).map(item=>({type:item.relationType,from:item.from.label,to:item.to.label,cue:item.cue,confidence:item.confidence,sourceFile:item.sourceFile,section:item.section,fromMode:item.from.matchMode,toMode:item.to.matchMode}))));
}finally{
 await db.end();
}
