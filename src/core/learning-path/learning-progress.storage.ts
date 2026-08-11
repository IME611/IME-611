import type { LearningPath } from './learning-path.types';
import { emptyLearningProgress, type LearningProgressState } from './learning-progress';

const keyFor=(path:LearningPath)=>`eil-learning-progress:${path.id}:v${path.version}`;

export function loadLearningProgress(path:LearningPath):LearningProgressState{
  try{
    const raw=localStorage.getItem(keyFor(path));
    if(raw){
      const parsed=JSON.parse(raw) as LearningProgressState;
      if(parsed?.schemaVersion===1&&parsed.learningPathId===path.id&&parsed.learningPathVersion===path.version){return parsed;}
    }
    const legacy=Math.max(1,Number(localStorage.getItem('eil-journey-progress')||1));
    const state=emptyLearningProgress(path);
    state.completedStageIds=path.stages.filter(stage=>stage.order<legacy).map(stage=>stage.id);
    const lastStage=path.stages[path.stages.length-1];
    state.activeStageId=path.stages.find(stage=>stage.order===legacy)?.id??lastStage?.id;
    for(const stage of path.stages){
      const reflection=localStorage.getItem(`eil-chapter-reflection-${stage.order}`)?.trim();
      if(reflection){const now=new Date().toISOString();state.reflections[stage.id]={stageId:stage.id,text:reflection,createdAt:now,updatedAt:now};}
    }
    saveLearningProgress(path,state);return state;
  }catch{return emptyLearningProgress(path)}
}
export function saveLearningProgress(path:LearningPath,state:LearningProgressState){try{localStorage.setItem(keyFor(path),JSON.stringify(state))}catch{}}
export function resetLearningProgress(path:LearningPath){try{localStorage.removeItem(keyFor(path))}catch{}}
