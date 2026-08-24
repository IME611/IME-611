const HEBREW_DIACRITICS=/[\u0591-\u05C7]/g;

function normalizeSignalText(value){
 return String(value||'')
  .normalize('NFKC')
  .replace(HEBREW_DIACRITICS,'')
  .toLocaleLowerCase('he-IL')
  .replace(/[‐‑‒–—―]/g,'-')
  .replace(/[^\p{L}\p{N}]+/gu,' ')
  .replace(/\s+/g,' ')
  .trim();
}

function direct(...aliases){return aliases.map(alias=>normalizeSignalText(alias)).filter(Boolean)}
function contextual(pattern,strength=.84){return{pattern,strength}}

// This registry contains equivalence-level terminology only. Broader thematic
// relationships belong in the Corpus Map and must not be treated as synonyms.
const CONCEPT_SIGNAL_RULES=[
 {id:'neuroplasticity',label:'נוירופלסטיות',aliases:direct('נוירופלסטיות','פלסטיות מוחית','פלסטיות עצבית','גמישות מוחית','גמישות עצבית','neuroplasticity','brain plasticity','neural plasticity'),patterns:[
  contextual(/(?:המוח|מערכת העצבים).{0,55}(?:משתנ|חיווט מחדש|קשרים עצביים חדשים|מסלולים עצביים חדשים)/u,.88),
  contextual(/(?:brain|neural system).{0,55}(?:rewir|new neural connections|new neural pathways|change throughout life)/u,.88),
 ]},
 {id:'circadian-rhythm',label:'המקצב הצירקדי',aliases:direct('שעון צירקדי','שעון ביולוגי','מקצב צירקדי','קצב צירקדי','מקצב יממתי','קצב יממתי','circadian rhythm','circadian clock','biological clock')},
 {id:'habit-formation',label:'יצירת הרגלים ואוטומציה',aliases:direct('יצירת הרגלים','בניית הרגלים','שינוי הרגלים','habit formation','habit building'),patterns:[
  contextual(/(?:התנהגות|דפוס|פעולה).{0,55}(?:חוזר|חזרה|שוב ושוב).{0,55}אוטומט/u,.87),
  contextual(/(?:חוזר|חזרה|שוב ושוב).{0,55}(?:התנהגות|דפוס|פעולה).{0,55}אוטומט/u,.87),
  contextual(/(?:repeated behavior|repeated action|repetition).{0,55}(?:automatic|habit)/u,.87),
 ]},
 {id:'nervous-system',label:'מערכת העצבים',aliases:direct('מערכת העצבים','מערכת עצבית','nervous system')},
 {id:'neurons',label:'נוירונים',aliases:direct('נוירון','נוירונים','תאי עצב','תא עצב','neuron','neurons','nerve cells')},
 {id:'synapses',label:'סינפסות',aliases:direct('סינפסה','סינפסות','קשרים סינפטיים','synapse','synapses','synaptic connections')},
 {id:'brain-waves',label:'גלי מוח',aliases:direct('גלי מוח','גלי המוח','brain waves','brainwaves','eeg waves','eeg patterns')},
 {id:'brainwave-entrainment',label:'סנכרון גלי מוח',aliases:direct('סנכרון גלי מוח','brainwave entrainment','brain wave entrainment')},
 {id:'binaural-beats',label:'פעימות בינאורליות',aliases:direct('פעימות בינאורליות','צלילים בינאורליים','binaural beats','binaural tones')},
 {id:'amygdala',label:'אמיגדלה',aliases:direct('אמיגדלה','amygdala')},
 {id:'hippocampus',label:'היפוקמפוס',aliases:direct('היפוקמפוס','hippocampus')},
 {id:'hypothalamus',label:'היפותלמוס',aliases:direct('היפותלמוס','hypothalamus')},
 {id:'thalamus',label:'תלמוס',aliases:direct('תלמוס','thalamus')},
 {id:'brainstem',label:'גזע המוח',aliases:direct('גזע המוח','brainstem','brain stem')},
 {id:'pineal-gland',label:'בלוטת האצטרובל',aliases:direct('בלוטת האצטרובל','בלוטת האפיפיזה','אפיפיזה','pineal gland','epiphysis cerebri')},
 {id:'melatonin',label:'מלטונין',aliases:direct('מלטונין','melatonin')},
 {id:'serotonin',label:'סרוטונין',aliases:direct('סרוטונין','serotonin')},
 {id:'dopamine',label:'דופמין',aliases:direct('דופמין','dopamine')},
 {id:'dmt',label:'DMT',aliases:direct('dmt','דימתילטריפטמין','dimethyltryptamine')},
 {id:'meditation',label:'מדיטציה',aliases:direct('מדיטציה','meditation')},
 {id:'resonance',label:'תהודה',aliases:direct('תהודה','רזוננס','resonance')},
 {id:'schumann-resonance',label:'תהודת שומאן',aliases:direct('תהודת שומאן','תהודת שומהן','schumann resonance')},
 {id:'solfeggio',label:'תדרי סולפג׳יו',aliases:direct('תדרי סולפגיו','תדרי סולפג׳יו','solfeggio frequencies','solfeggio')},
 {id:'cymatics',label:'קימטיקה',aliases:direct('קימטיקה','cymatics')},
 {id:'aura',label:'הילה',aliases:direct('הילה אנרגטית','שדה הילה','aura','human aura')},
 {id:'chakras',label:'צ׳אקרות',aliases:direct('צאקרות','צ׳אקרות','צ’אקרות','chakras','chakra system')},
 {id:'autosuggestion',label:'אוטוסוגסטיה',aliases:direct('אוטוסוגסטיה','השאה עצמית','autosuggestion','self suggestion')},
 {id:'jung-shadow',label:'הצל של יונג',aliases:direct('הצל של יונג','עבודת צל','עבודה עם הצל','jungian shadow','shadow work')},
 {id:'eft',label:'EFT',aliases:direct('eft','emotional freedom technique','טכניקת השחרור הרגשי')},
 {id:'double-slit',label:'ניסוי שני הסדקים',aliases:direct('ניסוי שני הסדקים','ניסוי החריץ הכפול','double slit experiment','two slit experiment')},
 {id:'manifestation',label:'מניפסטציה',aliases:direct('מניפסטציה','יצירת מציאות','manifestation')},
 {id:'logotherapy',label:'לוגותרפיה',aliases:direct('לוגותרפיה','logotherapy')},
];
const SIGNAL_CACHE_LIMIT=6000;
const signalCache=new Map();

