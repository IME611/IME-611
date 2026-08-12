import{useDialogA11y}from'../accessibility/useDialogA11y';

interface VideoModalProps{open:boolean;title:string;src?:string;onClose:()=>void}

export function VideoModal({open,title,src,onClose}:VideoModalProps){
 const dialogRef=useDialogA11y(open,onClose);
 if(!open)return null;
 return <div className="videoModalBackdrop" role="presentation" onClick={onClose}><section ref={dialogRef} className="videoModal" role="dialog" aria-modal="true" aria-labelledby="video-modal-title" tabIndex={-1} onClick={event=>event.stopPropagation()}><header><div><span>MEDIA / EXPLAINER</span><h3 id="video-modal-title">{title}</h3></div><button type="button" onClick={onClose} aria-label="סגור וידאו">×</button></header>{src?<video controls preload="metadata" src={src}>הדפדפן לא תומך בווידאו.</video>:<div className="mediaFallback" role="status"><div className="fallbackPulse" aria-hidden="true"/><b>הסבר ויזואלי</b><p>אין קובץ וידאו מחובר לשכבה הזו עדיין. התוכן הלימודי והמקור ממשיכים לעבוד ללא תלות במדיה.</p></div>}</section></div>;
}
