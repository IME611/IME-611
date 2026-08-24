export type LearningCardType='OPENER'|'CONCEPT'|'EXAMPLE'|'REFLECTION'|'SUMMARY';

export type LearningCard={
  id:string;
  order:number;
  type:LearningCardType;
  title:string;
  text:string;
  sourceUnitIds:string[];
  editorialStatus:'SOURCE_DERIVED_DRAFT';
};

export type LearningCardChapter={
  chapterNumber:number;
  title:string;
  subtitle:string;
  guidingQuestion:string;
  whyHere:string;
  sourceFile:string;
  cards:LearningCard[];
};
