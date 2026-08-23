import { useEffect, useMemo, useState } from 'react';
import type { LearningPath, LearningStage } from '../../../core/learning-path/learning-path.types';
import type { LearningProgressRepository } from '../../../core/learning-path/learning-progress.repository';
import { isStageUnlocked } from '../../../core/learning-path/learning-path.types';
import { completeLearningStage, type LearningProgressState } from '../../../core/learning-path/learning-progress';
import { localLearningProgressRepository } from '../../../core/learning-path/learning-progress.storage';
import { nextUnlockedStage } from '../../../core/learning-path/spiral-planner';

export function useLearningProgress(path:LearningPath,repository:LearningProgressRepository=localLearningProgressRepository){
  const[state,setState]=useState<LearningProgressState>(()=>repository.load(path));
  useEffect(()=>{
    const sync=()=>setState(repository.load(path));
    addEventListener('storage',sync);
    addEventListener('eil:progress-changed',sync);
    addEventListener('eil:progress-reset',sync);
    return()=>{
      removeEventListener('storage',sync);
      removeEventListener('eil:progress-changed',sync);
      removeEventListener('eil:progress-reset',sync);
    };
  },[path,repository]);
  const currentStage=useMemo(()=>nextUnlockedStage(path,state),[path,state]);
  const isUnlocked=(stage:LearningStage)=>isStageUnlocked(stage,state);
  const complete=(stageId:string,reflection?:string)=>{
    setState(previous=>{
      const next=completeLearningStage(previous,path,stageId,reflection);
      repository.save(path,next);
      return next;
    });
  };
  const reflectionFor=(stageId:string)=>state.reflections[stageId]?.text??'';
  return{state,currentStage,isUnlocked,complete,reflectionFor};
}
