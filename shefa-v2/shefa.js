/* SHEFA GLOBAL v2 — public site + founder area (data-area="founder") */
(function(){
  const MARK = '<svg class="brand-mark" viewBox="0 0 96 96" fill="none" aria-hidden="true"><polygon points="48,4 88,26 88,70 48,92 8,70 8,26" fill="rgba(184,134,11,.08)" stroke="#B8860B" stroke-width="3"/><polygon points="48,24 68,35 68,61 48,72 28,61 28,35" fill="rgba(232,192,96,.18)" stroke="#C9961A" stroke-width="3"/><circle cx="48" cy="48" r="7" fill="#C9961A"/></svg>';
  const FOUNDER = document.body && document.body.dataset.area === 'founder';
  const here = (location.pathname.split('/').pop() || 'index.html').replace(/^$/,'index.html');

  // ── founder gate (cosmetic, client-side only) ──
  const KEY='shefa_founder_ok';
  function unlocked(){ try{ return localStorage.getItem(KEY)==='1' || sessionStorage.getItem(KEY)==='1'; }catch(e){ return true; } }
  if(FOUNDER && here!=='founder.html' && !unlocked()){ location.replace('founder.html'); return; }
  window.SG_unlock = function(){ try{ localStorage.setItem(KEY,'1'); }catch(e){ try{ sessionStorage.setItem(KEY,'1'); }catch(e2){} } };
  window.SG_lock = function(){ try{ localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); }catch(e){} };
  window.SG_isUnlocked = unlocked;

  const PUBLIC_NAV = [
    {t:'איך זה עובד', href:'process.html'},
    {t:'ההסכם', href:'index.html#pact'},
    {t:'שאלות נפוצות', href:'index.html#faq'},
  ];
  const FOUNDER_NAV = [
    {t:'לוח המייסד', href:'founder.html'},
    {t:'החזון', items:[
      {t:'המניפסט והסיפור', d:'נקודת המפנה, הלידה, עץ השפע, SHEFA OS', href:'manifesto.html'},
      {t:'החלום מתממש', d:'סימולציית המסע עד חמש יבשות', href:'dream.html'},
    ]},
    {t:'המודל', items:[
      {t:'נתיב הקריסטל', d:'שישה שלבים, ארבעה שערים', href:'path.html'},
      {t:'האיפוס הפיננסי', d:'מחשבון: בטוח מול פדיון פנסיה', href:'reset.html'},
      {t:'מחשבון הנתינה', d:'חוב ← שעות, מדרגות שכר', href:'giving.html'},
      {t:'כלכלת הקריסטלים', d:'סוגים, דרגות, סימולטור', href:'crystals.html'},
      {t:'האקוסיסטם', d:'מעגלים, בוטים, שלושה ארנקים', href:'ecosystem.html'},
    ]},
    {t:'הביצוע', items:[
      {t:'הפיילוט', d:'12 שבועות · משפחת כהן', href:'pilot.html'},
      {t:'מפת הדרכים', d:'שלבים, סיכונים, 28 הכרעות', href:'roadmap.html'},
      {t:'לשותפים ולמממנים', d:'הצעת ערך וקרן הקריסטלים', href:'partners.html'},
    ]},
  ];
  const NAV = FOUNDER ? FOUNDER_NAV : PUBLIC_NAV;

  function navHTML(){
    const li = NAV.map(n=>{
      if(n.href) return `<li><a href="${n.href}" class="${here===n.href?'active':''}">${n.t}</a></li>`;
      const act = n.items.some(i=>i.href===here);
      return `<li><button class="dd ${act?'active':''}" aria-haspopup="true">${n.t} ▾</button><div class="menu">${n.items.map(i=>`<a href="${i.href}">${i.t}<span>${i.d}</span></a>`).join('')}</div></li>`;
    }).join('');
    const brandHref = FOUNDER ? 'founder.html' : 'index.html';
    const tag = FOUNDER ? '<span class="tag ink" style="margin-right:.4rem">אזור המייסד</span>' : '<small>· Shefa Global</small>';
    const cta = FOUNDER
      ? `<a href="index.html" class="btn btn-line btn-sm">לאתר הציבורי ↗</a><button class="btn btn-dark btn-sm" id="sgLock">יציאה</button>`
      : `<a href="dashboard.html" class="btn btn-line btn-sm">האזור האישי</a><a href="join.html" class="btn btn-gold btn-sm">הרשמה</a>`;
    return `<a href="${brandHref}" class="brand">${MARK}שפע גלובל ${tag}</a>
      <ul class="nav-links">${li}</ul>
      <div class="nav-cta">${cta}<button class="burger" aria-label="תפריט"><span></span></button></div>`;
  }
  function drawerHTML(){
    let h = `<div class="drawer-panel"><button class="drawer-close" aria-label="סגירה">×</button><a href="${FOUNDER?'founder.html':'index.html'}" class="brand" style="border:none;display:flex;gap:.5rem;align-items:center">${MARK}שפע גלובל</a>`;
    NAV.forEach(n=>{ if(n.href) h += `<a href="${n.href}">${n.t}</a>`; else { h += `<h5>${n.t}</h5>` + n.items.map(i=>`<a href="${i.href}">${i.t}</a>`).join(''); } });
    h += FOUNDER ? `<h5>יציאה</h5><a href="index.html">לאתר הציבורי</a>` : `<h5>אישי</h5><a href="join.html">הרשמה</a><a href="dashboard.html">האזור האישי</a>`;
    return h + '</div>';
  }
  function footerHTML(){
    if(FOUNDER) return `<div class="legal" style="margin-top:0;border:none;padding-top:0"><span>אזור המייסד · חומר פנימי, לא לפרסום · שפע גלובל · IME 611</span><span><a href="index.html" style="display:inline">לאתר הציבורי ↗</a></span></div>`;
    return `<div class="cols cols3">
      <div><a href="index.html" class="brand" style="display:flex;gap:.6rem;align-items:center;color:#FBF3DF;font-family:Heebo;font-weight:800">${MARK}שפע גלובל</a>
        <p class="slogan">תודעת שפע היא הדרך להגשמה.</p>
        <p style="font-size:.88rem;max-width:36ch">יוצאים מהחוב, בונים חיים חדשים, ומחזירים לקהילה. זו העסקה.</p></div>
      <div><h6>התהליך</h6><a href="process.html">איך זה עובד</a><a href="index.html#pact">ההסכם</a><a href="index.html#faq">שאלות נפוצות</a></div>
      <div><h6>מתחילים</h6><a href="join.html">הרשמה</a><a href="dashboard.html">האזור האישי</a></div>
    </div>
    <div class="legal"><span>© 2026 שפע גלובל · מיזם של IME 611</span>
    <span>אין באתר ייעוץ פיננסי, פנסיוני או משפטי. · <a href="founder.html" style="display:inline;color:rgba(243,233,210,.35)">כניסת מייסד</a></span></div>`;
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const nav = document.createElement('nav'); nav.className='site-nav'+(FOUNDER?' founder':''); nav.innerHTML = navHTML();
    document.body.prepend(nav);
    const dr = document.createElement('div'); dr.className='drawer'; dr.innerHTML = drawerHTML(); document.body.appendChild(dr);
    nav.querySelector('.burger').onclick = ()=>dr.classList.add('open');
    dr.onclick = e=>{ if(e.target===dr || e.target.classList.contains('drawer-close')) dr.classList.remove('open'); };
    const lk = document.getElementById('sgLock'); if(lk) lk.onclick=()=>{ window.SG_lock(); location.href='index.html'; };
    if(!document.querySelector('.site-footer') && !document.body.dataset.nofooter){
      const f = document.createElement('footer'); f.className='site-footer'; f.innerHTML = footerHTML(); document.body.appendChild(f);
    }
    if(FOUNDER && !document.body.dataset.nostandby){
      const s = document.createElement('a'); s.className='standby'; s.href='founder.html';
      s.innerHTML='<span class="pulse"></span>STAND BY · אזור המייסד'; document.body.appendChild(s);
    }
    // founder chapter footers: point "back" to the hub instead of the public home
    if(FOUNDER) document.querySelectorAll('.next-chapter a[href="index.html"]').forEach(a=>{ a.href='founder.html'; const b=a.querySelector('b'); if(b) b.textContent='לוח המייסד'; });
    document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
    const co = 'IntersectionObserver' in window ? new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ countUp(e.target); co.unobserve(e.target);} }),{threshold:.4}) : null;
    document.querySelectorAll('[data-count]').forEach(el=> co ? co.observe(el) : countUp(el));
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
