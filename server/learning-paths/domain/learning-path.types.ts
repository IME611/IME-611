export interface LearningStage {
  id: string;
  order: number;
  title: string;
  question: string;
  learningObjectives: string[];
  requiredConceptIds: string[];
  introducedConceptIds: string[];
  sourceIds: string[];
  nextStageId: string | null;
}
export interface LearningPath {
  id: string;
  version: string;
  title: string;
  description: string;
  stages: LearningStage[];
}
// Learning paths reference Knowledge Domain IDs; they never own Sources/Claims/Evidence.
