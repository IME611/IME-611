import { useEffect, useState } from "react";
import { chaptersById, countItems, journeyOrder } from "../content";
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
    go(next?.ready ? `chapter/${next.id}` : "journey");
  };

  return (
    <article className="chapter">
      <div className="read-progress" aria-hidden><span style={{ transform: `scaleX(${progress})` }} /></div>

      <header className="chapter-head">
        <a className="back" href="#/journey">→ המסע</a>
        <p className="eyebrow">שלב {STAGE_ORDINALS[stage.number - 1]} · {stage.name}</p>
        <h1 className="chapter-title">{chapter.title}</h1>
        <p className="chapter-sub">{chapter.subtitle}</p>
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
          ממשיכים
        </button>
      </section>
    </article>
  );
}
