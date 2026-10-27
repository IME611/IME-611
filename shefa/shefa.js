/* SHEFA GLOBAL — shared site script: nav, footer, reveal, counters, tabs */
(function(){
  const MARK = '<svg class="brand-mark" viewBox="0 0 96 96" fill="none" aria-hidden="true"><polygon points="48,4 88,26 88,70 48,92 8,70 8,26" fill="rgba(184,134,11,.08)" stroke="#B8860B" stroke-width="3"/><polygon points="48,24 68,35 68,61 48,72 28,61 28,35" fill="rgba(232,192,96,.18)" stroke="#C9961A" stroke-width="3"/><circle cx="48" cy="48" r="7" fill="#C9961A"/></svg>';

  const NAV = [
    {t:'החזון', href:'manifesto.html'},
    {t:'המודל', items:[
      {t:'נתיב הקריסטל', d:'שישה שלבים, ארבעה שערים', href:'path.html'},
      {t:'האיפוס הפיננסי', d:'מחשבון: המודל הבטוח מול פדיון פנסיה', href:'reset.html'},
      {t:'כלכלת הקריסטלים', d:'נתינה שנמדדת — סימולטור דרגות', href:'crystals.html'},
      {t:'האקוסיסטם', d:'מעגלים, בוטים, שלושה ארנקים', href:'ecosystem.html'},
    ]},
    {t:'הדרך', items:[
      {t:'הפיילוט', d:'12 שבועות · תיק משפחת כהן', href:'pilot.html'},
      {t:'מפת הדרכים', d:'שבעה שלבים מאפס עד גלובלי', href:'roadmap.html'},
      {t:'לשותפים ולמממנים', d:'הצעת הערך וקרן הקריסטלים', href:'partners.html'},
    ]},
    {t:'החלום מתממש', href:'dream.html'},
  ];
  const here = (location.pathname.split('/').pop() || 'index.html');

  function navHTML(){
    const li = NAV.map(n=>{
      if(n.href) return `<li><a href="${n.href}" class="${here===n.href?'active':''}">${n.t}</a></li>`;
      const act = n.items.some(i=>i.href===here);
      return `<li><button class="dd ${act?'active':''}" aria-haspopup="true">${n.t} ▾</button><div class="menu">${n.items.map(i=>`<a href="${i.href}">${i.t}<span>${i.d}</span></a>`).join('')}</div></li>`;
    }).join('');
    return `<a href="index.html" class="brand">${MARK}שפע גלובל <small>· Shefa Global</small></a>
      <ul class="nav-links">${li}</ul>
      <div class="nav-cta"><a href="dashboard.html" class="btn btn-line btn-sm">האזור האישי</a><a href="join.html" class="btn btn-gold btn-sm">הצטרפו למסע</a>
      <button class="burger" aria-label="תפריט"><span></span></button></div>`;
  }
  function drawerHTML(){
    let h = `<div class="drawer-panel"><button class="drawer-close" aria-label="סגירה">×</button><a href="index.html" class="brand" style="border:none;display:flex;gap:.5rem;align-items:center">${MARK}שפע גלובל</a>`;
    NAV.forEach(n=>{
      if(n.href) h += `<a href="${n.href}">${n.t}</a>`;
      else { h += `<h5>${n.t}</h5>` + n.items.map(i=>`<a href="${i.href}">${i.t}</a>`).join(''); }
    });
    h += `<h5>אישי</h5><a href="dashboard.html">האזור האישי (תצוגה)</a><a href="join.html">הצטרפות</a><a href="shefa-global-master.pdf" target="_blank">מסמך האב (PDF)</a></div>`;
    return h;
  }
  function footerHTML(){
    return `<div class="cols">
      <div><a href="index.html" class="brand" style="display:flex;gap:.6rem;align-items:center;color:#FBF3DF;font-family:Heebo;font-weight:800">${MARK}שפע גלובל</a>
        <p class="slogan">תודעת שפע היא הדרך להגשמה.</p>
        <p style="font-size:.88rem;max-width:34ch">תנועה שמעבירה משפחות מתודעת חוסר לתודעת שפע — דרך איפוס כלכלי, העצמה תודעתית ונתינה קהילתית.</p></div>
      <div><h6>החזון</h6><a href="manifesto.html">המניפסט</a><a href="manifesto.html#tree">עץ השפע</a><a href="manifesto.html#os">SHEFA OS</a><a href="dream.html">החלום מתממש</a></div>
      <div><h6>המודל</h6><a href="path.html">נתיב הקריסטל</a><a href="reset.html">האיפוס הפיננסי</a><a href="crystals.html">כלכלת הקריסטלים</a><a href="ecosystem.html">האקוסיסטם</a></div>
      <div><h6>הדרך</h6><a href="pilot.html">הפיילוט</a><a href="roadmap.html">מפת הדרכים</a><a href="partners.html">לשותפים</a><a href="shefa-global-master.pdf" target="_blank">מסמך האב (PDF) ↓</a></div>
    </div>
    <div class="legal"><span>© 2026 שפע גלובל · מיזם של IME 611 · מייסד: עידן משה עינב</span>
    <span>⏸ STAND BY — ארכיטקטורת חזון. אין כרגע פעילות, גיוס או ישות משפטית. האתר אינו ייעוץ פיננסי, פנסיוני או משפטי.</span></div>`;
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const nav = document.createElement('nav'); nav.className='site-nav'; nav.innerHTML = navHTML();
    document.body.prepend(nav);
    const dr = document.createElement('div'); dr.className='drawer'; dr.innerHTML = drawerHTML(); document.body.appendChild(dr);
    nav.querySelector('.burger').onclick = ()=>dr.classList.add('open');
    dr.onclick = e=>{ if(e.target===dr || e.target.classList.contains('drawer-close')) dr.classList.remove('open'); };
    if(!document.querySelector('.site-footer') && !document.body.dataset.nofooter){
      const f = document.createElement('footer'); f.className='site-footer'; f.innerHTML = footerHTML(); document.body.appendChild(f);
    }
    if(!document.body.dataset.nostandby){
      const s = document.createElement('a'); s.className='standby'; s.href='roadmap.html';
      s.innerHTML='<span class="pulse"></span>STAND BY · חזון בבנייה'; s.title='המיזם בהמתנה — ארכיטקטורה מוכנה על המדף';
      document.body.appendChild(s);
    }
    // reveal
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{threshold:.12, rootMargin:'0px 0px -40px 0px'}) : null;
    document.querySelectorAll('.reveal').forEach(el=> io ? io.observe(el) : el.classList.add('in'));
    // counters
    const co = 'IntersectionObserver' in window ? new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ countUp(e.target); co.unobserve(e.target);} }),{threshold:.4}) : null;
    document.querySelectorAll('[data-count]').forEach(el=> co ? co.observe(el) : countUp(el));
    // tabs
    document.querySelectorAll('[data-tabs]').forEach(group=>{
      const tabs = group.querySelectorAll('.tab'), panels = group.querySelectorAll('.tab-panel');
      tabs.forEach((t,i)=>t.addEventListener('click',()=>{ tabs.forEach(x=>x.classList.remove('active')); panels.forEach(x=>x.classList.remove('active')); t.classList.add('active'); panels[i].classList.add('active'); }));
    });
  });

  function countUp(el){
    const to = parseFloat(el.dataset.count), dur = 1600, pre = el.dataset.pre||'', suf = el.dataset.suf||'';
    const t0 = performance.now();
    (function tick(t){ const p = Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-p,3);
      el.textContent = pre + Math.round(to*e).toLocaleString('he-IL') + suf; if(p<1) requestAnimationFrame(tick); })(t0);
  }
  window.SG = {
    ils: n => '₪' + Math.round(n).toLocaleString('he-IL'),
    k: n => Math.abs(n)>=1e6 ? '₪'+(n/1e6).toFixed(2).replace(/\.?0+$/,'')+' מיליון' : '₪'+Math.round(n/1000).toLocaleString('he-IL')+' אלף',
    pmt: (P, annual, months) => { const r = annual/12; return r===0 ? P/months : P*r/(1-Math.pow(1+r,-months)); },
    countUp
  };
})();
