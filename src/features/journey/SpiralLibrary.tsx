import React, { useState } from 'react';
import { useLearningProgress } from './model/useLearningProgress';
import { journeyPath } from './model/journey-stage';

type Chapter = { number: number; title: string; subtitle: string; sourceFile: string; paragraphs: string[]; paragraphCount?: number; characterCount?: number };
type Props = { chapters: Chapter[]; query: string; setQuery: (v: string) => void; corpusReady: boolean; paragraphs: number; characters: number };

const LAYERS = [
  { id: 'A', label: 'שכבה א׳ — הכלי הפיזי', color: '#1E3A5F', accent: '#4A90C4', chapters: [1,2,3], why: 'לפני שנשאל "מי אני" — נראה ממה אנחנו בנויים. הגוף הוא נקודת המוצא.' },
  { id: 'B', label: 'שכבה ב׳ — מערכת ההפעלה', color: '#4A235A', accent: '#9B59B6', chapters: [4,5,6], why: 'הגוף הוא החומרה. עכשיו נבין מי מריץ את התוכנה.' },
  { id: 'C', label: 'שכבה ג׳ — האנרגיה והתדר', color: '#7D6608', accent: '#D4AC0D', chapters: [7,8,9], why: 'המוח פועל בגלים. כל הגוף רוטט בתדרים. הצליל בונה צורה.' },
  { id: 'D', label: 'שכבה ד׳ — כלי השינוי', color: '#922B21', accent: '#E74C3C', chapters: [10,11,12,13], why: 'הבנתי מה אני. האם אני יכול לשנות? — כן. כך עושים את זה.' },
  { id: 'E', label: 'שכבה ה׳ — המשמעות והתכלית', color: '#1A5276', accent: '#2E86C1', chapters: [14,15,16,17,18], why: 'חוקי המשחק, כיוון, התמודדות עם קושי — וחזרה לשאלה הראשונה עם תשובה אמיתית.' },
];

function clean(t: string) { return t.replace(/^פרק\s*\d+[:：]?\s*/, ''); }

function ChapterCard({ chapter, layer, isUnlocked, isCompleted, isActive, onClick }: {
  chapter: Chapter; layer: typeof LAYERS[0]; isUnlocked: boolean; isCompleted: boolean; isActive: boolean; onClick: () => void;
}) {
  return (
    <button
      className={`spiralCard ${isCompleted ? 'spiralCard--done' : ''} ${isActive ? 'spiralCard--active' : ''} ${!isUnlocked ? 'spiralCard--locked' : ''}`}
      onClick={onClick}
      disabled={!isUnlocked}
      style={{ '--layer-color': layer.color, '--layer-accent': layer.accent } as React.CSSProperties}
    >
      <div className="spiralCardNum">{String(chapter.number).padStart(2, '0')}</div>
      <div className="spiralCardBody">
        <div className="spiralCardTitle">{clean(chapter.title)}</div>
        <div className="spiralCardSub">{chapter.subtitle}</div>
      </div>
      <div className="spiralCardStatus">
        {isCompleted ? '✓' : isUnlocked ? '←' : '🔒'}
      </div>
    </button>
  );
}

function ChapterView({ chapter, layer, onBack, onComplete, isOwner }: {
  chapter: Chapter; layer: typeof LAYERS[0]; onBack: () => void; onComplete: () => void; isOwner: boolean;
}) {
  const [reflection, setReflection] = useState('');
  const stage = journeyPath.stages.find(s => s.order === chapter.number);
  const pathChapter = journeyPath.stages.find(s => s.order === chapter.number);
  
  // Find why this chapter comes here from learning path
  const chapterMeta = {
    why: stage ? (pathChapter as any)?.bridge || layer.why : layer.why,
    question: (pathChapter as any)?.question || '',
  };

  const canComplete = isOwner || reflection.trim().length >= 20;

  return (
    <div className="spiralChapter" dir="rtl">
      <div className="spiralChapterTop">
        <button className="spiralBack" onClick={onBack}>← חזרה למסע</button>
        <span className="spiralChapterPos" style={{ color: layer.accent }}>
          {layer.label}
        </span>
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

      {chapterMeta.question && (
        <div className="spiralQuestion" style={{ borderColor: layer.accent }}>
          <span className="spiralQuestionLabel">השאלה שהפרק עונה עליה</span>
          <p>{chapterMeta.question}</p>
        </div>
      )}

      <div className="spiralWhy" style={{ background: `${layer.color}18` }}>
        <span className="spiralWhyLabel">למה הפרק הזה כאן — בדיוק בנקודה הזו</span>
        <p>{chapterMeta.why}</p>
      </div>

      <article className="spiralContent">
        {chapter.paragraphs.map((text, i) => {
          const t = text.trim();
          if (!t) return null;
          if ((/^פרק\s*\d+/u.test(t) || /^\d+\.\s+/u.test(t)) && t.length < 120)
            return <h3 key={i} className="spiralContentH3">{t}</h3>;
          if (/^[-•✓→]/u.test(t))
            return <div className="spiralBullet" key={i}><span style={{ color: layer.accent }}>•</span><p>{t.replace(/^[-•✓→]\s*/u, '')}</p></div>;
          return <p key={i} className="spiralPara">{t}</p>;
        })}
      </article>

      <div className="spiralReflect">
        <h3 className="spiralReflectTitle">הרהור לפני שממשיכים</h3>
        <p className="spiralReflectHint">מה לקחת מהפרק הזה? כתוב משהו — גם משפט אחד מספיק.</p>
        <textarea
          className="spiralReflectInput"
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder="מה נגע בך? מה תרצה לזכור?"
          rows={4}
        />
        <button
          className="spiralComplete"
          style={{ background: layer.color, opacity: canComplete ? 1 : 0.5 }}
          onClick={onComplete}
          disabled={!canComplete}
        >
          סיימתי פרק זה — המשך ←
        </button>
      </div>
    </div>
  );
}

