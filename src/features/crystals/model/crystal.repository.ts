import{ownerHeaders}from'../../../core/ownerIdentity';

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

const CACHE_KEY='eil-crystals-v1';
const EVENT='eil:crystals-changed';

function safeParse(value:string|null):CrystalRecord[]{
 try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?parsed:[]}catch{return[]}
}
function readCache():CrystalRecord[]{
 if(typeof window==='undefined')return[];
 return safeParse(window.localStorage.getItem(CACHE_KEY));
}
function writeCache(records:CrystalRecord[]){
 if(typeof window==='undefined')return;
 window.localStorage.setItem(CACHE_KEY,JSON.stringify(records));
 window.dispatchEvent(new CustomEvent(EVENT));
}

export const crystalCollectionRepository={
 load:readCache,
 async hydrate(){
  if(typeof window==='undefined')return[];
  try{
   const response=await fetch('/api/knowledge?resource=crystals',{headers:ownerHeaders()});
   if(!response.ok)throw new Error('crystal sync failed');
   const payload=await response.json();
   const records=Array.isArray(payload.records)?payload.records:[];
   writeCache(records);
   return records as CrystalRecord[];
  }catch{return readCache()}
 },
 async toggle(record:CrystalRecord){
  const current=readCache();
  const exists=current.some(item=>item.fragmentId===record.fragmentId);
  const optimistic=exists?current.filter(item=>item.fragmentId!==record.fragmentId):[...current,{...record,savedAt:new Date().toISOString()}];
  writeCache(optimistic);
  try{
   const response=await fetch('/api/knowledge?resource=crystals',{
    method:exists?'DELETE':'PUT',
    headers:{'Content-Type':'application/json',...ownerHeaders()},
    body:JSON.stringify(record),
   });
   if(!response.ok)throw new Error('crystal persistence failed');
  }catch{
   writeCache(current);
   return exists;
  }
  return!exists;
 },
 has(fragmentId:string){return readCache().some(item=>item.fragmentId===fragmentId)},
 async clear(){
  const records=readCache();
  writeCache([]);
  for(const record of records){
   await fetch('/api/knowledge?resource=crystals',{method:'DELETE',headers:{'Content-Type':'application/json',...ownerHeaders()},body:JSON.stringify({fragmentId:record.fragmentId})}).catch(()=>{});
  }
 },
 eventName:EVENT,
};
