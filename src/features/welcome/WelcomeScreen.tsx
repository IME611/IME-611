interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className="welcomeScreen" dir="rtl">
      <svg className="welcomeFilters" aria-hidden="true">
        <defs>
          <filter id="welcome-liquid-distortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.018" numOctaves="2" seed="7" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="0.7" result="softNoise" />
            <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="10" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="welcomeGlow welcomeGlowOne" aria-hidden="true" />
      <div className="welcomeGlow welcomeGlowTwo" aria-hidden="true" />
      <div className="welcomeGlow welcomeGlowThree" aria-hidden="true" />
      <div className="welcomeBrand" aria-label="E.I.L">E.I.L</div>

      <section className="welcomeSlab" aria-labelledby="welcome-title">
        <div className="welcomeSlabRefraction" aria-hidden="true" />
        <div className="welcomeGlassKnob" aria-hidden="true"><span>✦</span></div>

        <div className="welcomeMessageLift">
          <div className="welcomeMessageShadow" aria-hidden="true" />
          <div className="welcomeMessageGlass">
            <div className="welcomeMessageHighlight" aria-hidden="true" />
            <h1 id="welcome-title">כשאנחנו מכוונים את המודעות שלנו אל מה שאנחנו באמת רוצים ליצור,</h1>
            <p>משהו בתוכנו מתחיל להתארגן סביב האפשרות הזאת — ולחשוף יכולות שלא ידענו שיש בנו.</p>
          </div>
        </div>

        <div className="welcomeButtonLift">
          <div className="welcomeButtonShadow" aria-hidden="true" />
          <button className="welcomeCta" type="button" onClick={onStart}>
            <span className="welcomeCtaGlint" aria-hidden="true" />
            <span className="welcomeCtaText">בואו נתחיל</span>
            <span className="welcomeArrow" aria-hidden="true">←</span>
          </button>
        </div>
      </section>
    </main>
  );
}
