export interface TaxonomyTopic{ id:string; label:string; terms:string[] }
export interface TaxonomyProposal{ topicId:string; topicLabel:string; confidence:number; matchedTerms:string[] }

export const RESEARCH_INBOX='inbox';
export const taxonomyTopics:TaxonomyTopic[]=[
 {id:'body',label:'הגוף והמערכת הפיזית',terms:['גוף','מערכות גוף','סביבה','ביולוגיה','כאב','הומאוסטזיס','פיזיולוגיה']},
 {id:'mind',label:'המוח והתודעה',terms:['מודע','תת-מודע','על-מודע','מוח','נוירונים','זיכרון','למידה','נוירופלסטיות','גלי מוח']},
 {id:'frequency',label:'תדר, צליל ואנרגיה',terms:['תדר','תדרים','צליל','מוזיקה','תהודה','צ׳אקרות','צ'אקרות','הילה','אנרגיה','גלי מוח']},
 {id:'identity',label:'זהות, אמונות ורגשות',terms:['זהות','אמונות','הרגלים','רגשות','מחשבות','פרשנות','התנהגות','יצירת מציאות']},
 {id:'meaning',label:'משמעות, חזון ומימוש',terms:['משמעות','חזון','יעדים','מימוש','סבל','רוחניות','אינטגרציה','מי אני','פעולה']},
 {id:RESEARCH_INBOX,label:'מגירת ביניים · ממתין להחלטה',terms:[]},
];

const count=(haystack:string,needle:string)=>{let total=0,pos=0;while((pos=haystack.indexOf(needle,pos))!==-1){total+=1;pos+=Math.max(1,needle.length)}return total};
export function proposeTaxonomy(text:string):TaxonomyProposal[]{
 const normalized=text.toLocaleLowerCase('he');
 const scored=taxonomyTopics.filter(topic=>topic.id!==RESEARCH_INBOX).map(topic=>{
  const matches=topic.terms.filter(term=>normalized.includes(term.toLocaleLowerCase('he')));
  const score=matches.reduce((sum,term)=>sum+Math.min(3,count(normalized,term.toLocaleLowerCase('he'))),0);
  return{topic,score,matches};
 }).sort((a,b)=>b.score-a.score);
 const max=Math.max(1,scored[0]?.score??1);
 const proposals=scored.filter(item=>item.score>0).slice(0,3).map(item=>({topicId:item.topic.id,topicLabel:item.topic.label,confidence:Number((item.score/max).toFixed(2)),matchedTerms:item.matches.slice(0,5)}));
 return proposals.length?proposals:[{topicId:RESEARCH_INBOX,topicLabel:'מגירת ביניים · ממתין להחלטה',confidence:0,matchedTerms:[]}];
}
