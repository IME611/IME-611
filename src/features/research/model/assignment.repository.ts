import{RESEARCH_INBOX}from'./taxonomy';

export interface ResearchAssignment{fragmentId:string;topicId:string;subtopic:string;approved:boolean;updatedAt:string}
const CACHE_KEY='eil-research-assignments-v1';
const EVENT='eil-research-assignments';
const read=():ResearchAssignment[]=>{if(typeof window==='undefined')return[];try{const value=JSON.parse(localStorage.getItem(CACHE_KEY)||'[]');return Array.isArray(value)?value:[]}catch{return[]}};
const write=(items:ResearchAssignment[])=>{if(typeof window==='undefined')return;localStorage.setItem(CACHE_KEY,JSON.stringify(items));window.dispatchEvent(new CustomEvent(EVENT))};

export const assignmentRepository={
 list:read,
 get(fragmentId:string){return read().find(item=>item.fragmentId===fragmentId)},
 async hydrate(){return read()},
 upsert(input:Omit<ResearchAssignment,'updatedAt'>){
  const items=read();
  const next={...input,topicId:input.topicId||RESEARCH_INBOX,updatedAt:new Date().toISOString()};
  const index=items.findIndex(item=>item.fragmentId===input.fragmentId);
  if(index>=0)items[index]=next;else items.push(next);
  write(items);
  return next;
 },
 ensure(fragmentId:string,topicId=RESEARCH_INBOX){return this.get(fragmentId)??this.upsert({fragmentId,topicId,subtopic:'',approved:false})},
 eventName:EVENT,
};
