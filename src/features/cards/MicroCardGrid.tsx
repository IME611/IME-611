import React from'react';
import{MicroCard}from'./MicroCard';

type Props={chapterNumber:number;sourceLabel:string;paragraphs:string[];topic:string;concepts:string[]};
export function MicroCardGrid({chapterNumber,sourceLabel,paragraphs,topic,concepts}:Props){
 const cards=paragraphs.map((text,index)=>({text,index})).filter(item=>item.text.trim());
 return <section className="microCardExperience" aria-label="כרטיסיות מקור"><div className="microCardIntro"><span className="eyebrow">ZERO STYLE DRIFT · MICRO CARDS</span><h2>המקור, בכרטיסיות. מילה במילה.</h2><p>לא מסכמים ולא משכתבים. כל כרטיס מציג ניסוח מקורי ומצביע חזרה למיקומו במקור.</p></div><div className="microCardGrid">{cards.map(({text,index})=><MicroCard key={index} fragmentId={`chapter-${chapterNumber}-paragraph-${index+1}`} conceptId={concepts[index%Math.max(1,concepts.length)]||`chapter-${chapterNumber}`} topic={topic} subtopic={concepts[index%Math.max(1,concepts.length)]} text={text} sourceLabel={sourceLabel} provenanceLabel={`פסקה ${index+1}`}/>)}</div></section>;
}
