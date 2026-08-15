import{buildEmergentCorpusMapPreview}from'../map/emergent-corpus-map.service.js';
import{LIBRARY_DOMAINS,LIBRARY_TOPICS,canonicalSubtopic,normalizeTaxonomyLabel,topicForSourceFile}from'./content-taxonomy.js';

const compact=value=>String(value||'').replace(/\s+/g,' ').trim();
const unique=values=>[...new Set(values.filter(Boolean))];
const rawSections=node=>(node.sections||[]).map(value=>{const parts=String(value).split('::');return parts.length>1?parts.slice(1).join('::'):String(value)}).filter(Boolean);
const nodeScore=node=>(Number(node.contextAtomCount)||0)*4+(Number(node.sourceCount)||0)*2+(Number(node.candidateCount)||0);

export{LIBRARY_DOMAINS};

export function domainForSourceFiles(sourceFiles=[]){
 const counts=new Map();
 for(const file of sourceFiles){const topic=topicForSourceFile(file);if(topic)counts.set(topic.domainId,(counts.get(topic.domainId)||0)+1)}
 const winner=[...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];
 return LIBRARY_DOMAINS.find(domain=>domain.id===winner)||null;
}

function groupSubtopics(topicDef,nodes){
 const matching=nodes.filter(node=>(node.sourceFiles||[]).some(file=>topicDef.source.test(String(file))));
 const groups=new Map(),suppressed=[];
 for(const node of matching){
  const canonical=canonicalSubtopic(node.label);
  if(!canonical){suppressed.push(node);continue}
  const topicFiles=(node.sourceFiles||[]).filter(file=>topicDef.source.test(String(file)));
  const key=canonical.id||node.id,current=groups.get(key)||{id:`subtopic:${topicDef.id}:${key}`,label:canonical.label,nodeIds:[],sections:[],sourceFiles:[],sourceCount:0,unitCount:0};
  current.nodeIds.push(node.id);current.sections.push(...rawSections(node));current.sourceFiles.push(...topicFiles);current.unitCount+=Number(node.contextAtomCount||node.candidateCount||0);groups.set(key,current);
 }
 const subtopics=[...groups.values()].map(item=>({...item,nodeIds:unique(item.nodeIds),sections:unique(item.sections),sourceFiles:unique(item.sourceFiles),sourceCount:unique(item.sourceFiles).length})).sort((a,b)=>b.unitCount-a.unitCount||a.label.localeCompare(b.label,'he'));
 const sourceFiles=unique(matching.flatMap(node=>(node.sourceFiles||[]).filter(file=>topicDef.source.test(String(file)))));
 return{matching,subtopics,suppressed,sourceFiles};
}

export function buildLibraryHierarchyFromMap(map){
 const sectionNodes=(map?.nodes||[]).filter(node=>node.kind==='SECTION_TOPIC'),claimed=new Set(),topicViews=[];
 for(const topicDef of LIBRARY_TOPICS){
  const grouped=groupSubtopics(topicDef,sectionNodes);for(const node of grouped.matching)claimed.add(node.id);
  if(!grouped.matching.length)continue;
  topicViews.push({id:`topic:${topicDef.id}`,key:topicDef.id,label:topicDef.label,domainId:topicDef.domainId,order:topicDef.order,sourceFiles:grouped.sourceFiles,sourceCount:grouped.sourceFiles.length,unitCount:grouped.matching.reduce((sum,node)=>sum+Number(node.contextAtomCount||node.candidateCount||0),0),subtopics:grouped.subtopics,suppressedSectionCount:grouped.suppressed.length});
 }
 const domains=LIBRARY_DOMAINS.map(domain=>({id:domain.id,label:domain.label,description:domain.description,topics:topicViews.filter(topic=>topic.domainId===domain.id).sort((a,b)=>a.order-b.order)})).filter(domain=>domain.topics.length);
 const unassigned=sectionNodes.filter(node=>!claimed.has(node.id)).map(node=>({id:node.id,label:node.label,sourceCount:node.sourceCount,unitCount:node.contextAtomCount||node.candidateCount||0,sourceFiles:node.sourceFiles||[]})).sort((a,b)=>nodeScore({contextAtomCount:b.unitCount,sourceCount:b.sourceCount})-nodeScore({contextAtomCount:a.unitCount,sourceCount:a.sourceCount})||a.label.localeCompare(b.label,'he'));
 return{domains,unassigned};
}

