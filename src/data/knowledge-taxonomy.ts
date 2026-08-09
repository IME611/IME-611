export const taxonomy={categories:[{id:'body',label:'הגוף והמערכת הפיזית',chapters:[1,2,3,9]},{id:'brain',label:'המוח והתודעה',chapters:[4,5,6,10]},{id:'energy',label:'תדר, צליל ואנרגיה',chapters:[7,8]},{id:'identity',label:'זהות, אמונות ורגשות',chapters:[11,12]},{id:'systems',label:'מערכות והשפעות',chapters:[13]},{id:'meaning',label:'משמעות, חזון ומימוש',chapters:[14,15,16,17,18]}],matchTypes:['MATCH','EXTENSION','GAP','CONFLICT','NEW']} as const;
export type MatchType=typeof taxonomy.matchTypes[number];

export function synthesizeKnowledge(input:string){
 const text=input.toLowerCase();
 const scores=taxonomy.categories.map(c=>({category:c.id,score:c.label.split(/\s+/).filter(Boolean).reduce((n,w)=>n+(text.includes(w.toLowerCase())?1:0),0),chapters:c.chapters})).sort((a,b)=>b.score-a.score);
 const top=scores[0];
 return {category:top?.category??'meaning',confidence:top&&top.score>0?Math.min(.55+top.score*.12,.95):.35,candidates:scores.slice(0,3),needsReview:true};
}
