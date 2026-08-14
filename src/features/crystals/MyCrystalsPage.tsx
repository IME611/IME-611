import type{CrystalRecord}from'./model/crystal.repository';

type Props={records:CrystalRecord[];onNavigate:(target:string)=>void};

export function MyCrystalsPage({records,onNavigate}:Props){
 return <div className="myCrystalsPage" dir="rtl">
  <header className="libraryHero"><span className="spaceEyebrow">MY CRYSTALS</span><h1>הקריסטלים שלי</h1><p>הידע שבחרת לקחת איתך. קריסטל הוא לא עוד כרטיס תוכן — הוא שכבה אישית מעל פריט ידע שממשיך להצביע למקור שלו.</p></header>
  {records.length===0?<section className="crystalsEmptyPage"><span>◇</span><h2>עדיין לא שמרת קריסטלים</h2><p>כשתמצא בספרייה פריט ידע ששווה לחזור אליו, תוכל לשמור אותו כאן. חיבור Knowledge Cards חדשים לקריסטלים יתבצע רק אחרי שיש להם מקור ו־provenance תקינים.</p><button className="spacePrimary" onClick={()=>onNavigate('content-library')}>עבור לספריית התוכן</button></section>:<section className="crystalPageGrid">{records.map(record=><article key={record.fragmentId}><span className="spaceEyebrow">{record.topic||'CRYSTAL'}</span><h2>{record.subtopic||record.conceptId||'קריסטל שמור'}</h2><p>{record.text}</p><footer><span>{record.sourceLabel}</span><small>{new Date(record.savedAt).toLocaleDateString('he-IL')}</small></footer></article>)}</section>}
 </div>;
}
