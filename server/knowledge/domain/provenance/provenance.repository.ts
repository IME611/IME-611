import type { InsightState, UUID } from '../shared/entity.types';

export interface ProvenanceTraceSummary {
  insightId: UUID;
  supportingClaimCount: number;
  supportingEvidenceCount: number;
  fragmentCount: number;
  sourceCount: number;
  hasContradictingEvidence: boolean;
}

export interface ProvenanceRepository {
  getInsightState(insightId: UUID): Promise<InsightState | null>;
  getInsightTraceSummary(insightId: UUID): Promise<ProvenanceTraceSummary>;
  setInsightHypothesis(insightId: UUID): Promise<void>;
}
