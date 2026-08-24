import{useEffect,useState}from'react';
import type{Chapter}from'../../core/types';
import{CrystalCardComposer}from'../crystals/CrystalCardComposer';
import type{LearningCardChapter,LearningCardType}from'./model/learning-card.types';
import{useCardProgress}from'./model/useCardProgress';

const TYPE_LABELS:Record<LearningCardType,string>={
  OPENER:'פתיחה',CONCEPT:'רעיון מרכזי',EXAMPLE:'דוגמה',REFLECTION:'רגע להתבוננות',SUMMARY:'סיכום',
};

function sourceParagraph(text:string,index:number){
  const value=text.trim();
  if(!value)return null;
  const marker=value.match(/^##(TITLE|SUBTITLE|SECTION|QUESTION|HIGHLIGHT|BIG|GROUP|SYSTEM|WINK)##\s*/u)?.[0]??'';
  const cleanText=marker?value.slice(marker.length):value;
  if(marker.includes('TITLE'))return <h2 key={index} className="chTitle">{cleanText}</h2>;
  if(marker.includes('SUBTITLE'))return <p key={index} className="chSubtitle">{cleanText}</p>;
  if(marker.includes('SECTION'))return <h3 key={index} className="chSection">{cleanText}</h3>;
  if(marker.includes('QUESTION'))return <div key={index} className="chQuestion">{cleanText}</div>;
  if(marker.includes('HIGHLIGHT'))return <div key={index} className="chHighlight">{cleanText}</div>;
  if(marker.includes('BIG'))return <div key={index} className="chBig">{cleanText}</div>;
  if(marker.includes('GROUP'))return <div key={index} className="chGroup">{cleanText}</div>;
  if(marker.includes('SYSTEM'))return <div key={index} className="chSystem">{cleanText}</div>;
  if(marker.includes('WINK'))return <div key={index} className="chWink">{cleanText}</div>;
  return <p key={index} className="spiralPara">{cleanText}</p>;
}

type Props={
  chapter:LearningCardChapter;
  sourceChapter:Chapter;
  layerLabel:string;
  color:string;
  onBack:()=>void;
  onComplete:()=>void;
  onPreviousChapter?:()=>void;
};

export function LearningCardReader({chapter,sourceChapter,layerLabel,color,onBack,onComplete,onPreviousChapter}:Props){
  const{position,setPosition}=useCardProgress(chapter.chapterNumber,chapter.cards.length);
  const current=chapter.cards[position];
  const isLast=position===chapter.cards.length-1;
  const[uploadedSource,setUploadedSource]=useState<any>(null);const[sourceLoading,setSourceLoading]=useState(false);const[sourceError,setSourceError]=useState('');
  useEffect(()=>{setUploadedSource(null);setSourceError('');setSourceLoading(false)},[current.sourceId]);
  const loadUploadedSource=async(event:React.SyntheticEvent<HTMLDetailsElement>)=>{
    if(!event.currentTarget.open||!current.sourceId||uploadedSource||sourceLoading)return;
    setSourceLoading(true);setSourceError('');
    try{const response=await fetch(`/api/sources?id=${encodeURIComponent(current.sourceId)}`,{headers:{Accept:'application/json'}}),payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload.error||`HTTP ${response.status}`);setUploadedSource(payload)}catch(error:any){setSourceError(String(error?.message||'לא ניתן לטעון את המקור'))}finally{setSourceLoading(false)}
  };
  const previous=()=>{
    if(position>0)setPosition(position-1);
    else onPreviousChapter?.();
    window.scrollTo({top:0,behavior:'smooth'});
  };
  const next=()=>{
    if(isLast)onComplete();
    else{
      setPosition(position+1);
      window.scrollTo({top:0,behavior:'smooth'});
    }
  };

  return <div className="learningCardReader" dir="rtl" style={{'--card-accent':color} as React.CSSProperties}>
    <div className="spiralChapterTop">
      <button className="spiralBack" type="button" onClick={onBack}>← חזרה לנושאים</button>
      <span className="spiralChapterPos">{layerLabel}</span>
    </div>

    <header className="learningCardChapterHead">
      <span className="learningCardChapterNumber">{String(chapter.chapterNumber).padStart(2,'0')}</span>
      <div><h1>{chapter.title}</h1><p>{chapter.subtitle}</p></div>
    </header>

    <div className="learningCardContext">
      <div><span>השאלה שמובילה את הפרק</span><strong>{chapter.guidingQuestion}</strong></div>
      <p><b>למה הוא כאן?</b> {chapter.whyHere}</p>
    </div>

    <div className="learningCardProgress" aria-label={`כרטיס ${position+1} מתוך ${chapter.cards.length}`}>
      <span>כרטיס {position+1} מתוך {chapter.cards.length}</span>
      <div aria-hidden="true">{chapter.cards.map(item=><i key={item.id} className={item.order<=position+1?'isReached':''}/>)}</div>
    </div>

    <article className={`learningCard learningCard--${current.type.toLowerCase()}`} aria-labelledby={`learning-card-${current.id}`}>
      <header><span>{TYPE_LABELS[current.type]}</span><small>רעיון אחד · קריאה קצרה</small></header>
      <h2 id={`learning-card-${current.id}`}>{current.title}</h2>
      <p>{current.text}</p>
      <footer>
        <span>{current.editorialStatus==='CREATOR_PUBLISHED'?'כרטיס שאושר ופורסם מתוך מקור חדש':'עיבוד פדגוגי מקושר למקור'}</span>
        <span>{current.sourceLabel||chapter.sourceFile}</span>
        <span>{current.provenanceLabel||current.sourceUnitIds.join(' · ')}</span>
        {current.evidenceRefs?.length?<span>בדיקת ראיות: {current.evidenceRefs.join(' · ')}</span>:null}
      </footer>
    </article>

    <CrystalCardComposer record={{
      fragmentId:`learning-card-${current.id}`,
      conceptId:`chapter-${chapter.chapterNumber}`,
      topic:chapter.title,
      subtopic:current.title,
      text:current.text,
      sourceLabel:current.sourceLabel||chapter.sourceFile,
      provenanceLabel:current.provenanceLabel||current.sourceUnitIds.join(' · '),
      savedAt:'',
    }}/>

    <nav className="learningCardNavigation" aria-label="ניווט בין כרטיסיות">
      <button type="button" className="learningCardPrevious" onClick={previous} disabled={position===0&&!onPreviousChapter}>{position>0?'→ הכרטיס הקודם':'→ הפרק הקודם'}</button>
      <button type="button" className="learningCardNext" onClick={next}>{isLast?'סיימתי — לפרק הבא ←':'הכרטיס הבא ←'}</button>
    </nav>

    <details className="canonicalSourceDetails" onToggle={loadUploadedSource}>
      <summary>{current.sourceId?'לקריאת המקור שהועלה':'לקריאת חומר המקור המלא'}</summary>
      <div className="canonicalSourceNotice"><b>המקור נשמר בשלמותו</b><span>הכרטיסיות הן עיבוד קצר; כאן אפשר לבדוק את הניסוח וההקשר המקוריים.</span></div>
      {current.sourceId?<>{sourceLoading&&<p>טוען את המקור…</p>}{sourceError&&<p className="formError" role="alert">{sourceError}</p>}{uploadedSource&&<article className="spiralContent">{(uploadedSource.fragments||[]).flatMap((fragment:any)=>String(fragment.raw_text||'').split(/\n{2,}/u)).map(sourceParagraph)}</article>}</>:<article className="spiralContent">{sourceChapter.paragraphs.map(sourceParagraph)}</article>}
    </details>
  </div>;
}
