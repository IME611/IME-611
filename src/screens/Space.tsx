import { useState } from "react";
import { journeyOrder } from "../content";
import { actions, useStore } from "../store";

export function Space() {
  const { crystals, reflections, name } = useStore();
  const [draft, setDraft] = useState(name);
  const ordered = [...crystals].sort(
    (a, b) => journeyOrder.findIndex((c) => c.id === a.chapterId) - journeyOrder.findIndex((c) => c.id === b.chapterId),
  );

  return (
    <div className="space">
      <p className="eyebrow">המרחב האישי</p>
      <h1 className="journey-title">הקריסטלים שלי</h1>
      <p className="journey-lead">התובנות ששמרת לאורך המסע — והמילים שכתבת לעצמך.</p>

      {ordered.length === 0 ? (
        <div className="empty">
          <span className="crystal-gem" aria-hidden>◆</span>
          <p>עוד אין כאן קריסטלים. בסוף כל פרק אפשר לשמור את התובנה שלו.</p>
          <a className="btn-ghost" href="#/journey">למסע</a>
        </div>
      ) : (
        <ul className="crystal-list">
          {ordered.map((c) => (
            <li key={c.chapterId} className="crystal">
              <span className="crystal-gem" aria-hidden>◆</span>
              <p className="eyebrow">{c.chapterTitle}</p>
              <p className="crystal-text">{c.text}</p>
              {(reflections[c.chapterId] || c.note) && (
                <p className="crystal-note">״{reflections[c.chapterId] || c.note}״</p>
              )}
              <button className="btn-link" onClick={() => actions.removeCrystal(c.chapterId)}>הסר</button>
            </li>
          ))}
        </ul>
      )}

      <section className="settings">
        <h2>הגדרות</h2>
        <label htmlFor="name">איך לקרוא לך?</label>
        <div className="settings-row">
          <input id="name" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="השם שלך" />
          <button className="btn-ghost" onClick={() => actions.setName(draft.trim())}>שמור</button>
        </div>
        <button
          className="btn-danger"
          onClick={() => confirm("לאפס את כל ההתקדמות והקריסטלים?") && actions.reset()}
        >
          איפוס המסע
        </button>
      </section>
    </div>
  );
}
