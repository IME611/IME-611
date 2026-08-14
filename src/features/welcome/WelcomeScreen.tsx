import type { PointerEvent } from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
}

function handleGlassMove(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === 'touch') return;

  const rect = event.currentTarget.getBoundingClientRect();
  const dx = (event.clientX - rect.left - rect.width / 2) / rect.width;
  const dy = (event.clientY - rect.top - rect.height / 2) / rect.height;
  const style = event.currentTarget.style;

  style.setProperty('--glass-rot-x', `${-dy * 7}deg`);
  style.setProperty('--glass-rot-y', `${dx * 7}deg`);
  style.setProperty('--glass-shine-x', `${50 + dx * 58}%`);
  style.setProperty('--glass-shine-y', `${44 + dy * 58}%`);
}

function resetGlass(event: PointerEvent<HTMLElement>) {
  const style = event.currentTarget.style;
  style.setProperty('--glass-rot-x', '0deg');
  style.setProperty('--glass-rot-y', '0deg');
  style.setProperty('--glass-shine-x', '18%');
  style.setProperty('--glass-shine-y', '10%');
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className="welcomeScreen" dir="rtl">
      <div className="welcomeOrb welcomeOrbA" aria-hidden="true" />
      <div className="welcomeOrb welcomeOrbB" aria-hidden="true" />
      <div className="welcomeOrb welcomeOrbC" aria-hidden="true" />
      <div className="welcomeOrb welcomeOrbGold" aria-hidden="true" />

      <div className="welcomeBrand" aria-label="E.I.L">E . I . L</div>

      <section
        className="welcomeGlass glass"
        aria-labelledby="welcome-title"
        onPointerMove={handleGlassMove}
        onPointerLeave={resetGlass}
      >
        <div className="glassShine" aria-hidden="true" />
        <div className="glassRefraction" aria-hidden="true" />

        <div className="welcomeMessagePlate glassNested">
          <div className="glassShine glassShineNested" aria-hidden="true" />
          <h1 id="welcome-title">
            כשאנחנו מכוונים את המודעות שלנו אל החזון והרצונות שלנו,
            רבדים רדומים בתוכנו מתחילים להתעורר.
          </h1>
          <div className="welcomeGoldLine" aria-hidden="true" />
          <p>לפעמים די בכיוון נכון של תשומת הלב כדי לפתוח אפשרויות חדשות.</p>
        </div>

        <button className="welcomeCta" type="button" onClick={onStart}>
          בואו נתחיל
        </button>
      </section>

      <svg className="welcomeFilters" aria-hidden="true">
        <defs>
          <filter id="liquid-refract" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.008" numOctaves="3" seed="7" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="greyNoise" />
            <feComposite in="greyNoise" in2="SourceAlpha" operator="in" result="maskedNoise" />
            <feDisplacementMap in="SourceGraphic" in2="maskedNoise" scale="18" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feComposite in="displaced" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id="btn-depth" x="-20%" y="-35%" width="140%" height="170%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feOffset in="blur" dx="0" dy="3" result="shadow" />
            <feFlood floodColor="#645a46" floodOpacity="0.16" result="color" />
            <feComposite in="color" in2="shadow" operator="in" result="dropShadow" />
            <feMerge>
              <feMergeNode in="dropShadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </main>
  );
}
