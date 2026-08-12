export class PostgresDashboardRepository{
 constructor(db){this.db=db}
 async getSnapshot(){
  const [insights,experiments,reflections,counts]=await Promise.all([
   this.db.query(`SELECT id,statement,status::text AS status,evidence_strength,created_at
     FROM insights ORDER BY CASE status WHEN 'SUPPORTED' THEN 0 WHEN 'CHALLENGED' THEN 1 ELSE 2 END,created_at DESC LIMIT 5`),
   this.db.query(`SELECT e.id,e.insight_id,e.hypothesis,e.action,e.expected_signal,e.status::text AS status,e.started_at,e.ended_at,e.created_at,i.statement AS insight_statement,i.status::text AS insight_status
     FROM experiments e JOIN insights i ON i.id=e.insight_id
     ORDER BY CASE e.status WHEN 'ACTIVE' THEN 0 WHEN 'DRAFT' THEN 1 ELSE 2 END,e.created_at DESC LIMIT 3`),
   this.db.query(`SELECT r.id,r.experiment_id,r.observation,r.outcome,r.interpretation,r.created_at,e.insight_id,i.statement AS insight_statement
     FROM reflections r JOIN experiments e ON e.id=r.experiment_id JOIN insights i ON i.id=e.insight_id
     ORDER BY r.created_at DESC LIMIT 3`),
   this.db.query(`SELECT (SELECT COUNT(*)::int FROM sources) AS sources,(SELECT COUNT(*)::int FROM source_fragments) AS fragments,(SELECT COUNT(*)::int FROM claims) AS claims,(SELECT COUNT(*)::int FROM evidence) AS evidence`),
  ]);
  return{insights:insights.rows,experiments:experiments.rows,reflections:reflections.rows,counts:counts.rows[0]||{sources:0,fragments:0,claims:0,evidence:0}};
 }
}
