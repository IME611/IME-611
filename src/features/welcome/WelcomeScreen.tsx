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
            <h1 id="welcome-title">כשאנחנו מכוונים את המודעות שלנו אל החזון והרצונות שלנו, רבדים רדומים בתוכנו מתחילים להתעורר.</h1>
            <p>לפעמים די בכיוון נכון של תשומת הלב כדי לפתוח אפשרויות חדשות.</p>
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
