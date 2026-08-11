import React,{useMemo,useState}from'react';
import type{Chapter}from'../../core/types';
import type{TransformationDraft,TransformationStep}from'./model/transformation.types';
import{localTransformationDraftRepository}from'./model/transformation.storage';

type Props={chapters:Chapter[]};
const steps:TransformationStep[]=['SOURCE','CLAIM','INSIGHT','EXPERIMENT','REFLECTION','TRANSFORMATION'];
const labels:Record<TransformationStep,string>={SOURCE:'מקור',CLAIM:'טענה',INSIGHT:'תובנה',EXPERIMENT:'ניסוי',REFLECTION:'רפלקציה',TRANSFORMATION:'שינוי'};
const plusDays=(days:number)=>{const d=new Date();d.setDate(d.getDate()+days);return d.toISOString()};
const uid=()=>`tr-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

function chooseFragment(chapter?:Chapter){
  if(!chapter)return{index:0,text:''};
  const index=chapter.paragraphs.findIndex(p=>p.trim().length>120);
  const resolved=index>=0?index:Math.max(0,chapter.paragraphs.findIndex(p=>p.trim().length>30));
  return{index:resolved,text:chapter.paragraphs[resolved]||chapter.paragraphs[0]||''};
}

export default function TransformationWorkspace({chapters}:Props){
  const[sourceNumber,setSourceNumber]=useState(chapters[0]?.number||1);
  const chapter=useMemo(()=>chapters.find(c=>c.number===sourceNumber)||chapters[0],[chapters,sourceNumber]);
  const fragment=useMemo(()=>chooseFragment(chapter),[chapter]);
  const[claim,setClaim]=useState('');
  const[insight,setInsight]=useState('');
  const[action,setAction]=useState('');
  const[signal,setSignal]=useState('');
  const[observation,setObservation]=useState('');
  const[interpretation,setInterpretation]=useState('');
  const[before,setBefore]=useState('');
  const[after,setAfter]=useState('');
  const[openProvenance,setOpenProvenance]=useState(false);
  const[saved,setSaved]=useState(false);
  const ready={SOURCE:!!fragment.text,CLAIM:!!claim.trim(),INSIGHT:!!insight.trim(),EXPERIMENT:!!action.trim()&&!!signal.trim(),REFLECTION:!!observation.trim(),TRANSFORMATION:!!before.trim()&&!!after.trim()};
  const save=()=>{
    if(!chapter||!Object.values(ready).every(Boolean))return;
    const draft:TransformationDraft={id:uid(),createdAt:new Date().toISOString(),stage:'TRANSFORMATION',provenance:{sourceTitle:chapter.title,sourceFile:chapter.sourceFile,fragmentText:fragment.text,fragmentIndex:fragment.index},claim:claim.trim(),insight:insight.trim(),experiment:{action:action.trim(),expectedSignal:signal.trim(),startsAt:new Date().toISOString(),endsAt:plusDays(3)},reflection:{observation:observation.trim(),interpretation:interpretation.trim()},transformation:{before:before.trim(),after:after.trim()}};
    const existing=localTransformationDraftRepository.load();
    localTransformationDraftRepository.save([draft,...existing]);setSaved(true);
  };
  return <div className="evolutionDash"><header className="dashIntro"><div><span className="eyebrow">E.I.L / CORE LOOP</span><h1>מהידע — לבדיקה בחיים.</h1><p>Vertical Slice ראשון: מקור מדויק, טענה, תובנה, ניסוי קצר, רפלקציה ושינוי מתועד. שום תובנה כאן אינה מסומנת כ־SUPPORTED עד שה־Live DB וה־Provenance Guard מאמתים אותה.</p></div></header><section className="signalStrip quietSignals">{steps.map(step=><button key={step}><strong>{ready[step]?'✓':'·'}</strong><span>{labels[step]}</span><small>{ready[step]?'מוכן':'ממתין'}</small></button>)}</section><section className="panel"><span className="eyebrow">01 / SOURCE FRAGMENT</span><h2>בחר קטע אמיתי מתוך המקור</h2><label>מקור<select value={sourceNumber} onChange={e=>{setSourceNumber(Number(e.target.value));setSaved(false)}}>{chapters.map(c=><option key={c.number} value={c.number}>{c.number}. {c.title}</option>)}</select></label><blockquote>{fragment.text||'לא נמצא טקסט במקור.'}</blockquote><button className="secondary" onClick={()=>setOpenProvenance(x=>!x)}>{openProvenance?'הסתר Provenance':'הצג Provenance'}</button>{openProvenance&&<div className="insightPrompt"><b>SOURCE OF TRUTH</b><span>{chapter?.sourceFile} · פסקה #{fragment.index+1}</span><p>{fragment.text}</p></div>}</section><section className="panel"><span className="eyebrow">02 / CLAIM + EVIDENCE</span><h2>מה הקטע הזה באמת טוען?</h2><textarea className="bigInput" value={claim} onChange={e=>setClaim(e.target.value)} placeholder="נסח טענה אחת בלבד, בלי להוסיף מעבר למה שהמקור מאפשר."/><p className="muted">Evidence מחובר כרגע ישירות לקטע שבחרת. לאחר Migration חי, ה־Fragment UUID וה־Evidence Edge יגיעו מה־Knowledge Graph.</p></section><section className="panel"><span className="eyebrow">03 / INSIGHT</span><h2>איזו תובנה אפשר לבדוק?</h2><textarea className="bigInput" value={insight} onChange={e=>setInsight(e.target.value)} placeholder="נסח תובנה או השערה שנובעת מהטענה."/><div className="notice">סטטוס: HYPOTHESIS / LOCAL DRAFT — לא SUPPORTED עד אימות Provenance ב־DB.</div></section><section className="panel"><span className="eyebrow">04 / 3-DAY EXPERIMENT</span><h2>מה אני בודק בחיים במשך 3 ימים?</h2><label>פעולה<textarea value={action} onChange={e=>setAction(e.target.value)} placeholder="פעולה קטנה, ברורה וניתנת לביצוע."/></label><label>מה ייחשב אות משמעותי?<textarea value={signal} onChange={e=>setSignal(e.target.value)} placeholder="מה אני מצפה לראות, להרגיש או למדוד?"/></label><p className="muted">חלון הניסוי: עכשיו → {new Date(plusDays(3)).toLocaleDateString('he-IL')}</p></section><section className="panel"><span className="eyebrow">05 / REFLECTION</span><h2>מה קרה בפועל?</h2><textarea className="bigInput" value={observation} onChange={e=>setObservation(e.target.value)} placeholder="תצפית: מה קרה, בלי לפרש קודם."/><textarea className="bigInput" value={interpretation} onChange={e=>setInterpretation(e.target.value)} placeholder="פרשנות: מה אני מסיק מזה כרגע?"/></section><section className="panel"><span className="eyebrow">06 / MOMENT OF TRANSFORMATION</span><h2>איך המודל שלי השתנה?</h2><div className="genericGrid"><label>לפני<textarea value={before} onChange={e=>setBefore(e.target.value)} placeholder="מה חשבתי/הנחתי לפני?"/></label><label>עכשיו<textarea value={after} onChange={e=>setAfter(e.target.value)} placeholder="מה אני מבין אחרת אחרי המקור והניסוי?"/></label></div><button className="primary" disabled={!Object.values(ready).every(Boolean)} onClick={save}>{saved?'נשמר ✓':'שמור Transformation'}</button>{saved&&<p className="muted">נשמר כטיוטת Transformation מקומית. לאחר חיבור ה־Live DB, אותו UI יעבור דרך Repository/Service קנוני במקום localStorage.</p>}</section></div>;
}
