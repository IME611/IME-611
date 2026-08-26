interface WelcomeScreenProps { onStart: () => void }

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className="welcomeScreen" dir="rtl" aria-labelledby="welcome-hook">
      <div className="welcomeA11yCopy">
        <span aria-label="E.I.L">E · I · L</span>
        <h1 id="welcome-hook">
          רגע של מודעות אמיתית יכול לשנות את כל מה שאתה חושב שאתה יודע על עצמך
        </h1>
      </div>

      <button
        className="welcomeCtaHit"
        type="button"
        onClick={onStart}
        aria-label="בואו נתחיל"
      >
        <span className="welcomeSrOnly">בואו נתחיל</span>
      </button>
    </main>
  )
}
