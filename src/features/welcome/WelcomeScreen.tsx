interface WelcomeScreenProps { onStart: () => void }

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className="welcomeScreen" dir="rtl">
      <div className="welcomeOrb welcomeOrbA" aria-hidden="true" />
      <div className="welcomeOrb welcomeOrbB" aria-hidden="true" />
      <div className="welcomeOrb welcomeOrbC" aria-hidden="true" />
      <div className="welcomeOrb welcomeOrbGold" aria-hidden="true" />
      <div className="welcomeBrand" aria-label="E.I.L">E . I . L</div>

      <section className="welcomeGlass" aria-labelledby="welcome-hook">
        <div className="welcomeLensMark" aria-hidden="true"><span /></div>

        <div className="welcomeMessagePlate">
          <span className="welcomeKicker">תחילת המחקר</span>

          <h1 id="welcome-hook" className="welcomeHook">
            רגע של מודעות אמיתית יכול לשנות את כל מה שאתה חושב שאתה יודע על עצמך.
          </h1>

          <div className="welcomeGoldLine" aria-hidden="true" />

          <p className="welcomeSubHook">
            לפעמים די בכיוון נכון של תשומת הלב כדי לפתוח אפשרויות חדשות.
          </p>
        </div>

        <button className="welcomeCta" type="button" onClick={onStart}>
          <span>בואו נתחיל</span>
          <span className="welcomeArrow" aria-hidden="true">←</span>
        </button>
      </section>

      <p className="welcomeHint">18 פרקים · 5 שכבות · מסע מבפנים החוצה</p>
    </main>
  )
}
