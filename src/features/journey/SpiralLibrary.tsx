import React, { useEffect, useState } from 'react';
import { useLearningProgress } from './model/useLearningProgress';
import { journeyPath } from './model/journey-stage';
import type { LearningStage } from '../../core/learning-path/learning-path.types';
import { useCrystalCollection } from '../crystals/model/useCrystalCollection';
import { getPilotCardChapter } from './data/pilot-card-script';
import { LearningCardReader } from './LearningCardReader';

type Chapter = { number: number; title: string; subtitle: string; sourceFile: string; paragraphs: string[]; paragraphCount?: number; characterCount?: number };
type Props = { chapters: Chapter[]; initialChapter?: number | null; onInitialChapterOpened?: () => void };

const LAYERS = [
  { id: 'A', label: 'שכבה ראשונה — אני והמערכת',   color: '#006039', accent: '#006039', nums: [1,2,3],       why: 'מתחילים בשאלת הזהות, מרחיבים את המבט אל הסביבה, ורק אז חוזרים אל מורכבות הגוף.' },
  { id: 'B', label: 'שכבה שנייה — המוח והדפוסים', color: '#006039', accent: '#006039', nums: [4,5,6],       why: 'אחרי הגוף עוברים אל מנגנוני המוח, אל הדפוסים האוטומטיים ואל מצבי הפעילות שמשפיעים על למידה.' },
  { id: 'C', label: 'שכבה שלישית — האנרגיה והתדר', color: '#006039', accent: '#006039', nums: [7,8,9],       why: 'המוח פועל בגלים. הגוף כולו רוטט בתדרים. הצליל בונה צורה פיזית.' },
  { id: 'D', label: 'שכבה רביעית — כלי השינוי',    color: '#006039', accent: '#006039', nums: [10,11,12,13], why: 'הבנתי מה אני. האם אני יכול לשנות? כן — כך עושים את זה.' },
  { id: 'E', label: 'שכבה חמישית — המשמעות',       color: '#006039', accent: '#006039', nums: [14,15,16,17,18], why: 'חוקי המשחק, כיוון, קושי — וחזרה לשאלה הראשונה עם תשובה אמיתית.' },
] as const;

function clean(t: string) { return t.replace(/^פרק\s*\d+[:：]?\s*/, ''); }
function stageForNum(num: number): LearningStage | undefined {
  return journeyPath.stages.find(s => s.order === num);
}
/* ── Card ── */
function ChapterCard({ chapter, layer, unlocked, completed, onClick }: {
  chapter: Chapter;
  layer: typeof LAYERS[number];
  unlocked: boolean;
  completed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`spiralCard${completed ? ' spiralCard--done' : ''}${!unlocked ? ' spiralCard--locked' : ''}`}
      style={{ '--lc': layer.color, '--la': layer.accent } as React.CSSProperties}
      onClick={onClick}
      disabled={!unlocked}
    >
      <span className="spiralCardNum">{String(chapter.number).padStart(2, '0')}</span>
      <span className="spiralCardBody">
        <span className="spiralCardTitle">{clean(chapter.title)}</span>
        
      </span>
      <span className="spiralCardIcon">{completed ? '✓' : unlocked ? '←' : '🔒'}</span>
    </button>
  );
}

/* ── Chapter View ── */
function ChapterView({ chapter, layer, onBack, onComplete, onPrevious, canGoPrevious, isFinal }: {
  chapter: Chapter;
  layer: typeof LAYERS[number];
  onBack: () => void;
  onComplete: () => void;
  onPrevious?: () => void;
  canGoPrevious: boolean;
  isFinal: boolean;
}) {
  const [crystalText, setCrystalText] = useState('');
  const [crystalStatus, setCrystalStatus] = useState<'idle'|'saved'|'error'>('idle');
  const { save: saveCrystal } = useCrystalCollection();
  const stage = stageForNum(chapter.number);

  return (
    <div className="spiralChapter" dir="rtl">
      <div className="spiralChapterTop">
        <button className="spiralBack" onClick={onBack}>← חזרה למסע</button>
        <span className="spiralChapterPos" style={{ color: layer.accent }}>{layer.label}</span>
      </div>

      <header className="spiralChapterHeader" style={{ borderColor: layer.color }}>
        <div className="spiralChapterNum" style={{ background: layer.color }}>
          {String(chapter.number).padStart(2, '0')}
        </div>
        <div>
          <h1 className="spiralChapterTitle">{clean(chapter.title)}</h1>
          <p className="spiralChapterSub">{chapter.subtitle}</p>
        </div>
      </header>

      {stage?.guidingQuestion && (
        <div className="spiralQuestion" style={{ borderColor: layer.accent }}>
          <span className="spiralQuestionLabel">השאלה שהפרק עונה עליה</span>
          <p>{stage.guidingQuestion}</p>
        </div>
      )}

      <div className="spiralWhy" style={{ background: `${layer.color}18` }}>
        <span className="spiralWhyLabel">למה הפרק הזה כאן — בדיוק בנקודה הזו</span>
        <p>{layer.why}</p>
      </div>

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
          if (t.startsWith('##SYSTEM##')) return <div key={i} className="chSystem"><span className="chSystemDot" style={{background:layer.color}}/>  <span>{t.replace('##SYSTEM##','').trim()}</span></div>;
          if (t.startsWith('##WINK##')) return <div key={i} className="chWink">{t.replace('##WINK##','').trim()}</div>;
          if ((/^פרק\s*\d+/u.test(t) || /^\d+\.\s+/u.test(t)) && t.length < 120)
            return <h3 key={i} className="spiralContentH3">{t}</h3>;
          if (/^[-•✓→]/u.test(t))
            return <div className="spiralBullet" key={i}><span style={{color:layer.accent}}>•</span><p>{t.replace(/^[-•✓→]\s*/u,'')}</p></div>;
          return <p key={i} className="spiralPara">{t}</p>;
        })}
      </article>

      <div className="crystalSaveCard">
        <div className="crystalSaveHeader">
          <span className="crystalSaveIcon">◆</span>
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
      </div>

      <nav className="spiralChapterNav" aria-label="ניווט בין פרקים">
        <button className="spiralChapterNavBtn" type="button" onClick={onPrevious} disabled={!canGoPrevious}>→ הפרק הקודם</button>
        <button
          className="spiralComplete spiralChapterComplete"
          type="button"
          style={{ background: "#006039", color: "#fff", opacity: 1 }}
          onClick={onComplete}
        >
          {isFinal ? 'סיימתי את המסע' : 'סיימתי — לפרק הבא ←'}
        </button>
      </nav>
    </div>
  );
}

