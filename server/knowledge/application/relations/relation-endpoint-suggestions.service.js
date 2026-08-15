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

const bump=(counts,key)=>{counts[key]=(counts[key]||0)+1};
function characterBucket(text){const length=text.length;if(!length)return'EMPTY';if(length<2)return'LT_2';if(length<=4)return'2_4';if(length<=12)return'5_12';if(length<=24)return'13_24';return'25_PLUS'}
function tokenBucket(text){const count=text?text.split(/\s+/).filter(Boolean).length:0;if(!count)return'ZERO';if(count===1)return'ONE';if(count===2)return'TWO';if(count<=4)return'THREE_FOUR';return'FIVE_PLUS'}
function scoreBucket(score){const value=Number(score)||0;if(value<=0)return'NO_MATCH';if(value<.32)return'0_15_0_31';if(value<.56)return'0_32_0_55';if(value<.78)return'0_56_0_77';if(value<.92)return'0_78_0_91';return'0_92_1_00'}
function scoreStats(scores){if(!scores.length)return{matchedEndpoints:0,mean:0,median:0,p75:0,p90:0,max:0};const values=[...scores].sort((a,b)=>a-b),at=p=>values[Math.floor((values.length-1)*p)],mean=values.reduce((sum,value)=>sum+value,0)/values.length;return{matchedEndpoints:values.length,mean:Number(mean.toFixed(4)),median:Number(at(.5).toFixed(4)),p75:Number(at(.75).toFixed(4)),p90:Number(at(.9).toFixed(4)),max:Number(values.at(-1).toFixed(4))}}

export function summarizeEndpointSuggestionDiagnostics(relations,nodes){
 const characterLengths={},tokenCounts={},topScoreBuckets={},topMatchModes={},topNodeKinds={},topSameSource={YES:0,NO:0,NO_TOP_MATCH:0},noneReasons={EMPTY:0,SHORT:0,NO_MATCH:0},scores=[];let unresolvedEndpoints=0;
 for(const relation of relations||[]){
  for(const side of ['from','to']){
   if(relation[`${side}_resolution`]==='MAPPED')continue;
   unresolvedEndpoints+=1;
   const endpointText=String(relation[`${side}_label`]||'').trim(),result=rankRelationEndpointSuggestions(endpointText,nodes,{sourceFile:relation.source_file||null,limit:5}),top=result.suggestions[0]||null;
   bump(characterLengths,characterBucket(endpointText));bump(tokenCounts,tokenBucket(endpointText));bump(topScoreBuckets,scoreBucket(result.assessment.topScore));
   if(top){scores.push(top.score);bump(topMatchModes,top.matchMode);bump(topNodeKinds,top.kind);topSameSource[top.sameSource?'YES':'NO']+=1}
   else{topSameSource.NO_TOP_MATCH+=1;if(!endpointText)noneReasons.EMPTY+=1;else if(endpointText.length<2)noneReasons.SHORT+=1;else noneReasons.NO_MATCH+=1}
  }
 }
 return{unresolvedEndpoints,characterLengths,tokenCounts,topScoreBuckets,topMatchModes,topNodeKinds,topSameSource,noneReasons,topScoreStats:scoreStats(scores),policy:{rawEndpointTextLogged:false,aggregateOnly:true}};
}

function candidateCountBucket(count){if(!count)return'ZERO';if(count===1)return'ONE';if(count<=4)return'TWO_FOUR';if(count<=10)return'FIVE_TEN';return'ELEVEN_PLUS'}
function inExactSection(node,sectionKey){return Boolean(sectionKey&&(node.sections||[]).includes(sectionKey))}
function inSameSource(node,{sourceId,sourceFile}){
 if(sourceFile&&(node.sourceFiles||[]).includes(sourceFile))return true;
 if(!sourceId)return false;const prefix=`${sourceId}::`;return(node.sections||[]).some(section=>String(section).startsWith(prefix));
}

export function summarizeEndpointContextCoverage(relations,nodes){
 const eligible=(nodes||[]).filter(node=>VALID_NODE_KINDS.has(node.kind));
 const sectionCandidateCounts={},sameSourceCandidateCounts={};let unresolvedEndpoints=0,sourceSectionAvailable=0,sourceFileAvailable=0,withExactSectionContext=0,withSectionConceptCandidates=0,withSectionTopicCandidates=0,withSameSourceContext=0,withSameSourceConceptCandidates=0,withSameSourceTopicCandidates=0;
 for(const relation of relations||[]){
  for(const side of ['from','to']){
   if(relation[`${side}_resolution`]==='MAPPED')continue;
   unresolvedEndpoints+=1;
   const sourceId=String(relation.source_id||''),sourceFile=relation.source_file||null,sourceSection=String(relation.source_section||'').trim(),sectionKey=sourceId&&sourceSection?`${sourceId}::${sourceSection}`:null;
   if(sectionKey)sourceSectionAvailable+=1;if(sourceFile)sourceFileAvailable+=1;
   const sectionCandidates=sectionKey?eligible.filter(node=>inExactSection(node,sectionKey)):[],sameSourceCandidates=(sourceId||sourceFile)?eligible.filter(node=>inSameSource(node,{sourceId,sourceFile})):[];
   const sectionConcepts=sectionCandidates.filter(node=>node.kind==='CONCEPT').length,sectionTopics=sectionCandidates.filter(node=>node.kind==='SECTION_TOPIC').length,sourceConcepts=sameSourceCandidates.filter(node=>node.kind==='CONCEPT').length,sourceTopics=sameSourceCandidates.filter(node=>node.kind==='SECTION_TOPIC').length;
   bump(sectionCandidateCounts,candidateCountBucket(sectionCandidates.length));bump(sameSourceCandidateCounts,candidateCountBucket(sameSourceCandidates.length));
   if(sectionCandidates.length)withExactSectionContext+=1;if(sectionConcepts)withSectionConceptCandidates+=1;if(sectionTopics)withSectionTopicCandidates+=1;if(sameSourceCandidates.length)withSameSourceContext+=1;if(sourceConcepts)withSameSourceConceptCandidates+=1;if(sourceTopics)withSameSourceTopicCandidates+=1;
  }
 }
 const share=value=>unresolvedEndpoints?Number((value/unresolvedEndpoints).toFixed(4)):0;
 return{unresolvedEndpoints,sourceSectionAvailable,sourceFileAvailable,withExactSectionContext,withSectionConceptCandidates,withSectionTopicCandidates,withSameSourceContext,withSameSourceConceptCandidates,withSameSourceTopicCandidates,coverage:{exactSection:share(withExactSectionContext),sectionConcept:share(withSectionConceptCandidates),sectionTopic:share(withSectionTopicCandidates),sameSource:share(withSameSourceContext),sameSourceConcept:share(withSameSourceConceptCandidates),sameSourceTopic:share(withSameSourceTopicCandidates)},sectionCandidateCounts,sameSourceCandidateCounts,policy:{contextIsNotSemanticProof:true,autoResolution:false,rawEndpointTextLogged:false,rawSectionTextLogged:false,aggregateOnly:true}};
}
