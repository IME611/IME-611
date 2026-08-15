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
type LearningUnit={
 id:string;
 anchorNodeId:string;
 title:string;
 sourceFiles:string[];
 concepts?:string[];
 conceptCount:number;
 contextAtomCount:number;
 complexity:number;
 prerequisiteConceptIds:string[];
 orderStatus:string;
};
type SpiralAppearance={
 conceptNodeId:string;
 conceptLabel:string;
 appearanceCount:number;
 introduction:{unitId:string;title:string;basis:string;confidence:number}|null;
 revisits:{unitId:string;title:string;complexity:number}[];
 appearances:{unitId:string;title:string;complexity:number}[];
};
type LearningGraphPayload={
 ok:boolean;
 method:{version:string;sourceOrderUsed:boolean;fixedChapterCount:boolean};
 summary:{learningUnits:number;hardDependencies:number;softDependencies:number;strictCycles:number;spiralConcepts:number;constrainedUnits:number;unconstrainedUnits:number};
 learningUnits:LearningUnit[];
 spiralAppearances:SpiralAppearance[];
 policy?:Record<string,unknown>;
};
type Props={query:string;onQueryChange:(value:string)=>void;onAdd:()=>void};
type LoadState={status:'loading'}|{status:'error';message:string}|{status:'ready';data:CorpusMapPayload};
type LearningState={status:'loading'}|{status:'error';message:string}|{status:'ready';data:LearningGraphPayload};

const normalize=(value:string)=>value.toLocaleLowerCase('he').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const score=(node:LibraryNode)=>node.contextAtomCount*4+node.explicitMappedAtomCount*3+node.sourceCount*2+node.candidateCount;
const kindLabel=(kind:string)=>kind==='CONCEPT'?'מושג':'נושא מתוך המקורות';
const orderLabel=(status:string)=>status==='CONSTRAINED'?'מיקום נתמך בתלויות':'המיקום עדיין לא מקובע';

