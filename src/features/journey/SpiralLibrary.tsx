import React, { useEffect, useState } from 'react';
import { useLearningProgress } from './model/useLearningProgress';
import { journeyPath } from './model/journey-stage';
import { JOURNEY_LAYERS, isJourneyLayerId, journeyLayerForChapter } from './model/journey-layers';
import type { JourneyLayerId } from './model/journey-layers';
import type { LearningStage } from '../../core/learning-path/learning-path.types';
import { useCrystalCollection } from '../crystals/model/useCrystalCollection';
import { getPilotCardChapter } from './data/pilot-card-script';
import { LearningCardReader } from './LearningCardReader';
import { usePublishedLearningCards } from './model/usePublishedLearningCards';
import { usePublishedLearningUnits } from './model/usePublishedLearningUnits';
import type { PublishedLearningUnit } from './model/usePublishedLearningUnits';
import type { LearningCardChapter } from './model/learning-card.types';

type Chapter = { number: number; title: string; subtitle: string; sourceFile: string; paragraphs: string[]; paragraphCount?: number; characterCount?: number };
type Props = {
  chapters: Chapter[];
  initialChapter?: number | null;
  initialSourceNumber?: number | null;
  initialLayer?: JourneyLayerId | null;
  onInitialChapterOpened?: () => void;
  onInitialSourceOpened?: () => void;
  onInitialLayerOpened?: () => void;
  onSourceClosed?: () => void;
};

type JourneyLayer=typeof JOURNEY_LAYERS[number];

function clean(t: string) { return t.replace(/^פרק\s*\d+[:：]?\s*/, ''); }
function stageForNum(num: number): LearningStage | undefined {
  return journeyPath.stages.find(s => s.order === num);
}

function ChapterCard({ chapter, displayTitle, layer, unlocked, completed, onClick }: {
  chapter: Chapter;
  displayTitle?: string;
  layer: JourneyLayer;
  unlocked: boolean;
  completed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`spiralCard${completed ? ' spiralCard--done' : ''}${!unlocked ? ' spiralCard--locked' : ''}`}
      style={{ '--lc': layer.color, '--lt': layer.textColor } as React.CSSProperties}
      onClick={onClick}
      disabled={!unlocked}
    >
      <span className="spiralCardNum">{String(chapter.number).padStart(2, '0')}</span>
      <span className="spiralCardBody">
        <span className="spiralCardTitle">{displayTitle??clean(chapter.title)}</span>
      </span>
      <span className="spiralCardIcon" aria-hidden="true">{completed ? '✓' : unlocked ? '←' : '🔒'}</span>
    </button>
  );
}

function PublishedUnitCard({unit,onClick}:{unit:PublishedLearningUnit;onClick:()=>void}){
  return <button type="button" className="spiralCard publishedUnitCard" onClick={onClick} style={{'--lc':'#006039','--lt':'#006039'} as React.CSSProperties}>
    <span className="spiralCardNum publishedUnitBadge">חדש</span>
    <span className="spiralCardBody">
      <span className="spiralCardTitle">{unit.title}</span>
      <span className="publishedUnitMeta">{unit.cardCount} כרטיסים · {unit.sourceCount} {unit.sourceCount===1?'מקור':'מקורות'}</span>
    </span>
    <span className="spiralCardIcon" aria-hidden="true">←</span>
  </button>;
}

