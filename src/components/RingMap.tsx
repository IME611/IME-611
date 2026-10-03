import { journey, journeyOrder, stationsOrder } from "../content";
import { go } from "../router";
import { reviewMode } from "../review";

/**
 * מפת המעגלים: המסע מבפנים החוצה.
 * המעגל הפנימי = "מי אני", החיצוני = "המקור". כל תחנה היא נקודה על המעגל של השלב שלה.
 */
type Props = {
  done?: Set<string>;
  currentId?: string;
  /** במצב דקורטיבי (מסך הפתיחה) — בלי תוויות ובלי לחיצה */
  decorative?: boolean;
};

const SIZE = 360;
const C = SIZE / 2;
const R0 = 34; // רדיוס המעגל הפנימי
const STEP = 24; // מרחק בין מעגלים

export function RingMap({ done = new Set(), currentId, decorative = false }: Props) {
  const rings = journey.map((stage, i) => {
    const r = R0 + i * STEP;
    const n = stage.chapters.length;
    // כל שלב מסובב מעט — כדי שהנקודות ייצרו ספירלה ולא קו ישר
    const offset = -Math.PI / 2 + i * 0.55;
    const dots = stage.chapters.map((c, j) => {
      const a = offset + (j * 2 * Math.PI) / n;
      const entry = journeyOrder.find((x) => x.id === c.id);
      return { id: c.id, title: c.title, x: C + r * Math.cos(a), y: C + r * Math.sin(a), ready: Boolean(entry?.ready) };
    });
    const stageDone = stage.chapters.every((c) => done.has(c.id));
    return { stage, r, dots, stageDone };
  });
  const outer = R0 + (journey.length - 1) * STEP;

  return (
    <svg
      className={`ringmap ${decorative ? "is-decorative" : ""} ${!decorative && done.size >= journeyOrder.length ? "is-complete" : ""}`}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `מפת המסע: ${stationsOrder.filter((c) => done.has(c.id)).length} מתוך ${stationsOrder.length} תחנות הושלמו`}
    >
      <defs>
        <radialGradient id="rm-source" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e3c77a" stopOpacity="0" />
          <stop offset="78%" stopColor="#e3c77a" stopOpacity="0" />
          <stop offset="92%" stopColor="#e3c77a" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#e3c77a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={outer + 26} fill="url(#rm-source)" />
      {rings.map(({ stage, r, stageDone }, i) => (
        <circle
          key={stage.id}
          className={`rm-ring ${stageDone ? "is-done" : ""}`}
          cx={C}
          cy={C}
          r={r}
          style={{ animationDelay: `${0.15 * i}s` }}
        />
      ))}
      {(() => {
        // הנקודה שבמרכז = שער הכניסה (הפרולוג)
        const isDone = done.has("prologue");
        const isCurrent = currentId === "prologue";
        const open = !decorative && (isDone || isCurrent || reviewMode);
        return (
          <g
            className={`rm-dot rm-gate ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""} ${open ? "is-open" : ""}`}
            onClick={open ? () => go("chapter/prologue") : undefined}
            onKeyDown={open ? (e) => (e.key === "Enter" || e.key === " ") && go("chapter/prologue") : undefined}
            tabIndex={open ? 0 : undefined}
            role={open ? "link" : undefined}
            aria-label={open ? "לפני שמתחילים" : undefined}
          >
            {isCurrent && <circle className="rm-halo" cx={C} cy={C} r={13} />}
            <circle className="rm-core" cx={C} cy={C} r={isCurrent ? 7 : 5.5} />
            {!decorative && <title>לפני שמתחילים</title>}
          </g>
        );
      })()}
      {!decorative && (
        <text className="rm-label rm-label-core" x={C} y={C + 20} textAnchor="middle">אני</text>
      )}
      {rings.map(({ dots }) =>
        dots.map((d) => {
          const isDone = done.has(d.id);
          const isCurrent = d.id === currentId;
          const open = !decorative && d.ready && (isDone || isCurrent || reviewMode);
          return (
            <g
              key={d.id}
              className={`rm-dot ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""} ${open ? "is-open" : ""}`}
              onClick={open ? () => go(`chapter/${d.id}`) : undefined}
              onKeyDown={open ? (e) => (e.key === "Enter" || e.key === " ") && go(`chapter/${d.id}`) : undefined}
              tabIndex={open ? 0 : undefined}
              role={open ? "link" : undefined}
              aria-label={open ? d.title : undefined}
            >
              {isCurrent && <circle className="rm-halo" cx={d.x} cy={d.y} r={11} />}
              <circle cx={d.x} cy={d.y} r={isCurrent ? 6 : 4.2} />
              {!decorative && <title>{d.title}</title>}
            </g>
          );
        }),
      )}
      {!decorative && (
        <text className="rm-label rm-label-source" x={C} y={C - outer - 12} textAnchor="middle">המקור</text>
      )}
    </svg>
  );
}
