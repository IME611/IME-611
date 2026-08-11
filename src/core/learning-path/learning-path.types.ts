export type LearningStageId = string;
export type LearningPathId = string;

export type LearningObjective = {
  id: string;
  statement: string;
  evidenceOfUnderstanding?: string;
};

export type LearningStage = {
  id: LearningStageId;
  order: number;
  title: string;
  subtitle: string;
  guidingQuestion: string;
  sourceRefs: string[];
  requiredConceptRefs: string[];
  introducedConceptRefs: string[];
  objectives: LearningObjective[];
  revisits: LearningStageId[];
  unlock: {
    prerequisiteStageIds: LearningStageId[];
    mode: 'ALL' | 'ANY';
  };
};

export type LearningPath = {
  id: LearningPathId;
  version: number;
  title: string;
  purpose: string;
  entryQuestion: string;
  stages: LearningStage[];
};

export type LearnerProgress = {
  completedStageIds: LearningStageId[];
};

export function isStageUnlocked(stage: LearningStage, progress: LearnerProgress): boolean {
  const prerequisites = stage.unlock.prerequisiteStageIds;
  if (!prerequisites.length) return true;
  return stage.unlock.mode === 'ALL'
    ? prerequisites.every(id => progress.completedStageIds.includes(id))
    : prerequisites.some(id => progress.completedStageIds.includes(id));
}
