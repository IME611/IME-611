import{useEffect,useState}from'react';

export type PublishedLearningUnit={
 key:string;
 title:string;
 cardCount:number;
 sourceCount:number;
 publishedAt:string|null;
 legacyChapterNumber:number|null;
};

type State={loading:boolean;units:PublishedLearningUnit[];error:string|null};

export function usePublishedLearningUnits(){
 const[state,setState]=useState<State>({loading:true,units:[],error:null});
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/learning-publications',{signal:controller.signal,headers:{Accept:'application/json'}})
   .then(async response=>{const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||`HTTP ${response.status}`);return payload})
   .then(payload=>setState({loading:false,units:Array.isArray(payload.units)?payload.units.filter((unit:any)=>unit?.key&&unit?.title).map((unit:any)=>({key:String(unit.key),title:String(unit.title),cardCount:Number(unit.cardCount||0),sourceCount:Number(unit.sourceCount||0),publishedAt:unit.publishedAt?String(unit.publishedAt):null,legacyChapterNumber:Number.isInteger(Number(unit.legacyChapterNumber))?Number(unit.legacyChapterNumber):null})):[],error:null}))
   .catch(error=>{if(error?.name==='AbortError')return;setState({loading:false,units:[],error:String(error?.message||'לא ניתן לטעון יחידות שפורסמו')})});
  return()=>controller.abort();
 },[]);
 return state;
}
