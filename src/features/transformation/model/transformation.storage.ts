import type{TransformationDraft}from'./transformation.types';

export interface TransformationDraftRepository{
  load():TransformationDraft[];
  save(drafts:TransformationDraft[]):void;
}

const key='eil-transformation-drafts:v1';
export const localTransformationDraftRepository:TransformationDraftRepository={
  load(){try{return JSON.parse(localStorage.getItem(key)||'[]') as TransformationDraft[]}catch{return[]}},
  save(drafts){try{localStorage.setItem(key,JSON.stringify(drafts))}catch{}},
};
