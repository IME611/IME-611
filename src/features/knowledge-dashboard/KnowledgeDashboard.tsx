import React,{useEffect,useMemo,useRef,useState}from'react';
import{CrystalButton}from'../crystals/CrystalButton';
import type{CrystalRecord}from'../crystals/model/crystal.repository';

type LibrarySubtopic={id:string;label:string;sourceCount:number;unitCount:number;sourceFiles:string[]};
type LibraryTopic={id:string;key:string;label:string;sourceCount:number;unitCount:number;sourceFiles:string[];subtopics:LibrarySubtopic[]};
type LibraryDomain={id:string;label:string;description:string;topics:LibraryTopic[]};
type LibraryIndex={ok:boolean;version:string;summary:{domains:number;topics:number;subtopics:number;unassignedSections:number};domains:LibraryDomain[];unassignedTopics:LibrarySubtopic[]};
type KeyPoint={id:string;type:string;claimType:string|null;text:string;sourceLabel:string;confidence:number};
type TopicDetail={ok:boolean;id:string;kind:'DOMAIN'|'TOPIC'|'SUBTOPIC'|'SECTION_TOPIC';label:string;domainId:string|null;domainLabel:string;parentTopicLabel:string|null;description:string;keyPoints:KeyPoint[];relatedConcepts:{id:string;label:string;sourceCount:number}[];sources:{id:string|null;title:string}[];card:{id:string;title:string;summary:string;sourceLabel:string;provenanceLabel:string}};
type Props={query:string;onQueryChange:(value:string)=>void;onAdd:()=>void};
type IndexState={status:'loading'}|{status:'error';message:string}|{status:'ready';data:LibraryIndex};
type DetailState={status:'idle'}|{status:'loading'}|{status:'error';message:string}|{status:'ready';data:TopicDetail};

const normalize=(value:string)=>value.toLocaleLowerCase('he').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const matches=(value:string,term:string)=>!term||normalize(value).includes(term);
const pointLabel=(type:string)=>({DEFINITION:'הגדרה',CLAIM:'רעיון',MODEL:'מודל',CREATOR_INSIGHT:'תובנה',WORLDVIEW_CLAIM:'תפיסת עולם',PRACTICE:'כלי',TENSION:'שאלה / מתח',REFERENCE:'מקור'} as Record<string,string>)[type]||'יחידת ידע';
const kindLabel=(kind:TopicDetail['kind'])=>kind==='DOMAIN'?'תחום':kind==='TOPIC'?'נושא מרכזי':'תת־נושא';

