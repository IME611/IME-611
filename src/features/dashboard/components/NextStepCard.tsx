interface NextStepCardProps{
  label:string;
  description:string;
  actionLabel:string;
  onAction:()=>void;
}

export function NextStepCard({label,description,actionLabel,onAction}:NextStepCardProps){
 return <section className="pdNext" aria-labelledby="pd-next-title"><div><span className="pdEyebrow">NEXT BEST STEP</span><h2 id="pd-next-title">{label}</h2><p>{description}</p></div><button className="pdPrimary" type="button" onClick={onAction}>{actionLabel} ←</button></section>
}
