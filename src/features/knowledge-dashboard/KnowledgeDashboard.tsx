import React from'react';
import{useLearningProgress}from'../journey/model/useLearningProgress';
import{journeyPath}from'../journey/model/journey-stage';

type Props={onOpenJourney:()=>void};
type LayerOverview={layer:string;color:string;label:string;chapters:string;numbers:number[]};

const SPIRAL_OVERVIEW:LayerOverview[]=[
 {layer:'א',color:'#006039',label:'אני והמערכת',chapters:'1–3',numbers:[1,2,3]},
 {layer:'ב',color:'#0D6B49',label:'המוח והדפוסים',chapters:'4–6',numbers:[4,5,6]},
 {layer:'ג',color:'#B8962E',label:'תדר, חוויה ומשמעות',chapters:'7–9',numbers:[7,8,9]},
 {layer:'ד',color:'#2E5F4A',label:'כלי השינוי',chapters:'10–13',numbers:[10,11,12,13]},
 {layer:'ה',color:'#8A6A1A',label:'המשמעות',chapters:'14–18',numbers:[14,15,16,17,18]},
];

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
    <button type="button" className="dashJourneyCta" onClick={onOpenJourney}>
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
    {SPIRAL_OVERVIEW.map(layer=>{
     const layerDone=journeyPath.stages.filter(stage=>layer.numbers.includes(stage.order)&&state.completedStageIds.includes(stage.id)).length;
     const layerPct=Math.round((layerDone/layer.numbers.length)*100);
     return <button key={layer.layer} type="button" className="dashLayer" onClick={onOpenJourney} aria-label={`פתח את ${layer.label}, ${layerPct}% הושלמו`} style={{'--lc':layer.color} as React.CSSProperties}>
      <span className="dashLayerIndex" aria-hidden="true">{layer.layer}</span>
      <span className="dashLayerInfo"><span className="dashLayerName">{layer.label}</span><span className="dashLayerChapters">פרקי יסוד {layer.chapters}</span></span>
      <span className="dashLayerBar" aria-hidden="true"><span className="dashLayerFill" style={{width:`${layerPct}%`,background:layer.color}}/></span>
      <span className="dashLayerPct" style={{color:layer.color}}>{layerPct}%</span>
      <span className="dashLayerArrow" aria-hidden="true">←</span>
     </button>;
    })}
   </div>
  </section>
 </div>;
}
