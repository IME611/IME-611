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

// The 18 seed files are evidence/provenance. They do not define 18 chapters or 18 learner topics.
export const LIBRARY_TOPICS=[
 {id:'journey-origin',domainId:'journey-question',order:1,label:'למה יצאתי למסע?',source:/מי_אני_פרק1/i,always:true,match:/(למה.*(?:מסע|התחל|חקיר)|מי אני|נקודת המוצא|השאלה.*(?:מסע|חקיר)|המסע.*(?:שאלה|התחלה))/i},
 {id:'body-system',domainId:'human-body',order:2,label:'הגוף כמערכת',source:/פרק3_הפלא_ההנדסי/i,match:/(אני פנימה|הגוף כמערכת|חישה|בקרה ותקשורת|מבנה ותנועה|הגנה|ניקוי ותחזוקה|חיים וביולוגיה|חיים ואנרגיה|מתא אחד|הפלא ההנדסי|מחזור הפחמן)/i},
 {id:'external-environment',domainId:'human-world',order:3,label:'הסביבה כמערכת תומכת',source:/פרק2_הכלי_החיצוני/i,match:/(אני החוצה|הכלי החיצוני|הסביבה כמערכת|אוויר(?:\s|$)|אטמוספירה|גיאופיזיקה|קרקע וגיאולוגיה|מים(?:\s|$|—|בעולם)|מזון|מערכות הטבע|מחזורי זמן|מערכות נישתיות)/i},
 {id:'brain-operating-system',domainId:'brain-consciousness',order:4,label:'המוח ומערכת ההפעלה',source:/(פרק4_מערכת_ההפעלה|פרק5_המוח_המפורט)/i,match:/(מערכת ההפעלה|תת[-־]?מודע|העל[-־]?מודע|המודע|מיספר|נוירונ|סינפס|אמיגדל|היפוקמפ|היפותלמ|תלמוס|גזע המוח|אונ(?:ה|ות) המוח|האונה (?:המצחית|הרקתית|הקודקודית|העורפית)|חומר אפור|חומר לבן)/i},
 {id:'brain-states-learning',domainId:'brain-consciousness',order:5,label:'מצבי תודעה, גלי מוח ולמידה',source:/(פרק6_גלי_המוח|פרק10_נוירופלסטיות)/i,match:/(גלי? (?:המוח|alpha|beta|gamma|delta|theta)|\b(?:alpha|beta|gamma|delta|theta|epsilon)\b|נוירופלסט|brainwave|brain synchronization|binaural|isochronic|monaural|psychoacoust|חלימה צלולה|מדיטצי|שינה|זיכרון|למידה)/i},
 {id:'pineal-gland',domainId:'brain-consciousness',order:6,label:'בלוטת האצטרובל',source:/פרק7_בלוטת_האצטרובל/i,match:/(בלוטת האצטרובל|\bdmt\b|מלטונין|סרוטונין|עין השלישית|ajna|פיזואלקטר)/i},
 {id:'frequency-body',domainId:'frequency-sound',order:7,label:'תדרים, מוזיקה והגוף',source:/(פרק8_תדרים_מוזיקה_וצליל|פרק9_הגוף_כתדר)/i,match:/(תדר|תהוד|schumann|שומאן|שומהן|solfeggio|קימטיקה|פיתגורס|קערות קריסטל|גל סינוס|מוזיקה|צליל|הילה|צ['׳]?אקר|הרץ)/i},
 {id:'identity-beliefs',domainId:'identity-emotion',order:8,label:'זהות, אמונות ודפוסים',source:/פרק11_זהויות_ואמונות/i,match:/(זהות|זהויות|אמונ|דפוס|משמעת עצמית|אוטוסוגסט|self-suggestion|פיגמליון|גלתיאה|james clear|מערכות, לא כוח רצון|חיווט מחדש)/i},
 {id:'emotions-information',domainId:'identity-emotion',order:9,label:'רגשות כמידע',source:/פרק12_רגשות_כמידע/i,match:/(רגש|עצב|פחד|כעס|שמחה|סלוח|לסלוח|הצל של יונג|עבודה עם הצל|\beft\b)/i},
 {id:'human-reality',domainId:'human-world',order:10,label:'האדם מול המציאות והעולם',source:/(פרק13_יצירת_מציאות|פרק14_12_חוקי_היקום)/i,match:/(חוקי? היקום|קבועי הטבע|קוונט|quantum|שני הסדקים|קופנהגן|cern|bohm|penrose|hameroff|יצירת מציאות|מניפסט|nlp)/i},
 {id:'goals-change',domainId:'meaning-integration',order:11,label:'מטרות, חזון וכלי שינוי',source:/פרק15_יעדים_וחזון/i,match:/(יעד|חזון|היום המושלם|perfect day|hour of power|טקס הבוקר|הכרת תודה|מימוש)/i},
 {id:'meaning-integration',domainId:'meaning-integration',order:12,label:'משמעות, מסקנות ואינטגרציה',source:/(פרק16_סבל_קושי_ומשמעות|פרק17_חיבור_הכל|פרק18_מי_אני_תשובה)/i,match:/(סבל|קושי|משמעות|אינטגרצ|חיבור הכל|מי אני\?|התשובה המאחדת|בורא|אלוה|רוחני|נפש|רוח|קבלה|ספירות|לוגותרפ|post-traumatic growth|סינרג)/i},
];

// Only promoted concepts become learner-navigation subtopics. Raw section headings remain evidence inside the parent topic.
const SUBTOPICS=[
 {id:'body-overview',label:'הגוף כמערכת',match:/(אני פנימה|הגוף כמערכת|הפלא ההנדסי)/i},
 {id:'cells-to-human',label:'מתא אחד לאדם שלם',match:/מתא אחד/i},
 {id:'senses',label:'חישה',match:/^חישה$/i},
 {id:'control-communication',label:'בקרה ותקשורת',match:/בקרה ותקשורת/i},
 {id:'structure-movement',label:'מבנה ותנועה',match:/מבנה ותנועה/i},
 {id:'defense',label:'הגנה',match:/^הגנה$/i},
 {id:'maintenance',label:'ניקוי ותחזוקה',match:/ניקוי ותחזוקה/i},
 {id:'biology',label:'חיים וביולוגיה',match:/חיים וביולוגיה/i},
 {id:'environment-overview',label:'הסביבה כמערכת',match:/(אני החוצה|הכלי החיצוני|הסביבה כמערכת)/i},
 {id:'air-atmosphere',label:'אוויר ואטמוספירה',match:/(אוויר|אטמוספירה)/i},
 {id:'water-system',label:'מים',match:/מים/i},
 {id:'food-system',label:'מזון',match:/מזון/i},
 {id:'soil-geology',label:'קרקע וגיאולוגיה',match:/קרקע וגיאולוגיה/i},
 {id:'geophysics',label:'גיאופיזיקה',match:/גיאופיזיקה/i},
 {id:'nature-systems',label:'מערכות הטבע',match:/מערכות הטבע/i},
 {id:'time-cycles',label:'מחזורי זמן',match:/מחזורי זמן/i},
 {id:'operating-system',label:'מערכת ההפעלה',match:/מערכת ההפעלה/i},
 {id:'conscious-layers',label:'מודע, תת־מודע ועל־מודע',match:/(שכבה [123]|תת[-־]?מודע|העל[-־]?מודע|המודע)/i},
 {id:'neurons-synapses',label:'נוירונים וסינפסות',match:/(נוירונ|סינפס)/i},
 {id:'hemispheres',label:'המיספרות המוח',match:/מיספר/i},
 {id:'brain-lobes',label:'אונות המוח',match:/(4 אונות המוח|האונה (?:המצחית|הרקתית|הקודקודית|העורפית))/i},
 {id:'amygdala',label:'אמיגדלה',match:/אמיגדל/i},
 {id:'hippocampus',label:'היפוקמפוס',match:/היפוקמפ/i},
 {id:'hypothalamus',label:'היפותלמוס',match:/היפותלמ/i},
 {id:'thalamus',label:'תלמוס',match:/תלמוס/i},
 {id:'brainstem',label:'גזע המוח',match:/גזע המוח/i},
 {id:'gray-white-matter',label:'חומר אפור וחומר לבן',match:/חומר אפור|חומר לבן/i},
 {id:'brain-waves',label:'גלי המוח',match:/(גלי המוח|\b(?:alpha|beta|gamma|delta|theta|epsilon)\b)/i},
 {id:'neuroplasticity',label:'נוירופלסטיות',match:/נוירופלסט/i},
 {id:'brainwave-entrainment',label:'Brainwave Entrainment וטונים',match:/(brainwave|binaural|isochronic|monaural|psychoacoust|brain synchronization)/i},
 {id:'meditation',label:'מדיטציה',match:/מדיטצי/i},
 {id:'sleep-dreaming',label:'שינה וחלימה',match:/(שינה|חלימה צלולה)/i},
 {id:'learning-memory',label:'למידה וזיכרון',match:/(למידה|זיכרון|אינטגרציה של מידע)/i},
 {id:'pineal-overview',label:'בלוטת האצטרובל',match:/בלוטת האצטרובל/i},
 {id:'dmt',label:'DMT',match:/\bdmt\b/i},
 {id:'melatonin-serotonin',label:'מלטונין וסרוטונין',match:/(מלטונין|סרוטונין)/i},
 {id:'third-eye',label:'העין השלישית',match:/(עין השלישית|ajna)/i},
 {id:'piezoelectric-crystals',label:'קריסטלים פיזואלקטריים',match:/פיזואלקטר/i},
 {id:'resonance',label:'תהודה',match:/חוק התהודה/i},
 {id:'schumann',label:'תהודת שומאן',match:/(schumann|שומאן|שומהן)/i},
 {id:'solfeggio',label:'תדרי Solfeggio',match:/solfeggio/i},
 {id:'cymatics',label:'קימטיקה',match:/קימטיקה/i},
 {id:'music-pythagoras',label:'מוזיקה ופיתגורס',match:/פיתגורס/i},
 {id:'crystal-bowls',label:'קערות קריסטל',match:/קערות קריסטל/i},
 {id:'breathing',label:'נשימה',match:/נשימ/i},
 {id:'body-frequency',label:'הגוף כתדר',match:/הגוף כתדר/i},
 {id:'aura',label:'הילה',match:/(הילה|aura)/i},
 {id:'chakras',label:"צ'אקרות",match:/צ['׳]?אקר/i},
 {id:'identity',label:'זהות',match:/(כיצד בונים זהות|זהויות ואמונות|5 זהויות|זהות —)/i},
 {id:'beliefs',label:'אמונות',match:/אמונ/i},
 {id:'self-discipline',label:'משמעת ומערכות',match:/(משמעת עצמית|מערכות, לא כוח רצון|כלים מוכחים לבניית מערכות)/i},
 {id:'autosuggestion',label:'אוטוסוגסטיה',match:/אוטוסוגסט|self-suggestion/i},
 {id:'expectations',label:'ציפיות וזהות',match:/(פיגמליון|גלתיאה)/i},
 {id:'identity-change',label:'שינוי זהות והרגלים',match:/(james clear|שלוש שכבות של שינוי|חיווט מחדש)/i},
 {id:'emotion-chemistry',label:'הכימיה של רגשות',match:/הכימיה של רגשות/i},
 {id:'emotion-survival',label:'רגשות כמנגנון הישרדות',match:/(רגשות כמנגנון הישרדות|עצב —|פחד|כעס|שמחה)/i},
 {id:'jung-shadow',label:'הצל של יונג',match:/(הצל של יונג|עבודה עם הצל)/i},
 {id:'forgiveness',label:'סליחה ושחרור',match:/לסלוח|סליחה/i},
 {id:'eft',label:'EFT',match:/\beft\b/i},
 {id:'universal-laws',label:'חוקי היקום',match:/חוקי? היקום|החוקים — סקירה/i},
 {id:'quantum',label:'מכניקת הקוונטים',match:/(מכניקת הקוונטים|סופרפוזיציה|חלקיקים וירטואליים|cern)/i},
 {id:'double-slit',label:'ניסוי שני הסדקים',match:/שני הסדקים/i},
 {id:'manifestation',label:'יצירת מציאות ומניפסטציה',match:/(יצירת מציאות|manifestation|מניפסט)/i},
 {id:'nlp',label:'NLP',match:/\bnlp\b/i},
 {id:'quantum-interpretations',label:'מודלים ופרשנויות קוונטיות',match:/(קופנהגן|bohm|penrose|hameroff)/i},
 {id:'goals-vision',label:'יעדים וחזון',match:/(יעדים, חזון|יעדים לפי|חזון ומימוש)/i},
 {id:'perfect-day',label:'היום המושלם',match:/(היום המושלם|perfect day)/i},
 {id:'gratitude',label:'הכרת תודה',match:/הכרת תודה/i},
 {id:'morning-ritual',label:'טקסי בוקר',match:/(hour of power|טקס הבוקר)/i},
 {id:'suffering-meaning',label:'סבל, קושי ומשמעות',match:/סבל, קושי ומשמעות/i},
 {id:'perspectives-on-difficulty',label:'זוויות על קושי',match:/זווית (?:רוחנית|פסיכולוגית|ביולוגית|הפרשנות)/i},
 {id:'logotherapy',label:'לוגותרפיה',match:/לוגותרפ/i},
 {id:'creator-worldview',label:'הבורא ותפיסת העולם',match:/(בורא|אלוה)/i},
 {id:'body-mind-spirit',label:'גוף, נפש ורוח',match:/(חיבור הכל|גוף — החומרה|נפש —|רוח —|ברמה הפיזית|ברמה הנפשית|ברמה הרוחנית)/i},
 {id:'kabbalah',label:'קבלה וספירות',match:/(קבלה|ספירות|מלכות)/i},
 {id:'synthesis',label:'סינתזה ואינטגרציה',match:/(התשובה המאחדת|תשובה מסונתזת|סינרג|אינטגרצ)/i},
];

const GENERIC=/^(?:מבוא|הקדמה|סיכום|לסיכום|השאלה|רגע של עצירה|הנקודה המרכזית|הנקודה האמיתית|מילת סיום|המסקנה המעשית|החיבור הגדול|קישור הכל|המעבר לחלק הבא|מהפכת ההבנה|הזהירות הנדרשת|בפנים|בחוץ|עקרונות מרכזיים)$/i;
const INSTRUCTION_START=/^(?:אבל(?:\s|:|$)|מה לעשות(?:\s|—|:|$)|שמור על(?:\s|$)|חזור ו(?:\s|$)|קרא (?:אותו|את)(?:\s|$)|דרג (?:את|מחדש)(?:\s|$)|זהה (?:את|דפוס)(?:\s|$)|מצא את(?:\s|$)|בחר(?:\s|$)|כתוב(?:\s|$)|דמיין(?:\s|$)|תרגול יומיומי(?:\s|$)|ערב(?:\s|—|:|$)|בוקר(?:\s|—|:|$)|שלב\s+\d+(?:\s|—|:|$)|2026(?:\s|—|:|$))/i;

export function topicForSourceFile(sourceFile){return LIBRARY_TOPICS.find(topic=>topic.source.test(String(sourceFile||'')))||null}

export function topicForSectionNode(node){
 const label=String(node?.label||''),explicit=LIBRARY_TOPICS.find(topic=>topic.match?.test(label));
 if(explicit)return explicit;
 const counts=new Map();
 for(const file of(node?.sourceFiles||[])){const topic=topicForSourceFile(file);if(topic)counts.set(topic.id,(counts.get(topic.id)||0)+1)}
 const ranked=[...counts.entries()].sort((a,b)=>b[1]-a[1]);
 if(!ranked.length||(ranked.length>1&&ranked[0][1]===ranked[1][1]))return null;
 const winner=LIBRARY_TOPICS.find(topic=>topic.id===ranked[0][0])||null;
 return winner?.id==='journey-origin'?null:winner;
}

export function canonicalSubtopic(label){
 const text=String(label||'').trim(),words=text.split(/\s+/).filter(Boolean);
 if(!text||text.length>88||words.length>11||GENERIC.test(text)||INSTRUCTION_START.test(text)||/^["'“”]/.test(text))return null;
 const promoted=SUBTOPICS.find(item=>item.match.test(text));
 return promoted?{id:promoted.id,label:promoted.label}:null;
}

export function normalizeTaxonomyLabel(value){return normalize(value)}
