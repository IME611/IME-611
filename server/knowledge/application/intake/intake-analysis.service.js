import crypto from'node:crypto';
import{extractAtomicCandidates}from'../extraction/atomic-extraction-preview.service.js';
import{rankKnowledgeOverlap,normalizeKnowledgeText}from'../matching/knowledge-overlap.service.js';
import{buildEmergentCorpusMap}from'../map/emergent-corpus-map.service.js';
import{extractExplicitRelations}from'../relations/explicit-relation.service.js';
import{previewLearningDependencyGraph}from'../learning/learning-dependency.service.js';

const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
const MAX_INPUT_CHARS=20_000;
const MAX_ATOMS=40;
const SUPPORTED_TYPES=new Set(['text','topic','note']);

function pseudoSource(text,type){
 const content=String(text||'');
 const hash=sha256(content);
 return{
  source:{id:`intake-${hash.slice(0,24)}`,title:`Intake ${type}`,raw_content:content,content_hash:hash,metadata:{intakePreview:true,type}},
  fragments:[{id:`intake-fragment-${hash.slice(0,20)}`,ordinal:0,raw_text:content,start_offset:0,end_offset:content.length,content_hash:hash,fragmenter_version:'intake-preview-v0.1'}],
 };
}

function atomsFromInput(type,text){
 const loaded=pseudoSource(text,type);
 if(type==='topic')return[{id:sha256(`topic:${text}`),type:'CONCEPT',text:String(text).trim(),exactQuote:String(text).trim(),sourceStart:0,sourceEnd:String(text).length,confidence:1,signals:['intake-topic'],evidence:[]}];
 const extracted=extractAtomicCandidates(loaded.source,loaded.fragments).filter(item=>!item.excludeFromKnowledge);
 const atoms=extracted.slice(0,MAX_ATOMS).map(item=>({id:item.candidateKey,type:item.type,text:item.text,exactQuote:item.exactQuote,sourceStart:item.sourceStart,sourceEnd:item.sourceEnd,confidence:item.confidence,signals:item.signals,evidence:item.evidence}));
 if(atoms.length)return atoms;
 return[{id:sha256(`fallback:${text}`),type:type==='note'?'CREATOR_INSIGHT':'CLAIM',text:String(text).trim(),exactQuote:String(text).trim(),sourceStart:0,sourceEnd:String(text).length,confidence:.5,signals:['intake-fallback'],evidence:[]}];
}

async function loadCorpusIndex(db){
 const candidateRows=(await db.query(`
  SELECT c.id,c.atom_type::text,c.candidate_text,c.review_status,c.source_id,c.extractor_version,
         c.metadata->>'section' AS section,s.title AS source_title,s.metadata->>'sourceFile' AS source_file
  FROM extraction_candidates c JOIN sources s ON s.id=c.source_id
  WHERE c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge
 `)).rows;
 const canonicalRows=(await db.query(`SELECT id,canonical_name,description FROM concepts`)).rows;
 const records=[
  ...canonicalRows.map(row=>({id:row.id,authority:'CANONICAL',type:'CONCEPT',text:row.canonical_name,description:row.description||''})),
  ...candidateRows.map(row=>({id:row.id,authority:'CANDIDATE',type:row.atom_type,text:row.candidate_text,reviewStatus:row.review_status,sourceId:row.source_id,sourceTitle:row.source_title,sourceFile:row.source_file||null,section:row.section||null,extractorVersion:row.extractor_version})),
 ];
 return{records,candidateRows,canonicalRows};
}

async function evidenceForMatches(db,matchIds){
 const ids=[...new Set(matchIds.filter(Boolean))];if(!ids.length)return new Map();
 const rows=(await db.query(`
  SELECT c.id,c.candidate_text,s.title AS source_title,s.metadata->>'sourceFile' AS source_file,
         c.metadata->>'section' AS section,e.fragment_id,e.exact_quote,e.source_start,e.source_end,e.exact_quote_verified
  FROM extraction_candidates c
  JOIN sources s ON s.id=c.source_id
  LEFT JOIN extraction_candidate_evidence e ON e.candidate_id=c.id
  WHERE c.id=ANY($1::uuid[])
  ORDER BY c.id,e.source_start
 `,[ids])).rows;
 const map=new Map();
 for(const row of rows){
  const item=map.get(row.id)||{candidateId:row.id,candidateText:row.candidate_text,sourceTitle:row.source_title,sourceFile:row.source_file||null,section:row.section||null,fragments:[]};
  if(row.fragment_id)item.fragments.push({fragmentId:row.fragment_id,quote:row.exact_quote,sourceStart:row.source_start,sourceEnd:row.source_end,verified:row.exact_quote_verified===true});
  map.set(row.id,item);
 }
 return map;
}

