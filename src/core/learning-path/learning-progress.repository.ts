import type { LearningPath } from './learning-path.types';
import type { LearningProgressState } from './learning-progress';

export interface LearningProgressRepository{
  load(path:LearningPath):LearningProgressState;
  save(path:LearningPath,state:LearningProgressState):void;
  reset(path:LearningPath):void;
}
