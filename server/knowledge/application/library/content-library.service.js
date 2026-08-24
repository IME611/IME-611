import{buildEmergentCorpusMapPreview}from'../map/emergent-corpus-map.service.js';
import{LIBRARY_DOMAINS,LIBRARY_TOPICS,canonicalSubtopic,normalizeTaxonomyLabel,topicForSectionNode,topicForSourceFile}from'./content-taxonomy.js';
import{PEDAGOGIC_FLOW_VERSION,pedagogicFlowForTopic}from'./pedagogic-flow.js';

const compact=value=>String(value||'').replace(/\s+/g,' ').trim();
const unique=values=>[...new Set(values.filter(Boolean))];
const rawSections=node=>(node.sections||[]).map(value=>{const parts=String(value).split('::');return parts.length>1?parts.slice(1).join('::'):String(value)}).filter(Boolean);
const nodeScore=node=>(Number(node.contextAtomCount)||0)*4+(Number(node.sourceCount)||0)*2+(Number(node.candidateCount)||0);

const TOPIC_SOURCE_SPANS={
 'journey-origin':{type:'SOURCE_SPAN',sourceFile:'מי_אני_פרק1_v6.docx',startAt:0,beforeSection:'אני פנימה — הגוף כמערכת',reason:'פתיחת המסע נמצאת לפני כותרת הגוף הראשונה, ולכן היא תחומה לפי מיקום במקור ולא לפי מילת מפתח.'},
};
const LEARNER_EPISTEMIC_FRAMES={
 'dmt-practice':{id:'SOURCE_PRACTICE_CLAIMS',displayType:'REFERENCE',displayClaimType:'SOURCE_CLAIM',notice:'הפריטים ביחידה הזאת הם טענות והמלצות כפי שהופיעו במקור. הם אינם מסומנים אוטומטית כעובדה מדעית מאומתת.',cardProvenance:'Knowledge Card v2 · סיכום טענות והמלצות כפי שהופיעו במקור · לא סימון כעובדה מאומתת'},
};

export{LIBRARY_DOMAINS};

export function domainForSourceFiles(sourceFiles=[]){
 const counts=new Map();
 for(const file of sourceFiles){const topic=topicForSourceFile(file);if(topic)counts.set(topic.domainId,(counts.get(topic.domainId)||0)+1)}
 const winner=[...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];
 return LIBRARY_DOMAINS.find(domain=>domain.id===winner)||null;
}

function sectionBelongsToTopic(node,topicDef){
 if(topicForSectionNode(node)?.id!==topicDef.id)return false;
 if(topicDef.id==='journey-origin')return(node.sourceFiles||[]).some(file=>topicDef.source.test(String(file)));
 return true;
}

function groupSubtopics(topicDef,nodes){
 const matching=nodes.filter(node=>sectionBelongsToTopic(node,topicDef)),evidenceFiles=unique(nodes.flatMap(node=>(node.sourceFiles||[]).filter(file=>topicDef.source.test(String(file)))));
 const groups=new Map(),suppressed=[];
 for(const node of matching){
  const canonical=canonicalSubtopic(node.label);
  if(!canonical){suppressed.push(node);continue}
  const key=canonical.id||node.id,current=groups.get(key)||{id:`subtopic:${topicDef.id}:${key}`,label:canonical.label,nodeIds:[],sections:[],sourceFiles:[],sourceCount:0,unitCount:0};
  current.nodeIds.push(node.id);current.sections.push(...rawSections(node));current.sourceFiles.push(...(node.sourceFiles||[]));current.unitCount+=Number(node.contextAtomCount||node.candidateCount||0);groups.set(key,current);
 }
 const subtopics=[...groups.values()].map(item=>({...item,nodeIds:unique(item.nodeIds),sections:unique(item.sections),sourceFiles:unique(item.sourceFiles),sourceCount:unique(item.sourceFiles).length})).sort((a,b)=>b.unitCount-a.unitCount||a.label.localeCompare(b.label,'he'));
 const sourceFiles=unique([...matching.flatMap(node=>node.sourceFiles||[]),...(topicDef.always?evidenceFiles:[])]);
 return{matching,subtopics,suppressed,sourceFiles};
}

