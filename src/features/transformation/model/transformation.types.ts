export type TransformationStep='SOURCE'|'CLAIM'|'INSIGHT'|'EXPERIMENT'|'REFLECTION'|'TRANSFORMATION';

export type ProvenanceDraft={
  sourceTitle:string;
  sourceFile:string;
  fragmentText:string;
  fragmentIndex:number;
};

export type TransformationDraft={
  id:string;
  createdAt:string;
  stage:TransformationStep;
  provenance:ProvenanceDraft;
  claim:string;
  insight:string;
  experiment:{action:string;expectedSignal:string;startsAt:string;endsAt:string};
  reflection:{observation:string;interpretation:string};
  transformation:{before:string;after:string};
};
