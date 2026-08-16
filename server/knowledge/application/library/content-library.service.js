import{buildEmergentCorpusMapPreview}from'../map/emergent-corpus-map.service.js';
import{LIBRARY_DOMAINS,LIBRARY_TOPICS,canonicalSubtopic,normalizeTaxonomyLabel,topicForSectionNode,topicForSourceFile}from'./content-taxonomy.js';

const compact=value=>String(value||'').replace(/\s+/g,' ').trim();
const unique=values=>[...new Set(values.filter(Boolean))];
const rawSections=node=>(node.sections||[]).map(value=>{const parts=String(value).split('::');return parts.length>1?parts.slice(1).join('::'):String(value)}).filter(Boolean);
const nodeScore=node=>(Number(node.contextAtomCount)||0)*4+(Number(node.sourceCount)||0)*2+(Number(node.candidateCount)||0);

const TOPIC_SOURCE_SPANS={
 'journey-origin':{type:'SOURCE_SPAN',sourceFile:'מי_אני_פרק1_v6.docx',startAt:0,beforeSection:'אני פנימה — הגוף כמערכת',reason:'פתיחת המסע נמצאת לפני כותרת הגוף הראשונה, ולכן היא תחומה לפי מיקום במקור ולא לפי מילת מפתח.'},
};
const TOPIC_OVERVIEW_ANCHORS={
 'body-system':'body-overview',
 'external-environment':'environment-overview',
 'brain-operating-system':'operating-system',
 'pineal-gland':'pineal-overview',
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
const overviewPriority={CLAIM:0,MODEL:1,CREATOR_INSIGHT:2,DEFINITION:3,WORLDVIEW_CLAIM:4,TENSION:5,PRACTICE:6,REFERENCE:7,EXAMPLE:8,QUESTION:9,CONCEPT:10,EDITORIAL_NOTE:99};
function usableRow(row){return row&&row.atomType!=='EDITORIAL_NOTE'&&!row.excludeFromKnowledge&&normalizeTaxonomyLabel(row.text).length>=20}
function selectKeyPoints(rows,limit=7,{sourceOrder=false}={}){const seen=new Set();return rows.filter(usableRow).sort((a,b)=>sourceOrder?Number(a.sourceStart)-Number(b.sourceStart):(priority[a.atomType]??50)-(priority[b.atomType]??50)||Number(b.confidence)-Number(a.confidence)||Number(a.sourceStart)-Number(b.sourceStart)).filter(row=>{const key=normalizeTaxonomyLabel(row.text);if(seen.has(key))return false;seen.add(key);return true}).slice(0,limit).map(row=>({id:row.id,type:row.atomType,claimType:row.claimType||null,text:compact(row.text),sourceLabel:row.sourceTitle,confidence:Number(row.confidence)}))}
function bestOverviewRow(rows){return[...(rows||[])].filter(usableRow).sort((a,b)=>(overviewPriority[a.atomType]??50)-(overviewPriority[b.atomType]??50)||Number(b.confidence)-Number(a.confidence)||Number(a.sourceStart)-Number(b.sourceStart))[0]||null}
function shortExtract(value,max=520){const text=compact(value);if(text.length<=max)return text;const slice=text.slice(0,max+1),cut=slice.lastIndexOf(' ');return`${slice.slice(0,cut>max*.75?cut:max).trim()}…`}
export function buildExtractiveCard(label,keyPoints,sources,nodeId){const summary=shortExtract(keyPoints.slice(0,2).map(point=>point.text).join(' '));return{id:`knowledge-card:${nodeId}:v3`,title:label,summary:summary||`עדיין אין מספיק יחידות ידע ממוקדות כדי לסכם את ${label} בלי לערבב תוכן מנושאים אחרים.`,sourceLabel:sources.map(source=>source.title).slice(0,4).join(' · '),provenanceLabel:'Knowledge Card v3 · סיכום חילוצי מתוך סקירת יחידת הלימוד'}}

async function candidateRows(db,{sections=[],sourceTitles=[],limit=240}={}){const params=[],where=[`c.exclude_from_knowledge=FALSE`];if(sections.length){params.push(sections);where.push(`c.metadata->>'section'=ANY($${params.length}::text[])`)}if(sourceTitles.length){params.push(sourceTitles);where.push(`COALESCE(s.metadata->>'sourceFile',s.title)=ANY($${params.length}::text[])`)}params.push(Math.max(20,Math.min(500,Number(limit)||240)));const{rows}=await db.query(`SELECT c.id,c.atom_type::text AS "atomType",c.claim_type::text AS "claimType",c.candidate_text AS text,c.confidence,c.source_start AS "sourceStart",c.source_end AS "sourceEnd",c.exclude_from_knowledge AS "excludeFromKnowledge",c.metadata->>'section' AS section,s.id AS "sourceId",COALESCE(s.metadata->>'sourceFile',s.title) AS "sourceTitle" FROM extraction_candidates c JOIN sources s ON s.id=c.source_id WHERE ${where.join(' AND ')} ORDER BY c.source_start,c.confidence DESC LIMIT $${params.length}`,params);return rows}
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

function rowsForSubtopic(rows,subtopic){return selectTopicScopedRows(rows,{sections:subtopic?.sections||[]})}
function representativeRowsFromSubtopics(topic,rows,{excludeSubtopicId=null,limit=5}={}){
 const out=[],seen=new Set();
 for(const subtopic of topic?.subtopics||[]){
  if(subtopic.id===excludeSubtopicId)continue;
  const row=bestOverviewRow(rowsForSubtopic(rows,subtopic));
  if(row&&!seen.has(row.id)){seen.add(row.id);out.push(row)}
  if(out.length>=limit)break;
 }
 return out;
}

export function selectParentTopicOverviewRows(topic,rows,{scopeType='OBSERVED_SECTIONS'}={}){
 const allRows=rows||[];
 if(scopeType==='SOURCE_SPAN')return{basis:'SOURCE_SPAN',anchorSubtopicId:null,primaryRows:allRows,supportingRows:[]};
 const anchorKey=TOPIC_OVERVIEW_ANCHORS[topic?.key]||null,anchor=anchorKey?(topic?.subtopics||[]).find(item=>item.id.endsWith(`:${anchorKey}`)):null;
 if(anchor){
  const primaryRows=rowsForSubtopic(allRows,anchor);
  if(primaryRows.length)return{basis:'ANCHOR_SUBTOPIC',anchorSubtopicId:anchor.id,primaryRows,supportingRows:representativeRowsFromSubtopics(topic,allRows,{excludeSubtopicId:anchor.id,limit:4})};
 }
 const representatives=representativeRowsFromSubtopics(topic,allRows,{limit:6});
 return{basis:'DIVERSIFIED_SUBTOPICS',anchorSubtopicId:null,primaryRows:representatives.length?representatives:allRows.slice(0,6),supportingRows:[]};
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
 for(const topic of domain.topics){const scoped=await scopedRowsForTopic(db,topic);for(const row of scoped.rows)selected.set(row.id,row)}
 return[...selected.values()];
}
function orderedTopics(hierarchy){return allTopics(hierarchy).sort((a,b)=>a.order-b.order||a.label.localeCompare(b.label,'he'))}
function navItem(topic){if(!topic)return null;return{id:topic.id,label:topic.label,domainId:topic.domainId}}
function topicLearningUnit(topic,hierarchy){const ordered=orderedTopics(hierarchy),index=ordered.findIndex(item=>item.id===topic.id),previous=index>0?ordered[index-1]:null,next=index>=0&&index<ordered.length-1?ordered[index+1]:null,domain=LIBRARY_DOMAINS.find(item=>item.id===topic.domainId);return{level:'TOPIC',goal:`להבין את ${topic.label} בתוך התמונה הרחבה של ${domain?.label||'המסע'}, באמצעות סקירה שממקמת את המערכת לפני הצלילה לפרטים.`,whyNow:previous?`הנושא מגיע אחרי „${previous.label}” כחלק ממסלול למידה מדורג${next?`, ולפני המעבר ל„${next.label}”`:''}.`:`זו נקודת הפתיחה של מסלול הלמידה: מתחילים בשאלות שמניעות את החקירה, ורק אחר כך עוברים למערכות ולפרטים.`,position:index>=0?index+1:null,total:ordered.length,previous:navItem(previous),next:navItem(next),sequenceBasis:'CURATED_PEDAGOGIC_V0_1',sequenceIsHierarchy:false}}
function subtopicLearningUnit(entry,topic){return{level:'SUBTOPIC',goal:`להבין את ${entry.label} כחלק ממוקד בתוך הנושא „${topic.label}”.`,whyNow:`זהו פירוט של „${topic.label}”. הוא שייך לתוכן של הנושא, אך אינו יוצר לבדו סדר מחייב מול תתי־נושאים אחרים.`,position:null,total:topic.subtopics.length,previous:null,next:null,sequenceBasis:'PARENT_TOPIC_CONTEXT',sequenceIsHierarchy:false}}
function domainLearningUnit(domain){return{level:'DOMAIN',goal:`לבנות תמונה של ${domain.label} דרך הנושאים המרכזיים שבתוכו.`,whyNow:'התחום הוא מיקום במפת הידע. סדר הלמידה נקבע ברמת יחידות הלימוד ואינו נגזר מעצם ההיררכיה.',position:null,total:domain.topics.length,previous:null,next:null,sequenceBasis:'KNOWLEDGE_MAP_LOCATION',sequenceIsHierarchy:false}}
function mergePoints(primary,supporting,limit=7){const seen=new Set(),out=[];for(const point of[...primary,...supporting])if(!seen.has(point.id)){seen.add(point.id);out.push(point);if(out.length>=limit)break}return out}

async function mapForLibrary(db){return buildEmergentCorpusMapPreview(db,{communityLimit:1,nodeLimit:500,edgeLimit:1000})}
export async function buildContentLibraryIndex(db){
 const map=await mapForLibrary(db),hierarchy=buildLibraryHierarchyFromMap(map),topics=allTopics(hierarchy),subtopics=allSubtopics(hierarchy);
 return{ok:true,version:'content-library-v3.3',summary:{domains:hierarchy.domains.length,topics:topics.length,subtopics:subtopics.length,unassignedSections:hierarchy.unassigned.length,unassignedTopics:hierarchy.unassigned.length},domains:hierarchy.domains.map(domain=>({...domain,topics:domain.topics.map(({sectionNodeIds,sections,...topic})=>topic)})),unassignedTopics:hierarchy.unassigned,policy:{levels:['DOMAIN','TOPIC','SUBTOPIC'],hierarchyUsesGraphEdges:false,relatedIsNotHierarchy:true,seedFilesAreEvidenceNotTopics:true,sourceFilesDefineTopicBuckets:false,topicTextScopeModes:['OBSERVED_SECTIONS','SOURCE_SPAN'],parentTopicOverviewModes:['ANCHOR_SUBTOPIC','DIVERSIFIED_SUBTOPICS','SOURCE_SPAN'],textKeywordFallback:false,sourceOnlyFallbackForTopicText:false,knowledgeMapSeparateFromLearningSequence:true,parentTopicOverviewSeparateFromSubtopicDepth:true,learningUnitCardUsesSameOverviewEvidence:true,noisySectionHeadingsSuppressed:true,fixedChapterCount:false}};
}

export async function buildContentLibraryDetail(db,nodeId){
 const map=await mapForLibrary(db),hierarchy=buildLibraryHierarchyFromMap(map),topics=allTopics(hierarchy),subtopics=allSubtopics(hierarchy);
 if(String(nodeId).startsWith('domain:')){
  const id=String(nodeId).slice(7),domain=hierarchy.domains.find(item=>item.id===id);if(!domain)return null;
  const rows=await scopedRowsForDomain(db,domain),keyPoints=selectKeyPoints(rows),sources=sourceViews(rows);
  return{ok:true,id:`domain:${domain.id}`,kind:'DOMAIN',label:domain.label,domainId:domain.id,domainLabel:domain.label,parentTopicLabel:null,description:domain.description,learningUnit:domainLearningUnit(domain),keyPoints,relatedConcepts:[],sources,card:buildExtractiveCard(domain.label,keyPoints,sources,`domain:${domain.id}`),policy:{summaryMode:'extractive-bounded',canonicalTruthInvented:false,relationsRequireReview:true,sourceOnlyFallback:false,textKeywordFallback:false}};
 }
 if(String(nodeId).startsWith('topic:')){
  const topic=topics.find(item=>item.id===nodeId);if(!topic)return null;const domain=LIBRARY_DOMAINS.find(item=>item.id===topic.domainId),scoped=await scopedRowsForTopic(db,topic),overview=selectParentTopicOverviewRows(topic,scoped.rows,{scopeType:scoped.scope.type});
  const primaryPoints=selectKeyPoints(overview.primaryRows,3,{sourceOrder:scoped.scope.type==='SOURCE_SPAN'}),supportingPoints=selectKeyPoints(overview.supportingRows,4),keyPoints=mergePoints(primaryPoints,supportingPoints,7),cardPoints=primaryPoints.length?primaryPoints:keyPoints,sources=sourceViews([...overview.primaryRows,...overview.supportingRows]);
  const overviewDescription=overview.basis==='ANCHOR_SUBTOPIC'?'סקירת נושא גדול: מתחילים מעוגן הסקירה של הנושא, ורק אחר כך מציגים נקודות מייצגות מתתי־נושאים נוספים.':overview.basis==='DIVERSIFIED_SUBTOPICS'?'סקירת נושא גדול: נבחרת נקודה מייצגת מכמה תתי־נושאים שונים כדי לתת תמונה רחבה לפני הצלילה לפרטים.':'יחידת לימוד תחומה לפי מיקום מדויק במקור, עד הגבול שבו מתחיל הנושא הבא.';
  return{ok:true,id:topic.id,kind:'TOPIC',label:topic.label,domainId:topic.domainId,domainLabel:domain?.label||'',parentTopicLabel:null,description:overviewDescription,learningUnit:topicLearningUnit(topic,hierarchy),learningUnitScope:{type:scoped.scope.type,sourceFile:scoped.scope.sourceFile||null,beforeSection:scoped.scope.beforeSection||null},overview:{basis:overview.basis,anchorSubtopicId:overview.anchorSubtopicId},keyPoints,relatedConcepts:[],sources,card:buildExtractiveCard(topic.label,cardPoints,sourceViews(overview.primaryRows),topic.id),policy:{summaryMode:'extractive-parent-overview',canonicalTruthInvented:false,relationsRequireReview:true,sourceOnlyFallback:false,textKeywordFallback:false,learningSequenceSeparateFromHierarchy:true,parentOverviewSeparateFromSubtopicDepth:true}};
 }
 if(String(nodeId).startsWith('subtopic:')){
  const entry=subtopics.find(item=>item.id===nodeId);if(!entry)return null;const topic=entry.parentTopic,domain=LIBRARY_DOMAINS.find(item=>item.id===topic.domainId);
  const rows=await candidateRows(db,{sections:entry.sections,sourceTitles:entry.sourceFiles}),keyPoints=selectKeyPoints(rows),sources=sourceViews(rows);
  return{ok:true,id:entry.id,kind:'SUBTOPIC',label:entry.label,domainId:topic.domainId,domainLabel:domain?.label||'',parentTopicLabel:topic.label,description:`עומק של תת־נושא: המידע כאן מוגבל ליחידות הידע שנמצאו תחת הסעיפים המקוריים ששויכו ל„${entry.label}”.`,learningUnit:subtopicLearningUnit(entry,topic),keyPoints,relatedConcepts:[],sources,card:buildExtractiveCard(entry.label,keyPoints,sources,entry.id),policy:{summaryMode:'extractive-subtopic-depth',canonicalTruthInvented:false,contextualGraphNeighborsHidden:true,relationsRequireReview:true,sourceOnlyFallback:false,textKeywordFallback:false,parentOverviewSeparateFromSubtopicDepth:true}};
 }
 const legacyNode=(map.nodes||[]).find(item=>item.id===nodeId&&item.kind==='SECTION_TOPIC');if(!legacyNode)return null;
 const domain=domainForSourceFiles(legacyNode.sourceFiles||[]),rows=await candidateRows(db,{sections:rawSections(legacyNode),sourceTitles:legacyNode.sourceFiles||[]}),keyPoints=selectKeyPoints(rows),sources=sourceViews(rows);
 return{ok:true,id:legacyNode.id,kind:'SECTION_TOPIC',label:legacyNode.label,domainId:domain?.id||null,domainLabel:domain?.label||'נושא שעדיין לא סווג',parentTopicLabel:null,description:'תצוגת תאימות לכותרת מקור ישנה. היא אינה מגדירה יותר את ההיררכיה הראשית של הספרייה.',learningUnit:{level:'LEGACY',goal:`לעיין ביחידות הידע של ${legacyNode.label}.`,whyNow:'תצוגה ישנה ללא מיקום מאושר במסלול הלמידה.',position:null,total:null,previous:null,next:null,sequenceBasis:'UNRESOLVED',sequenceIsHierarchy:false},keyPoints,relatedConcepts:[],sources,card:buildExtractiveCard(legacyNode.label,keyPoints,sources,legacyNode.id),policy:{summaryMode:'extractive-bounded',contextualGraphNeighborsHidden:true,relationsRequireReview:true,canonicalTruthInvented:false,sourceOnlyFallback:false,textKeywordFallback:false}};
}
