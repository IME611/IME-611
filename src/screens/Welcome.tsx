import { journey, journeyOrder } from "../content";

export function Welcome() {
  return (
    <div className="welcome">
      <div className="welcome-glow" aria-hidden />
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
          {journey.length} שלבים · {journeyOrder.length} פרקים · מסע מבפנים החוצה
        </p>
      </div>
    </div>
  );
}
