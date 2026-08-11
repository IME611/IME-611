export const GET_INSIGHT_PROVENANCE_TRACE_SQL=`
SELECT i.id insight_id,i.statement insight_statement,i.status::text insight_status,
 c.id claim_id,c.statement claim_statement,e.id evidence_id,e.relation::text evidence_relation,
 f.id fragment_id,f.ordinal fragment_ordinal,f.raw_text fragment_text,f.start_offset fragment_start_offset,f.end_offset fragment_end_offset,
 s.id source_id,s.title source_title,s.author source_author,s.content_hash source_content_hash,s.original_uri source_uri
FROM insights i
JOIN provenance_edges pe ON pe.derived_entity_type='INSIGHT' AND pe.derived_entity_id=i.id AND pe.source_entity_type='CLAIM'
JOIN claims c ON c.id=pe.source_entity_id
JOIN evidence e ON e.claim_id=c.id
JOIN source_fragments f ON f.id=e.fragment_id
JOIN sources s ON s.id=f.source_id
WHERE i.id=$1::uuid
ORDER BY s.id,f.ordinal,c.id,e.id`;
export async function getInsightProvenanceTrace(db,id){const r=await db.query(GET_INSIGHT_PROVENANCE_TRACE_SQL,[id]);return r.rows}
