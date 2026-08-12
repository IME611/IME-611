import{useEffect,useRef}from'react';

const FOCUSABLE='button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useDialogA11y(open:boolean,onClose:()=>void){
 const ref=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  if(!open||!ref.current)return;
  const dialog=ref.current,previous=document.activeElement as HTMLElement|null;
  const focusables=()=>Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
  (focusables()[0]??dialog).focus();
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onClose();return}
   if(event.key!=='Tab')return;
   const items=focusables();if(!items.length){event.preventDefault();dialog.focus();return}
   const first=items[0],last=items[items.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  };
  document.addEventListener('keydown',onKey);document.body.style.overflow='hidden';
  return()=>{document.removeEventListener('keydown',onKey);document.body.style.overflow='';previous?.focus?.()};
 },[open,onClose]);
 return ref;
}
