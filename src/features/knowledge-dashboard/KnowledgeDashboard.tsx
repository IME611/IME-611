import React,{useEffect,useMemo,useRef,useState}from'react';
import{CrystalButton}from'../crystals/CrystalButton';
import{useLearningProgress}from'../journey/model/useLearningProgress';
import{journeyPath}from'../journey/model/journey-stage';
import type{CrystalRecord}from'../crystals/model/crystal.repository';

type LibrarySubtopic={id:string;label:string;sourceCount:number;unitCount:number;sourceFiles:string[]};
type LibraryTopic={id:string;key:string;label:string;sourceCount:number;unitCount:number;sourceFiles:string[];subtopics:LibrarySubtopic[]};
type LibraryDomain={id:string;label:string;description:string;topics:LibraryTopic[]};
type LibraryIndex={ok:boolean;version:string;summary:{domains:number;topics:number;subtopics:number;unassignedSections:number};domains:LibraryDomain[];unassignedTopics:LibrarySubtopic[]};
type KeyPoint={id:string;type:string;claimType:string|null;text:string;sourceLabel:string;confidence:number};
type LearningNav={id:string;label:string;domainId:string}|null;
type LearningUnit={level:string;goal:string;whyNow:string;position:number|null;total:number|null;previous:LearningNav;next:LearningNav;sequenceBasis:string;sequenceIsHierarchy:boolean};
type TopicDetail={ok:boolean;id:string;kind:'DOMAIN'|'TOPIC'|'SUBTOPIC'|'SECTION_TOPIC';label:string;domainId:string|null;domainLabel:string;parentTopicLabel:string|null;description:string;learningUnit:LearningUnit;keyPoints:KeyPoint[];relatedConcepts:{id:string;label:string;sourceCount:number}[];sources:{id:string|null;title:string}[];card:{id:string;title:string;summary:string;sourceLabel:string;provenanceLabel:string}};
type Props={query:string;onQueryChange:(value:string)=>void;onAdd:()=>void};
type IndexState={status:'loading'}|{status:'error';message:string}|{status:'ready';data:LibraryIndex};
type DetailState={status:'idle'}|{status:'loading'}|{status:'error';message:string}|{status:'ready';data:TopicDetail};

const LAYER_LABELS=['','שכבה א׳ — הכלי הפיזי','שכבה ב׳ — מערכת ההפעלה','שכבה ג׳ — האנרגיה','שכבה ד׳ — כלי השינוי','שכבה ה׳ — המשמעות'];
const LAYER_COLORS=['','#1E3A5F','#4A235A','#7D6608','#922B21','#1A5276'];
function layerOf(order:number){return order<=3?1:order<=6?2:order<=9?3:order<=13?4:5;}

const SPIRAL_OVERVIEW=[
  {layer:'א',color:'#1E3A5F',label:'הכלי הפיזי',chapters:'1–3'},
  {layer:'ב',color:'#4A235A',label:'מערכת ההפעלה',chapters:'4–6'},
  {layer:'ג',color:'#7D6608',label:'האנרגיה והתדר',chapters:'7–9'},
  {layer:'ד',color:'#922B21',label:'כלי השינוי',chapters:'10–13'},
  {layer:'ה',color:'#1A5276',label:'המשמעות',chapters:'14–18'},
];

