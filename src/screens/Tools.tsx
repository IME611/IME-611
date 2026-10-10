import { useEffect, useState } from "react";
import { chaptersById, journeyOrder } from "../content";
import { STAGE_ORDINALS } from "../content/journey";
import { toolFamilies, type Tool } from "../content/tools";
import { isFirstAid, isUnlocked, toolsInJourneyOrder } from "../toolsUnlock";
import { reviewMode } from "../review";
import { actions, useStore } from "../store";

const familyOf = (t: Tool) => toolFamilies.find((f) => f.tools.some((x) => x.id === t.id));

function ToolItem({ tool, unlocked, isNew, startOpen, stationOpen }: { tool: Tool; unlocked: boolean; isNew: boolean; startOpen: boolean; stationOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const station = chaptersById[tool.station];
  useEffect(() => {
    if (open && unlocked) actions.seeTool(tool.id);
  }, [open, unlocked, tool.id]);

  if (!unlocked) {
    return (
      <li className={`tool is-locked ${open ? "is-asking" : ""}`} id={`tool-${tool.id}`}>
        <button className="tool-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <span className="tool-name">
            <span className="tool-lock" aria-hidden>🔒</span>
            {tool.name}
          </span>
          <span className="tool-promise">נפתח אחרי התחנה "{station?.title}"</span>
        </button>
        {open && (
          <div className="tool-ask">
            <p>
              הכלי הזה ייפתח אחרי התחנה "{station?.title}", ושם הוא יהיה הכי ברור. רוצה לפתוח אותו כבר עכשיו?
            </p>
            <div className="tool-ask-row">
              <button className="btn-ghost" onClick={() => actions.openToolEarly(tool.id)}>
                לפתוח עכשיו
              </button>
              {station && stationOpen && (
                <a className="btn-link" href={`#/chapter/${station.id}`}>
                  לקרוא קודם את התחנה
                </a>
              )}
            </div>
          </div>
        )}
      </li>
    );
  }
  return (
    <li className={`tool ${open ? "is-open" : ""}`} id={`tool-${tool.id}`}>
      <button className="tool-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="tool-name">
          {tool.name}
          {isNew && <span className="tool-new">חדש</span>}
        </span>
        <span className="tool-promise">{tool.promise}</span>
        <span className="tool-time">{tool.time}</span>
      </button>
      {open && (
        <div className="tool-body">
          <ol className="tool-steps">
            {tool.steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <p className="tool-why">
            <strong>{tool.personal ? "מאיפה זה בא" : "למה זה עובד"}</strong>
            {tool.why}
          </p>
          {station && (
            <p className="tool-station">
              צומח מהתחנה {stationOpen ? <a href={`#/chapter/${station.id}`}>{station.title}</a> : <span>"{station.title}"</span>}
              {familyOf(tool) && <span className="tool-family-tag">{familyOf(tool)!.name}</span>}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function Tools({ focus }: { focus?: string }) {
  const { completed, toolsSeen, toolsEarly } = useStore();
  const done = new Set(completed);
  const seen = new Set(toolsSeen);
  const unlocked = (t: Tool) => isUnlocked(t, done, toolsEarly);
  const openCount = toolsInJourneyOrder.filter(unlocked).length;
  const firstOpen = journeyOrder.find((c) => !done.has(c.id))?.id;
  const stationOpen = (id: string) => reviewMode || done.has(id) || id === firstOpen;

  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => document.getElementById(`tool-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    return () => clearTimeout(t);
  }, [focus]);

  const firstAid = toolsInJourneyOrder.filter(isFirstAid);
  // שאר הכלים: לפי שלב במסע, לפי סדר התחנות
  const byStage = new Map<string, { label: string; tools: Tool[] }>();
  for (const t of toolsInJourneyOrder.filter((x) => !isFirstAid(x))) {
    const st = journeyOrder.find((c) => c.id === t.station)?.stage;
    if (!st) continue;
    const label = st.number === 0 ? "שער הכניסה" : `שלב ${STAGE_ORDINALS[st.number - 1]}: ${st.name}`;
    if (!byStage.has(st.id)) byStage.set(st.id, { label, tools: [] });
    byStage.get(st.id)!.tools.push(t);
  }
  const item = (t: Tool) => (
    <ToolItem key={t.id} tool={t} unlocked={unlocked(t)} isNew={!isFirstAid(t) && done.has(t.station) && !toolsEarly.includes(t.id) && !seen.has(t.id)} startOpen={focus === t.id} stationOpen={stationOpen(t.station)} />
  );

  return (
    <div className="tools">
      <h1 className="journey-title">ארגז הכלים</h1>
      <p className="journey-lead">
        המסע הוא לקרוא ולהבין. הכלים הם לעשות. כל כלי נפתח כשמסיימים את התחנה שהוא צומח ממנה, כך שהוא מגיע בדיוק כשההבנה כבר שם.
      </p>
      <p className="tools-count">
        פתוחים לך {openCount} מתוך {toolsInJourneyOrder.length} כלים
      </p>

      <section className="tool-family tool-firstaid">
        <h2 className="tool-family-name">עזרה ראשונה</h2>
        <p className="tool-family-intro">שלושה כלים קצרים שפתוחים תמיד, לכל רגע שצריך אותם.</p>
        <ul className="tool-list">{firstAid.map(item)}</ul>
      </section>

      {[...byStage.entries()].map(([id, g]) => (
        <section key={id} className="tool-family">
          <h2 className="tool-family-name">{g.label}</h2>
          <ul className="tool-list">{g.tools.map(item)}</ul>
        </section>
      ))}
    </div>
  );
}
