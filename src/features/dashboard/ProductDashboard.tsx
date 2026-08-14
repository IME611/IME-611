import{GlassButton}from'../../design/primitives/Glass';
import{DashboardHero}from'./components/DashboardHero';
import{JourneyProgressCard}from'./components/JourneyProgressCard';
import{UnderstandingCard}from'./components/UnderstandingCard';
import{ActiveExperimentCard}from'./components/ActiveExperimentCard';
import{NextStepCard}from'./components/NextStepCard';
import{useProductDashboard}from'./model/useProductDashboard';
import{useInsightProvenance}from'./model/useInsightProvenance';

interface ProductDashboardProps{onNav:(id:string)=>void;onAdd:()=>void}

export function ProductDashboard({onNav,onAdd}:ProductDashboardProps){
 const dashboard=useProductDashboard();
 const provenance=useInsightProvenance();
 if(dashboard.state.status==='loading')return <div className="pdDashboard"><section className="pdSkeleton" aria-label="טוען דשבורד"><i/><i/><i/></section></div>;
 if(dashboard.state.status==='error')return <div className="pdDashboard"><section className="pdError"><span className="pdEyebrow">DASHBOARD</span><h1>המסע זמין, אבל תמונת המצב החיה לא נטענה.</h1><p>{dashboard.state.message}</p><button className="pdPrimary" onClick={()=>onNav('library')}>המשך למסע ←</button></section></div>;
 const data=dashboard.state.data;
 const experiment=data.experiments.find(item=>item.status==='ACTIVE')??data.experiments.find(item=>item.status==='DRAFT')??data.experiments[0]??null;
 const supportedInsight=data.insights.find(item=>item.status==='SUPPORTED')??null;
 const next=experiment&&experiment.status!=='COMPLETED'?{label:'חזור למה שאתה בודק עכשיו',description:'כבר יש ניסוי שמחובר לתובנה מבוססת מקור. אל תפתח כיוון חדש לפני שחזרת עם תצפית.',action:'פתח את הניסוי',page:'transformation'}:supportedInsight?{label:'הפוך הבנה לבדיקה בחיים',description:'יש תובנה מבוססת ראיות. השלב הבא הוא לא לקרוא עוד — אלא לבדוק מה היא משנה בהתנהגות או בתשומת הלב.',action:'צור ניסוי',page:'transformation'}:{label:'העמק בשאלה הבאה במסע',description:`השלב הפעיל הוא: ${dashboard.activeStage.guidingQuestion}`,action:'המשך ללמוד',page:'library'};
 const selected=provenance.state.status==='idle'?null:provenance.state.insightId;
 return <div className="pdDashboard">
  <header className="pdIntro"><div><span className="pdEyebrow">E.I.L / TODAY</span><h1>איפה אני, מה הבנתי, ומה הצעד הבא?</h1><p>כל השאר נשאר זמין בשכבה עמוקה יותר — בלי להעמיס על הרגע הנוכחי.</p></div>{dashboard.owner&&<GlassButton className="pdAdd" type="button" onClick={onAdd}>＋ הוסף מקור</GlassButton>}</header>
  <DashboardHero transformation={dashboard.latestTransformation} reflection={data.reflections[0]??null}/>
  <div className="pdGrid"><JourneyProgressCard activeStage={dashboard.activeStage} completed={dashboard.completed} total={dashboard.total} owner={dashboard.owner} onContinue={()=>onNav('library')}/><ActiveExperimentCard experiment={experiment} onOpen={()=>onNav('transformation')}/></div>
  <UnderstandingCard insights={data.insights} selectedInsightId={selected} provenanceRows={provenance.state.status==='success'?provenance.state.rows:[]} provenanceStatus={provenance.state.status} provenanceMessage={provenance.state.status==='error'?provenance.state.message:undefined} onOpenProvenance={provenance.load} onCloseProvenance={provenance.close} onOpenInsights={()=>onNav('insights')}/>
  <NextStepCard label={next.label} description={next.description} actionLabel={next.action} onAction={()=>onNav(next.page)}/>
 </div>;
}
