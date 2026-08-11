import { learningPath as presentationPath, stageLabels, worldLabels } from '../../../data/learning-path';
import { lifeResearchV1 } from '../../../data/learning-paths/life-research-v1';

export const journeyPath=lifeResearchV1;
export { stageLabels, worldLabels };

export function getJourneyStageByNumber(number:number){
  const stage=journeyPath.stages.find(item=>item.order===number);
  const presentation=presentationPath.find(item=>item.number===number);
  if(!stage||!presentation)return null;
  return{stage,presentation};
}

export function getJourneyBands(){
  const worlds=['SELF','BODY','MIND','SYSTEMS','MEANING'] as const;
  return worlds.map(world=>({
    world,
    label:worldLabels[world],
    entries:presentationPath
      .filter(item=>item.world===world)
      .map(presentation=>({presentation,stage:journeyPath.stages.find(stage=>stage.order===presentation.number)!}))
      .filter(item=>Boolean(item.stage)),
  }));
}
