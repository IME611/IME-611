import{useEffect,useMemo,useState}from'react';

type ChapterOption={number:number;title:string};
type LearningUnitOption={key:string;title:string;anchorNodeId?:string|null;complexity?:number;orderStatus?:string};
type PublicationItem={
 id:string;status:'REPOSITORY_ONLY'|'DRAFT'|'PUBLISHED';title:string;fileName?:string|null;sourceTitle?:string;
 targetChapter?:number|null;targetLearningUnitKey?:string|null;targetLearningUnitTitle?:string|null;candidateCount:number;selectedCount:number;publishedCardCount:number;publicationVersion:number;
 selectedCandidateIds?:string[];draftCards?:PublicationCard[];publishedChapters?:number[];reviewNote?:string;
};
type PublicationCard={clientId?:string;chapterNumber?:number|null;learningUnitKey?:string;learningUnitTitle?:string;order:number;type:string;title:string;text:string;sourceCandidateIds:string[];wordCount?:number;validWordCount?:boolean};
type PublicationCandidate={id:string;type:string;claimType?:string|null;text:string;quote:string;confidence:number;reviewStatus:string;section?:string|null};
type ApiRequest=(url:string,options?:RequestInit)=>Promise<any>;

const CARD_TYPES=[
 ['OPENER','פתיחה'],['CONCEPT','רעיון מרכזי'],['EXAMPLE','דוגמה'],['REFLECTION','רגע להתבוננות'],['SUMMARY','סיכום'],
] as const;
const UNIT_KEY=/^[\p{L}\p{N}][\p{L}\p{N}._:/-]{1,239}$/u;
const statusLabel=(status:string)=>status==='PUBLISHED'?'מפורסם באתר':status==='DRAFT'?'טיוטה שמורה':'מקור בלבד';
const countWords=(value:string)=>value.trim().split(/\s+/u).filter(Boolean).length;
const uniqueIds=(cards:PublicationCard[])=>[...new Set(cards.flatMap(card=>card.sourceCandidateIds))];
const legacyKey=(chapter:number)=>`legacy-chapter:${chapter}`;
const cardUnitKey=(card:PublicationCard)=>card.learningUnitKey||(Number.isInteger(Number(card.chapterNumber))?legacyKey(Number(card.chapterNumber)):null);
const cardsForUnit=(publication:PublicationItem,key:string)=>{if(!key)return[];return(publication.draftCards||[]).filter(card=>cardUnitKey(card)===key)};
const firstPlacement=(publication:PublicationItem)=>{
 const first=(publication.draftCards||[])[0],chapter=Number(publication.targetChapter||first?.chapterNumber||0);
 const key=publication.targetLearningUnitKey||first?.learningUnitKey||(chapter?legacyKey(chapter):'');
 const title=publication.targetLearningUnitTitle||first?.learningUnitTitle||'';
 return{key,title,chapter};
};
const customKeyFromTitle=(value:string)=>{const slug=value.normalize('NFKC').trim().replace(/\s+/gu,'-').replace(/[^\p{L}\p{N}._:/-]/gu,'').replace(/-+/g,'-').slice(0,200);return slug?`topic:${slug}`:''};

