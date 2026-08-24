import crypto from 'node:crypto';
import{extractConceptSignals}from'./concept-signals.js';

const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
const HEBREW_DIACRITICS=/[\u0591-\u05C7]/g;
const STOPWORDS=new Set([
 'של','על','אל','עם','את','זה','זו','זאת','הוא','היא','הם','הן','אני','אנחנו','אתה','אתם','אתן','גם','או','אם','כי','כל','לא','אין','יש','מה','מי','איך','למה','איפה','כמו','רק','יותר','פחות','אבל','אז','כך','כדי','יכול','יכולה','יכולים','יכולות','the','a','an','and','or','of','to','in','is','are','it','this','that','with','for','not','no'
]);
const NEGATIONS=new Set(['לא','אין','אינו','אינה','אינם','אינן','בלי','never','not','no','without']);

export function normalizeKnowledgeText(value){
 return String(value||'')
  .normalize('NFKC')
  .replace(HEBREW_DIACRITICS,'')
  .toLocaleLowerCase('he-IL')
  .replace(/[‐‑‒–—―]/g,'-')
  .replace(/[^\p{L}\p{N}]+/gu,' ')
  .replace(/\s+/g,' ')
  .trim();
}

function rawTokens(value){return normalizeKnowledgeText(value).match(/[\p{L}\p{N}]+/gu)||[]}
function contentTokens(value){return rawTokens(value).filter(token=>token.length>1&&!STOPWORDS.has(token))}
function setOf(values){return new Set(values)}
function intersectionSize(a,b){let count=0;for(const value of a)if(b.has(value))count+=1;return count}
function jaccard(a,b){if(!a.size&&!b.size)return 1;const intersection=intersectionSize(a,b);return intersection/(a.size+b.size-intersection||1)}
function containment(a,b){if(!a.size||!b.size)return 0;return intersectionSize(a,b)/Math.min(a.size,b.size)}
function queryCoverage(query,candidate){if(!query.size)return 0;return intersectionSize(query,candidate)/query.size}

function trigrams(value){
 const compact=normalizeKnowledgeText(value).replace(/\s+/g,' ');
 if(compact.length<3)return setOf(compact?[compact]:[]);
 const out=new Set();for(let index=0;index<=compact.length-3;index+=1)out.add(compact.slice(index,index+3));return out;
}

function polarity(value){
 const tokens=rawTokens(value);return tokens.some(token=>NEGATIONS.has(token))?'NEGATIVE':'POSITIVE';
}
function withoutNegations(value){return setOf(contentTokens(value).filter(token=>!NEGATIONS.has(token)))}

