import React from'react';
import{useLearningProgress}from'../journey/model/useLearningProgress';
import{journeyPath}from'../journey/model/journey-stage';

type Props={onOpenJourney:()=>void};
type LayerOverview={layer:string;color:string;label:string;chapters:string;numbers:number[]};

const SPIRAL_OVERVIEW:LayerOverview[]=[
 {layer:'א',color:'#1E3A5F',label:'הכלי הפיזי',chapters:'1–3',numbers:[1,2,3]},
 {layer:'ב',color:'#4A235A',label:'מערכת ההפעלה',chapters:'4–6',numbers:[4,5,6]},
 {layer:'ג',color:'#7D6608',label:'האנרגיה והתדר',chapters:'7–9',numbers:[7,8,9]},
 {layer:'ד',color:'#922B21',label:'כלי השינוי',chapters:'10–13',numbers:[10,11,12,13]},
 {layer:'ה',color:'#1A5276',label:'המשמעות',chapters:'14–18',numbers:[14,15,16,17,18]},
];

export function KnowledgeDashboard({onOpenJourney}:Props){
 const{state}=useLearningProgress(journeyPath);
 const done=state.completedStageIds.length,total=journeyPath.stages.length;
 const pct=Math.round((done/total)*100);

 return <div className="knowledgeDashboard" dir="rtl">
  <section className="dashOverview" aria-labelledby="journey-progress-title">
   <div className="dashWelcome"><p className="dashWelcomeText">ברוך הבא ל-<strong>E.I.L</strong> — פלטפורמה שתוביל אותך למסע של מודעות כלפי עצמך וכלפי הסביבה, ותיתן לך כלים כדי להפוך לאדם שאתה רוצה להיות. מאחל לך שתהנה, תחכים ותהפוך לקריסטל הכי טוב שאתה יכול.</p></div>
   <div className="dashOverviewHeader">
    <h1 id="journey-progress-title" className="dashOverviewTitle">ההתקדמות שלי במסע</h1>
    <div className="dashOverviewMeta">{done}/{total} פרקים · {pct}%</div>
   </div>
   <div className="dashOverviewBar" role="progressbar" aria-label="התקדמות כוללת במסע" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
    <div className="dashOverviewFill" style={{width:`${pct}%`}}/>
   </div>
   <div className="dashOverviewLayers">
    {SPIRAL_OVERVIEW.map(layer=>{
     const layerDone=journeyPath.stages.filter(stage=>layer.numbers.includes(stage.order)&&state.completedStageIds.includes(stage.id)).length;
     const layerPct=Math.round((layerDone/layer.numbers.length)*100);
     return <button key={layer.layer} type="button" className="dashLayer" onClick={()=>onOpenJourney()} aria-label={`פתח את ${layer.label}, ${layerPct}% הושלמו`} style={{'--lc':layer.color} as React.CSSProperties}>
      <span className="dashLayerDot" style={{background:layer.color}} aria-hidden="true"/>
      <span className="dashLayerInfo"><span className="dashLayerName">{layer.label}</span><span className="dashLayerChapters">פרקים {layer.chapters}</span></span>
      <span className="dashLayerBar" aria-hidden="true"><span className="dashLayerFill" style={{width:`${layerPct}%`,background:layer.color}}/></span>
      <span className="dashLayerPct" style={{color:layer.color}}>{layerPct}%</span>
     </button>;
    })}
   </div>
  </section>
 </div>;
}
