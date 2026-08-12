import React,{useMemo}from'react';
import{useCrystalCollection}from'./model/useCrystalCollection';

type Props={open:boolean;onClose:()=>void};
export function CrystalCollectionDrawer({open,onClose}:Props){
 const{records,clear}=useCrystalCollection();
 const groups=useMemo(()=>Object.entries(records.reduce<Record<string,typeof records>>((acc,item)=>{const key=item.topic||'לא מקוטלג';(acc[key]??=[]).push(item);return acc},{})),[records]);
 if(!open)return null;
 return <div className="crystalOverlay" onClick={onClose}><aside className="crystalDrawer" aria-label="אוסף הקריסטלים שלי" onClick={event=>event.stopPropagation()}><header><div><span className="eyebrow">MY CRYSTAL COLLECTION</span><h2>אוסף הקריסטלים שלי</h2><p>{records.length?`${records.length} רגעים ששווה לקחת איתך`:'כרטיסים שתשמור יופיעו כאן, בלי לשנות מילה מהמקור.'}</p></div><button className="close" onClick={onClose}>×</button></header>{records.length===0?<div className="crystalEmpty"><span>◇</span><b>האוסף עדיין ריק</b><p>בכל כרטיס ידע אפשר ללחוץ על הקריסטל ולבנות בהדרגה מצפן אישי.</p></div>:<div className="crystalGroups">{groups.map(([topic,items])=><section key={topic}><div className="crystalGroupHead"><h3>{topic}</h3><span>{items.length}</span></div>{items.map(item=><article className="crystalSavedCard" key={item.fragmentId}><small>{item.subtopic||item.provenanceLabel}</small><p>{item.text}</p><footer><span>{item.sourceLabel}</span><button onClick={()=>useCrystalCollection}>{/* semantic spacer intentionally avoided */}</button></footer></article>)}</section>)}</div>}{records.length>0&&<footer className="crystalDrawerFoot"><button className="secondary" onClick={()=>{if(window.confirm('לנקות את כל אוסף הקריסטלים?'))clear()}}>נקה אוסף</button><span>נשמר מקומית במכשיר הזה</span></footer>}</aside></div>;
}
