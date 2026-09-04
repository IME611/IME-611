import React from'react';
import{useLearningProgress}from'../journey/model/useLearningProgress';
import{journeyPath}from'../journey/model/journey-stage';
import{JOURNEY_LAYERS}from'../journey/model/journey-layers';
import type{JourneyLayerId}from'../journey/model/journey-layers';

type Props={onOpenJourney:(layerId?:JourneyLayerId)=>void};

export function KnowledgeDashboard({onOpenJourney}:Props){
 const{state}=useLearningProgress(journeyPath);
 const done=state.completedStageIds.length,total=journeyPath.stages.length;
 const pct=Math.round((done/total)*100);
 const nextFoundation=journeyPath.stages.find(stage=>!state.completedStageIds.includes(stage.id))?.order??total;

 return <div className="knowledgeDashboard" dir="rtl">
  <section className="dashHero" aria-labelledby="dashboard-title">
   <div className="dashHeroCopy">
    <span className="dashEyebrow">E.I.L · מסלול היסוד</span>
    <h1 id="dashboard-title">הידע שלך הופך למסע שאפשר לראות, להבין ולחבר.</h1>
    <p>18 פרקי היסוד נותנים נקודת התחלה. ככל שמקורות חדשים יאושרו ויפורסמו, המאגר יוכל להמשיך להתרחב בלי תקרת פרקים קבועה.</p>
    <button type="button" className="dashJourneyCta" onClick={()=>onOpenJourney()}>
     <span>{done===total?'פתח את המסע מחדש':'פתח את מסלול הלמידה'}</span>
     <b aria-hidden="true">←</b>
    </button>
   </div>
   <div className="dashHeroProgress" aria-label={`השלמת ${pct}% ממסלול היסוד`}>
    <span className="dashHeroProgressLabel">התקדמות במסלול היסוד</span>
    <strong>{pct}<small>%</small></strong>
    <span>{done===total?'18 פרקי היסוד הושלמו':`הפרק הראשון שעדיין לא הושלם: ${nextFoundation}`}</span>
   </div>
  </section>

  <section className="dashOverview" aria-labelledby="journey-progress-title">
   <div className="dashOverviewHeader">
    <div>
     <span className="dashSectionKicker">5 שכבות · מסלול אחד</span>
     <h2 id="journey-progress-title" className="dashOverviewTitle">מפת ההתקדמות שלי</h2>
    </div>
    <div className="dashOverviewMeta">{done}/{total} פרקי יסוד · {pct}%</div>
   </div>
   <div className="dashOverviewBar" role="progressbar" aria-label="התקדמות כוללת במסלול היסוד" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
    <div className="dashOverviewFill" style={{width:`${pct}%`}}/>
   </div>
   <div className="dashOverviewLayers">
    {JOURNEY_LAYERS.map(layer=>{
     const layerDone=journeyPath.stages.filter(stage=>(layer.nums as readonly number[]).includes(stage.order)&&state.completedStageIds.includes(stage.id)).length;
     const layerPct=Math.round((layerDone/layer.nums.length)*100);
     return <button key={layer.id} type="button" className="dashLayer" onClick={()=>onOpenJourney(layer.id)} aria-label={`פתח את ${layer.shortLabel}, ${layerPct}% הושלמו`}>
      <span className="dashLayerIndex" aria-hidden="true">{layer.marker}</span>
      <span className="dashLayerInfo"><span className="dashLayerName">{layer.shortLabel}</span><span className="dashLayerChapters">פרקי יסוד {layer.chapterRange}</span></span>
      <span className="dashLayerBar" aria-hidden="true"><span className="dashLayerFill" style={{width:`${layerPct}%`}}/></span>
      <span className="dashLayerPct">{layerPct}%</span>
      <span className="dashLayerArrow" aria-hidden="true">←</span>
     </button>;
    })}
   </div>
  </section>
 </div>;
}
