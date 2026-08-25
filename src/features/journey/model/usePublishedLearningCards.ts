import{useEffect,useState}from'react';
import type{LearningCard,LearningCardType}from'./learning-card.types';

const CARD_TYPES=new Set<LearningCardType>(['OPENER','CONCEPT','EXAMPLE','REFLECTION','SUMMARY']);
type State={loading:boolean;cards:LearningCard[];error:string|null;schemaReady:boolean};

function normalizeCards(value:unknown):LearningCard[]{
 if(!Array.isArray(value))return[];
 return value.flatMap((row:any,index)=>{
  const type=String(row?.type||'CONCEPT') as LearningCardType;
  if(!row?.id||!row?.title||!row?.text||!CARD_TYPES.has(type))return[];
  const sourceUnitIds=Array.isArray(row.sourceUnitIds)?row.sourceUnitIds.map(String):Array.isArray(row.sourceCandidateIds)?row.sourceCandidateIds.map((id:any)=>`candidate:${String(id)}`):[];
  return[{id:String(row.id),order:index+1,type,title:String(row.title),text:String(row.text),sourceUnitIds,sourceId:row.sourceId?String(row.sourceId):undefined,sourceLabel:row.sourceLabel?String(row.sourceLabel):undefined,provenanceLabel:row.provenanceLabel?String(row.provenanceLabel):undefined,publicationId:row.publicationId?String(row.publicationId):undefined,publicationVersion:Number(row.publicationVersion||0),editorialStatus:'CREATOR_PUBLISHED' as const}];
 });
}

export function usePublishedLearningCards(target:number|string){
 const[state,setState]=useState<State>({loading:true,cards:[],error:null,schemaReady:false});
 useEffect(()=>{
  const controller=new AbortController();setState(current=>({...current,loading:true,error:null}));
  const url=typeof target==='number'?`/api/knowledge?resource=published-learning-cards&chapter=${target}`:`/api/learning-graph?resource=published-units&learningUnitKey=${encodeURIComponent(target)}`;
  fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}})
   .then(async response=>{const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||`HTTP ${response.status}`);return payload})
   .then(payload=>setState({loading:false,cards:normalizeCards(payload.cards),error:null,schemaReady:payload.schemaReady!==false}))
   .catch(error=>{if(error?.name==='AbortError')return;setState({loading:false,cards:[],error:String(error?.message||'לא ניתן לטעון כרטיסיות שפורסמו'),schemaReady:false})});
  return()=>controller.abort();
 },[target]);
 return state;
}
