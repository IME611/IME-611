import React,{useEffect,useState}from'react';
import{chapters as fallbackChapters}from'../data/chapters';
import SpiralLibrary from'../features/journey/SpiralLibrary';
import EvolutionWorkspace from'../features/evolution/EvolutionWorkspace';
import TransformationWorkspace from'../features/transformation/TransformationWorkspace';
import{ProductDashboard}from'../features/dashboard/ProductDashboard';
import{MediaWorkspace}from'../features/media/MediaWorkspace';
import{ResearchWorkbench}from'../features/research/ResearchWorkbench';
import{AddSourceModal}from'../features/sources/AddSourceModal';
import{DesktopNavigation,MobileNavigation}from'../features/navigation/NavigationShell';
import{useAppNavigation}from'../features/navigation/useAppNavigation';
import{pageByNavigationId}from'../features/navigation/navigation.config';
import{CrystalCollectionDrawer}from'../features/crystals/CrystalCollectionDrawer';
import{MyCrystalsPage}from'../features/crystals/MyCrystalsPage';
import{useCrystalCollection}from'../features/crystals/model/useCrystalCollection';
import{WelcomeScreen}from'../features/welcome/WelcomeScreen';
import{HomePage}from'../features/home/HomePage';
import{ContentLibraryPage}from'../features/library/ContentLibraryPage';
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
 const{page,route,navigate:nav,back:goBack}=useAppNavigation();
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

 useEffect(()=>{
  fetch('/api/knowledge?resource=items').then(response=>{setOnline(response.ok)}).catch(()=>setOnline(false));
  fetch('/api/chapters').then(response=>response.ok?response.json():Promise.reject()).then(data=>{
   if(data.total===18&&Array.isArray(data.chapters)){
    setSourceChapters(data.chapters);
    setCorpusStats({paragraphs:data.paragraphs||0,characters:data.characters||0});
    setCorpusReady(data.sourceMode==='lossless-docx-text');
   }
  }).catch(()=>{});
 },[]);
 useEffect(()=>writeText(storageKeys.railCollapsed,collapsed?'1':'0'),[collapsed]);

 const allChapters=sourceChapters.length===18?sourceChapters:fallback;
 const openNew=()=>setEditor(true);
 const current=pageByNavigationId(page);
 const isEvolution=evoPageIds.includes(page);
 const enterExperience=()=>{try{sessionStorage.setItem('eil-welcome-entered','1')}catch{}setEntered(true);nav('home')};
 const Header=({title,sub}:{title:string;sub:string})=><div className="pageTitle"><div><span className="eyebrow">E.I.L / EVOLUTION OS</span><h1>{title}</h1><p>{sub}</p></div><button className="primary" onClick={openNew}>＋ הוסף מקור</button></div>;
 const Sources=()=> <><Header title="מקורות" sub="חומרי המקור שמזינים את שכבת הידע. חומר הגלם נשמר בשלמותו, וכל סינתזה אמורה להצביע חזרה למקור."/><section className="panel"><h2>מה נכנס למערכת?</h2><div className="pipeline"><b>מסמך / תמונה / מאמר</b><i>→</i><b>מקור מלא</b><i>→</i><b>כרטיסי ידע</b><i>→</i><b>קשרים</b><i>→</i><b>תובנה</b></div><p className="muted">מקורות הם תשתית השקיפות של הספרייה, לא קטגוריית תוכן בפני עצמה.</p><button className="primary" onClick={openNew}>הוסף מקור חדש</button></section></>;
 const Generic=()=> <><Header title={current.label} sub={`מרחב ${current.label} כחלק ממערכת E.I.L.`}/><div className="genericGrid"><section className="panel"><span className="eyebrow">FOUNDATION</span><h2>המרחב הזה יעבור למודל המוצר החדש</h2><p className="muted">בשלב הזה נשמרת התאימות לכלים הקיימים. בהמשך כל יכולת תמוקם תחת Home, Library, Journey, Crystals או My Space לפי תפקידה.</p></section></div></>;

 if(!entered)return <WelcomeScreen onStart={enterExperience}/>;

 return <div className="app">
  <DesktopNavigation page={page} onNavigate={nav} onAdd={openNew} collapsed={collapsed} onCollapsedChange={setCollapsed} online={online}/>
  <MobileNavigation page={page} onNavigate={nav} onAdd={openNew} online={online}/>
  <main>
   {page!=='home'&&<div className="topbar"><div className="globalSearch">⌕<input value={q} onChange={event=>setQ(event.target.value)} placeholder="חפש רעיון, מקור, קשר או תובנה..."/></div></div>}
   {page!=='home'&&<div className="pageBack"><button onClick={goBack}>→ חזרה</button><button onClick={()=>nav('home')}>⌂ ראשי</button></div>}
   {notice&&<div className="notice" onClick={()=>setNotice('')}>{notice}</div>}
   {page==='home'&&<HomePage onNavigate={nav} hasActivity={crystals.length>0}/>} 
   {page==='my-space'&&<ProductDashboard onNav={nav} onAdd={openNew}/>} 
   {page==='journey'&&<SpiralLibrary chapters={allChapters} query={q} setQuery={setQ} corpusReady={corpusReady} paragraphs={corpusStats.paragraphs} characters={corpusStats.characters}/>} 
   {page==='content-library'&&<ContentLibraryPage segments={route.segments} onNavigate={nav}/>} 
   {page==='crystals'&&<MyCrystalsPage records={crystals} onNavigate={nav}/>} 
   {page==='sources'&&<Sources/>}
   {page==='transformation'&&<TransformationWorkspace chapters={allChapters}/>} 
   {page==='media'&&<MediaWorkspace/>} 
   {page==='research'&&<ResearchWorkbench chapters={allChapters} onAdd={openNew}/>} 
   {isEvolution&&<EvolutionWorkspace page={page} onNav={nav}/>} 
   {!['home','my-space','journey','content-library','crystals','sources','transformation','media','research',...evoPageIds].includes(page)&&<Generic/>}
   <AddSourceModal open={editor} onClose={()=>setEditor(false)} onImported={message=>{setNotice(message);setOnline(!message.startsWith('ייבוא נכשל'))}}/>
  </main>
  <button className="crystalLauncher" onClick={()=>setCrystalsOpen(true)} aria-label="פתח את אוסף הקריסטלים"><span>◆</span><b>הקריסטלים שלי</b><em>{crystals.length}</em></button>
  <CrystalCollectionDrawer open={crystalsOpen} onClose={()=>setCrystalsOpen(false)}/>
 </div>;
}
