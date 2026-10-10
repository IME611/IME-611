import { useEffect, useState } from "react";
import { chaptersById, journeyOrder } from "../content";
import { STAGE_ORDINALS } from "../content/journey";
import { toolFamilies, type Tool } from "../content/tools";
import { isUnlocked, toolsInJourneyOrder } from "../toolsUnlock";
import { actions, useStore } from "../store";

const familyOf = (t: Tool) => toolFamilies.find((f) => f.tools.some((x) => x.id === t.id));

function ToolItem({ tool, unlocked, isNew, startOpen }: { tool: Tool; unlocked: boolean; isNew: boolean; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen && unlocked);
  const station = chaptersById[tool.station];
  useEffect(() => {
    if (open) actions.seeTool(tool.id);
  }, [open, tool.id]);

  if (!unlocked) {
    return (
      <li className="tool is-locked" id={`tool-${tool.id}`}>
        <div className="tool-head">
          <span className="tool-name">
            <span className="tool-lock" aria-hidden>🔒</span>
            {tool.name}
          </span>
          <span className="tool-promise">נפתח אחרי התחנה "{station?.title}"</span>
        </div>
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
              צומח מהתחנה <a href={`#/chapter/${station.id}`}>{station.title}</a>
              {familyOf(tool) && <span className="tool-family-tag">{familyOf(tool)!.name}</span>}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function Tools({ focus }: { focus?: string }) {
  const { completed, toolsSeen } = useStore();
  const done = new Set(completed);
  const seen = new Set(toolsSeen);
  const openCount = toolsInJourneyOrder.filter((t) => isUnlocked(t, done)).length;

  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => document.getElementById(`tool-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    return () => clearTimeout(t);
  }, [focus]);

  // קיבוץ לפי שלב במסע, לפי סדר התחנות
  const byStage = new Map<string, { label: string; tools: Tool[] }>();
  for (const t of toolsInJourneyOrder) {
    const st = journeyOrder.find((c) => c.id === t.station)?.stage;
    if (!st) continue;
    const label = st.number === 0 ? "שער הכניסה" : `שלב ${STAGE_ORDINALS[st.number - 1]}: ${st.name}`;
    if (!byStage.has(st.id)) byStage.set(st.id, { label, tools: [] });
    byStage.get(st.id)!.tools.push(t);
  }

  return (
    <div className="tools">
      <h1 className="journey-title">ארגז הכלים</h1>
      <p className="journey-lead">
        המסע הוא לקרוא ולהבין. הכלים הם לעשות. כל כלי נפתח כשמסיימים את התחנה שהוא צומח ממנה, כך שהוא מגיע בדיוק כשההבנה כבר שם.
      </p>
      <p className="tools-count">
        פתוחים לך {openCount} מתוך {toolsInJourneyOrder.length} כלים
      </p>
      {[...byStage.entries()].map(([id, g]) => (
        <section key={id} className="tool-family">
          <h2 className="tool-family-name">{g.label}</h2>
          <ul className="tool-list">
            {g.tools.map((t) => (
              <ToolItem key={t.id} tool={t} unlocked={isUnlocked(t, done)} isNew={done.has(t.station) && !seen.has(t.id)} startOpen={focus === t.id} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
