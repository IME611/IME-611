import { useState } from 'react';
import type { PointerEvent } from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
}

function handleGlassMove(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === 'touch') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const dx = (event.clientX - rect.left - rect.width / 2) / rect.width;
  const dy = (event.clientY - rect.top - rect.height / 2) / rect.height;

  card.style.transform =
    `perspective(1100px) rotateX(${-dy * 6}deg) rotateY(${dx * 6}deg) translateZ(6px)`;
  card.style.transition = 'transform 0.07s ease';

  const sx = 42 + dx * 32;
  const sy = 42 + dy * 32;
  card.style.setProperty('--spec-x', `${sx}%`);
  card.style.setProperty('--spec-y', `${sy}%`);
  card.style.setProperty('--spec-op', '1');
}

function resetGlass(event: PointerEvent<HTMLElement>) {
  const card = event.currentTarget;
  card.style.transform =
    'perspective(1100px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
  card.style.transition = 'transform 0.55s cubic-bezier(0.22,1,0.36,1)';
  card.style.removeProperty('--spec-x');
  card.style.removeProperty('--spec-y');
  card.style.removeProperty('--spec-op');
}

const navItems = [
  { id: 'home', icon: '⌂', label: 'בית' },
  { id: 'explore', icon: '◎', label: 'חקור' },
  { id: 'saved', icon: '♡', label: 'שמור' },
  { id: 'profile', icon: '◻', label: 'פרופיל' },
] as const;

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [activeNav, setActiveNav] = useState<(typeof navItems)[number]['id']>('home');

  return (
    <div className="welcomeScreen" dir="rtl">
      <svg className="welcomeFilters" aria-hidden="true">
        <defs>
          <filter
            id="lens-distort"
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.015"
              numOctaves={3}
              seed={11}
              result="rawNoise"
            />
            <feComposite in="rawNoise" in2="SourceAlpha" operator="in" result="noise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={6}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div className="bg" aria-hidden="true" />
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />
      <div className="orb orb-4" aria-hidden="true" />

      <div className="logo" role="banner" aria-label="E.I.L">
        E . I . L
      </div>

      <main className="page">
        <article
          className="welcomeGlass glass hero-card"
          data-tilt
          aria-labelledby="welcome-title"
          onPointerMove={handleGlassMove}
          onPointerLeave={resetGlass}
        >
          <div className="glass-lens" aria-hidden="true" />
          <div className="glass-content">
            <div className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              <span className="eyebrow-text">מתוך עצמך</span>
            </div>

            <h1 id="welcome-title">כשאנחנו מכוונים את המודעות שלנו אל החזון</h1>
            <div className="gold-line" aria-hidden="true" />

            <div className="pills" aria-label="עקרונות מרכזיים">
              <span className="pill"><span className="pill-dot" aria-hidden="true" />מודעות עצמית</span>
              <span className="pill"><span className="pill-dot" aria-hidden="true" />חזון אישי</span>
              <span className="pill"><span className="pill-dot" aria-hidden="true" />שינוי אמיתי</span>
            </div>

            <p>לפעמים די בכיוון נכון של תשומת הלב כדי לפתוח אפשרויות שלא ידענו שקיימות.</p>

            <button className="btn-cta" type="button" onClick={onStart}>
              בואו נתחיל
            </button>
          </div>
        </article>

        <div className="irid-sep" aria-hidden="true" />

        <article
          className="welcomeGlass glass sec-card"
          data-tilt
          aria-label="קהילת E.I.L"
          onPointerMove={handleGlassMove}
          onPointerLeave={resetGlass}
        >
          <div className="glass-lens" aria-hidden="true" />
          <div className="glass-content">
            <div className="icon-box" aria-hidden="true">✦</div>
            <div className="sec-copy">
              <div className="sec-label">הצטרפו לקהילה</div>
              <div className="sec-sub">מעל 2,000 אנשים כבר בפנים</div>
            </div>
            <div className="gold-ring" aria-hidden="true">
              <div className="gold-ring-inner" />
            </div>
          </div>
        </article>
      </main>

      <nav className="nav-bar" aria-label="ניווט ראשי">
        {navItems.map((item) => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item${active ? ' active' : ''}`}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => setActiveNav(item.id)}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
