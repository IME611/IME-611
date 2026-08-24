import{analyzeIntake as analyzeBaseIntake}from'./intake-analysis.service.js';
import{semanticMatcher,semanticCapability}from'../matching/semantic-matcher.js';

const words=value=>String(value||'').trim().split(/\s+/u).filter(Boolean).length;
const round=value=>Number((Number(value)||0).toFixed(4));

async function semanticRecords(db){
 const canonical=(await db.query(`SELECT id,canonical_name AS text,description FROM concepts ORDER BY canonical_name LIMIT 200`)).rows;
 const candidates=(await db.query(`
  SELECT c.id,c.candidate_text AS text,c.atom_type::text AS type,c.source_id,s.title AS source_title,
         COALESCE(s.metadata->>'sourceFile',s.metadata->>'originalFileName') AS source_file,c.metadata->>'section' AS section
  FROM extraction_candidates c JOIN sources s ON s.id=c.source_id
  WHERE c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge AND c.atom_type IN ('CONCEPT','DEFINITION','MODEL')
  ORDER BY CASE c.atom_type WHEN 'CONCEPT' THEN 0 WHEN 'DEFINITION' THEN 1 ELSE 2 END,c.confidence DESC,c.created_at
  LIMIT 300
 `)).rows;
 return[
  ...canonical.map(row=>({id:`canonical:${row.id}`,recordId:row.id,authority:'CANONICAL',type:'CONCEPT',text:row.text,description:row.description||'',sourceId:null,sourceTitle:null,sourceFile:null,section:null})),
  ...candidates.map(row=>({id:`candidate:${row.id}`,recordId:row.id,authority:'CANDIDATE',type:row.type,text:row.text,sourceId:row.source_id,sourceTitle:row.source_title,sourceFile:row.source_file||null,section:row.section||null})),
 ];
}

function semanticAssessment(text,matches=[]){
 const top=matches[0]||null,second=matches[1]||null;
 if(!top)return{suggestedVerdict:null,confidence:0,margin:0,reason:'No semantic match was returned.'};
 const margin=round(top.score-(second?.score||0)),tokenCount=words(text);
 if(top.score>=.9&&margin>=.035&&tokenCount<=32)return{suggestedVerdict:'EXISTS',confidence:round(Math.min(.94,.72+top.score*.22)),margin,reason:'A high-confidence semantic equivalent is present in the concept/model index; creator review is still required.'};
 if(top.score>=.82&&margin>=.02)return{suggestedVerdict:'RELATED',confidence:round(Math.min(.9,.58+top.score*.28)),margin,reason:'Semantic similarity is strong enough to surface existing knowledge even when wording differs.'};
 if(top.score>=.72)return{suggestedVerdict:'UNCERTAIN',confidence:round(.52+top.score*.18),margin,reason:'Semantic similarity exists, but it is not strong enough to claim equivalence safely.'};
 return{suggestedVerdict:null,confidence:round(Math.max(.45,top.score)),margin,reason:'Semantic evidence is too weak to change the deterministic verdict.'};
}

function mergeVerdict(base,semantic){
 const original=base.verdict||'UNCERTAIN',suggested=semantic?.assessment?.suggestedVerdict;
 if(!suggested||['CONFLICTS','EXISTS','EXTENDS'].includes(original))return{...base,semanticAdjusted:false};
 if(suggested==='EXISTS'&&['NEW','UNCERTAIN','RELATED'].includes(original))return{verdict:'EXISTS',confidence:Math.min(.92,Math.max(Number(base.confidence)||0,semantic.assessment.confidence)),reason:semantic.assessment.reason,provisional:true,semanticAdjusted:true};
 if(suggested==='RELATED'&&['NEW','UNCERTAIN'].includes(original))return{verdict:'RELATED',confidence:Math.max(Number(base.confidence)||0,semantic.assessment.confidence),reason:semantic.assessment.reason,provisional:true,semanticAdjusted:true};
 if(suggested==='UNCERTAIN'&&original==='NEW')return{verdict:'UNCERTAIN',confidence:Math.max(.55,semantic.assessment.confidence),reason:semantic.assessment.reason,provisional:true,semanticAdjusted:true};
 return{...base,semanticAdjusted:false};
}

export async function analyzeIntake(db,payload){
 const base=await analyzeBaseIntake(db,payload),capability=semanticCapability();
 if(!capability.available)return{...base,analysisVersion:'intake-v0.3',verdict:{...base.verdict,semanticModel:false},semantic:{...capability,status:'UNAVAILABLE',matches:[]},policy:{...base.policy,semanticMatching:false,semanticFallback:'deterministic-concept-aware'}};
 try{
  const records=await semanticRecords(db),ranked=await semanticMatcher.rank(payload.text,records,{topK:8}),assessment=semanticAssessment(payload.text,ranked.matches),semantic={status:'AVAILABLE',provider:ranked.provider,model:ranked.model,assessment,matches:ranked.matches.slice(0,8).map(match=>({id:match.recordId||match.id,authority:match.authority,type:match.type,text:match.text,score:round(match.score),sourceId:match.sourceId||null,sourceTitle:match.sourceTitle||null,sourceFile:match.sourceFile||null,section:match.section||null})),usage:ranked.usage||null,authority:'REVIEW_SUGGESTION_ONLY'};
  return{...base,analysisVersion:'intake-v0.3',verdict:{...mergeVerdict(base.verdict,semantic),semanticModel:true},semantic,policy:{...base.policy,semanticMatching:true,semanticAuthority:'REVIEW_SUGGESTION_ONLY',autoMerge:false,note:'Deterministic evidence remains the safety baseline. Semantic ranking can improve provisional discovery across synonyms/paraphrases but never performs canonical merge, placement, relation, or curriculum writes.'}};
 }catch(error){
  return{...base,analysisVersion:'intake-v0.3',verdict:{...base.verdict,semanticModel:false},semantic:{...capability,status:'DEGRADED',errorCode:String(error?.code||'SEMANTIC_FAILED'),matches:[]},policy:{...base.policy,semanticMatching:false,semanticFallback:'deterministic-concept-aware'}};
 }
}
