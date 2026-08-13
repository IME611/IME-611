import{ownerHeaders}from'../../../core/ownerIdentity';
import{RESEARCH_INBOX}from'./taxonomy';

export interface ResearchAssignment{fragmentId:string;topicId:string;subtopic:string;approved:boolean;updatedAt:string}
const CACHE_KEY='eil-research-assignments-v1';
const EVENT='eil-research-assignments';
const read=():ResearchAssignment[]=>{if(typeof window==='undefined')return[];try{const value=JSON.parse(localStorage.getItem(CACHE_KEY)||'[]');return Array.isArray(value)?value:[]}catch{return[]}};
const write=(items:ResearchAssignment[])=>{if(typeof window==='undefined')return;localStorage.setItem(CACHE_KEY,JSON.stringify(items));window.dispatchEvent(new CustomEvent(EVENT))};

export const assignmentRepository={
 list:read,
 get(fragmentId:string){return read().find(item=>item.fragmentId===fragmentId)},
 async hydrate(){
  if(typeof window==='undefined')return[];
  try{
   const response=await fetch('/api/knowledge?resource=taxonomy',{headers:ownerHeaders()});
   if(!response.ok)throw new Error('taxonomy sync failed');
   const payload=await response.json();
   const assignments=Array.isArray(payload.assignments)?payload.assignments:[];
   write(assignments);
   return assignments as ResearchAssignment[];
  }catch{return read()}
 },
 upsert(input:Omit<ResearchAssignment,'updatedAt'>){
  const items=read();
  const next={...input,topicId:input.topicId||RESEARCH_INBOX,updatedAt:new Date().toISOString()};
  const index=items.findIndex(item=>item.fragmentId===input.fragmentId);
  if(index>=0)items[index]=next;else items.push(next);
  write(items);
  fetch('/api/knowledge?resource=taxonomy',{method:'PUT',headers:{'Content-Type':'application/json',...ownerHeaders()},body:JSON.stringify(next)}).catch(()=>{});
  return next;
 },
 ensure(fragmentId:string,topicId=RESEARCH_INBOX){return this.get(fragmentId)??this.upsert({fragmentId,topicId,subtopic:'',approved:false})},
 eventName:EVENT,
};
