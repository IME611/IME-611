import type { LearningPath } from './learning-path.types';
import type { LearningProgressRepository } from './learning-progress.repository';
import { emptyLearningProgress, type LearningProgressState } from './learning-progress';

const keyFor=(path:LearningPath)=>`eil-learning-progress:${path.id}:v${path.version}`;

function normalize(path:LearningPath,state:LearningProgressState):LearningProgressState{
  const known=new Set(path.stages.map(stage=>stage.id));
  const completedStageIds=path.stages.filter(stage=>state.completedStageIds?.includes(stage.id)).map(stage=>stage.id);
  const reflections=Object.fromEntries(Object.entries(state.reflections||{}).filter(([stageId])=>known.has(stageId)));
  const activeStageId=path.stages.find(stage=>!completedStageIds.includes(stage.id))?.id??path.stages[path.stages.length-1]?.id;
  return{...state,learningPathId:path.id,learningPathVersion:path.version,completedStageIds,reflections,activeStageId};
}

export function loadLearningProgress(path:LearningPath):LearningProgressState{
  try{
    const raw=localStorage.getItem(keyFor(path));
    if(raw){
      const parsed=JSON.parse(raw) as LearningProgressState;
      if(parsed?.schemaVersion===1&&parsed.learningPathId===path.id&&parsed.learningPathVersion===path.version){return normalize(path,parsed);}
    }
    const legacyValue=Number(localStorage.getItem('eil-journey-progress')||1);
    const legacy=Number.isFinite(legacyValue)?Math.min(path.stages.length+1,Math.max(1,Math.floor(legacyValue))):1;
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
export function saveLearningProgress(path:LearningPath,state:LearningProgressState){
  try{
    const normalized=normalize(path,state);
    localStorage.setItem(keyFor(path),JSON.stringify(normalized));
    const next=path.stages.find(stage=>!normalized.completedStageIds.includes(stage.id))?.order??path.stages.length+1;
    localStorage.setItem('eil-journey-progress',String(next));
    if(typeof window!=='undefined')setTimeout(()=>window.dispatchEvent(new CustomEvent('eil:progress-changed')),0);
  }catch{}
}
export function resetLearningProgress(path:LearningPath){try{localStorage.removeItem(keyFor(path));localStorage.removeItem('eil-journey-progress')}catch{}}

export const localLearningProgressRepository:LearningProgressRepository={
  load:loadLearningProgress,
  save:saveLearningProgress,
  reset:resetLearningProgress,
};