function JourneyCards({onGoToJourney}:{onGoToJourney?:()=>void}){
  const learning=useLearningProgress(journeyPath);
  const{state}=learning;
  const done=state.completedStageIds.length;
  const total=journeyPath.stages.length;
  const pct=Math.round((done/total)*100);

  return(
    <section className="dashOverview" aria-label="מסע הלמידה"><div className="dashWelcome"><p className="dashWelcomeText">ברוך הבא ל-<strong>E.I.L</strong> — פלטפורמה שתוביל אותך למסע של מודעות כלפי עצמך וכלפי הסביבה, ותיתן לך כלים כדי להפוך לאדם שאתה רוצה להיות. מאחל לך שתהנה, תחכים ותהפוך לקריסטל הכי טוב שאתה יכול.</p></div>
      <div className="dashOverviewHeader">
        <div className="dashOverviewTitle">ההתקדמות שלי במסע</div>
        <div className="dashOverviewMeta">{done}/{total} פרקים · {pct}%</div>
      </div>
      <div className="dashOverviewBar">
        <div className="dashOverviewFill" style={{width:`${pct}%`}}/>
      </div>
      <div className="dashOverviewLayers">
        {SPIRAL_OVERVIEW.map(l=>{
          const layerDone=journeyPath.stages.filter(s=>{
            const n=s.order;
            const inLayer=l.layer==='א'?n<=3:l.layer==='ב'?n<=6:l.layer==='ג'?n<=9:l.layer==='ד'?n<=13:true;
            return inLayer&&state.completedStageIds.includes(s.id);
          }).length;
          const layerTotal=l.layer==='א'?3:l.layer==='ב'?3:l.layer==='ג'?3:l.layer==='ד'?4:5;
          const layerPct=Math.round((layerDone/layerTotal)*100);
          return(
            <div key={l.layer} className="dashLayer" onClick={onGoToJourney} style={{'--lc':l.color} as React.CSSProperties}>
              <div className="dashLayerDot" style={{background:l.color}}/>
              <div className="dashLayerInfo">
                <span className="dashLayerName">{l.label}</span>
                <span className="dashLayerChapters">פרקים {l.chapters}</span>
              </div>
              <div className="dashLayerBar">
                <div className="dashLayerFill" style={{width:`${layerPct}%`,background:l.color}}/>
              </div>
              <span className="dashLayerPct" style={{color:l.color}}>{layerPct}%</span>
            </div>
          );
        })}
      </div>
      {onGoToJourney&&<button className="dashStartBtn" onClick={onGoToJourney}>התחל את המסע ←</button>}
    </section>
  );
}

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
  <JourneyCards/>
  <header className="knowledgeHero"><div><span className="eyebrow">E.I.L / CONTENT LIBRARY</span><h1>ספריית התוכן</h1></div><button className="primary knowledgeAdd" type="button" onClick={onAdd}>＋ הוסף תוכן</button></header>
  {indexState.status==='loading'&&<section className="knowledgeState" aria-live="polite"><b>מסדר את ספריית התוכן…</b><span>בונה תחומים, נושאים ותתי־נושאים מתוך הקורפוס.</span></section>}
  {indexState.status==='error'&&<section className="knowledgeState error" role="alert"><b>ספריית התוכן לא נטענה.</b><span>{indexState.message}</span><button type="button" onClick={()=>location.reload()}>נסה שוב</button></section>}
  {index&&<>
   
   <section ref={browseRef} className="knowledgeBrowse" aria-label="נושאי המסע">
    {!selectedId&&<>
     <div className="knowledgeBrowseHead"><span className="eyebrow">KNOWLEDGE HIERARCHY</span><h2 id="knowledge-browse-title">הנושאים</h2></div>
     <label className="knowledgeSearch"><span>חיפוש בספרייה</span><input value={query} onChange={event=>onQueryChange(event.target.value)} placeholder="למשל: מוח, DMT, אמונות, גוף…"/></label>
     <div className="knowledgeTopicList">{groups.map(group=>{const domainKey=`domain:${group.id}`,isExpanded=term?true:expanded.has(domainKey);return <section key={group.id} className="knowledgeTopicGroup">
      <div className="knowledgeTopicRow"><button type="button" className="knowledgeTopicOpen" onClick={()=>toggle(domainKey)}><span><strong>{group.label}</strong></span></button><button type="button" className={isExpanded?'knowledgeTopicToggle open':'knowledgeTopicToggle'} onClick={()=>toggle(domainKey)} aria-expanded={isExpanded} aria-label={`${isExpanded?'סגור':'פתח'} את ${group.label}`}><span aria-hidden="true">⌄</span><small>{group.topics.length}</small></button></div>
      {isExpanded&&<div className="knowledgeCanonicalTopics" aria-label={`נושאים תחת ${group.label}`}>{group.topics.map(topic=>{const topicKey=topic.id,isTopicExpanded=term?true:expanded.has(topicKey);return <section key={topic.id} className="knowledgeCanonicalTopic">
       <div className="knowledgeCanonicalTopicRow"><button type="button" className="knowledgeCanonicalTopicOpen" onClick={()=>toggle(topicKey)}><span><strong>{topic.label}</strong></span><b className="knowledgeOpenArrow" onClick={(e)=>{e.stopPropagation();openDetail(topic.id)}} aria-hidden="true">←</b></button>{topic.subtopics.length>0&&<button type="button" className={isTopicExpanded?'knowledgeMiniToggle open':'knowledgeMiniToggle'} onClick={()=>toggle(topicKey)} aria-expanded={isTopicExpanded} aria-label={`${isTopicExpanded?'סגור':'פתח'} תתי־נושאים של ${topic.label}`}><span aria-hidden="true">⌄</span><small>{topic.subtopics.length}</small></button>}</div>
       {isTopicExpanded&&topic.subtopics.length>0&&<div className="knowledgeLeafSubtopics">{topic.subtopics.map(subtopic=><button key={subtopic.id} type="button" onClick={()=>openDetail(subtopic.id)}><span>{subtopic.label}</span><b aria-hidden="true">←</b></button>)}</div>}
      </section>})}</div>}
     </section>})}</div>
     {!groups.length&&<div className="knowledgeEmpty"><b>לא נמצאה התאמה.</b><span>אפשר לבדוק תוכן חדש מול המאגר.</span><button className="primary" type="button" onClick={onAdd}>בדוק תוכן חדש</button></div>}
    </>}
    {selectedId&&<div className="knowledgeDetailInline">
     <div className="knowledgeDetailToolbar"><button type="button" className="knowledgeBack" onClick={backToIndex}>→ חזרה לנושאים</button>{detailState.status==='ready'&&<span>{detailState.data.parentTopicLabel?`${detailState.data.domainLabel} · ${detailState.data.parentTopicLabel}`:detailState.data.domainLabel}</span>}</div>
     {detailState.status==='loading'&&<div className="knowledgeDetailLoading"><b>פותח את הנושא…</b></div>}
     {detailState.status==='error'&&<div className="knowledgeState error"><b>הנושא לא נטען.</b><span>{detailState.message}</span></div>}
     {detailState.status==='ready'&&<TopicView detail={detailState.data} onNavigate={openDetail}/>} 
    </div>}
   </section>
   
  </>}
 </div>;
}

