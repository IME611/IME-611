import{buildEmergentCorpusMapPreview}from'../map/emergent-corpus-map.service.js';

const normalize=value=>String(value||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLocaleLowerCase('he-IL');
const compact=value=>String(value||'').replace(/\s+/g,' ').trim();

export const LIBRARY_DOMAINS=[
 {id:'journey-question',label:'המסע והשאלה',description:'נקודת המוצא: מי אני, למה יצאתי לחקירה הזאת, ואילו שאלות הובילו אליה.',source:/מי_אני_פרק1/i},
 {id:'human-body',label:'הגוף ומערכות האדם',description:'המבנה הפיזי, מערכות הגוף והאופן שבו הגוף פועל כמערכת אחת.',source:/(הכלי_החיצוני|הפלא_ההנדסי|הגוף_כתדר)/i},
 {id:'brain-consciousness',label:'המוח, מערכת העצבים והתודעה',description:'המוח, מערכת ההפעלה הפנימית, גלי מוח, נוירופלסטיות ונושאים הקשורים לתודעה.',source:/(מערכת_ההפעלה|המוח_המפורט|גלי_המוח|בלוטת_האצטרובל|נוירופלסטיות)/i},
 {id:'frequency-sound',label:'תדרים, מוזיקה וצליל',description:'תדר, מוזיקה, צליל וההשפעות המתוארות במקורות.',source:/תדרים_מוזיקה_וצליל/i},
 {id:'identity-emotion',label:'זהות, אמונות ורגשות',description:'אמונות, רגשות וזהות והאופן שבו הם משתלבים בתפיסה ובהתנהגות.',source:/(זהויות_ואמונות|רגשות_כמידע)/i},
 {id:'human-world',label:'האדם והעולם',description:'המפגש בין האדם למערכת שמחוץ לו: מציאות, סביבה, השפעות וחוקים כפי שהם מתוארים במקורות.',source:/(יצירת_מציאות|חוקי_היקום)/i},
 {id:'meaning-integration',label:'מטרות, משמעות ואינטגרציה',description:'יעדים, חזון, משמעות, קושי וחיבור התובנות לכדי תמונה רחבה יותר.',source:/(יעדים_וחזון|סבל_קושי_ומשמעות|חיבור_הכל|מי_אני_תשובה)/i},
];

const topicScore=node=>(Number(node.contextAtomCount)||0)*4+(Number(node.sourceCount)||0)*2+(Number(node.candidateCount)||0);

export function domainForSourceFiles(sourceFiles=[]){
 let winner=null,winnerCount=0;
 for(const domain of LIBRARY_DOMAINS){const count=sourceFiles.filter(file=>domain.source.test(String(file))).length;if(count>winnerCount){winner=domain;winnerCount=count}}
 return winner;
}

export function buildLibraryHierarchyFromMap(map){
 const buckets=new Map(LIBRARY_DOMAINS.map(domain=>[domain.id,[]])),unassigned=[];
 for(const topic of(map?.nodes||[]).filter(node=>node.kind==='SECTION_TOPIC')){
  const domain=domainForSourceFiles(topic.sourceFiles||[]),view={id:topic.id,label:topic.label,sourceCount:topic.sourceCount,unitCount:topic.contextAtomCount||topic.candidateCount||0,sourceFiles:topic.sourceFiles||[]};
  if(domain)buckets.get(domain.id).push(view);else unassigned.push(view);
 }
 const sort=(a,b)=>topicScore({contextAtomCount:b.unitCount,sourceCount:b.sourceCount})-topicScore({contextAtomCount:a.unitCount,sourceCount:a.sourceCount})||a.label.localeCompare(b.label,'he');
 const domains=LIBRARY_DOMAINS.map(domain=>({id:domain.id,label:domain.label,description:domain.description,topics:buckets.get(domain.id).sort(sort)})).filter(domain=>domain.topics.length);
 return{domains,unassigned:unassigned.sort(sort)};
}

const priority={DEFINITION:0,CLAIM:1,MODEL:2,CREATOR_INSIGHT:3,WORLDVIEW_CLAIM:4,PRACTICE:5,TENSION:6,REFERENCE:7,EXAMPLE:8,QUESTION:9,CONCEPT:10,EDITORIAL_NOTE:99};
function selectKeyPoints(rows,limit=7){const seen=new Set();return rows.filter(row=>row.atomType!=='EDITORIAL_NOTE'&&!row.excludeFromKnowledge).sort((a,b)=>(priority[a.atomType]??50)-(priority[b.atomType]??50)||Number(b.confidence)-Number(a.confidence)||Number(a.sourceStart)-Number(b.sourceStart)).filter(row=>{const key=normalize(row.text);if(key.length<20||seen.has(key))return false;seen.add(key);return true}).slice(0,limit).map(row=>({id:row.id,type:row.atomType,claimType:row.claimType||null,text:compact(row.text),sourceLabel:row.sourceTitle,confidence:Number(row.confidence)}))}

export function buildExtractiveCard(label,keyPoints,sources,nodeId){const summary=keyPoints.slice(0,3).map(point=>point.text).join(' ');return{id:`knowledge-card:${nodeId}:v1`,title:label,summary:summary||`הנושא ${label} קיים במאגר ומבוסס על ${sources.length} מקורות שמורים.`,sourceLabel:sources.map(source=>source.title).slice(0,4).join(' · '),provenanceLabel:'Knowledge Card v1 · סיכום חילוצי המבוסס על יחידות ידע ומקורות שמורים'}}

async function candidateRows(db,{section=null,sourceTitles=[]}={}){const params=[],where=[`c.exclude_from_knowledge=FALSE`];if(section){params.push(section);where.push(`c.metadata->>'section'=$${params.length}`)}if(sourceTitles.length){params.push(sourceTitles);where.push(`s.title=ANY($${params.length}::text[])`)}const{rows}=await db.query(`SELECT c.id,c.atom_type::text AS "atomType",c.claim_type::text AS "claimType",c.candidate_text AS text,c.confidence,c.source_start AS "sourceStart",c.exclude_from_knowledge AS "excludeFromKnowledge",s.id AS "sourceId",s.title AS "sourceTitle" FROM extraction_candidates c JOIN sources s ON s.id=c.source_id WHERE ${where.join(' AND ')} ORDER BY c.confidence DESC,c.source_start LIMIT 120`,params);return rows}
function sourceViews(rows,extra=[]){const map=new Map();for(const source of extra)map.set(source.title,{id:source.id||null,title:source.title});for(const row of rows)map.set(row.sourceTitle,{id:row.sourceId,title:row.sourceTitle});return[...map.values()]}
function membershipConcepts(map,nodeId){const byId=new Map((map.nodes||[]).map(node=>[node.id,node]));return(map.edges||[]).filter(edge=>(edge.from===nodeId||edge.to===nodeId)&&Number(edge.signals?.SECTION_MEMBERSHIP||0)>0).map(edge=>byId.get(edge.from===nodeId?edge.to:edge.from)).filter(node=>node?.kind==='CONCEPT').sort((a,b)=>(b.sourceCount||0)-(a.sourceCount||0)||a.label.localeCompare(b.label,'he')).slice(0,16).map(node=>({id:node.id,label:node.label,sourceCount:node.sourceCount}))}

async function mapForLibrary(db){return buildEmergentCorpusMapPreview(db,{communityLimit:1,nodeLimit:500,edgeLimit:1000})}
export async function buildContentLibraryIndex(db){const map=await mapForLibrary(db),hierarchy=buildLibraryHierarchyFromMap(map);return{ok:true,version:'content-library-v1',summary:{domains:hierarchy.domains.length,topics:hierarchy.domains.reduce((sum,domain)=>sum+domain.topics.length,0),unassignedTopics:hierarchy.unassigned.length},domains:hierarchy.domains,unassignedTopics:hierarchy.unassigned,policy:{hierarchyUsesGraphEdges:false,relatedIsNotHierarchy:true,sourceFilesAreRoutingEvidenceNotLearningOrder:true,fixedChapterCount:false}}}

export async function buildContentLibraryDetail(db,nodeId){
 const map=await mapForLibrary(db),hierarchy=buildLibraryHierarchyFromMap(map);
 if(String(nodeId).startsWith('domain:')){
  const id=String(nodeId).slice(7),domain=hierarchy.domains.find(item=>item.id===id);if(!domain)return null;
  const sourceTitles=[...new Set(domain.topics.flatMap(topic=>topic.sourceFiles))],rows=await candidateRows(db,{sourceTitles}),keyPoints=selectKeyPoints(rows),sources=sourceViews(rows,sourceTitles.map(title=>({title})));
  return{ok:true,id:`domain:${domain.id}`,kind:'DOMAIN',label:domain.label,domainId:domain.id,domainLabel:domain.label,description:domain.description,keyPoints,relatedConcepts:[],sources,card:buildExtractiveCard(domain.label,keyPoints,sources,`domain:${domain.id}`),policy:{summaryMode:'extractive',canonicalTruthInvented:false}};
 }
 const node=(map.nodes||[]).find(item=>item.id===nodeId&&item.kind==='SECTION_TOPIC');if(!node)return null;
 const domain=domainForSourceFiles(node.sourceFiles||[]),rows=await candidateRows(db,{section:node.label,sourceTitles:node.sourceFiles||[]}),keyPoints=selectKeyPoints(rows),sources=sourceViews(rows,(node.sourceFiles||[]).map(title=>({title})));
 return{ok:true,id:node.id,kind:'SECTION_TOPIC',label:node.label,domainId:domain?.id||null,domainLabel:domain?.label||'נושא שעדיין לא סווג',description:'המידע המוצג כאן נלקח מיחידות הידע שנמצאו תחת הכותרת הזאת במקורות השמורים.',keyPoints,relatedConcepts:membershipConcepts(map,node.id),sources,card:buildExtractiveCard(node.label,keyPoints,sources,node.id),policy:{summaryMode:'extractive',membershipConceptsAreRelatedNotChildren:true,canonicalTruthInvented:false}};
}
