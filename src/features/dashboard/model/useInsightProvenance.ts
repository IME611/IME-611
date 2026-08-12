import{useState}from'react';
import type{ProvenanceRow}from'./dashboard.types';

type ProvenanceState=
 |{status:'idle';insightId:null;rows:[]}
 |{status:'loading';insightId:string;rows:[]}
 |{status:'error';insightId:string;rows:[];message:string}
 |{status:'success';insightId:string;rows:ProvenanceRow[];complete:boolean};

export function useInsightProvenance(){
 const[state,setState]=useState<ProvenanceState>({status:'idle',insightId:null,rows:[]});
 const load=async(insightId:string)=>{
  setState({status:'loading',insightId,rows:[]});
  try{
   const response=await fetch(`/api/insights?mode=core-loop&insightId=${encodeURIComponent(insightId)}`);
   const body:unknown=await response.json();
   if(!response.ok||typeof body!=='object'||body===null)throw new Error('Provenance unavailable');
   const value=body as{error?:string;rows?:ProvenanceRow[];provenanceComplete?:boolean};
   if(value.error)throw new Error(value.error);
   setState({status:'success',insightId,rows:Array.isArray(value.rows)?value.rows:[],complete:value.provenanceComplete===true});
  }catch(error){setState({status:'error',insightId,rows:[],message:error instanceof Error?error.message:'Provenance unavailable'})}
 };
 const close=()=>setState({status:'idle',insightId:null,rows:[]});
 return{state,load,close};
}