function TopicView({detail,onNavigate}:{detail:TopicDetail;onNavigate:(id:string)=>void}){
 const record:CrystalRecord={fragmentId:detail.card.id,conceptId:detail.id,topic:detail.domainLabel,subtopic:detail.kind==='DOMAIN'?undefined:detail.parentTopicLabel?`${detail.parentTopicLabel} / ${detail.label}`:detail.label,text:detail.card.summary,sourceLabel:detail.card.sourceLabel,provenanceLabel:detail.card.provenanceLabel,savedAt:new Date().toISOString()};
 return <div className="knowledgeTopicDetail">
  <header className="knowledgeDetailIntro"><span className="eyebrow">{kindLabel(detail.kind)}</span><h2>{detail.label}</h2><p>{detail.description}</p></header>
  <section className="knowledgeFacts"><h3>מה לומדים כאן?</h3><p>{detail.learningUnit.goal}</p><h3>איך זה מתחבר למסע?</h3><p>{detail.learningUnit.whyNow}</p>{detail.learningUnit.position&&detail.learningUnit.total&&<small>יחידת לימוד {detail.learningUnit.position} מתוך {detail.learningUnit.total} במפת המסלול הנוכחית.</small>}{(detail.learningUnit.previous||detail.learningUnit.next)&&<div className="knowledgeDetailToolbar">{detail.learningUnit.previous&&<button type="button" className="knowledgeBack" onClick={()=>onNavigate(detail.learningUnit.previous!.id)}>→ {detail.learningUnit.previous.label}</button>}{detail.learningUnit.next&&<button type="button" className="knowledgeBack" onClick={()=>onNavigate(detail.learningUnit.next!.id)}>{detail.learningUnit.next.label} ←</button>}</div>}</section>
  <section className="knowledgeFacts"><h3>הידע של היחידה</h3>{detail.keyPoints.length?<div className="knowledgeFactList">{detail.keyPoints.map(point=><article key={point.id}><div><span>{pointLabel(point.type)}</span><small>{point.sourceLabel}</small></div><p>{point.text}</p></article>)}</div>:<p className="muted">עדיין אין מספיק יחידות ידע ששויכו ישירות לנושא. המערכת לא תמלא את החסר בטקסט מנושא אחר.</p>}</section>
  {detail.relatedConcepts.length>0&&<section className="knowledgeRelated"><h3>קשרים מאושרים</h3><div>{detail.relatedConcepts.map(concept=><span key={concept.id}>{concept.label}</span>)}</div></section>}
  {detail.sources.length>0&&<section className="knowledgeSources"><h3>מקורות של היחידה</h3><ul>{detail.sources.map(source=><li key={source.id||source.title}>{source.title}</li>)}</ul></section>}
  <section className="knowledgeSummaryCard"><div className="knowledgeSummaryHead"><div><span className="eyebrow">KNOWLEDGE CARD</span><h3>{detail.card.title}</h3></div><CrystalButton record={record}/></div><p>{detail.card.summary}</p><small>◆ הכרטיס מסכם רק את יחידת הלימוד שמעליו. שמירה מוסיפה אותו ל״קריסטלים שלי״.</small></section>
 </div>;
}
