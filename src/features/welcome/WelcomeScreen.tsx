interface WelcomeScreenProps{onStart:()=>void}

export function WelcomeScreen({onStart}:WelcomeScreenProps){return <main className="welcomeScreen" dir="rtl">
 <div className="welcomeOrb welcomeOrbA" aria-hidden="true"/>
 <div className="welcomeOrb welcomeOrbB" aria-hidden="true"/>
 <div className="welcomeOrb welcomeOrbC" aria-hidden="true"/>
 <div className="welcomeOrb welcomeOrbGold" aria-hidden="true"/>
 <div className="welcomeBrand" aria-label="E.I.L">E . I . L</div>
 <section className="welcomeGlass" aria-labelledby="welcome-title">
  <div className="welcomeLensMark" aria-hidden="true"><span/></div>
  <div className="welcomeMessagePlate">
   <span className="welcomeKicker">AWARENESS / BEGIN</span>
   <h1 id="welcome-title">כשאנחנו מכוונים את המודעות שלנו אל החזון והרצונות שלנו, רבדים רדומים בתוכנו מתחילים להתעורר.</h1>
   <div className="welcomeGoldLine" aria-hidden="true"/>
   <p>לפעמים די בכיוון נכון של תשומת הלב כדי לפתוח אפשרויות חדשות.</p>
  </div>
  <button className="welcomeCta" type="button" onClick={onStart}><span>בואו נתחיל</span><span className="welcomeArrow" aria-hidden="true">←</span></button>
 </section>
 <p className="welcomeHint">המסע מתחיל בשאלה, לא בתשובה.</p>
 </main>}
