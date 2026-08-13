interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className="welcomeScreen" dir="rtl">
      <div className="welcomeAmbient welcomeAmbientPeach" aria-hidden="true" />
      <div className="welcomeAmbient welcomeAmbientLavender" aria-hidden="true" />
      <div className="welcomeAmbient welcomeAmbientCyan" aria-hidden="true" />

      <div className="welcomeBrand" aria-label="E.I.L">E.I.L</div>

      <section className="welcomeGlass" aria-labelledby="welcome-title">
        <div className="welcomeSpark" aria-hidden="true">✦</div>
        <h1 id="welcome-title">אולי לא חסר לנו משהו.</h1>
        <p>
          אולי פשוט עוד לא הפנינו את המודעות למקומות הנכונים — אלה שיכולים להעיר בתוכנו רבדים רדומים,
          ולגלות לנו מי עוד אנחנו יכולים להיות.
        </p>
        <button className="welcomeCta" type="button" onClick={onStart}>
          <span>בואו נתחיל</span>
          <span className="welcomeArrow" aria-hidden="true">←</span>
        </button>
      </section>
    </main>
  );
}
