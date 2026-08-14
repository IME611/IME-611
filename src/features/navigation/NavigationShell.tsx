import React,{useRef,useState}from'react';
import{GlassNavigation}from'../../design/primitives/Glass';
import{useDialogA11y}from'../accessibility/useDialogA11y';
import{mentalModelNavigation,primaryNavigation}from'./navigation.config';

type Props={page:string;onNavigate:(id:string)=>void;onAdd:()=>void;collapsed:boolean;onCollapsedChange:(value:boolean)=>void;online:boolean};
const read=(key:string,fallback='')=>{try{return localStorage.getItem(key)||fallback}catch{return fallback}};

function NavItem({id,label,question,icon,page,collapsed,onNavigate}:{id:string;label:string;question?:string;icon:string;page:string;collapsed:boolean;onNavigate:(id:string)=>void}){return <button className={page===id?'navItem active':'navItem'} aria-current={page===id?'page':undefined} aria-label={collapsed?label:undefined} onClick={()=>onNavigate(id)}><i aria-hidden="true">{icon}</i>{!collapsed&&<span><b>{label}</b>{question&&<small>{question}</small>}</span>}</button>}

export function DesktopNavigation({page,onNavigate,onAdd,collapsed,onCollapsedChange,online}:Props){
 const owner=read('eil-access-mode','owner')==='owner';
 return <GlassNavigation className={'productNav '+(collapsed?'collapsed':'')} aria-label="ניווט ראשי"><header><button className="navBrand" onClick={()=>onNavigate('home')} aria-label="חזרה לדף הראשי">E</button>{!collapsed&&<div><b>E.I.L</b><small>{owner?'CREATOR MODE':'EXPLORE · UNDERSTAND · BECOME'}</small></div>}<button className="navCollapse" onClick={()=>onCollapsedChange(!collapsed)} aria-expanded={!collapsed} aria-label={collapsed?'פתח סרגל':'כווץ סרגל'}>{collapsed?'‹':'›'}</button></header>{owner&&<button className="navAdd" onClick={onAdd}><span aria-hidden="true">＋</span>{!collapsed&&<div><b>הוסף מקור</b><small>מסמך · מאמר · מחשבה</small></div>}</button>}<nav aria-label="מסלולי E.I.L">{primaryNavigation.map(item=><NavItem key={item.id}{...item} page={page} collapsed={collapsed} onNavigate={onNavigate}/>)}{mentalModelNavigation.map(group=>{const items=group.items.filter(item=>owner||!item.ownerOnly);return items.length?<section key={group.id} aria-label={group.label}>{!collapsed&&<h2>{group.label}</h2>}{items.map(item=><NavItem key={item.id}{...item} page={page} collapsed={collapsed} onNavigate={onNavigate}/>)}</section>:null})}</nav><footer aria-live="polite"><span className={online?'statusDot online':'statusDot'} aria-hidden="true"/>{!collapsed&&<small>{online?'מחובר למקורות':'מצב מקומי'}</small>}</footer></GlassNavigation>
}

export function MobileNavigation({page,onNavigate,onAdd,online}:Omit<Props,'collapsed'|'onCollapsedChange'>){
 const[open,setOpen]=useState(false),owner=read('eil-access-mode','owner')==='owner';
 const touchStart=useRef<number|null>(null),close=()=>setOpen(false),dialogRef=useDialogA11y(open,close);
 const go=(id:string)=>{close();onNavigate(id)};
 const onTouchStart=(event:React.TouchEvent)=>{touchStart.current=event.touches[0]?.clientX??null};
 const onTouchEnd=(event:React.TouchEvent)=>{const start=touchStart.current,end=event.changedTouches[0]?.clientX;if(start!=null&&end!=null&&end-start>70)close();touchStart.current=null};
 return <><button className="mobileNavButton" onClick={()=>setOpen(true)} aria-expanded={open} aria-controls="mobile-navigation" aria-haspopup="dialog">☰ <span>E.I.L</span></button>{open&&<div className="mobileNavBackdrop" onClick={close}><GlassNavigation id="mobile-navigation" className="mobileNavPanel" role="dialog" aria-modal="true" aria-label="ניווט E.I.L" tabIndex={-1} ref={dialogRef as React.Ref<HTMLElement>} onClick={event=>event.stopPropagation()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}><header><div><b>E.I.L</b><small>{online?'מחובר':'מצב מקומי'}</small></div><button onClick={close} aria-label="סגור ניווט">×</button></header>{owner&&<button className="navAdd" onClick={()=>{close();onAdd()}}>＋ הוסף מקור</button>}<nav aria-label="ניווט במובייל">{primaryNavigation.map(item=><NavItem key={item.id}{...item} page={page} collapsed={false} onNavigate={go}/>)}{mentalModelNavigation.map(group=>{const items=group.items.filter(item=>owner||!item.ownerOnly);return items.length?<section key={group.id} aria-label={group.label}><h2>{group.label}</h2>{items.map(item=><NavItem key={item.id}{...item} page={page} collapsed={false} onNavigate={go}/>)}</section>:null})}</nav></GlassNavigation></div>}</>
}
