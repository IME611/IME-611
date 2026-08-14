import{useEffect,useState}from'react';
import{canonicalPath,parseAppRoute,routeHash}from'./appRoute';

export function useAppNavigation(){
 const[route,setRoute]=useState(()=>parseAppRoute());
 useEffect(()=>{
  const sync=()=>setRoute(parseAppRoute());
  addEventListener('popstate',sync);
  addEventListener('hashchange',sync);
  return()=>{removeEventListener('popstate',sync);removeEventListener('hashchange',sync)};
 },[]);
 const navigate=(target:string)=>{
  const nextPath=canonicalPath(target);
  if(nextPath===route.path)return;
  history.pushState({page:nextPath,from:route.path},'',routeHash(nextPath));
  setRoute(parseAppRoute(routeHash(nextPath)));
  window.scrollTo({top:0,behavior:'smooth'});
 };
 const back=()=>{
  const state=history.state as{from?:string}|null;
  if(history.length>1){history.back();return}
  navigate(state?.from||'home');
 };
 return{page:route.root,route,navigate,back};
}
