const EDITOR_KEY='eil-editor-key';

export function readEditorKey():string{
  if(typeof window==='undefined')return'';
  try{return window.sessionStorage.getItem(EDITOR_KEY)||''}catch{return''}
}

export function rememberEditorKey(value:string):void{
  if(typeof window==='undefined')return;
  try{
    const key=value.trim();
    if(key)window.sessionStorage.setItem(EDITOR_KEY,key);
    else window.sessionStorage.removeItem(EDITOR_KEY);
  }catch{}
}

export function editorHeaders(value=readEditorKey()):Record<string,string>{
  const key=value.trim();
  return key?{'x-eil-editor-key':key}:{};
}
