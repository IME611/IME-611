import{useEffect,useState}from'react';

const pageFromLocation=()=>location.hash.replace('#/','').split('?')[0]||'dashboard';

export function useAppNavigation(){
 const[page,setPage]=useState(pageFromLocation);
 useEffect(()=>{const sync=()=>setPage(pageFromLocation());addEventListener('popstate',sync);addEventListener('hashchange',sync);return()=>{removeEventListener('popstate',sync);removeEventListener('hashchange',sync)}},[]);
 const navigate=(id:string)=>{if(id===page)return;history.pushState({page:id,from:page},'',`#/${id}`);setPage(id);window.scrollTo({top:0,behavior:'smooth'})};
 const replace=(id:string)=>{if(id===page)return;history.replaceState({page:id,from:history.state?.from||'dashboard'},'',`#/${id}`);setPage(id);window.scrollTo({top:0,behavior:'smooth'})};
 const back=()=>{const state=history.state as{from?:string}|null;if(history.length>1){history.back();return}navigate(state?.from||'dashboard')};
 return{page,navigate,replace,back};
}
