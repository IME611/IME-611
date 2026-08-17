const DEFAULT_BACKGROUND=50;
const DEFAULT_SPECULAR_X=24;
const DEFAULT_SPECULAR_Y=14;

function setLiquidPosition(root:HTMLElement,backgroundX:number,backgroundY:number,specularX:number,specularY:number){
 root.style.setProperty('--liquid-bg-x',`${backgroundX.toFixed(2)}%`);
 root.style.setProperty('--liquid-bg-y',`${backgroundY.toFixed(2)}%`);
 root.style.setProperty('--liquid-specular-x',`${specularX.toFixed(2)}%`);
 root.style.setProperty('--liquid-specular-y',`${specularY.toFixed(2)}%`);
}

export function bindLiquidGlassPointerTracking(root?:HTMLElement){
 if(typeof window==='undefined'||typeof document==='undefined')return()=>{};
 const target=root??document.documentElement;
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const finePointer=window.matchMedia('(pointer: fine)');
 setLiquidPosition(target,DEFAULT_BACKGROUND,DEFAULT_BACKGROUND,DEFAULT_SPECULAR_X,DEFAULT_SPECULAR_Y);
 if(reducedMotion.matches||!finePointer.matches)return()=>{};

 let frame=0;
 let backgroundX=DEFAULT_BACKGROUND;
 let backgroundY=DEFAULT_BACKGROUND;
 let specularX=DEFAULT_SPECULAR_X;
 let specularY=DEFAULT_SPECULAR_Y;

 const flush=()=>{
  frame=0;
  setLiquidPosition(target,backgroundX,backgroundY,specularX,specularY);
 };
 const schedule=()=>{if(!frame)frame=window.requestAnimationFrame(flush)};
 const onPointerMove=(event:PointerEvent)=>{
  const width=Math.max(window.innerWidth,1),height=Math.max(window.innerHeight,1);
  const nx=Math.min(1,Math.max(0,event.clientX/width));
  const ny=Math.min(1,Math.max(0,event.clientY/height));
  backgroundX=50+(nx-.5)*20;
  backgroundY=50+(ny-.5)*20;
  specularX=nx*100;
  specularY=ny*100;
  schedule();
 };
 const reset=()=>{
  backgroundX=DEFAULT_BACKGROUND;
  backgroundY=DEFAULT_BACKGROUND;
  specularX=DEFAULT_SPECULAR_X;
  specularY=DEFAULT_SPECULAR_Y;
  schedule();
 };

 window.addEventListener('pointermove',onPointerMove,{passive:true});
 window.addEventListener('blur',reset);
 document.documentElement.addEventListener('pointerleave',reset);
 return()=>{
  window.removeEventListener('pointermove',onPointerMove);
  window.removeEventListener('blur',reset);
  document.documentElement.removeEventListener('pointerleave',reset);
  if(frame)window.cancelAnimationFrame(frame);
 };
}
