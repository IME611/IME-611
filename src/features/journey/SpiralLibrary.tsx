import React, { useState } from 'react';
import { useLearningProgress } from './model/useLearningProgress';
import { journeyPath } from './model/journey-stage';
import type { LearningStage } from '../../core/learning-path/learning-path.types';

type Chapter = { number: number; title: string; subtitle: string; sourceFile: string; paragraphs: string[]; paragraphCount?: number; characterCount?: number };
type Props = { chapters: Chapter[]; query: string; setQuery: (v: string) => void; corpusReady: boolean; paragraphs: number; characters: number };

const LAYERS = [
  { id: 'A', label: 'שכבה ראשונה — הכלי הפיזי',    color: '#006039', accent: '#006039', nums: [1,2,3],       why: 'לפני שנשאל "מי אני" — נראה ממה אנחנו בנויים. הגוף הוא נקודת המוצא.' },
  { id: 'B', label: 'שכבה שנייה — מערכת ההפעלה',  color: '#006039', accent: '#006039', nums: [4,5,6],       why: 'הגוף הוא החומרה. עכשיו נבין מי מריץ את התוכנה — מודע, תת-מודע, על-מודע.' },
  { id: 'C', label: 'שכבה שלישית — האנרגיה והתדר', color: '#006039', accent: '#006039', nums: [7,8,9],       why: 'המוח פועל בגלים. הגוף כולו רוטט בתדרים. הצליל בונה צורה פיזית.' },
  { id: 'D', label: 'שכבה רביעית — כלי השינוי',    color: '#006039', accent: '#006039', nums: [10,11,12,13], why: 'הבנתי מה אני. האם אני יכול לשנות? כן — כך עושים את זה.' },
  { id: 'E', label: 'שכבה חמישית — המשמעות',       color: '#006039', accent: '#006039', nums: [14,15,16,17,18], why: 'חוקי המשחק, כיוון, קושי — וחזרה לשאלה הראשונה עם תשובה אמיתית.' },
] as const;

function clean(t: string) { return t.replace(/^פרק\s*\d+[:：]?\s*/, ''); }
function stageForNum(num: number): LearningStage | undefined {
  return journeyPath.stages.find(s => s.order === num);
}
function isOwnerMode(): boolean {
  try { return localStorage.getItem('eil-access-mode') !== 'journey'; } catch { return true; }
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
function ChapterView({ chapter, layer, onBack, onComplete, isOwner }: {
  chapter: Chapter;
  layer: typeof LAYERS[number];
  onBack: () => void;
  onComplete: (reflection: string) => void;
  isOwner: boolean;
}) {
  const [reflection, setReflection] = useState('');
  const stage = stageForNum(chapter.number);
  const canComplete = isOwner || reflection.trim().length >= 20;

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
          if ((/^פרק\s*\d+/u.test(t) || /^\d+\.\s+/u.test(t)) && t.length < 120)
            return <h3 key={i} className="spiralContentH3">{t}</h3>;
          if (/^[-•✓→]/u.test(t))
            return (
              <div className="spiralBullet" key={i}>
                <span style={{ color: layer.accent }}>•</span>
                <p>{t.replace(/^[-•✓→]\s*/u, '')}</p>
              </div>
            );
          return <p key={i} className="spiralPara">{t}</p>;
        })}
      </article>

      <div className="spiralReflect">
        <p className="spiralReflectHint">רוצה לכתוב משהו נוסף כדי להזכיר לעצמך בהמשך?</p>
        <textarea
          className="spiralReflectInput"
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder="מה נגע בך? מה תרצה לזכור?"
          rows={4}
        />
        <button
          className="spiralComplete"
          style={{ background: canComplete ? "#006039" : "rgba(26,26,24,.20)", color: canComplete ? "#fff" : "rgba(26,26,24,.40)", opacity: 1 }}
          onClick={() => onComplete(reflection)}
          disabled={!canComplete}
        >
          סיימתי פרק זה — המשך ←
        </button>
      </div>

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
          id={`crystal-input-${chapter.number}`}
          placeholder="כתוב תובנה שתרצה לשמור מהפרק הזה..."
          rows={3}
        />
        <button className="crystalSaveBtn" onClick={() => {
          const input = document.getElementById(`crystal-input-${chapter.number}`) as HTMLTextAreaElement;
          const text = input?.value?.trim();
          if (!text) return;
          try {
            const existing = JSON.parse(localStorage.getItem('eil-crystals') || '[]');
            existing.unshift({
              text,
              topic: chapter.title.replace(/^פרק\s*\d+[:：]?\s*/, ''),
              chapterNum: chapter.number,
              date: new Date().toISOString()
            });
            localStorage.setItem('eil-crystals', JSON.stringify(existing));
            input.value = '';
            input.placeholder = '✓ נשמר בקריסטלים שלך!';
            setTimeout(() => { input.placeholder = 'כתוב תובנה שתרצה לשמור מהפרק הזה...' }, 2500);
          } catch {}
        }}>
          ◆ שמור קריסטל
        </button>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function SpiralLibrary({ chapters, query, setQuery }: Props) {
  const learning = useLearningProgress(journeyPath);
  const [activeNum, setActiveNum]   = useState<number | null>(null);
  const [openLayer, setOpenLayer]   = useState<string>('A');
  const isOwner = isOwnerMode();

  const unlocked  = (num: number) => { const s = stageForNum(num); return isOwner || (s ? learning.isUnlocked(s) : false); };
  const completed = (num: number) => { const s = stageForNum(num); return s ? learning.state.completedStageIds.includes(s.id) : false; };

  const doneCount = chapters.filter(c => completed(c.number)).length;
  const pct       = Math.round((doneCount / 18) * 100);

  const chapter = activeNum ? chapters.find(c => c.number === activeNum) ?? null : null;
  const layer   = chapter   ? LAYERS.find(l => (l.nums as readonly number[]).includes(chapter.number)) ?? LAYERS[0] : LAYERS[0];

  const handleComplete = (reflection: string) => {
    if (!chapter) return;
    const s = stageForNum(chapter.number);
    if (s) learning.complete(s.id, reflection);
    const next = chapter.number + 1;
    if (next <= 18) { setActiveNum(next); } else { setActiveNum(null); }
    scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* filtered search */
  const needle = query.trim().toLowerCase();
  const visible = (num: number) => !needle || (() => {
    const ch = chapters.find(c => c.number === num);
    return ch ? (ch.title + ' ' + ch.subtitle + ' ' + ch.paragraphs.join(' ')).toLowerCase().includes(needle) : false;
  })();

  if (chapter) {
    return (
      <ChapterView
        chapter={chapter}
        layer={layer}
        onBack={() => setActiveNum(null)}
        onComplete={handleComplete}
        isOwner={isOwner}
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

        <input
          className="spiralSearchInput"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="⌕ חפש בתוכן הפרקים..."
        />
      </div>

      <div className="spiralLayers">
        {LAYERS.map(l => {
          const layerNums = l.nums as readonly number[]; const layerChaps = chapters.filter(c => layerNums.includes(c.number) && visible(c.number));
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
