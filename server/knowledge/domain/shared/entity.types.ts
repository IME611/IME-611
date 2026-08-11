export type UUID = string;
export type Sha256 = string;

export type SourceType =
  | 'DOCUMENT' | 'ARTICLE' | 'BOOK' | 'IMAGE' | 'VIDEO'
  | 'AUDIO' | 'WEB' | 'NOTE' | 'OTHER';

export interface Source {
  id: UUID;
  type: SourceType;
  title: string;
  author: string;
  originalUri: string | null;
  mimeType: string;
  rawContent: string | null;
  originalBytesUri: string | null;
  contentHash: Sha256;
  metadata: Record<string, unknown>;
  immutableOriginal: true;
  createdAt: Date;
}

export interface SourceFragment {
  id: UUID;
  sourceId: UUID;
  fragmenterVersion: string;
  ordinal: number;
  fragmentKey: Sha256;
  contentHash: Sha256;
  rawText: string;
  startOffset: number | null;
  endOffset: number | null;
  page: number | null;
  section: string | null;
  timestampStartMs: number | null;
  timestampEndMs: number | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export type ClaimType =
  | 'FACTUAL' | 'INTERPRETIVE' | 'CAUSAL' | 'NORMATIVE'
  | 'DEFINITIONAL' | 'EXPERIENTIAL' | 'HYPOTHESIS';

export type ClaimStatus =
  | 'EXTRACTED' | 'REVIEWED' | 'SUPPORTED' | 'CHALLENGED' | 'REJECTED';

export interface Claim {
  id: UUID;
  statement: string;
  normalizedHash: Sha256;
  type: ClaimType;
  status: ClaimStatus;
  modelConfidence: number | null;
  extractionMethod: string;
  modelVersion: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type EvidenceRelation = 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXTUALIZES';

export interface Evidence {
  id: UUID;
  claimId: UUID;
  fragmentId: UUID;
  relation: EvidenceRelation;
  evidenceStrength: number;
  extractionMethod: string;
  modelVersion: string | null;
  createdAt: Date;
}

export type DerivedEntityType =
  | 'CLAIM' | 'CONNECTION' | 'INSIGHT' | 'EXPERIMENT' | 'REFLECTION';

export type ProvenanceSourceEntityType =
  | 'SOURCE' | 'SOURCE_FRAGMENT' | 'CLAIM' | 'CONCEPT' | 'EVIDENCE'
  | 'CONNECTION' | 'INSIGHT' | 'EXPERIMENT' | 'REFLECTION';

export interface ProvenanceEdge {
  id: UUID;
  derivedEntityType: DerivedEntityType;
  derivedEntityId: UUID;
  sourceEntityType: ProvenanceSourceEntityType;
  sourceEntityId: UUID;
  relation: string;
  weight: number;
  extractionMethod: string;
  modelVersion: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export type InsightStatus = 'HYPOTHESIS' | 'SUPPORTED' | 'CHALLENGED' | 'RETIRED';

export interface InsightState {
  id: UUID;
  status: InsightStatus;
}
