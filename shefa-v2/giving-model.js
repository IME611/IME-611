/* SHEFA GLOBAL — giving model (מחשבון הנתינה)
   The value a family returns to the community is derived from the debt it was helped with.
   Hours are valued on a rising ladder ("מדרגות שכר נתינה"): the longer and better you give,
   the more each hour is worth — like a promotion. */
(function(){
  const TIERS = [
    {key:'start',  name:'מתנדב/ת', rate:36,  icon:'🌱', desc:'שכר מינימום לשעה, כרצפה'},
    {key:'silver', name:'תורם/ת',  rate:50,  icon:'🥈', desc:'אחרי עמידה רציפה ביעד'},
    {key:'gold',   name:'מלווה',   rate:75,  icon:'🥇', desc:'מלווה משפחה חדשה'},
    {key:'dia',    name:'שגריר/ה', rate:100, icon:'💎', desc:'מוביל/ה מעגל, מהדהד/ת'}
  ];
  // months in each tier before promotion, by performance score 1..5
  const PROMO = {1:10, 2:8, 3:6, 4:5, 5:4};
  const BONUS = s => 1 + (s-3)*0.05;            // 0.90 .. 1.10 on the hourly value
  const MIN_H = 8, MAX_H = 40;                   // family hours / month: floor and cap

  function tierAt(month, score){ return Math.min(TIERS.length-1, Math.floor((month-1)/PROMO[score])); }

  // months needed to reach target value giving H family-hours a month
  function run(target, H, score, limit){
    let v=0, m=0; const rows=[];
    while(v<target && m<(limit||600)){ m++; const t=tierAt(m,score); const add=H*TIERS[t].rate*BONUS(score); v+=add; rows.push({m,t,v:Math.min(v,target),add}); }
    return {months:m, rows, value:v};
  }

  // main: given debt, return ratio, period (months), adults, performance score
  function plan({debt, ratio=.3, months=36, adults=2, score=3}){
    const target = Math.round(debt*ratio);
    let lo=0.5, hi=400;
    for(let i=0;i<40;i++){ const mid=(lo+hi)/2; if(run(target,mid,score,months+1).months<=months) hi=mid; else lo=mid; }
    let H = Math.ceil(hi*2)/2, note='';
    if(H<MIN_H){ H=MIN_H; note='floor'; }
    let capped=false; if(H>MAX_H){ H=MAX_H; capped=true; note='cap'; }
    const r = run(target,H,score);
    const totalHours = Math.round(H*r.months);
    const perAdultWeek = H/adults/4.33;
    const byTier = TIERS.map((t,i)=>({...t, months:r.rows.filter(x=>x.t===i).length})).filter(t=>t.months>0);
    const avgRate = target/Math.max(1,totalHours);
    return {target, H, months:r.months, totalHours, perAdultWeek, byTier, rows:r.rows, avgRate, capped, note, score};
  }
  window.GIVING = {TIERS, PROMO, BONUS, MIN_H, MAX_H, plan, tierAt};
})();
/* mime-fix-permanent */
