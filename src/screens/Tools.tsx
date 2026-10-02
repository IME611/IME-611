import { useState } from "react";
import { chaptersById, journeyOrder } from "../content";
import { toolFamilies, type Tool } from "../content/tools";
import { useStore } from "../store";

function ToolItem({ tool, unlocked }: { tool: Tool; unlocked: boolean }) {
  const [open, setOpen] = useState(false);
  const station = chaptersById[tool.station];
  return (
    <li className={`tool ${open ? "is-open" : ""}`}>
      <button className="tool-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="tool-name">{tool.name}</span>
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
              צומח מהתחנה{" "}
              {unlocked ? <a href={`#/chapter/${station.id}`}>{station.title}</a> : <span>{station.title}</span>}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function Tools() {
  const { completed } = useStore();
  const done = new Set(completed);
  const current = journeyOrder.find((c) => !done.has(c.id))?.id;
  return (
    <div className="tools">
      <h1 className="journey-title">ארגז הכלים</h1>
      <p className="journey-lead">
        המסע הוא לקרוא ולהבין. הכלים הם לעשות. כל אחד מהם קצר, אפשר להתחיל בו היום — ולכל אחד יש הסבר למה הוא עובד.
      </p>
      {toolFamilies.map((f) => (
        <section key={f.id} className="tool-family">
          <h2 className="tool-family-name">{f.name}</h2>
          <p className="tool-family-intro">{f.intro}</p>
          <ul className="tool-list">
            {f.tools.map((t) => (
              <ToolItem key={t.id} tool={t} unlocked={done.has(t.station) || t.station === current} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
