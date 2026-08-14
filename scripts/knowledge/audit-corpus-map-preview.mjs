import{getDb}from'../../server/shared/postgres.js';
import{buildEmergentCorpusMapPreview}from'../../server/knowledge/application/map/emergent-corpus-map.service.js';

if(!process.env.DATABASE_URL){
 console.log('MAP_AUDIT skipped: DATABASE_URL unavailable');
 process.exit(0);
}

const db=getDb();
try{
 const map=await buildEmergentCorpusMapPreview(db,{communityLimit:50,nodeLimit:200,edgeLimit:400});
 console.log('MAP_AUDIT_SUMMARY '+JSON.stringify(map.summary));
 console.log('MAP_AUDIT_COMMUNITIES '+JSON.stringify(map.communities.slice(0,15).map(item=>({label:item.derivedLabel,size:item.size,sourceCount:item.sourceCount,sectionCount:item.sectionCount,central:item.centralConcepts.map(x=>x.label)}))));
 console.log('MAP_AUDIT_UNMAPPED '+JSON.stringify(map.unmappedSections.slice(0,15)));
 console.log('MAP_AUDIT_NO_EXPLICIT '+JSON.stringify(map.noExplicitMentionSections.slice(0,15)));
 console.log('MAP_AUDIT_NODES '+JSON.stringify(map.nodes.slice(0,20).map(item=>({label:item.label,explicitMappedAtomCount:item.explicitMappedAtomCount,contextAtomCount:item.contextAtomCount,sourceCount:item.sourceCount,candidateCount:item.candidateCount,rawVariants:item.rawCandidateVariants?.length||0}))));
}finally{
 await db.end();
}
