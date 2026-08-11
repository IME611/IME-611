import type { InsightState, UUID } from '../../domain/shared/entity.types';
import type {
  ProvenanceRepository,
  ProvenanceTraceSummary,
} from '../../domain/provenance/provenance.repository';

export interface QueryResult<Row> { rows: Row[] }
export interface Queryable {
  query<Row = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<QueryResult<Row>>;
}

export interface InsightProvenanceTraceRow {
  insight_id: UUID;
  insight_statement: string;
  insight_status: string;
  connection_id: UUID | null;
  claim_id: UUID;
  claim_statement: string;
  claim_type: string;
  evidence_id: UUID;
  evidence_relation: string;
  evidence_strength: string | number;
  fragment_id: UUID;
  fragment_ordinal: number;
  fragment_text: string;
  fragment_start_offset: number | null;
  fragment_end_offset: number | null;
  source_id: UUID;
  source_title: string;
  source_author: string;
  source_content_hash: string;
  source_uri: string | null;
}

/**
 * One SQL roundtrip that traces an Insight back to canonical source text.
 * It supports both direct Insight → Claim provenance and
 * Insight → Connection → Claim provenance/connection endpoints.
 */
export const GET_INSIGHT_PROVENANCE_TRACE_SQL = `
WITH insight_root AS (
  SELECT id, statement, status
  FROM insights
  WHERE id = $1::uuid
),
insight_connections AS (
  SELECT pe.source_entity_id AS connection_id
  FROM provenance_edges pe
  JOIN insight_root i
    ON pe.derived_entity_type = 'INSIGHT'
   AND pe.derived_entity_id = i.id
  WHERE pe.source_entity_type = 'CONNECTION'
),
direct_claims AS (
  SELECT pe.source_entity_id AS claim_id, NULL::uuid AS connection_id
  FROM provenance_edges pe
  JOIN insight_root i
    ON pe.derived_entity_type = 'INSIGHT'
   AND pe.derived_entity_id = i.id
  WHERE pe.source_entity_type = 'CLAIM'
),
connection_provenance_claims AS (
  SELECT pe.source_entity_id AS claim_id, ic.connection_id
  FROM insight_connections ic
  JOIN provenance_edges pe
    ON pe.derived_entity_type = 'CONNECTION'
   AND pe.derived_entity_id = ic.connection_id
  WHERE pe.source_entity_type = 'CLAIM'
),
connection_endpoint_claims AS (
  SELECT
    CASE
      WHEN c.from_entity_type = 'CLAIM' THEN c.from_entity_id
      WHEN c.to_entity_type = 'CLAIM' THEN c.to_entity_id
    END AS claim_id,
    c.id AS connection_id
  FROM insight_connections ic
  JOIN connections c ON c.id = ic.connection_id
  WHERE c.from_entity_type = 'CLAIM' OR c.to_entity_type = 'CLAIM'
),
insight_claims AS (
  SELECT DISTINCT claim_id, connection_id FROM direct_claims
  UNION
  SELECT DISTINCT claim_id, connection_id FROM connection_provenance_claims
  UNION
  SELECT DISTINCT claim_id, connection_id FROM connection_endpoint_claims
),
canonical_trace AS (
  SELECT
    i.id AS insight_id,
    i.statement AS insight_statement,
    i.status::text AS insight_status,
    ic.connection_id,
    c.id AS claim_id,
    c.statement AS claim_statement,
    c.type::text AS claim_type,
    e.id AS evidence_id,
    e.relation::text AS evidence_relation,
    e.evidence_strength,
    f.id AS fragment_id,
    f.ordinal AS fragment_ordinal,
    f.raw_text AS fragment_text,
    f.start_offset AS fragment_start_offset,
    f.end_offset AS fragment_end_offset,
    s.id AS source_id,
    s.title AS source_title,
    s.author AS source_author,
    s.content_hash AS source_content_hash,
    s.original_uri AS source_uri
  FROM insight_root i
  JOIN insight_claims ic ON TRUE
  JOIN claims c ON c.id = ic.claim_id
  JOIN evidence e ON e.claim_id = c.id
  JOIN source_fragments f ON f.id = e.fragment_id
  JOIN sources s ON s.id = f.source_id
)
SELECT *
FROM canonical_trace
ORDER BY source_id, fragment_ordinal, claim_id, evidence_id;
`;

const GET_INSIGHT_STATE_SQL = `
  SELECT id, status::text AS status
  FROM insights
  WHERE id = $1::uuid
`;

const SET_INSIGHT_HYPOTHESIS_SQL = `
  UPDATE insights
  SET status = 'HYPOTHESIS', updated_at = NOW()
  WHERE id = $1::uuid AND status <> 'HYPOTHESIS'
`;

export async function getInsightProvenanceTrace(
  db: Queryable,
  insightId: UUID,
): Promise<InsightProvenanceTraceRow[]> {
  const result = await db.query<InsightProvenanceTraceRow>(GET_INSIGHT_PROVENANCE_TRACE_SQL, [insightId]);
  return result.rows;
}

export class PostgresProvenanceRepository implements ProvenanceRepository {
  constructor(private readonly db: Queryable) {}

  async getInsightState(insightId: UUID): Promise<InsightState | null> {
    const result = await this.db.query<{ id: UUID; status: InsightState['status'] }>(GET_INSIGHT_STATE_SQL, [insightId]);
    return result.rows[0] ?? null;
  }

  async getInsightTraceSummary(insightId: UUID): Promise<ProvenanceTraceSummary> {
    const rows = await getInsightProvenanceTrace(this.db, insightId);
    const supporting = rows.filter(row => row.evidence_relation === 'SUPPORTS');

    return {
      insightId,
      supportingClaimCount: new Set(supporting.map(row => row.claim_id)).size,
      supportingEvidenceCount: new Set(supporting.map(row => row.evidence_id)).size,
      fragmentCount: new Set(supporting.map(row => row.fragment_id)).size,
      sourceCount: new Set(supporting.map(row => row.source_id)).size,
      hasContradictingEvidence: rows.some(row => row.evidence_relation === 'CONTRADICTS'),
    };
  }

  async setInsightHypothesis(insightId: UUID): Promise<void> {
    await this.db.query(SET_INSIGHT_HYPOTHESIS_SQL, [insightId]);
  }
}
