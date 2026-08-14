import crypto from'node:crypto';
import{normalizeKnowledgeText}from'../matching/knowledge-overlap.service.js';
import{buildEmergentCorpusMap}from'../map/emergent-corpus-map.service.js';

const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
const PREFIXES=new Set(['ו','ב','כ','ל','מ','ה']);

export const RELATION_TYPES=[
 'IS_A','PART_OF','DEPENDS_ON','INFLUENCES','REGULATES','CAUSES_OR_CONTRIBUTES_TO',
 'CONTRADICTS','SUPPORTS','EXPLAINS','EXAMPLE_OF','APPLIES_TO','REFRAMES',
 'PREREQUISITE_FOR','REVISITED_BY',
];

const PATTERNS=[
 {type:'EXAMPLE_OF',re:/(?:הוא|היא)\s+דוגמ[אה]\s+ל/gu,base:.96},
 {type:'IS_A',re:/(?:הוא|היא)\s+(?:סוג|צורה|קטגוריה)\s+של/gu,base:.96},
 {type:'PART_OF',re:/(?:הוא|היא)?\s*חלק\s+מ/gu,base:.97},
 {type:'PART_OF',re:/(?:מורכב|מורכבת|מורכבים|מורכבות)\s+מ/gu,base:.9,reverse:true},
 {type:'PART_OF',re:/(?:כולל|כוללת|כוללים|כוללות)/gu,base:.87,reverse:true},
 {type:'DEPENDS_ON',re:/(?:תלוי|תלויה|תלויים|תלויות)\s+ב/gu,base:.95},
 {type:'INFLUENCES',re:/(?:משפיע|משפיעה|משפיעים|משפיעות)\s+על/gu,base:.97},
 {type:'REGULATES',re:/(?:מווסת|מווסתת|מווסתים|מווסתות)\s+(?:את\s+)?/gu,base:.97},
 {type:'CAUSES_OR_CONTRIBUTES_TO',re:/(?:גורם|גורמת|גורמים|גורמות)\s+ל/gu,base:.96},
 {type:'CAUSES_OR_CONTRIBUTES_TO',re:/(?:מוביל|מובילה|מובילים|מובילות)\s+ל/gu,base:.93},
 {type:'CAUSES_OR_CONTRIBUTES_TO',re:/(?:תורם|תורמת|תורמים|תורמות)\s+ל/gu,base:.89},
 {type:'CONTRADICTS',re:/(?:סותר|סותרת|סותרים|סותרות)\s+(?:את\s+)?/gu,base:.98},
 {type:'SUPPORTS',re:/(?:תומך|תומכת|תומכים|תומכות)\s+ב/gu,base:.9},
 {type:'EXPLAINS',re:/(?:מסביר|מסבירה|מסבירים|מסבירות)\s+(?:את\s+)?/gu,base:.93},
 {type:'APPLIES_TO',re:/(?:חל|חלה|חלים|חלות)\s+על/gu,base:.93},
 {type:'REFRAMES',re:/(?:ממסגר|ממסגרת|ממסגרים|ממסגרות)\s+מחדש\s+(?:את\s+)?/gu,base:.94},
 {type:'PREREQUISITE_FOR',re:/(?:תנאי\s+מוקדם|דרישת\s+קדם)\s+ל/gu,base:.98},
 {type:'REVISITED_BY',re:/(?:נחזור|חוזרים|נשוב)\s+(?:אל|ל)/gu,base:.72,pedagogic:true},
];

function normalizeToken(token){
 const value=normalizeKnowledgeText(token);if(!value)return'';
 if(value.length>=5&&PREFIXES.has(value[0]))return value.slice(1);
 return value;
}
function tokenSet(value){return new Set((normalizeKnowledgeText(value).match(/[\p{L}\p{N}]+/gu)||[]).map(normalizeToken).filter(Boolean))}
function intersectionSize(a,b){let n=0;for(const v of a)if(b.has(v))n+=1;return n}

function entityMentionScore(segment,node,{sourceFile=null}={}){
 const normalized=normalizeKnowledgeText(segment),label=normalizeKnowledgeText(node.label);if(!normalized||!label)return null;
 const directIndex=normalized.lastIndexOf(label);
 if(directIndex>=0)return{score:Math.min(1,.96+(sourceFile&&node.sourceFiles?.includes(sourceFile)?.025:0)),position:directIndex+label.length/2,mode:'EXACT_PHRASE'};
 const wanted=tokenSet(label),seen=tokenSet(normalized);if(!wanted.size)return null;
 const coverage=intersectionSize(wanted,seen)/wanted.size;
 if(coverage<1)return null;
 if(wanted.size===1&&[...wanted][0].length<5)return null;
 const score=(wanted.size>=2?.84:.76)+(sourceFile&&node.sourceFiles?.includes(sourceFile)?.03:0);
 return{score:Math.min(.92,score),position:normalized.length/2,mode:'TOKEN_EXACT'};
}

function bestEntity(segment,nodes,{side,sourceFile}={}){
 const found=[];
 for(const node of nodes){
  if(node.kind!=='CONCEPT'&&node.kind!=='SECTION_TOPIC')continue;
  const mention=entityMentionScore(segment,node,{sourceFile});if(!mention)continue;
  found.push({node,mention});
 }
 found.sort((a,b)=>{
  if(side==='LEFT'&&a.mention.position!==b.mention.position)return b.mention.position-a.mention.position;
  if(side==='RIGHT'&&a.mention.position!==b.mention.position)return a.mention.position-b.mention.position;
  return b.mention.score-a.mention.score||b.node.label.length-a.node.label.length;
 });
 return found[0]||null;
}

