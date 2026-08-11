import type { LearningPath } from './learning-path.types';

export type LearningPathValidationIssue={code:string;message:string;stageId?:string};

export function validateLearningPath(path:LearningPath):LearningPathValidationIssue[]{
  const issues:LearningPathValidationIssue[]=[];
  const ids=new Set<string>();
  const orders=new Set<number>();
  const known=new Set(path.stages.map(stage=>stage.id));

  for(const stage of path.stages){
    if(ids.has(stage.id))issues.push({code:'DUPLICATE_STAGE_ID',message:`Duplicate stage id ${stage.id}`,stageId:stage.id});
    ids.add(stage.id);
    if(orders.has(stage.order))issues.push({code:'DUPLICATE_STAGE_ORDER',message:`Duplicate stage order ${stage.order}`,stageId:stage.id});
    orders.add(stage.order);
    if(!stage.guidingQuestion.trim())issues.push({code:'MISSING_GUIDING_QUESTION',message:'Stage requires a guiding question',stageId:stage.id});
    if(!stage.sourceRefs.length)issues.push({code:'MISSING_SOURCE',message:'Stage must reference at least one source',stageId:stage.id});
    for(const prerequisite of stage.unlock.prerequisiteStageIds){
      if(!known.has(prerequisite))issues.push({code:'UNKNOWN_PREREQUISITE',message:`Unknown prerequisite ${prerequisite}`,stageId:stage.id});
      const target=path.stages.find(item=>item.id===prerequisite);
      if(target&&target.order>=stage.order)issues.push({code:'FORWARD_PREREQUISITE',message:`Prerequisite ${prerequisite} must precede stage`,stageId:stage.id});
    }
    for(const revisit of stage.revisits){
      if(!known.has(revisit))issues.push({code:'UNKNOWN_REVISIT',message:`Unknown revisit ${revisit}`,stageId:stage.id});
      const target=path.stages.find(item=>item.id===revisit);
      if(target&&target.order>=stage.order)issues.push({code:'FORWARD_REVISIT',message:`Revisit ${revisit} must point backward`,stageId:stage.id});
    }
  }

  const ordered=[...path.stages].sort((a,b)=>a.order-b.order);
  ordered.forEach((stage,index)=>{if(stage.order!==index+1)issues.push({code:'NON_CONTIGUOUS_ORDER',message:`Expected order ${index+1}, got ${stage.order}`,stageId:stage.id})});
  return issues;
}

export function assertValidLearningPath(path:LearningPath):LearningPath{
  const issues=validateLearningPath(path);
  if(issues.length)throw new Error(`Invalid LearningPath ${path.id}@${path.version}: ${issues.map(x=>`${x.code}:${x.stageId??'path'}`).join(', ')}`);
  return path;
}
