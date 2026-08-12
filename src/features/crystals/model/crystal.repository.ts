export type CrystalRecord={
 fragmentId:string;
 conceptId:string;
 topic:string;
 subtopic?:string;
 text:string;
 sourceLabel:string;
 provenanceLabel:string;
 savedAt:string;
};

const KEY='eil-crystals-v1';
const EVENT='eil:crystals-changed';

function safeParse(value:string|null):CrystalRecord[]{
 try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?parsed:[]}catch{return []}
}

export const crystalCollectionRepository={
 load():CrystalRecord[]{
  if(typeof window==='undefined')return[];
  return safeParse(window.localStorage.getItem(KEY));
 },
 save(records:CrystalRecord[]){
  if(typeof window==='undefined')return;
  window.localStorage.setItem(KEY,JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(EVENT));
 },
 toggle(record:CrystalRecord){
  const records=this.load();
  const exists=records.some(item=>item.fragmentId===record.fragmentId);
  const next=exists?records.filter(item=>item.fragmentId!==record.fragmentId):[...records,{...record,savedAt:new Date().toISOString()}];
  this.save(next);
  return!exists;
 },
 has(fragmentId:string){return this.load().some(item=>item.fragmentId===fragmentId)},
 clear(){this.save([])},
 eventName:EVENT,
};