export function KnowledgeDashboard({query,onQueryChange,onAdd}:Props){
 const[indexState,setIndexState]=useState<IndexState>({status:'loading'}),[detailState,setDetailState]=useState<DetailState>({status:'idle'});
 const[selectedId,setSelectedId]=useState<string|null>(null),[expanded,setExpanded]=useState<Set<string>>(()=>new Set());
 const browseRef=useRef<HTMLElement|null>(null),term=normalize(query);
 useEffect(()=>{const controller=new AbortController();fetch('/api/corpus-map?view=library',{signal:controller.signal}).then(async response=>{const payload=await response.json().catch(()=>null);if(!response.ok||!payload?.ok)throw new Error(payload?.error||'ספריית התוכן אינה זמינה');setIndexState({status:'ready',data:payload})}).catch(error=>{if(error?.name!=='AbortError')setIndexState({status:'error',message:error instanceof Error?error.message:'ספריית התוכן אינה זמינה'})});return()=>controller.abort()},[]);
 useEffect(()=>{if(!selectedId){setDetailState({status:'idle'});return}const controller=new AbortController();setDetailState({status:'loading'});fetch(`/api/corpus-map?view=library&nodeId=${encodeURIComponent(selectedId)}`,{signal:controller.signal}).then(async response=>{const payload=await response.json().catch(()=>null);if(!response.ok||!payload?.ok)throw new Error(payload?.error||'הנושא לא נטען');setDetailState({status:'ready',data:payload})}).catch(error=>{if(error?.name!=='AbortError')setDetailState({status:'error',message:error instanceof Error?error.message:'הנושא לא נטען'})});return()=>controller.abort()},[selectedId]);
 const index=indexState.status==='ready'?indexState.data:null;
 const groups=useMemo(()=>{if(!index)return[];return index.domains.map(domain=>{const domainMatch=matches(`${domain.label} ${domain.description}`,term);const topics=domain.topics.map(topic=>{const topicMatch=matches(`${topic.label} ${topic.sourceFiles.join(' ')}`,term),subtopics=(domainMatch||topicMatch)?topic.subtopics:topic.subtopics.filter(subtopic=>matches(`${subtopic.label} ${subtopic.sourceFiles.join(' ')}`,term));return{...topic,subtopics}}).filter(topic=>domainMatch||matches(`${topic.label} ${topic.sourceFiles.join(' ')}`,term)||topic.subtopics.length);return{...domain,topics}}).filter(domain=>matches(`${domain.label} ${domain.description}`,term)||domain.topics.length)},[index,term]);
 const moveTop=()=>requestAnimationFrame(()=>browseRef.current?.scrollIntoView({behavior:'smooth',block:'start'}));
 const openDetail=(id:string)=>{setSelectedId(id);moveTop()};
 const backToIndex=()=>{setSelectedId(null);moveTop()};
 const toggle=(id:string)=>setExpanded(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next});

 return <div className="knowledgeDashboard" dir="rtl">
  <header className="knowledgeHero"><div><span className="eyebrow">E.I.L / CONTENT LIBRARY</span><h1>ספריית התוכן</h1><p>הספרייה מחולקת עכשיו לשלוש שכבות ברורות: תחום, נושא מרכזי ותת־נושא. קשרים במפת הידע אינם יוצרים היררכיה אוטומטית.</p></div><button className="primary knowledgeAdd" type="button" onClick={onAdd}>＋ הוסף תוכן</button></header>
  {indexState.status==='loading'&&<section className="knowledgeState" aria-live="polite"><b>מסדר את ספריית התוכן…</b><span>בונה תחומים, נושאים ותתי־נושאים מתוך הקורפוס.</span></section>}
  {indexState.status==='error'&&<section className="knowledgeState error" role="alert"><b>ספריית התוכן לא נטענה.</b><span>{indexState.message}</span><button type="button" onClick={()=>location.reload()}>נסה שוב</button></section>}
  {index&&<>
   <section className="knowledgeStats" aria-label="מצב הספרייה"><article><strong>{index.summary.domains}</strong><span>תחומים</span></article><article><strong>{index.summary.topics}</strong><span>נושאים מרכזיים</span></article><article><strong>{index.summary.subtopics}</strong><span>תתי־נושאים</span></article></section>
   <section ref={browseRef} className="knowledgeBrowse" aria-labelledby="knowledge-browse-title">
    {!selectedId&&<>
     <div className="knowledgeBrowseHead"><span className="eyebrow">KNOWLEDGE HIERARCHY</span><h2 id="knowledge-browse-title">הנושאים</h2><p>פתח תחום כדי לראות את הנושאים המרכזיים שלו. כל נושא יכול להיפתח למידע שלו או להתרחב לתת־נושאים מדויקים יותר.</p></div>
     <label className="knowledgeSearch"><span>חיפוש בספרייה</span><input value={query} onChange={event=>onQueryChange(event.target.value)} placeholder="למשל: מוח, DMT, אמונות, גוף…"/></label>
     <div className="knowledgeTopicList">{groups.map(group=>{const domainKey=`domain:${group.id}`,isExpanded=term?true:expanded.has(domainKey);return <section key={group.id} className="knowledgeTopicGroup">
      <div className="knowledgeTopicRow"><button type="button" className="knowledgeTopicOpen" onClick={()=>openDetail(domainKey)}><span><small>תחום</small><strong>{group.label}</strong><em>{group.topics.length} נושאים מרכזיים</em></span></button><button type="button" className={isExpanded?'knowledgeTopicToggle open':'knowledgeTopicToggle'} onClick={()=>toggle(domainKey)} aria-expanded={isExpanded} aria-label={`${isExpanded?'סגור':'פתח'} את ${group.label}`}><span aria-hidden="true">⌄</span><small>{group.topics.length}</small></button></div>
      {isExpanded&&<div className="knowledgeCanonicalTopics" aria-label={`נושאים תחת ${group.label}`}>{group.topics.map(topic=>{const topicKey=topic.id,isTopicExpanded=term?true:expanded.has(topicKey);return <section key={topic.id} className="knowledgeCanonicalTopic">
       <div className="knowledgeCanonicalTopicRow"><button type="button" className="knowledgeCanonicalTopicOpen" onClick={()=>openDetail(topic.id)}><span><small>נושא</small><strong>{topic.label}</strong><em>{topic.subtopics.length} תתי־נושאים</em></span><b aria-hidden="true">←</b></button>{topic.subtopics.length>0&&<button type="button" className={isTopicExpanded?'knowledgeMiniToggle open':'knowledgeMiniToggle'} onClick={()=>toggle(topicKey)} aria-expanded={isTopicExpanded} aria-label={`${isTopicExpanded?'סגור':'פתח'} תתי־נושאים של ${topic.label}`}><span aria-hidden="true">⌄</span><small>{topic.subtopics.length}</small></button>}</div>
       {isTopicExpanded&&topic.subtopics.length>0&&<div className="knowledgeLeafSubtopics">{topic.subtopics.map(subtopic=><button key={subtopic.id} type="button" onClick={()=>openDetail(subtopic.id)}><span>{subtopic.label}</span><small>{subtopic.unitCount} יחידות ידע</small><b aria-hidden="true">←</b></button>)}</div>}
      </section>})}</div>}
     </section>})}</div>
     {!groups.length&&<div className="knowledgeEmpty"><b>לא נמצאה התאמה.</b><span>אפשר לבדוק תוכן חדש מול המאגר.</span><button className="primary" type="button" onClick={onAdd}>בדוק תוכן חדש</button></div>}
    </>}
    {selectedId&&<div className="knowledgeDetailInline">
     <div className="knowledgeDetailToolbar"><button type="button" className="knowledgeBack" onClick={backToIndex}>→ חזרה לנושאים</button>{detailState.status==='ready'&&<span>{detailState.data.parentTopicLabel?`${detailState.data.domainLabel} · ${detailState.data.parentTopicLabel}`:detailState.data.domainLabel}</span>}</div>
     {detailState.status==='loading'&&<div className="knowledgeDetailLoading"><b>פותח את הנושא…</b></div>}
     {detailState.status==='error'&&<div className="knowledgeState error"><b>הנושא לא נטען.</b><span>{detailState.message}</span></div>}
     {detailState.status==='ready'&&<TopicView detail={detailState.data}/>} 
    </div>}
   </section>
   <aside className="knowledgePolicy"><b>כלל היררכי:</b><span>תחום מכיל נושאים מרכזיים; נושא מכיל תתי־נושאים. ״קשור ל־״ הוא סוג קשר אחר לחלוטין ואינו יוצר ילד בהיררכיה. לכן DMT ומדיטציה יכולים להופיע באותו נושא מרכזי בלי שאחד יהיה תחת השני.</span></aside>
  </>}
 </div>;
}

