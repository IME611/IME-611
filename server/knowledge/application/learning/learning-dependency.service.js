import crypto from'node:crypto';
import{buildEmergentCorpusMap}from'../map/emergent-corpus-map.service.js';

const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
const HARD_RELATIONS=new Set(['PREREQUISITE_FOR','DEPENDS_ON']);
const SOFT_RELATIONS=new Set(['EXPLAINS','IS_A']);

function nodeMap(map){return new Map(map.nodes.map(node=>[node.id,node]))}
function membershipIndex(map){
 const sectionsByConcept=new Map(),conceptsBySection=new Map();
 for(const edge of map.edges){
  if(!edge.signals?.SECTION_MEMBERSHIP&&!edge.signals?.SECTION_LABEL_MENTION)continue;
  const from=map.nodes.find(node=>node.id===edge.from),to=map.nodes.find(node=>node.id===edge.to);if(!from||!to)continue;
  const section=from.kind==='SECTION_TOPIC'?from:to.kind==='SECTION_TOPIC'?to:null,concept=from.kind==='CONCEPT'?from:to.kind==='CONCEPT'?to:null;if(!section||!concept)continue;
  const sectionSet=sectionsByConcept.get(concept.id)||new Map();sectionSet.set(section.id,section);sectionsByConcept.set(concept.id,sectionSet);
  const conceptSet=conceptsBySection.get(section.id)||new Map();conceptSet.set(concept.id,concept);conceptsBySection.set(section.id,conceptSet);
 }
 return{sectionsByConcept,conceptsBySection};
}

function normalizeDependency(row){
 if(row.endpoint_resolution!=='MAPPED')return null;
 const relation=row.relation_type;
 if(!HARD_RELATIONS.has(relation)&&!SOFT_RELATIONS.has(relation))return null;
 let prerequisite=row.from_node_key,dependent=row.to_node_key,basis=relation,strict=HARD_RELATIONS.has(relation),confidence=Number(row.confidence);
 if(relation==='DEPENDS_ON'||relation==='IS_A'){
  prerequisite=row.to_node_key;dependent=row.from_node_key;
 }
 if(relation==='EXPLAINS')confidence*=.7;
 if(relation==='IS_A')confidence*=.6;
 return{id:sha256(`learning-dependency:${row.id}:${prerequisite}:${dependent}:${relation}`),sourceRelationId:row.id,prerequisiteNodeId:prerequisite,dependentNodeId:dependent,basis,strict,confidence:Number(Math.min(.99,confidence).toFixed(4)),endpointResolution:row.endpoint_resolution};
}

function dedupeDependencies(rows,nodeById){
 const best=new Map(),ignored={pendingReview:0,unresolved:0,unsupported:0,missingMapEndpoint:0,self:0};
 for(const row of rows){
  if(row.review_status!=='APPROVED'){ignored.pendingReview+=1;continue}
  if(!HARD_RELATIONS.has(row.relation_type)&&!SOFT_RELATIONS.has(row.relation_type)){ignored.unsupported+=1;continue}
  const dep=normalizeDependency(row);if(!dep){ignored.unresolved+=1;continue}
  if(dep.prerequisiteNodeId===dep.dependentNodeId){ignored.self+=1;continue}
  if(!nodeById.has(dep.prerequisiteNodeId)||!nodeById.has(dep.dependentNodeId)){ignored.missingMapEndpoint+=1;continue}
  const key=`${dep.prerequisiteNodeId}|${dep.dependentNodeId}|${dep.basis}`,existing=best.get(key);if(!existing||existing.confidence<dep.confidence)best.set(key,dep);
 }
 return{dependencies:[...best.values()].sort((a,b)=>Number(b.strict)-Number(a.strict)||b.confidence-a.confidence),ignored};
}

