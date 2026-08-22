import React,{useEffect,useState}from'react';
import{chapters as embeddedChapters}from'../data/chapters-embedded';
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
import{readText,resetJourneyProgress,storageKeys,writeText}from'../core/storage';

const fallback:Chapter[]=embeddedChapters.map((chapter:any)=>({
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
 const[requestedChapter,setRequestedChapter]=useState<number|null>(null);
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

 const allChapters=sourceChapters.length===18?sourceChapters:embeddedChapters;
 const openNew=()=>setEditor(true);
 const current=pageByNavigationId(page);
 const isEvolution=evoPageIds.includes(page);
 const enterExperience=()=>{try{sessionStorage.setItem('eil-welcome-entered','1')}catch{}setEntered(true);nav('dashboard')};
 const openChapterFromResearch=(chapterNumber:number)=>{setRequestedChapter(chapterNumber);nav('library')};
 const Header=({title,sub}:{title:string;sub?:string})=><div className="pageTitle"><div><span className="eyebrow">E.I.L</span><h1>{title}</h1>{sub&&<p>{sub}</p>}</div></div>;
 
 
/* ===== PAGE COMPONENTS ===== */

const Crystals=()=>{
 const saved=useCrystals();
 return <div className="simplePage" dir="rtl">
  <h2 className="simplePageTitle">◆ הקריסטלים שלי</h2>
  <p className="simplePageSub">תובנות ששמרת מתוך המסע</p>
  {saved.length===0?<div className="emptyState"><p>עוד לא שמרת קריסטלים</p><span>כשתקרא פרק ותסמן תובנה — היא תופיע כאן</span></div>:
  <div className="crystalList">{saved.map((c:any,i:number)=><div key={i} className="crystalItem"><div className="crystalItemTitle">{c.topic||c.title||'תובנה'}</div><p className="crystalItemText">{c.text||c.summary}</p><span className="crystalItemSource">{c.sourceLabel||''}</span></div>)}</div>}
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
 const srcs=[
  {num:1,name:'פרק 1 — התבוננות',file:'מי_אני_פרק1_v6.docx'},
  {num:2,name:'פרק 2 — הכלי החיצוני',file:'פרק2_הכלי_החיצוני.docx'},
  {num:3,name:'פרק 3 — הפלא ההנדסי',file:'פרק3_הפלא_ההנדסי.docx'},
  {num:4,name:'פרק 4 — מערכת ההפעלה',file:'פרק4_מערכת_ההפעלה.docx'},
  {num:5,name:'פרק 5 — המוח המפורט',file:'פרק5_המוח_המפורט.docx'},
  {num:6,name:'פרק 6 — גלי המוח',file:'פרק6_גלי_המוח.docx'},
  {num:7,name:'פרק 7 — בלוטת האצטרובל',file:'פרק7_בלוטת_האצטרובל.docx'},
  {num:8,name:'פרק 8 — תדרים ומוזיקה',file:'פרק8_תדרים_מוזיקה_וצליל.docx'},
  {num:9,name:'פרק 9 — הגוף כתדר',file:'פרק9_הגוף_כתדר.docx'},
  {num:10,name:'פרק 10 — נוירופלסטיות',file:'פרק10_נוירופלסטיות.docx'},
  {num:11,name:'פרק 11 — זהויות ואמונות',file:'פרק11_זהויות_ואמונות.docx'},
  {num:12,name:'פרק 12 — רגשות כמידע',file:'פרק12_רגשות_כמידע.docx'},
  {num:13,name:'פרק 13 — יצירת מציאות',file:'פרק13_יצירת_מציאות.docx'},
  {num:14,name:'פרק 14 — 12 חוקי היקום',file:'פרק14_12_חוקי_היקום.docx'},
  {num:15,name:'פרק 15 — יעדים וחזון',file:'פרק15_יעדים_וחזון.docx'},
  {num:16,name:'פרק 16 — סבל וקושי',file:'פרק16_סבל_קושי_ומשמעות.docx'},
  {num:17,name:'פרק 17 — חיבור הכל',file:'פרק17_חיבור_הכל.docx'},
  {num:18,name:'פרק 18 — מי אני? תשובה',file:'פרק18_מי_אני_תשובה.docx'},
 ];
 return <div className="simplePage" dir="rtl">
  <h2 className="simplePageTitle">↗ המקורות שלי</h2>
  <p className="simplePageSub">18 המסמכים שהועלו לפלטפורמה</p>
  <div className="sourceList">{srcs.map(s=><div key={s.num} className="sourceItem">
   <span className="sourceNum">{String(s.num).padStart(2,'0')}</span>
   <div className="sourceInfo"><div className="sourceName">{s.name}</div><div className="sourceFile">{s.file}</div></div>
  </div>)}</div>
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
 const[form,setForm]=React.useState({name:'',email:'',phone:''});
 const[resetDone,setResetDone]=React.useState(false);
 React.useEffect(()=>{try{const s=JSON.parse(localStorage.getItem('eil-settings')||'{}');setForm(f=>({...f,...s}))}catch{};},[]);
 const save=()=>{localStorage.setItem('eil-settings',JSON.stringify(form));alert('נשמר ✓')};
 const reset=()=>{if(!window.confirm('האם אתה בטוח?'))return;resetJourneyProgress();setResetDone(true)};
 const field=(label:string,key:'name'|'email'|'phone',type='text')=><div className="settingField"><label className="settingLabel">{label}</label><input className="settingInput" type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/></div>;
 return <div className="simplePage" dir="rtl">
  <h2 className="simplePageTitle">⚙ הגדרות</h2>
  <div className="settingForm">
   {field('שם מלא','name')}
   {field('אימייל','email','email')}
   {field('טלפון','phone','tel')}
   <button className="primaryBtn" onClick={save}>שמור הגדרות</button>
   <button className="dangerBtn" type="button" onClick={reset}>אפס התקדמות</button>
   {resetDone&&<p className="settingStatus" role="status">ההתקדמות אופסה.</p>}
  </div>
 </div>;
};

const Research=()=>{
 const[q,setQ]=React.useState("");
 const needle=q.trim().toLowerCase();
 const results=needle.length>2
 ?embeddedChapters.flatMap(ch=>
 ch.paragraphs
 .filter(p=>!p.startsWith("##")&&p.toLowerCase().includes(needle))
 .slice(0,3)
 .map(p=>({ch,text:p})))
 :[];
 const highlight=(text:string)=>{
 const idx=text.toLowerCase().indexOf(needle);
 if(idx<0||!needle)return <span>{text}</span>;
 return <span>{text.slice(0,idx)}<mark className="searchMark">{text.slice(idx,idx+needle.length)}</mark>{text.slice(idx+needle.length)}</span>;
 };
 return <div className="simplePage" dir="rtl">
 <h2 className="simplePageTitle">⌕ חקירה</h2>
 <input className="searchInput" value={q} onChange={e=>setQ(e.target.value)}
 placeholder={`חפש בין ${embeddedChapters.reduce((a,c)=>a+c.paragraphCount,0)} הפסקאות...`}/>
 {needle.length>2&&<p className="searchCount">{results.length>0?`נמצאו ${results.length} תוצאות`:`לא נמצאו תוצאות ל-"${q}" — נסה מילה אחרת`}</p>}
 <div className="searchResults">
 {results.map((r,i)=><button key={i} className="searchResult"
 onClick={()=>nav("library")}>
 <div className="searchResultChapter">פרק {r.ch.number} — {r.ch.title}</div>
 <div className="searchResultText">{highlight(r.text)}</div>
 </button>)}
 </div>
 </div>;
};

const Generic=()=><div className="simplePage" dir="rtl">
 <h2 className="simplePageTitle">{pageByNavigationId(page).label}</h2>
 <p className="muted">דף זה בפיתוח.</p>
</div>;

function useCrystals(){
 const[items,setItems]=React.useState<any[]>([]);
 React.useEffect(()=>{try{const s=JSON.parse(localStorage.getItem('eil-crystals')||'[]');setItems(s)}catch{};},[]);
 return items;
}


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
   {page==='crystals'&&<Crystals/>}
   {page==='add-learning'&&<AddLearning/>}
   {page==='sources'&&<Sources/>}
   {page==='add-source'&&<AddSource/>}
   {page==='research'&&<Research/>}
   {page==='settings'&&<Settings/>}
   {page==='library'&&<SpiralLibrary chapters={allChapters} query={q} setQuery={setQ} corpusReady={corpusReady} paragraphs={corpusStats.paragraphs} characters={corpusStats.characters} initialChapter={requestedChapter} onInitialChapterOpened={()=>setRequestedChapter(null)}/>}
   {page==='transformation'&&<TransformationWorkspace chapters={allChapters}/>} 
   {page==='media'&&<MediaWorkspace/>} 
   {isEvolution&&<EvolutionWorkspace page={page} onNav={nav}/>} 
   {!['dashboard','library','sources','transformation','media','research','crystals','add-learning','add-source','settings',...evoPageIds].includes(page)&&<Generic/>}
   <AddSourceModal open={editor} onClose={()=>setEditor(false)} onImported={message=>{setNotice(message);setOnline(!message.startsWith('ייבוא נכשל'))}}/>
  </main>
  <button className="crystalLauncher" onClick={()=>setCrystalsOpen(true)} aria-label="פתח את אוסף הקריסטלים"><span>◆</span><b>הקריסטלים שלי</b><em>{crystals.length}</em></button>
  <CrystalCollectionDrawer open={crystalsOpen} onClose={()=>setCrystalsOpen(false)}/>
 </div></>;
}