const HEBREW_PREFIXES=new Set(['ה','ו','ב','כ','ל','מ','ש']);
function tokenMatchesAlias(token,alias){
 if(token===alias)return true;
 let candidate=token;
 for(let index=0;index<2&&candidate.length>alias.length;index+=1){
  if(!HEBREW_PREFIXES.has(candidate[0]))break;
  candidate=candidate.slice(1);if(candidate===alias)return true;
 }
 return false;
}
function containsPhrase(text,phrase){
 const textTokens=text.split(' '),phraseTokens=phrase.split(' ');
 for(let start=0;start<=textTokens.length-phraseTokens.length;start+=1){
  if(phraseTokens.every((alias,index)=>tokenMatchesAlias(textTokens[start+index],alias)))return true;
 }
 return false;
}

export function extractConceptSignals(value){
 const text=normalizeSignalText(value);if(!text)return[];
 const cached=signalCache.get(text);if(cached)return cached;
 const signals=[];
 for(const rule of CONCEPT_SIGNAL_RULES){
  const evidence=[];let strength=0,kind=null;
  for(const alias of rule.aliases||[]){
   if(!containsPhrase(text,alias))continue;
   evidence.push(alias);strength=Math.max(strength,.96);kind='DIRECT_ALIAS';
  }
  for(const item of rule.patterns||[]){
   const match=text.match(item.pattern);if(!match)continue;
   evidence.push(match[0]);strength=Math.max(strength,item.strength);if(kind!=='DIRECT_ALIAS')kind='CONTEXT_PATTERN';
  }
  if(strength)signals.push({id:rule.id,label:rule.label,strength,kind,evidence:[...new Set(evidence)].slice(0,3)});
 }
 if(signalCache.size>=SIGNAL_CACHE_LIMIT)signalCache.delete(signalCache.keys().next().value);
 signalCache.set(text,signals);return signals;
}

export function conceptSignalRegistry(){return CONCEPT_SIGNAL_RULES.map(rule=>({id:rule.id,label:rule.label,aliases:[...(rule.aliases||[])]}))}
