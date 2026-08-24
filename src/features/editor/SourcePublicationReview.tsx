import{useEffect,useMemo,useState}from'react';

type ChapterOption={number:number;title:string};
type PublicationItem={
 id:string;status:'REPOSITORY_ONLY'|'DRAFT'|'PUBLISHED';title:string;fileName?:string|null;sourceTitle?:string;
 targetChapter?:number|null;candidateCount:number;selectedCount:number;publishedCardCount:number;publicationVersion:number;
 selectedCandidateIds?:string[];draftCards?:PublicationCard[];publishedChapters?:number[];
};
type PublicationCard={clientId?:string;chapterNumber?:number;order:number;type:string;title:string;text:string;sourceCandidateIds:string[];wordCount?:number;validWordCount?:boolean};
type PublicationCandidate={id:string;type:string;claimType?:string|null;text:string;quote:string;confidence:number;reviewStatus:string;section?:string|null};
type ApiRequest=(url:string,options?:RequestInit)=>Promise<any>;

const CARD_TYPES=[
 ['OPENER','פתיחה'],['CONCEPT','רעיון מרכזי'],['EXAMPLE','דוגמה'],['REFLECTION','רגע להתבוננות'],['SUMMARY','סיכום'],
] as const;
const statusLabel=(status:string)=>status==='PUBLISHED'?'מפורסם באתר':status==='DRAFT'?'טיוטה שמורה':'מקור בלבד';
const countWords=(value:string)=>value.trim().split(/\s+/u).filter(Boolean).length;
const uniqueIds=(cards:PublicationCard[])=>[...new Set(cards.flatMap(card=>card.sourceCandidateIds))];
const chapterCards=(publication:PublicationItem,chapterNumber:number)=>{const fallback=Number(publication.targetChapter);return(publication.draftCards||[]).filter(card=>Number(card.chapterNumber??fallback)===chapterNumber)};

