import React from'react';import{createRoot}from'react-dom/client';import OpeningExperience from'./OpeningExperience';
const host=document.getElementById('opening-root');
if(host&&localStorage.getItem('eil-intro-seen')!=='1'){
 const root=createRoot(host);const close=()=>{root.unmount();host.remove()};
 root.render(<OpeningExperience onBegin={()=>{close();location.hash='#/library'}} onCreator={()=>{localStorage.setItem('eil-access-mode','owner');localStorage.setItem('eil-intro-seen','1');close();location.hash='#/dashboard'}}/>);
}else host?.remove();
