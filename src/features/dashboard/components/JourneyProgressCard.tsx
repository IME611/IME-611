import type{LearningStage}from'../../../core/learning-path/learning-path.types';

interface JourneyProgressCardProps{
  activeStage:LearningStage;
  completed:number;
  total:number;
  owner:boolean;
  onContinue:()=>void;
}

export function JourneyProgressCard({activeStage,completed,total,owner,onContinue}:JourneyProgressCardProps){
 const percent=owner?100:Math.round((completed/Math.max(total,1))*100);
 return <section className="pdCard pdJourney" aria-labelledby="pd-journey-title">
  <div className="pdCardHead"><div><span className="pdEyebrow">THE JOURNEY</span><h2 id="pd-journey-title">איפה אני במסע?</h2></div><strong>{owner?'Creator':`${percent}%`}</strong></div>
  <div className="pdProgress" aria-label={`הושלמו ${completed} מתוך ${total} שלבים`}><i style={{width:`${percent}%`}}/></div>
  <div className="pdCurrentStage"><small>השאלה הפעילה</small><h3>{activeStage.guidingQuestion}</h3><p>{activeStage.title} · {activeStage.subtitle}</p></div>
  <div className="pdCardFoot"><span>{owner?`כל ${total} השלבים פתוחים עבורך`:`${completed} הושלמו · ${Math.max(total-completed,0)} נותרו`}</span><button type="button" onClick={onContinue}>המשך במסע ←</button></div>
 </section>
}