const priority={DEFINITION:0,CLAIM:1,MODEL:2,CREATOR_INSIGHT:3,WORLDVIEW_CLAIM:4,PRACTICE:5,TENSION:6,REFERENCE:7,EXAMPLE:8,QUESTION:9,CONCEPT:10,EDITORIAL_NOTE:99};
function selectKeyPoints(rows,limit=7){const seen=new Set();return rows.filter(row=>row.atomType!=='EDITORIAL_NOTE'&&!row.excludeFromKnowledge).sort((a,b)=>(priority[a.atomType]??50)-(priority[b.atomType]??50)||Number(b.confidence)-Number(a.confidence)||Number(a.sourceStart)-Number(b.sourceStart)).filter(row=>{const key=normalizeTaxonomyLabel(row.text);if(key.length<20||seen.has(key))return false;seen.add(key);return true}).slice(0,limit).map(row=>({id:row.id,type:row.atomType,claimType:row.claimType||null,text:compact(row.text),sourceLabel:row.sourceTitle,confidence:Number(row.confidence)}))}
function shortExtract(value,max=520){const text=compact(value);if(text.length<=max)return text;const slice=text.slice(0,max+1),cut=slice.lastIndexOf(' ');return`${slice.slice(0,cut>max*.75?cut:max).trim()}…`}
export function buildExtractiveCard(label,keyPoints,sources,nodeId){const summary=shortExtract(keyPoints.slice(0,2).map(point=>point.text).join(' '));return{id:`knowledge-card:${nodeId}:v1`,title:label,summary:summary||`הנושא ${label} קיים במאגר ומבוסס על ${sources.length} מקורות שמורים.`,sourceLabel:sources.map(source=>source.title).slice(0,4).join(' · '),provenanceLabel:'Knowledge Card v1 · סיכום חילוצי המבוסס על יחידות ידע ומקורות שמורים'}}

async function candidateRows(db,{sections=[],sourceTitles=[]}={}){const params=[],where=[`c.exclude_from_knowledge=FALSE`];if(sections.length){params.push(sections);where.push(`c.metadata->>'section'=ANY($${params.length}::text[])`)}if(sourceTitles.length){params.push(sourceTitles);where.push(`COALESCE(s.metadata->>'sourceFile',s.title)=ANY($${params.length}::text[])`)}const{rows}=await db.query(`SELECT c.id,c.atom_type::text AS "atomType",c.claim_type::text AS "claimType",c.candidate_text AS text,c.confidence,c.source_start AS "sourceStart",c.exclude_from_knowledge AS "excludeFromKnowledge",s.id AS "sourceId",COALESCE(s.metadata->>'sourceFile',s.title) AS "sourceTitle" FROM extraction_candidates c JOIN sources s ON s.id=c.source_id WHERE ${where.join(' AND ')} ORDER BY c.confidence DESC,c.source_start LIMIT 120`,params);return rows}
function sourceViews(rows,extra=[]){const map=new Map();for(const source of extra)map.set(source.title,{id:source.id||null,title:source.title});for(const row of rows)map.set(row.sourceTitle,{id:row.sourceId,title:row.sourceTitle});return[...map.values()]}
function allTopics(hierarchy){return hierarchy.domains.flatMap(domain=>domain.topics)}
function allSubtopics(hierarchy){return allTopics(hierarchy).flatMap(topic=>topic.subtopics.map(subtopic=>({...subtopic,parentTopic:topic})))}

async function mapForLibrary(db){return buildEmergentCorpusMapPreview(db,{communityLimit:1,nodeLimit:500,edgeLimit:1000})}
export async function buildContentLibraryIndex(db){
 const map=await mapForLibrary(db),hierarchy=buildLibraryHierarchyFromMap(map),topics=allTopics(hierarchy),subtopics=allSubtopics(hierarchy);
 return{ok:true,version:'content-library-v2',summary:{domains:hierarchy.domains.length,topics:topics.length,subtopics:subtopics.length,unassignedSections:hierarchy.unassigned.length,unassignedTopics:hierarchy.unassigned.length},domains:hierarchy.domains,unassignedTopics:hierarchy.unassigned,policy:{levels:['DOMAIN','TOPIC','SUBTOPIC'],hierarchyUsesGraphEdges:false,relatedIsNotHierarchy:true,sourceFilesDefineTopicBuckets:true,sourceSectionHeadingsAreLeafCandidates:true,noisySectionHeadingsSuppressed:true,fixedChapterCount:false}};
}

