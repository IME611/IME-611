import type { InsightStatus, UUID } from '../shared/entity.types';
import type { ProvenanceRepository, ProvenanceTraceSummary } from './provenance.repository';

export interface ProvenanceValidationResult {
  insightId: UUID;
  valid: boolean;
  effectiveStatus: InsightStatus;
  reason: string | null;
  trace: ProvenanceTraceSummary;
}

export class ProvenanceService {
  constructor(private readonly repository: ProvenanceRepository) {}

  async validateInsight(insightId: UUID): Promise<ProvenanceValidationResult> {
    const insight = await this.repository.getInsightState(insightId);
    if (!insight) {
      throw new Error(`Insight not found: ${insightId}`);
    }

    const trace = await this.repository.getInsightTraceSummary(insightId);

    const hasCanonicalSupport =
      trace.supportingClaimCount > 0 &&
      trace.supportingEvidenceCount > 0 &&
      trace.fragmentCount > 0 &&
      trace.sourceCount > 0;

    if (!hasCanonicalSupport) {
      if (insight.status !== 'HYPOTHESIS') {
        await this.repository.setInsightHypothesis(insightId);
      }

      return {
        insightId,
        valid: false,
        effectiveStatus: 'HYPOTHESIS',
        reason: 'Canonical provenance chain is incomplete: Insight → Claim/Connection → Evidence → SourceFragment → Source.',
        trace,
      };
    }

    if (trace.hasContradictingEvidence) {
      return {
        insightId,
        valid: true,
        effectiveStatus: 'CHALLENGED',
        reason: 'Canonical provenance exists, but at least one linked claim has contradicting evidence.',
        trace,
      };
    }

    return {
      insightId,
      valid: true,
      effectiveStatus: insight.status === 'RETIRED' ? 'RETIRED' : 'SUPPORTED',
      reason: null,
      trace,
    };
  }
}
