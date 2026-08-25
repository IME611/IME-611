import{readJson,writeJson}from'../../../core/storage';

type CardProgressState={schemaVersion:1;positions:Record<string,number>};
const STORAGE_KEY='eil-card-progress-v1';
const EVENT='eil:card-progress-changed';
const emptyState=():CardProgressState=>({schemaVersion:1,positions:{}});
const progressKey=(value:string|number)=>String(value);

function loadState():CardProgressState{
  const value=readJson<unknown>(STORAGE_KEY,emptyState());
  if(!value||typeof value!=='object')return emptyState();
  const parsed=value as Partial<CardProgressState>;
  if(parsed.schemaVersion!==1||!parsed.positions||typeof parsed.positions!=='object')return emptyState();
  return{schemaVersion:1,positions:Object.fromEntries(Object.entries(parsed.positions).filter(([,position])=>Number.isInteger(position)&&Number(position)>=0))};
}

function notify(){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(EVENT))}

export const cardProgressRepository={
  load(unitKey:string|number,cardCount:number){
    const position=loadState().positions[progressKey(unitKey)]??0;
    return Math.min(Math.max(0,position),Math.max(0,cardCount-1));
  },
  save(unitKey:string|number,position:number){
    const state=loadState(),key=progressKey(unitKey);
    writeJson(STORAGE_KEY,{...state,positions:{...state.positions,[key]:Math.max(0,Math.floor(position))}});
    notify();
  },
  eventName:EVENT,
  storageKey:STORAGE_KEY,
};
