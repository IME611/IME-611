export const storageKeys={
  accessMode:'eil-access-mode',
  journeyProgress:'eil-journey-progress',
  focus:'eil-focus',
  actions:'eil-actions',
  reflections:'eil-reflections',
  originAnswer:'eil-origin-answer',
  railCollapsed:'eil-rail',
  localItems:'eil-items',
} as const;

export function readText(key:string,fallback=''){try{return localStorage.getItem(key)||fallback}catch{return fallback}}
export function writeText(key:string,value:string){try{localStorage.setItem(key,value)}catch{}}
export function readJson<T>(key:string,fallback:T):T{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}catch{return fallback}}
export function writeJson(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
export function removeStored(key:string){try{localStorage.removeItem(key)}catch{}}
const PERSONAL_PROGRESS_KEYS=new Set([
  'eil-actions',
  'eil-card-progress-v1',
  'eil-crystals',
  'eil-crystals-v1',
  'eil-focus',
  'eil-journey-progress',
  'eil-learnings',
  'eil-origin-answer',
  'eil-progress',
  'eil-reflections',
  'eil-transformation-drafts:v1',
]);
const PERSONAL_PROGRESS_PREFIXES=['eil-chapter-reflection-','eil-learning-progress:'];

export function resetPersonalProgress():number{
  if(typeof window==='undefined')return 0;
  try{
    const keys=Array.from({length:window.localStorage.length},(_,index)=>window.localStorage.key(index)).filter((key):key is string=>Boolean(key));
    const removable=keys.filter(key=>PERSONAL_PROGRESS_KEYS.has(key)||PERSONAL_PROGRESS_PREFIXES.some(prefix=>key.startsWith(prefix)));
    removable.forEach(key=>window.localStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent('eil:crystals-changed'));
    window.dispatchEvent(new CustomEvent('eil:progress-reset'));
    return removable.length;
  }catch{return 0}
}

export const journeyStorage={
  mode:()=>readText(storageKeys.accessMode,'owner'),
  progress:()=>Number(readText(storageKeys.journeyProgress,'1')),
  setProgress:(value:number)=>writeText(storageKeys.journeyProgress,String(value)),
  reflectionKey:(chapter:number)=>`eil-chapter-reflection-${chapter}`,
};
