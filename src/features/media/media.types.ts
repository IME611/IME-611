import type{ReactNode}from'react';

export type MediaKind='diagram'|'frequency'|'video'|'summary';

export interface MediaVisualSpec{
  id:string;
  chapter:number;
  kind:MediaKind;
  title:string;
  subtitle:string;
  labels:string[];
  note?:string;
  frequencyHz?:number;
}

export interface MediaCardProps{
  eyebrow?:string;
  title:string;
  description?:string;
  children:ReactNode;
}