function TopicView({detail}:{detail:TopicDetail}){
 const record:CrystalRecord={fragmentId:detail.card.id,conceptId:detail.id,topic:detail.domainLabel,subtopic:detail.kind==='DOMAIN'?undefined:detail.parentTopicLabel?`${detail.parentTopicLabel} / ${detail.label}`:detail.label,text:detail.card.summary,sourceLabel:detail.card.sourceLabel,provenanceLabel:detail.card.provenanceLabel,savedAt:new Date().toISOString()};
 return <div className="knowledgeTopicDetail">
  <header className="knowledgeDetailIntro"><span className="eyebrow">{kindLabel(detail.kind)}</span><h2>{detail.label}</h2><p>{detail.description}</p></header>
  <section className="knowledgeFacts"><h3>מה קיים במאגר על הנושא הזה?</h3>{detail.keyPoints.length?<div className="knowledgeFactList">{detail.keyPoints.map(point=><article key={point.id}><div><span>{pointLabel(point.type)}</span><small>{point.sourceLabel}</small></div><p>{point.text}</p></article>)}</div>:<p className="muted">עדיין אין מספיק יחידות ידע כדי להציג סיכום מהימן לנושא הזה.</p>}</section>
  {detail.relatedConcepts.length>0&&<section className="knowledgeRelated"><h3>קשרים מאושרים</h3><div>{detail.relatedConcepts.map(concept=><span key={concept.id}>{concept.label}</span>)}</div></section>}
  {detail.sources.length>0&&<section className="knowledgeSources"><h3>מקורות</h3><ul>{detail.sources.map(source=><li key={source.id||source.title}>{source.title}</li>)}</ul></section>}
  <section className="knowledgeSummaryCard"><div className="knowledgeSummaryHead"><div><span className="eyebrow">KNOWLEDGE CARD</span><h3>{detail.card.title}</h3></div><CrystalButton record={record}/></div><p>{detail.card.summary}</p><small>◆ שמירה כאן מוסיפה את הכרטיס ל״קריסטלים שלי״ · הסיכום מבוסס על יחידות הידע והמקורות השמורים.</small></section>
 </div>;
}
