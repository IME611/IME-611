import { isStageUnlocked, type LearningPath, type LearningStageId } from './learning-path.types';

export type StageReflection = {
  stageId: LearningStageId;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type LearningProgressState = {
  schemaVersion: 1;
  learningPathId: string;
  learningPathVersion: number;
  completedStageIds: LearningStageId[];
  reflections: Record<LearningStageId, StageReflection>;
  activeStageId?: LearningStageId;
};

export function emptyLearningProgress(path: LearningPath): LearningProgressState {
  return {
    schemaVersion: 1,
    learningPathId: path.id,
    learningPathVersion: path.version,
    completedStageIds: [],
    reflections: {},
    activeStageId: path.stages[0]?.id,
  };
}

export function completeLearningStage(
  state: LearningProgressState,
  path: LearningPath,
  stageId: LearningStageId,
  reflection?: string,
): LearningProgressState {
  const stage = path.stages.find(item => item.id === stageId);
  if (!stage) throw new Error(`Unknown learning stage: ${stageId}`);
  if (!state.completedStageIds.includes(stageId) && !isStageUnlocked(stage, state)) {
    throw new Error(`Locked learning stage cannot be completed: ${stageId}`);
  }

  const completed = state.completedStageIds.includes(stageId)
    ? state.completedStageIds
    : [...state.completedStageIds, stageId];
  const now = new Date().toISOString();
  const next = path.stages.find(item => !completed.includes(item.id));

  return {
    ...state,
    completedStageIds: completed,
    activeStageId: next?.id ?? stageId,
    reflections: reflection?.trim()
      ? {
          ...state.reflections,
          [stageId]: {
            stageId,
            text: reflection.trim(),
            createdAt: state.reflections[stageId]?.createdAt ?? now,
            updatedAt: now,
          },
        }
      : state.reflections,
  };
}

export function stageNumberFromId(stageId: string): number | null {
  const match = stageId.match(/stage-(\d+)$/);
  return match ? Number(match[1]) : null;
}