export default function SpiralLibrary({ chapters, query, setQuery, corpusReady, paragraphs }: Props) {
  const learning = useLearningProgress(journeyPath);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [openLayer, setOpenLayer] = useState<string | null>('A');
  const isOwner = (() => { try { return localStorage.getItem('eil-access-mode') !== 'journey'; } catch { return true; } })();

  const isUnlocked = (num: number) => {
    if (isOwner) return true;
    const stage = journeyPath.stages.find(s => s.order === num);
    return stage ? learning.isUnlocked(stage) : false;
  };

  const isCompleted = (num: number) => {
    const stage = journeyPath.stages.find(s => s.order === num);
    return stage ? learning.isCompleted?.(stage.id) ?? false : false;
  };

  const completedCount = chapters.filter(c => isCompleted(c.number)).length;
  const percent = Math.round((completedCount / 18) * 100);

  const chapter = activeChapter ? chapters.find(c => c.number === activeChapter) : null;
  const chapterLayer = chapter ? LAYERS.find(l => l.chapters.includes(chapter.number))! : null;

  const handleComplete = () => {
    if (!chapter || !chapterLayer) return;
    const stage = journeyPath.stages.find(s => s.order === chapter.number);
    if (stage) learning.complete(stage.id, '');
    const next = chapter.number + 1;
    if (next <= 18) setActiveChapter(next);
    else setActiveChapter(null);
    scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (chapter && chapterLayer) {
    return (
      <ChapterView
        chapter={chapter}
        layer={chapterLayer}
        onBack={() => setActiveChapter(null)}
        onComplete={handleComplete}
        isOwner={isOwner}
      />
    );
  }

  return (
    <div className="spiralLibrary" dir="rtl">
      <div className="spiralHeader">
        <h1 className="spiralTitle">מסע הלמידה</h1>
        <p className="spiralSubtitle">18 פרקים · 5 שכבות · מבפנים החוצה</p>

        <div className="spiralProgress">
          <div className="spiralProgressBar">
            <div className="spiralProgressFill" style={{ width: `${percent}%` }} />
          </div>
          <span className="spiralProgressText">{completedCount} / 18 פרקים הושלמו</span>
        </div>

        <div className="spiralSearch">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="⌕ חפש בתוכן הפרקים..."
            className="spiralSearchInput"
          />
        </div>
      </div>

      <div className="spiralLayers">
        {LAYERS.map(layer => {
          const layerChapters = chapters.filter(c => layer.chapters.includes(c.number));
          const doneInLayer = layerChapters.filter(c => isCompleted(c.number)).length;
          const isOpen = openLayer === layer.id;

          return (
            <div key={layer.id} className={`spiralLayer ${isOpen ? 'spiralLayer--open' : ''}`}>
              <button
                className="spiralLayerHeader"
                style={{ borderColor: layer.color, background: isOpen ? `${layer.color}12` : 'transparent' }}
                onClick={() => setOpenLayer(isOpen ? null : layer.id)}
              >
                <div className="spiralLayerLeft">
                  <div className="spiralLayerDot" style={{ background: layer.color }} />
                  <div>
                    <div className="spiralLayerLabel" style={{ color: layer.color }}>{layer.label}</div>
                    <div className="spiralLayerWhy">{layer.why.substring(0, 60)}...</div>
                  </div>
                </div>
                <div className="spiralLayerRight">
                  <span className="spiralLayerCount" style={{ color: layer.accent }}>
                    {doneInLayer}/{layerChapters.length}
                  </span>
                  <span className="spiralLayerChevron" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                </div>
              </button>

              {isOpen && (
                <div className="spiralLayerBody">
                  <p className="spiralLayerFullWhy">{layer.why}</p>
                  <div className="spiralCards">
                    {layerChapters.map(ch => (
                      <ChapterCard
                        key={ch.number}
                        chapter={ch}
                        layer={layer}
                        isUnlocked={isUnlocked(ch.number)}
                        isCompleted={isCompleted(ch.number)}
                        isActive={activeChapter === ch.number}
                        onClick={() => { setActiveChapter(ch.number); scrollTo({ top: 0, behavior: 'smooth' }); }}
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
