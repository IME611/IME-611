import{getDb}from'../../server/shared/postgres.js';
import{buildEmergentCorpusMapPreview}from'../../server/knowledge/application/map/emergent-corpus-map.service.js';
import{summarizeEndpointContextCoverage,summarizeEndpointSuggestionDiagnostics,summarizeEndpointSuggestionHealth}from'../../server/knowledge/application/relations/relation-endpoint-suggestions.service.js';

async function main(){
 const pool=getDb(),client=await pool.connect();
 try{
  const relations=(await client.query(`
   SELECT r.id,r.relation_type,r.source_id,r.source_atom_id,r.from_label,r.from_resolution,r.to_label,r.to_resolution,
          atom.metadata->>'section' AS source_section,
          COALESCE(s.metadata->>'sourceFile',s.metadata->>'originalFileName') AS source_file
   FROM relation_candidates r
   JOIN sources s ON s.id=r.source_id
   JOIN extraction_candidates atom ON atom.id=r.source_atom_id
   WHERE r.review_status='PENDING' AND r.endpoint_resolution<>'MAPPED'
   ORDER BY r.created_at
  `)).rows;
  const map=await buildEmergentCorpusMapPreview(client,{communityLimit:300,nodeLimit:700,edgeLimit:1500});
  const summary=summarizeEndpointSuggestionHealth(relations,map.nodes),diagnostics=summarizeEndpointSuggestionDiagnostics(relations,map.nodes),contextCoverage=summarizeEndpointContextCoverage(relations,map.nodes);
  console.log(JSON.stringify({ok:true,mode:'read-only-endpoint-suggestion-audit',mapNodes:map.nodes.length,...summary,diagnostics,contextCoverage,policy:{writes:false,autoResolution:false,creatorDecisionRequired:true,contextIsNotSemanticProof:true,rawEndpointTextLogged:false,rawSectionTextLogged:false}},null,2));
 }finally{client.release();await pool.end()}
}

main().catch(error=>{console.error(error);process.exit(1)});