function conceptMetrics(query,candidate,queryTokenCount,candidateTokenCount){
 const querySignals=extractConceptSignals(query),candidateSignals=extractConceptSignals(candidate),queryIds=setOf(querySignals.map(item=>item.id)),candidateIds=setOf(candidateSignals.map(item=>item.id)),sharedIds=[...queryIds].filter(id=>candidateIds.has(id));
 const matchedConcepts=sharedIds.map(id=>{
  const querySignal=querySignals.find(item=>item.id===id),candidateSignal=candidateSignals.find(item=>item.id===id);
  return{id,label:querySignal?.label||candidateSignal?.label||id,strength:Math.min(querySignal?.strength||0,candidateSignal?.strength||0),queryEvidence:querySignal?.evidence||[],candidateEvidence:candidateSignal?.evidence||[],queryKind:querySignal?.kind||null,candidateKind:candidateSignal?.kind||null};
 });
 const conceptJaccard=jaccard(queryIds,candidateIds),conceptContainment=containment(queryIds,candidateIds),conceptCoverage=queryCoverage(queryIds,candidateIds),candidateConceptCoverage=queryCoverage(candidateIds,queryIds),averageCoverage=(conceptCoverage+candidateConceptCoverage)/2;
 const sharedStrength=matchedConcepts.length?matchedConcepts.reduce((sum,item)=>sum+item.strength,0)/matchedConcepts.length:0;
 const normalizedQuery=normalizeKnowledgeText(query),normalizedCandidate=normalizeKnowledgeText(candidate),queryIsDirectLabel=matchedConcepts.some(item=>item.queryEvidence.includes(normalizedQuery)),candidateIsDirectLabel=matchedConcepts.some(item=>item.candidateEvidence.includes(normalizedCandidate));
 const directEquivalent=matchedConcepts.length===1&&queryIds.size===1&&candidateIds.size===1&&queryTokenCount<=5&&candidateTokenCount<=5&&matchedConcepts[0].queryKind==='DIRECT_ALIAS'&&matchedConcepts[0].candidateKind==='DIRECT_ALIAS'&&queryIsDirectLabel&&candidateIsDirectLabel;
 let conceptScore=0;
 if(directEquivalent)conceptScore=.965;
 else if(matchedConcepts.length){
  conceptScore=.28+.32*Math.min(conceptCoverage,candidateConceptCoverage)+.18*averageCoverage+.16*sharedStrength;
  if(matchedConcepts.length>=2)conceptScore+=.04;
  if(Math.min(queryTokenCount,candidateTokenCount)<=5&&Math.max(queryTokenCount,candidateTokenCount)>5)conceptScore=Math.min(conceptScore,.72);
  if(Math.max(queryIds.size,candidateIds.size)>=3&&matchedConcepts.length===1)conceptScore=Math.min(conceptScore,.54);
 }
 return{querySignals,candidateSignals,matchedConcepts,conceptJaccard,conceptContainment,conceptCoverage,candidateConceptCoverage,sharedConceptStrength:sharedStrength,directConceptEquivalent:directEquivalent,conceptScore:Math.min(1,conceptScore)};
}

function similarityMetrics(query,candidate){
 const normalizedQuery=normalizeKnowledgeText(query),normalizedCandidate=normalizeKnowledgeText(candidate);
 const queryTokens=setOf(contentTokens(query)),candidateTokens=setOf(contentTokens(candidate));
 const tokenJaccard=jaccard(queryTokens,candidateTokens),tokenContainment=containment(queryTokens,candidateTokens),coverage=queryCoverage(queryTokens,candidateTokens);
 const trigramJaccard=jaccard(trigrams(query),trigrams(candidate));
 const exact=Boolean(normalizedQuery)&&normalizedQuery===normalizedCandidate;
 const queryInsideCandidate=Boolean(normalizedQuery&&normalizedCandidate&&normalizedCandidate.includes(normalizedQuery));
 const candidateInsideQuery=Boolean(normalizedQuery&&normalizedCandidate&&normalizedQuery.includes(normalizedCandidate));
 const phrase=queryInsideCandidate||candidateInsideQuery;
 const singleToken=queryTokens.size===1&&candidateTokens.has([...queryTokens][0]);
 const concepts=conceptMetrics(query,candidate,queryTokens.size,candidateTokens.size);
 let score=Math.max(.44*tokenJaccard+.22*tokenContainment+.34*trigramJaccard,concepts.conceptScore);
 if(queryInsideCandidate&&normalizedQuery.length>=5){
  score=Math.max(score,.88+.08*Math.min(1,normalizedQuery.length/Math.max(normalizedQuery.length,normalizedCandidate.length)));
 }
 if(candidateInsideQuery&&normalizedCandidate.length>=5&&coverage>=.5&&candidateTokens.size>=2){
  score=Math.max(score,.82+.1*Math.min(1,normalizedCandidate.length/Math.max(normalizedQuery.length,normalizedCandidate.length)));
 }
 if(candidateInsideQuery&&candidateTokens.size===1&&normalizedCandidate.length>=5){
  score=Math.max(score,.36);
 }
 if(singleToken&&[...queryTokens][0].length>=5)score=Math.max(score,.9);
 if(exact)score=1;
 const coreA=withoutNegations(query),coreB=withoutNegations(candidate),coreSimilarity=jaccard(coreA,coreB);
 const conflictSignal=coreA.size>=2&&coreB.size>=2&&coreSimilarity>=.82&&polarity(query)!==polarity(candidate);
 const basis=exact?'EXACT_TEXT':phrase?'PHRASE':concepts.directConceptEquivalent?'CONCEPT_EQUIVALENCE':concepts.matchedConcepts.length?'CONCEPT_CONTEXT':'LEXICAL_OVERLAP';
 return{score:Math.min(1,score),exact,phrase,queryInsideCandidate,candidateInsideQuery,tokenJaccard,tokenContainment,queryCoverage:coverage,trigramJaccard,conflictSignal,coreSimilarity,basis,...concepts};
}

