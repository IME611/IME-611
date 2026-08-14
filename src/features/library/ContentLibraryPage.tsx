import{findTopic,findWorld,libraryWorlds}from'./contentCatalog';

type Props={segments:string[];onNavigate:(target:string)=>void};

export function ContentLibraryPage({segments,onNavigate}:Props){
 const world=findWorld(segments[0]);
 const topic=findTopic(world,segments[1]);

 if(!world)return <div className="contentLibrary" dir="rtl">
  <header className="libraryHero"><span className="spaceEyebrow">CONTENT LIBRARY</span><h1>ספריית התוכן</h1><p>הידע הציבורי של E.I.L. אפשר לחקור לפי תחום עניין, בלי להתחיל מסע ובלי להתחייב לסדר קבוע.</p><div className="librarySearch" aria-label="חיפוש בספרייה"><span>⌕</span><input placeholder="חפש נושא, מושג או שאלה..." disabled/><small>חיפוש מלא יתחבר לאינדקס התוכן בשלב הבא</small></div></header>
  <section className="homeSection"><div className="sectionIntro"><span className="spaceEyebrow">EXPLORE BY WORLD</span><h2>בחר עולם</h2><p>כל עולם הוא שער לעשרות נושאים ותתי־נושאים. אותם פריטי ידע יוכלו להופיע גם בתוך מסע הלמידה, בהקשר אחר.</p></div><div className="worldGrid">{libraryWorlds.map((item,index)=><button className="worldCard" key={item.slug} onClick={()=>onNavigate(`content-library/${item.slug}`)}><small>0{index+1}</small><span>{item.eyebrow}</span><h3>{item.title}</h3><p>{item.description}</p><b>{item.topics.length} נושאי פתיחה ←</b></button>)}</div></section>
 </div>;

 if(!topic)return <div className="contentLibrary" dir="rtl">
  <nav className="spaceBreadcrumb" aria-label="פירורי לחם"><button onClick={()=>onNavigate('home')}>ראשי</button><i>←</i><button onClick={()=>onNavigate('content-library')}>ספריית התוכן</button><i>←</i><span>{world.title}</span></nav>
  <header className="libraryWorldHero"><span className="spaceEyebrow">{world.eyebrow}</span><h1>{world.title}</h1><p>{world.description}</p><strong>{world.topics.length} נושאי פתיחה בגרסת ה־foundation</strong></header>
  <section className="topicGrid" aria-label={`נושאים בתוך ${world.title}`}>{world.topics.map(item=><button className="topicCard" key={item.slug} onClick={()=>onNavigate(`content-library/${world.slug}/${item.slug}`)}><span>TOPIC</span><h2>{item.title}</h2><p>{item.summary}</p><b>פתח נושא ←</b></button>)}</section>
  <button className="spaceTextButton" onClick={()=>onNavigate('content-library')}>→ חזרה לכל העולמות</button>
 </div>;

 return <div className="contentLibrary" dir="rtl">
  <nav className="spaceBreadcrumb" aria-label="פירורי לחם"><button onClick={()=>onNavigate('home')}>ראשי</button><i>←</i><button onClick={()=>onNavigate('content-library')}>ספריית התוכן</button><i>←</i><button onClick={()=>onNavigate(`content-library/${world.slug}`)}>{world.title}</button><i>←</i><span>{topic.title}</span></nav>
  <header className="topicHero"><span className="spaceEyebrow">TOPIC</span><h1>{topic.title}</h1><p>{topic.summary}</p></header>
  <section className="topicArchitecture"><div><span className="spaceEyebrow">TOPIC MAP</span><h2>מפת הנושא</h2><p>השלב הבא יחבר כאן את עץ תתי־הנושאים ואת כרטיסי הידע הקנוניים מה־database.</p></div><div className="topicMapPlaceholder"><span>מושג בסיס</span><i>→</i><span>מנגנונים</span><i>→</i><span>קשרים</span><i>→</i><span>יישום</span></div></section>
  <section className="knowledgeCardPlaceholder"><span className="spaceEyebrow">KNOWLEDGE CARDS</span><h2>כרטיסי הידע יתחברו למקור — לא לטקסט מומצא.</h2><p>ב־foundation הזה אני משאיר בכוונה את שכבת התוכן ריקה. הכרטיס הבא שנכניס יהיה Entity אמיתי עם source/evidence/provenance, ורק אז יהיה אפשר לשמור אותו כקריסטל.</p><button className="spaceSecondary" onClick={()=>onNavigate('journey')}>ראה את מסע הלמידה</button></section>
  <button className="spaceTextButton" onClick={()=>onNavigate(`content-library/${world.slug}`)}>→ חזרה ל־{world.title}</button>
 </div>;
}