export function SourcePublicationReview({item,chapters,disabled,request,onChanged,onNotice,onError}:{
 item:PublicationItem;chapters:ChapterOption[];disabled:boolean;request:ApiRequest;onChanged:()=>Promise<void>|void;onNotice:(value:string)=>void;onError:(value:string)=>void;
}){
 const[open,setOpen]=useState(false);const[loading,setLoading]=useState(false);const[detail,setDetail]=useState<PublicationItem&{candidates:PublicationCandidate[]}|null>(null);
 const initialChapter=Number(item.targetChapter||0),initialCards=initialChapter?chapterCards(item,initialChapter):[];
 const[chapter,setChapter]=useState(initialChapter?String(initialChapter):'');const[selected,setSelected]=useState<string[]>(uniqueIds(initialCards));const[cards,setCards]=useState<PublicationCard[]>(initialCards);const[note,setNote]=useState('');
 const selectedSet=useMemo(()=>new Set(selected),[selected]);const allValid=useMemo(()=>{const referenced=new Set<string>();const cardsValid=cards.length>0&&cards.every(card=>{const words=countWords(card.text),scoped=card.sourceCandidateIds.length>0&&card.sourceCandidateIds.every(id=>selectedSet.has(id));card.sourceCandidateIds.forEach(id=>referenced.add(id));return words>=40&&words<=90&&card.title.trim().length>=2&&scoped});return cardsValid&&selected.every(id=>referenced.has(id))},[cards,selected,selectedSet]);
 const publishedChapters=useMemo(()=>[...new Set([...(item.publishedChapters||[]),...(detail?.publishedChapters||[]),...((detail?.draftCards||item.draftCards||[]).map(card=>Number(card.chapterNumber)).filter(Number.isInteger))])].sort((a,b)=>a-b),[detail,item.draftCards,item.publishedChapters]);

 useEffect(()=>{const target=Number(item.targetChapter||0),batch=target?chapterCards(item,target):[];setChapter(target?String(target):'');setSelected(uniqueIds(batch));setCards(batch)},[item.id,item.targetChapter,item.publicationVersion,item.status]);

 const loadDetail=async()=>{
  if(detail)return;
  setLoading(true);onError('');
  try{
   const data=await request(`/api/editor?queue=publication&id=${encodeURIComponent(item.id)}`);
   setDetail(data.item);const target=Number(data.item.targetChapter||0),batch=target?chapterCards(data.item,target):[];setSelected(uniqueIds(batch));setCards(batch);setChapter(target?String(target):'');
  }catch(error:any){onError(error.message)}finally{setLoading(false)}
 };
 const toggle=async()=>{const next=!open;setOpen(next);if(next)await loadDetail()};
 const action=async(actionName:'PREVIEW'|'SAVE_DRAFT'|'PUBLISH'|'RETRACT',payload:Record<string,unknown>={})=>{
  setLoading(true);onError('');
  try{
   const data=await request('/api/editor?queue=publication',{method:'PATCH',body:JSON.stringify({id:item.id,action:actionName,payload})});
   if(actionName==='PREVIEW'){
    setCards(data.result?.cards||[]);onNotice('נוצרה תצוגה מקדימה. אפשר לערוך לפני פרסום.');
   }else{
    onNotice(actionName==='PUBLISH'?'הכרטיסיות פורסמו באתר':actionName==='RETRACT'?'הכרטיסיות הוסרו מהלומדים; המקור נשמר':'הטיוטה נשמרה');
    setOpen(false);setDetail(null);await onChanged();
   }
  }catch(error:any){onError(error.message)}finally{setLoading(false)}
 };
 const requirePlacement=()=>{
  if(!chapter){onError('בחר פרק יעד לפני יצירת הכרטיסיות.');return false}
  if(!selected.length){onError('בחר לפחות יחידת ידע אחת מן המקור.');return false}
  return true;
 };
 const preview=()=>{if(requirePlacement())void action('PREVIEW',{chapterNumber:Number(chapter),candidateIds:selected})};
 const saveDraft=()=>{if(requirePlacement())void action('SAVE_DRAFT',{chapterNumber:Number(chapter),candidateIds:selected,cards,note})};
 const publish=()=>{if(!requirePlacement())return;if(!allValid){onError('כל כרטיס חייב להכיל 40–90 מילים, כותרת ברורה וקישור תקין לכל יחידות המקור שנבחרו.');return}void action('PUBLISH',{chapterNumber:Number(chapter),candidateIds:selected,cards,note})};
 const updateCard=(index:number,patch:Partial<PublicationCard>)=>setCards(current=>current.map((card,cardIndex)=>cardIndex===index?{...card,...patch}:card));
 const toggleCandidate=(id:string)=>setSelected(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]);
 const chooseChapter=(value:string)=>{setChapter(value);const number=Number(value),publication=detail||item,batch=number?chapterCards(publication,number):[];setCards(batch);setSelected(uniqueIds(batch))};
 const candidates=detail?.candidates||[];

 return <article className={`reviewCard publicationReview publicationReview--${item.status.toLowerCase()}`}>
  <div className="reviewMeta"><span>{item.fileName||item.sourceTitle||'מקור ללא שם'}</span><span>גרסה {item.publicationVersion||0}</span></div>
  <div className="reviewCardTitle"><span className="reviewBadge">{statusLabel(item.status)}</span><h3>{item.title||item.sourceTitle||'מקור מאושר'}</h3></div>
  <div className="reviewFacts"><span>יחידות זמינות: <b>{item.candidateCount}</b></span><span>{open?'נבחרו בעריכה':'יחידות פעילות'}: <b>{open?selected.length:item.selectedCount}</b></span><span>כרטיסיות חיות: <b>{item.publishedCardCount}</b></span>{publishedChapters.length>0&&<span>פרקים שפורסמו: <b>{publishedChapters.join(' · ')}</b></span>}</div>
  <div className="reviewActions"><button disabled={disabled||loading} onClick={toggle}>{open?'סגור עריכה':item.status==='PUBLISHED'?'הוסף או עדכן פרק':'בחר יחידות והכן כרטיסיות'}</button>{item.status==='PUBLISHED'&&<button className="danger" disabled={disabled||loading} onClick={()=>void action('RETRACT',{note:'החזרה מפורשת למקור בלבד'})}>הסר את כל הכרטיסיות ושמור את המקור</button>}</div>
  {open&&<div className="publicationEditor">
   {loading&&!detail?<p>טוען את יחידות המקור…</p>:<>
    <div className="publicationStep"><span>1</span><div><b>בחר פרק יעד</b><small>המיקום אינו אוטומטי. זהו אישור אנושי מפורש.</small></div></div>
    <select aria-label="פרק יעד לפרסום" value={chapter} onChange={event=>chooseChapter(event.target.value)}><option value="">בחר פרק…</option>{chapters.map(option=><option value={option.number} key={option.number}>{option.number}. {option.title}{publishedChapters.includes(option.number)?' · כבר פורסם — בחירה תעדכן אותו':''}</option>)}</select>
    {item.status==='PUBLISHED'&&<p className="publicationPreserveNote">פרסום לפרק זה יוסיף אותו למיקומים הקיימים. אם כבר פורסמו כרטיסיות באותו פרק, רק הקבוצה של אותו פרק תוחלף; שאר הפרקים יישמרו.</p>}

    <div className="publicationStep"><span>2</span><div><b>בחר את יחידות הידע שייכנסו לכרטיסיות</b><small>רק היחידות המסומנות יוכלו להופיע בפני הלומד.</small></div></div>
    <div className="publicationSelectionActions"><button className="reviewGhost" type="button" onClick={()=>setSelected(candidates.map(candidate=>candidate.id))}>בחר הכול</button><button className="reviewGhost" type="button" onClick={()=>setSelected([])}>נקה בחירה</button><span>{selected.length} נבחרו</span></div>
    <div className="publicationCandidates">{candidates.map(candidate=><label className={selectedSet.has(candidate.id)?'isSelected':''} key={candidate.id}><input type="checkbox" checked={selectedSet.has(candidate.id)} onChange={()=>toggleCandidate(candidate.id)}/><div><b>{candidate.section||candidate.type}</b><p>{candidate.text}</p><small>{candidate.type} · {candidate.reviewStatus} · {Math.round(candidate.confidence*100)}%</small></div></label>)}</div>
    <button type="button" disabled={loading||!selected.length||!chapter} onClick={preview}>הכן תצוגה מקדימה</button>

    {cards.length>0&&<><div className="publicationStep"><span>3</span><div><b>בדוק וערוך את הכרטיסיות</b><small>40–90 מילים, רעיון מרכזי אחד, וכל כרטיס נשאר מקושר ליחידות המקור.</small></div></div>
     <div className="publicationCards">{cards.map((card,index)=>{const words=countWords(card.text),valid=words>=40&&words<=90;return <section className={valid?'isValid':'isInvalid'} key={card.clientId||`${index}-${card.sourceCandidateIds.join('-')}`}><div className="publicationCardHead"><b>כרטיס {index+1}</b><span>{words} מילים · {valid?'תקין':'דרוש תיקון'}</span></div><select aria-label={`סוג כרטיס ${index+1}`} value={card.type} onChange={event=>updateCard(index,{type:event.target.value})}>{CARD_TYPES.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><input aria-label={`כותרת כרטיס ${index+1}`} value={card.title} onChange={event=>updateCard(index,{title:event.target.value})} placeholder="כותרת הכרטיס"/><textarea aria-label={`תוכן כרטיס ${index+1}`} rows={6} value={card.text} onChange={event=>updateCard(index,{text:event.target.value})}/><small>מקושר ל־{card.sourceCandidateIds.length} יחידות מקור</small></section>})}</div>
     <label className="publicationNote">הערת עורך (אופציונלי)<textarea rows={3} value={note} onChange={event=>setNote(event.target.value)} placeholder="מדוע בחרת במיקום ובניסוח האלה?"/></label>
     <div className="reviewActions">{item.status!=='PUBLISHED'&&<button className="reviewGhost" disabled={loading} onClick={saveDraft}>שמור טיוטה</button>}<button disabled={loading||!allValid} onClick={publish}>{item.status==='PUBLISHED'?'פרסם ועדכן את פרק היעד':'פרסם כרטיסיות באתר'}</button></div>
    </>}
   </>}
  </div>}
 </article>;
}
