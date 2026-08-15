import React,{useEffect,useMemo,useState}from'react';

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
type LibraryIndex={
 ok:boolean;
 version:string;
 generatedFrom:string;
 summary:{topics:number;concepts:number;knowledgeAtoms:number;connectedAtoms:number;unmappedAtoms:number;graphCoverage:number};
 nodes:LibraryNode[];
 edges:LibraryEdge[];
 policy:{taxonomyFrozen:boolean;sourceOrderUsed:boolean;fixedChapterCount:boolean;labelsDerivedFromCorpus:boolean;note:string};
};
type Props={query:string;onQueryChange:(value:string)=>void;onAdd:()=>void};
type LoadState={status:'loading'}|{status:'error';message:string}|{status:'ready';data:LibraryIndex};

const normalize=(value:string)=>value.toLocaleLowerCase('he').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const score=(node:LibraryNode)=>node.contextAtomCount*4+node.explicitMappedAtomCount*3+node.sourceCount*2+node.candidateCount;
const kindLabel=(kind:string)=>kind==='CONCEPT'?'מושג':'נושא מתוך המקורות';

export function KnowledgeDashboard({query,onQueryChange,onAdd}:Props){
 const[state,setState]=useState<LoadState>({status:'loading'}),[selectedId,setSelectedId]=useState<string|null>(null),[mode,setMode]=useState<'topics'|'concepts'>('topics');
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/api/library-index',{signal:controller.signal}).then(async response=>{
   const payload=await response.json().catch(()=>null);
   if(!response.ok||!payload?.ok)throw new Error(payload?.error||`library index unavailable (${response.status})`);
   setState({status:'ready',data:payload});
  }).catch(error=>{if(error?.name!=='AbortError')setState({status:'error',message:error instanceof Error?error.message:'library index unavailable'})});
  return()=>controller.abort();
 },[]);

 const data=state.status==='ready'?state.data:null;
 const nodes=data?.nodes||[],edges=data?.edges||[],term=normalize(query);
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
 const coverage=data?Math.round((data.summary.graphCoverage<=1?data.summary.graphCoverage*100:data.summary.graphCoverage)*10)/10:0;

 return <div className="knowledgeDashboard" dir="rtl">
  <header className="knowledgeHero">
   <div><span className="eyebrow">E.I.L / KNOWLEDGE MAP</span><h1>ספריית התוכן</h1><p>הידע כאן לא מחולק לפי קטגוריות שהומצאו מראש. הנושאים, המושגים והקשרים נגזרים מהתכנים שנכנסו למאגר — והמפה יכולה להשתנות ככל שנוסיף ידע.</p></div>
   <button className="primary knowledgeAdd" type="button" onClick={onAdd}>＋ הוסף תוכן</button>
  </header>

  {state.status==='loading'&&<section className="knowledgeState" aria-live="polite"><b>בונה את ספריית התוכן מהמפה החיה…</b><span>קורא נושאים, מושגים וקשרים מתוך המאגר.</span></section>}
  {state.status==='error'&&<section className="knowledgeState error" role="alert"><b>ספריית התוכן לא נטענה.</b><span>{state.message}</span><button type="button" onClick={()=>location.reload()}>נסה שוב</button></section>}

  {data&&<>
   <section className="knowledgeStats" aria-label="מצב מפת הידע">
    <article><strong>{data.summary.topics}</strong><span>נושאים שנצפו במקורות</span></article>
    <article><strong>{data.summary.concepts}</strong><span>מושגים במפה</span></article>
    <article><strong>{data.summary.knowledgeAtoms}</strong><span>יחידות ידע</span></article>
    <article><strong>{coverage}%</strong><span>מחוברות להקשר במפה</span></article>
   </section>

   <section className="knowledgeBrowse" aria-labelledby="knowledge-browse-title">
    <div className="knowledgeBrowseHead"><div><span className="eyebrow">CONTENT INDEX</span><h2 id="knowledge-browse-title">מה כבר קיים במאגר?</h2><p>פתח נושא כדי לראות מאילו מקורות הוא צמח ולאילו רעיונות הוא מחובר.</p></div><div className="knowledgeMode" role="group" aria-label="סוג תוכן"><button type="button" className={mode==='topics'?'active':''} aria-pressed={mode==='topics'} onClick={()=>{setMode('topics');setSelectedId(null)}}>נושאים</button><button type="button" className={mode==='concepts'?'active':''} aria-pressed={mode==='concepts'} onClick={()=>{setMode('concepts');setSelectedId(null)}}>מושגים</button></div></div>
    <label className="knowledgeSearch"><span>חיפוש בספרייה</span><input value={query} onChange={event=>onQueryChange(event.target.value)} placeholder="למשל: מוח, אמונות, סביבה, נוירופלסטיות…"/></label>
    <div className="knowledgeResultMeta" aria-live="polite">{term?`${visible.length} תוצאות מתאימות`:`מציג ${visible.length} פריטים מרכזיים מתוך ${base.length}`}</div>
    <div className="knowledgeCards">
     {visible.map(node=><button key={node.id} type="button" className={selectedId===node.id?'knowledgeCard selected':'knowledgeCard'} onClick={()=>setSelectedId(current=>current===node.id?null:node.id)} aria-expanded={selectedId===node.id}><span>{kindLabel(node.kind)}</span><h3>{node.label}</h3><div><b>{node.contextAtomCount||node.candidateCount}</b> יחידות בהקשר · <b>{node.sourceCount}</b> מקורות</div></button>)}
    </div>
    {!visible.length&&<div className="knowledgeEmpty"><b>עדיין אין התאמה במפה.</b><span>זה לא אומר שהנושא חדש בוודאות — מנגנון ה־intake הוא זה שבודק EXISTS / EXTENDS / RELATED / CONFLICTS / NEW.</span><button type="button" className="primary" onClick={onAdd}>בדוק תוכן חדש</button></div>}
   </section>

   {selected&&<section className="knowledgeDetail" aria-labelledby="knowledge-detail-title">
    <div><span className="eyebrow">{kindLabel(selected.kind)}</span><h2 id="knowledge-detail-title">{selected.label}</h2><p>הפריט הזה נוצר מתוך המפה הנוכחית של הקורפוס. הוא אינו קטגוריה קבועה, ויכול להתחבר או להתארגן אחרת כשהמאגר גדל.</p><dl><div><dt>מקורות</dt><dd>{selected.sourceCount}</dd></div><div><dt>יחידות בהקשר</dt><dd>{selected.contextAtomCount}</dd></div><div><dt>אזכורים מפורשים</dt><dd>{selected.explicitMappedAtomCount}</dd></div></dl></div>
    <div className="knowledgeConnections"><h3>קשרים חזקים במפה</h3>{related.length?related.map(({edge,node})=><button key={edge.id} type="button" onClick={()=>setSelectedId(node.id)}><span>{node.label}</span><small>עוצמת קשר {edge.weight.toFixed(1)}</small></button>):<p>עדיין לא זוהו קשרים חזקים לפריט הזה.</p>}</div>
    {selected.sourceFiles.length>0&&<div className="knowledgeSources"><h3>מקורות שבהם הוא מופיע</h3><ul>{selected.sourceFiles.map(file=><li key={file}>{file}</li>)}</ul></div>}
   </section>}

   <aside className="knowledgePolicy"><b>מה חשוב לדעת על המפה הזאת?</b><span>אין מספר פרקים קבוע, סדר 18 הקבצים אינו סדר הלמידה, והטקסונומיה עדיין אינה קפואה. ספריית התוכן היא תצוגה של המפה החיה — לא רשימת קטגוריות שהוגדרה מראש.</span></aside>
  </>}
 </div>;
}
