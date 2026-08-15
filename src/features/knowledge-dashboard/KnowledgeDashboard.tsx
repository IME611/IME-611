import React,{useEffect,useMemo,useRef,useState}from'react';

type LibraryNode={
 id:string;
 kind:'SECTION_TOPIC'|'CONCEPT'|string;
 label:string;
 sourceCount:number;
 candidateCount:number;
 contextAtomCount:number;
 explicitMappedAtomCount:number;
 sourceFiles:string[];
};
type LibraryEdge={id:string;from:string;to:string;weight:number;signals:Record<string,number>};
type CorpusMapPayload={
 ok:boolean;
 version:string;
 summary:{conceptNodes:number;sectionTopicNodes:number;nonConceptAtoms:number;mappedAtoms:number;unmappedAtoms:number;graphCoverage:number};
 nodes:LibraryNode[];
 edges:LibraryEdge[];
 policy?:Record<string,unknown>;
};
type LearningUnit={id:string;anchorNodeId:string;title:string;sourceFiles:string[];concepts?:string[];conceptCount:number;contextAtomCount:number;complexity:number;prerequisiteConceptIds:string[];orderStatus:string};
type SpiralAppearance={conceptNodeId:string;conceptLabel:string;appearanceCount:number;introduction:{unitId:string;title:string;basis:string;confidence:number}|null;revisits:{unitId:string;title:string;complexity:number}[];appearances:{unitId:string;title:string;complexity:number}[]};
type LearningGraphPayload={ok:boolean;method:{version:string;sourceOrderUsed:boolean;fixedChapterCount:boolean};summary:{learningUnits:number;hardDependencies:number;softDependencies:number;strictCycles:number;spiralConcepts:number;constrainedUnits:number;unconstrainedUnits:number};learningUnits:LearningUnit[];spiralAppearances:SpiralAppearance[];policy?:Record<string,unknown>};
type Props={query:string;onQueryChange:(value:string)=>void;onAdd:()=>void};
type LoadState={status:'loading'}|{status:'error';message:string}|{status:'ready';data:CorpusMapPayload};
type LearningState={status:'loading'}|{status:'error';message:string}|{status:'ready';data:LearningGraphPayload};
type TopicEntry={topic:LibraryNode;children:{node:LibraryNode;weight:number}[]};

const normalize=(value:string)=>value.toLocaleLowerCase('he').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const score=(node:LibraryNode)=>node.contextAtomCount*4+node.explicitMappedAtomCount*3+node.sourceCount*2+node.candidateCount;
const kindLabel=(kind:string)=>kind==='CONCEPT'?'תת־נושא / מושג':'נושא';
const orderLabel=(status:string)=>status==='CONSTRAINED'?'מיקום נתמך בתלויות':'המיקום עדיין לא מקובע';
const matches=(node:LibraryNode,term:string)=>!term||normalize([node.label,...node.sourceFiles].join(' ')).includes(term);

