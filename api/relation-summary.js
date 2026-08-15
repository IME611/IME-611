import{getDb}from'../server/shared/postgres.js';
import{withHardening}from'./_lib/hardening.js';

async function summary(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,error:'method not allowed'})}
 const db=getDb();
 const tables=(await db.query(`SELECT to_regclass('public.relation_candidates') AS candidates,to_regclass('public.relation_extraction_runs') AS runs`)).rows[0];
 if(!tables?.candidates||!tables?.runs)return res.status(200).json({ok:true,schemaReady:false,summary:null});
 const counts=(await db.query(`SELECT
   COUNT(*)::int AS total,
   COUNT(DISTINCT source_id)::int AS source_count,
   COUNT(*) FILTER(WHERE review_status='PENDING')::int AS pending,
   COUNT(*) FILTER(WHERE review_status='APPROVED')::int AS approved,
   COUNT(*) FILTER(WHERE review_status='REJECTED')::int AS rejected,
   COUNT(*) FILTER(WHERE endpoint_resolution='MAPPED')::int AS mapped,
   COUNT(*) FILTER(WHERE endpoint_resolution='PARTIAL')::int AS partial,
   COUNT(*) FILTER(WHERE endpoint_resolution='UNRESOLVED')::int AS unresolved
  FROM relation_candidates`)).rows[0];
 const byType=(await db.query(`SELECT relation_type::text AS type,COUNT(*)::int AS count FROM relation_candidates GROUP BY relation_type ORDER BY relation_type`)).rows;
 const integrity=(await db.query(`SELECT
   COUNT(*) FILTER(WHERE length(trim(r.from_label))=0 OR length(trim(r.to_label))=0)::int AS empty_endpoints,
   COUNT(*) FILTER(WHERE r.from_node_key=r.to_node_key)::int AS same_endpoint,
   COUNT(*) FILTER(WHERE r.evidence_mode<>'EXPLICIT_LINGUISTIC')::int AS non_explicit,
   COUNT(*) FILTER(WHERE r.exact_quote<>c.candidate_text)::int AS quote_mismatch,
   COUNT(*) FILTER(WHERE NOT EXISTS(SELECT 1 FROM extraction_candidate_evidence e WHERE e.candidate_id=r.source_atom_id AND e.exact_quote_verified))::int AS missing_verified_fragment_evidence
  FROM relation_candidates r JOIN extraction_candidates c ON c.id=r.source_atom_id`)).rows[0];
 const canonicalConnections=Number((await db.query('SELECT COUNT(*)::int AS count FROM connections')).rows[0]?.count||0);
 const runs=(await db.query(`SELECT id,scope,extraction_method AS method,extractor_version AS version,status,stats,started_at AS "startedAt",completed_at AS "completedAt" FROM relation_extraction_runs ORDER BY started_at DESC LIMIT 5`)).rows;
 const healthy=Object.values(integrity).every(value=>Number(value)===0);
 return res.status(healthy?200:503).json({ok:healthy,schemaReady:true,summary:{...counts,byType,integrity,canonicalConnections},runs,policy:{canonicalWrites:false,note:'Relation candidates remain reviewable; this layer does not write canonical connections.'}});
}

export default withHardening(summary,{rateLimit:{limit:30,windowMs:60_000,keyPrefix:'relation-summary'}});
