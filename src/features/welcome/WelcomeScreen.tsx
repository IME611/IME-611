import{chapters as embeddedChapters}from'../../data/chapters-embedded';

interface WelcomeScreenProps { onStart: () => void }

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className="welcomeScreen" dir="rtl">
      <div className="welcomeBrand" aria-label="E.I.L">E . I . L</div>

      <section className="welcomeGlass" aria-labelledby="welcome-hook">
        <span className="welcomeEilLabel" aria-hidden="true">E · I · L</span>
        <span className="welcomeKicker">תחילת המחקר</span>

        <h1 id="welcome-hook" className="welcomeHook">
          <span>רגע של מודעות אמיתית</span>
          <span>יכול לשנות</span>
          <span>את כל מה שאתה חושב</span>
          <span>שאתה יודע על עצמך.</span>
        </h1>

        <div className="welcomeGoldLine" aria-hidden="true" />

        <button className="welcomeCta" type="button" onClick={onStart}>
          <span>בואו נתחיל</span>
          <span className="welcomeArrow" aria-hidden="true">←</span>
        </button>
      </section>

      <p className="welcomeHint">{embeddedChapters.length} פרקים · 5 שכבות · מסע מבפנים החוצה</p>
    </main>
  )
}
