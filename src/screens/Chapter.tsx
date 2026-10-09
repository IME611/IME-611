import { useEffect, useState } from "react";
import { chaptersById, countItems, journeyOrder, readMinutes, stationsOrder } from "../content";
import { RingMap } from "../components/RingMap";
import { ReadAloud } from "../components/ReadAloud";
import { STAGE_ORDINALS } from "../content/journey";
import { Blocks } from "../components/Blocks";
import { actions, useStore } from "../store";
import { go } from "../router";
import { reviewMode } from "../review";

function useReadProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? Math.min(1, window.scrollY / h) : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return p;
}

export function ChapterScreen({ id }: { id: string }) {
  const chapter = chaptersById[id];
  const { completed, crystals, reflections } = useStore();
  const progress = useReadProgress();
  const saved = crystals.find((c) => c.chapterId === id);
  const [note, setNote] = useState(reflections[id] ?? "");
  const [finished, setFinished] = useState(false);

  const idx = journeyOrder.findIndex((c) => c.id === id);
  const firstOpen = journeyOrder.findIndex((c) => !completed.includes(c.id));
  if (!chapter || idx < 0 || (!reviewMode && idx > firstOpen && firstOpen !== -1)) {
    return (
      <div className="chapter-missing">
        <p>התחנה הזו עוד נעולה.</p>
        <a href="#/journey">חזרה למסע</a>
      </div>
    );
  }

  const stage = journeyOrder[idx].stage;
  const next = journeyOrder[idx + 1];

  const finish = () => {
    actions.setReflection(id, note);
    actions.complete(id);
    setFinished(true);
    window.scrollTo(0, 0);
  };

  if (finished) {
    const done = new Set([...completed, id]);
    const doneCount = stationsOrder.filter((c) => done.has(c.id)).length;
    const nextChapter = next?.ready ? chaptersById[next.id] : undefined;
    const newStage = next && next.stage.id !== stage.id;
    return (
      <section className="finish">
        <div className="finish-seal" aria-hidden><span>◆</span></div>
        <p className="eyebrow">{stage.number === 0 ? "שער הכניסה נפתח" : "התחנה הושלמה"}</p>
        <h1 className="finish-title">{chapter.title}</h1>
        <p className="finish-crystal">{chapter.crystal}</p>
        <div className="finish-map">
          <RingMap done={done} currentId={next?.id} />
          <p className="finish-count">{doneCount} מתוך {stationsOrder.length} תחנות</p>
        </div>
        {nextChapter ? (
          <div className="finish-next">
            <p className="eyebrow">{newStage ? `מעגל חדש · ${next.stage.name}` : "התחנה הבאה"}</p>
            <p className="finish-next-title">{nextChapter.title}</p>
            <p className="finish-next-q">{nextChapter.opening}</p>
            <button className="btn-primary" onClick={() => go(`chapter/${next.id}`)}>
              ממשיכים · כ־{readMinutes(nextChapter)} דקות
            </button>
          </div>
        ) : null}
        <a className="btn-ghost finish-rest" href="#/journey">
          {nextChapter ? "עוצרים כאן להיום — נמשיך מאותה נקודה" : "חזרה למפת המסע"}
        </a>
      </section>
    );
  }

  return (
    <article className="chapter">
      <div className="read-progress" aria-hidden><span style={{ transform: `scaleX(${progress})` }} /></div>

      <header className="chapter-head">
        <a className="back" href="#/journey">→ המסע</a>
        <p className="eyebrow">{stage.number === 0 ? "שער הכניסה" : `שלב ${STAGE_ORDINALS[stage.number - 1]} · ${stage.name}`}</p>
        <h1 className="chapter-title">{chapter.title}</h1>
        <p className="chapter-sub">{chapter.subtitle}</p>
        <p className="chapter-time">כ־{readMinutes(chapter)} דקות קריאה</p>
        <ReadAloud chapter={chapter} minutes={readMinutes(chapter)} />
      </header>

      <p className="chapter-opening">{chapter.opening}</p>

      <div className="chapter-body">
        <Blocks blocks={chapter.blocks} count={countItems(chapter)} />
      </div>

      <section className="chapter-end">
        <div className="reflection">
          <p className="eyebrow">לפני שממשיכים</p>
          <p className="reflection-q">{chapter.reflection}</p>
          <label className="reflection-label" htmlFor="note">רוצה לכתוב משהו נוסף כדי להזכיר לעצמך בהמשך?</label>
          <textarea
            id="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => actions.setReflection(id, note)}
            placeholder="רק בשבילך…"
          />
        </div>

        <div className="crystal">
          <span className="crystal-gem" aria-hidden>◆</span>
          <p className="eyebrow">הקריסטל של התחנה</p>
          <p className="crystal-text">{chapter.crystal}</p>
          {saved ? (
            <button className="btn-ghost" onClick={() => actions.removeCrystal(id)}>נשמר במרחב שלי ✓</button>
          ) : (
            <button
              className="btn-ghost"
              onClick={() => actions.saveCrystal({ chapterId: id, chapterTitle: chapter.title, text: chapter.crystal, note })}
            >
              שמור לקריסטלים שלי
            </button>
          )}
        </div>

        <button className="btn-primary" onClick={finish}>
          סיימתי את התחנה
        </button>
      </section>
    </article>
  );
}
