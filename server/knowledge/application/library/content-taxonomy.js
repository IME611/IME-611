const normalize=value=>String(value||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLocaleLowerCase('he-IL');

export const LIBRARY_DOMAINS=[
 {id:'journey-question',label:'המסע והשאלה',description:'נקודת המוצא: מי אני, למה יצאתי לחקירה הזאת, ואילו שאלות הובילו אליה.'},
 {id:'human-body',label:'הגוף ומערכות האדם',description:'המבנה הפיזי, מערכות הגוף והאופן שבו הגוף פועל כמערכת אחת.'},
 {id:'brain-consciousness',label:'המוח, מערכת העצבים והתודעה',description:'המוח, מערכת ההפעלה הפנימית, גלי מוח, נוירופלסטיות ונושאים הקשורים לתודעה.'},
 {id:'frequency-sound',label:'תדרים, מוזיקה וצליל',description:'תדר, מוזיקה, צליל וההשפעות המתוארות במקורות.'},
 {id:'identity-emotion',label:'זהות, אמונות ורגשות',description:'אמונות, רגשות וזהות והאופן שבו הם משתלבים בתפיסה ובהתנהגות.'},
 {id:'human-world',label:'האדם והעולם',description:'המפגש בין האדם למערכת שמחוץ לו: מציאות, סביבה, השפעות וחוקים כפי שהם מתוארים במקורות.'},
 {id:'meaning-integration',label:'מטרות, משמעות ואינטגרציה',description:'יעדים, חזון, משמעות, קושי וחיבור התובנות לכדי תמונה רחבה יותר.'},
];

export const LIBRARY_TOPICS=[
 {id:'who-am-i-opening',domainId:'journey-question',order:1,label:'מי אני?',source:/מי_אני_פרק1/i},
 {id:'external-tool',domainId:'human-body',order:2,label:'הכלי החיצוני',source:/פרק2_הכלי_החיצוני/i},
 {id:'engineering-body',domainId:'human-body',order:3,label:'הפלא ההנדסי',source:/פרק3_הפלא_ההנדסי/i},
 {id:'operating-system',domainId:'brain-consciousness',order:4,label:'מערכת ההפעלה',source:/פרק4_מערכת_ההפעלה/i},
 {id:'brain',domainId:'brain-consciousness',order:5,label:'המוח',source:/פרק5_המוח_המפורט/i},
 {id:'brain-waves',domainId:'brain-consciousness',order:6,label:'גלי המוח',source:/פרק6_גלי_המוח/i},
 {id:'pineal-gland',domainId:'brain-consciousness',order:7,label:'בלוטת האצטרובל',source:/פרק7_בלוטת_האצטרובל/i},
 {id:'frequency-music-sound',domainId:'frequency-sound',order:8,label:'תדרים, מוזיקה וצליל',source:/פרק8_תדרים_מוזיקה_וצליל/i},
 {id:'body-as-frequency',domainId:'human-body',order:9,label:'הגוף כתדר',source:/פרק9_הגוף_כתדר/i},
 {id:'neuroplasticity',domainId:'brain-consciousness',order:10,label:'נוירופלסטיות',source:/פרק10_נוירופלסטיות/i},
 {id:'identity-beliefs',domainId:'identity-emotion',order:11,label:'זהויות ואמונות',source:/פרק11_זהויות_ואמונות/i},
 {id:'emotions-as-information',domainId:'identity-emotion',order:12,label:'רגשות כמידע',source:/פרק12_רגשות_כמידע/i},
 {id:'reality-creation',domainId:'human-world',order:13,label:'יצירת מציאות',source:/פרק13_יצירת_מציאות/i},
 {id:'universe-laws',domainId:'human-world',order:14,label:'12 חוקי היקום',source:/פרק14_12_חוקי_היקום/i},
 {id:'goals-vision',domainId:'meaning-integration',order:15,label:'יעדים וחזון',source:/פרק15_יעדים_וחזון/i},
 {id:'suffering-meaning',domainId:'meaning-integration',order:16,label:'סבל, קושי ומשמעות',source:/פרק16_סבל_קושי_ומשמעות/i},
 {id:'integration',domainId:'meaning-integration',order:17,label:'חיבור הכל',source:/פרק17_חיבור_הכל/i},
 {id:'who-am-i-answer',domainId:'meaning-integration',order:18,label:'מי אני? — תשובה',source:/פרק18_מי_אני_תשובה/i},
];

const ALIASES=[
 {id:'dmt',label:'DMT',match:/\bdmt\b/i},
 {id:'meditation',label:'מדיטציה',match:/מדיטצי/i},
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

export function canonicalSubtopic(label){
 const text=String(label||'').trim();
 const alias=ALIASES.find(item=>item.match.test(text));
 if(alias)return{id:alias.id,label:alias.label};
 const words=text.split(/\s+/).filter(Boolean);
 if(!text||text.length>72||words.length>8||GENERIC.test(text)||SENTENCE_START.test(text)||/^["'“”]/.test(text))return null;
 return{id:null,label:text};
}

export function normalizeTaxonomyLabel(value){return normalize(value)}