export async function buildContentLibraryDetail(db,nodeId){
 const map=await mapForLibrary(db),hierarchy=buildLibraryHierarchyFromMap(map),topics=allTopics(hierarchy),subtopics=allSubtopics(hierarchy);
 if(String(nodeId).startsWith('domain:')){
  const id=String(nodeId).slice(7),domain=hierarchy.domains.find(item=>item.id===id);if(!domain)return null;
  const sourceTitles=unique(domain.topics.flatMap(topic=>topic.sourceFiles)),rows=await candidateRows(db,{sourceTitles}),keyPoints=selectKeyPoints(rows),sources=sourceViews(rows,sourceTitles.map(title=>({title})));
  return{ok:true,id:`domain:${domain.id}`,kind:'DOMAIN',label:domain.label,domainId:domain.id,domainLabel:domain.label,parentTopicLabel:null,description:domain.description,keyPoints,relatedConcepts:[],sources,card:buildExtractiveCard(domain.label,keyPoints,sources,`domain:${domain.id}`),policy:{summaryMode:'extractive',canonicalTruthInvented:false,relationsRequireReview:true}};
 }
 if(String(nodeId).startsWith('topic:')){
  const topic=topics.find(item=>item.id===nodeId);if(!topic)return null;const domain=LIBRARY_DOMAINS.find(item=>item.id===topic.domainId);
  const rows=await candidateRows(db,{sourceTitles:topic.sourceFiles}),keyPoints=selectKeyPoints(rows),sources=sourceViews(rows,topic.sourceFiles.map(title=>({title})));
  return{ok:true,id:topic.id,kind:'TOPIC',label:topic.label,domainId:topic.domainId,domainLabel:domain?.label||'',parentTopicLabel:null,description:'זהו נושא מרכזי בספרייה. המידע שלו נאסף מיחידות הידע במקור המשויך אליו, ותתי־הנושאים שמתחתיו הם חלוקה ניווטית — לא קשרי גרף.',keyPoints,relatedConcepts:[],sources,card:buildExtractiveCard(topic.label,keyPoints,sources,topic.id),policy:{summaryMode:'extractive',canonicalTruthInvented:false,relationsRequireReview:true}};
 }
 if(String(nodeId).startsWith('subtopic:')){
  const entry=subtopics.find(item=>item.id===nodeId);if(!entry)return null;const topic=entry.parentTopic,domain=LIBRARY_DOMAINS.find(item=>item.id===topic.domainId);
  const rows=await candidateRows(db,{sections:entry.sections,sourceTitles:entry.sourceFiles}),keyPoints=selectKeyPoints(rows),sources=sourceViews(rows,entry.sourceFiles.map(title=>({title})));
  return{ok:true,id:entry.id,kind:'SUBTOPIC',label:entry.label,domainId:topic.domainId,domainLabel:domain?.label||'',parentTopicLabel:topic.label,description:`המידע המוצג כאן נאסף מיחידות הידע תחת הכותרות המקוריות: ${entry.sections.join(' · ')}.`,keyPoints,relatedConcepts:[],sources,card:buildExtractiveCard(entry.label,keyPoints,sources,entry.id),policy:{summaryMode:'extractive',canonicalTruthInvented:false,contextualGraphNeighborsHidden:true,relationsRequireReview:true}};
 }
 const legacyNode=(map.nodes||[]).find(item=>item.id===nodeId&&item.kind==='SECTION_TOPIC');if(!legacyNode)return null;
 const domain=domainForSourceFiles(legacyNode.sourceFiles||[]),rows=await candidateRows(db,{sections:rawSections(legacyNode),sourceTitles:legacyNode.sourceFiles||[]}),keyPoints=selectKeyPoints(rows),sources=sourceViews(rows,(legacyNode.sourceFiles||[]).map(title=>({title})));
 return{ok:true,id:legacyNode.id,kind:'SECTION_TOPIC',label:legacyNode.label,domainId:domain?.id||null,domainLabel:domain?.label||'נושא שעדיין לא סווג',parentTopicLabel:null,description:'תצוגת תאימות לכותרת מקור ישנה. היא אינה מגדירה יותר את ההיררכיה הראשית של הספרייה.',keyPoints,relatedConcepts:[],sources,card:buildExtractiveCard(legacyNode.label,keyPoints,sources,legacyNode.id),policy:{summaryMode:'extractive',contextualGraphNeighborsHidden:true,relationsRequireReview:true,canonicalTruthInvented:false}};
}
