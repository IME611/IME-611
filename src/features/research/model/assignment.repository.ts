import{RESEARCH_INBOX}from'./taxonomy';

export interface ResearchAssignment{fragmentId:string;topicId:string;subtopic:string;approved:boolean;updatedAt:string}
const KEY='eil-research-assignments-v1';
const read=():ResearchAssignment[]=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}};
const write=(items:ResearchAssignment[])=>{localStorage.setItem(KEY,JSON.stringify(items));window.dispatchEvent(new CustomEvent('eil-research-assignments'))};
export const assignmentRepository={
 list:read,
 get(fragmentId:string){return read().find(item=>item.fragmentId===fragmentId)},
 upsert(input:Omit<ResearchAssignment,'updatedAt'>){const items=read();const next={...input,topicId:input.topicId||RESEARCH_INBOX,updatedAt:new Date().toISOString()};const index=items.findIndex(item=>item.fragmentId===input.fragmentId);if(index>=0)items[index]=next;else items.push(next);write(items);return next},
 ensure(fragmentId:string,topicId=RESEARCH_INBOX){return this.get(fragmentId)??this.upsert({fragmentId,topicId,subtopic:'',approved:false})},
};
