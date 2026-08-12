import React,{useState}from'react';
import{mentalModelNavigation,primaryNavigation}from'./navigation.config';

type Props={page:string;onNavigate:(id:string)=>void;onAdd:()=>void;collapsed:boolean;onCollapsedChange:(value:boolean)=>void;online:boolean};
const read=(key:string,fallback='')=>{try{return localStorage.getItem(key)||fallback}catch{return fallback}};

function NavItem({id,label,question,icon,page,collapsed,onNavigate}:{id:string;label:string;question?:string;icon:string;page:string;collapsed:boolean;onNavigate:(id:string)=>void}){return <button className={page===id?'navItem active':'navItem'} aria-current={page===id?'page':undefined} onClick={()=>onNavigate(id)}><i>{icon}</i>{!collapsed&&<span><b>{label}</b>{question&&<small>{question}</small>}</span>}</button>}

export function DesktopNavigation({page,onNavigate,onAdd,collapsed,onCollapsedChange,online}:Props){
 const owner=read('eil-access-mode','owner')==='owner';
 return <aside className={'productNav '+(collapsed?'collapsed':'')} aria-label="ניווט ראשי"><header><button className="navBrand" onClick={()=>onNavigate('dashboard')} aria-label="חזרה לדשבורד">E</button>{!collapsed&&<div><b>E.I.L</b><small>{owner?'CREATOR MODE':'THE JOURNEY'}</small></div>}<button className="navCollapse" onClick={()=>onCollapsedChange(!collapsed)} aria-label={collapsed?'פתח סרגל':'כווץ סרגל'}>{collapsed?'‹':'›'}</button></header>{owner&&<button className="navAdd" onClick={onAdd}><span>＋</span>{!collapsed&&<div><b>הוסף מקור</b><small>מסמך · מאמר · מחשבה</small></div>}</button>}<nav>{primaryNavigation.map(item=><NavItem key={item.id}{...item} page={page} collapsed={collapsed} onNavigate={onNavigate}/>)}{mentalModelNavigation.map(group=>{const items=group.items.filter(item=>owner||!item.ownerOnly);return items.length?<section key={group.id}>{!collapsed&&<h2>{group.label}</h2>}{items.map(item=><NavItem key={item.id}{...item} page={page} collapsed={collapsed} onNavigate={onNavigate}/>)}</section>:null})}</nav><footer><span className={online?'statusDot online':'statusDot'}/>{!collapsed&&<small>{online?'מחובר למקורות':'מצב מקומי'}</small>}</footer></aside>
}

export function MobileNavigation({page,onNavigate,onAdd,online}:Omit<Props,'collapsed'|'onCollapsedChange'>){
 const[open,setOpen]=useState(false),owner=read('eil-access-mode','owner')==='owner';const go=(id:string)=>{setOpen(false);onNavigate(id)};
 return <><button className="mobileNavButton" onClick={()=>setOpen(true)} aria-expanded={open} aria-controls="mobile-navigation">☰ <span>E.I.L</span></button>{open&&<div className="mobileNavBackdrop" onClick={()=>setOpen(false)}><aside id="mobile-navigation" className="mobileNavPanel" onClick={event=>event.stopPropagation()}><header><div><b>E.I.L</b><small>{online?'מחובר':'מצב מקומי'}</small></div><button onClick={()=>setOpen(false)} aria-label="סגור ניווט">×</button></header>{owner&&<button className="navAdd" onClick={()=>{setOpen(false);onAdd()}}>＋ הוסף מקור</button>}<nav>{primaryNavigation.map(item=><NavItem key={item.id}{...item} page={page} collapsed={false} onNavigate={go}/>)}{mentalModelNavigation.map(group=>{const items=group.items.filter(item=>owner||!item.ownerOnly);return items.length?<section key={group.id}><h2>{group.label}</h2>{items.map(item=><NavItem key={item.id}{...item} page={page} collapsed={false} onNavigate={go}/>)}</section>:null})}</nav></aside></div>}</>
}
