import React,{useEffect,useState}from'react';
import{useLearningProgress}from'./model/useLearningProgress';
import{journeyPath}from'./model/journey-stage';
import{JOURNEY_LAYERS,isJourneyLayerId,journeyLayerForChapter}from'./model/journey-layers';
import type{JourneyLayerId}from'./model/journey-layers';
import type{LearningStage}from'../../core/learning-path/learning-path.types';
import{getPilotCardChapter}from'./data/pilot-card-script';
import{LearningCardReader}from'./LearningCardReader';
import{usePublishedLearningCards}from'./model/usePublishedLearningCards';
import{usePublishedLearningUnits}from'./model/usePublishedLearningUnits';
import type{PublishedLearningUnit}from'./model/usePublishedLearningUnits';
import type{LearningCardChapter}from'./model/learning-card.types';

type Chapter={number:number;title:string;subtitle:string;sourceFile:string;paragraphs:string[];paragraphCount?:number;characterCount?:number};
type Props={
  chapters:Chapter[];
  initialChapter?:number|null;
  initialSourceNumber?:number|null;
  initialLayer?:JourneyLayerId|null;
  onInitialChapterOpened?:()=>void;
  onInitialSourceOpened?:()=>void;
  onInitialLayerOpened?:()=>void;
  onSourceClosed?:()=>void;
};

type JourneyLayer=typeof JOURNEY_LAYERS[number];

function clean(text:string){return text.replace(/^פרק\s*\d+[:：]?\s*/,'')}
function stageForNum(num:number):LearningStage|undefined{return journeyPath.stages.find(stage=>stage.order===num)}

function ChapterCard({chapter,displayTitle,unlocked,completed,onClick}:{chapter:Chapter;displayTitle?:string;unlocked:boolean;completed:boolean;onClick:()=>void}){
  return <button type="button" className={`spiralCard${completed?' spiralCard--done':''}${!unlocked?' spiralCard--locked':''}`} onClick={onClick} disabled={!unlocked} aria-label={`${completed?'הושלם: ':''}${displayTitle??clean(chapter.title)}`}>
    <span className="spiralCardNum">פרק {String(chapter.number).padStart(2,'0')}</span>
    <span className="spiralCardBody"><span className="spiralCardTitle">{displayTitle??clean(chapter.title)}</span>{completed&&<span className="spiralCardStatus">✓ הושלם</span>}</span>
    <span className="spiralCardIcon" aria-hidden="true">←</span>
  </button>;
}

function PublishedUnitCard({unit,onClick}:{unit:PublishedLearningUnit;onClick:()=>void}){
  return <button type="button" className="spiralCard publishedUnitCard" onClick={onClick}>
    <span className="spiralCardNum publishedUnitBadge">חדש</span>
    <span className="spiralCardBody"><span className="spiralCardTitle">{unit.title}</span><span className="publishedUnitMeta">{unit.cardCount} כרטיסים</span></span>
    <span className="spiralCardIcon" aria-hidden="true">←</span>
  </button>;
}

