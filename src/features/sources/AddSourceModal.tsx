import React,{useCallback,useMemo,useState}from'react';
import{readEditorKey,rememberEditorKey}from'../../core/editorAccess';
import{fileToBase64}from'../../lib/files';
import{useDialogA11y}from'../accessibility/useDialogA11y';
import{sourceIntakeApi,type IntakeAnalysis,type IntakeMatch,type IntakeVerdict}from'./source-intake.api';

interface AddSourceModalProps{
 open:boolean;
 onClose:()=>void;
 onImported:(message:string)=>void;
}

const verdictCopy:Record<IntakeVerdict,{label:string;summary:string;recommendation:string}>={
 EXISTS:{label:'כבר קיים',summary:'רוב החומר כבר מיוצג במאגר.',recommendation:'מומלץ לבדוק את ההתאמות. אפשר לשמור אותו כמקור נוסף, אך אין צורך ליצור ממנו תוכן כפול.'},
 EXTENDS:{label:'מרחיב נושא קיים',summary:'נמצאה חפיפה משמעותית לצד רעיונות חדשים.',recommendation:'מומלץ להוסיף את המקור ולשלב רק את החלקים החדשים לאחר בדיקה.'},
 CONFLICTS:{label:'נמצאה סתירה',summary:'חלק מהטענות מתנגשות עם חומר דומה שכבר קיים.',recommendation:'מומלץ להשאיר לבדיקה ולא לשלב בתוכנית לפני הכרעה אנושית.'},
 NEW:{label:'חדש למאגר',summary:'רוב הרעיונות אינם מיוצגים כרגע במאגר.',recommendation:'מומלץ להוסיף את המקור, ולאחר מכן לאשר בנפרד את מיקומו וסדר הלמידה.'},
 RELATED:{label:'קשור לחומר קיים',summary:'החומר קרוב לנושאים קיימים, אך אינו כפילות ברורה.',recommendation:'מומלץ להוסיף כמקור ולהחליט ידנית אילו חלקים מרחיבים את התוכנית.'},
 UNCERTAIN:{label:'דרושה בדיקה',summary:'ההשוואה אינה חד־משמעית.',recommendation:'מומלץ להשאיר בתור הבדיקה. שום דבר לא ייכנס אוטומטית.'},
};

const confidence=(value:unknown)=>Number.isFinite(Number(value))?`${Math.round(Number(value)*100)}%`:'—';
const basisCopy:Record<NonNullable<IntakeMatch['basis']>,string>={EXACT_TEXT:'טקסט זהה',PHRASE:'ניסוח מוכל',CONCEPT_EQUIVALENCE:'מונח מקביל',CONCEPT_CONTEXT:'התאמה מושגית',LEXICAL_OVERLAP:'חפיפת ניסוח'};
const matchEvidence=(match:IntakeMatch)=>{const basis=basisCopy[match.basis||'LEXICAL_OVERLAP'],concepts=match.matchedConcepts?.map(item=>item.label).filter(Boolean)||[];return concepts.length?`${basis}: ${concepts.join(', ')}`:basis};
const isImageFile=(file:File|null)=>Boolean(file&&(file.type.startsWith('image/')||/\.(png|jpe?g|webp|gif)$/i.test(file.name)));

