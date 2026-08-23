import React,{useMemo,useState}from'react';
import{useDialogA11y}from'../accessibility/useDialogA11y';
import{useCrystalCollection}from'./model/useCrystalCollection';

type Props={open:boolean;onClose:()=>void};
export function CrystalCollectionDrawer({open,onClose}:Props){
 const{records,clear}=useCrystalCollection();
 const[error,setError]=useState('');
 const groups=useMemo(()=>Object.entries(records.reduce<Record<string,typeof records>>((acc,item)=>{const key=item.topic||'לא מקוטלג';(acc[key]??=[]).push(item);return acc},{})),[records]);
 const dialogRef=useDialogA11y(open,onClose);
 if(!open)return null;
 const clearAll=()=>{if(!window.confirm('לנקות את כל אוסף הקריסטלים?'))return;setError(clear()?'':'לא ניתן היה לנקות את האוסף. נסה שוב.')};
 return <div className="crystalOverlay" onClick={onClose}><aside className="crystalDrawer" role="dialog" aria-modal="true" aria-labelledby="crystal-drawer-title" tabIndex={-1} ref={dialogRef as React.Ref<HTMLElement>} onClick={event=>event.stopPropagation()}><header><div><span className="eyebrow">MY CRYSTAL COLLECTION</span><h2 id="crystal-drawer-title">אוסף הקריסטלים שלי</h2><p>{records.length?`${records.length} רגעים ששווה לקחת איתך`:'כרטיסים שתשמור יופיעו כאן, בלי לשנות מילה מהמקור.'}</p></div><button type="button" className="close" aria-label="סגור את אוסף הקריסטלים" onClick={onClose}>×</button></header>{error&&<p className="formError" role="alert">{error}</p>}{records.length===0?<div className="crystalEmpty"><span>◇</span><b>האוסף עדיין ריק</b><p>בכל כרטיס ידע אפשר ללחוץ על הקריסטל ולבנות בהדרגה מצפן אישי.</p></div>:<div className="crystalGroups">{groups.map(([topic,items])=><section key={topic}><div className="crystalGroupHead"><h3>{topic}</h3><span>{items.length}</span></div>{items.map(item=><article className="crystalSavedCard" key={item.fragmentId}><small>{item.subtopic||item.provenanceLabel}</small><p>{item.text}</p><footer><span>{item.sourceLabel}</span><span>{item.provenanceLabel}</span></footer></article>)}</section>)}</div>}{records.length>0&&<footer className="crystalDrawerFoot"><button type="button" className="secondary" onClick={clearAll}>נקה אוסף</button><span>נשמר מקומית בדפדפן הזה</span></footer>}</aside></div>;
}
