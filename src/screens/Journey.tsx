import { journey, journeyOrder } from "../content";
import { STAGE_ORDINALS } from "../content/journey";
import { useStore } from "../store";
import { RingMap } from "../components/RingMap";

export function Journey() {
  const { completed, name } = useStore();
  const done = new Set(completed);
  // הפרק הנוכחי = הראשון שעוד לא הושלם. כל מה שאחריו נעול.
  const currentIndex = journeyOrder.findIndex((c) => !done.has(c.id));
  const doneCount = journeyOrder.filter((c) => done.has(c.id)).length;

  return (
    <div className="journey">
      <section className="journey-intro">
        <div className="journey-map">
          <RingMap done={done} currentId={journeyOrder[currentIndex]?.id} />
          <p className="journey-map-caption">
            {doneCount === 0
              ? "המסע נע מבפנים החוצה: מהמעגל הפנימי — אתה — ועד המעגל החיצוני, המקור."
              : `עברת ${doneCount} מתוך ${journeyOrder.length} תחנות. כל נקודה מוזהבת היא תחנה שכבר שלך.`}
          </p>
        </div>
        <p className="eyebrow">{name ? `${name}, ברוך הבא` : "ברוך הבא"}</p>
        <h1 className="journey-title">המסע</h1>
        <p className="journey-lead">
          מסע אחד, צעד אחר צעד — ממה שאתה רואה כשאתה מסתכל על עצמך, ועד המקור שממנו הכל מגיע.
          כל תחנה נבנית על הקודמת. אין מבחנים. רק התבוננות.
        </p>
      </section>

      <ol className="stages">
        {journey.map((stage) => {
          const stageDone = stage.chapters.every((c) => done.has(c.id));
          return (
            <li key={stage.id} className={`stage ${stageDone ? "is-done" : ""}`}>
              <div className="stage-head">
                <span className="stage-num">{stage.number}</span>
                <div>
                  <p className="stage-eyebrow">שלב {STAGE_ORDINALS[stage.number - 1]}</p>
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
                  const open = (isDone || isCurrent) && entry.ready;
                  const status = isDone ? "נקרא" : isCurrent ? (entry.ready ? "התחל" : "בהכנה") : "נעול";
                  const inner = (
                    <>
                      <span className={`ch-dot ${isDone ? "done" : isCurrent ? "current" : ""}`} aria-hidden>
                        {isDone ? "✓" : ""}
                      </span>
                      <span className="ch-title">{c.title}</span>
                      <span className="ch-status">{status}</span>
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
