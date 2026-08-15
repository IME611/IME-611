import{rankKnowledgeOverlap}from'../matching/knowledge-overlap.service.js';

const VALID_NODE_KINDS=new Set(['CONCEPT','SECTION_TOPIC']);

function matchMode(metrics={}){
 if(metrics.exact)return'EXACT';
 if(metrics.queryInsideCandidate||metrics.candidateInsideQuery)return'PHRASE';
 if(Number(metrics.queryCoverage)>=.8&&Number(metrics.tokenContainment)>=.7)return'TOKEN_COVERAGE';
 return'LEXICAL';
}

function assessmentFor(matches){
 const top=matches[0]||null,second=matches[1]||null;
 if(!top)return{band:'NONE',topScore:0,margin:0,recommendedNodeId:null,reason:'No meaningful deterministic overlap with an observed Corpus Map node.'};
 const margin=Number((top.score-(second?.score||0)).toFixed(4));
 const metrics=top.metrics||{};
 const explicitShape=Boolean(metrics.exact||metrics.queryInsideCandidate||metrics.candidateInsideQuery||Number(metrics.queryCoverage)>=.9);
 let band='WEAK',reason='Some lexical overlap exists, but it is not strong enough to prioritize safely.';
 if(top.score>=.92&&explicitShape&&margin>=.08){band='STRONG';reason='High lexical/phrase agreement with a clear margin over the next observed map node.'}
 else if(top.score>=.78&&explicitShape&&margin>=.04){band='PLAUSIBLE';reason='Good deterministic overlap, but creator confirmation is still required.'}
 else if(top.score>=.72&&margin<.04){band='AMBIGUOUS';reason='The leading candidates are too close to distinguish safely without creator judgment.'}
 return{band,topScore:Number(top.score.toFixed(4)),margin,recommendedNodeId:band==='STRONG'?top.id:null,reason};
}

export function rankRelationEndpointSuggestions(label,nodes,{sourceFile=null,limit=5}={}){
 const records=(nodes||[]).filter(node=>VALID_NODE_KINDS.has(node.kind)).map(node=>({id:node.id,authority:'MAP',type:node.kind,text:node.label,node}));
 const endpointText=String(label||'').trim();
 if(!endpointText||!records.length)return{assessment:{band:'NONE',topScore:0,margin:0,recommendedNodeId:null,reason:'No endpoint text or map nodes available.'},suggestions:[]};
 if(endpointText.length<2)return{assessment:{band:'NONE',topScore:0,margin:0,recommendedNodeId:null,reason:'Endpoint text is too short for deterministic matching and requires creator review.'},suggestions:[]};
 const ranked=rankKnowledgeOverlap(endpointText,records,{topK:Math.max(8,Number(limit)||5)}).matches.filter(match=>match.score>=.15);
 const assessment=assessmentFor(ranked);
 const suggestions=ranked.slice(0,Math.max(1,Math.min(10,Number(limit)||5))).map((match,index)=>({
  nodeId:match.id,
  kind:match.node.kind,
  label:match.node.label,
  score:Number(match.score.toFixed(4)),
  rank:index+1,
  sameSource:Boolean(sourceFile&&match.node.sourceFiles?.includes(sourceFile)),
  matchMode:matchMode(match.metrics),
  recommended:assessment.recommendedNodeId===match.id,
 }));
 return{assessment,suggestions};
}

export function summarizeEndpointSuggestionHealth(relations,nodes){
 const bands={STRONG:0,PLAUSIBLE:0,AMBIGUOUS:0,WEAK:0,NONE:0},bySide={from:0,to:0};let unresolvedEndpoints=0;
 for(const relation of relations||[]){
  for(const side of ['from','to']){
   if(relation[`${side}_resolution`]==='MAPPED')continue;
   unresolvedEndpoints+=1;bySide[side]+=1;
   const result=rankRelationEndpointSuggestions(relation[`${side}_label`],nodes,{sourceFile:relation.source_file||null,limit:5});
   bands[result.assessment.band]=(bands[result.assessment.band]||0)+1;
  }
 }
 return{relations:(relations||[]).length,unresolvedEndpoints,bands,bySide,strongShare:unresolvedEndpoints?Number((bands.STRONG/unresolvedEndpoints).toFixed(4)):0};
}
