import React,{useMemo,useState}from'react';
import{useCrystalCollection}from'./model/useCrystalCollection';

export function LikedCardsPage(){
 const{records,clear,toggle}=useCrystalCollection();
 const[error,setError]=useState('');
 const groups=useMemo(()=>Object.entries(records.reduce<Record<string,typeof records>>((acc,item)=>{const key=item.topic||'ללא נושא';(acc[key]??=[]).push(item);return acc},{})),[records]);
 const clearAll=()=>{if(!window.confirm('למחוק את כל הכרטיסיות ששמרת?'))return;setError(clear()?'':'לא ניתן היה לנקות את הכרטיסיות. נסה שוב.')};
 return <div className="simplePage likedCardsPage" dir="rtl">
  <header className="likedCardsHead">
   <h1 className="simplePageTitle">הכרטיסיות שאהבתי</h1>
   <p className="simplePageSub">כאן מחכות לך הכרטיסיות ששמרת לאורך המסע, יחד עם ההערות האישיות שלך.</p>
  </header>
  {error&&<p className="formError" role="alert">{error}</p>}
  {records.length===0?<div className="crystalEmpty likedCardsEmpty"><span aria-hidden="true">♡</span><b>עדיין לא שמרת כרטיסיות</b><p>במהלך הלמידה אפשר לשמור כל כרטיס שתרצה לחזור אליו.</p></div>:<div className="crystalGroups likedCardsGroups">{groups.map(([topic,items])=><section key={topic}><div className="crystalGroupHead"><h2>{topic}</h2><span>{items.length}</span></div>{items.map(item=><article className="crystalSavedCard" key={item.fragmentId}><small>{item.subtopic}</small><p>{item.text}</p>{item.personalNote&&<blockquote><strong>ההערה שלי</strong>{item.personalNote}</blockquote>}<footer><button type="button" onClick={()=>toggle(item)} aria-label={`הסר מהכרטיסיות שאהבתי: ${item.topic}`}>הסר</button></footer></article>)}</section>)}</div>}
  {records.length>0&&<footer className="likedCardsFoot"><button type="button" className="secondary" onClick={clearAll}>מחק את כל הכרטיסיות</button><span>הכרטיסיות נשמרות במכשיר הזה</span></footer>}
 </div>;
}