function compareLength(query,candidate){
 const q=contentTokens(query).length,c=contentTokens(candidate).length;return{queryTokens:q,candidateTokens:c,ratio:c?q/c:q};
}

export function rankKnowledgeOverlap(query,records,{topK=8}={}){
 const text=String(query||'').trim();if(text.length<2)throw new Error('query text must contain at least 2 characters');
 const ranked=records.map(record=>{
  const metrics=similarityMetrics(text,record.text),length=compareLength(text,record.text);
  const authorityBoost=record.authority==='CANONICAL'?.025:0;
  return{...record,score:Math.min(1,metrics.score+authorityBoost),metrics,length};
 }).filter(match=>match.score>=.08).sort((a,b)=>b.score-a.score||Number(b.authority==='CANONICAL')-Number(a.authority==='CANONICAL')).slice(0,Math.max(1,Math.min(25,Number(topK)||8)));
 const top=ranked[0]||null;
 let verdict='NEW',confidence=top?Math.max(.5,1-top.score):.98,reason='No meaningful lexical overlap was found in the current corpus index.';
 const conflict=ranked.find(match=>match.metrics.conflictSignal&&match.score>=.7);
 if(conflict){verdict='CONFLICTS';confidence=Math.min(.9,.58+conflict.score*.35);reason='A highly similar statement with opposite explicit negation was found; human review is still required.'}
 else if(top?.metrics.exact||top?.score>=.95){verdict='EXISTS';confidence=Math.max(.9,top.score);reason=top.metrics.basis==='CONCEPT_EQUIVALENCE'?'An approved equivalent term for the same short concept label is already represented.':'The same or nearly identical normalized idea is already represented.'}
 else if(top?.score>=.82){
  if(top.length.ratio>=1.35&&top.metrics.queryCoverage>=.5&&top.metrics.tokenContainment>=.7){verdict='EXTENDS';confidence=Math.min(.94,.68+top.score*.25);reason='The input substantially contains an existing idea and adds additional material.'}
  else if(top.metrics.queryInsideCandidate||top.metrics.queryCoverage>=.8){verdict='EXISTS';confidence=Math.min(.93,.7+top.score*.24);reason='A very strong lexical/phrase match is already represented.'}
  else{verdict='RELATED';confidence=Math.min(.9,.55+top.score*.35);reason=top.metrics.basis==='CONCEPT_CONTEXT'?'Equivalent terminology or a shared concept was found, but the full statements still require human comparison.':'A contained term is present, but it does not cover enough of the input to claim duplication or extension.'}
 }
 else if(top?.score>=.56){verdict='RELATED';confidence=Math.min(.9,.55+top.score*.35);reason=top.metrics.basis==='CONCEPT_CONTEXT'?'Equivalent terminology or a shared concept was found, but the full statements still require human comparison.':'The input overlaps materially with existing knowledge but is not a duplicate.'}
 else if(top?.score>=.32){verdict='UNCERTAIN';confidence=.5+top.score*.2;reason=top.metrics.basis==='CONCEPT_CONTEXT'?'A shared concept was found, but there is not enough evidence to classify the complete idea safely.':'Some overlap exists, but deterministic matching is not strong enough to classify safely.'}
 return{verdict,confidence:Number(confidence.toFixed(4)),reason,matches:ranked};
}