function ChapterView({ chapter, layer, onBack, onComplete, onPrevious, canGoPrevious, isFinal, sourceOnly=false }: {
  chapter: Chapter;
  layer: JourneyLayer;
  onBack: () => void;
  onComplete: () => void;
  onPrevious?: () => void;
  canGoPrevious: boolean;
  isFinal: boolean;
  sourceOnly?: boolean;
}) {
  const [crystalText, setCrystalText] = useState('');
  const [crystalStatus, setCrystalStatus] = useState<'idle'|'saved'|'error'>('idle');
  const { save: saveCrystal } = useCrystalCollection();
  const stage = stageForNum(chapter.number);

  return (
    <div className="spiralChapter" dir="rtl">
      <div className="spiralChapterTop">
        <button className="spiralBack" type="button" onClick={onBack}>{sourceOnly?'→ חזרה למקורות':'← חזרה למסע'}</button>
        <span className="spiralChapterPos" style={{ color: layer.textColor }}>{sourceOnly?'מסמך מקור מלא':layer.label}</span>
      </div>

      <header className="spiralChapterHeader" style={{ borderColor: layer.color }}>
        <div className="spiralChapterNum" style={{ background: layer.textColor }}>
          {String(chapter.number).padStart(2, '0')}
        </div>
        <div>
          <h1 className="spiralChapterTitle">{clean(chapter.title)}</h1>
          <p className="spiralChapterSub">{chapter.subtitle}</p>
        </div>
      </header>

      {!sourceOnly&&stage?.guidingQuestion && (
        <div className="spiralQuestion" style={{ borderColor: layer.color }}>
          <span className="spiralQuestionLabel">השאלה שהפרק עונה עליה</span>
          <p>{stage.guidingQuestion}</p>
        </div>
      )}

      {!sourceOnly&&<div className="spiralWhy" style={{ background: `${layer.color}18` }}>
        <span className="spiralWhyLabel">למה הפרק הזה כאן — בדיוק בנקודה הזו</span>
        <p>{layer.why}</p>
      </div>}

      <article className="spiralContent">
        {chapter.paragraphs.map((text, i) => {
          const t = text.trim();
          if (!t) return null;
          if (t.startsWith('##TITLE##')) return <h1 key={i} className="chTitle">{t.replace('##TITLE##','').trim()}</h1>;
          if (t.startsWith('##SUBTITLE##')) return <p key={i} className="chSubtitle">{t.replace('##SUBTITLE##','').trim()}</p>;
          if (t.startsWith('##SECTION##')) return <h2 key={i} className="chSection">{t.replace('##SECTION##','').trim()}</h2>;
          if (t.startsWith('##QUESTION##')) return <div key={i} className="chQuestion">{t.replace('##QUESTION##','').trim()}</div>;
          if (t.startsWith('##HIGHLIGHT##')) return <div key={i} className="chHighlight">{t.replace('##HIGHLIGHT##','').trim()}</div>;
          if (t.startsWith('##BIG##')) return <div key={i} className="chBig">{t.replace('##BIG##','').trim()}</div>;
          if (t.startsWith('##GROUP##')) return <div key={i} className="chGroup">{t.replace('##GROUP##','').trim()}</div>;
          if (t.startsWith('##SYSTEM##')) return <div key={i} className="chSystem"><span className="chSystemDot" style={{background:layer.color}} aria-hidden="true"/>  <span>{t.replace('##SYSTEM##','').trim()}</span></div>;
          if (t.startsWith('##WINK##')) return <div key={i} className="chWink">{t.replace('##WINK##','').trim()}</div>;
          if ((/^פרק\s*\d+/u.test(t) || /^\d+\.\s+/u.test(t)) && t.length < 120)
            return <h3 key={i} className="spiralContentH3">{t}</h3>;
          if (/^[-•✓→]/u.test(t))
            return <div className="spiralBullet" key={i}><span style={{color:layer.color}} aria-hidden="true">•</span><p>{t.replace(/^[-•✓→]\s*/u,'')}</p></div>;
          return <p key={i} className="spiralPara">{t}</p>;
        })}
      </article>

      {!sourceOnly&&<div className="crystalSaveCard">
        <div className="crystalSaveHeader">
          <span className="crystalSaveIcon" aria-hidden="true">◆</span>
          <div>
            <div className="crystalSaveTitle">שמור כקריסטל</div>
            <div className="crystalSaveSub">תובנה שתישמר ב"המרחב האישי" שלך</div>
          </div>
        </div>
        <textarea
          className="crystalSaveInput"
          value={crystalText}
          onChange={e=>{setCrystalText(e.target.value);setCrystalStatus('idle')}}
          placeholder={crystalStatus==='saved'?"✓ נשמר בקריסטלים שלך!":"כתוב תובנה שתרצה לשמור מהפרק הזה..."}
          rows={3}
        />
        <button className="crystalSaveBtn" disabled={!crystalText.trim()} onClick={() => {
          const text=crystalText.trim();
          if (!text) return;
          const saved=saveCrystal({
            fragmentId:`personal-${chapter.number}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
            conceptId:`chapter-${chapter.number}`,
            topic:clean(chapter.title),
            subtopic:'תובנה אישית',
            text,
            sourceLabel:`פרק ${chapter.number} — ${clean(chapter.title)}`,
            provenanceLabel:`נכתב לאחר קריאת פרק ${chapter.number}`,
            savedAt:new Date().toISOString(),
          });
          if(saved){
            setCrystalText('');
            setCrystalStatus('saved');
            setTimeout(() => setCrystalStatus('idle'), 3000);
          }else setCrystalStatus('error');
        }}>
          {crystalStatus==='saved' ? "✓ נשמר בקריסטלים!" : "◆ שמור קריסטל"}
        </button>
        {crystalStatus==='error'&&<p className="formError" role="alert">לא ניתן היה לשמור את הקריסטל בדפדפן. נסה שוב.</p>}
      </div>}

      {!sourceOnly&&<nav className="spiralChapterNav" aria-label="ניווט בין פרקים">
        <button className="spiralChapterNavBtn" type="button" onClick={onPrevious} disabled={!canGoPrevious}>→ הפרק הקודם</button>
        <button
          className="spiralComplete spiralChapterComplete"
          type="button"
          style={{ background: "#006039", color: "#fff", opacity: 1 }}
          onClick={onComplete}
        >
          {isFinal ? 'סיימתי את המסע' : 'סיימתי — לפרק הבא ←'}
        </button>
      </nav>}
    </div>
  );
}

function ChapterExperience({chapter,chapters,layer,onBack,onComplete,onPrevious}:{chapter:Chapter;chapters:Chapter[];layer:JourneyLayer;onBack:()=>void;onComplete:()=>void;onPrevious?:()=>void}){
  const published=usePublishedLearningCards(chapter.number),pilot=getPilotCardChapter(chapter.number),stage=stageForNum(chapter.number);
  const sourceChapter=pilot?chapters.find(item=>item.sourceFile===pilot.sourceFile)??chapter:chapter;
  if(published.loading&&!pilot)return <div className="spiralChapter journeyCardsLoading" dir="rtl"><div className="spiralChapterTop"><button className="spiralBack" type="button" onClick={onBack}>← חזרה לנושאים</button><span className="spiralChapterPos" style={{color:layer.textColor}}>{layer.label}</span></div><p>טוען את הכרטיסיות של הפרק…</p></div>;
  const combinedCards=[...(pilot?.cards||[]),...published.cards].map((card,index)=>({...card,order:index+1}));
  const cardChapter:LearningCardChapter|null=combinedCards.length?{
    chapterNumber:chapter.number,
    title:pilot?.title??clean(chapter.title),
    subtitle:pilot?.subtitle??chapter.subtitle,
    guidingQuestion:pilot?.guidingQuestion??stage?.guidingQuestion??'מה אפשר להבין מן המקור הזה?',
    whyHere:pilot?.whyHere??layer.why,
    sourceFile:pilot?.sourceFile??chapter.sourceFile,
    cards:combinedCards,
  }:null;
  if(cardChapter)return <LearningCardReader chapter={cardChapter} sourceChapter={sourceChapter} layerLabel={layer.label} color={layer.textColor} onBack={onBack} onComplete={onComplete} onPreviousChapter={onPrevious}/>;
  return <ChapterView chapter={chapter} layer={layer} onBack={onBack} onComplete={onComplete} onPrevious={onPrevious} canGoPrevious={Boolean(onPrevious)} isFinal={chapter.number===18}/>;
}

function DynamicUnitExperience({unit,onBack}:{unit:PublishedLearningUnit;onBack:()=>void}){
  const published=usePublishedLearningCards(unit.key);
  if(published.loading)return <div className="spiralChapter journeyCardsLoading" dir="rtl"><div className="spiralChapterTop"><button className="spiralBack" type="button" onClick={onBack}>← חזרה למסע</button><span className="spiralChapterPos">יחידה שפורסמה מהמאגר</span></div><p>טוען את הכרטיסיות…</p></div>;
  if(published.error)return <div className="spiralChapter journeyCardsLoading" dir="rtl"><div className="spiralChapterTop"><button className="spiralBack" type="button" onClick={onBack}>← חזרה למסע</button><span className="spiralChapterPos">יחידה שפורסמה מהמאגר</span></div><p className="formError" role="alert">{published.error}</p></div>;
  if(!published.cards.length)return <div className="spiralChapter journeyCardsLoading" dir="rtl"><div className="spiralChapterTop"><button className="spiralBack" type="button" onClick={onBack}>← חזרה למסע</button><span className="spiralChapterPos">יחידה שפורסמה מהמאגר</span></div><p>לא נמצאו כרטיסים שפורסמו ביחידה הזו.</p></div>;
  const chapter:LearningCardChapter={
    unitKey:unit.key,
    displayNumber:'חדש',
    title:unit.title,
    subtitle:`${unit.cardCount} כרטיסים מתוך ${unit.sourceCount} ${unit.sourceCount===1?'מקור מאושר':'מקורות מאושרים'}`,
    guidingQuestion:'מה אפשר ללמוד מהחומר שאושר ופורסם ליחידה הזו?',
    whyHere:'היחידה נוספה מתוך חומר חדש שעבר קליטה, בדיקת חפיפה ואישור לפרסום. היא מוצגת לצד מסלול היסוד בלי לשנות אוטומטית את סדר הלמידה.',
    sourceFile:'מקור מאושר',
    cards:published.cards,
  };
  return <LearningCardReader chapter={chapter} layerLabel="חדש במאגר" color="#006039" onBack={onBack} onComplete={onBack} backLabel="← חזרה למסע" completionLabel="סיימתי — חזרה למסע ←"/>;
}

export default function SpiralLibrary({ chapters, initialChapter, initialSourceNumber, initialLayer, onInitialChapterOpened, onInitialSourceOpened, onInitialLayerOpened, onSourceClosed }: Props) {
  const learning = useLearningProgress(journeyPath);
  const publishedUnits=usePublishedLearningUnits();
  const [activeNum, setActiveNum]   = useState<number | null>(null);
  const [activeSourceNum, setActiveSourceNum] = useState<number | null>(null);
  const [activeDynamicUnitKey,setActiveDynamicUnitKey]=useState<string|null>(null);
  const [openLayer, setOpenLayer]   = useState<JourneyLayerId|''>('A');

  const unlocked  = (_num: number) => true;
  const completed = (num: number) => { const s = stageForNum(num); return s ? learning.state.completedStageIds.includes(s.id) : false; };
  const dynamicUnits=publishedUnits.units.filter(unit=>unit.legacyChapterNumber===null);

  useEffect(() => {
    if (!initialChapter) return;
    const targetLayer=journeyLayerForChapter(initialChapter);
    setActiveDynamicUnitKey(null);
    setActiveSourceNum(null);
    if(targetLayer)setOpenLayer(targetLayer.id);
    setActiveNum(initialChapter);
    onInitialChapterOpened?.();
  }, [initialChapter]);

  useEffect(() => {
    if (!initialSourceNumber) return;
    setActiveDynamicUnitKey(null);
    setActiveNum(null);
    setActiveSourceNum(initialSourceNumber);
    onInitialSourceOpened?.();
  }, [initialSourceNumber]);

  useEffect(() => {
    if (!initialLayer||!isJourneyLayerId(initialLayer)) return;
    setActiveDynamicUnitKey(null);
    setActiveSourceNum(null);
    setActiveNum(null);
    setOpenLayer(initialLayer);
    onInitialLayerOpened?.();
  }, [initialLayer]);

  const foundationTotal=journeyPath.stages.length;
  const doneCount = journeyPath.stages.filter(stage=>learning.state.completedStageIds.includes(stage.id)).length;
  const pct       = Math.round((doneCount / foundationTotal) * 100);

  const chapter = activeNum ? chapters.find(c => c.number === activeNum) ?? null : null;
  const layer   = chapter ? journeyLayerForChapter(chapter.number) ?? JOURNEY_LAYERS[0] : JOURNEY_LAYERS[0];
  const previousChapter = chapter ? chapters.find(c => c.number === chapter.number - 1) ?? null : null;
  const activeDynamicUnit=activeDynamicUnitKey?dynamicUnits.find(unit=>unit.key===activeDynamicUnitKey)??null:null;
  const openChapter = (chapterNumber: number) => {
    const targetLayer=journeyLayerForChapter(chapterNumber);
    setActiveDynamicUnitKey(null);
    setActiveSourceNum(null);
    if(targetLayer)setOpenLayer(targetLayer.id);
    setActiveNum(chapterNumber);
    scrollTo({ top: 0, behavior: 'smooth' });
  };

  if(activeSourceNum){
    const sourceChapter=chapters.find(item=>item.number===activeSourceNum)??null;
    if(sourceChapter){
      const sourceLayer=journeyLayerForChapter(sourceChapter.number)??JOURNEY_LAYERS[0];
      return <ChapterView
        chapter={sourceChapter}
        layer={sourceLayer}
        onBack={()=>{setActiveSourceNum(null);onSourceClosed?.()}}
        onComplete={()=>{}}
        canGoPrevious={false}
        isFinal={false}
        sourceOnly
      />;
    }
  }

  if(activeDynamicUnit)return <DynamicUnitExperience unit={activeDynamicUnit} onBack={()=>setActiveDynamicUnitKey(null)}/>;

  const handleComplete = () => {
    if (!chapter) return;
    const s = stageForNum(chapter.number);
    if (s) learning.complete(s.id, '');
    const next = chapter.number + 1;
    if (next <= foundationTotal) {
      const nextLayer=journeyLayerForChapter(next);
      if(nextLayer)setOpenLayer(nextLayer.id);
      setActiveNum(next);
    } else { setActiveNum(null); }
    scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (chapter) {
    return <ChapterExperience key={chapter.number} chapter={chapter} chapters={chapters} layer={layer} onBack={()=>setActiveNum(null)} onComplete={handleComplete} onPrevious={previousChapter?()=>openChapter(previousChapter.number):undefined}/>;
  }

  return (
    <div className="spiralLibrary" dir="rtl">
      <div className="spiralHeader">
        <h1 className="spiralTitle">ההתקדמות שלי במסע</h1>
        <p className="spiralSubtitle">5 שכבות במסלול היסוד · ידע חדש יכול להצטרף מהמאגר</p>

        <div className="spiralProgress">
          <div className="spiralProgressBar" role="progressbar" aria-label="התקדמות במסלול היסוד" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div className="spiralProgressFill" style={{ width: `${pct}%` }} />
          </div>
          <span className="spiralProgressText">{doneCount} / {foundationTotal} פרקי יסוד הושלמו</span>
        </div>
      </div>

      <div className="spiralLayers">
        {JOURNEY_LAYERS.map(l => {
          const layerNums = l.nums as readonly number[]; const layerChaps = chapters.filter(c => layerNums.includes(c.number));
          const layerDone  = layerChaps.filter(c => completed(c.number)).length;
          const isOpen     = openLayer === l.id;
          const bodyId=`journey-layer-${l.id}`;

          return (
            <div key={l.id} className={`spiralLayer${isOpen ? ' spiralLayer--open' : ''}`} style={{'--lc':l.color,'--lt':l.textColor} as React.CSSProperties}>
              <button
                type="button"
                className="spiralLayerHeader"
                style={{ borderColor: l.color, background: isOpen ? `${l.color}12` : 'transparent' }}
                onClick={() => setOpenLayer(isOpen ? '' : l.id)}
                aria-expanded={isOpen}
                aria-controls={bodyId}
              >
                <div className="spiralLayerLeft">
                  <div className="spiralLayerDot" style={{ background: l.color }} aria-hidden="true" />
                  <div>
                    <div className="spiralLayerLabel" style={{ color: l.textColor }}>{l.label}</div>
                  </div>
                </div>
                <div className="spiralLayerRight">
                  <span className="spiralLayerCount" style={{ color: l.textColor }}>{layerDone}/{l.nums.length}</span>
                  <span className="spiralLayerChevron" style={{ display:'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform .25s' }} aria-hidden="true">▾</span>
                </div>
              </button>

              <div id={bodyId} className="spiralLayerBody" hidden={!isOpen}>
                <p className="spiralLayerFullWhy">{l.why}</p>
                <div className="spiralCards">
                  {layerChaps.map(ch => (
                    <ChapterCard
                      key={ch.number}
                      chapter={ch}
                      displayTitle={getPilotCardChapter(ch.number)?.title}
                      layer={l}
                      unlocked={unlocked(ch.number)}
                      completed={completed(ch.number)}
                      onClick={() => openChapter(ch.number)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {dynamicUnits.length>0?<section className="publishedUnitsSection" aria-labelledby="published-units-title">
        <div className="publishedUnitsHead">
          <span className="publishedUnitsKicker">חדש במאגר</span>
          <h2 id="published-units-title">יחידות שנוספו מחומרים שאושרו</h2>
          <p>היחידות האלו פורסמו מתוך מקורות חדשים. הן זמינות ללמידה ולבדיקת המקור, אך אינן משנות אוטומטית את סדר מסלול היסוד.</p>
        </div>
        <div className="spiralCards">
          {dynamicUnits.map(unit=><PublishedUnitCard key={unit.key} unit={unit} onClick={()=>{setActiveDynamicUnitKey(unit.key);scrollTo({top:0,behavior:'smooth'})}}/>)}
        </div>
      </section>:null}
      {publishedUnits.error?<p className="publishedUnitsError" role="status">היחידות החדשות לא נטענו כרגע. מסלול היסוד ממשיך לפעול כרגיל.</p>:null}
    </div>
  );
}
