import{useEffect,useMemo,useState}from'react';
import{lifeResearchV1}from'../../../data/learning-paths/life-research-v1';
import{localLearningProgressRepository}from'../../../core/learning-path/learning-progress.storage';
import{nextUnlockedStage}from'../../../core/learning-path/spiral-planner';
import{localTransformationDraftRepository}from'../../transformation/model/transformation.storage';
import type{TransformationDraft}from'../../transformation/model/transformation.types';
import type{DashboardLoadState,DashboardSnapshot}from'./dashboard.types';

const emptySnapshot:DashboardSnapshot={insights:[],experiments:[],reflections:[],counts:{sources:0,fragments:0,claims:0,evidence:0}};

export function useProductDashboard(){
 const[state,setState]=useState<DashboardLoadState>({status:'loading'});
 const progress=useMemo(()=>localLearningProgressRepository.load(lifeResearchV1),[]);
 const drafts=useMemo(()=>localTransformationDraftRepository.load(),[]);
 const owner=useMemo(()=>{try{return localStorage.getItem('eil-access-mode')==='owner'}catch{return false}},[]);
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/insights?mode=dashboard',{signal:controller.signal})
   .then(async response=>{const body=await response.json();if(!response.ok||!body?.ok)throw new Error(body?.error||'Dashboard unavailable');return body as DashboardSnapshot&{ok:true}})
   .then(body=>setState({status:'success',data:{insights:body.insights||[],experiments:body.experiments||[],reflections:body.reflections||[],counts:body.counts||emptySnapshot.counts}}))
   .catch(error=>{if(error?.name!=='AbortError')setState({status:'error',message:error instanceof Error?error.message:'Dashboard unavailable'})});
  return()=>controller.abort();
 },[]);
 const completed=progress.completedStageIds.length;
 const activeStage=lifeResearchV1.stages.find(stage=>stage.id===progress.activeStageId)??nextUnlockedStage(lifeResearchV1,{completedStageIds:progress.completedStageIds})??lifeResearchV1.stages[0];
 const latestTransformation=[...drafts].reverse().find((draft:TransformationDraft)=>draft.transformation.after.trim()||draft.reflection.observation.trim())??null;
 return{state,owner,progress,completed,total:lifeResearchV1.stages.length,activeStage,latestTransformation,path:lifeResearchV1};
}
