import React,{useEffect,useState}from'react';
import{chapters as embeddedChapters}from'../data/chapters-embedded';
import{KnowledgeDashboard}from'../features/knowledge-dashboard/KnowledgeDashboard';
import{DesktopNavigation,MobileNavigation}from'../features/navigation/NavigationShell';
import{useAppNavigation}from'../features/navigation/useAppNavigation';
import{isKnownNavigation,isOwnerOnlyNavigation}from'../features/navigation/navigation.config';
import{useCrystalCollection}from'../features/crystals/model/useCrystalCollection';
import type{JourneyLayerId}from'../features/journey/model/journey-layers';
import{WelcomeScreen}from'../features/welcome/WelcomeScreen';
import{LiquidGlassFilter}from'../design/primitives/LiquidGlassFilter';
import{bindLiquidGlassPointerTracking}from'../design/glass/runtime';
import type{Chapter}from'../core/types';
import{journeyStorage,readJson,readText,resetPersonalProgress,storageKeys,writeJson,writeText}from'../core/storage';

const SpiralLibrary=React.lazy(()=>import('../features/journey/SpiralLibrary'));
const AddSourceModal=React.lazy(()=>import('../features/sources/AddSourceModal').then(module=>({default:module.AddSourceModal})));
const PublicSourceDocument=React.lazy(()=>import('../features/sources/PublicSourceDocument').then(module=>({default:module.PublicSourceDocument})));
const CrystalCollectionDrawer=React.lazy(()=>import('../features/crystals/CrystalCollectionDrawer').then(module=>({default:module.CrystalCollectionDrawer})));
const ReviewConsole=React.lazy(()=>import('../features/editor/ReviewConsole').then(module=>({default:module.ReviewConsole})));

const RouteLoading=()=> <div className="routeLoading" role="status" aria-live="polite"><span>טוען את המרחב…</span></div>;
type PublicSourceSummary={id:string;type:string;title:string;author?:string|null;original_uri?:string|null;mime_type?:string|null;metadata?:Record<string,unknown>|null;created_at?:string|null;fragment_count?:number};
type SettingsForm={name:string;email:string;phone:string};