export function KnowledgeDashboard({query,onQueryChange,onAdd}:Props){
 const[state,setState]=useState<LoadState>({status:'loading'}),[learningState,setLearningState]=useState<LearningState>({status:'loading'});
 const[selectedId,setSelectedId]=useState<string|null>(null),[expanded,setExpanded]=useState<Set<string>>(()=>new Set());
 const browseRef=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/corpus-map',{signal:controller.signal}).then(async response=>{const payload=await response.json().catch(()=>null);if(!response.ok||!payload?.ok)throw new Error(payload?.error||`corpus map unavailable (${response.status})`);setState({status:'ready',data:payload})}).catch(error=>{if(error?.name!=='AbortError')setState({status:'error',message:error instanceof Error?error.message:'corpus map unavailable'})});
  return()=>controller.abort();
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/learning-graph',{signal:controller.signal}).then(async response=>{const payload=await response.json().catch(()=>null);if(!response.ok||!payload?.ok)throw new Error(payload?.error||`learning graph unavailable (${response.status})`);setLearningState({status:'ready',data:payload})}).catch(error=>{if(error?.name!=='AbortError')setLearningState({status:'error',message:error instanceof Error?error.message:'learning graph unavailable'})});
  return()=>controller.abort();
 },[]);

 const data=state.status==='ready'?state.data:null,learning=learningState.status==='ready'?learningState.data:null;
 const nodes=data?.nodes||[],term=normalize(query);
 const byId=useMemo(()=>new Map(nodes.map(node=>[node.id,node])),[nodes]);
 const topicEntries=useMemo<TopicEntry[]>(()=>{
  if(!data)return[];
  return nodes.filter(node=>node.kind==='SECTION_TOPIC').sort((a,b)=>score(b)-score(a)||a.label.localeCompare(b.label,'he')).map(topic=>{
   const seen=new Set<string>();
   const children=data.edges.filter(edge=>edge.from===topic.id||edge.to===topic.id).map(edge=>{const node=byId.get(edge.from===topic.id?edge.to:edge.from);return node?.kind==='CONCEPT'?{node,weight:edge.weight}:null}).filter((item):item is{node:LibraryNode;weight:number}=>Boolean(item)&&!seen.has(item!.node.id)&&Boolean(seen.add(item!.node.id))).sort((a,b)=>b.weight-a.weight||score(b.node)-score(a.node));
   return{topic,children};
  });
 },[data,nodes,byId]);
 const visibleTopics=useMemo(()=>topicEntries.filter(entry=>matches(entry.topic,term)||entry.children.some(child=>matches(child.node,term))),[topicEntries,term]);
 const selected=selectedId?byId.get(selectedId)??null:null;
 const related=useMemo(()=>{
  if(!selected||!data)return[];
  return data.edges.filter(edge=>edge.from===selected.id||edge.to===selected.id).sort((a,b)=>b.weight-a.weight).slice(0,8).map(edge=>({edge,node:byId.get(edge.from===selected.id?edge.to:edge.from)})).filter(item=>Boolean(item.node)) as{edge:LibraryEdge;node:LibraryNode}[];
 },[selected,data,byId]);
 const unitByAnchor=useMemo(()=>new Map((learning?.learningUnits||[]).map(unit=>[unit.anchorNodeId,unit])),[learning]);
 const unitById=useMemo(()=>new Map((learning?.learningUnits||[]).map(unit=>[unit.id,unit])),[learning]);
 const selectedUnit=selected?unitByAnchor.get(selected.id)??null:null;
 const selectedSpiral=selected&&learning?learning.spiralAppearances.find(item=>item.conceptNodeId===selected.id)??null:null;
 const coverage=data?Math.round((data.summary.graphCoverage<=1?data.summary.graphCoverage*100:data.summary.graphCoverage)*10)/10:0;
 const moveToLibraryTop=()=>requestAnimationFrame(()=>browseRef.current?.scrollIntoView({behavior:'smooth',block:'start'}));
 const openNode=(id:string)=>{setSelectedId(id);moveToLibraryTop()};
 const closeNode=()=>{setSelectedId(null);moveToLibraryTop()};
 const toggleTopic=(id:string)=>setExpanded(current=>{const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return next});
 const openLearningUnit=(unitId:string)=>{const unit=unitById.get(unitId);if(unit)openNode(unit.anchorNodeId)};

 return <div className="knowledgeDashboard" dir="rtl">
  <header className="knowledgeHero"><div><span className="eyebrow">E.I.L / KNOWLEDGE MAP</span><h1>ספריית התוכן</h1><p>כל הנושאים במקום אחד. פתח נושא, הרחב את תתי־הנושאים שלו, ועבור ביניהם בלי לצאת מחלון הספרייה.</p></div><button className="primary knowledgeAdd" type="button" onClick={onAdd}>＋ הוסף תוכן</button></header>

  {state.status==='loading'&&<section className="knowledgeState" aria-live="polite"><b>בונה את ספריית התוכן מהמפה החיה…</b><span>קורא נושאים, מושגים וקשרים מתוך המאגר.</span></section>}
  {state.status==='error'&&<section className="knowledgeState error" role="alert"><b>ספריית התוכן לא נטענה.</b><span>{state.message}</span><button type="button" onClick={()=>location.reload()}>נסה שוב</button></section>}

  {data&&<>
   <section className="knowledgeStats" aria-label="מצב מפת הידע"><article><strong>{data.summary.sectionTopicNodes}</strong><span>נושאים במאגר</span></article><article><strong>{data.summary.conceptNodes}</strong><span>תתי־נושאים ומושגים</span></article><article><strong>{data.summary.nonConceptAtoms}</strong><span>יחידות ידע</span></article><article><strong>{coverage}%</strong><span>מחוברות להקשר</span></article></section>

   <section ref={browseRef} className="knowledgeBrowse" aria-labelledby="knowledge-browse-title">
    {!selected&&<>
     <div className="knowledgeBrowseHead"><div><span className="eyebrow">CONTENT INDEX</span><h2 id="knowledge-browse-title">כל הנושאים</h2><p>החץ פותח את תתי־הנושאים. לחיצה על שם פותחת את התוכן כאן, באותו חלון.</p></div></div>
     <label className="knowledgeSearch"><span>חיפוש בספרייה</span><input value={query} onChange={event=>onQueryChange(event.target.value)} placeholder="למשל: מוח, אמונות, סביבה…"/></label>
     <div className="knowledgeResultMeta" aria-live="polite">{term?`${visibleTopics.length} נושאים מתאימים`:`${visibleTopics.length} נושאים`}</div>
     <div className="knowledgeTopicList">
      {visibleTopics.map(({topic,children})=>{const isExpanded=term?true:expanded.has(topic.id);const shownChildren=term&&!matches(topic,term)?children.filter(child=>matches(child.node,term)):children;return <section key={topic.id} className="knowledgeTopicGroup">
       <div className="knowledgeTopicRow"><button type="button" className="knowledgeTopicOpen" onClick={()=>openNode(topic.id)}><span><small>נושא</small><strong>{topic.label}</strong><em>{topic.contextAtomCount||topic.candidateCount} יחידות · {topic.sourceCount} מקורות</em></span></button><button type="button" className={isExpanded?'knowledgeTopicToggle open':'knowledgeTopicToggle'} onClick={()=>toggleTopic(topic.id)} aria-expanded={isExpanded} aria-label={`${isExpanded?'סגור':'פתח'} תתי־נושאים של ${topic.label}`}><span aria-hidden="true">⌄</span><small>{children.length}</small></button></div>
       {isExpanded&&<div className="knowledgeSubtopics" aria-label={`תתי־נושאים של ${topic.label}`}>{shownChildren.length?shownChildren.map(({node,weight})=><button key={node.id} type="button" onClick={()=>openNode(node.id)}><span>{node.label}</span><small>{node.sourceCount} מקורות · קשר {weight.toFixed(1)}</small><b aria-hidden="true">←</b></button>):<p>עדיין אין תתי־נושאים מחוברים במפה.</p>}</div>}
      </section>})}
     </div>
     {!visibleTopics.length&&<div className="knowledgeEmpty"><b>לא נמצאה התאמה.</b><span>אפשר לבדוק אם התוכן חדש דרך מנגנון ההוספה.</span><button type="button" className="primary" onClick={onAdd}>בדוק תוכן חדש</button></div>}
    </>}

    {selected&&<div id="knowledge-detail" className="knowledgeDetailInline">
     <div className="knowledgeDetailToolbar"><button type="button" className="knowledgeBack" onClick={closeNode}>→ כל הנושאים</button><span>{kindLabel(selected.kind)}</span></div>
     <div className="knowledgeDetailGrid"><div className="knowledgeDetailIntro"><span className="eyebrow">{kindLabel(selected.kind)}</span><h2 id="knowledge-browse-title">{selected.label}</h2><p>הפריט הזה נוצר מתוך מפת הקורפוס הנוכחית ויכול להתארגן מחדש ככל שנוסיף ידע.</p><dl><div><dt>מקורות</dt><dd>{selected.sourceCount}</dd></div><div><dt>יחידות בהקשר</dt><dd>{selected.contextAtomCount}</dd></div><div><dt>אזכורים מפורשים</dt><dd>{selected.explicitMappedAtomCount}</dd></div></dl></div>
      <div className="knowledgeConnections"><h3>קשרים במפה</h3>{related.length?related.map(({edge,node})=><button key={edge.id} type="button" onClick={()=>openNode(node.id)}><span>{node.label}</span><small>עוצמת קשר {edge.weight.toFixed(1)}</small></button>):<p>עדיין לא זוהו קשרים חזקים לפריט הזה.</p>}</div>
      {selected.sourceFiles.length>0&&<div className="knowledgeSources"><h3>מקורות שבהם הוא מופיע</h3><ul>{selected.sourceFiles.map(file=><li key={file}>{file}</li>)}</ul></div>}
      <div className="knowledgeLearning"><div className="knowledgeLearningHead"><div><span className="eyebrow">LEARNING CONTEXT</span><h3>איפה זה פוגש את מסלול הלמידה?</h3></div>{learning&&<small>{learning.summary.learningUnits} יחידות לימוד מועמדות · {learning.summary.spiralConcepts} מושגים עם חזרה ספירלית</small>}</div>
       {learningState.status==='loading'&&<p>טוען את הקשר למסלול הלמידה…</p>}
       {learningState.status==='error'&&<p>מסלול הלמידה לא זמין כרגע.</p>}
       {learning&&selected.kind==='SECTION_TOPIC'&&selectedUnit&&<div className="knowledgeLearningUnit"><div><b>יחידת לימוד מועמדת</b><strong>{selectedUnit.title}</strong></div><dl><div><dt>מורכבות יחסית</dt><dd>{selectedUnit.complexity.toFixed(1)}</dd></div><div><dt>מצב סדר</dt><dd>{orderLabel(selectedUnit.orderStatus)}</dd></div><div><dt>תלויות מוקדמות מאומתות</dt><dd>{selectedUnit.prerequisiteConceptIds.length}</dd></div></dl>{selectedUnit.prerequisiteConceptIds.length===0&&<p>כרגע אין מספיק ראיות כדי לקבע מה חייב להילמד לפני הנושא הזה.</p>}</div>}
       {learning&&selected.kind==='SECTION_TOPIC'&&!selectedUnit&&<p>הנושא קיים במפה, אבל עדיין אין לו יחידת לימוד ישירה.</p>}
       {learning&&selected.kind==='CONCEPT'&&selectedSpiral&&<div className="knowledgeSpiral"><div><b>חזרה ספירלית זוהתה</b><strong>{selectedSpiral.appearanceCount} הופעות בהקשרים שונים</strong></div>{selectedSpiral.introduction&&<div className="knowledgeSpiralIntro"><span>הופעת פתיחה מוצעת</span><button type="button" onClick={()=>openLearningUnit(selectedSpiral.introduction!.unitId)}>{selectedSpiral.introduction.title}</button></div>}<div className="knowledgeRevisits"><span>חוזר בהמשך דרך</span>{selectedSpiral.revisits.map(item=><button key={item.unitId} type="button" onClick={()=>openLearningUnit(item.unitId)}><b>{item.title}</b><small>מורכבות {item.complexity.toFixed(1)}</small></button>)}</div></div>}
       {learning&&selected.kind==='CONCEPT'&&!selectedSpiral&&<p>כרגע לא זוהו מספיק הופעות נפרדות כדי להגדיר חזרה ספירלית.</p>}
      </div>
     </div>
    </div>}
   </section>

   <aside className="knowledgePolicy"><b>המפה נשארת חיה.</b><span>הנושאים ותתי־הנושאים נגזרים מהתוכן ומהקשרים במאגר, ולא מרשימת קטגוריות קשיחה.</span></aside>
  </>}
 </div>;
}