function strictGraph(nodes,dependencies){
 const ids=new Set(nodes.map(node=>node.id)),incoming=new Map([...ids].map(id=>[id,0])),outgoing=new Map([...ids].map(id=>[id,new Set()]));
 for(const dep of dependencies.filter(item=>item.strict)){
  if(!ids.has(dep.prerequisiteNodeId)||!ids.has(dep.dependentNodeId))continue;
  if(!outgoing.get(dep.prerequisiteNodeId).has(dep.dependentNodeId)){outgoing.get(dep.prerequisiteNodeId).add(dep.dependentNodeId);incoming.set(dep.dependentNodeId,(incoming.get(dep.dependentNodeId)||0)+1)}
 }
 const layers=[],remaining=new Set(ids);let ready=[...remaining].filter(id=>(incoming.get(id)||0)===0).sort();
 while(ready.length){
  layers.push(ready);const next=[];
  for(const id of ready){remaining.delete(id);for(const target of outgoing.get(id)||[]){incoming.set(target,(incoming.get(target)||0)-1);if(incoming.get(target)===0&&remaining.has(target))next.push(target)}}
  ready=[...new Set(next)].sort();
 }
 return{layers,cycleNodeIds:[...remaining]};
}

function unitComplexity(section,concepts){
 const conceptCount=concepts.length,contextAtoms=Number(section.contextAtomCount||0),explicitAtoms=Number(section.explicitMappedAtomCount||0);
 return Number((conceptCount*2+Math.min(20,contextAtoms)/5+explicitAtoms*.5).toFixed(2));
}

function learningUnits(map,index,dependencies){
 const inboundByNode=new Map();for(const dep of dependencies.filter(item=>item.strict)){const set=inboundByNode.get(dep.dependentNodeId)||new Set();set.add(dep.prerequisiteNodeId);inboundByNode.set(dep.dependentNodeId,set)}
 return map.nodes.filter(node=>node.kind==='SECTION_TOPIC').map(section=>{
  const concepts=[...(index.conceptsBySection.get(section.id)||new Map()).values()];
  const prerequisiteConceptIds=new Set();for(const concept of concepts)for(const prerequisite of inboundByNode.get(concept.id)||[])if(!concepts.some(item=>item.id===prerequisite))prerequisiteConceptIds.add(prerequisite);
  return{id:sha256(`learning-unit:${section.id}`),anchorNodeId:section.id,title:section.label,sourceFiles:section.sourceFiles||[],concepts:concepts.map(item=>({id:item.id,label:item.label})),conceptCount:concepts.length,contextAtomCount:Number(section.contextAtomCount||0),complexity:unitComplexity(section,concepts),prerequisiteConceptIds:[...prerequisiteConceptIds],orderStatus:prerequisiteConceptIds.size?'CONSTRAINED':'UNCONSTRAINED'};
 }).sort((a,b)=>a.complexity-b.complexity||a.title.localeCompare(b.title,'he'));
}

function spiralAppearances(map,index,units){
 const unitByAnchor=new Map(units.map(unit=>[unit.anchorNodeId,unit])),spirals=[];
 for(const concept of map.nodes.filter(node=>node.kind==='CONCEPT')){
  const sections=[...(index.sectionsByConcept.get(concept.id)||new Map()).values()];if(sections.length<2)continue;
  const appearances=sections.map(section=>unitByAnchor.get(section.id)).filter(Boolean).sort((a,b)=>a.complexity-b.complexity||a.title.localeCompare(b.title,'he'));
  if(appearances.length<2)continue;
  const lowest=appearances[0]?.complexity,ties=appearances.filter(item=>item.complexity===lowest).length;
  spirals.push({conceptNodeId:concept.id,conceptLabel:concept.label,appearanceCount:appearances.length,introduction:{unitId:appearances[0].id,title:appearances[0].title,basis:ties===1?'LOWEST_COMPLEXITY_HEURISTIC':'UNRESOLVED_TIE',confidence:ties===1?.55:.3},revisits:appearances.slice(1).map(item=>({unitId:item.id,title:item.title,complexity:item.complexity})),appearances:appearances.map(item=>({unitId:item.id,title:item.title,complexity:item.complexity}))});
 }
 return spirals.sort((a,b)=>b.appearanceCount-a.appearanceCount||a.conceptLabel.localeCompare(b.conceptLabel,'he'));
}

