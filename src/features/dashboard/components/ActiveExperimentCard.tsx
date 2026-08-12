import type{DashboardExperiment}from'../model/dashboard.types';

interface ActiveExperimentCardProps{
  experiment:DashboardExperiment|null;
  onOpen:()=>void;
}

function dayLabel(experiment:DashboardExperiment){
 const start=experiment.started_at?new Date(experiment.started_at):new Date(experiment.created_at);
 const diff=Math.max(0,Date.now()-start.getTime());
 const day=Math.min(3,Math.floor(diff/86400000)+1);
 return `יום ${day} מתוך 3`;
}

export function ActiveExperimentCard({experiment,onOpen}:ActiveExperimentCardProps){
 return <section className="pdCard pdExperiment" aria-labelledby="pd-experiment-title">
  <div className="pdCardHead"><div><span className="pdEyebrow">LIFE EXPERIMENT</span><h2 id="pd-experiment-title">מה אני בודק בחיים?</h2></div>{experiment&&<strong>{experiment.status==='ACTIVE'?dayLabel(experiment):experiment.status==='DRAFT'?'מוכן להתחלה':'הושלם'}</strong>}</div>
  {experiment?<><div className="pdExperimentBody"><small>ההשערה שנבדקת</small><h3>{experiment.hypothesis}</h3><p><b>פעולה:</b> {experiment.action}</p><p><b>מה אמור לסמן שינוי:</b> {experiment.expected_signal}</p></div><button className="pdPrimary" type="button" onClick={onOpen}>{experiment.status==='COMPLETED'?'ראה רפלקציה':'פתח את הניסוי'} ←</button></>:<div className="pdEmpty"><strong>אין כרגע ניסוי פעיל.</strong><span>ניסוי מתחיל רק מתובנה שעברה את Provenance Guard.</span><button type="button" onClick={onOpen}>עבור ל-Core Loop ←</button></div>}
 </section>
}
