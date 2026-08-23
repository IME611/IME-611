import React,{useCallback,useState}from'react';
import type{KnowledgeItem}from'../../core/types';
import{editorHeaders,readEditorKey,rememberEditorKey}from'../../core/editorAccess';
import{fileToBase64}from'../../lib/files';
import{useDialogA11y}from'../accessibility/useDialogA11y';

interface AddSourceModalProps{
 open:boolean;
 onClose:()=>void;
 onImported:(message:string)=>void;
}

export function AddSourceModal({open,onClose,onImported}:AddSourceModalProps){
 const[file,setFile]=useState<File|null>(null);
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');
 const[editorKey,setEditorKey]=useState(readEditorKey);
 const[form,setForm]=useState<KnowledgeItem>({title:'',kind:'ידע',content:'',source:'',tags:[]});
 const reset=useCallback(()=>{setFile(null);setError('');setForm({title:'',kind:'ידע',content:'',source:'',tags:[]})},[]);
 const close=useCallback(()=>{if(busy)return;reset();onClose()},[busy,onClose,reset]);
 const dialogRef=useDialogA11y(open,close);
 if(!open)return null;

 const submit=async()=>{
  const key=editorKey.trim();
  if(!key){setError('כדי לשמור מקור יש להזין את מפתח היוצר.');return}
  if(file&&file.size>8_000_000){setError('הקובץ גדול מדי. לגרסת הבטא אפשר להעלות עד 8MB.');return}
  if(!file&&!String(form.content||'').trim()){setError('יש לבחור קובץ או להדביק טקסט מלא.');return}
  setError('');
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
   const response=await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json',...editorHeaders(key)},body:JSON.stringify(body)});
   const payload=await response.json().catch(()=>null);
   if(response.status===401)throw new Error('מפתח היוצר אינו תקין. המקור לא נשמר.');
   if(!response.ok||!payload?.ok)throw new Error(payload?.error||'שמירת המקור נכשלה');
   rememberEditorKey(key);
   onImported(`המקור נשמר בשלמותו · ${Number(payload.preservedCharacters||0).toLocaleString()} תווים · ${Number(payload.fragmentCount||0)} כרטיסיות מקור`);
   setBusy(false);
   reset();
   onClose();
  }catch(cause){const message=cause instanceof Error?cause.message:'שגיאה לא צפויה';setError(message);onImported(`ייבוא נכשל: ${message}`)}finally{setBusy(false)}
 };

 return <div className="overlay" onClick={close}>
  <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-source-title" aria-describedby={error?'add-source-error':undefined} tabIndex={-1} ref={dialogRef as React.Ref<HTMLDivElement>} onClick={event=>event.stopPropagation()}>
   <div className="modalHead"><div><span className="eyebrow">ADD TO YOUR KNOWLEDGE</span><h2 id="add-source-title">הוסף משהו שלמדת</h2></div><button type="button" className="close" aria-label="סגור חלון הוספת מקור" onClick={close}>×</button></div>
   <label className="dropZone">{file?file.name:'בחר PDF או DOCX'}<input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event=>{const selected=event.target.files?.[0]||null;setError('');setFile(selected);if(selected)setForm(current=>({...current,title:current.title||selected.name.replace(/\.[^.]+$/,''),source:selected.name}))}}/><span>{file?`${Math.ceil(file.size/1024)} KB · יישמר בשלמותו`:'לחץ לבחירת קובץ, או הדבק טקסט למטה'}</span></label>
   <label>כותרת<input value={form.title} onChange={event=>setForm({...form,title:event.target.value})} placeholder="מה זה?"/></label>
   {!file&&<label>או הדבק טקסט מלא<textarea rows={9} value={form.content} onChange={event=>setForm({...form,content:event.target.value})} placeholder="הדבק כאן..."/></label>}
   <label>מקור / URL<input value={form.source} onChange={event=>setForm({...form,source:event.target.value})} placeholder="URL, מחבר או שם מקור"/></label>
   <label>מפתח יוצר<input type="password" autoComplete="current-password" value={editorKey} onChange={event=>{setEditorKey(event.target.value);setError('')}} placeholder="נדרש כדי למנוע כתיבה ציבורית"/></label>
   {error&&<p id="add-source-error" className="formError" role="alert">{error}</p>}
   <div className="actions"><button type="button" className="secondary" onClick={close}>ביטול</button><button type="button" className="primary" disabled={busy||(!file&&!String(form.content||'').trim())} onClick={submit}>{busy?'שומר ומחבר...':'שמור מקור'}</button></div>
  </div>
 </div>;
}
