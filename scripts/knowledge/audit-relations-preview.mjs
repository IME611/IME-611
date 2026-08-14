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
 if(result.summary.total===0){
  const cueRows=(await db.query(`
   SELECT c.atom_type::text AS "atomType",c.candidate_text AS text,
          s.metadata->>'sourceFile' AS "sourceFile",c.metadata->>'section' AS section
   FROM extraction_candidates c
   JOIN sources s ON s.id=c.source_id
   WHERE c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge
     AND c.atom_type::text NOT IN ('CONCEPT','EDITORIAL_NOTE','QUESTION')
     AND c.candidate_text ~ '(משפיע|משפיעה|משפיעים|משפיעות|מווסת|מווסתת|גורם|גורמת|מוביל|מובילה|תורם|תורמת|חלק מ|מורכב מ|מורכבת מ|כולל|כוללת|תלוי ב|תלויה ב|סותר|סותרת|תומך ב|תומכת ב|מסביר|מסבירה|חל על|חלה על|תנאי מוקדם|דרישת קדם)'
   ORDER BY c.source_id,c.source_start
   LIMIT 60
  `)).rows;
  console.log('RELATION_AUDIT_UNRESOLVED_CUES '+JSON.stringify(cueRows.map(row=>({atomType:row.atomType,sourceFile:row.sourceFile,section:row.section,text:String(row.text||'').slice(0,260)}))));
 }
}finally{
 await db.end();
}
