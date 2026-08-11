import { createExperiment, createInsightFromClaims, reflectOnExperiment } from '../../synthesis/domain/core-loop/core-loop.service.js';

function stageContext(path,stageId){
  const stage=path?.stages?.find?.(item=>item.id===stageId);
  if(!stage)throw new Error(`Unknown learning stage: ${stageId}`);
  return{stage,metadata:{learningPathId:path.id,learningPathVersion:path.version,learningStageId:stage.id,learningStageOrder:stage.order,guidingQuestion:stage.guidingQuestion}};
}

export async function createStageInsight({repository,path,stageId,statement,claimIds,modelConfidence=null,metadata={}}){
  const context=stageContext(path,stageId);
  return createInsightFromClaims({repository,statement,claimIds,modelConfidence,metadata:{...metadata,...context.metadata}});
}

export async function createStageExperiment({repository,path,stageId,insightId,hypothesis,action,expectedSignal}){
  stageContext(path,stageId);
  return createExperiment({repository,insightId,hypothesis,action,expectedSignal});
}

export async function reflectOnStageExperiment({repository,path,stageId,experimentId,observation,outcome,interpretation}){
  const context=stageContext(path,stageId);
  const result=await reflectOnExperiment({repository,experimentId,observation,outcome,interpretation});
  return{...result,learning:{...context.metadata,reflectionPrompt:context.stage.guidingQuestion}};
}
