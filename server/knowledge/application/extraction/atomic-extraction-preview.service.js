import crypto from 'node:crypto';

const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
const normalize=value=>String(value||'').normalize('NFKC').replace(/\s+/g,' ').trim();
const MAX_SOURCE_CHARS=500_000;

const RULES={
 editorial:/^(?:הערה(?:\s+לעריכה)?|TODO|טודו|הנחיה(?:\s+לעריכה)?|לעריכה\s*:)/i,
 question:/\?\s*$/,
 practice:/(?:^|\s)(?:נסה|נסו|כתוב|כתבו|שאל|שאלו|בחר|בחרו|עשה|עשו|עצור|עצרו|תעצור|תעצרו|תתנתק|תתנתקו|תניח|תניחו|שים לב|שימו לב|תרגיל|תרגול|פרקטיקה)(?:\s|$)/,
 reference:/(?:מחקר(?:ים|י|ית)?|חוקר(?:ים|ות)?|אוניברסיט|פורסם|נבדק|מטא[- ]אנליזה|סקירה שיטתית|כתב עת|doi\b|et al\.?|\b(?:19|20)\d{2}\b)/i,
 worldview:/(?:הבורא|אלוהים|בריאה|נשמה|רוחניות|רוחני|צ['’]?י\b|חוקי? היקום|היקום (?:רוצה|מתכוון|מכוון)|השגחה|תכלית הבריאה)/i,
 creator:/(?:\bאני\b|\bשלי\b|\bמבחינתי\b|\bלדעתי\b|המסקנה שלי|הנקודה המרכזית|הנקודה האמיתית|אני חוזר|אני רוצה|אני מתחיל|הבנתי ש)/,
 example:/(?:למשל|לדוגמה|לדוגמא|כמו למשל|דוגמה|ניקח את|תחשבו על)/,
 model:/(?:מודל|מסגרת חשיבה|מערכת הפעלה|מטאפורה|משוואה|שרשרת|מעגל|לולאה|מנגנון|מפת |רשת של|שלבים)/,
 tension:/(?:סתירה|מתח בין|מצד אחד|מצד שני|אבל |למרות|עם זאת|לא ברור|שאלה פתוחה|אי[- ]ודאות|אולי |ייתכן|יכול להיות)/,
 causal:/(?:גורם ל|גורמת ל|משפיע על|משפיעה על|מוביל ל|מובילה ל|כתוצאה|ולכן|בגלל|אם .{0,90} אז|מווסת|מפעיל|מעכב|מחזק|מחליש)/,
 normative:/(?:צריך|צריכים|כדאי|חייב|חייבים|ראוי|מומלץ|אסור)/,
 hypothesis:/(?:אולי|ייתכן|יכול להיות|אפשר לשער|השערה|היפותזה)/,
 definitional:/(?:פירושו|פירושה|משמעותו|משמעותה|נקרא|נקראת|כלומר|מוגדר כ|הכוונה היא|הוא למעשה|היא למעשה)/,
 factualSignal:/(?:\b\d+(?:[.,]\d+)?\s*(?:%|מיליארד|מיליון|טריליון|ק"מ|ק״מ|מטר|מטרים|שעות|דקות|הרץ|Hz|מ"ר|מ״ר|מעלות)\b|DNA\b|RNA\b|נוירו|קורטיזול|אוקסיטוצין|סרוטונין|דופמין|מלטונין|היפותלמוס|אמיגדלה|היפוקמפוס|מערכת העצבים|מערכת החיסון|הורמון|קולטנים)/i,
};

function trimSpan(text,start,end){
 while(start<end&&/\s/.test(text[start]))start+=1;
 while(end>start&&/\s/.test(text[end-1]))end-=1;
 return{start,end,text:text.slice(start,end)};
}

function paragraphSpans(text){
 const out=[];let cursor=0;
 while(cursor<text.length){
  while(cursor<text.length&&text[cursor]==='\n')cursor+=1;
  if(cursor>=text.length)break;
  const next=text.indexOf('\n\n',cursor),end=next===-1?text.length:next;
  const span=trimSpan(text,cursor,end);if(span.text)out.push(span);
  cursor=next===-1?text.length:next+2;
 }
 return out;
}

function sentenceSpans(paragraph){
 const raw=paragraph.text;if(raw.length<=220)return[paragraph];
 try{
  const segmenter=new Intl.Segmenter('he',{granularity:'sentence'}),out=[];
  for(const part of segmenter.segment(raw)){
   const span=trimSpan(raw,part.index,part.index+part.segment.length);
   if(span.text)out.push({start:paragraph.start+span.start,end:paragraph.start+span.end,text:span.text});
  }
  return out.length?out:[paragraph];
 }catch{return[paragraph]}
}

function numberedConcept(text){const match=normalize(text).match(/^\d+[.)]\s+(.{2,100})$/);return match?match[1].trim():null}
function chapterHeading(text){return /^פרק\s+\d+\s*[:—–-]/.test(normalize(text))}
function structuralHeading(text){
 const value=normalize(text);if(!value||value.length>105)return false;
 if(chapterHeading(value))return true;
 if(/[?!。.!]\s*$/.test(value)||numberedConcept(value))return false;
 const words=value.split(' ').filter(Boolean);if(words.length>11||/[;]\s/.test(value))return false;
 if(/^(?:\d{4}\s*[—–-]|מבוא|הקדמה|סיכום|לסיכום|השאלה|רגע של עצירה|הנקודה המרכזית|הנקודה האמיתית|מערכות .+רשימה מלאה)$/.test(value))return true;
 return !/(?:\bהוא\b|\bהיא\b|\bהם\b|\bהן\b|\bיש\b|\bאין\b|\bאפשר\b|\bאנחנו\b|\bאתם\b|\bזה\b|\bזו\b|\bזאת\b|\bשלנו\b|\bשלכם\b)/.test(value);
}

function claimTypeFor(text){
 if(RULES.definitional.test(text))return'DEFINITIONAL';
 if(RULES.causal.test(text))return'CAUSAL';
 if(RULES.normative.test(text))return'NORMATIVE';
 if(RULES.hypothesis.test(text))return'HYPOTHESIS';
 if(RULES.creator.test(text))return'EXPERIENTIAL';
 if(RULES.factualSignal.test(text))return'FACTUAL';
 return'INTERPRETIVE';
}

function classifySentence(text){
 const value=normalize(text);
 if(RULES.editorial.test(value))return{type:'EDITORIAL_NOTE',confidence:.99,claimType:null,signals:['editorial'],excludeFromKnowledge:true};
 if(RULES.question.test(value))return{type:'QUESTION',confidence:.98,claimType:null,signals:['question-mark']};
 if(RULES.practice.test(value))return{type:'PRACTICE',confidence:.9,claimType:null,signals:['imperative']};
 if(RULES.reference.test(value))return{type:'REFERENCE',confidence:.78,claimType:null,signals:['research-reference']};
 if(RULES.worldview.test(value))return{type:'WORLDVIEW_CLAIM',confidence:.76,claimType:claimTypeFor(value),signals:['worldview-language']};
 if(RULES.creator.test(value))return{type:'CREATOR_INSIGHT',confidence:.86,claimType:'EXPERIENTIAL',signals:['creator-voice']};
 if(RULES.example.test(value))return{type:'EXAMPLE',confidence:.9,claimType:null,signals:['example-marker']};
 if(RULES.tension.test(value))return{type:'TENSION',confidence:.78,claimType:claimTypeFor(value),signals:['uncertainty-or-contrast']};
 if(RULES.definitional.test(value))return{type:'DEFINITION',confidence:.9,claimType:'DEFINITIONAL',signals:['explicit-definition']};
 if(RULES.model.test(value))return{type:'MODEL',confidence:.74,claimType:claimTypeFor(value),signals:['model-language']};
 const factual=RULES.factualSignal.test(value);
 return{type:'CLAIM',confidence:factual ? .76 : .64,claimType:claimTypeFor(value),signals:[factual?'factual-signal':'declarative-default']};
}

function evidenceForSpan(sourceText,fragments,start,end){
 return fragments.filter(fragment=>Number(fragment.end_offset)>start&&Number(fragment.start_offset)<end).map(fragment=>{
  const overlapStart=Math.max(start,Number(fragment.start_offset)),overlapEnd=Math.min(end,Number(fragment.end_offset)),quote=sourceText.slice(overlapStart,overlapEnd);
  const localStart=overlapStart-Number(fragment.start_offset),localEnd=overlapEnd-Number(fragment.start_offset),fragmentText=String(fragment.raw_text||'');
  return{fragmentId:fragment.id,fragmentOrdinal:Number(fragment.ordinal),sourceStart:overlapStart,sourceEnd:overlapEnd,fragmentStart:localStart,fragmentEnd:localEnd,quote,exactQuoteVerified:fragmentText.slice(localStart,localEnd)===quote};
 });
}

function candidateFrom({source,sourceText,fragments,type,claimType,text,exactQuote,start,end,confidence,signals,section,defines=null,excludeFromKnowledge=false}){
 const normalized=normalize(text);if(!normalized||normalized.length<2)return null;
 return{candidateKey:sha256([source.id,type,start,end,normalized.toLocaleLowerCase('he-IL')].join('|')),sourceId:source.id,sourceTitle:source.title,type,claimType,text:normalized,exactQuote,sourceStart:start,sourceEnd:end,confidence,reviewStatus:'PENDING',signals,section:section||null,defines,excludeFromKnowledge,evidence:evidenceForSpan(sourceText,fragments,start,end)};
}

export function extractAtomicCandidates(source,fragments){
 const sourceText=String(source.raw_content||'');if(sourceText.length>MAX_SOURCE_CHARS)throw new Error(`Source ${source.id} exceeds atomic preview size limit`);
 const paragraphs=paragraphSpans(sourceText),candidates=[];let section=null,pendingConcept=null;
 for(const paragraph of paragraphs){
  const value=normalize(paragraph.text);
  if(RULES.editorial.test(value)){
   const classified=classifySentence(value),candidate=candidateFrom({source,sourceText,fragments,...classified,text:value,exactQuote:paragraph.text,start:paragraph.start,end:paragraph.end,section});if(candidate)candidates.push(candidate);pendingConcept=null;continue;
  }
  const concept=numberedConcept(value);
  if(concept){
   const candidate=candidateFrom({source,sourceText,fragments,type:'CONCEPT',claimType:null,text:concept,exactQuote:paragraph.text,start:paragraph.start,end:paragraph.end,confidence:.98,signals:['numbered-concept'],section});if(candidate)candidates.push(candidate);pendingConcept=concept;continue;
  }
  if(structuralHeading(value)){section=value;pendingConcept=null;continue}
  if(pendingConcept){
   const units=sentenceSpans(paragraph),first=units[0];
   if(first){const candidate=candidateFrom({source,sourceText,fragments,type:'DEFINITION',claimType:'DEFINITIONAL',text:first.text,exactQuote:first.text,start:first.start,end:first.end,confidence:.92,signals:['follows-numbered-concept'],section,defines:pendingConcept});if(candidate)candidates.push(candidate)}
   for(const unit of units.slice(1)){const classified=classifySentence(unit.text),candidate=candidateFrom({source,sourceText,fragments,...classified,text:unit.text,exactQuote:unit.text,start:unit.start,end:unit.end,section});if(candidate)candidates.push(candidate)}
   pendingConcept=null;continue;
  }
  for(const unit of sentenceSpans(paragraph)){const classified=classifySentence(unit.text),candidate=candidateFrom({source,sourceText,fragments,...classified,text:unit.text,exactQuote:unit.text,start:unit.start,end:unit.end,section});if(candidate)candidates.push(candidate)}
 }
 return candidates;
}

function summarize(candidates){
 const byType={},byClaimType={};let evidenceFailures=0;
 for(const candidate of candidates){byType[candidate.type]=(byType[candidate.type]||0)+1;if(candidate.claimType)byClaimType[candidate.claimType]=(byClaimType[candidate.claimType]||0)+1;evidenceFailures+=candidate.evidence.filter(edge=>!edge.exactQuoteVerified).length}
 return{total:candidates.length,byType,byClaimType,evidenceFailures,excluded:candidates.filter(x=>x.excludeFromKnowledge).length};
}

async function loadSource(db,sourceId){
 const source=(await db.query(`SELECT id,title,raw_content,content_hash,metadata FROM sources WHERE id=$1`,[sourceId])).rows[0];if(!source)return null;
 const fragments=(await db.query(`SELECT id,ordinal,raw_text,start_offset,end_offset,content_hash,fragmenter_version FROM source_fragments WHERE source_id=$1 ORDER BY ordinal`,[sourceId])).rows;return{source,fragments};
}

export async function previewAtomicExtraction(db,sourceId,{offset=0,limit=100}={}){
 const loaded=await loadSource(db,sourceId);if(!loaded)return null;
 const all=extractAtomicCandidates(loaded.source,loaded.fragments),safeOffset=Math.max(0,Number(offset)||0),safeLimit=Math.min(250,Math.max(1,Number(limit)||100));
 return{ok:true,mode:'preview',extractor:{method:'deterministic-rules',version:'atomic-he-v0.2'},source:{id:loaded.source.id,title:loaded.source.title,contentHash:loaded.source.content_hash,metadata:loaded.source.metadata},summary:summarize(all),pagination:{offset:safeOffset,limit:safeLimit,total:all.length},candidates:all.slice(safeOffset,safeOffset+safeLimit),policy:{canonicalWrites:false,requiresReview:true,note:'High-precision preview candidates are not canonical knowledge and are never auto-promoted.'}};
}

export async function previewCorpusExtraction(db,{samplePerSource=3}={}){
 const sources=(await db.query(`SELECT id,title,raw_content,content_hash,metadata FROM sources WHERE metadata->>'ingestion'='repository-corpus-bootstrap-v1' ORDER BY (metadata->>'chapterNumber')::int NULLS LAST,created_at`)).rows;
 const summaries=[],aggregate={total:0,byType:{},byClaimType:{},evidenceFailures:0,excluded:0};
 for(const source of sources){
  const fragments=(await db.query(`SELECT id,ordinal,raw_text,start_offset,end_offset,content_hash,fragmenter_version FROM source_fragments WHERE source_id=$1 ORDER BY ordinal`,[source.id])).rows,candidates=extractAtomicCandidates(source,fragments),summary=summarize(candidates);
  aggregate.total+=summary.total;aggregate.evidenceFailures+=summary.evidenceFailures;aggregate.excluded+=summary.excluded;
  for(const[type,count]of Object.entries(summary.byType))aggregate.byType[type]=(aggregate.byType[type]||0)+count;
  for(const[type,count]of Object.entries(summary.byClaimType))aggregate.byClaimType[type]=(aggregate.byClaimType[type]||0)+count;
  summaries.push({sourceId:source.id,title:source.title,sourceFile:source.metadata?.sourceFile||null,summary,sample:candidates.filter(x=>!x.excludeFromKnowledge).slice(0,Math.max(0,Math.min(10,Number(samplePerSource)||0))).map(({evidence,...candidate})=>({...candidate,evidence:evidence.map(edge=>({fragmentId:edge.fragmentId,fragmentOrdinal:edge.fragmentOrdinal,exactQuoteVerified:edge.exactQuoteVerified}))}))});
 }
 return{ok:aggregate.evidenceFailures===0,mode:'corpus-preview',extractor:{method:'deterministic-rules',version:'atomic-he-v0.2'},sources:sources.length,aggregate,summaries,policy:{canonicalWrites:false,requiresReview:true}};
}
