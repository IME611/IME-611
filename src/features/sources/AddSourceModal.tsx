import React,{useState}from'react';
import type{KnowledgeItem}from'../../core/types';
import{fileToBase64}from'../../lib/files';

interface AddSourceModalProps{
 open:boolean;
 onClose:()=>void;
 onImported:(message:string)=>void;
}

export function AddSourceModal({open,onClose,onImported}:AddSourceModalProps){
 const[file,setFile]=useState<File|null>(null);
 const[busy,setBusy]=useState(false);
 const[form,setForm]=useState<KnowledgeItem>({title:'',kind:'ידע',content:'',source:'',tags:[]});
 if(!open)return null;

 const close=()=>{if(busy)return;setFile(null);setForm({title:'',kind:'ידע',content:'',source:'',tags:[]});onClose()};
 const submit=async()=>{
  if(!file&&!String(form.content||'').trim())return;
  setBusy(true);
  try{
   const body:{[key:string]:unknown}={
    title:form.title||file?.name||'ידע חדש',
    sourceFilename:file?.name||form.source||'manual.txt',
    mimeType:file?.type||'text/plain',
    text:file?undefined:form.content,
    sourceUrl:form.source||'',
   };
   if(file)body.fileBase64=await fileToBase64(file);
   const response=await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const payload=await response.json();
   if(!response.ok||!payload.ok)throw new Error(payload.error||'import failed');
   onImported(`המקור נשמר בשלמותו · ${Number(payload.preservedCharacters||0).toLocaleString()} תווים · ${Number(payload.fragmentCount||0)} כרטיסיות מקור`);
   close();
  }catch(error){onImported(`ייבוא נכשל: ${error instanceof Error?error.message:'שגיאה'}`)}finally{setBusy(false)}
 };

 return <div className="overlay" onClick={close}>
  <div className="modal" onClick={event=>event.stopPropagation()}>
   <div className="modalHead"><div><span className="eyebrow">ADD TO YOUR KNOWLEDGE</span><h2>הוסף משהו שלמדת</h2></div><button className="close" onClick={close}>×</button></div>
   <label className="dropZone">{file?file.name:'בחר PDF / DOCX / TXT / MD / CSV / JSON / HTML'}<input type="file" accept=".pdf,.docx,.txt,.md,.csv,.json,.html,.htm,application/pdf" onChange={event=>{const selected=event.target.files?.[0]||null;setFile(selected);if(selected)setForm(current=>({...current,title:current.title||selected.name.replace(/\.[^.]+$/,''),source:selected.name}))}}/><span>{file?`${Math.ceil(file.size/1024)} KB · יישמר בשלמותו`:'לחץ לבחירת קובץ'}</span></label>
   <label>כותרת<input value={form.title} onChange={event=>setForm({...form,title:event.target.value})} placeholder="מה זה?"/></label>
   {!file&&<label>או הדבק טקסט מלא<textarea rows={9} value={form.content} onChange={event=>setForm({...form,content:event.target.value})} placeholder="הדבק כאן..."/></label>}
   <label>מקור / URL<input value={form.source} onChange={event=>setForm({...form,source:event.target.value})} placeholder="URL, מחבר או שם מקור"/></label>
   <div className="actions"><button className="secondary" onClick={close}>ביטול</button><button className="primary" disabled={busy||(!file&&!String(form.content||'').trim())} onClick={submit}>{busy?'שומר ומחבר...':'שמור מקור'}</button></div>
  </div>
 </div>;
}
