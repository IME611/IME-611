import crypto from'node:crypto';
import{extractAtomicCandidates}from'../extraction/atomic-extraction-preview.service.js';
import{normalizeKnowledgeText,rankKnowledgeOverlap}from'../matching/knowledge-overlap.service.js';
import{buildEmergentCorpusMapPreview}from'../map/emergent-corpus-map.service.js';
import{previewLearningDependencyGraph}from'../learning/learning-dependency.service.js';

const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const safeNumber=value=>Number.isFinite(Number(value))?Number(value):0;

async function loadCorpusIndex(db){
 const candidateRows=(await db.query(`
  SELECT c.id,c.atom_type,c.candidate_text,c.review_status,c.source_id,c.extractor_version,
         c.metadata->>'section' AS section,s.title AS source_title,s.metadata->>'sourceFile' AS source_file
  FROM extraction_candidates c JOIN sources s ON s.id=c.source_id
  WHERE c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge
 `)).rows;
 const canonicalRows=(await db.query(`SELECT id,canonical_name,description FROM concepts`)).rows;
 const records=[
  ...canonicalRows.map(row=>({id:row.id,authority:'CANONICAL',type:'CONCEPT',text:row.canonical_name,description:row.description||''})),
  ...candidateRows.map(row=>({id:row.id,authority:'CANDIDATE',type:row.atom_type,text:row.candidate_text,reviewStatus:row.review_status,sourceId:row.source_id,sourceTitle:row.source_title,sourceFile:row.source_file||null,section:row.section||null,extractorVersion:row.extractor_version})),
 ];
 return{records,counts:{canonicalConcepts:canonicalRows.length,reviewCandidates:candidateRows.length,total:records.length}};
}
function syntheticAtoms(text){
 const sourceId=`intake:${sha256(Buffer.from(text,'utf8'))}`,source={id:sourceId,title:'Intake preview',raw_content:text},fragments=[{id:`${sourceId}:0`,ordinal:0,raw_text:text,start_offset:0,end_offset:text.length}];
 const extracted=extractAtomicCandidates(source,fragments).filter(item=>!item.excludeFromKnowledge);
 if(extracted.length)return extracted;
 return[{candidateKey:sha256(`${sourceId}|CONCEPT|${normalizeKnowledgeText(text)}`),sourceId,type:'CONCEPT',claimType:null,text:text.trim(),exactQuote:text.trim(),sourceStart:0,sourceEnd:text.length,confidence:.62,reviewStatus:'PENDING',signals:['intake-short-topic-fallback'],section:null,defines:null,excludeFromKnowledge:false,evidence:[]}];
}
function compactMatch(match){return{id:match.id,authority:match.authority,type:match.type,text:match.text,score:Number(safeNumber(match.score).toFixed(4)),sourceId:match.sourceId||null,sourceTitle:match.sourceTitle||null,sourceFile:match.sourceFile||null,section:match.section||null,basis:match.metrics?.basis||'LEXICAL_OVERLAP',matchedConcepts:(match.metrics?.matchedConcepts||[]).map(item=>({id:item.id,label:item.label,strength:Number(safeNumber(item.strength).toFixed(4))})),metrics:{exact:Boolean(match.metrics?.exact),phrase:Boolean(match.metrics?.phrase),queryCoverage:Number(safeNumber(match.metrics?.queryCoverage).toFixed(4)),tokenContainment:Number(safeNumber(match.metrics?.tokenContainment).toFixed(4)),conceptCoverage:Number(safeNumber(match.metrics?.conceptCoverage).toFixed(4)),conflictSignal:Boolean(match.metrics?.conflictSignal)}}}
function rankWithIndex(text,index,topK=5){const ranked=rankKnowledgeOverlap(text,index.records,{topK});return{verdict:ranked.verdict,confidence:ranked.confidence,reason:ranked.reason,matches:ranked.matches.map(compactMatch)}}
function countBy(items,key){const out={};for(const item of items){const value=item[key]||'UNKNOWN';out[value]=(out[value]||0)+1}return out}
function documentVerdict({exactSourceMatch,whole,atoms}){
 if(exactSourceMatch)return{verdict:'EXISTS',confidence:.99,reason:'The exact extracted text is already present as a canonical source.'};
 if(whole.verdict==='CONFLICTS')return{verdict:'CONFLICTS',confidence:whole.confidence,reason:whole.reason};
 const usable=atoms.filter(item=>item.type!=='EDITORIAL_NOTE'),total=usable.length||1,counts=countBy(usable,'overlapVerdict');
 const exists=(counts.EXISTS||0),extendsCount=(counts.EXTENDS||0),related=(counts.RELATED||0),fresh=(counts.NEW||0),conflicts=(counts.CONFLICTS||0),uncertain=(counts.UNCERTAIN||0),represented=exists+extendsCount;
 if(conflicts/total>=.2)return{verdict:'CONFLICTS',confidence:.72,reason:'A material share of extracted ideas conflicts with similar corpus statements and needs review.'};
 if(fresh===0&&represented/total>=.72)return{verdict:'EXISTS',confidence:.82,reason:'Most extracted ideas are already substantially represented in the corpus.'};
 if(represented/total>=.3&&fresh/total>=.08)return{verdict:'EXTENDS',confidence:.78,reason:'The material substantially overlaps the corpus and also adds distinct ideas.'};
 if(fresh/total>=.6)return{verdict:'NEW',confidence:.76,reason:'Most extracted ideas are not materially represented by the current deterministic corpus index.'};
 if((related+represented)/total>=.55)return{verdict:'RELATED',confidence:.7,reason:'The material is strongly adjacent to existing knowledge but is not safely classified as duplicate or extension.'};
 return{verdict:'UNCERTAIN',confidence:.58,reason:`The deterministic evidence is mixed (${uncertain} uncertain atoms); creator review is required.`};
}
function placementAnalysis(atoms,map){
 const records=map.nodes.map(node=>({id:node.id,authority:'MAP',type:node.kind,text:node.label,node})),stats=new Map();
 for(const atom of atoms){
  const ranked=rankKnowledgeOverlap(atom.text,records,{topK:4});
  for(const match of ranked.matches){
   if(match.score<.18)continue;const current=stats.get(match.id)||{node:match.node,total:0,max:0,count:0,atomKeys:new Set()};
   const contribution=match.score*Math.max(.35,safeNumber(atom.confidence));current.total+=contribution;current.max=Math.max(current.max,match.score);current.count+=1;current.atomKeys.add(atom.candidateKey);stats.set(match.id,current);
  }
 }
 const placements=[...stats.values()].map(item=>({nodeId:item.node.id,kind:item.node.kind,label:item.node.label,score:Number((item.total/Math.max(1,item.count)).toFixed(4)),maxScore:Number(item.max.toFixed(4)),supportingAtoms:item.atomKeys.size,sourceCount:item.node.sourceCount,sourceFiles:item.node.sourceFiles||[],sections:item.node.sections||[]})).sort((a,b)=>b.supportingAtoms-a.supportingAtoms||b.score-a.score||b.maxScore-a.maxScore).slice(0,10);
 const sectionPlacements=placements.filter(item=>item.kind==='SECTION_TOPIC'),conceptPlacements=placements.filter(item=>item.kind==='CONCEPT'),drawer=sectionPlacements[0]||placements[0]||null;
 return{placements,suggestedDrawer:drawer?{nodeId:drawer.nodeId,kind:drawer.kind,label:drawer.label,confidence:Number(Math.min(.95,.42+drawer.score*.42+Math.min(.12,drawer.supportingAtoms*.02)).toFixed(4)),basis:'atomic-to-corpus-map lexical/context match'}:null,suggestedPath:{primaryContext:sectionPlacements[0]||null,secondaryContexts:sectionPlacements.slice(1,4),nearbyConcepts:conceptPlacements.slice(0,5),hierarchyApproved:false,note:'These are map-location candidates, not a frozen taxonomy hierarchy.'}};
}
function strongestExisting(atoms,whole){
 const pool=[...whole.matches];for(const atom of atoms)for(const match of atom.matches||[])pool.push(match);
 const best=new Map();for(const match of pool){const key=`${match.authority}:${match.id}`,prior=best.get(key);if(!prior||prior.score<match.score)best.set(key,match)}
 return[...best.values()].sort((a,b)=>b.score-a.score).slice(0,12);
}
function suggestedPlacementRelationships(placements){return placements.slice(0,8).map(item=>({relationshipKind:'PLACEMENT_CONTEXT',relationType:null,to:{nodeId:item.nodeId,kind:item.kind,label:item.label},confidence:Number(Math.min(.88,.35+item.score*.45+Math.min(.08,item.supportingAtoms*.01)).toFixed(4)),supportingAtoms:item.supportingAtoms,basis:'new-input atomic overlap with an existing Corpus Map node',requiresReview:true,canonicalRelation:false}))}
async function relationNeighborhood(db,map,placements){
 const ids=placements.slice(0,8).map(item=>item.nodeId);if(!ids.length)return[];
 const table=(await db.query(`SELECT to_regclass('public.relation_candidates') AS relation_table`)).rows[0]?.relation_table;if(!table)return[];
 const rows=(await db.query(`
  SELECT id,relation_type::text AS relation_type,from_node_key::text AS from_node_key,from_label,
         to_node_key::text AS to_node_key,to_label,endpoint_resolution,confidence,review_status,cue,source_id
  FROM relation_candidates
  WHERE review_status<>'REJECTED' AND (from_node_key::text=ANY($1::text[]) OR to_node_key::text=ANY($1::text[]))
  ORDER BY confidence DESC,created_at DESC LIMIT 30
 `,[ids])).rows;
 return rows.map(row=>({id:row.id,type:row.relation_type,from:{nodeId:row.from_node_key,label:row.from_label},to:{nodeId:row.to_node_key,label:row.to_label},endpointResolution:row.endpoint_resolution,confidence:Number(row.confidence),reviewStatus:row.review_status,cue:row.cue,sourceId:row.source_id,basis:'EXISTING_CORPUS_RELATION_NEIGHBORHOOD'}));
}
async function learningRole(db,placements){
 try{
  const graph=await previewLearningDependencyGraph(db,{unitLimit:500,spiralLimit:500,dependencyLimit:1000}),placementIds=new Set(placements.slice(0,10).map(item=>item.nodeId));
  const units=graph.learningUnits.filter(unit=>placementIds.has(unit.anchorNodeId)||unit.concepts.some(concept=>placementIds.has(concept.id))).slice(0,12).map(unit=>({unitId:unit.id,anchorNodeId:unit.anchorNodeId,title:unit.title,complexity:unit.complexity,orderStatus:unit.orderStatus,prerequisiteConceptIds:unit.prerequisiteConceptIds,matchingConcepts:unit.concepts.filter(concept=>placementIds.has(concept.id))}));
  const spirals=graph.spiralAppearances.filter(item=>placementIds.has(item.conceptNodeId)).slice(0,8).map(item=>({conceptNodeId:item.conceptNodeId,conceptLabel:item.conceptLabel,appearanceCount:item.appearanceCount,introduction:item.introduction,revisits:item.revisits}));
  return{available:true,suggestedUnits:units,spiralContext:spirals,policy:graph.policy};
 }catch(error){return{available:false,suggestedUnits:[],spiralContext:[],error:String(error?.message||error)}}
}
async function findExactSource(db,text){
 const target=sha256(Buffer.from(text,'utf8')),rows=(await db.query(`SELECT id,title,raw_content,metadata FROM sources`)).rows;
 const source=rows.find(row=>sha256(Buffer.from(String(row.raw_content||''),'utf8'))===target);return source?{id:source.id,title:source.title,sourceFile:source.metadata?.sourceFile||source.metadata?.originalFileName||null,textSha256:target}:null;
}

