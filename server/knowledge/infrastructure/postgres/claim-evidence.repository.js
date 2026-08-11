export class PostgresClaimEvidenceRepository {
  constructor(db) { this.db = db; }
  async getFragmentWithSource(fragmentId) {
    const r=await this.db.query(`SELECT f.*,s.id source_id,s.content_hash source_content_hash FROM source_fragments f JOIN sources s ON s.id=f.source_id WHERE f.id=$1`,[fragmentId]); return r.rows[0]||null;
  }
  async transaction(work) {
    const client=await this.db.connect(); await client.query('BEGIN');
    const tx=new PostgresClaimEvidenceRepository(client); tx.transaction=async fn=>fn(tx);
    try { const out=await work(tx); await client.query('COMMIT'); return out; }
    catch(e){ await client.query('ROLLBACK'); throw e; } finally { client.release?.(); }
  }
  async upsertClaim(c) {
    const r=await this.db.query(`INSERT INTO claims(statement,normalized_hash,type,model_confidence,status,metadata) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(normalized_hash) DO UPDATE SET statement=EXCLUDED.statement RETURNING *`,[c.statement,c.normalizedHash,c.type,c.modelConfidence,c.status,c.metadata]); return r.rows[0];
  }
  async upsertEvidence(e) {
    const r=await this.db.query(`INSERT INTO evidence(claim_id,fragment_id,relation,evidence_strength,quote,metadata) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(claim_id,fragment_id,relation) DO UPDATE SET evidence_strength=COALESCE(EXCLUDED.evidence_strength,evidence.evidence_strength),quote=COALESCE(EXCLUDED.quote,evidence.quote) RETURNING *`,[e.claimId,e.fragmentId,e.relation,e.evidenceStrength,e.quote,e.metadata]); return r.rows[0];
  }
  async upsertProvenance(p) {
    const r=await this.db.query(`INSERT INTO provenance_edges(derived_entity_type,derived_entity_id,source_entity_type,source_entity_id,relation,weight,extraction_method,model_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(derived_entity_type,derived_entity_id,source_entity_type,source_entity_id,relation) DO UPDATE SET weight=COALESCE(EXCLUDED.weight,provenance_edges.weight) RETURNING *`,[p.derivedEntityType,p.derivedEntityId,p.sourceEntityType,p.sourceEntityId,p.relation,p.weight,p.extractionMethod,p.modelVersion]); return r.rows[0];
  }
}
