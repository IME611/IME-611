import type{DashboardInsight,ProvenanceRow}from'../model/dashboard.types';

interface UnderstandingCardProps{
  insights:DashboardInsight[];
  selectedInsightId:string|null;
  provenanceRows:ProvenanceRow[];
  provenanceStatus:'idle'|'loading'|'error'|'success';
  provenanceMessage?:string;
  onOpenProvenance:(insightId:string)=>void;
  onCloseProvenance:()=>void;
  onOpenInsights:()=>void;
}

const statusLabel=(status:DashboardInsight['status'])=>status==='SUPPORTED'?'מבוסס ראיות':status==='CHALLENGED'?'דורש בחינה':'השערה';

export function UnderstandingCard({insights,selectedInsightId,provenanceRows,provenanceStatus,provenanceMessage,onOpenProvenance,onCloseProvenance,onOpenInsights}:UnderstandingCardProps){
 return <section className="pdCard pdUnderstanding" aria-labelledby="pd-understanding-title">
  <div className="pdCardHead"><div><span className="pdEyebrow">CURRENT UNDERSTANDING</span><h2 id="pd-understanding-title">מה אני מבין כרגע?</h2></div><button type="button" className="pdTextButton" onClick={onOpenInsights}>לכל התובנות</button></div>
  {insights.length?<div className="pdInsightList">{insights.slice(0,3).map(insight=><article key={insight.id} className="pdInsight"><div><span className={`pdStatus ${insight.status.toLowerCase()}`}>{statusLabel(insight.status)}</span><p>{insight.statement}</p></div><button type="button" onClick={()=>onOpenProvenance(insight.id)}>למה אני חושב את זה?</button></article>)}</div>:<div className="pdEmpty"><strong>עדיין אין תובנה קנונית.</strong><span>כשתיווצר תובנה עם Evidence אמיתי, היא תופיע כאן.</span></div>}
  {selectedInsightId&&<div className="pdProvenance" role="region" aria-live="polite" aria-label="מקור התובנה"><div className="pdProvenanceHead"><strong>Trace למקור</strong><button type="button" onClick={onCloseProvenance} aria-label="סגור trace">×</button></div>{provenanceStatus==='loading'&&<p>טוען את שרשרת הראיות…</p>}{provenanceStatus==='error'&&<p>{provenanceMessage||'לא ניתן לטעון את המקור.'}</p>}{provenanceStatus==='success'&&provenanceRows.map(row=><div className="pdEvidence" key={row.evidence_id}><span>{row.source_title} · קטע {row.fragment_ordinal+1}</span><blockquote>{row.claim_statement}</blockquote><details><summary>הצג את הטקסט המקורי</summary><p>{row.fragment_text}</p></details></div>)}</div>}
 </section>
}
