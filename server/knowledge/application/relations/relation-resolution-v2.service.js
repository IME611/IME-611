import{buildEmergentCorpusMapPreview}from'../map/emergent-corpus-map.service.js';
import{rankRelationEndpointSuggestions}from'./relation-endpoint-suggestions.service.js';
import{semanticMatcher,semanticCapability}from'../matching/semantic-matcher.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const round=value=>Number((Number(value)||0).toFixed(4));

function semanticAssessment(matches){
 const top=matches[0]||null,second=matches[1]||null;
 if(!top)return{band:'NONE',topScore:0,margin:0,recommendedNodeId:null,reason:'No semantic map-node match was returned.'};
 const margin=round(top.score-(second?.score||0));
 if(top.score>=.9&&margin>=.04)return{band:'STRONG',topScore:round(top.score),margin,recommendedNodeId:top.id,reason:'Strong semantic agreement with a clear margin; creator confirmation is still required.'};
 if(top.score>=.82&&margin>=.02)return{band:'PLAUSIBLE',topScore:round(top.score),margin,recommendedNodeId:null,reason:'Good semantic agreement, but creator judgment is required before endpoint resolution.'};
 if(top.score>=.78&&margin<.02)return{band:'AMBIGUOUS',topScore:round(top.score),margin,recommendedNodeId:null,reason:'Multiple map nodes are semantically close; do not resolve automatically.'};
 return{band:'WEAK',topScore:round(top.score),margin,recommendedNodeId:null,reason:'Semantic evidence is not strong enough to prioritize safely.'};
}

async function sideSuggestions(label,nodes,sourceFile){
 const deterministic=rankRelationEndpointSuggestions(label,nodes,{sourceFile,limit:5}),capability=semanticCapability();
 if(!capability.available)return{deterministic,semantic:{...capability,status:'UNAVAILABLE',assessment:null,suggestions:[]},combinedRecommendation:null};
 try{
  const records=nodes.filter(node=>['CONCEPT','SECTION_TOPIC'].includes(node.kind)).map(node=>({id:node.id,text:node.label,node})),ranked=await semanticMatcher.rank(label,records,{topK:5}),assessment=semanticAssessment(ranked.matches),suggestions=ranked.matches.map((match,index)=>({nodeId:match.id,kind:match.node.kind,label:match.node.label,score:round(match.score),rank:index+1,sameSource:Boolean(sourceFile&&match.node.sourceFiles?.includes(sourceFile)),recommended:assessment.recommendedNodeId===match.id}));
  const deterministicStrong=deterministic.assessment?.band==='STRONG'?deterministic.assessment.recommendedNodeId:null,semanticStrong=assessment.band==='STRONG'?assessment.recommendedNodeId:null,agreement=Boolean(deterministicStrong&&semanticStrong&&deterministicStrong===semanticStrong);
  return{deterministic,semantic:{status:'AVAILABLE',provider:ranked.provider,model:ranked.model,assessment,suggestions,authority:'REVIEW_SUGGESTION_ONLY'},combinedRecommendation:agreement?{nodeId:deterministicStrong,basis:'DETERMINISTIC_AND_SEMANTIC_AGREEMENT',autoResolve:false}:null};
 }catch(error){return{deterministic,semantic:{...capability,status:'DEGRADED',errorCode:String(error?.code||'SEMANTIC_FAILED'),assessment:null,suggestions:[]},combinedRecommendation:null}}
}

export async function getRelationResolutionSuggestions(db,id){
 if(!UUID.test(String(id||'')))throw Object.assign(new Error('valid relation candidate id is required'),{status:400,code:'RELATION_ID_REQUIRED'});
 const row=(await db.query(`
  SELECT r.id,r.relation_type::text,r.from_label,r.to_label,r.from_resolution,r.to_resolution,r.from_node_key,r.to_node_key,
         r.endpoint_resolution,r.review_status,r.confidence,r.cue,r.exact_quote,r.source_id,
         COALESCE(s.metadata->>'sourceFile',s.metadata->>'originalFileName',s.title) AS source_file,s.title AS source_title
  FROM relation_candidates r JOIN sources s ON s.id=r.source_id WHERE r.id=$1
 `,[id])).rows[0];
 if(!row)throw Object.assign(new Error('relation candidate not found'),{status:404,code:'RELATION_NOT_FOUND'});
 const map=await buildEmergentCorpusMapPreview(db,{communityLimit:1,nodeLimit:500,edgeLimit:1000}),from=row.from_resolution==='MAPPED'?{mapped:true,nodeId:row.from_node_key}:await sideSuggestions(row.from_label,map.nodes,row.source_file),to=row.to_resolution==='MAPPED'?{mapped:true,nodeId:row.to_node_key}:await sideSuggestions(row.to_label,map.nodes,row.source_file);
 return{ok:true,version:'relation-resolution-v0.2',relation:{id:row.id,type:row.relation_type,fromLabel:row.from_label,toLabel:row.to_label,fromResolution:row.from_resolution,toResolution:row.to_resolution,endpointResolution:row.endpoint_resolution,reviewStatus:row.review_status,confidence:Number(row.confidence),cue:row.cue,quote:row.exact_quote,sourceId:row.source_id,sourceFile:row.source_file,sourceTitle:row.source_title},from,to,policy:{creatorDecisionRequired:true,autoResolve:false,autoApprove:false,semanticSuggestionIsNotEvidence:true,onlyApprovedFullyMappedRelationsReachLearningGraph:true}};
}