function ChapterView({chapter,layer,onBack,onComplete,onPrevious,canGoPrevious,isFinal,sourceOnly=false}:{chapter:Chapter;layer:JourneyLayer;onBack:()=>void;onComplete:()=>void;onPrevious?:()=>void;canGoPrevious:boolean;isFinal:boolean;sourceOnly?:boolean}){
  const stage=stageForNum(chapter.number);
  return <div className="spiralChapter" dir="rtl">
    <div className="learningJourneyTopbar"><button className="spiralBack" type="button" onClick={onBack}>{sourceOnly?'→ חזרה למקורות':'→ חזרה למסע'}</button><span className="learningJourneyLayer">{sourceOnly?'תצוגת מקור':layer.shortLabel}</span></div>
    <header className="spiralChapterHeader"><span className="spiralChapterNum">פרק {String(chapter.number).padStart(2,'0')}</span><div><h1 className="spiralChapterTitle">{clean(chapter.title)}</h1>{chapter.subtitle&&<p className="spiralChapterSub">{chapter.subtitle}</p>}</div></header>
    {!sourceOnly&&stage?.guidingQuestion&&<section className="spiralQuestion"><span className="spiralQuestionLabel">השאלה שמובילה את הפרק</span><p>{stage.guidingQuestion}</p>{layer.why&&<details className="learningWhy"><summary>למה זה מגיע עכשיו?</summary><p>{layer.why}</p></details>}</section>}
    <article className="spiralContent">{chapter.paragraphs.map((text,index)=>{
      const value=text.trim();
      if(!value)return null;
      if(value.startsWith('##TITLE##'))return <h1 key={index} className="chTitle">{value.replace('##TITLE##','').trim()}</h1>;
      if(value.startsWith('##SUBTITLE##'))return <p key={index} className="chSubtitle">{value.replace('##SUBTITLE##','').trim()}</p>;
      if(value.startsWith('##SECTION##'))return <h2 key={index} className="chSection">{value.replace('##SECTION##','').trim()}</h2>;
      if(value.startsWith('##QUESTION##'))return <div key={index} className="chQuestion">{value.replace('##QUESTION##','').trim()}</div>;
      if(value.startsWith('##HIGHLIGHT##'))return <div key={index} className="chHighlight">{value.replace('##HIGHLIGHT##','').trim()}</div>;
      if(value.startsWith('##BIG##'))return <div key={index} className="chBig">{value.replace('##BIG##','').trim()}</div>;
      if(value.startsWith('##GROUP##'))return <div key={index} className="chGroup">{value.replace('##GROUP##','').trim()}</div>;
      if(value.startsWith('##SYSTEM##'))return <div key={index} className="chSystem"><span className="chSystemDot" aria-hidden="true"/><span>{value.replace('##SYSTEM##','').trim()}</span></div>;
      if(value.startsWith('##WINK##'))return <div key={index} className="chWink">{value.replace('##WINK##','').trim()}</div>;
      if((/^פרק\s*\d+/u.test(value)||/^\d+\.\s+/u.test(value))&&value.length<120)return <h3 key={index} className="spiralContentH3">{value}</h3>;
      if(/^[-•✓→]/u.test(value))return <div className="spiralBullet" key={index}><span aria-hidden="true">•</span><p>{value.replace(/^[-•✓→]\s*/u,'')}</p></div>;
      return <p key={index} className="spiralPara">{value}</p>;
    })}</article>
    {!sourceOnly&&<nav className="spiralChapterNav" aria-label="ניווט בין פרקים"><button className="spiralChapterNavBtn" type="button" onClick={onPrevious} disabled={!canGoPrevious}>→ הפרק הקודם</button><button className="spiralComplete spiralChapterComplete" type="button" onClick={onComplete}>{isFinal?'סיימתי את המסע':'סיימתי — לפרק הבא ←'}</button></nav>}
  </div>;
}

function ChapterExperience({chapter,layer,onBack,onComplete,onPrevious}:{chapter:Chapter;layer:JourneyLayer;onBack:()=>void;onComplete:()=>void;onPrevious?:()=>void}){
  const published=usePublishedLearningCards(chapter.number),pilot=getPilotCardChapter(chapter.number),stage=stageForNum(chapter.number);
  if(published.loading&&!pilot)return <div className="spiralChapter journeyCardsLoading" dir="rtl"><div className="learningJourneyTopbar"><button className="spiralBack" type="button" onClick={onBack}>→ חזרה למסע</button><span className="learningJourneyLayer">{layer.shortLabel}</span></div><p>טוען את הכרטיסיות…</p></div>;
  const combinedCards=[...(pilot?.cards||[]),...published.cards].map((card,index)=>({...card,order:index+1}));
  const cardChapter:LearningCardChapter|null=combinedCards.length?{
    chapterNumber:chapter.number,
    title:pilot?.title??clean(chapter.title),
    subtitle:pilot?.subtitle??chapter.subtitle,
    guidingQuestion:pilot?.guidingQuestion??stage?.guidingQuestion??'מה חשוב להבין בפרק הזה?',
    whyHere:pilot?.whyHere??layer.why,
    sourceFile:pilot?.sourceFile??chapter.sourceFile,
    cards:combinedCards,
  }:null;
  if(cardChapter)return <LearningCardReader chapter={cardChapter} layerLabel={layer.shortLabel} onBack={onBack} onComplete={onComplete} onPreviousChapter={onPrevious}/>;
  return <ChapterView chapter={chapter} layer={layer} onBack={onBack} onComplete={onComplete} onPrevious={onPrevious} canGoPrevious={Boolean(onPrevious)} isFinal={chapter.number===18}/>;
}