function detectPattern(text){
 const normalized=normalizeKnowledgeText(text),hits=[];
 for(const pattern of PATTERNS){
  pattern.re.lastIndex=0;let match;
  while((match=pattern.re.exec(normalized))){hits.push({pattern,index:match.index,end:match.index+match[0].length,cue:match[0]});if(match[0].length===0)break}
 }
 return hits.sort((a,b)=>a.index-b.index||b.cue.length-a.cue.length);
}

function relationKey(atomId,fromNode,toNode,type,version){return sha256([atomId,fromNode.id,toNode.id,type,version].join('|'))}

export function extractExplicitRelations({nodes,atoms,version='relations-he-v0.1'}){
 const relations=[],skipped={noCue:0,missingLeft:0,missingRight:0,sameEndpoint:0,pedagogicWithoutPair:0};
 for(const atom of atoms){
  if(['CONCEPT','EDITORIAL_NOTE','QUESTION'].includes(atom.atom_type))continue;
  const text=String(atom.candidate_text||''),hits=detectPattern(text);
  if(!hits.length){skipped.noCue+=1;continue}
  for(const hit of hits){
   const normalized=normalizeKnowledgeText(text),left=normalized.slice(0,hit.index).trim(),right=normalized.slice(hit.end).trim();
   const leftEntity=bestEntity(left,nodes,{side:'LEFT',sourceFile:atom.source_file});
   const rightEntity=bestEntity(right,nodes,{side:'RIGHT',sourceFile:atom.source_file});
   if(!leftEntity){skipped.missingLeft+=1;continue}
   if(!rightEntity){if(hit.pattern.pedagogic)skipped.pedagogicWithoutPair+=1;else skipped.missingRight+=1;continue}
   let from=leftEntity,to=rightEntity;if(hit.pattern.reverse)[from,to]=[to,from];
   if(from.node.id===to.node.id){skipped.sameEndpoint+=1;continue}
   const endpointConfidence=Math.min(from.mention.score,to.mention.score),confidence=Math.min(.99,hit.pattern.base*endpointConfidence);
   relations.push({
    relationKey:relationKey(atom.id,from.node,to.node,hit.pattern.type,version),relationType:hit.pattern.type,
    from:{nodeId:from.node.id,kind:from.node.kind,label:from.node.label,matchMode:from.mention.mode},
    to:{nodeId:to.node.id,kind:to.node.kind,label:to.node.label,matchMode:to.mention.mode},
    sourceAtomId:atom.id,sourceId:atom.source_id,sourceFile:atom.source_file||null,section:atom.section||null,
    evidenceMode:'EXPLICIT_LINGUISTIC',cue:hit.cue,exactQuote:text,confidence:Number(confidence.toFixed(4)),reviewStatus:'PENDING',extractorVersion:version,
   });
  }
 }
 const unique=new Map();for(const relation of relations)if(!unique.has(relation.relationKey)||unique.get(relation.relationKey).confidence<relation.confidence)unique.set(relation.relationKey,relation);
 const result=[...unique.values()].sort((a,b)=>b.confidence-a.confidence||a.relationType.localeCompare(b.relationType)||a.from.label.localeCompare(b.from.label,'he'));
 const byType={};for(const relation of result)byType[relation.relationType]=(byType[relation.relationType]||0)+1;
 return{relations:result,summary:{total:result.length,byType,skipped}};
}

async function loadMapInputs(db){
 const conceptRows=(await db.query(`SELECT c.id,c.candidate_text,c.source_id,c.source_start,c.metadata->>'section' AS section,s.metadata->>'sourceFile' AS source_file FROM extraction_candidates c JOIN sources s ON s.id=c.source_id WHERE c.atom_type='CONCEPT' AND c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge ORDER BY c.source_id,c.source_start`)).rows;
 const atoms=(await db.query(`SELECT c.id,c.atom_type::text,c.candidate_text,c.source_id,c.source_start,c.metadata->>'section' AS section,s.metadata->>'sourceFile' AS source_file FROM extraction_candidates c JOIN sources s ON s.id=c.source_id WHERE c.review_status<>'REJECTED' AND NOT c.exclude_from_knowledge ORDER BY c.source_id,c.source_start`)).rows;
 return{conceptRows,atoms};
}

export async function previewExplicitRelations(db,{limit=200}={}){
 const{conceptRows,atoms}=await loadMapInputs(db),map=buildEmergentCorpusMap({conceptRows,atomRows:atoms}),extracted=extractExplicitRelations({nodes:map.nodes,atoms});
 return{ok:true,mode:'preview',extractor:{method:'explicit-linguistic-patterns',version:'relations-he-v0.1',semanticModel:false},map:{nodes:map.summary.totalMapNodes,connectedCoveragePercent:map.summary.connectedCoveragePercent},summary:extracted.summary,relations:extracted.relations.slice(0,Math.max(1,Math.min(1000,Number(limit)||200))),policy:{canonicalWrites:false,requiresReview:true,note:'Only explicit linguistic cues with two observed map endpoints produce relation candidates. Context/co-occurrence alone never produces a typed semantic relation.'}};
}