export function buildLibraryHierarchyFromMap(map){
 const sectionNodes=(map?.nodes||[]).filter(node=>node.kind==='SECTION_TOPIC'),claimed=new Set(),topicViews=[];
 for(const topicDef of LIBRARY_TOPICS){
  const grouped=groupSubtopics(topicDef,sectionNodes);for(const node of grouped.matching)claimed.add(node.id);
  if(!grouped.matching.length&&!grouped.sourceFiles.length)continue;
  topicViews.push({id:`topic:${topicDef.id}`,key:topicDef.id,label:topicDef.label,domainId:topicDef.domainId,order:topicDef.order,sourceFiles:grouped.sourceFiles,sourceCount:grouped.sourceFiles.length,unitCount:grouped.matching.reduce((sum,node)=>sum+Number(node.contextAtomCount||node.candidateCount||0),0),sectionNodeIds:grouped.matching.map(node=>node.id),sections:unique(grouped.matching.flatMap(rawSections)),subtopics:grouped.subtopics,suppressedSectionCount:grouped.suppressed.length});
 }
 const domains=LIBRARY_DOMAINS.map(domain=>({id:domain.id,label:domain.label,description:domain.description,topics:topicViews.filter(topic=>topic.domainId===domain.id).sort((a,b)=>a.order-b.order)})).filter(domain=>domain.topics.length);
 const unassigned=sectionNodes.filter(node=>!claimed.has(node.id)).map(node=>({id:node.id,label:node.label,sourceCount:node.sourceCount,unitCount:node.contextAtomCount||node.candidateCount||0,sourceFiles:node.sourceFiles||[]})).sort((a,b)=>nodeScore({contextAtomCount:b.unitCount,sourceCount:b.sourceCount})-nodeScore({contextAtomCount:a.unitCount,sourceCount:a.sourceCount})||a.label.localeCompare(b.label,'he'));
 return{domains,unassigned};
}

const priority={DEFINITION:0,CLAIM:1,MODEL:2,CREATOR_INSIGHT:3,WORLDVIEW_CLAIM:4,PRACTICE:5,TENSION:6,REFERENCE:7,EXAMPLE:8,QUESTION:9,CONCEPT:10,EDITORIAL_NOTE:99};
export function selectKeyPoints(rows,limit=7,{sourceOrder=false}={}){const seen=new Set();return rows.filter(row=>row.atomType!=='EDITORIAL_NOTE'&&!row.excludeFromKnowledge).sort((a,b)=>sourceOrder?Number(a.sourceStart)-Number(b.sourceStart):Number(a.learnerPriority||0)-Number(b.learnerPriority||0)||(priority[a.atomType]??50)-(priority[b.atomType]??50)||Number(b.confidence)-Number(a.confidence)||Number(a.sourceStart)-Number(b.sourceStart)).filter(row=>{const key=normalizeTaxonomyLabel(row.text);if(key.length<20||seen.has(key))return false;seen.add(key);return true}).slice(0,limit).map(row=>({id:row.id,type:row.atomType,claimType:row.claimType||null,text:compact(row.text),sourceLabel:row.sourceTitle,confidence:Number(row.confidence),sourceType:row.sourceAtomType||null,sourceClaimType:row.sourceClaimType||null,epistemicFrame:row.learnerEpistemicFrame||null}))}
function shortExtract(value,max=520){const text=compact(value);if(text.length<=max)return text;const slice=text.slice(0,max+1),cut=slice.lastIndexOf(' ');return`${slice.slice(0,cut>max*.75?cut:max).trim()}…`}
export function buildExtractiveCard(label,keyPoints,sources,nodeId){const summary=shortExtract(keyPoints.slice(0,2).map(point=>point.text).join(' '));return{id:`knowledge-card:${nodeId}:v2`,title:label,summary:summary||`עדיין אין מספיק יחידות ידע ממוקדות כדי לסכם את ${label} בלי לערבב תוכן מנושאים אחרים.`,sourceLabel:sources.map(source=>source.title).slice(0,4).join(' · '),provenanceLabel:'Knowledge Card v2 · סיכום חילוצי מתוך אותה יחידת לימוד'}}
function buildLearnerCard(label,keyPoints,sources,nodeId){const card=buildExtractiveCard(label,keyPoints,sources,nodeId),containsSourceClaims=keyPoints.slice(0,2).some(point=>point.epistemicFrame==='SOURCE_PRACTICE_CLAIMS');return containsSourceClaims?{...card,provenanceLabel:'Knowledge Card v2 · כולל טענות/המלצות כפי שהופיעו במקור · לא סימון כעובדה מאומתת'}:card}