export async function analyzeIntake(db,payload){
 const index=await loadCorpusIndex(db),rawAtoms=syntheticAtoms(payload.text),atomsForAnalysis=rawAtoms.slice(0,180),whole=rankWithIndex(payload.text,index,10),atomResults=[];
 for(const atom of atomsForAnalysis){const overlap=rankWithIndex(atom.text,index,4);atomResults.push({...atom,overlapVerdict:overlap.verdict,overlapConfidence:overlap.confidence,overlapReason:overlap.reason,matches:overlap.matches})}
 const map=await buildEmergentCorpusMapPreview(db,{communityLimit:200,nodeLimit:500,edgeLimit:1000}),placement=placementAnalysis(atomResults,map),exactSourceMatch=await findExactSource(db,payload.text),verdict=documentVerdict({exactSourceMatch,whole,atoms:atomResults}),relations=await relationNeighborhood(db,map,placement.placements),learning=await learningRole(db,placement.placements),byType=countBy(atomResults,'type'),byVerdict=countBy(atomResults,'overlapVerdict');
 const newAtoms=atomResults.filter(item=>item.overlapVerdict==='NEW').slice(0,20).map(item=>({type:item.type,text:item.text,confidence:item.overlapConfidence})),conflictAtoms=atomResults.filter(item=>item.overlapVerdict==='CONFLICTS').slice(0,12).map(item=>({type:item.type,text:item.text,matches:item.matches.slice(0,2)}));
 return{ok:true,analysisVersion:'intake-v0.2',input:{kind:payload.kind,title:payload.title,sourceUrl:payload.sourceUrl||null,fileName:payload.fileName||null,mimeType:payload.mimeType,textCharacters:payload.text.length,textSha256:sha256(Buffer.from(payload.text,'utf8')),metadata:payload.metadata||{}},verdict:{...verdict,provisional:true,semanticModel:false},exactSourceMatch,atomic:{extractor:'atomic-he-v0.2',totalExtracted:rawAtoms.length,analyzed:atomResults.length,truncated:rawAtoms.length>atomResults.length,byType,byVerdict,atoms:atomResults.map(item=>({key:item.candidateKey,type:item.type,claimType:item.claimType,text:item.text,confidence:item.confidence,section:item.section,overlapVerdict:item.overlapVerdict,overlapConfidence:item.overlapConfidence,overlapReason:item.overlapReason,matches:item.matches}))},closestExistingKnowledge:strongestExisting(atomResults,whole),newMaterial:{count:byVerdict.NEW||0,sample:newAtoms},conflicts:{count:byVerdict.CONFLICTS||0,sample:conflictAtoms},placement,relations:{suggestedRelationships:suggestedPlacementRelationships(placement.placements),existingNeighborhood:relations,note:'Suggested PLACEMENT_CONTEXT links are review-only and make no causal/semantic claim. Typed relations shown here are existing evidence-linked corpus relations around suggested locations, not newly asserted relations from this input.'},learning,corpusIndex:index.counts,decision:{required:true,allowed:['APPROVE','CHANGE','REJECT'],default:'REVIEW',note:'Analysis is staging-only. No source, concept, taxonomy, relation, or curriculum write occurs until explicit approval.'},policy:{canonicalWrites:false,autoMerge:false,semanticMatching:false,conceptAwareMatching:true,note:'Deterministic lexical and curated concept-equivalence evidence is intentionally conservative. Concept-level matches remain reviewable and never trigger automatic merge, placement, or curriculum changes.'}};
}
