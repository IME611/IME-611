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

export const journeyStorage={
  mode:()=>readText(storageKeys.accessMode,'owner'),
  progress:()=>Number(readText(storageKeys.journeyProgress,'1')),
  setProgress:(value:number)=>writeText(storageKeys.journeyProgress,String(value)),
  reflectionKey:(chapter:number)=>`eil-chapter-reflection-${chapter}`,
};
