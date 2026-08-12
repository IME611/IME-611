import{useState}from'react';
import type{CSSProperties}from'react';

interface InteractiveDiagramProps{labels:string[];center?:string}

export function InteractiveDiagram({labels,center='מודעות'}:InteractiveDiagramProps){
 const[active,setActive]=useState(0);
 return <div className="interactiveDiagram" role="group" aria-label="מפה אינטראקטיבית"><div className="diagramCenter"><b>{center}</b><span>{labels[active]}</span></div><div className="diagramOrbit">{labels.map((label,index)=><button key={label} type="button" className={index===active?'active':''} onClick={()=>setActive(index)} style={{'--node-index':index}as CSSProperties}><span>{String(index+1).padStart(2,'0')}</span><b>{label}</b></button>)}</div><p>בחר שכבה כדי להחזיק אותה בפרונט. המפה מארגנת את התוכן — היא אינה מחליפה את המקור.</p></div>;
}
