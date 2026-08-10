import React from'react';import{createRoot}from'react-dom/client';import OpeningExperience from'./OpeningExperience';import'./progressive.css';
const host=document.getElementById('opening-root');
if(host&&localStorage.getItem('eil-intro-seen')!=='1'){
 const root=createRoot(host);const close=()=>{root.unmount();host.remove()};
 root.render(<OpeningExperience onBegin={()=>{close();location.hash='#/library'}} onCreator={()=>{localStorage.setItem('eil-access-mode','owner');localStorage.setItem('eil-intro-seen','1');close();location.hash='#/dashboard'}}/>);
}else host?.remove();
const syncJourneyMode=()=>{if(localStorage.getItem('eil-access-mode')!=='journey')return;const buttons=document.querySelectorAll<HTMLButtonElement>('.modeSwitch button');const journey=buttons[1];if(journey&&!journey.classList.contains('active'))journey.click()};
const observer=new MutationObserver(syncJourneyMode);observer.observe(document.body,{childList:true,subtree:true});syncJourneyMode();
