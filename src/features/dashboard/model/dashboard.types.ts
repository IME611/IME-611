export type InsightStatus='HYPOTHESIS'|'SUPPORTED'|'CHALLENGED'|'RETIRED';
export type ExperimentStatus='DRAFT'|'ACTIVE'|'COMPLETED'|'ABANDONED';

export interface DashboardInsight{
  id:string;
  statement:string;
  status:InsightStatus;
  evidence_strength:string|null;
  created_at:string;
}

export interface DashboardExperiment{
  id:string;
  insight_id:string;
  hypothesis:string;
  action:string;
  expected_signal:string;
  status:ExperimentStatus;
  started_at:string|null;
  ended_at:string|null;
  created_at:string;
  insight_statement:string;
  insight_status:InsightStatus;
}

export interface DashboardReflection{
  id:string;
  experiment_id:string;
  observation:string;
  outcome:string;
  interpretation:string;
  created_at:string;
  insight_id:string;
  insight_statement:string;
}

export interface DashboardCounts{
  sources:number;
  fragments:number;
  claims:number;
  evidence:number;
}

export interface DashboardSnapshot{
  insights:DashboardInsight[];
  experiments:DashboardExperiment[];
  reflections:DashboardReflection[];
  counts:DashboardCounts;
}

export type DashboardLoadState=
 |{status:'loading'}
 |{status:'error';message:string}
 |{status:'success';data:DashboardSnapshot};

export interface ProvenanceRow{
  insight_id:string;
  insight_statement:string;
  insight_status:InsightStatus;
  claim_id:string;
  claim_statement:string;
  evidence_id:string;
  evidence_relation:string;
  fragment_id:string;
  fragment_ordinal:number;
  fragment_text:string;
  fragment_start_offset:number|null;
  fragment_end_offset:number|null;
  source_id:string;
  source_title:string;
  source_author:string;
  source_content_hash:string;
  source_uri:string|null;
}
