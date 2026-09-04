import React,{useMemo,useState}from'react';
import{useCrystalCollection}from'./model/useCrystalCollection';

export function LikedCardsPage(){
 const{records,clear,toggle}=useCrystalCollection();
 const[error,setError]=useState('');
 const groups=useMemo(()=>Object.entries(records.reduce<Record<string,typeof records>>((acc,item)=>{const key=item.topic||'לא מקוטלג';(acc[key]??=[]).push(item);return acc},{})),[records]);
 const clearAll=()=>{if(!window.confirm('לנקות את כל הכרטיסיות שאהבת?'))return;setError(clear()?'':'לא ניתן היה לנקות את הכרטיסיות. נסה שוב.')};
 return <div className="simplePage likedCardsPage" dir="rtl">
  <header className="likedCardsHead">
   <span className="eyebrow">MY SAVED CARDS</span>
   <h1 className="simplePageTitle">הכרטיסיות שאהבתי</h1>
   <p className="simplePageSub">כל הכרטיסיות שסימנת ושמרת לאורך המסע, יחד עם ההערות האישיות שלך.</p>
  </header>
  {error&&<p className="formError" role="alert">{error}</p>}
  {records.length===0?<div className="crystalEmpty likedCardsEmpty"><span aria-hidden="true">♡</span><b>עדיין לא שמרת כרטיסיות</b><p>כרטיס שתסמן במהלך הלמידה יופיע כאן ויישמר מקומית בדפדפן הזה.</p></div>:<div className="crystalGroups likedCardsGroups">{groups.map(([topic,items])=><section key={topic}><div className="crystalGroupHead"><h2>{topic}</h2><span>{items.length}</span></div>{items.map(item=><article className="crystalSavedCard" key={item.fragmentId}><small>{item.subtopic||item.provenanceLabel}</small><p>{item.text}</p>{item.personalNote&&<blockquote><strong>ההערה שלי</strong>{item.personalNote}</blockquote>}<footer><span>{item.sourceLabel} · {item.provenanceLabel}</span><button type="button" onClick={()=>toggle(item)} aria-label={`הסר מהכרטיסיות שאהבתי: ${item.topic}`}>הסר</button></footer></article>)}</section>)}</div>}
  {records.length>0&&<footer className="likedCardsFoot"><button type="button" className="secondary" onClick={clearAll}>נקה את כל הכרטיסיות</button><span>נשמר מקומית בדפדפן הזה</span></footer>}
 </div>;
}
