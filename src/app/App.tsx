import React,{useEffect,useState}from'react';
import{chapters as embeddedChapters}from'../data/chapters-embedded';
import SpiralLibrary from'../features/journey/SpiralLibrary';
import EvolutionWorkspace from'../features/evolution/EvolutionWorkspace';
import TransformationWorkspace from'../features/transformation/TransformationWorkspace';
import{KnowledgeDashboard}from'../features/knowledge-dashboard/KnowledgeDashboard';
import{MediaWorkspace}from'../features/media/MediaWorkspace';
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
import{readText,resetPersonalProgress,storageKeys,writeText}from'../core/storage';

const evoPageIds=evolutionPages as readonly string[];

export default function App(){
 const{page,navigate:nav,back:goBack}=useAppNavigation();
 const[collapsed,setCollapsed]=useState(()=>readText(storageKeys.railCollapsed)==='1');
 const[editor,setEditor]=useState(false);
 const[online,setOnline]=useState(false);
 const[notice,setNotice]=useState('');
 const[crystalsOpen,setCrystalsOpen]=useState(false);
 const[requestedChapter,setRequestedChapter]=useState<number|null>(null);
 const[sourceChapters,setSourceChapters]=useState<Chapter[]>([]);
 const[entered,setEntered]=useState(()=>{try{return sessionStorage.getItem('eil-welcome-entered')==='1'}catch{return false}});
 const{records:crystals}=useCrystalCollection();
 const reviewMode=typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('editor')==='review';

 useEffect(()=>{
  if(reviewMode)return;
  fetch('/api/knowledge?resource=items').then(response=>{setOnline(response.ok)}).catch(()=>setOnline(false));
  fetch('/api/chapters').then(response=>response.ok?response.json():Promise.reject()).then(data=>{
   if(data.total===18&&Array.isArray(data.chapters)){
    setSourceChapters(data.chapters);
   }
  }).catch(()=>{});
 },[reviewMode]);
 useEffect(()=>{if(!reviewMode)writeText(storageKeys.railCollapsed,collapsed?'1':'0')},[collapsed,reviewMode]);
 useEffect(()=>{if(reviewMode)return;return bindLiquidGlassPointerTracking()},[reviewMode]);

 const allChapters=sourceChapters.length===18?sourceChapters:embeddedChapters;
 const openNew=()=>setEditor(true);
 const isEvolution=evoPageIds.includes(page);
 const enterExperience=()=>{try{sessionStorage.setItem('eil-welcome-entered','1')}catch{}setEntered(true);nav('dashboard')};
 const openJourney=(chapterNumber?:number)=>{setRequestedChapter(chapterNumber??null);nav('library')};
 
 
/* ===== PAGE COMPONENTS ===== */

const Crystals=()=>{
 return <div className="simplePage" dir="rtl">
  <h2 className="simplePageTitle">◆ הקריסטלים שלי</h2>
  <p className="simplePageSub">תובנות ששמרת מתוך המסע</p>
  {crystals.length===0?<div className="emptyState"><p>עוד לא שמרת קריסטלים</p><span>כשתקרא פרק ותסמן תובנה — היא תופיע כאן</span></div>:
  <div className="crystalList">{crystals.map(c=><article key={c.fragmentId} className="crystalItem"><div className="crystalItemTitle">{c.topic||'תובנה'}</div><p className="crystalItemText">{c.text}</p><span className="crystalItemSource">{c.sourceLabel} · {c.provenanceLabel}</span></article>)}</div>}
 </div>;
};

const AddLearning=()=>{
 const[text,setText]=React.useState('');
 const[saved,setSaved]=React.useState(false);
 const save=()=>{if(!text.trim())return;const items=JSON.parse(localStorage.getItem('eil-learnings')||'[]');items.unshift({text:text.trim(),date:new Date().toISOString()});localStorage.setItem('eil-learnings',JSON.stringify(items));setSaved(true);setTimeout(()=>{setText('');setSaved(false)},2000)};
 return <div className="simplePage" dir="rtl">
  <h2 className="simplePageTitle">✎ הוסף משהו שלמדת</h2>
  <p className="simplePageSub">כתוב תובנה, מחשבה, או קשר שגילית</p>
  <textarea className="learningInput" value={text} onChange={e=>setText(e.target.value)} placeholder="מה למדת היום?" rows={5}/>
  <button className="primaryBtn" onClick={save} disabled={!text.trim()}>{saved?'✓ נשמר!':'שמור'}</button>
 </div>;
};

const Sources=()=>{
 return <div className="simplePage" dir="rtl">
  <h2 className="simplePageTitle">↗ המקורות שלי</h2>
  <p className="simplePageSub">{allChapters.length} המקורות המלאים שעליהם מבוסס מסע הלימוד</p>
  <div className="sourceList">{allChapters.map(source=><button key={source.number} type="button" className="sourceItem" onClick={()=>openJourney(source.number)} aria-label={`פתח מקור: ${source.title}`}>
   <span className="sourceNum">{String(source.number).padStart(2,'0')}</span>
   <span className="sourceInfo"><span className="sourceName">{source.title}</span><span className="sourceFile">{source.sourceFile}</span></span>
   <span className="sourceOpen" aria-hidden="true">פתח ←</span>
  </button>)}</div>
 </div>;
};

const AddSource=()=>{
 return <div className="simplePage" dir="rtl">
  <h2 className="simplePageTitle">＋ הוסף מקור</h2>
  <p className="simplePageSub">העלה מסמך, מאמר, סרטון או כל חומר גלם</p>
  <button className="primaryBtn" onClick={openNew}>+ העלה מקור / PDF</button>
 </div>;
};

const Settings=()=>{
 const[form,setForm]=React.useState({name:"",email:"",phone:""});
 const[saved,setSaved]=React.useState(false);
 const[resetDone,setResetDone]=React.useState(false);
 const[settingsError,setSettingsError]=React.useState('');
 React.useEffect(()=>{
 try{const s=JSON.parse(localStorage.getItem("eil-settings")||"{}");
 setForm(f=>({...f,...s}));}catch{}
 },[]);
 const save=()=>{
 try{localStorage.setItem("eil-settings",JSON.stringify(form));setSettingsError('');setSaved(true);setTimeout(()=>setSaved(false),2000)}
 catch{setSaved(false);setSettingsError('לא ניתן היה לשמור את ההגדרות בדפדפן.')}
 };
 const reset=()=>{
 if(!window.confirm("האם אתה בטוח? פעולה זו תמחק את כל ההתקדמות שלך."))return;
 resetPersonalProgress();
 setResetDone(true);setTimeout(()=>window.location.reload(),900);
 };
 const field=(label:string,key:"name"|"email"|"phone",type="text")=>
 <div className="settingField">
 <label className="settingLabel" htmlFor={`setting-${key}`}>{label}</label>
 <input id={`setting-${key}`} className="settingInput" type={type} value={form[key]}
 onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/>
 </div>;
 return <div className="simplePage" dir="rtl">
 <h2 className="simplePageTitle">⚙ הגדרות</h2>
 <div className="settingForm">
 {field("שם מלא","name")}
 {field("אימייל","email","email")}
 {field("טלפון","phone","tel")}
 <button className="primaryBtn" onClick={save}>
 {saved?"✓ נשמר!":"שמור הגדרות"}
 </button>
 {settingsError&&<p className="formError" role="alert">{settingsError}</p>}
 <div className="settingDivider"/>
 <h3 className="settingDangerTitle">אזור מסוכן</h3>
 <button className="dangerBtn" onClick={reset}>
 {resetDone?"✓ ההתקדמות אופסה":"🗑 אפס התקדמות"}
 </button>
 {resetDone&&<p className="settingStatus" role="status">הנתונים המקומיים אופסו. האפליקציה נטענת מחדש…</p>}
 <p className="settingDangerNote">מוחק: קריסטלים, תובנות, התקדמות. לא ניתן לשחזר.</p>
 </div>
 </div>;
};

const Generic=()=><div className="simplePage" dir="rtl">
 <h2 className="simplePageTitle">{pageByNavigationId(page).label}</h2>
 <p className="muted">דף זה בפיתוח.</p>
</div>;

 if(reviewMode)return <><LiquidGlassFilter/><ReviewConsole/></>;
 if(!entered)return <><LiquidGlassFilter/><WelcomeScreen onStart={enterExperience}/></>;

 return <><LiquidGlassFilter/><div className="app">
  <DesktopNavigation page={page} onNavigate={nav} onAdd={openNew} collapsed={collapsed} onCollapsedChange={setCollapsed} online={online}/>
  <MobileNavigation page={page} onNavigate={nav} onAdd={openNew} online={online}/>
  <main>
   {page!=='dashboard'&&<div className="pageBack"><button onClick={goBack}>→ חזרה</button></div>}
   {notice&&<div className="notice" role="status"><span>{notice}</span><button type="button" aria-label="סגור הודעה" onClick={()=>setNotice('')}>×</button></div>}
   {page==='dashboard'&&(
    <KnowledgeDashboard onOpenJourney={openJourney}/>
   )}
   {page==='crystals'&&<Crystals/>}
   {page==='add-learning'&&<AddLearning/>}
   {page==='sources'&&<Sources/>}
   {page==='add-source'&&<AddSource/>}
   {page==='settings'&&<Settings/>}
   {page==='library'&&<SpiralLibrary chapters={allChapters} initialChapter={requestedChapter} onInitialChapterOpened={()=>setRequestedChapter(null)}/>}
   {page==='transformation'&&<TransformationWorkspace chapters={allChapters}/>} 
   {page==='media'&&<MediaWorkspace/>} 
   {isEvolution&&<EvolutionWorkspace page={page} onNav={nav}/>} 
   {!['dashboard','library','sources','transformation','media','crystals','add-learning','add-source','settings',...evoPageIds].includes(page)&&<Generic/>}
   <AddSourceModal open={editor} onClose={()=>setEditor(false)} onImported={setNotice}/>
  </main>
  <button className="crystalLauncher" onClick={()=>setCrystalsOpen(true)} aria-label="פתח את אוסף הקריסטלים"><span>◆</span><b>הקריסטלים שלי</b><em>{crystals.length}</em></button>
  <CrystalCollectionDrawer open={crystalsOpen} onClose={()=>setCrystalsOpen(false)}/>
 </div></>;
}
