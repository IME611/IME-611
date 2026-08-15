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

// Learner-facing topics are semantic. Seed files remain evidence/provenance and may feed several topics.
export const LIBRARY_TOPICS=[
 {id:'journey-origin',domainId:'journey-question',order:1,label:'למה יצאתי למסע?',source:/מי_אני_פרק1/i,always:true,match:/(למה.*(?:מסע|התחל|חקיר)|מי אני|נקודת המוצא|השאלה.*(?:מסע|חקיר)|המסע.*(?:שאלה|התחלה))/i},
 {id:'body-system',domainId:'human-body',order:2,label:'הגוף כמערכת',source:/פרק3_הפלא_ההנדסי/i,match:/(אני פנימה|הגוף כמערכת|חישה|בקרה ותקשורת|מבנה ותנועה|הגנה|ניקוי ותחזוקה|חיים וביולוגיה|חיים ואנרגיה|מתא אחד|הפלא ההנדסי|מחזור הפחמן)/i},
 {id:'external-environment',domainId:'human-world',order:3,label:'הסביבה כמערכת תומכת',source:/פרק2_הכלי_החיצוני/i,match:/(אני החוצה|הכלי החיצוני|הסביבה כמערכת|אוויר(?:\s|$)|אטמוספירה|גיאופיזיקה|קרקע וגיאולוגיה|מים(?:\s|$|—|בעולם)|מזון|מערכות הטבע|מחזורי זמן|מערכות נישתיות)/i},
 {id:'brain-operating-system',domainId:'brain-consciousness',order:4,label:'המוח ומערכת ההפעלה',source:/(פרק4_מערכת_ההפעלה|פרק5_המוח_המפורט)/i,match:/(מערכת ההפעלה|תת[-־]?מודע|העל[-־]?מודע|המודע|מיספר|נוירונ|סינפס|אמיגדל|היפוקמפ|היפותלמ|תלמוס|גזע המוח|אונ(?:ה|ות) המוח|האונה (?:המצחית|הרקתית|הקודקודית|העורפית)|חומר אפור|חומר לבן)/i},
 {id:'brain-states-learning',domainId:'brain-consciousness',order:5,label:'מצבי תודעה, גלי מוח ולמידה',source:/(פרק6_גלי_המוח|פרק10_נוירופלסטיות)/i,match:/(גלי? (?:המוח|alpha|beta|gamma|delta|theta)|\b(?:alpha|beta|gamma|delta|theta|epsilon)\b|נוירופלסט|brainwave|brain synchronization|binaural|isochronic|monaural|psychoacoust|חלימה צלולה|מדיטצי|שינה|זיכרון|למידה)/i},
 {id:'pineal-gland',domainId:'brain-consciousness',order:6,label:'בלוטת האצטרובל',source:/פרק7_בלוטת_האצטרובל/i,match:/(בלוטת האצטרובל|\bdmt\b|מלטונין|סרוטונין|עין השלישית|ajna|פיזואלקטר)/i},
 {id:'frequency-body',domainId:'frequency-sound',order:7,label:'תדרים, מוזיקה והגוף',source:/(פרק8_תדרים_מוזיקה_וצליל|פרק9_הגוף_כתדר)/i,match:/(תדר|תהוד|schumann|שומאן|שומהן|solfeggio|קימטיקה|פיתגורס|קערות קריסטל|גל סינוס|מוזיקה|צליל|הילה|צ['׳]?אקר)/i},
 {id:'identity-beliefs',domainId:'identity-emotion',order:8,label:'זהות, אמונות ודפוסים',source:/פרק11_זהויות_ואמונות/i,match:/(זהות|זהויות|אמונ|דפוס|משמעת עצמית|אוטוסוגסט|self-suggestion|פיגמליון|גלתיאה|james clear|מערכות, לא כוח רצון|חיווט מחדש)/i},
 {id:'emotions-information',domainId:'identity-emotion',order:9,label:'רגשות כמידע',source:/פרק12_רגשות_כמידע/i,match:/(רגש|עצב|פחד|כעס|שמחה|סלוח|לסלוח|הצל של יונג|עבודה עם הצל|\beft\b)/i},
 {id:'human-reality',domainId:'human-world',order:10,label:'האדם מול המציאות והעולם',source:/(פרק13_יצירת_מציאות|פרק14_12_חוקי_היקום)/i,match:/(חוקי? היקום|קבועי הטבע|קוונט|quantum|שני הסדקים|קופנהגן|cern|bohm|penrose|hameroff|יצירת מציאות|מניפסט|nlp)/i},
 {id:'goals-change',domainId:'meaning-integration',order:11,label:'מטרות, חזון וכלי שינוי',source:/פרק15_יעדים_וחזון/i,match:/(יעד|חזון|היום המושלם|perfect day|hour of power|טקס הבוקר|הכרת תודה|מימוש)/i},
 {id:'meaning-integration',domainId:'meaning-integration',order:12,label:'משמעות, מסקנות ואינטגרציה',source:/(פרק16_סבל_קושי_ומשמעות|פרק17_חיבור_הכל|פרק18_מי_אני_תשובה)/i,match:/(סבל|קושי|משמעות|אינטגרצ|חיבור הכל|מי אני\?|התשובה המאחדת|בורא|אלוה|רוחני|נפש|רוח|קבלה|ספירות|לוגותרפ|post-traumatic growth|סינרג)/i},
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

const GENERIC=/^(?:מבוא|הקדמה|סיכום|לסיכום|השאלה|רגע של עצירה|הנקודה המרכזית|הנקודה האמיתית|מילת סיום|המסקנה המעשית|החיבור הגדול|קישור הכל|המעבר לחלק הבא|מהפכת ההבנה|הזהירות הנדרשת|בפנים|בחוץ|עקרונות מרכזיים)$/i;
const INSTRUCTION_START=/^(?:אבל(?:\s|:|$)|מה לעשות(?:\s|—|:|$)|שמור על(?:\s|$)|חזור ו(?:\s|$)|קרא (?:אותו|את)(?:\s|$)|דרג (?:את|מחדש)(?:\s|$)|זהה (?:את|דפוס)(?:\s|$)|מצא את(?:\s|$)|בחר(?:\s|$)|כתוב(?:\s|$)|דמיין(?:\s|$)|תרגול יומיומי(?:\s|$)|ערב(?:\s|—|:|$)|בוקר(?:\s|—|:|$)|שלב\s+\d+(?:\s|—|:|$)|2026(?:\s|—|:|$))/i;

export function topicForSourceFile(sourceFile){return LIBRARY_TOPICS.find(topic=>topic.source.test(String(sourceFile||'')))||null}

export function topicForSectionNode(node){
 const label=String(node?.label||'');
 const explicit=LIBRARY_TOPICS.find(topic=>topic.match?.test(label));
 if(explicit)return explicit;
 const files=node?.sourceFiles||[],counts=new Map();
 for(const file of files){const topic=topicForSourceFile(file);if(topic)counts.set(topic.id,(counts.get(topic.id)||0)+1)}
 const ranked=[...counts.entries()].sort((a,b)=>b[1]-a[1]);
 if(!ranked.length)return null;
 if(ranked.length>1&&ranked[0][1]===ranked[1][1])return null;
 const winner=LIBRARY_TOPICS.find(topic=>topic.id===ranked[0][0])||null;
 // The opening source contains several conceptual directions; unmatched headings from it are not forced into the intro.
 if(winner?.id==='journey-origin')return null;
 return winner;
}

export function canonicalSubtopic(label){
 const text=String(label||'').trim(),words=text.split(/\s+/).filter(Boolean);
 if(!text||text.length>72||words.length>8||GENERIC.test(text)||INSTRUCTION_START.test(text)||/^["'“”]/.test(text))return null;
 const alias=ALIASES.find(item=>item.match.test(text));
 if(alias)return{id:alias.id,label:alias.label};
 return{id:null,label:text};
}

export function normalizeTaxonomyLabel(value){return normalize(value)}
