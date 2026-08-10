export type KnowledgeItem={id?:number;title:string;kind:string;content?:string;tags?:string[];source?:string};

export type Chapter={
  number:number;
  title:string;
  subtitle:string;
  sourceFile:string;
  paragraphs:string[];
  paragraphCount?:number;
  characterCount?:number;
};

export type Page={id:string;label:string;icon:string};

export type Evidence={chapter:number;sourceFile:string;paragraph:number;text:string};
export type Insight={id:string;title:string;topic:string;chapters:number[];confidence:string;evidence:Evidence[];traceable:boolean};
export type Experiment={id:string;title:string;why:string;done:boolean;createdAt:string};
export type Reflection={id:string;text:string;createdAt:string};
