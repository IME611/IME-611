export type ProvenanceTrace={rows:any[];provenanceComplete:boolean};
const endpoint='/api/insights?mode=core-loop';
async function call(body:any){const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Core loop request failed');return d}
export const canonicalCoreLoopApi={
 createInsight:(statement:string,claimIds:string[])=>call({action:'create-insight',statement,claimIds}),
 createExperiment:(insightId:string,hypothesis:string,experimentAction:string,expectedSignal:string)=>call({action:'create-experiment',insightId,hypothesis,experimentAction,expectedSignal}),
 reflect:(experimentId:string,observation:string,outcome:string,interpretation:string)=>call({action:'reflect',experimentId,observation,outcome,interpretation}),
 async provenance(insightId:string):Promise<ProvenanceTrace>{const r=await fetch(`${endpoint}&insightId=${encodeURIComponent(insightId)}`);const d=await r.json();if(!r.ok)throw new Error(d.error||'Provenance request failed');return d},
};