export function buildLearningDependencyGraph({map,relationRows}){
 const nodeById=nodeMap(map),index=membershipIndex(map),{dependencies,ignored}=dedupeDependencies(relationRows,nodeById),units=learningUnits(map,index,dependencies),spirals=spiralAppearances(map,index,units),strict=strictGraph(map.nodes,dependencies);
 const hard=dependencies.filter(item=>item.strict),soft=dependencies.filter(item=>!item.strict),constrainedUnits=units.filter(unit=>unit.orderStatus==='CONSTRAINED').length;
 return{ok:strict.cycleNodeIds.length===0,method:{version:'learning-dependencies-v0.2',sourceOrderUsed:false,fixedChapterCount:false,requiresApprovedRelations:true},summary:{mapNodes:map.nodes.length,learningUnits:units.length,dependencyCandidates:dependencies.length,hardDependencies:hard.length,softDependencies:soft.length,ignoredRelationCandidates:ignored,strictCycles:strict.cycleNodeIds.length,spiralConcepts:spirals.length,constrainedUnits,unconstrainedUnits:units.length-constrainedUnits},dependencies,partialOrder:{nodeLayers:strict.layers,cycleNodeIds:strict.cycleNodeIds,note:'Only creator-APPROVED, fully MAPPED PREREQUISITE_FOR and DEPENDS_ON evidence can constrain this partial order. RESOLVE alone and PENDING relations never change curriculum order.'},learningUnits:units,spiralAppearances:spirals,policy:{canonicalWrites:false,requiresApprovedRelations:true,topicLocationSeparateFromAppearance:true,note:'SECTION_TOPIC anchors are candidate learning units. Recurring Concepts generate spiral appearance candidates. Introduction placement uses a transparent low-complexity heuristic only when no stronger approved dependency evidence exists; no seed file number/order is used.'}};
}

export async function previewLearningDependencyGraph(db,{unitLimit=100,spiralLimit=100,dependencyLimit=200}={}){
 const conceptRows=(await db.query(`SELECT c.id,c.candidate_text,c.source_id,c.source_start,c.metadata->>'section' AS section,s.metadata->>'sourceFile' AS source_file FROM extraction_candidates c JOIN sources s ON s.id=c.source_id WHERE c.atom_type='CONCEPT' AND c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge ORDER BY c.source_id,c.source_start`)).rows;
 const atomRows=(await db.query(`SELECT c.id,c.atom_type::text,c.candidate_text,c.source_id,c.source_start,c.metadata->>'section' AS section,s.metadata->>'sourceFile' AS source_file FROM extraction_candidates c JOIN sources s ON s.id=c.source_id WHERE c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge ORDER BY c.source_id,c.source_start`)).rows;
 const relationRows=(await db.query(`SELECT id,relation_type::text,from_node_key,to_node_key,endpoint_resolution,confidence,review_status FROM relation_candidates WHERE review_status<>'REJECTED' ORDER BY confidence DESC,created_at`)).rows;
 const map=buildEmergentCorpusMap({conceptRows,atomRows}),graph=buildLearningDependencyGraph({map,relationRows});
 return{...graph,dependencies:graph.dependencies.slice(0,Math.max(1,Math.min(1000,Number(dependencyLimit)||200))),learningUnits:graph.learningUnits.slice(0,Math.max(1,Math.min(500,Number(unitLimit)||100))),spiralAppearances:graph.spiralAppearances.slice(0,Math.max(1,Math.min(500,Number(spiralLimit)||100)))};
}
