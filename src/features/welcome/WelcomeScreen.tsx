interface WelcomeScreenProps { onStart: () => void }

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main id="main-content" className="welcomeScreen" dir="rtl" aria-labelledby="welcome-hook" tabIndex={-1}>
      <section className="welcomeContent">
        <p className="welcomeBrandMark" aria-label="E.I.L">E · I · L</p>
        <h1 id="welcome-hook" className="welcomeHook">
          <span>רגע של מודעות אמיתית</span>
          <span>יכול לשנות</span>
          <span>את כל מה שאתה חושב</span>
          <span>שאתה יודע על עצמך</span>
        </h1>
        <button className="welcomeCta" type="button" onClick={onStart}>
          <span>בואו נתחיל</span>
          <span aria-hidden="true">←</span>
        </button>
      </section>
    </main>
  )
}