function placementSuggestions(analyses){
 const scores=new Map();
 for(const analysis of analyses){
  for(const match of analysis.matches.slice(0,5)){
   if(!match.section)continue;
   const key=match.section,entry=scores.get(key)||{label:key,score:0,support:[]};
   const contribution=Number(match.score||0)*Math.max(.4,Number(analysis.confidence||.5));
   entry.score+=contribution;
   entry.support.push({atomId:analysis.atomId,matchId:match.id,sourceFile:match.sourceFile||null,score:Number(match.score.toFixed(4))});
   scores.set(key,entry);
  }
 }
 return[...scores.values()].sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label,'he')).slice(0,6).map(item=>({...item,score:Number(item.score.toFixed(4)),supportCount:item.support.length}));
}

function aggregateVerdict(analyses){
 const counts={EXISTS:0,EXTENDS:0,RELATED:0,CONFLICTS:0,NEW:0,UNCERTAIN:0};
 for(const item of analyses)counts[item.verdict]=(counts[item.verdict]||0)+1;
 if(analyses.length===1)return{verdict:analyses[0].verdict,confidence:analyses[0].confidence,counts};
 const total=analyses.length;
 if(counts.CONFLICTS)return{verdict:'CONFLICTS',confidence:.75,counts};
 if(counts.EXISTS===total)return{verdict:'EXISTS',confidence:.9,counts};
 if(counts.NEW===total)return{verdict:'NEW',confidence:.9,counts};
 if(counts.NEW>0&&(counts.EXISTS+counts.RELATED+counts.EXTENDS+counts.UNCERTAIN)>0)return{verdict:'EXTENDS',confidence:.72,counts};
 if(counts.EXTENDS>0)return{verdict:'EXTENDS',confidence:.75,counts};
 if(counts.UNCERTAIN>0)return{verdict:'UNCERTAIN',confidence:.6,counts};
 if(counts.RELATED>0)return{verdict:'RELATED',confidence:.7,counts};
 return{verdict:'UNCERTAIN',confidence:.5,counts};
}

async function loadCorpusMap(db){
 const conceptRows=(await db.query(`SELECT c.id,c.candidate_text,c.source_id,c.source_start,c.metadata->>'section' AS section,s.metadata->>'sourceFile' AS source_file FROM extraction_candidates c JOIN sources s ON s.id=c.source_id WHERE c.atom_type='CONCEPT' AND c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge ORDER BY c.source_id,c.source_start`)).rows;
 const atomRows=(await db.query(`SELECT c.id,c.atom_type::text,c.candidate_text,c.source_id,c.source_start,c.metadata->>'section' AS section,s.metadata->>'sourceFile' AS source_file FROM extraction_candidates c JOIN sources s ON s.id=c.source_id WHERE c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge ORDER BY c.source_id,c.source_start`)).rows;
 return buildEmergentCorpusMap({conceptRows,atomRows});
}

function detectedMapConcepts(atoms,map){
 const found=new Map();
 for(const atom of atoms){
  const normalized=normalizeKnowledgeText(atom.text),atomTokens=new Set(normalized.split(' ').filter(Boolean));
  for(const node of map.nodes.filter(item=>item.kind==='CONCEPT')){
   const label=normalizeKnowledgeText(node.label);if(!label)continue;
   const nodeTokens=label.split(' ').filter(Boolean);
   const explicit=normalized.includes(label)||(nodeTokens.length<=3&&nodeTokens.every(token=>atomTokens.has(token)));
   if(explicit)found.set(node.id,{id:node.id,label:node.label});
  }
 }
 return[...found.values()];
}

