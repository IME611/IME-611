interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className="welcomeScreen" dir="rtl">
      <div className="welcomeBackdrop welcomeBackdropA" aria-hidden="true" />
      <div className="welcomeBackdrop welcomeBackdropB" aria-hidden="true" />
      <div className="welcomeBackdrop welcomeBackdropC" aria-hidden="true" />
      <div className="welcomeBrand" aria-label="E.I.L">E.I.L</div>
      <section className="welcomeGlass" aria-labelledby="welcome-title">
        <div className="welcomeCoating" aria-hidden="true" />
        <div className="welcomeGlassOrb" aria-hidden="true"><span>✦</span></div>
        <div className="welcomeMessageStack">
          <div className="welcomeMessageDepth" aria-hidden="true" />
          <div className="welcomeMessagePlate">
            <h1 id="welcome-title">כשאנחנו מכוונים את המודעות שלנו אל מה שאנחנו באמת רוצים ליצור,</h1>
            <p>משהו בתוכנו מתחיל להתארגן סביב האפשרות הזאת — ולחשוף יכולות שלא ידענו שיש בנו.</p>
          </div>
        </div>
        <div className="welcomeButtonStack">
          <div className="welcomeButtonDepth" aria-hidden="true" />
          <button className="welcomeCta" type="button" onClick={onStart}>
            <span>בואו נתחיל</span>
            <span className="welcomeArrow" aria-hidden="true">←</span>
          </button>
        </div>
      </section>
    </main>
  );
}