function dbRecordFromCandidate(row){
 return{id:row.id,authority:'CANDIDATE',type:row.atom_type,text:row.candidate_text,reviewStatus:row.review_status,sourceId:row.source_id,sourceTitle:row.source_title,sourceFile:row.source_file||null,section:row.section||null,extractorVersion:row.extractor_version};
}

export async function matchAgainstCorpus(db,text,{topK=8}={}){
 const candidateRows=(await db.query(`
  SELECT c.id,c.atom_type,c.candidate_text,c.review_status,c.source_id,c.extractor_version,
         c.metadata->>'section' AS section,s.title AS source_title,s.metadata->>'sourceFile' AS source_file
  FROM extraction_candidates c JOIN sources s ON s.id=c.source_id
  WHERE c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge
 `)).rows;
 const canonicalRows=(await db.query(`SELECT id,canonical_name,description FROM concepts`)).rows;
 const records=[...canonicalRows.map(row=>({id:row.id,authority:'CANONICAL',type:'CONCEPT',text:row.canonical_name,description:row.description||''})),...candidateRows.map(dbRecordFromCandidate)];
 const result=rankKnowledgeOverlap(text,records,{topK});
 return{ok:true,engine:{method:'deterministic-concept-aware',version:'overlap-v0.2',semanticModel:false},input:{text:String(text).trim(),normalized:normalizeKnowledgeText(text)},indexed:{canonicalConcepts:canonicalRows.length,reviewCandidates:candidateRows.length,total:records.length},...result,policy:{provisional:true,conceptAwareMatching:true,note:'Verdicts combine lexical evidence with a curated equivalence registry. RELATED/UNCERTAIN and all conflict signals require human review before canonical merge.'}};
}

export async function buildConceptRegistryPreview(db,{duplicatesOnly=false,limit=100}={}){
 const rows=(await db.query(`
  SELECT c.id,c.candidate_text,c.review_status,c.source_id,s.metadata->>'sourceFile' AS source_file
  FROM extraction_candidates c JOIN sources s ON s.id=c.source_id
  WHERE c.atom_type='CONCEPT' AND c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge
  ORDER BY c.created_at,c.source_start
 `)).rows;
 const groups=new Map();
 for(const row of rows){
  const normalized=normalizeKnowledgeText(row.candidate_text);if(!normalized)continue;
  const cluster=groups.get(normalized)||{clusterKey:sha256(normalized),normalized,labels:new Map(),candidateIds:[],sourceIds:new Set(),sourceFiles:new Set()};
  cluster.labels.set(row.candidate_text,(cluster.labels.get(row.candidate_text)||0)+1);cluster.candidateIds.push(row.id);cluster.sourceIds.add(row.source_id);if(row.source_file)cluster.sourceFiles.add(row.source_file);groups.set(normalized,cluster);
 }
 const clusters=[...groups.values()].map(cluster=>({clusterKey:cluster.clusterKey,normalized:cluster.normalized,preferredLabel:[...cluster.labels.entries()].sort((a,b)=>b[1]-a[1]||a[0].length-b[0].length)[0]?.[0]||cluster.normalized,labels:[...cluster.labels.entries()].map(([label,count])=>({label,count})),candidateCount:cluster.candidateIds.length,sourceCount:cluster.sourceIds.size,candidateIds:cluster.candidateIds,sourceFiles:[...cluster.sourceFiles]})).sort((a,b)=>b.candidateCount-a.candidateCount||a.preferredLabel.localeCompare(b.preferredLabel,'he'));
 const duplicateClusters=clusters.filter(cluster=>cluster.candidateCount>1),selected=(duplicatesOnly?duplicateClusters:clusters).slice(0,Math.max(1,Math.min(500,Number(limit)||100)));
 return{ok:true,mode:'preview',registry:{candidateConcepts:rows.length,exactClusters:clusters.length,duplicateClusters:duplicateClusters.length,singletonClusters:clusters.length-duplicateClusters.length},clusters:selected,policy:{canonicalWrites:false,note:'These are exact normalized concept proposals. No cluster is automatically promoted or merged into canonical concepts.'}};
}
