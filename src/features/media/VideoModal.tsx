import{useEffect}from'react';

interface VideoModalProps{open:boolean;title:string;src?:string;onClose:()=>void}

export function VideoModal({open,title,src,onClose}:VideoModalProps){
 useEffect(()=>{if(!open)return;const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[open,onClose]);
 if(!open)return null;
 return <div className="videoModalBackdrop" role="presentation" onClick={onClose}><section className="videoModal" role="dialog" aria-modal="true" aria-label={title} onClick={event=>event.stopPropagation()}><header><div><span>MEDIA / EXPLAINER</span><h3>{title}</h3></div><button type="button" onClick={onClose} aria-label="סגור וידאו">×</button></header>{src?<video controls preload="metadata" src={src}>הדפדפן לא תומך בווידאו.</video>:<div className="mediaFallback"><div className="fallbackPulse"/><b>הסבר ויזואלי</b><p>אין קובץ וידאו מחובר לשכבה הזו עדיין. התוכן הלימודי והמקור ממשיכים לעבוד ללא תלות במדיה.</p></div>}</section></div>;
}