function epistemicFrameForSubtopic(entry){const key=String(entry?.id||'').split(':').at(-1);return LEARNER_EPISTEMIC_FRAMES[key]||null}
export function frameSubtopicForLearner(entry,keyPoints,card){
 const frame=epistemicFrameForSubtopic(entry);
 if(!frame)return{epistemicFrame:null,epistemicNotice:null,keyPoints:[...(keyPoints||[])],card};
 const framedPoints=(keyPoints||[]).map(point=>({...point,sourceType:point.type,sourceClaimType:point.claimType||null,type:frame.displayType,claimType:frame.displayClaimType,epistemicFrame:frame.id}));
 return{epistemicFrame:frame.id,epistemicNotice:frame.notice,keyPoints:framedPoints,card:{...card,provenanceLabel:frame.cardProvenance}};
}
function framedSectionsForTopic(topic){const map=new Map();for(const subtopic of topic?.subtopics||[]){const frame=epistemicFrameForSubtopic(subtopic);if(!frame)continue;for(const section of subtopic.sections||[])map.set(String(section),frame)}return map}
export function frameTopicRowsForLearner(topic,rows){const bySection=framedSectionsForTopic(topic);return(rows||[]).map(row=>{const frame=bySection.get(String(row.section||''));if(!frame)return{...row};return{...row,sourceAtomType:row.atomType,sourceClaimType:row.claimType||null,atomType:frame.displayType,claimType:frame.displayClaimType,learnerPriority:100,learnerEpistemicFrame:frame.id}})}
function topicEpistemicNotice(topic){const labels=[];for(const subtopic of topic?.subtopics||[])if(epistemicFrameForSubtopic(subtopic))labels.push(subtopic.label);return labels.length?`חלק מהתוכן בנושא — ${unique(labels).join(' · ')} — מוצג כטענות/המלצות מהמקור ולא כעובדות מאומתות. הוא נשאר נגיש, אך אינו מקבל עדיפות על הידע המרכזי של הנושא.`:null}

async function candidateRows(db,{sections=[],sourceTitles=[],limit=240}={}){const params=[],where=[`c.exclude_from_knowledge=FALSE`,`(COALESCE((c.metadata->>'intakeApprovedSource')::boolean,FALSE)=FALSE OR COALESCE((c.metadata->>'learnerPublished')::boolean,FALSE)=TRUE)`];if(sections.length){params.push(sections);where.push(`c.metadata->>'section'=ANY($${params.length}::text[])`)}if(sourceTitles.length){params.push(sourceTitles);where.push(`COALESCE(s.metadata->>'sourceFile',s.title)=ANY($${params.length}::text[])`)}params.push(Math.max(20,Math.min(500,Number(limit)||240)));const{rows}=await db.query(`SELECT c.id,c.atom_type::text AS "atomType",c.claim_type::text AS "claimType",c.candidate_text AS text,c.confidence,c.source_start AS "sourceStart",c.source_end AS "sourceEnd",c.exclude_from_knowledge AS "excludeFromKnowledge",c.metadata->>'section' AS section,s.id AS "sourceId",COALESCE(s.metadata->>'sourceFile',s.title) AS "sourceTitle" FROM extraction_candidates c JOIN sources s ON s.id=c.source_id WHERE ${where.join(' AND ')} ORDER BY c.source_start,c.confidence DESC LIMIT $${params.length}`,params);return rows}
function sourceViews(rows){const map=new Map();for(const row of rows)map.set(row.sourceTitle,{id:row.sourceId,title:row.sourceTitle});return[...map.values()]}
function allTopics(hierarchy){return hierarchy.domains.flatMap(domain=>domain.topics)}
function allSubtopics(hierarchy){return allTopics(hierarchy).flatMap(topic=>topic.subtopics.map(subtopic=>({...subtopic,parentTopic:topic})))}

export function selectTopicScopedRows(rows,{sections=[]}={}){
 const sectionSet=new Set((sections||[]).map(String));if(!sectionSet.size)return[];
 return(rows||[]).filter(row=>sectionSet.has(String(row.section||'')));
}

