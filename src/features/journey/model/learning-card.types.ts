export type LearningCardType='OPENER'|'CONCEPT'|'EXAMPLE'|'REFLECTION'|'SUMMARY';

export type LearningCard={
  id:string;
  order:number;
  type:LearningCardType;
  title:string;
  text:string;
  sourceUnitIds:string[];
  evidenceRefs?:string[];
  sourceId?:string;
  sourceLabel?:string;
  provenanceLabel?:string;
  publicationId?:string;
  publicationVersion?:number;
  editorialStatus:'SOURCE_DERIVED_DRAFT'|'CREATOR_PUBLISHED';
};

export type LearningCardChapter={
  chapterNumber?:number;
  unitKey?:string;
  displayNumber?:string;
  title:string;
  subtitle:string;
  guidingQuestion:string;
  whyHere:string;
  sourceFile:string;
  cards:LearningCard[];
};
