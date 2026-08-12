import type{DashboardReflection}from'../model/dashboard.types';
import type{TransformationDraft}from'../../transformation/model/transformation.types';

interface DashboardHeroProps{
  transformation:TransformationDraft|null;
  reflection:DashboardReflection|null;
}

export function DashboardHero({transformation,reflection}:DashboardHeroProps){
 const hasTransformation=Boolean(transformation?.transformation.before.trim()||transformation?.transformation.after.trim());
 return <section className="pdHero" aria-labelledby="pd-hero-title">
  <div className="pdHeroCopy">
   <span className="pdEyebrow">MOMENT OF TRANSFORMATION</span>
   <h1 id="pd-hero-title">מה השתנה בי מאז שהתחלתי לבדוק?</h1>
   {hasTransformation?<div className="pdBeforeAfter"><div><small>לפני</small><p>{transformation?.transformation.before||'לא נוסח עדיין'}</p></div><i aria-hidden="true">→</i><div><small>עכשיו</small><p>{transformation?.transformation.after||transformation?.reflection.interpretation||'השינוי עדיין בתהליך'}</p></div></div>:reflection?<div className="pdReflection"><small>הרפלקציה האחרונה שנשמרה במנוע</small><p>{reflection.interpretation||reflection.observation}</p><span>מבוסס על ניסוי שנקשר לתובנה: {reflection.insight_statement}</span></div>:<p className="pdHeroEmpty">עדיין אין נקודת שינוי מתועדת. המסע מתחיל מלמידה, ממשיך בתובנה מבוססת ראיה, ורק אז עובר לבדיקה בחיים.</p>}
  </div>
  <div className="pdLoop" aria-label="לולאת ההתפתחות"><span>למדתי</span><b>→</b><span>הבנתי</span><b>→</b><span>בדקתי</span><b>→</b><span>חוויתי</span><b>→</b><span>עדכנתי</span></div>
 </section>
}
