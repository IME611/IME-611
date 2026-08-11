import type { LearnerProgress, LearningPath, LearningStage } from './learning-path.types';
import { isStageUnlocked } from './learning-path.types';

export type StagePlan = {
  stage: LearningStage;
  unlocked: boolean;
  revisitedStages: LearningStage[];
  nextStage?: LearningStage;
};

export function planStage(path: LearningPath, stageId: string, progress: LearnerProgress): StagePlan {
  const stage = path.stages.find(item => item.id === stageId);
  if (!stage) throw new Error(`Unknown learning stage: ${stageId}`);
  const revisitedStages = stage.revisits
    .map(id => path.stages.find(item => item.id === id))
    .filter((item): item is LearningStage => Boolean(item));
  const nextStage = path.stages.find(item => item.order === stage.order + 1);
  return { stage, unlocked: isStageUnlocked(stage, progress), revisitedStages, nextStage };
}

export function nextUnlockedStage(path: LearningPath, progress: LearnerProgress): LearningStage | undefined {
  return path.stages
    .filter(stage => !progress.completedStageIds.includes(stage.id))
    .find(stage => isStageUnlocked(stage, progress));
}
