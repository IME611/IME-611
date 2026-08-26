import React from'react';
import{createRoot}from'react-dom/client';
import App from'./app/App';
import{AppErrorBoundary}from'./core/errors/AppErrorBoundary';
import'./design/index.css';

const reviewMode=new URLSearchParams(window.location.search).get('editor')==='review';
let welcomeEntered=false;
try{welcomeEntered=sessionStorage.getItem('eil-welcome-entered')==='1'}catch{}
if(!reviewMode&&!welcomeEntered&&(window.location.pathname!=='/'||window.location.search||window.location.hash)){
 history.replaceState({},'', '/');
}

createRoot(document.getElementById('root')!).render(<AppErrorBoundary><App/></AppErrorBoundary>);
