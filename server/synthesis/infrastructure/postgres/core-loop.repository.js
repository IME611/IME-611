import crypto from 'crypto';
const hash=s=>crypto.createHash('sha256').update(String(s).normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase()).digest('hex');
export class PostgresCoreLoopRepository{
 constructor(db,getInsightProvenanceTrace){this.db=db;this.traceQuery=getInsightProvenanceTrace}
 async getClaimEvidenceCoverage(ids){const r=await this.db.query(`SELECT c.id,COUNT(e.id)::int evidence_count FROM claims c LEFT JOIN evidence e ON e.claim_id=c.id WHERE c.id=ANY($1::uuid[]) GROUP BY c.id`,[ids]);return r.rows}
 async createInsight(i){const r=await this.db.query(`INSERT INTO insights(statement,normalized_hash,model_confidence,status,metadata) VALUES($1,$2,$3,$4,$5) ON CONFLICT(normalized_hash) DO UPDATE SET model_confidence=EXCLUDED.model_confidence RETURNING *`,[i.statement,hash(i.statement),i.modelConfidence,i.status,i.metadata]);return r.rows[0]}
 async linkInsightToClaim(insightId,claimId){await this.db.query(`INSERT INTO provenance_edges(derived_entity_type,derived_entity_id,source_entity_type,source_entity_id,relation,extraction_method) VALUES('INSIGHT',$1,'CLAIM',$2,'DERIVED_FROM','core-loop-v1') ON CONFLICT DO NOTHING`,[insightId,claimId])}
 async getInsightTrace(id){const rows=await this.traceQuery(this.db,id);return{rows,provenanceComplete:rows.length>0&&rows.every(r=>r.source_id&&r.fragment_id&&r.claim_id)}}
 async createExperiment(e){const r=await this.db.query(`INSERT INTO experiments(insight_id,hypothesis,action,expected_signal,status) VALUES($1,$2,$3,$4,$5) RETURNING *`,[e.insightId,e.hypothesis,e.action,e.expectedSignal,e.status]);return r.rows[0]}
 async createReflection(x){const r=await this.db.query(`WITH r AS (INSERT INTO reflections(experiment_id,observation,outcome,interpretation) VALUES($1,$2,$3,$4) RETURNING * ) SELECT r.*,e.insight_id FROM r JOIN experiments e ON e.id=r.experiment_id`,[x.experimentId,x.observation,x.outcome,x.interpretation]);return r.rows[0]}
}
