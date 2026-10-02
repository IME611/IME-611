import { journeyOrder } from "../content";
import { RingMap } from "../components/RingMap";

export function Welcome() {
  return (
    <div className="welcome">
      <div className="welcome-rings" aria-hidden><RingMap decorative /></div>
      <div className="welcome-inner">
        <p className="welcome-brand">E · I · L</p>
        <h1 className="welcome-hook">
          <span>רגע של מודעות אמיתית</span>
          <span>יכול לשנות</span>
          <span>את כל מה שאתה חושב</span>
          <span>שאתה יודע על עצמך.</span>
        </h1>
        <a className="welcome-cta" href="#/journey">תחילת המסע</a>
        <p className="welcome-meta">
          {journeyOrder.length} תחנות בשישה מעגלים, מבפנים החוצה
        </p>
      </div>
    </div>
  );
}