/* ── Main ── */
export default function SpiralLibrary({ chapters, initialChapter, onInitialChapterOpened }: Props) {
  const learning = useLearningProgress(journeyPath);
  const [activeNum, setActiveNum]   = useState<number | null>(null);
  const [openLayer, setOpenLayer]   = useState<string>('A');

  const unlocked  = (_num: number) => true;
  const completed = (num: number) => { const s = stageForNum(num); return s ? learning.state.completedStageIds.includes(s.id) : false; };

  useEffect(() => {
    if (!initialChapter) return;
    setActiveNum(initialChapter);
    onInitialChapterOpened?.();
  }, [initialChapter]);

  const doneCount = chapters.filter(c => completed(c.number)).length;
  const pct       = Math.round((doneCount / 18) * 100);

  const chapter = activeNum ? chapters.find(c => c.number === activeNum) ?? null : null;
  const layer   = chapter   ? LAYERS.find(l => (l.nums as readonly number[]).includes(chapter.number)) ?? LAYERS[0] : LAYERS[0];
  const pilotCardChapter=chapter?getPilotCardChapter(chapter.number):null;
  const previousChapter = chapter ? chapters.find(c => c.number === chapter.number - 1) ?? null : null;
  const openChapter = (chapterNumber: number) => {
    setActiveNum(chapterNumber);
    scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleComplete = () => {
    if (!chapter) return;
    const s = stageForNum(chapter.number);
    if (s) learning.complete(s.id, '');
    const next = chapter.number + 1;
    if (next <= 18) { setActiveNum(next); } else { setActiveNum(null); }
    scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (chapter) {
    if(pilotCardChapter){
      return <LearningCardReader key={pilotCardChapter.chapterNumber}
        chapter={pilotCardChapter}
        sourceChapter={chapter}
        layerLabel={layer.label}
        color={layer.color}
        onBack={()=>setActiveNum(null)}
        onComplete={handleComplete}
        onPreviousChapter={previousChapter?()=>openChapter(previousChapter.number):undefined}
      />;
    }
    return (
      <ChapterView
        chapter={chapter}
        layer={layer}
        onBack={() => setActiveNum(null)}
        onComplete={handleComplete}
        onPrevious={previousChapter ? () => openChapter(previousChapter.number) : undefined}
        canGoPrevious={Boolean(previousChapter)}
        isFinal={chapter.number===18}
      />
    );
  }

  return (
    <div className="spiralLibrary" dir="rtl">
      <div className="spiralHeader">
        <h1 className="spiralTitle">ההתקדמות שלי במסע</h1>
        <p className="spiralSubtitle">18 פרקים · 5 שכבות · מבפנים החוצה</p>

        <div className="spiralProgress">
          <div className="spiralProgressBar">
            <div className="spiralProgressFill" style={{ width: `${pct}%` }} />
          </div>
          <span className="spiralProgressText">{doneCount} / 18 פרקים הושלמו</span>
        </div>
      </div>

      <div className="spiralLayers">
        {LAYERS.map(l => {
          const layerNums = l.nums as readonly number[]; const layerChaps = chapters.filter(c => layerNums.includes(c.number));
          const layerDone  = layerChaps.filter(c => completed(c.number)).length;
          const isOpen     = openLayer === l.id;

          return (
            <div key={l.id} className={`spiralLayer${isOpen ? ' spiralLayer--open' : ''}`}>
              <button
                className="spiralLayerHeader"
                style={{ borderColor: l.color, background: isOpen ? `${l.color}12` : 'transparent' }}
                onClick={() => setOpenLayer(isOpen ? '' : l.id)}
              >
                <div className="spiralLayerLeft">
                  <div className="spiralLayerDot" style={{ background: l.color }} />
                  <div>
                    <div className="spiralLayerLabel" style={{ color: l.color }}>{l.label}</div>
                    
                  </div>
                </div>
                <div className="spiralLayerRight">
                  <span className="spiralLayerCount" style={{ color: l.accent }}>{layerDone}/{l.nums.length}</span>
                  <span className="spiralLayerChevron" style={{ display:'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform .25s' }}>▾</span>
                </div>
              </button>

              {isOpen && (
                <div className="spiralLayerBody">
                  <p className="spiralLayerFullWhy">{l.why}</p>
                  <div className="spiralCards">
                    {layerChaps.map(ch => (
                      <ChapterCard
                        key={ch.number}
                        chapter={ch}
                        layer={l}
                        unlocked={unlocked(ch.number)}
                        completed={completed(ch.number)}
                        onClick={() => { setActiveNum(ch.number); scrollTo({ top: 0, behavior: 'smooth' }); }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
