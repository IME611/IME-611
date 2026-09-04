import React,{useRef,useState}from'react';
import{journeyStorage}from'../../core/storage';
import{useDialogA11y}from'../accessibility/useDialogA11y';
import{navigationForMode}from'./navigation.config';

type Props={page:string;onNavigate:(id:string)=>void;onAdd:()=>void;collapsed:boolean;onCollapsedChange:(value:boolean)=>void;online:boolean};

function NavItem({id,label,question,icon,page,collapsed,onNavigate}:{id:string;label:string;question?:string;icon:string;page:string;collapsed:boolean;onNavigate:(id:string)=>void}){
 const active=page===id;
 return <button type="button" className={active?'navItem active':'navItem'} aria-current={active?'page':undefined} aria-label={collapsed?label:undefined} onClick={()=>onNavigate(id)}>
  <span className="navItemIcon" aria-hidden="true">{icon}</span>
  {!collapsed&&<span className="navItemText"><b>{label}</b>{question&&<small>{question}</small>}</span>}
  {!collapsed&&<span className="navItemArrow" aria-hidden="true">‹</span>}
 </button>;
}

export function DesktopNavigation({page,onNavigate,onAdd,collapsed,onCollapsedChange,online}:Props){
 const owner=journeyStorage.mode()==='owner';
 const navigation=navigationForMode(owner),compact=owner?collapsed:false;
 return <aside className={'productNav '+(compact?'collapsed':'')} aria-label="ניווט ראשי" dir="rtl">
  <header className="productNavHead">
   <button type="button" className="navBrand" onClick={()=>onNavigate('dashboard')} aria-label="חזרה לדף הבית">E.I.L</button>
   {!compact&&<div className="navBrandCopy"><b>E.I.L</b><small>{owner?'מצב יוצר':'המסע מחובר'}</small></div>}
   {owner&&<button type="button" className="navCollapse" onClick={()=>onCollapsedChange(!collapsed)} aria-expanded={!collapsed} aria-label={collapsed?'פתח סרגל':'כווץ סרגל'}>{collapsed?'‹':'›'}</button>}
  </header>
  {owner&&<button type="button" className="navAdd" onClick={onAdd}><span aria-hidden="true">＋</span>{!compact&&<div><b>הוסף מקור</b><small>מסמך · מאמר · מחשבה</small></div>}</button>}
  <nav aria-label="מסלולי E.I.L">
   <div className="navPrimary">{navigation.primary.map(item=><NavItem key={item.id}{...item} page={page} collapsed={compact} onNavigate={onNavigate}/>)}</div>
   {navigation.groups.map(group=><section key={group.id} aria-label={group.label}>{!compact&&<h2>{group.label}</h2>}{group.items.map(item=><NavItem key={item.id}{...item} page={page} collapsed={compact} onNavigate={onNavigate}/>)}</section>)}
  </nav>
  <footer aria-live="polite"><span className={online?'statusDot online':'statusDot'} aria-hidden="true"/>{!compact&&<small>{online?'מחובר למקורות':'מצב מקומי'}</small>}</footer>
 </aside>;
}

export function MobileNavigation({page,onNavigate,onAdd,online}:Omit<Props,'collapsed'|'onCollapsedChange'>){
 const[open,setOpen]=useState(false),owner=journeyStorage.mode()==='owner';
 const navigation=navigationForMode(owner);
 const touchStart=useRef<number|null>(null),close=()=>setOpen(false),dialogRef=useDialogA11y(open,close);
 const go=(id:string)=>{close();onNavigate(id)};
 const onTouchStart=(event:React.TouchEvent)=>{touchStart.current=event.touches[0]?.clientX??null};
 const onTouchEnd=(event:React.TouchEvent)=>{const start=touchStart.current,end=event.changedTouches[0]?.clientX;if(start!=null&&end!=null&&end-start>70)close();touchStart.current=null};
 return <>
  <button type="button" className="mobileNavButton" onClick={()=>setOpen(true)} aria-expanded={open} aria-controls="mobile-navigation" aria-haspopup="dialog"><span className="mobileNavGlyph" aria-hidden="true">☰</span><span>E.I.L</span></button>
  {open&&<div className="mobileNavBackdrop" onClick={close}>
   <aside id="mobile-navigation" className="mobileNavPanel" role="dialog" aria-modal="true" aria-label="ניווט E.I.L" tabIndex={-1} ref={dialogRef as React.Ref<HTMLElement>} onClick={event=>event.stopPropagation()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} dir="rtl">
    <header className="mobileNavHead"><div><b>E.I.L</b><small>{owner?'מצב יוצר':online?'המסע מחובר':'המסע שלי'}</small></div><button type="button" className="mobileNavClose" onClick={close} aria-label="סגור ניווט">×</button></header>
    {owner&&<button type="button" className="navAdd mobileNavAdd" onClick={()=>{close();onAdd()}}>＋ הוסף מקור</button>}
    <nav aria-label="ניווט במובייל">
     <div className="navPrimary">{navigation.primary.map(item=><NavItem key={item.id}{...item} page={page} collapsed={false} onNavigate={go}/>)}</div>
     {navigation.groups.map(group=><section key={group.id} aria-label={group.label}><h2>{group.label}</h2>{group.items.map(item=><NavItem key={item.id}{...item} page={page} collapsed={false} onNavigate={go}/>)}</section>)}
    </nav>
   </aside>
  </div>}
 </>;
}