export function learningUnitScopeForTopic(topic){
 const span=TOPIC_SOURCE_SPANS[topic?.key];
 if(span)return{...span};
 return{type:'OBSERVED_SECTIONS',sections:[...(topic?.sections||[])],sourceFiles:[...(topic?.sourceFiles||[])]};
}

export function selectSourceSpanRows(rows,{sourceFile,startAt=0,beforeSection}={}){
 const ordered=(rows||[]).filter(row=>!sourceFile||row.sourceTitle===sourceFile).sort((a,b)=>Number(a.sourceStart)-Number(b.sourceStart));
 if(!ordered.length||!beforeSection)return[];
 const boundary=ordered.find(row=>String(row.section||'')===String(beforeSection));
 if(!boundary)return[];
 const end=Number(boundary.sourceStart);
 return ordered.filter(row=>Number(row.sourceStart)>=Number(startAt||0)&&Number(row.sourceStart)<end);
}

async function scopedRowsForTopic(db,topic){
 const scope=learningUnitScopeForTopic(topic);
 if(scope.type==='SOURCE_SPAN'){
  const rows=await candidateRows(db,{sourceTitles:[scope.sourceFile],limit:400});
  return{rows:selectSourceSpanRows(rows,scope),scope};
 }
 if(!topic.sections.length||!topic.sourceFiles.length)return{rows:[],scope};
 const rows=await candidateRows(db,{sourceTitles:topic.sourceFiles,limit:400});
 return{rows:selectTopicScopedRows(rows,{sections:topic.sections}),scope};
}
async function scopedRowsForDomain(db,domain){
 const selected=new Map();
 for(const topic of domain.topics){const scoped=await scopedRowsForTopic(db,topic);for(const row of frameTopicRowsForLearner(topic,scoped.rows))selected.set(row.id,row)}
 return[...selected.values()];
}
function orderedTopics(hierarchy){return allTopics(hierarchy).sort((a,b)=>a.order-b.order||a.label.localeCompare(b.label,'he'))}
function navItem(topic){if(!topic)return null;return{id:topic.id,label:topic.label,domainId:topic.domainId}}
export function topicLearningUnit(topic,hierarchy){
 const ordered=orderedTopics(hierarchy),index=ordered.findIndex(item=>item.id===topic.id),previous=index>0?ordered[index-1]:null,next=index>=0&&index<ordered.length-1?ordered[index+1]:null,domain=LIBRARY_DOMAINS.find(item=>item.id===topic.domainId),flow=pedagogicFlowForTopic(topic.key);
 const fallbackGoal=`להבין את ${topic.label} בתוך התמונה הרחבה של ${domain?.label||'המסע'}, באמצעות יחידות ידע ששויכו ישירות לנושא.`;
 const fallbackWhy=previous?`הנושא מגיע אחרי „${previous.label}” כחלק ממסלול למידה מדורג${next?`, ולפני המעבר ל„${next.label}”`:''}.`:`זו נקודת הפתיחה של מסלול הלמידה: מתחילים בשאלות שמניעות את החקירה, ורק אחר כך עוברים למערכות ולפרטים.`;
 return{level:'TOPIC',stageId:flow?.stageId||null,stageLabel:flow?.stageLabel||null,learningQuestion:flow?.question||null,goal:flow?`${flow.question} ${flow.objective}`:fallbackGoal,whyNow:flow?`${flow.bridge} ${flow.handoff}`:fallbackWhy,position:index>=0?index+1:null,total:ordered.length,previous:navItem(previous),next:navItem(next),sequenceBasis:flow?PEDAGOGIC_FLOW_VERSION:'CURATED_PEDAGOGIC_FALLBACK',sequenceIsHierarchy:false};
}
function subtopicLearningUnit(entry,topic){return{level:'SUBTOPIC',goal:`להבין את ${entry.label} כחלק ממוקד בתוך הנושא „${topic.label}”.`,whyNow:`זהו פירוט של „${topic.label}”. הוא שייך לתוכן של הנושא, אך אינו יוצר לבדו סדר מחייב מול תתי־נושאים אחרים.`,position:null,total:topic.subtopics.length,previous:null,next:null,sequenceBasis:'PARENT_TOPIC_CONTEXT',sequenceIsHierarchy:false}}
function domainLearningUnit(domain){return{level:'DOMAIN',goal:`לבנות תמונה של ${domain.label} דרך הנושאים המרכזיים שבתוכו.`,whyNow:'התחום הוא מיקום במפת הידע. סדר הלמידה נקבע ברמת יחידות הלימוד ואינו נגזר מעצם ההיררכיה.',position:null,total:domain.topics.length,previous:null,next:null,sequenceBasis:'KNOWLEDGE_MAP_LOCATION',sequenceIsHierarchy:false}}