export default function App(){
 const{page,navigate:nav,replace:replaceNav,back:goBack}=useAppNavigation();
 const owner=journeyStorage.mode()==='owner';
 const activePage=isKnownNavigation(page)&&(owner||!isOwnerOnlyNavigation(page))?page:'dashboard';
 const[collapsed,setCollapsed]=useState(()=>readText(storageKeys.railCollapsed)==='1');
 const[editor,setEditor]=useState(false);
 const[online,setOnline]=useState(false);
 const[notice,setNotice]=useState('');
 const[crystalsOpen,setCrystalsOpen]=useState(false);
 const[requestedSourceNumber,setRequestedSourceNumber]=useState<number|null>(null);
 const[requestedLayer,setRequestedLayer]=useState<JourneyLayerId|null>(null);
 const[sourceChapters,setSourceChapters]=useState<Chapter[]>([]);
 const[publicSources,setPublicSources]=useState<PublicSourceSummary[]>([]);
 const[selectedPublicSourceId,setSelectedPublicSourceId]=useState<string|null>(null);
 const[entered,setEntered]=useState(()=>{try{return sessionStorage.getItem('eil-welcome-entered')==='1'}catch{return false}});
 const{records:crystals}=useCrystalCollection();
 const reviewMode=typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('editor')==='review';

 useEffect(()=>{
  if(reviewMode)return;
  fetch('/api/sources',{headers:{Accept:'application/json'}}).then(async response=>{
   setOnline(response.ok);
   if(!response.ok)throw new Error(`HTTP ${response.status}`);
   const data=await response.json();
   if(Array.isArray(data.sources))setPublicSources(data.sources.filter((source:any)=>source?.id&&source?.title));
  }).catch(()=>setOnline(false));
  fetch('/api/chapters').then(response=>response.ok?response.json():Promise.reject()).then(data=>{
   if(data.total===18&&Array.isArray(data.chapters))setSourceChapters(data.chapters);
  }).catch(()=>{});
 },[reviewMode]);
 useEffect(()=>{if(!reviewMode)writeText(storageKeys.railCollapsed,collapsed?'1':'0')},[collapsed,reviewMode]);
 useEffect(()=>{if(reviewMode)return;return bindLiquidGlassPointerTracking()},[reviewMode]);
 useEffect(()=>{if(!reviewMode&&page!==activePage)replaceNav(activePage)},[activePage,page,replaceNav,reviewMode]);
 useEffect(()=>{if(activePage!=='sources'&&selectedPublicSourceId)setSelectedPublicSourceId(null)},[activePage,selectedPublicSourceId]);

 // The curated 18-item foundation remains a learner presentation layer. Canonical
 // source truth and newly published material come from the API and are never
 // replaced or mutated by this frontend representation.
 const journeyChapters=embeddedChapters;
 const sourceCatalogue=sourceChapters.length===18?sourceChapters:embeddedChapters;
 const seedSourceFiles=new Set(sourceCatalogue.map(source=>source.sourceFile));
 const publishedExtraSources=publicSources.filter(source=>{
  const metadata=source.metadata||{},sourceFile=typeof metadata.sourceFile==='string'?metadata.sourceFile:'';
  return metadata.ingestion!=='repository-corpus-bootstrap-v1'&&!seedSourceFiles.has(sourceFile);
 });
 const openNew=()=>{if(!owner){setNotice('העלאת מקור זמינה במצב יוצר בלבד.');return}setEditor(true)};
 const enterExperience=()=>{try{sessionStorage.setItem('eil-welcome-entered','1')}catch{}setEntered(true);nav('dashboard')};
 const openJourney=(layerId?:JourneyLayerId)=>{setSelectedPublicSourceId(null);setRequestedSourceNumber(null);setRequestedLayer(layerId??null);nav('library')};
 const openSource=(sourceNumber:number)=>{setSelectedPublicSourceId(null);setRequestedLayer(null);setRequestedSourceNumber(sourceNumber);nav('library')};

 const Sources=()=>{
  if(selectedPublicSourceId)return <React.Suspense fallback={<RouteLoading/>}><PublicSourceDocument sourceId={selectedPublicSourceId} onBack={()=>setSelectedPublicSourceId(null)}/></React.Suspense>;
  const totalSources=sourceCatalogue.length+publishedExtraSources.length;
  return <div className="simplePage sourceLibraryPage" dir="rtl">
   <h2 className="simplePageTitle">↗ המקורות שלי</h2>
   <p className="simplePageSub">{totalSources} מקורות מלאים שפורסמו ללומדים ושעליהם מבוסס הידע באתר</p>
   <section className="sourceLibrarySection" aria-labelledby="foundation-sources-title">
    <div className="sourceLibrarySectionHead"><div><span>FOUNDATION SOURCES</span><h3 id="foundation-sources-title">מקורות היסוד</h3></div><b>{sourceCatalogue.length}</b></div>
    <div className="sourceList">{sourceCatalogue.map(source=><button key={source.number} type="button" className="sourceItem" onClick={()=>openSource(source.number)} aria-label={`פתח מקור: ${source.title}`}>
     <span className="sourceNum">{String(source.number).padStart(2,'0')}</span>
     <span className="sourceInfo"><span className="sourceName">{source.title}</span><span className="sourceFile">{source.sourceFile}</span></span>
     <span className="sourceOpen" aria-hidden="true">פתח ←</span>
    </button>)}</div>
   </section>
   {publishedExtraSources.length>0&&<section className="sourceLibrarySection sourceLibrarySection--published" aria-labelledby="published-sources-title">
    <div className="sourceLibrarySectionHead"><div><span>NEW PUBLISHED SOURCES</span><h3 id="published-sources-title">מקורות חדשים שפורסמו</h3></div><b>{publishedExtraSources.length}</b></div>
    <p className="sourceLibraryHint">מקורות שעברו קליטה, בדיקה ופרסום מפורש. לחיצה פותחת את חומר המקור הקנוני המלא.</p>
    <div className="sourceList">{publishedExtraSources.map(source=>{
     const metadata=source.metadata||{},sourceFile=typeof metadata.sourceFile==='string'?metadata.sourceFile:source.original_uri||source.mime_type||source.type;
     return <button key={source.id} type="button" className="sourceItem sourceItem--published" onClick={()=>setSelectedPublicSourceId(source.id)} aria-label={`פתח מקור שפורסם: ${source.title}`}>
      <span className="sourceNum sourceNum--published">חדש</span>
      <span className="sourceInfo"><span className="sourceName">{source.title}</span><span className="sourceFile">{sourceFile}{source.fragment_count?` · ${source.fragment_count} קטעים`:''}</span></span>
      <span className="sourceOpen" aria-hidden="true">מקור ←</span>
     </button>;
    })}</div>
   </section>}
  </div>;
 };

 const AddSource=()=> <div className="simplePage" dir="rtl">
  <h2 className="simplePageTitle">＋ הוסף מקור</h2>
  <p className="simplePageSub">העלה מסמך, מאמר, תמונה, קישור או חומר גלם אחר למסלול הקליטה והבדיקה.</p>
  <button className="primaryBtn" onClick={openNew}>+ העלה מקור</button>
 </div>;

 const Settings=()=>{
  const[form,setForm]=React.useState<SettingsForm>({name:'',email:'',phone:''});
  const[saved,setSaved]=React.useState(false);
  const[resetDone,setResetDone]=React.useState(false);
  const[settingsError,setSettingsError]=React.useState('');
  React.useEffect(()=>{setForm(current=>({...current,...readJson<Partial<SettingsForm>>(storageKeys.settings,{})}))},[]);
  const save=()=>{
   if(writeJson(storageKeys.settings,form)){setSettingsError('');setSaved(true);setTimeout(()=>setSaved(false),2000)}
   else{setSaved(false);setSettingsError('לא ניתן היה לשמור את ההגדרות בדפדפן.')}
  };
  const reset=()=>{
   if(!window.confirm('האם אתה בטוח? פעולה זו תמחק את כל ההתקדמות שלך.'))return;
   resetPersonalProgress();
   setResetDone(true);setTimeout(()=>window.location.reload(),900);
  };
  const field=(label:string,key:keyof SettingsForm,type='text')=> <div className="settingField">
   <label className="settingLabel" htmlFor={`setting-${key}`}>{label}</label>
   <input id={`setting-${key}`} className="settingInput" type={type} value={form[key]} onChange={e=>setForm(current=>({...current,[key]:e.target.value}))}/>
  </div>;
  return <div className="simplePage" dir="rtl">
   <h2 className="simplePageTitle">⚙ הגדרות</h2>
   <div className="settingForm">
    {field('שם מלא','name')}{field('אימייל','email','email')}{field('טלפון','phone','tel')}
    <button className="primaryBtn" onClick={save}>{saved?'✓ נשמר!':'שמור הגדרות'}</button>
    {settingsError&&<p className="formError" role="alert">{settingsError}</p>}
    <div className="settingDivider"/>
    <h3 className="settingDangerTitle">אזור מסוכן</h3>
    <button className="dangerBtn" onClick={reset}>{resetDone?'✓ ההתקדמות אופסה':'🗑 אפס התקדמות'}</button>
    {resetDone&&<p className="settingStatus" role="status">הנתונים המקומיים אופסו. האפליקציה נטענת מחדש…</p>}
    <p className="settingDangerNote">מוחק קריסטלים והתקדמות מקומית. לא ניתן לשחזר.</p>
   </div>
  </div>;
 };

 if(reviewMode)return <><LiquidGlassFilter/><React.Suspense fallback={<RouteLoading/>}><ReviewConsole/></React.Suspense></>;
 if(!entered)return <><LiquidGlassFilter/><WelcomeScreen onStart={enterExperience}/></>;

 return <><LiquidGlassFilter/><div className="app">
  <DesktopNavigation page={activePage} onNavigate={nav} onAdd={openNew} collapsed={collapsed} onCollapsedChange={setCollapsed} online={online}/>
  <MobileNavigation page={activePage} onNavigate={nav} onAdd={openNew} online={online}/>
  <main>
   {activePage!=='dashboard'&&<div className="pageBack"><button onClick={goBack}>→ חזרה</button></div>}
   {notice&&<div className="notice" role="status"><span>{notice}</span><button type="button" aria-label="סגור הודעה" onClick={()=>setNotice('')}>×</button></div>}
   {activePage==='dashboard'&&<KnowledgeDashboard onOpenJourney={openJourney}/>}
   {activePage==='sources'&&<Sources/>}
   {activePage==='add-source'&&<AddSource/>}
   {activePage==='settings'&&<Settings/>}
   <React.Suspense fallback={<RouteLoading/>}>
    {activePage==='review'&&<ReviewConsole/>}
    {activePage==='library'&&<SpiralLibrary
     chapters={journeyChapters}
     initialSourceNumber={requestedSourceNumber}
     initialLayer={requestedLayer}
     onInitialSourceOpened={()=>setRequestedSourceNumber(null)}
     onInitialLayerOpened={()=>setRequestedLayer(null)}
     onSourceClosed={()=>nav('sources')}
    />}
   </React.Suspense>
   {owner&&editor&&<React.Suspense fallback={null}><AddSourceModal open onClose={()=>setEditor(false)} onImported={setNotice}/></React.Suspense>}
  </main>
  <button className="crystalLauncher" onClick={()=>setCrystalsOpen(true)} aria-label="פתח את אוסף הקריסטלים"><span>◆</span><b>הקריסטלים שלי</b><em>{crystals.length}</em></button>
  {crystalsOpen&&<React.Suspense fallback={null}><CrystalCollectionDrawer open onClose={()=>setCrystalsOpen(false)}/></React.Suspense>}
 </div></>;
}
