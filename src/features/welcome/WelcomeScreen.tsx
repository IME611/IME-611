interface WelcomeScreenProps { onStart: () => void }

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className="welcomeScreen" dir="rtl">
      <div className="welcomeOrb welcomeOrbA" aria-hidden="true" />
      <div className="welcomeOrb welcomeOrbB" aria-hidden="true" />
      <div className="welcomeOrb welcomeOrbC" aria-hidden="true" />
      <div className="welcomeOrb welcomeOrbGold" aria-hidden="true" />
      <div className="welcomeBrand" aria-label="E.I.L">E . I . L</div>

      <section className="welcomeGlass" aria-labelledby="welcome-title">
        <div className="welcomeLensMark" aria-hidden="true"><span /></div>

        <div className="welcomeMessagePlate">
          <span className="welcomeKicker">תחילת המחקר</span>

          <h1 id="welcome-title">יצאתי למחקר.</h1>

          <div className="welcomeGoldLine" aria-hidden="true" />

          <p className="welcomeStory">
            המטרה שלו — לנתח, להבין, לקשר ולהגיע למסקנות.
            <br /><br />
            יש עובדה שאי אפשר להתכחש לה: כל יצור — נולד, חי ומת.
            <br /><br />
            אני קוראים לי עידן. ובנקודה מסוימת בחיים שאלתי את עצמי שאלה אחת פשוטה:
            <em> מי אני בעצם?</em>
          </p>

          <div className="welcomeQuestions">
            <span>האם לכל אדם יש זמן קצוב מראש?</span>
            <span>לשם מה האדם נברא מלכתחילה?</span>
            <span>מהי התכלית שלי?</span>
            <span>האם אספיק ללמוד, להבין וליישם אותה — לפני שאמות?</span>
          </div>

          <p className="welcomeStorySecond">
            הייתי בן 17. אבא שלי שכב על מיטה בבית חולים, מחובר לצינורות.
            על הקיר — שלט בכתב ידו: <strong>״אני רוצה לחיות״</strong>.
            <br /><br />
            דווקא שם, ליד המיטה הזאת, התחילו השאלות לזרום כמו מים — ולא עצרו.
            <br /><br />
            שנים עברו. אבא החלים. ואני — החלטתי לחקור.
            לא כמי שמחפש תשובות קלות, אלא כ<strong>חוקר חיצוני</strong> שמסתכל על עצמו מבחוץ.
          </p>

          <div className="welcomeLayerHint">
            <span>גוף</span>
            <span className="welcomeLayerArrow">→</span>
            <span>תודעה</span>
            <span className="welcomeLayerArrow">→</span>
            <span>אנרגיה</span>
            <span className="welcomeLayerArrow">→</span>
            <span>זהות</span>
            <span className="welcomeLayerArrow">→</span>
            <span>משמעות</span>
          </div>
        </div>

        <button className="welcomeCta" type="button" onClick={onStart}>
          <span>בואו נתחיל את המסע</span>
          <span className="welcomeArrow" aria-hidden="true">←</span>
        </button>
      </section>

      <p className="welcomeHint">18 פרקים · 5 שכבות · מסע מבפנים החוצה</p>
    </main>
  )
}