async function mapForLibrary(db){return buildEmergentCorpusMapPreview(db,{communityLimit:1,nodeLimit:500,edgeLimit:1000,learnerVisibleOnly:true})}
export async function buildContentLibraryIndex(db){
 const map=await mapForLibrary(db),hierarchy=buildLibraryHierarchyFromMap(map),topics=allTopics(hierarchy),subtopics=allSubtopics(hierarchy);
 return{ok:true,version:'content-library-v3.7',summary:{domains:hierarchy.domains.length,topics:topics.length,subtopics:subtopics.length,unassignedSections:hierarchy.unassigned.length,unassignedTopics:hierarchy.unassigned.length},domains:hierarchy.domains.map(domain=>({...domain,topics:domain.topics.map(({sectionNodeIds,sections,...topic})=>topic)})),unassignedTopics:hierarchy.unassigned,policy:{levels:['DOMAIN','TOPIC','SUBTOPIC'],hierarchyUsesGraphEdges:false,relatedIsNotHierarchy:true,seedFilesAreEvidenceNotTopics:true,sourceFilesDefineTopicBuckets:false,topicTextScopeModes:['OBSERVED_SECTIONS','SOURCE_SPAN'],textKeywordFallback:false,sourceOnlyFallbackForTopicText:false,knowledgeMapSeparateFromLearningSequence:true,learningUnitCardUsesSameScopedRows:true,learnerEpistemicFramesDoNotRewriteCanonicalAtoms:true,topicAggregationRespectsEpistemicFrames:true,explicitPedagogicFlow:true,pedagogicFlowVersion:PEDAGOGIC_FLOW_VERSION,noisySectionHeadingsSuppressed:true,intakeSourceRequiresExplicitPublication:true,fixedChapterCount:false}};
}

