import{useRef}from'react';
import type{KeyboardEvent,TouchEvent}from'react';
import{CrystalCardComposer}from'../crystals/CrystalCardComposer';
import{CardSourceExhibit}from'./CardSourceExhibit';
import type{LearningCardChapter,LearningCardType}from'./model/learning-card.types';
import{useCardProgress}from'./model/useCardProgress';

const TYPE_LABELS:Record<LearningCardType,string>={
  OPENER:'פתיחה',CONCEPT:'רעיון מרכזי',EXAMPLE:'דוגמה',REFLECTION:'רגע להתבוננות',SUMMARY:'סיכום',
};

type Props={
  chapter:LearningCardChapter;
  layerLabel:string;
  onBack:()=>void;
  onComplete:()=>void;
  onPreviousChapter?:()=>void;
  backLabel?:string;
  completionLabel?:string;
};

export function LearningCardReader({chapter,layerLabel,onBack,onComplete,onPreviousChapter,backLabel='→ חזרה למסע',completionLabel}:Props){
  const progressKey=chapter.unitKey??chapter.chapterNumber??chapter.title;
  const chapterIdentity=chapter.unitKey??(chapter.chapterNumber?`legacy-chapter:${chapter.chapterNumber}`:chapter.title);
  const{position,setPosition}=useCardProgress(progressKey,chapter.cards.length);
  const current=chapter.cards[position];
  const isLast=position===chapter.cards.length-1;
  const touchStart=useRef<number|null>(null);

  const previous=()=>{
    if(position>0)setPosition(position-1);
    else onPreviousChapter?.();
    window.scrollTo({top:0});
  };
  const next=()=>{
    if(isLast)onComplete();
    else setPosition(position+1);
    window.scrollTo({top:0});
  };
  const goTo=(index:number)=>setPosition(index);
  const onKeyDown=(event:KeyboardEvent<HTMLDivElement>)=>{
    if(event.key==='ArrowLeft'){event.preventDefault();next()}
    if(event.key==='ArrowRight'&&(position>0||onPreviousChapter)){event.preventDefault();previous()}
  };
  const onTouchStart=(event:TouchEvent<HTMLDivElement>)=>{touchStart.current=event.touches[0]?.clientX??null};
  const onTouchEnd=(event:TouchEvent<HTMLDivElement>)=>{
    const start=touchStart.current,end=event.changedTouches[0]?.clientX;
    touchStart.current=null;
    if(start==null||end==null)return;
    const delta=end-start;
    if(delta<-55)next();
    else if(delta>55&&(position>0||onPreviousChapter))previous();
  };
  const displayNumber=chapter.displayNumber??(chapter.chapterNumber?String(chapter.chapterNumber).padStart(2,'0'):'חדש');
  const previousLabel=position>0?'הכרטיס הקודם':'הפרק הקודם';
  const nextLabel=isLast?(completionLabel??'סיימתי — לפרק הבא ←'):'הכרטיס הבא';

  return <div className="learningCardReader" dir="rtl">
    <div className="learningJourneyTopbar">
      <button className="spiralBack" type="button" onClick={onBack}>{backLabel}</button>
      <span className="learningJourneyLayer">{layerLabel}</span>
    </div>

    <header className="learningCardChapterHead">
      <span className="learningCardChapterNumber">פרק {displayNumber}</span>
      <div><h1>{chapter.title}</h1>{chapter.subtitle&&<p>{chapter.subtitle}</p>}</div>
    </header>

    <section className="learningCardContext" aria-labelledby="learning-question-title">
      <span id="learning-question-title">השאלה שמובילה את הפרק</span>
      <p>{chapter.guidingQuestion}</p>
      {chapter.whyHere&&<details className="learningWhy"><summary>למה זה מגיע עכשיו?</summary><p>{chapter.whyHere}</p></details>}
    </section>

    <section
      className="learningCarousel"
      aria-label={`כרטיסיות בפרק ${displayNumber}`}
      aria-roledescription="carousel"
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="learningCarouselToolbar">
        <span className="learningCardType">{TYPE_LABELS[current.type]}</span>
        <span className="learningCardProgress" aria-live="polite">כרטיס {position+1} מתוך {chapter.cards.length}</span>
      </div>

      <div className="learningCarouselStage">
        <button
          type="button"
          className="learningCarouselArrow learningCarouselArrow--previous"
          onClick={previous}
          disabled={position===0&&!onPreviousChapter}
          aria-label={previousLabel}
        ><span className="learningCarouselArrowIcon" aria-hidden="true">→</span><span className="learningCarouselArrowText">{previousLabel}</span></button>

        <article
          key={current.id}
          className={`learningCard learningCard--${current.type.toLowerCase()}`}
          aria-labelledby={`learning-card-${current.id}`}
          aria-roledescription="slide"
          aria-label={`${position+1} מתוך ${chapter.cards.length}`}
        >
          <h2 id={`learning-card-${current.id}`}>{current.title}</h2>
          <p>{current.text}</p>
          <CardSourceExhibit cardId={current.id}/>
        </article>

        <button
          type="button"
          className="learningCarouselArrow learningCarouselArrow--next"
          onClick={next}
          aria-label={nextLabel}
        ><span className="learningCarouselArrowIcon" aria-hidden="true">{isLast?'✓':'←'}</span><span className="learningCarouselArrowText">{nextLabel}</span></button>
      </div>

      <nav className="learningCarouselDots" aria-label="בחירת כרטיס">
        {chapter.cards.map((card,index)=><button
          key={card.id}
          type="button"
          className={index===position?'isCurrent':''}
          aria-current={index===position?'step':undefined}
          aria-label={`עבור לכרטיס ${index+1}`}
          onClick={()=>goTo(index)}
        />)}
      </nav>
      <p className="learningCarouselSwipeHint">אפשר לעבור בין הכרטיסים גם בהחלקה ימינה ושמאלה.</p>
    </section>

    <CrystalCardComposer record={{
      fragmentId:`learning-card-${current.id}`,
      conceptId:`learning-unit:${chapterIdentity}`,
      topic:chapter.title,
      subtopic:current.title,
      text:current.text,
      sourceLabel:'מסע הלמידה',
      provenanceLabel:'כרטיס שנשמר במהלך הלמידה',
      savedAt:'',
    }}/>
  </div>;
}