export function KnowledgeDashboard({query,onQueryChange,onAdd}:Props){
 const[state,setState]=useState<LoadState>({status:'loading'}),[learningState,setLearningState]=useState<LearningState>({status:'loading'}),[selectedId,setSelectedId]=useState<string|null>(null),[mode,setMode]=useState<'topics'|'concepts'>('topics');
 const detailRef=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/corpus-map',{signal:controller.signal}).then(async response=>{
   const payload=await response.json().catch(()=>null);
   if(!response.ok||!payload?.ok)throw new Error(payload?.error||`corpus map unavailable (${response.status})`);
   setState({status:'ready',data:payload});
  }).catch(error=>{if(error?.name!=='AbortError')setState({status:'error',message:error instanceof Error?error.message:'corpus map unavailable'})});
  return()=>controller.abort();
 },[]);
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/learning-graph',{signal:controller.signal}).then(async response=>{
   const payload=await response.json().catch(()=>null);
   if(!response.ok||!payload?.ok)throw new Error(payload?.error||`learning graph unavailable (${response.status})`);
   setLearningState({status:'ready',data:payload});
  }).catch(error=>{if(error?.name!=='AbortError')setLearningState({status:'error',message:error instanceof Error?error.message:'learning graph unavailable'})});
  return()=>controller.abort();
 },[]);
 useEffect(()=>{
  if(!selectedId)return;
  const frame=requestAnimationFrame(()=>detailRef.current?.scrollIntoView({behavior:'smooth',block:'start'}));
  return()=>cancelAnimationFrame(frame);
 },[selectedId]);

 const data=state.status==='ready'?state.data:null,learning=learningState.status==='ready'?learningState.data:null;
 const nodes=data?.nodes||[],term=normalize(query);
 const topics=useMemo(()=>nodes.filter(node=>node.kind==='SECTION_TOPIC').sort((a,b)=>score(b)-score(a)||a.label.localeCompare(b.label,'he')),[nodes]);
 const concepts=useMemo(()=>nodes.filter(node=>node.kind==='CONCEPT').sort((a,b)=>score(b)-score(a)||a.label.localeCompare(b.label,'he')),[nodes]);
 const base=mode==='topics'?topics:concepts;
 const visible=useMemo(()=>{
  if(!term)return base.slice(0,30);
  return base.filter(node=>normalize([node.label,...node.sourceFiles].join(' ')).includes(term)).slice(0,60);
 },[base,term]);
 const selected=data?.nodes.find(node=>node.id===selectedId)??null;
 const related=useMemo(()=>{
  if(!selected||!data)return[];
  const byId=new Map(data.nodes.map(node=>[node.id,node]));
  return data.edges.filter(edge=>edge.from===selected.id||edge.to===selected.id).sort((a,b)=>b.weight-a.weight).slice(0,8).map(edge=>({edge,node:byId.get(edge.from===selected.id?edge.to:edge.from)})).filter(item=>Boolean(item.node)) as{edge:LibraryEdge;node:LibraryNode}[];
 },[selected,data]);
 const unitByAnchor=useMemo(()=>new Map((learning?.learningUnits||[]).map(unit=>[unit.anchorNodeId,unit])),[learning]);
 const unitById=useMemo(()=>new Map((learning?.learningUnits||[]).map(unit=>[unit.id,unit])),[learning]);
 const selectedUnit=selected?unitByAnchor.get(selected.id)??null:null;
 const selectedSpiral=selected&&learning?learning.spiralAppearances.find(item=>item.conceptNodeId===selected.id)??null:null;
 const coverage=data?Math.round((data.summary.graphCoverage<=1?data.summary.graphCoverage*100:data.summary.graphCoverage)*10)/10:0;
 const openLearningUnit=(unitId:string)=>{
  const unit=unitById.get(unitId);
  if(!unit)return;
  setMode('topics');
  setSelectedId(unit.anchorNodeId);
 };

 return <div className="knowledgeDashboard" dir="rtl">
  <header className="knowledgeHero">
   <div><span className="eyebrow">E.I.L / KNOWLEDGE MAP</span><h1>ספריית התוכן</h1><p>הידע כאן לא מחולק לפי קטגוריות שהומצאו מראש. הנושאים, המושגים והקשרים נגזרים מהתכנים שנכנסו למאגר — והמפה יכולה להשתנות ככל שנוסיף ידע.</p></div>
   <button className="primary knowledgeAdd" type="button" onClick={onAdd}>＋ הוסף תוכן</button>
  </header>

  {state.status==='loading'&&<section className="knowledgeState" aria-live="polite"><b>בונה את ספריית התוכן מהמפה החיה…</b><span>קורא נושאים, מושגים וקשרים מתוך המאגר.</span></section>}
  {state.status==='error'&&<section className="knowledgeState error" role="alert"><b>ספריית התוכן לא נטענה.</b><span>{state.message}</span><button type="button" onClick={()=>location.reload()}>נסה שוב</button></section>}

  {data&&<>
   <section className="knowledgeStats" aria-label="מצב מפת הידע">
    <article><strong>{data.summary.sectionTopicNodes}</strong><span>נושאים שנצפו במקורות</span></article>
    <article><strong>{data.summary.conceptNodes}</strong><span>מושגים במפה</span></article>
    <article><strong>{data.summary.nonConceptAtoms}</strong><span>יחידות ידע</span></article>
    <article><strong>{coverage}%</strong><span>מחוברות להקשר במפה</span></article>
   </section>

   <section className="knowledgeBrowse" aria-labelledby="knowledge-browse-title">
    <div className="knowledgeBrowseHead"><div><span className="eyebrow">CONTENT INDEX</span><h2 id="knowledge-browse-title">מה כבר קיים במאגר?</h2><p>פתח נושא כדי לראות מאילו מקורות הוא צמח, לאילו רעיונות הוא מחובר ואיזה תפקיד אפשרי יש לו במסלול הלמידה.</p></div><div className="knowledgeMode" role="group" aria-label="סוג תוכן"><button type="button" className={mode==='topics'?'active':''} aria-pressed={mode==='topics'} onClick={()=>{setMode('topics');setSelectedId(null)}}>נושאים</button><button type="button" className={mode==='concepts'?'active':''} aria-pressed={mode==='concepts'} onClick={()=>{setMode('concepts');setSelectedId(null)}}>מושגים</button></div></div>
    <label className="knowledgeSearch"><span>חיפוש בספרייה</span><input value={query} onChange={event=>onQueryChange(event.target.value)} placeholder="למשל: מוח, אמונות, סביבה, נוירופלסטיות…"/></label>
    <div className="knowledgeResultMeta" aria-live="polite">{term?`${visible.length} תוצאות מתאימות`:`מציג ${visible.length} פריטים מרכזיים מתוך ${base.length}`}</div>
    <div className="knowledgeCards">
     {visible.map(node=><button key={node.id} type="button" className={selectedId===node.id?'knowledgeCard selected':'knowledgeCard'} onClick={()=>setSelectedId(node.id)} aria-expanded={selectedId===node.id} aria-controls="knowledge-detail"><span>{kindLabel(node.kind)}</span><h3>{node.label}</h3><div><b>{node.contextAtomCount||node.candidateCount}</b> יחידות בהקשר · <b>{node.sourceCount}</b> מקורות</div><small className="knowledgeCardAction">{selectedId===node.id?'פתוח עכשיו':'פתח נושא ←'}</small></button>)}
    </div>
    {!visible.length&&<div className="knowledgeEmpty"><b>עדיין אין התאמה במפה.</b><span>זה לא אומר שהנושא חדש בוודאות — מנגנון ה־intake הוא זה שבודק EXISTS / EXTENDS / RELATED / CONFLICTS / NEW.</span><button type="button" className="primary" onClick={onAdd}>בדוק תוכן חדש</button></div>}
   </section>

   {selected&&<section ref={detailRef} id="knowledge-detail" className="knowledgeDetail" aria-labelledby="knowledge-detail-title" tabIndex={-1}>
    <div><span className="eyebrow">{kindLabel(selected.kind)}</span><h2 id="knowledge-detail-title">{selected.label}</h2><p>הפריט הזה נוצר מתוך המפה הנוכחית של הקורפוס. הוא אינו קטגוריה קבועה, ויכול להתחבר או להתארגן אחרת כשהמאגר גדל.</p><dl><div><dt>מקורות</dt><dd>{selected.sourceCount}</dd></div><div><dt>יחידות בהקשר</dt><dd>{selected.contextAtomCount}</dd></div><div><dt>אזכורים מפורשים</dt><dd>{selected.explicitMappedAtomCount}</dd></div></dl></div>
    <div className="knowledgeConnections"><h3>קשרים חזקים במפה</h3>{related.length?related.map(({edge,node})=><button key={edge.id} type="button" onClick={()=>setSelectedId(node.id)}><span>{node.label}</span><small>עוצמת קשר {edge.weight.toFixed(1)}</small></button>):<p>עדיין לא זוהו קשרים חזקים לפריט הזה.</p>}</div>
    {selected.sourceFiles.length>0&&<div className="knowledgeSources"><h3>מקורות שבהם הוא מופיע</h3><ul>{selected.sourceFiles.map(file=><li key={file}>{file}</li>)}</ul></div>}

    <div className="knowledgeLearning">
     <div className="knowledgeLearningHead"><div><span className="eyebrow">LEARNING CONTEXT</span><h3>איפה זה פוגש את מסלול הלמידה?</h3></div>{learning&&<small>{learning.summary.learningUnits} יחידות לימוד מועמדות · {learning.summary.spiralConcepts} מושגים עם חזרה ספירלית</small>}</div>
     {learningState.status==='loading'&&<p>טוען את הקשר למסלול הלמידה…</p>}
     {learningState.status==='error'&&<p>מסלול הלמידה לא זמין כרגע. ספריית התוכן נשארת זמינה ולא מסיקה סדר בלי הנתונים האלה.</p>}
     {learning&&selected.kind==='SECTION_TOPIC'&&selectedUnit&&<div className="knowledgeLearningUnit"><div><b>יחידת לימוד מועמדת</b><strong>{selectedUnit.title}</strong></div><dl><div><dt>מורכבות יחסית</dt><dd>{selectedUnit.complexity.toFixed(1)}</dd></div><div><dt>מצב סדר</dt><dd>{orderLabel(selectedUnit.orderStatus)}</dd></div><div><dt>תלויות מוקדמות מאומתות</dt><dd>{selectedUnit.prerequisiteConceptIds.length}</dd></div></dl>{selectedUnit.prerequisiteConceptIds.length===0&&<p>כרגע אין מספיק ראיות כדי לקבע מה חייב להילמד לפני הנושא הזה. הוא נשאר מועמד במסלול — לא “פרק ראשון” ולא שלב שנקבע לפי מספר הקובץ.</p>}</div>}
     {learning&&selected.kind==='SECTION_TOPIC'&&!selectedUnit&&<p>הנושא קיים במפת הידע, אבל כרגע אין לו יחידת לימוד מועמדת ישירה ב־Learning Graph.</p>}
     {learning&&selected.kind==='CONCEPT'&&selectedSpiral&&<div className="knowledgeSpiral"><div><b>חזרה ספירלית זוהתה</b><strong>{selectedSpiral.appearanceCount} הופעות בהקשרים שונים</strong></div>{selectedSpiral.introduction&&<div className="knowledgeSpiralIntro"><span>הופעת פתיחה מוצעת</span><button type="button" onClick={()=>openLearningUnit(selectedSpiral.introduction!.unitId)}>{selectedSpiral.introduction.title}</button><small>הבחירה כרגע היא heuristic שקוף לפי מורכבות, confidence {Math.round(selectedSpiral.introduction.confidence*100)}% — לא סדר קנוני.</small></div>}<div className="knowledgeRevisits"><span>חוזר בהמשך דרך</span>{selectedSpiral.revisits.map(item=><button key={item.unitId} type="button" onClick={()=>openLearningUnit(item.unitId)}><b>{item.title}</b><small>מורכבות {item.complexity.toFixed(1)}</small></button>)}</div></div>}
     {learning&&selected.kind==='CONCEPT'&&!selectedSpiral&&<p>כרגע לא זוהו מספיק הופעות נפרדות כדי להגדיר למושג הזה חזרה ספירלית. הוא נשאר במפת הידע בלי להמציא עבורו מסלול.</p>}
    </div>
   </section>}

   <aside className="knowledgePolicy"><b>מה חשוב לדעת על המפה הזאת?</b><span>אין מספר פרקים קבוע, סדר 18 הקבצים אינו סדר הלמידה, והטקסונומיה עדיין אינה קפואה. ספריית התוכן היא תצוגה של המפה החיה — ומסלול הלמידה משתמש רק בתלויות ובחזרות שאפשר להסביר מהנתונים.</span></aside>
  </>}
 </div>;
}
