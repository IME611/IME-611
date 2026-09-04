export const JOURNEY_LAYERS=[
 {id:'A',marker:'א',label:'שכבה ראשונה — אני והמערכת',shortLabel:'אני והמערכת',chapterRange:'1–3',nums:[1,2,3],why:'מתחילים בשאלת הזהות, מרחיבים את המבט אל הסביבה, ורק אז חוזרים אל מורכבות הגוף.'},
 {id:'B',marker:'ב',label:'שכבה שנייה — המוח והדפוסים',shortLabel:'המוח והדפוסים',chapterRange:'4–6',nums:[4,5,6],why:'אחרי הגוף עוברים אל מנגנוני המוח, אל הדפוסים האוטומטיים ואל מצבי הפעילות שמשפיעים על למידה.'},
 {id:'C',marker:'ג',label:'שכבה שלישית — תדר, חוויה ומשמעות',shortLabel:'תדר, חוויה ומשמעות',chapterRange:'7–9',nums:[7,8,9],why:'מתחילים במנגנון ביולוגי שניתן למדוד, עוברים לפיזיקה ולחוויה של צליל, ורק אז בוחנים מפות רוחניות תוך הבחנה בין מסורת, מטפורה וראיה.'},
 {id:'D',marker:'ד',label:'שכבה רביעית — כלי השינוי',shortLabel:'כלי השינוי',chapterRange:'10–13',nums:[10,11,12,13],why:'הבנתי מה אני. האם אני יכול לשנות? כן — כך עושים את זה.'},
 {id:'E',marker:'ה',label:'שכבה חמישית — המשמעות',shortLabel:'המשמעות',chapterRange:'14–18',nums:[14,15,16,17,18],why:'חוקי המשחק, כיוון, קושי — וחזרה לשאלה הראשונה עם תשובה אמיתית.'},
] as const;

export type JourneyLayer=typeof JOURNEY_LAYERS[number];
export type JourneyLayerId=JourneyLayer['id'];

export function isJourneyLayerId(value:unknown):value is JourneyLayerId{
 return typeof value==='string'&&JOURNEY_LAYERS.some(layer=>layer.id===value);
}

export function journeyLayerForChapter(chapterNumber:number):JourneyLayer|undefined{
 return JOURNEY_LAYERS.find(layer=>(layer.nums as readonly number[]).includes(chapterNumber));
}