export async function buildContentLibraryDetail(db,nodeId){
 const map=await mapForLibrary(db),hierarchy=buildLibraryHierarchyFromMap(map),topics=allTopics(hierarchy),subtopics=allSubtopics(hierarchy);
 if(String(nodeId).startsWith('domain:')){
  const id=String(nodeId).slice(7),domain=hierarchy.domains.find(item=>item.id===id);if(!domain)return null;
  const rows=await scopedRowsForDomain(db,domain),keyPoints=selectKeyPoints(rows),sources=sourceViews(rows);
  return{ok:true,id:`domain:${domain.id}`,kind:'DOMAIN',label:domain.label,domainId:domain.id,domainLabel:domain.label,parentTopicLabel:null,description:domain.description,learningUnit:domainLearningUnit(domain),keyPoints,relatedConcepts:[],sources,card:buildLearnerCard(domain.label,keyPoints,sources,`domain:${domain.id}`),policy:{summaryMode:'extractive-bounded',canonicalTruthInvented:false,relationsRequireReview:true,sourceOnlyFallback:false,textKeywordFallback:false,topicEpistemicFramesApplied:true}};
 }
 if(String(nodeId).startsWith('topic:')){
  const topic=topics.find(item=>item.id===nodeId);if(!topic)return null;const domain=LIBRARY_DOMAINS.find(item=>item.id===topic.domainId),scoped=await scopedRowsForTopic(db,topic),learnerRows=frameTopicRowsForLearner(topic,scoped.rows),keyPoints=selectKeyPoints(learnerRows,7,{sourceOrder:scoped.scope.type==='SOURCE_SPAN'}),sources=sourceViews(learnerRows),notice=topicEpistemicNotice(topic);
  const baseDescription=scoped.scope.type==='SOURCE_SPAN'?'יחידת לימוד תחומה לפי מיקום מדויק במקור, עד הגבול שבו מתחיל הנושא הבא.':'יחידת לימוד מרכזית. המידע והכרטיס נבנים רק מיחידות ידע שנמצאות בסעיפים שנצפו ושויכו ישירות לנושא.';
  return{ok:true,id:topic.id,kind:'TOPIC',label:topic.label,domainId:topic.domainId,domainLabel:domain?.label||'',parentTopicLabel:null,description:notice?`${baseDescription} ${notice}`:baseDescription,epistemicNotice:notice,learningUnit:topicLearningUnit(topic,hierarchy),learningUnitScope:{type:scoped.scope.type,sourceFile:scoped.scope.sourceFile||null,beforeSection:scoped.scope.beforeSection||null},keyPoints,relatedConcepts:[],sources,card:buildLearnerCard(topic.label,keyPoints,sources,topic.id),policy:{summaryMode:'extractive-bounded',canonicalTruthInvented:false,relationsRequireReview:true,sourceOnlyFallback:false,textKeywordFallback:false,learningSequenceSeparateFromHierarchy:true,topicEpistemicFramesApplied:true,canonicalAtomTypesUnchanged:true}};
 }
 if(String(nodeId).startsWith('subtopic:')){
  const entry=subtopics.find(item=>item.id===nodeId);if(!entry)return null;const topic=entry.parentTopic,domain=LIBRARY_DOMAINS.find(item=>item.id===topic.domainId);
  const rows=await candidateRows(db,{sections:entry.sections,sourceTitles:entry.sourceFiles}),rawKeyPoints=selectKeyPoints(rows),sources=sourceViews(rows),baseCard=buildExtractiveCard(entry.label,rawKeyPoints,sources,entry.id),framed=frameSubtopicForLearner(entry,rawKeyPoints,baseCard);
  const baseDescription=`המידע כאן מוגבל ליחידות הידע שנמצאו תחת הסעיפים המקוריים ששויכו ל„${entry.label}”.`;
  return{ok:true,id:entry.id,kind:'SUBTOPIC',label:entry.label,domainId:topic.domainId,domainLabel:domain?.label||'',parentTopicLabel:topic.label,description:framed.epistemicNotice?`${baseDescription} ${framed.epistemicNotice}`:baseDescription,epistemicFrame:framed.epistemicFrame,epistemicNotice:framed.epistemicNotice,learningUnit:subtopicLearningUnit(entry,topic),keyPoints:framed.keyPoints,relatedConcepts:[],sources,card:framed.card,policy:{summaryMode:'extractive-bounded',canonicalTruthInvented:false,contextualGraphNeighborsHidden:true,relationsRequireReview:true,sourceOnlyFallback:false,textKeywordFallback:false,learnerEpistemicFrame:framed.epistemicFrame,canonicalAtomTypesUnchanged:true}};
 }
 const legacyNode=(map.nodes||[]).find(item=>item.id===nodeId&&item.kind==='SECTION_TOPIC');if(!legacyNode)return null;
 const domain=domainForSourceFiles(legacyNode.sourceFiles||[]),rows=await candidateRows(db,{sections:rawSections(legacyNode),sourceTitles:legacyNode.sourceFiles||[]}),keyPoints=selectKeyPoints(rows),sources=sourceViews(rows);
 return{ok:true,id:legacyNode.id,kind:'SECTION_TOPIC',label:legacyNode.label,domainId:domain?.id||null,domainLabel:domain?.label||'נושא שעדיין לא סווג',parentTopicLabel:null,description:'תצוגת תאימות לכותרת מקור ישנה. היא אינה מגדירה יותר את ההיררכיה הראשית של הספרייה.',learningUnit:{level:'LEGACY',goal:`לעיין ביחידות הידע של ${legacyNode.label}.`,whyNow:'תצוגה ישנה ללא מיקום מאושר במסלול הלמידה.',position:null,total:null,previous:null,next:null,sequenceBasis:'UNRESOLVED',sequenceIsHierarchy:false},keyPoints,relatedConcepts:[],sources,card:buildExtractiveCard(legacyNode.label,keyPoints,sources,legacyNode.id),policy:{summaryMode:'extractive-bounded',contextualGraphNeighborsHidden:true,relationsRequireReview:true,canonicalTruthInvented:false,sourceOnlyFallback:false,textKeywordFallback:false}};
}
