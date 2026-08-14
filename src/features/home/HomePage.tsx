import{libraryWorlds}from'../library/contentCatalog';

type Props={onNavigate:(target:string)=>void;hasActivity:boolean};

export function HomePage({onNavigate,hasActivity}:Props){
 return <div className="productHome" dir="rtl">
  <section className="homeHero" aria-labelledby="home-title">
   <div className="homeHumanField" aria-hidden="true"><div className="homeHuman"><i/><b/><span/></div><div className="homeOrbit orbitOne"/><div className="homeOrbit orbitTwo"/><div className="homeOrbit orbitThree"/></div>
   <div className="homeHeroCopy">
    <span className="spaceEyebrow">E.I.L / EXPLORE · UNDERSTAND · BECOME</span>
    <h1 id="home-title">להבין יותר.<br/>לראות עמוק יותר.<br/>לחיות אחרת.</h1>
    <p>E.I.L הוא מרחב לחקירה של האדם — התודעה, הגוף, הזהות, היחסים והמשמעות. הידע כאן אינו יעד בפני עצמו; הוא חומר גלם לתהליך שמחבר בין הבנה, התבוננות וחיים.</p>
    <div className="homeActions"><button className="spacePrimary" onClick={()=>onNavigate('journey')}>התחל את המסע</button><button className="spaceSecondary" onClick={()=>onNavigate('content-library')}>ספריית התוכן</button></div>
    {hasActivity&&<button className="homeResume" onClick={()=>onNavigate('my-space')}>יש לך פעילות קודמת — המשך למרחב שלי ←</button>}
   </div>
  </section>

  <section className="homeSection" aria-labelledby="worlds-title">
   <div className="sectionIntro"><span className="spaceEyebrow">FIVE WORLDS</span><h2 id="worlds-title">מה חוקרים כאן?</h2><p>חמישה עולמות מארגנים את הידע. אפשר להיכנס מכל מקום, בלי להתחייב למסלול.</p></div>
   <div className="worldGrid">{libraryWorlds.map((world,index)=><button className="worldCard" key={world.slug} onClick={()=>onNavigate(`content-library/${world.slug}`)}><small>0{index+1}</small><span>{world.eyebrow}</span><h3>{world.title}</h3><p>{world.description}</p><b>חקור את העולם ←</b></button>)}</div>
  </section>

  <section className="homeSection spiralSection" aria-labelledby="spiral-title">
   <div className="spiralVisual" aria-hidden="true"><i className="spiralRing ring1"/><i className="spiralRing ring2"/><i className="spiralRing ring3"/><i className="spiralRing ring4"/><div className="spiralCore">אותו נושא<br/><b>בעומק חדש</b></div></div>
   <div className="sectionIntro"><span className="spaceEyebrow">SPIRAL LEARNING</span><h2 id="spiral-title">אנחנו לא לומדים בקו ישר</h2><p>נושאים עמוקים לא נגמרים אחרי מפגש אחד. חוזרים אליהם עם הקשר חדש, מחברים אותם לתחומים נוספים ובודקים מה הם משנים בדרך שבה אנחנו רואים ופועלים.</p><div className="mechanismGrid"><article><b>01</b><h3>חזרה בהקשר חדש</h3><p>רעיון מוכר מקבל משמעות אחרת כשהידע והניסיון מתרחבים.</p></article><article><b>02</b><h3>חיבור בין תחומים</h3><p>הגוף, התודעה, היחסים והמשמעות אינם איים נפרדים.</p></article><article><b>03</b><h3>יישום וחוויה</h3><p>המטרה היא לא רק לדעת — אלא לזהות מה משתנה בחיים עצמם.</p></article></div></div>
  </section>

  <section className="homeSection whySection"><span className="spaceEyebrow">WHY E.I.L EXISTS</span><h2>לא עוד מקום שאוסף מידע.</h2><p>יש היום כמעט אינסוף ידע, אבל הוא מפוזר בין תחומים, ספרים, מחקרים וחוויות. E.I.L נבנה כדי לחבר בין החלקים וליצור מפה שאפשר לחזור אליה שוב ושוב.</p><blockquote>המטרה היא לא לבנות עוד אתר תוכן. המטרה היא לבנות מפה להבנת האדם.</blockquote></section>

  <section className="homeLibraryCta"><div><span className="spaceEyebrow">START ANYWHERE</span><h2>רוצה פשוט להתחיל לחקור?</h2><p>פתח את הספרייה, בחר עולם ונושא, והתקדם בקצב שלך.</p></div><button className="spacePrimary" onClick={()=>onNavigate('content-library')}>פתח את ספריית התוכן</button></section>
 </div>;
}
