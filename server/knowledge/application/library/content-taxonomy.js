const normalize=value=>String(value||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLocaleLowerCase('he-IL');

export const LIBRARY_DOMAINS=[
 {id:'journey-question',label:'המסע והשאלה',description:'נקודת המוצא: למה יצאתי לחקירה הזאת, מי אני, ואילו שאלות פתחו את המסע.'},
 {id:'human-body',label:'האדם פנימה — הגוף כמערכת',description:'הגוף, המערכות הפנימיות והאופן שבו האדם פועל כמערכת אחת.'},
 {id:'brain-consciousness',label:'המוח, מערכת העצבים והתודעה',description:'המוח, מערכת ההפעלה הפנימית, מצבי מוח, למידה ותודעה.'},
 {id:'frequency-sound',label:'תדרים, מוזיקה וצליל',description:'תדר, מוזיקה, צליל והקשרים שלהם לגוף ולחוויה כפי שהם מופיעים במקורות.'},
 {id:'identity-emotion',label:'זהות, אמונות ורגשות',description:'אמונות, רגשות, דפוסים וזהות והאופן שבו הם משתלבים בתפיסה ובהתנהגות.'},
 {id:'human-world',label:'האדם והעולם',description:'המערכת שמחוץ לאדם: סביבה, מציאות, השפעות וחוקים כפי שהם מתוארים במקורות.'},
 {id:'meaning-integration',label:'שינוי, משמעות ואינטגרציה',description:'מטרות, חזון, שינוי פנימי, משמעות וחיבור התובנות לכדי תמונה רחבה יותר.'},
];

// These are semantic learner-facing topics. The 18 seed files are evidence sources, not 18 chapters/topics.
export const LIBRARY_TOPICS=[
 {id:'journey-origin',domainId:'journey-question',order:1,label:'למה יצאתי למסע?',source:/מי_אני_פרק1/i},
 {id:'body-system',domainId:'human-body',order:2,label:'הגוף כמערכת',source:/פרק3_הפלא_ההנדסי/i,match:/(אני פנימה|הגוף כמערכת|חישה|בקרה ותקשורת|מבנה ותנועה|הגנה|ניקוי ותחזוקה)/i},
 {id:'external-environment',domainId:'human-world',order:3,label:'הסביבה כמערכת תומכת',source:/פרק2_הכלי_החיצוני/i,match:/(אני החוצה|הכלי החיצוני|הסביבה כמערכת|אוויר ואטמוספירה|גיאופיזיקה|קרקע וגיאולוגיה|מים בעולם|מערכות הטבע|מחזורי זמן|מערכות נישתיות)/i},
 {id:'brain-operating-system',domainId:'brain-consciousness',order:4,label:'המוח ומערכת ההפעלה',source:/(פרק4_מערכת_ההפעלה|פרק5_המוח_המפורט)/i},
 {id:'brain-states-learning',domainId:'brain-consciousness',order:5,label:'מצבי מוח, גלי מוח ולמידה',source:/(פרק6_גלי_המוח|פרק10_נוירופלסטיות)/i},
 {id:'pineal-gland',domainId:'brain-consciousness',order:6,label:'בלוטת האצטרובל',source:/פרק7_בלוטת_האצטרובל/i},
 {id:'frequency-body',domainId:'frequency-sound',order:7,label:'תדרים, מוזיקה והגוף',source:/(פרק8_תדרים_מוזיקה_וצליל|פרק9_הגוף_כתדר)/i},
 {id:'identity-beliefs',domainId:'identity-emotion',order:8,label:'זהות, אמונות ודפוסים',source:/פרק11_זהויות_ואמונות/i},
 {id:'emotions-information',domainId:'identity-emotion',order:9,label:'רגשות כמידע',source:/פרק12_רגשות_כמידע/i},
 {id:'human-reality',domainId:'human-world',order:10,label:'האדם מול המציאות והעולם',source:/(פרק13_יצירת_מציאות|פרק14_12_חוקי_היקום)/i},
 {id:'goals-change',domainId:'meaning-integration',order:11,label:'מטרות, חזון וכלי שינוי',source:/פרק15_יעדים_וחזון/i},
 {id:'meaning-integration',domainId:'meaning-integration',order:12,label:'משמעות, מסקנות ואינטגרציה',source:/(פרק16_סבל_קושי_ומשמעות|פרק17_חיבור_הכל|פרק18_מי_אני_תשובה)/i},
];

const ALIASES=[
 {id:'dmt',label:'DMT',match:/\bdmt\b/i},
 {id:'meditation',label:'מדיטציה',match:/מדיטצי/i},
 {id:'nervous-system',label:'מערכת העצבים',match:/מערכת העצבים/i},
 {id:'neuroplasticity',label:'נוירופלסטיות',match:/נוירופלסט/i},
 {id:'melatonin-serotonin',label:'מלטונין וסרוטונין',match:/(מלטונין|סרוטונין)/i},
 {id:'amygdala',label:'אמיגדלה',match:/אמיגדל/i},
 {id:'hippocampus',label:'היפוקמפוס',match:/היפוקמפ/i},
 {id:'hypothalamus',label:'היפותלמוס',match:/היפותלמ/i},
 {id:'thalamus',label:'תלמוס',match:/(^|\s)תלמוס/i},
 {id:'brainstem',label:'גזע המוח',match:/גזע המוח/i},
 {id:'frontal-lobe',label:'האונה המצחית',match:/האונה המצח/i},
 {id:'temporal-lobe',label:'האונה הרקתית',match:/האונה הרקת/i},
 {id:'parietal-lobe',label:'האונה הקודקודית',match:/האונה הקודקוד/i},
 {id:'occipital-lobe',label:'האונה העורפית',match:/האונה העורפ/i},
 {id:'hemispheres',label:'שתי המיספרות',match:/מיספר/i},
 {id:'neurons',label:'נוירונים',match:/נוירונ/i},
 {id:'synapses',label:'סינפסות',match:/סינפס/i},
 {id:'delta',label:'Delta',match:/(^|\s)(delta|דלתא)(\s|—|-|$)/i},
 {id:'theta',label:'Theta',match:/(^|\s)(theta|תטא)(\s|—|-|$)/i},
 {id:'alpha',label:'Alpha',match:/(^|\s)(alpha|אלפא)(\s|—|-|$)/i},
 {id:'beta',label:'Beta',match:/(^|\s)(beta|בטא)(\s|—|-|$)/i},
 {id:'gamma',label:'Gamma',match:/(^|\s)(gamma|גאמא)(\s|—|-|$)/i},
 {id:'epsilon',label:'Epsilon',match:/(^|\s)(epsilon|אפסילון)(\s|—|-|$)/i},
 {id:'binaural',label:'טונים בינוראליים',match:/(binaural|בינוראל)/i},
 {id:'isochronic',label:'טונים איזוכרוניים',match:/(isochronic|איזוכרונ)/i},
 {id:'monaural',label:'טונים מונוראליים',match:/(monaural|מונוראל)/i},
 {id:'psychoacoustics',label:'פסיכואקוסטיקה',match:/(psychoacoust|פסיכואקוסט)/i},
 {id:'schumann',label:'תהודת שומאן',match:/(schumann|שומאן|שומהן)/i},
 {id:'solfeggio',label:'תדרי Solfeggio',match:/solfeggio/i},
 {id:'cymatics',label:'קימטיקה',match:/קימטיקה/i},
 {id:'pythagoras',label:'מוזיקה ופיתגורס',match:/פיתגורס/i},
 {id:'breathing',label:'נשימה',match:/נשימ/i},
 {id:'chakras',label:"צ'אקרות",match:/צ['׳]?אקר/i},
 {id:'aura',label:'הילה',match:/(^|\s)(הילה|aura)(\s|—|-|$)/i},
 {id:'fibonacci',label:"פיבונאצ'י",match:/פיבונאצ/i},
 {id:'kabbalah',label:'קבלה וספירות',match:/(קבלה|ספירות)/i},
 {id:'logotherapy',label:'לוגותרפיה',match:/לוגותרפ/i},
 {id:'post-traumatic-growth',label:'צמיחה פוסט־טראומטית',match:/post-traumatic growth/i},
 {id:'eft',label:'EFT',match:/(^|\s)eft(\s|—|-|$)/i},
 {id:'jung-shadow',label:'הצל של יונג',match:/(הצל של יונג|עבודה עם הצל)/i},
 {id:'pygmalion',label:'אפקט פיגמליון',match:/פיגמליון/i},
 {id:'galatea',label:'אפקט גלתיאה',match:/גלתיאה/i},
 {id:'autosuggestion',label:'אוטוסוגסטיה',match:/אוטוסוגסט/i},
 {id:'brain-rewire',label:'חיווט מחדש',match:/(brain rewire|חיווט מחדש)/i},
];

const GENERIC=/^(?:מבוא|הקדמה|סיכום|לסיכום|השאלה|רגע של עצירה|הנקודה המרכזית|הנקודה האמיתית|מילת סיום|המסקנה המעשית|החיבור הגדול|קישור הכל|המעבר לחלק הבא|מהפכת ההבנה|הזהירות הנדרשת|בפנים|בחוץ)$/i;
const SENTENCE_START=/^(?:אבל\b|מה לעשות\b|שמור על\b|חזור ו\b|ערב\b|בוקר\b|שלב\s+\d+\b|2026\b)/i;

export function topicForSourceFile(sourceFile){return LIBRARY_TOPICS.find(topic=>topic.source.test(String(sourceFile||'')))||null}

export function topicForSectionNode(node){
 const label=String(node?.label||'');
 const explicit=LIBRARY_TOPICS.find(topic=>topic.match?.test(label));
 if(explicit)return explicit;
 const files=node?.sourceFiles||[];
 const counts=new Map();
 for(const file of files){const topic=topicForSourceFile(file);if(topic)counts.set(topic.id,(counts.get(topic.id)||0)+1)}
 const winner=[...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];
 return LIBRARY_TOPICS.find(topic=>topic.id===winner)||null;
}

export function canonicalSubtopic(label){
 const text=String(label||'').trim();
 const alias=ALIASES.find(item=>item.match.test(text));
 if(alias)return{id:alias.id,label:alias.label};
 const words=text.split(/\s+/).filter(Boolean);
 if(!text||text.length>72||words.length>8||GENERIC.test(text)||SENTENCE_START.test(text)||/^["'“”]/.test(text))return null;
 return{id:null,label:text};
}

export function normalizeTaxonomyLabel(value){return normalize(value)}
