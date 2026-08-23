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
const LEGACY_KEY='eil-crystals';
const EVENT='eil:crystals-changed';

const isRecord=(value:unknown):value is CrystalRecord=>{
 if(!value||typeof value!=='object')return false;
 const record=value as Partial<CrystalRecord>;
 return typeof record.fragmentId==='string'&&typeof record.conceptId==='string'&&typeof record.topic==='string'&&typeof record.text==='string'&&typeof record.sourceLabel==='string'&&typeof record.provenanceLabel==='string'&&typeof record.savedAt==='string';
};

function safeArray(value:string|null):unknown[]{
 try{const parsed=JSON.parse(value||'[]');return Array.isArray(parsed)?parsed:[]}catch{return[]}
}

function migrateLegacy(items:unknown[]):CrystalRecord[]{
 return items.flatMap((value,index)=>{
  if(!value||typeof value!=='object')return[];
  const item=value as Record<string,unknown>,text=String(item.text||item.summary||'').trim();
  if(!text)return[];
  const chapter=Number(item.chapterNum||0),savedAt=String(item.date||item.savedAt||new Date(0).toISOString());
  return[{
   fragmentId:`personal-legacy-${chapter||'general'}-${savedAt}-${index}`,
   conceptId:chapter?`chapter-${chapter}`:'personal-insight',
   topic:String(item.topic||item.title||'תובנה אישית'),
   subtopic:'תובנה אישית',
   text,
   sourceLabel:chapter?`פרק ${chapter}`:'נכתב במסע האישי',
   provenanceLabel:chapter?`נכתב לאחר קריאת פרק ${chapter}`:'נכתב על ידי המשתמש',
   savedAt,
  }];
 });
}

function writeCache(records:CrystalRecord[]):boolean{
 if(typeof window==='undefined')return false;
 try{
  window.localStorage.setItem(CACHE_KEY,JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(EVENT));
  return true;
 }catch{return false}
}

function readCache():CrystalRecord[]{
 if(typeof window==='undefined')return[];
 const current=safeArray(window.localStorage.getItem(CACHE_KEY)).filter(isRecord);
 const legacy=migrateLegacy(safeArray(window.localStorage.getItem(LEGACY_KEY)));
 if(!legacy.length)return current;
 const known=new Set(current.map(item=>item.fragmentId));
 const merged=[...current,...legacy.filter(item=>!known.has(item.fragmentId))];
 try{
  window.localStorage.setItem(CACHE_KEY,JSON.stringify(merged));
  window.localStorage.removeItem(LEGACY_KEY);
  window.dispatchEvent(new CustomEvent(EVENT));
  return merged;
 }catch{return current}
}

export const crystalCollectionRepository={
 load:readCache,
 save(record:CrystalRecord){
  const text=record.text.trim();
  if(!text)return false;
  const current=readCache(),next={...record,text,savedAt:record.savedAt||new Date().toISOString()};
  const index=current.findIndex(item=>item.fragmentId===record.fragmentId);
  if(index>=0)current[index]=next;else current.unshift(next);
  return writeCache(current);
 },
 toggle(record:CrystalRecord){
  const current=readCache(),exists=current.some(item=>item.fragmentId===record.fragmentId);
  const next=exists?current.filter(item=>item.fragmentId!==record.fragmentId):[{...record,savedAt:new Date().toISOString()},...current];
  return writeCache(next)?!exists:exists;
 },
 has(fragmentId:string){return readCache().some(item=>item.fragmentId===fragmentId)},
 clear(){return writeCache([])},
 eventName:EVENT,
 storageKeys:[CACHE_KEY,LEGACY_KEY] as const,
};
