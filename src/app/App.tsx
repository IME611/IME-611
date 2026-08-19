import React,{useEffect,useState}from'react';
import{chapters as fallbackChapters}from'../data/chapters';
import SpiralLibrary from'../features/journey/SpiralLibrary';
import EvolutionWorkspace from'../features/evolution/EvolutionWorkspace';
import TransformationWorkspace from'../features/transformation/TransformationWorkspace';
import{KnowledgeDashboard}from'../features/knowledge-dashboard/KnowledgeDashboard';
import{MediaWorkspace}from'../features/media/MediaWorkspace';
import{ResearchWorkbench}from'../features/research/ResearchWorkbench';
import{AddSourceModal}from'../features/sources/AddSourceModal';
import{DesktopNavigation,MobileNavigation}from'../features/navigation/NavigationShell';
import{useAppNavigation}from'../features/navigation/useAppNavigation';
import{pageByNavigationId}from'../features/navigation/navigation.config';
import{CrystalCollectionDrawer}from'../features/crystals/CrystalCollectionDrawer';
import{useCrystalCollection}from'../features/crystals/model/useCrystalCollection';
import{WelcomeScreen}from'../features/welcome/WelcomeScreen';
import{ReviewConsole}from'../features/editor/ReviewConsole';
import{LiquidGlassFilter}from'../design/primitives/LiquidGlassFilter';
import{bindLiquidGlassPointerTracking}from'../design/glass/runtime';
import{evolutionPages}from'./navigation';
import type{Chapter}from'../core/types';
import{readText,storageKeys,writeText}from'../core/storage';

const fallback:Chapter[]=fallbackChapters.map((chapter:any)=>({
 number:chapter.number,
 title:chapter.title,
 subtitle:chapter.subtitle,
 sourceFile:`פרק ${chapter.number}`,
 paragraphs:chapter.paragraphs||[],
 paragraphCount:(chapter.paragraphs||[]).length,
 characterCount:(chapter.paragraphs||[]).join('').length,
}));
const evoPageIds=evolutionPages as readonly string[];

export default function App(){
 const{page,navigate:nav,back:goBack}=useAppNavigation();
 const[q,setQ]=useState('');
 const[collapsed,setCollapsed]=useState(()=>readText(storageKeys.railCollapsed)==='1');
 const[editor,setEditor]=useState(false);
 const[online,setOnline]=useState(false);
 const[notice,setNotice]=useState('');
 const[crystalsOpen,setCrystalsOpen]=useState(false);
 const[sourceChapters,setSourceChapters]=useState<Chapter[]>([]);
 const[corpusStats,setCorpusStats]=useState({paragraphs:0,characters:0});
 const[corpusReady,setCorpusReady]=useState(false);
 const[entered,setEntered]=useState(()=>{try{return sessionStorage.getItem('eil-welcome-entered')==='1'}catch{return false}});
 const{records:crystals}=useCrystalCollection();
 const reviewMode=typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('editor')==='review';

 useEffect(()=>{
  if(reviewMode)return;
  fetch('/api/knowledge?resource=items').then(response=>{setOnline(response.ok)}).catch(()=>setOnline(false));
  fetch('/api/chapters').then(response=>response.ok?response.json():Promise.reject()).then(data=>{
   if(data.total===18&&Array.isArray(data.chapters)){
    setSourceChapters(data.chapters);
    setCorpusStats({paragraphs:data.paragraphs||0,characters:data.characters||0});
    setCorpusReady(data.sourceMode==='lossless-docx-text');
   }
  }).catch(()=>{});
 },[reviewMode]);
 useEffect(()=>{if(!reviewMode)writeText(storageKeys.railCollapsed,collapsed?'1':'0')},[collapsed,reviewMode]);
 useEffect(()=>{if(reviewMode)return;return bindLiquidGlassPointerTracking()},[reviewMode]);

 const allChapters=sourceChapters.length===18?sourceChapters:fallback;
 const openNew=()=>setEditor(true);
 const current=pageByNavigationId(page);
 const isEvolution=evoPageIds.includes(page);
 const enterExperience=()=>{try{sessionStorage.setItem('eil-welcome-entered','1')}catch{}setEntered(true);nav('dashboard')};
 const Header=({title,sub}:{title:string;sub:string})=><div className="pageTitle"><div><span className="eyebrow">E.I.L</span><h1>{title}</h1>{sub&&<p>{sub}</p>}</div></div>;
 const Sources=()=><div className="genericPage"><h2 className="genericTitle">מקורות</h2><p className="muted">18 המסמכים שהועלו — בקרוב.</p><button className="primary" onClick={openNew}>+ הוסף מקור</button></div>;
 const Generic=()=><div className="genericPage"><h2 className="genericTitle">{current.label}</h2><p className="muted">דף זה בפיתוח.</p></div>;

 if(reviewMode)return <><LiquidGlassFilter/><ReviewConsole/></>;
 if(!entered)return <><LiquidGlassFilter/><WelcomeScreen onStart={enterExperience}/></>;

 return <><LiquidGlassFilter/><div className="app">
  <DesktopNavigation page={page} onNavigate={nav} onAdd={openNew} collapsed={collapsed} onCollapsedChange={setCollapsed} online={online}/>
  <MobileNavigation page={page} onNavigate={nav} onAdd={openNew} online={online}/>
  <main>
   {page!=='dashboard'&&<div className="topbar"><div className="globalSearch">⌕<input value={q} onChange={event=>setQ(event.target.value)} placeholder="חפש רעיון, מקור, קשר או תובנה..."/></div></div>}
   {page!=='dashboard'&&<div className="pageBack"><button onClick={goBack}>→ חזרה</button></div>}
   {notice&&<div className="notice" onClick={()=>setNotice('')}>{notice}</div>}
   {page==='dashboard'&&<KnowledgeDashboard query={q} onQueryChange={setQ} onAdd={openNew}/>} 
   {page==='library'&&<SpiralLibrary chapters={allChapters} query={q} setQuery={setQ} corpusReady={corpusReady} paragraphs={corpusStats.paragraphs} characters={corpusStats.characters}/>} 
   {page==='sources'&&<Sources/>}
   {page==='transformation'&&<TransformationWorkspace chapters={allChapters}/>} 
   {page==='media'&&<MediaWorkspace/>} 
   {page==='research'&&<ResearchWorkbench chapters={allChapters} onAdd={openNew}/>} 
   {isEvolution&&<EvolutionWorkspace page={page} onNav={nav}/>} 
   {!['dashboard','library','sources','transformation','media','research',...evoPageIds].includes(page)&&<Generic/>}
   <AddSourceModal open={editor} onClose={()=>setEditor(false)} onImported={message=>{setNotice(message);setOnline(!message.startsWith('ייבוא נכשל'))}}/>
  </main>
  <button className="crystalLauncher" onClick={()=>setCrystalsOpen(true)} aria-label="פתח את אוסף הקריסטלים"><span>◆</span><b>הקריסטלים שלי</b><em>{crystals.length}</em></button>
  <CrystalCollectionDrawer open={crystalsOpen} onClose={()=>setCrystalsOpen(false)}/>
 </div></>;
}