function DynamicUnitExperience({unit,onBack}:{unit:PublishedLearningUnit;onBack:()=>void}){
  const published=usePublishedLearningCards(unit.key);
  const top=<div className="learningJourneyTopbar"><button className="spiralBack" type="button" onClick={onBack}>→ חזרה למסע</button><span className="learningJourneyLayer">נושא חדש</span></div>;
  if(published.loading)return <div className="spiralChapter journeyCardsLoading" dir="rtl">{top}<p>טוען את הכרטיסיות…</p></div>;
  if(published.error)return <div className="spiralChapter journeyCardsLoading" dir="rtl">{top}<p className="formError" role="alert">לא הצלחנו לטעון את הכרטיסיות כרגע.</p></div>;
  if(!published.cards.length)return <div className="spiralChapter journeyCardsLoading" dir="rtl">{top}<p>אין כרגע כרטיסיות זמינות בנושא הזה.</p></div>;
  const chapter:LearningCardChapter={unitKey:unit.key,displayNumber:'חדש',title:unit.title,subtitle:`${unit.cardCount} כרטיסים`,guidingQuestion:'מה אפשר לקחת מהנושא הזה אל המסע שלך?',whyHere:'הנושא הזה מרחיב את המסע ומוסיף נקודת מבט חדשה שאפשר לחבר למה שכבר למדת.',sourceFile:'',cards:published.cards};
  return <LearningCardReader chapter={chapter} layerLabel="נושא חדש" onBack={onBack} onComplete={onBack} backLabel="→ חזרה למסע" completionLabel="סיימתי — חזרה למסע"/>;
}