export function AddSourceModal({open,onClose,onImported}:AddSourceModalProps){
 const[file,setFile]=useState<File|null>(null);
 const[busy,setBusy]=useState<'idle'|'analyzing'|'deciding'>('idle');
 const[error,setError]=useState('');
 const[keyStatus,setKeyStatus]=useState<'idle'|'checking'|'valid'>('idle');
 const[editorKey,setEditorKey]=useState(readEditorKey);
 const[title,setTitle]=useState('');
 const[text,setText]=useState('');
 const[sourceUrl,setSourceUrl]=useState('');
 const[analysis,setAnalysis]=useState<IntakeAnalysis|null>(null);
 const[approvedResult,setApprovedResult]=useState<{message:string;publicationReady:boolean}|null>(null);
 const imageFile=useMemo(()=>isImageFile(file),[file]);
 const hasInput=Boolean(file||text.trim()||sourceUrl.trim());
 const reset=useCallback(()=>{setFile(null);setBusy('idle');setError('');setKeyStatus('idle');setTitle('');setText('');setSourceUrl('');setAnalysis(null);setApprovedResult(null)},[]);
 const close=useCallback(()=>{if(busy!=='idle')return;reset();onClose()},[busy,onClose,reset]);
 const dialogRef=useDialogA11y(open,close);
 if(!open)return null;

 const verifyKey=async()=>{
  const key=editorKey.trim();
  if(!key){setError('יש להזין מפתח יוצר כדי לבדוק אותו.');return}
  setError('');setKeyStatus('checking');
  try{await sourceIntakeApi.verifyAccess(key);rememberEditorKey(key);setKeyStatus('valid')}
  catch(cause){setKeyStatus('idle');setError(cause instanceof Error?cause.message:'לא ניתן היה לבדוק את המפתח. נסה שוב.')}
 };

 const analyze=async()=>{
  const key=editorKey.trim();
  if(!key){setError('כדי לבדוק מקור יש להזין את מפתח היוצר.');return}
  if(file&&file.size>8_000_000){setError('הקובץ גדול מדי. לגרסת הבטא אפשר להעלות עד 8MB.');return}
  if(!hasInput){setError('יש לבחור קובץ, להדביק טקסט או להזין קישור.');return}
  if(imageFile&&!text.trim()){setError('כדי לבדוק תמונה יש להוסיף תיאור קצר של מה שרואים בה.');return}
  setError('');setBusy('analyzing');setAnalysis(null);
  try{
   const body={title:title.trim()||file?.name.replace(/\.[^.]+$/,'')||undefined,url:sourceUrl.trim()||undefined,text:(!file||imageFile)?text.trim()||undefined:undefined,fileName:file?.name,mimeType:file?.type||undefined,fileBase64:file?await fileToBase64(file):undefined};
   const result=await sourceIntakeApi.analyze(body,key);
   rememberEditorKey(key);setKeyStatus('valid');setAnalysis(result);
  }catch(cause){setError(cause instanceof Error?cause.message:'שגיאה לא צפויה בזמן בדיקת המקור.')}
  finally{setBusy('idle')}
 };

 const decide=async(action:'APPROVE'|'REJECT')=>{
  const id=analysis?.staging?.id,key=editorKey.trim();
  if(!id){setError('הניתוח הושלם, אך לא נשמר תור בדיקה. נסה שוב בעוד רגע.');return}
  setError('');setBusy('deciding');
  try{
   const result=await sourceIntakeApi.decide(id,action,key)as{ingestion?:{deduplicated?:boolean;fragmentCount?:number};publication?:{publication?:{id?:string}|null};nextStep?:string};
   const message=action==='REJECT'?'המקור סומן כלא להוספה.':result.ingestion?.deduplicated?'המקור כבר היה במאגר; לא נוצר עותק נוסף.':`המקור אושר ונשמר בשלמותו${Number.isFinite(result.ingestion?.fragmentCount)?` · ${result.ingestion?.fragmentCount} מקטעי מקור`:''}.`;
   onImported(message);
   if(action==='APPROVE'){setAnalysis(null);setApprovedResult({message,publicationReady:Boolean(result.publication?.publication||result.nextStep==='REVIEW_SOURCE_PUBLICATION')})}
   else{reset();onClose()}
  }catch(cause){setError(cause instanceof Error?cause.message:'לא ניתן היה לשמור את ההחלטה.')}
  finally{setBusy('idle')}
 };

 const leaveForReview=()=>{onImported(analysis?.staging?.persisted?'הניתוח נשמר בתור הבדיקה. המקור עדיין לא נוסף למאגר.':'הניתוח הושלם, אך תור הבדיקה לא נשמר. המקור לא נוסף.');reset();onClose()};
 const verdict=analysis?.verdict.verdict||'UNCERTAIN',copy=verdictCopy[verdict];

 return <div className="overlay" onClick={close}>
  <div className="modal sourceIntakeModal" role="dialog" aria-modal="true" aria-labelledby="add-source-title" aria-describedby={error?'add-source-error':undefined} tabIndex={-1} ref={dialogRef as React.Ref<HTMLDivElement>} onClick={event=>event.stopPropagation()}>
   <div className="modalHead"><div><span className="eyebrow">KNOWLEDGE INTAKE</span><h2 id="add-source-title">{approvedResult?'המקור נשמר':analysis?'האם זה כבר כתוב?':'בדיקת מקור חדש'}</h2></div><button type="button" className="close" aria-label="סגור חלון בדיקת מקור" onClick={close}>×</button></div>
   {approvedResult?<section className="intakeApproved"><span aria-hidden="true">✓</span><h3>{approvedResult.message}</h3><p>{approvedResult.publicationReady?'המקור עדיין אינו מוצג ללומדים. בשלב הבא בוחרים אילו יחידות יהפכו לכרטיסיות ובאיזה פרק הן יופיעו.':'לא נדרש מסלול פרסום חדש עבור עותק זהה שכבר קיים.'}</p><div className="actions"> <button type="button" className="secondary" onClick={close}>סגור</button>{approvedResult.publicationReady&&<button type="button" className="primary" onClick={()=>window.location.assign('/#/review')}>המשך להכנת כרטיסיות</button>}</div></section>:!analysis?<>
    <p className="intakeIntro">המערכת תשווה את החומר למאגר, תזהה מה כבר קיים, מה חדש והיכן הוא עשוי להשתלב. שום דבר לא יתווסף בלי אישור שלך.</p>
    <label className="dropZone">{file?file.name:'בחר קובץ'}<input type="file" accept=".pdf,.docx,.txt,.md,.csv,.json,.html,.xml,image/*" onChange={event=>{const selected=event.target.files?.[0]||null;setError('');setFile(selected);if(selected)setTitle(current=>current||selected.name.replace(/\.[^.]+$/,''))}}/><span>{file?`${Math.ceil(file.size/1024)} KB · ייבדק מול המאגר`:'PDF, DOCX, טקסט או תמונה'}</span></label>
    <label>כותרת<input value={title} onChange={event=>setTitle(event.target.value)} placeholder="מהו החומר?"/></label>
    {(!file||imageFile)&&<label>{imageFile?'תיאור התמונה (נדרש כרגע)':'או הדבק טקסט'}<textarea rows={7} value={text} onChange={event=>setText(event.target.value)} placeholder={imageFile?'תאר בקצרה מה מופיע בתמונה ומה חשוב לבדוק…':'הדבק כאן פסקה, מאמר או רעיון…'}/></label>}
    {!file&&<label>או קישור למאמר<input type="url" dir="ltr" value={sourceUrl} onChange={event=>setSourceUrl(event.target.value)} placeholder="https://…"/></label>}
    <label>מפתח יוצר<input type="password" autoComplete="current-password" value={editorKey} onChange={event=>{setEditorKey(event.target.value);setError('');setKeyStatus('idle')}} placeholder="נדרש כדי למנוע כתיבה ציבורית"/></label>
    {keyStatus==='valid'&&<p className="formSuccess" role="status">✓ המפתח תקין. אפשר לבדוק את החומר.</p>}
    {error&&<p id="add-source-error" className="formError" role="alert">{error}</p>}
    <div className="actions"><button type="button" className="secondary" onClick={close}>ביטול</button><button type="button" className="secondary" disabled={busy!=='idle'||keyStatus==='checking'} onClick={verifyKey}>{keyStatus==='checking'?'בודק…':'בדיקת מפתח'}</button><button type="button" className="primary" disabled={busy!=='idle'||keyStatus==='checking'||!hasInput} onClick={analyze}>{busy==='analyzing'?'משווה למאגר…':'בדוק האם זה כבר קיים'}</button></div>
   </>:<>
    <section className={`intakeVerdict intakeVerdict--${verdict.toLowerCase()}`} aria-live="polite"><div><span>{copy.label}</span><strong>{confidence(analysis.verdict.confidence)}</strong></div><h3>{copy.summary}</h3><p>{copy.recommendation}</p>{analysis.exactSourceMatch&&<p className="intakeExact">✓ נמצא עותק זהה: {analysis.exactSourceMatch.title}</p>}</section>
    <div className="intakeFacts"><div><small>יחידות שנבדקו</small><strong>{analysis.atomic?.analyzed??0}</strong></div><div><small>רעיונות חדשים</small><strong>{analysis.newMaterial?.count??0}</strong></div><div><small>סתירות</small><strong>{analysis.conflicts?.count??0}</strong></div></div>
    <section className="intakePlacement"><small>מיקום מוצע בתוכנית</small><strong>{analysis.placement?.suggestedDrawer?.label||'עדיין לא הוכרע'}</strong><span>{analysis.placement?.suggestedDrawer?`רמת התאמה ${confidence(analysis.placement.suggestedDrawer.confidence)}`:'יישאר לבדיקה ידנית'}</span></section>
    {Boolean(analysis.closestExistingKnowledge?.length)&&<section className="intakeMatches"><h3>החומר הקרוב ביותר שכבר קיים</h3>{analysis.closestExistingKnowledge?.slice(0,3).map((match,index)=><article key={`${match.authority||'match'}-${match.id||index}`}><p>{match.text||'התאמה ללא טקסט'}</p><span>{match.sourceFile||match.sourceTitle||'המאגר הקיים'} · {matchEvidence(match)} · {confidence(match.score)}</span></article>)}</section>}
    {!analysis.staging?.persisted&&<p className="formError" role="alert">הניתוח זמין לצפייה, אך תור האישור עדיין אינו מחובר. המקור לא נוסף.</p>}
    {error&&<p id="add-source-error" className="formError" role="alert">{error}</p>}
    <div className="intakeDecisionNote">המקור ייכנס למאגר רק בלחיצה על “אשר והוסף”. המיקום וכרטיסיות הלמידה ימשיכו לדרוש אישור נפרד.</div>
    <div className="actions intakeActions"><button type="button" className="secondary" disabled={busy!=='idle'} onClick={leaveForReview}>השאר לבדיקה</button><button type="button" className="secondary danger" disabled={busy!=='idle'||!analysis.staging?.id} onClick={()=>decide('REJECT')}>אל תוסיף</button><button type="button" className="primary" disabled={busy!=='idle'||!analysis.staging?.id} onClick={()=>decide('APPROVE')}>{busy==='deciding'?'שומר…':verdict==='EXISTS'?'שמור כמקור נוסף':'אשר והוסף למאגר'}</button></div>
   </>}
  </div>
 </div>;
}