function learningRole(graph,placements,detectedConcepts){
 const placementLabels=new Set(placements.map(item=>normalizeKnowledgeText(item.label))),conceptIds=new Set(detectedConcepts.map(item=>item.id));
 const relatedUnits=graph.learningUnits.filter(unit=>placementLabels.has(normalizeKnowledgeText(unit.title))||unit.concepts?.some(concept=>conceptIds.has(concept.id))).slice(0,12);
 const spirals=graph.spiralAppearances.filter(item=>conceptIds.has(item.conceptNodeId)).slice(0,12);
 const dependencies=graph.dependencies.filter(item=>conceptIds.has(item.prerequisiteNodeId)||conceptIds.has(item.dependentNodeId)).slice(0,20);
 return{
  status:(relatedUnits.length||spirals.length||dependencies.length)?'CANDIDATE_CONTEXT_FOUND':'NO_ORDERING_CLAIM',
  relatedUnits:relatedUnits.map(unit=>({unitId:unit.id,title:unit.title,orderStatus:unit.orderStatus,complexity:unit.complexity,prerequisiteConceptIds:unit.prerequisiteConceptIds})),
  spiralAppearances:spirals,
  dependencyEvidence:dependencies,
  note:'This is a candidate learning role only. File number/order is never used; unresolved relation endpoints never constrain order.',
 };
}

export async function analyzeIntake(db,{type='text',text}){
 const inputType=String(type||'text').toLowerCase();if(!SUPPORTED_TYPES.has(inputType))throw Object.assign(new Error('unsupported intake type'),{code:'UNSUPPORTED_INTAKE_TYPE'});
 const content=String(text||'').trim();if(content.length<2)throw Object.assign(new Error('text is required'),{code:'TEXT_REQUIRED'});if(content.length>MAX_INPUT_CHARS)throw Object.assign(new Error(`text exceeds ${MAX_INPUT_CHARS} characters`),{code:'TEXT_TOO_LARGE'});
 const atoms=atomsFromInput(inputType,content),index=await loadCorpusIndex(db),analyses=[];
 for(const atom of atoms){
  const ranked=rankKnowledgeOverlap(atom.text,index.records,{topK:6});
  analyses.push({atomId:atom.id,type:atom.type,text:atom.text,sourceStart:atom.sourceStart,sourceEnd:atom.sourceEnd,extractionConfidence:atom.confidence,verdict:ranked.verdict,confidence:ranked.confidence,reason:ranked.reason,matches:ranked.matches.map(match=>({id:match.id,authority:match.authority,type:match.type,text:match.text,score:Number(match.score.toFixed(4)),sourceFile:match.sourceFile||null,section:match.section||null,sourceId:match.sourceId||null}))});
 }
 const candidateMatchIds=analyses.flatMap(item=>item.matches.filter(match=>match.authority==='CANDIDATE').slice(0,3).map(match=>match.id)),evidenceMap=await evidenceForMatches(db,candidateMatchIds);
 for(const analysis of analyses)analysis.matches=analysis.matches.map(match=>({...match,evidence:match.authority==='CANDIDATE'?evidenceMap.get(match.id)||null:null}));
 const placements=placementSuggestions(analyses),map=await loadCorpusMap(db),relationAtoms=atoms.map(atom=>({id:atom.id,atom_type:atom.type,candidate_text:atom.text,source_id:`intake-${sha256(content).slice(0,16)}`,source_file:'intake-preview',section:null})),relations=extractExplicitRelations({nodes:map.nodes,atoms:relationAtoms,version:'intake-relations-v0.1'}),detectedConcepts=detectedMapConcepts(atoms,map),learningGraph=await previewLearningDependencyGraph(db,{unitLimit:500,spiralLimit:500,dependencyLimit:1000}),aggregate=aggregateVerdict(analyses);
 return{
  ok:true,mode:'ANALYSIS_ONLY',analysisId:sha256(`intake-analysis-v0.1:${inputType}:${content}`),input:{type:inputType,length:content.length,contentHash:sha256(content)},
  detected:{atomCount:atoms.length,knowledgeTypes:[...new Set(atoms.map(atom=>atom.type))],mapConcepts:detectedConcepts},
  verdict:aggregate,
  atoms:analyses,
  suggestedPlacements:placements,
  suggestedRelations:{total:relations.summary.total,byType:relations.summary.byType,byResolution:relations.summary.byResolution,items:relations.relations.slice(0,20)},
  learningRole:learningRole(learningGraph,placements,detectedConcepts),
  corpusIndex:{canonicalConcepts:index.canonicalRows.length,reviewCandidates:index.candidateRows.length},
  review:{required:true,allowedDecisions:['APPROVE','CHANGE','REJECT'],persisted:false},
  limitations:{semanticMatcher:false,supportedInputTypes:[...SUPPORTED_TYPES],notYetAnalyzedDirectly:['url','image','file']},
  policy:{note:'Analysis is ephemeral. No source, candidate, concept, relation, placement, or learning sequence is persisted until an explicit approval workflow is invoked.'},
 };
}
