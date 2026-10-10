import { journey, gate, journeyOrder, stationsOrder, chaptersById, readMinutes } from "../content";
import { STAGE_ORDINALS } from "../content/journey";
import { useStore } from "../store";
import { RingMap } from "../components/RingMap";
import { reviewMode } from "../review";

export function Journey() {
  const { completed, name, place } = useStore();
  const done = new Set(completed);
  // הפרק הנוכחי = הראשון שעוד לא הושלם. כל מה שאחריו נעול.
  const currentIndex = journeyOrder.findIndex((c) => !done.has(c.id));
  const doneCount = stationsOrder.filter((c) => done.has(c.id)).length;
  // אם עוד לא נשמר מקום (קריאה מלפני שהתכונה נוספה) — ממשיכים מהתחנה שאחרי הרחוקה ביותר שסומנה כנקראה
  const lastDoneIdx = journeyOrder.reduce((m, c, i) => (done.has(c.id) ? i : m), -1);
  const fallback = journeyOrder[Math.min(lastDoneIdx + 1, journeyOrder.length - 1)];
  const placeEntry = (place ? journeyOrder.find((c) => c.id === place.id) : undefined) ?? fallback;
  const fresh = !place && done.size === 0;
  const placeIdx = placeEntry ? journeyOrder.indexOf(placeEntry) : -1;
  const skipped = placeIdx > 0 ? journeyOrder.slice(0, placeIdx).filter((c) => !done.has(c.id)) : [];

  return (
    <div className="journey">
      <section className="journey-intro">
        {placeEntry && (
          <a className="resume-card" href={`#/chapter/${placeEntry.id}`}>
            <span className="eyebrow">{fresh ? "מתחילים כאן" : place && place.block > 0 && !done.has(placeEntry.id) ? "עצרת באמצע" : done.has(placeEntry.id) ? "קראת לאחרונה" : "ממשיכים מכאן"}</span>
            <span className="resume-title">{placeEntry.title}</span>
            <span className="resume-sub">
              {placeEntry.stage.number === 0 ? "שער הכניסה" : `שלב ${STAGE_ORDINALS[placeEntry.stage.number - 1]}, ${placeEntry.stage.name}`}
              {place && place.block > 0 && !done.has(placeEntry.id) ? ". נמשיך מאותה פסקה" : ""}
            </span>
            <span className="resume-go">{fresh ? "להתחיל ←" : "להמשיך ←"}</span>
          </a>
        )}
        <div className="journey-map">
          <RingMap done={done} currentId={journeyOrder[currentIndex]?.id} />
          <p className="journey-map-caption">
            {doneCount === 0
              ? "המסע נע מבפנים החוצה, מהמעגל הפנימי שהוא אתה ועד המעגל החיצוני, המקור."
              : doneCount === stationsOrder.length
                ? "עברת את כל המעגלים. מכאן, הקשר הוא שלך."
                : `עברת ${doneCount} מתוך ${stationsOrder.length} תחנות. כל נקודה מוזהבת היא תחנה שכבר שלך.`}
          </p>
        </div>
        {skipped.length > 0 && (
          <p className="skipped-note">
            {skipped.length === 1 ? "תחנה אחת לפני כן עוד לא סומנה כנקראה" : `${skipped.length} תחנות לפני כן עוד לא סומנו כנקראו`}:{" "}
            {skipped.slice(0, 4).map((c, i) => (
              <span key={c.id}>{i > 0 && ", "}<a href={`#/chapter/${c.id}`}>{c.title}</a></span>
            ))}
            {skipped.length > 4 && " ועוד"}
          </p>
        )}
        <p className="eyebrow">{name ? `${name}, ברוך הבא` : "ברוך הבא"}</p>
        <h1 className="journey-title">המסע</h1>
        <p className="journey-lead">
          מסע אחד, צעד אחר צעד, ממה שאתה רואה כשאתה מסתכל על עצמך, ועד המקור שממנו הכל מגיע.
          כל תחנה נבנית על הקודמת. אין מבחנים. רק התבוננות.
        </p>
      </section>

      <ol className="stages">
        {[gate, ...journey].map((stage) => {
          const stageDone = stage.chapters.every((c) => done.has(c.id));
          return (
            <li key={stage.id} className={`stage ${stageDone ? "is-done" : ""}`}>
              <div className="stage-head">
                <span className="stage-num">{stage.number === 0 ? "◆" : stage.number}</span>
                <div>
                  <p className="stage-eyebrow">{stage.number === 0 ? "שער הכניסה" : `שלב ${STAGE_ORDINALS[stage.number - 1]}`}</p>
                  <h2 className="stage-name">{stage.name}</h2>
                  <p className="stage-question">{stage.question}</p>
                </div>
              </div>
              <ul className="chapters">
                {stage.chapters.map((c) => {
                  const idx = journeyOrder.findIndex((x) => x.id === c.id);
                  const entry = journeyOrder[idx];
                  const isDone = done.has(c.id);
                  const isCurrent = idx === currentIndex;
                  const open = (isDone || isCurrent || reviewMode) && entry.ready;
                  const status = isDone ? "נקרא" : isCurrent ? (entry.ready ? "התחל" : "בהכנה") : "נעול";
                  const inner = (
                    <>
                      <span className={`ch-dot ${isDone ? "done" : isCurrent ? "current" : ""}`} aria-hidden>
                        {isDone ? "✓" : ""}
                      </span>
                      <span className="ch-title">{c.title}{place?.id === c.id && <span className="here-badge">עצרת כאן</span>}</span>
                      <span className="ch-status">{status}{entry.ready && !isDone ? `, ${readMinutes(chaptersById[c.id])} דק׳` : ""}</span>
                    </>
                  );
                  return (
                    <li key={c.id}>
                      {open ? (
                        <a className={`ch ${isCurrent ? "is-current" : ""}`} href={`#/chapter/${c.id}`}>{inner}</a>
                      ) : (
                        <div className="ch is-locked" aria-disabled>{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
