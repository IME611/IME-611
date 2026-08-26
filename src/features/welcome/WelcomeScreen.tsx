interface WelcomeScreenProps { onStart: () => void }

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className="welcomeScreen eilLiquidBackdrop" dir="rtl" aria-labelledby="welcome-hook">
      <section className="welcomeContent">
        <div className="welcomeBrandMark eilBrandMark" aria-label="E.I.L">E · I · L</div>

        <h1 id="welcome-hook" className="welcomeHook eilCrystalInk">
          <span>רגע של מודעות אמיתית</span>
          <span>יכול לשנות</span>
          <span>את כל מה שאתה חושב</span>
          <span>שאתה יודע על עצמך</span>
        </h1>

        <button className="welcomeCta eilLiquidButton" type="button" onClick={onStart}>
          <span className="welcomeCtaLabel">בואו נתחיל</span>
          <span className="welcomeArrow" aria-hidden="true">←</span>
        </button>
      </section>
    </main>
  )
}