export function SourcePublicationReview({item,chapters,disabled,request,onChanged,onNotice,onError}:{
 item:PublicationItem;chapters:ChapterOption[];disabled:boolean;request:ApiRequest;onChanged:()=>Promise<void>|void;onNotice:(value:string)=>void;onError:(value:string)=>void;
}){
 const[open,setOpen]=useState(false),[loading,setLoading]=useState(false),[detail,setDetail]=useState<PublicationItem&{candidates:PublicationCandidate[]}|null>(null),[learningUnits,setLearningUnits]=useState<LearningUnitOption[]>([]);
 const initial=firstPlacement(item),initialCards=cardsForUnit(item,initial.key);
 const[unitKey,setUnitKey]=useState(initial.key),[unitTitle,setUnitTitle]=useState(initial.title),[selected,setSelected]=useState<string[]>(uniqueIds(initialCards)),[cards,setCards]=useState<PublicationCard[]>(initialCards),[note,setNote]=useState(item.reviewNote||'');
 const selectedSet=useMemo(()=>new Set(selected),[selected]);
 const allValid=useMemo(()=>{const referenced=new Set<string>();const cardsValid=cards.length>0&&cards.every(card=>{const words=countWords(card.text),scoped=card.sourceCandidateIds.length>0&&card.sourceCandidateIds.every(id=>selectedSet.has(id));card.sourceCandidateIds.forEach(id=>referenced.add(id));return words>=40&&words<=90&&card.title.trim().length>=2&&scoped});return cardsValid&&selected.every(id=>referenced.has(id))},[cards,selected,selectedSet]);
 const currentPublication=detail||item;
 const publishedUnits=useMemo(()=>{const map=new Map<string,string>();for(const card of currentPublication.draftCards||[]){const key=cardUnitKey(card);if(key)map.set(key,card.learningUnitTitle||map.get(key)||key)}return[...map.entries()].map(([key,title])=>({key,title}))},[currentPublication]);
 const selectedCatalogKey=learningUnits.some(unit=>unit.key===unitKey)?unitKey:'';
 const legacyChapterMatch=/^legacy-chapter:(\d+)$/u.exec(unitKey),selectedLegacyChapter=legacyChapterMatch?.[1]||'';
 const placementValid=UNIT_KEY.test(unitKey.trim())&&unitTitle.trim().length>=2&&unitTitle.trim().length<=180;

 const syncPublication=(publication:PublicationItem)=>{const placement=firstPlacement(publication),key=placement.key,batch=cardsForUnit(publication,key);setUnitKey(key);setUnitTitle(placement.title||(placement.chapter?chapters.find(option=>option.number===placement.chapter)?.title||`פרק ${placement.chapter}`:''));setSelected(uniqueIds(batch));setCards(batch);setNote(publication.reviewNote||'')};
 useEffect(()=>{syncPublication(item)},[item.id,item.targetChapter,item.targetLearningUnitKey,item.targetLearningUnitTitle,item.publicationVersion,item.status]);

 const loadDetail=async()=>{
  if(detail)return;
  setLoading(true);onError('');
  try{
   const data=await request(`/api/editor?queue=publication&id=${encodeURIComponent(item.id)}`);
   setDetail(data.item);syncPublication(data.item);
   try{const placement=await request('/api/reviews?mode=publication-placement');setLearningUnits(Array.isArray(placement.learningUnits)?placement.learningUnits:[])}catch(error:any){onNotice(`יחידות קיימות לא נטענו; עדיין אפשר ליצור יחידה חדשה. ${error.message||''}`.trim())}
  }catch(error:any){onError(error.message)}finally{setLoading(false)}
 };
 const toggle=async()=>{const next=!open;setOpen(next);if(next)await loadDetail()};
 const closeAfterChange=async(message:string)=>{onNotice(message);setOpen(false);setDetail(null);await onChanged()};
 const dynamicAction=async(actionName:'PREVIEW'|'SAVE_DRAFT'|'PUBLISH')=>{
  setLoading(true);onError('');
  try{
   const data=await request('/api/reviews?mode=publication-placement',{method:'PATCH',body:JSON.stringify({publicationId:item.id,action:actionName,learningUnitKey:unitKey.trim(),learningUnitTitle:unitTitle.trim(),candidateIds:selected,cards:actionName==='PREVIEW'?[]:cards,note})});
   if(actionName==='PREVIEW'){setCards(data.cards||[]);onNotice('נוצרה תצוגה מקדימה ליחידת הלימוד. אפשר לערוך לפני פרסום.');return}
   await closeAfterChange(actionName==='PUBLISH'?'יחידת הלימוד והכרטיסיות פורסמו באתר':'טיוטת יחידת הלימוד נשמרה');
  }catch(error:any){onError(error.message)}finally{setLoading(false)}
 };
 const retract=async()=>{
  setLoading(true);onError('');
  try{await request('/api/editor?queue=publication',{method:'PATCH',body:JSON.stringify({id:item.id,action:'RETRACT',payload:{note:'החזרה מפורשת למקור בלבד'}})});await closeAfterChange('הכרטיסיות הוסרו מהלומדים; המקור נשמר')}
  catch(error:any){onError(error.message)}finally{setLoading(false)}
 };
 const requirePlacement=()=>{
  if(!UNIT_KEY.test(unitKey.trim())){onError('מפתח יחידת הלימוד חייב להכיל 2–240 תווים ללא רווחים.');return false}
  if(unitTitle.trim().length<2||unitTitle.trim().length>180){onError('שם יחידת הלימוד חייב להכיל 2–180 תווים.');return false}
  if(!selected.length){onError('בחר לפחות יחידת ידע אחת מן המקור.');return false}
  return true;
 };
 const preview=()=>{if(requirePlacement())void dynamicAction('PREVIEW')};
 const saveDraft=()=>{if(!requirePlacement())return;if(cards.length&&!allValid){onError('כדי לשמור את העריכה הנוכחית, כל הכרטיסים חייבים לעמוד בכללי 40–90 מילים וה־provenance.');return}void dynamicAction('SAVE_DRAFT')};
 const publish=()=>{if(!requirePlacement())return;if(!allValid){onError('כל כרטיס חייב להכיל 40–90 מילים, כותרת ברורה וקישור תקין לכל יחידות המקור שנבחרו.');return}void dynamicAction('PUBLISH')};
 const updateCard=(index:number,patch:Partial<PublicationCard>)=>setCards(current=>current.map((card,cardIndex)=>cardIndex===index?{...card,...patch}:card));
 const toggleCandidate=(id:string)=>setSelected(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]);
 const hydrateUnit=(key:string,title:string)=>{setUnitKey(key);setUnitTitle(title);const batch=cardsForUnit(currentPublication,key);setCards(batch);setSelected(uniqueIds(batch))};
 const chooseExisting=(key:string)=>{if(!key)return;const unit=learningUnits.find(option=>option.key===key);if(unit)hydrateUnit(unit.key,unit.title)};
 const chooseLegacy=(value:string)=>{if(!value)return;const number=Number(value),option=chapters.find(entry=>entry.number===number);hydrateUnit(legacyKey(number),option?.title||`פרק ${number}`)};
 const startCustom=()=>{const title=item.title||item.sourceTitle||'';setUnitTitle(title);setUnitKey(customKeyFromTitle(title));setCards([]);setSelected([])};
 const candidates=detail?.candidates||[];

 return <article className={`reviewCard publicationReview publicationReview--${item.status.toLowerCase()}`}>
  <div className="reviewMeta"><span>{item.fileName||item.sourceTitle||'מקור ללא שם'}</span><span>גרסה {item.publicationVersion||0}</span></div>
  <div className="reviewCardTitle"><span className="reviewBadge">{statusLabel(item.status)}</span><h3>{item.title||item.sourceTitle||'מקור מאושר'}</h3></div>
  <div className="reviewFacts"><span>יחידות מקור זמינות: <b>{item.candidateCount}</b></span><span>{open?'נבחרו בעריכה':'יחידות מקור פעילות'}: <b>{open?selected.length:item.selectedCount}</b></span><span>כרטיסיות חיות: <b>{item.publishedCardCount}</b></span>{publishedUnits.length>0&&<span>יחידות לימוד שמורות: <b>{publishedUnits.map(unit=>unit.title).join(' · ')}</b></span>}</div>
  <div className="reviewActions"><button disabled={disabled||loading} onClick={toggle}>{open?'סגור עריכה':item.status==='PUBLISHED'?'הוסף או עדכן יחידת לימוד':'בחר יחידות והכן כרטיסיות'}</button>{item.status==='PUBLISHED'&&<button className="danger" disabled={disabled||loading} onClick={()=>void retract()}>הסר את כל הכרטיסיות ושמור את המקור</button>}</div>
  {open&&<div className="publicationEditor">
   {loading&&!detail?<p>טוען את יחידות המקור…</p>:<>
    <div className="publicationStep"><span>1</span><div><b>בחר יחידת לימוד יעד</b><small>אפשר להשתמש ביחידה קיימת, במסלול היסוד, או ליצור יחידה חדשה. המיקום לעולם אינו אוטומטי.</small></div></div>
    <div className="publicationPlacementGrid">
     <label><span>יחידה קיימת ממפת הלמידה</span><select aria-label="יחידת לימוד קיימת" value={selectedCatalogKey} onChange={event=>chooseExisting(event.target.value)}><option value="">בחר יחידה קיימת…</option>{learningUnits.map(option=><option value={option.key} key={option.key}>{option.title}</option>)}</select></label>
     <label><span>או מסלול יסוד (תאימות לפרקים)</span><select aria-label="פרק יסוד לפרסום" value={selectedLegacyChapter} onChange={event=>chooseLegacy(event.target.value)}><option value="">בחר פרק יסוד…</option>{chapters.map(option=><option value={option.number} key={option.number}>{option.number}. {option.title}</option>)}</select></label>
    </div>
    <div className="publicationCustomHead"><b>שם ומפתח של יחידת היעד</b><button type="button" className="reviewGhost" onClick={startCustom}>צור יחידה חדשה מהמקור הזה</button></div>
    <div className="publicationPlacementGrid">
     <label><span>שם שמוצג ללומד</span><input aria-label="שם יחידת הלימוד" value={unitTitle} maxLength={180} onChange={event=>setUnitTitle(event.target.value)} placeholder="לדוגמה: תפיסה, רגש והתנהגות"/></label>
     <label><span>מפתח יציב למערכת</span><input aria-label="מפתח יחידת הלימוד" value={unitKey} dir="ltr" onChange={event=>setUnitKey(event.target.value)} onBlur={()=>{const batch=cardsForUnit(currentPublication,unitKey.trim());if(batch.length){setCards(batch);setSelected(uniqueIds(batch))}}} placeholder="topic:perception-emotion"/><small>2–240 תווים, ללא רווחים. שינוי המפתח יוצר מיקום למידה נפרד.</small></label>
    </div>
    {item.status==='PUBLISHED'&&<p className="publicationPreserveNote">עדכון יחידת היעד מחליף רק את הכרטיסיות של אותה יחידה. יחידות אחרות שכבר פורסמו מאותו מקור נשמרות.</p>}

    <div className="publicationStep"><span>2</span><div><b>בחר את יחידות הידע שייכנסו לכרטיסיות</b><small>רק היחידות המסומנות יוכלו להופיע בפני הלומד.</small></div></div>
    <div className="publicationSelectionActions"><button className="reviewGhost" type="button" onClick={()=>setSelected(candidates.map(candidate=>candidate.id))}>בחר הכול</button><button className="reviewGhost" type="button" onClick={()=>setSelected([])}>נקה בחירה</button><span>{selected.length} נבחרו</span></div>
    <div className="publicationCandidates">{candidates.map(candidate=><label className={selectedSet.has(candidate.id)?'isSelected':''} key={candidate.id}><input type="checkbox" checked={selectedSet.has(candidate.id)} onChange={()=>toggleCandidate(candidate.id)}/><div><b>{candidate.section||candidate.type}</b><p>{candidate.text}</p><small>{candidate.type} · {candidate.reviewStatus} · {Math.round(candidate.confidence*100)}%</small></div></label>)}</div>
    <button type="button" disabled={loading||!selected.length||!placementValid} onClick={preview}>הכן תצוגה מקדימה</button>

    {cards.length>0&&<><div className="publicationStep"><span>3</span><div><b>בדוק וערוך את הכרטיסיות</b><small>40–90 מילים, רעיון מרכזי אחד, וכל כרטיס נשאר מקושר ליחידות המקור.</small></div></div>
     <div className="publicationCards">{cards.map((card,index)=>{const words=countWords(card.text),valid=words>=40&&words<=90;return <section className={valid?'isValid':'isInvalid'} key={card.clientId||`${index}-${card.sourceCandidateIds.join('-')}`}><div className="publicationCardHead"><b>כרטיס {index+1}</b><span>{words} מילים · {valid?'תקין':'דרוש תיקון'}</span></div><select aria-label={`סוג כרטיס ${index+1}`} value={card.type} onChange={event=>updateCard(index,{type:event.target.value})}>{CARD_TYPES.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select><input aria-label={`כותרת כרטיס ${index+1}`} value={card.title} onChange={event=>updateCard(index,{title:event.target.value})} placeholder="כותרת הכרטיס"/><textarea aria-label={`תוכן כרטיס ${index+1}`} rows={6} value={card.text} onChange={event=>updateCard(index,{text:event.target.value})}/><small>מקושר ל־{card.sourceCandidateIds.length} יחידות מקור · יעד: {unitTitle||unitKey}</small></section>})}</div>
     <label className="publicationNote">הערת עורך (אופציונלי)<textarea rows={3} value={note} onChange={event=>setNote(event.target.value)} placeholder="מדוע בחרת ביחידת הלימוד ובניסוח האלה?"/></label>
     <div className="reviewActions">{item.status!=='PUBLISHED'&&<button className="reviewGhost" disabled={loading||Boolean(cards.length&&!allValid)} onClick={saveDraft}>שמור טיוטה</button>}<button disabled={loading||!allValid||!placementValid} onClick={publish}>{item.status==='PUBLISHED'?'פרסם ועדכן את יחידת היעד':'פרסם כרטיסיות באתר'}</button></div>
    </>}
   </>}
  </div>}
 </article>;
}