export default function SpiralLibrary({chapters,initialChapter,initialSourceNumber,initialLayer,onInitialChapterOpened,onInitialSourceOpened,onInitialLayerOpened,onSourceClosed}:Props){
  const learning=useLearningProgress(journeyPath);
  const publishedUnits=usePublishedLearningUnits();
  const[activeNum,setActiveNum]=useState<number|null>(null);
  const[activeSourceNum,setActiveSourceNum]=useState<number|null>(null);
  const[activeDynamicUnitKey,setActiveDynamicUnitKey]=useState<string|null>(null);
  const[openLayer,setOpenLayer]=useState<JourneyLayerId|''>('A');
  const unlocked=(_num:number)=>true;
  const completed=(num:number)=>{const stage=stageForNum(num);return stage?learning.state.completedStageIds.includes(stage.id):false};
  const dynamicUnits=publishedUnits.units.filter(unit=>unit.legacyChapterNumber===null);

  useEffect(()=>{if(!initialChapter)return;const targetLayer=journeyLayerForChapter(initialChapter);setActiveDynamicUnitKey(null);setActiveSourceNum(null);if(targetLayer)setOpenLayer(targetLayer.id);setActiveNum(initialChapter);onInitialChapterOpened?.()},[initialChapter]);
  useEffect(()=>{if(!initialSourceNumber)return;setActiveDynamicUnitKey(null);setActiveNum(null);setActiveSourceNum(initialSourceNumber);onInitialSourceOpened?.()},[initialSourceNumber]);
  useEffect(()=>{if(!initialLayer||!isJourneyLayerId(initialLayer))return;setActiveDynamicUnitKey(null);setActiveSourceNum(null);setActiveNum(null);setOpenLayer(initialLayer);onInitialLayerOpened?.()},[initialLayer]);

  const foundationTotal=journeyPath.stages.length;
  const doneCount=journeyPath.stages.filter(stage=>learning.state.completedStageIds.includes(stage.id)).length;
  const pct=Math.round((doneCount/foundationTotal)*100);
  const chapter=activeNum?chapters.find(item=>item.number===activeNum)??null:null;
  const layer=chapter?journeyLayerForChapter(chapter.number)??JOURNEY_LAYERS[0]:JOURNEY_LAYERS[0];
  const previousChapter=chapter?chapters.find(item=>item.number===chapter.number-1)??null:null;
  const activeDynamicUnit=activeDynamicUnitKey?dynamicUnits.find(unit=>unit.key===activeDynamicUnitKey)??null:null;
  const openChapter=(chapterNumber:number)=>{const targetLayer=journeyLayerForChapter(chapterNumber);setActiveDynamicUnitKey(null);setActiveSourceNum(null);if(targetLayer)setOpenLayer(targetLayer.id);setActiveNum(chapterNumber);window.scrollTo({top:0})};

  if(activeSourceNum){const sourceChapter=chapters.find(item=>item.number===activeSourceNum)??null;if(sourceChapter){const sourceLayer=journeyLayerForChapter(sourceChapter.number)??JOURNEY_LAYERS[0];return <ChapterView chapter={sourceChapter} layer={sourceLayer} onBack={()=>{setActiveSourceNum(null);onSourceClosed?.()}} onComplete={()=>{}} canGoPrevious={false} isFinal={false} sourceOnly/>}}
  if(activeDynamicUnit)return <DynamicUnitExperience unit={activeDynamicUnit} onBack={()=>setActiveDynamicUnitKey(null)}/>;

  const handleComplete=()=>{if(!chapter)return;const stage=stageForNum(chapter.number);if(stage)learning.complete(stage.id,'');const next=chapter.number+1;if(next<=foundationTotal){const nextLayer=journeyLayerForChapter(next);if(nextLayer)setOpenLayer(nextLayer.id);setActiveNum(next)}else setActiveNum(null);window.scrollTo({top:0})};
  if(chapter)return <ChapterExperience key={chapter.number} chapter={chapter} layer={layer} onBack={()=>setActiveNum(null)} onComplete={handleComplete} onPrevious={previousChapter?()=>openChapter(previousChapter.number):undefined}/>;

  return <div className="spiralLibrary" dir="rtl">
    <header className="spiralHeader"><div><span className="spiralEyebrow">המסע שלי</span><h1 className="spiralTitle">ההתקדמות שלי במסע</h1><p className="spiralSubtitle">זה לא רצף של פרקים. כל שכבה חוזרת אל שאלת ״מי אני?״ מזווית עמוקה יותר, ומחברת את מה שכבר למדת למה שמגיע אחריה.</p></div><div className="spiralProgressSummary"><strong>{pct}%</strong><span>{doneCount} מתוך {foundationTotal} נושאים הושלמו</span></div></header>
    <div className="spiralProgress"><div className="spiralProgressBar" role="progressbar" aria-label="התקדמות במסע" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div className="spiralProgressFill" style={{width:`${pct}%`}}/></div></div>

    <div className="spiralLayers">{JOURNEY_LAYERS.map(layerItem=>{
      const layerNums=layerItem.nums as readonly number[],layerChapters=chapters.filter(item=>layerNums.includes(item.number)),layerDone=layerChapters.filter(item=>completed(item.number)).length,isOpen=openLayer===layerItem.id,bodyId=`journey-layer-${layerItem.id}`;
      return <section key={layerItem.id} className={`spiralLayer${isOpen?' spiralLayer--open':''}`}>
        <button type="button" className="spiralLayerHeader" onClick={()=>setOpenLayer(isOpen?'':layerItem.id)} aria-expanded={isOpen} aria-controls={bodyId} aria-label={`${isOpen?'סגור':'פתח'}: ${layerItem.shortLabel}`}>
          <span className="spiralLayerMarker" aria-hidden="true">{layerItem.marker}</span>
          <span className="spiralLayerLeft"><span className="spiralLayerLabel">{layerItem.shortLabel}</span><span className="spiralLayerRange">{layerItem.cue}</span></span>
          <span className="spiralLayerRight"><span className="spiralLayerCount">{layerDone}/{layerItem.nums.length}</span></span>
        </button>
        <div id={bodyId} className="spiralLayerBody" hidden={!isOpen}><p className="spiralLayerFullWhy">{layerItem.why}</p><div className="spiralCards">{layerChapters.map(item=><ChapterCard key={item.number} chapter={item} displayTitle={getPilotCardChapter(item.number)?.title} unlocked={unlocked(item.number)} completed={completed(item.number)} onClick={()=>openChapter(item.number)}/>)}</div></div>
      </section>;
    })}</div>

    {dynamicUnits.length>0&&<section className="publishedUnitsSection" aria-labelledby="published-units-title"><div className="publishedUnitsHead"><span className="publishedUnitsKicker">נוסף למסע</span><h2 id="published-units-title">נושאים חדשים</h2><p>נושאים נוספים שאפשר לפתוח וללמוד בקצב שלך.</p></div><div className="spiralCards">{dynamicUnits.map(unit=><PublishedUnitCard key={unit.key} unit={unit} onClick={()=>{setActiveDynamicUnitKey(unit.key);window.scrollTo({top:0})}}/>)}</div></section>}
    {publishedUnits.error&&<p className="publishedUnitsError" role="status">נושאים חדשים לא נטענו כרגע. אפשר להמשיך במסע כרגיל.</p>}
  </div>;
}
