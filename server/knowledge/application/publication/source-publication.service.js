const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CARD_TYPES=new Set(['OPENER','CONCEPT','EXAMPLE','REFLECTION','SUMMARY']);
const MIN_CARD_WORDS=40;
const MAX_CARD_WORDS=90;

export const JOURNEY_PUBLICATION_CHAPTERS=[
 {number:1,title:'התבוננות — שאלת המסע'},
 {number:2,title:'הסביבה — המערכת שמחוץ לנו'},
 {number:3,title:'הגוף כמערכת מורכבת'},
 {number:4,title:'המוח — מבנה, תקשורת ובקרה'},
 {number:5,title:'מערכת ההפעלה — מודע, אוטומטי ודפוסים'},
 {number:6,title:'מצבי מוח — קשב, שינה ולמידה'},
 {number:7,title:'אור, שינה ובלוטת האצטרובל'},
 {number:8,title:'צליל — מפיזיקה לחוויה'},
 {number:9,title:'מפות אנרגטיות — מסורת, מטפורה ומדידה'},
 {number:10,title:'נוירופלסטיות — היכולת להשתנות'},
 {number:11,title:'זהות, אמונות ותפיסה'},
 {number:12,title:'רגשות כאותות וכמערכות פעולה'},
 {number:13,title:'אדם, סביבה וקשרים'},
 {number:14,title:'עקרונות, מסורות וראיות'},
 {number:15,title:'חזון, כיוון ויעדים'},
 {number:16,title:'יישום, ניסוי ומשוב'},
 {number:17,title:'משמעות, קושי וחוסן'},
 {number:18,title:'מי אני — תשובה זמנית ומשולבת'},
];

const compact=value=>String(value||'').replace(/\s+/gu,' ').trim();
export const publicationWordCount=value=>compact(value).split(/\s+/u).filter(Boolean).length;

function httpError(message,status=400,code='PUBLICATION_INVALID'){
 return Object.assign(new Error(message),{status,code});
}

async function tableReady(db,name){
 return Boolean((await db.query('SELECT to_regclass($1) AS table_name',[`public.${name}`])).rows[0]?.table_name);
}

export async function publicationSchemaReady(db){
 const rows=(await db.query(`SELECT to_regclass('public.source_publications') AS publications,to_regclass('public.published_learning_cards') AS cards`)).rows[0];
 return Boolean(rows?.publications&&rows?.cards);
}

export async function ensureSourcePublicationDraft(db,{sourceId,intakeSubmissionId=null}={}){
 if(!UUID.test(String(sourceId||'')))throw httpError('valid source id is required',400,'SOURCE_ID_REQUIRED');
 if(!await publicationSchemaReady(db))return{schemaReady:false,created:false,publication:null};
 const row=(await db.query(`
  INSERT INTO source_publications(source_id,intake_submission_id,status)
  VALUES($1,$2,'REPOSITORY_ONLY')
  ON CONFLICT(source_id) DO UPDATE SET
    intake_submission_id=COALESCE(source_publications.intake_submission_id,EXCLUDED.intake_submission_id),
    updated_at=NOW()
  RETURNING id,source_id,intake_submission_id,status,target_chapter,publication_version,created_at,updated_at
 `,[sourceId,intakeSubmissionId])).rows[0];
 return{schemaReady:true,created:true,publication:publicationView(row)};
}

function publicationView(row){
 return{
  id:row.id,
  sourceId:row.source_id,
  intakeSubmissionId:row.intake_submission_id||null,
  status:row.status,
  targetChapter:row.target_chapter===null?null:Number(row.target_chapter),
  selectedCandidateIds:row.selected_candidate_ids||[],
  draftCards:Array.isArray(row.draft_cards)?row.draft_cards:[],
  reviewNote:row.review_note||'',
  publicationVersion:Number(row.publication_version||0),
  reviewedAt:row.reviewed_at||null,
  reviewedBy:row.reviewed_by||null,
  publishedAt:row.published_at||null,
  publishedBy:row.published_by||null,
  createdAt:row.created_at,
  updatedAt:row.updated_at,
 };
}

function candidateView(row){
 return{
  id:row.id,
  type:row.atom_type,
  claimType:row.claim_type||null,
  text:compact(row.candidate_text),
  quote:row.exact_quote,
  confidence:Number(row.confidence),
  reviewStatus:row.review_status,
  section:row.section||null,
  sourceStart:Number(row.source_start),
  sourceEnd:Number(row.source_end),
 };
}

async function publicationRecord(db,id,{lock=false}={}){
 if(!UUID.test(String(id||'')))throw httpError('valid publication id is required',400,'PUBLICATION_ID_REQUIRED');
 const row=(await db.query(`
  SELECT p.*,s.title AS source_title,COALESCE(s.metadata->>'originalFileName',s.metadata->>'sourceFile',s.title) AS source_file,
         i.title AS intake_title,i.file_name AS intake_file_name
  FROM source_publications p
  JOIN sources s ON s.id=p.source_id
  LEFT JOIN intake_submissions i ON i.id=p.intake_submission_id
  WHERE p.id=$1${lock?' FOR UPDATE OF p':''}
 `,[id])).rows[0];
 if(!row)throw httpError('source publication not found',404,'PUBLICATION_NOT_FOUND');
 return row;
}

async function sourceCandidates(db,sourceId,{candidateIds=null}={}){
 const params=[sourceId],filters=[`c.source_id=$1`,`NOT c.exclude_from_knowledge`,`c.review_status<>'REJECTED'`];
 if(candidateIds){params.push(candidateIds);filters.push(`c.id=ANY($${params.length}::uuid[])`)}
 return(await db.query(`
  SELECT c.id,c.atom_type::text,c.claim_type::text,c.candidate_text,c.exact_quote,c.confidence,c.review_status::text,
         c.source_start,c.source_end,c.metadata->>'section' AS section
  FROM extraction_candidates c
  WHERE ${filters.join(' AND ')}
  ORDER BY c.source_start,c.created_at,c.id
 `,params)).rows.map(candidateView);
}

function splitWords(text,maxWords=MAX_CARD_WORDS){
 const words=compact(text).split(/\s+/u).filter(Boolean),parts=[];
 for(let index=0;index<words.length;index+=maxWords)parts.push(words.slice(index,index+maxWords).join(' '));
 return parts;
}

function splitCandidate(candidate){
 const text=compact(candidate.text);
 if(publicationWordCount(text)<=MAX_CARD_WORDS)return[{text,candidateIds:[candidate.id],section:candidate.section,type:candidate.type}];
 const sentences=text.split(/(?<=[.!?؟])\s+/u).map(compact).filter(Boolean),parts=[];
 let current='';
 for(const sentence of sentences.length?sentences:[text]){
  if(publicationWordCount(sentence)>MAX_CARD_WORDS){
   if(current){parts.push(current);current=''}
   parts.push(...splitWords(sentence));
   continue;
  }
  const next=compact(`${current} ${sentence}`);
  if(current&&publicationWordCount(next)>MAX_CARD_WORDS){parts.push(current);current=sentence}else current=next;
 }
 if(current)parts.push(current);
 return parts.map(part=>({text:part,candidateIds:[candidate.id],section:candidate.section,type:candidate.type}));
}

function mergePieces(candidates){
 const pieces=candidates.flatMap(splitCandidate),groups=[];
 for(const piece of pieces){
  const last=groups.at(-1),joined=last?compact(`${last.text} ${piece.text}`):piece.text;
  if(last&&publicationWordCount(last.text)<MIN_CARD_WORDS&&publicationWordCount(joined)<=MAX_CARD_WORDS){
   last.text=joined;
   last.candidateIds=[...new Set([...last.candidateIds,...piece.candidateIds])];
   last.sections=[...new Set([...last.sections,...(piece.section?[piece.section]:[])])];
   last.types=[...new Set([...last.types,piece.type])];
  }else groups.push({text:piece.text,candidateIds:[...piece.candidateIds],sections:piece.section?[piece.section]:[],types:[piece.type]});
 }
 if(groups.length>1&&publicationWordCount(groups.at(-1).text)<MIN_CARD_WORDS){
  const tail=groups.at(-1),previous=groups.at(-2),joined=compact(`${previous.text} ${tail.text}`);
  if(publicationWordCount(joined)<=MAX_CARD_WORDS){
   previous.text=joined;
   previous.candidateIds=[...new Set([...previous.candidateIds,...tail.candidateIds])];
   previous.sections=[...new Set([...previous.sections,...tail.sections])];
   previous.types=[...new Set([...previous.types,...tail.types])];
   groups.pop();
  }
 }
 return groups;
}

function titleForGroup(group,index){
 const section=compact(group.sections[0]);
 if(section&&section.length>=2&&section.length<=90)return section;
 const words=compact(group.text).split(/\s+/u).slice(0,8).join(' ');
 return `${words}${publicationWordCount(group.text)>8?'…':''}`||`כרטיס ${index+1}`;
}

function cardTypeForGroup(group){
 if(group.types.includes('EXAMPLE'))return'EXAMPLE';
 if(group.types.some(type=>type==='QUESTION'||type==='PRACTICE'))return'REFLECTION';
 return'CONCEPT';
}

export function buildPublicationCardDrafts(candidates=[]){
 return mergePieces(candidates).map((group,index)=>({
  clientId:`draft-${index+1}`,
  order:index+1,
  type:cardTypeForGroup(group),
  title:titleForGroup(group,index),
  text:group.text,
  sourceCandidateIds:group.candidateIds,
  wordCount:publicationWordCount(group.text),
  validWordCount:publicationWordCount(group.text)>=MIN_CARD_WORDS&&publicationWordCount(group.text)<=MAX_CARD_WORDS,
  editorialStatus:'SOURCE_DERIVED_DRAFT',
 }));
}

export function mergePublicationCardBatches(existingCards=[],nextCards=[],targetChapter){
 const chapter=validateChapter(targetChapter);
 return[
  ...existingCards.filter(card=>Number(card.chapterNumber)!==chapter),
  ...nextCards.map(card=>({...card,chapterNumber:chapter})),
 ];
}

function validateChapter(value){
 const chapter=Number(value);
 if(!Number.isInteger(chapter)||chapter<1||chapter>18)throw httpError('target chapter must be an integer from 1 to 18',400,'TARGET_CHAPTER_INVALID');
 return chapter;
}

function normalizeCandidateIds(value){
 if(!Array.isArray(value)||!value.length)throw httpError('select at least one source unit',400,'SOURCE_UNITS_REQUIRED');
 const ids=[...new Set(value.map(String))];
 if(ids.length>80||ids.some(id=>!UUID.test(id)))throw httpError('candidate ids are invalid',400,'SOURCE_UNITS_INVALID');
 return ids;
}

async function validatedCandidates(db,sourceId,candidateIds){
 const ids=normalizeCandidateIds(candidateIds),candidates=await sourceCandidates(db,sourceId,{candidateIds:ids});
 if(candidates.length!==ids.length)throw httpError('one or more selected units are unavailable or do not belong to this source',409,'SOURCE_UNIT_SCOPE_MISMATCH');
 return candidates;
}

function normalizeCards(cards,selectedIds){
 if(!Array.isArray(cards)||!cards.length||cards.length>40)throw httpError('one to forty previewed cards are required',400,'CARDS_REQUIRED');
 const selected=new Set(selectedIds),referenced=new Set();
 const normalized=cards.map((card,index)=>{
  const title=compact(card?.title),text=compact(card?.text),type=String(card?.type||'CONCEPT').toUpperCase(),sourceCandidateIds=[...new Set((card?.sourceCandidateIds||[]).map(String))],words=publicationWordCount(text);
  if(!CARD_TYPES.has(type))throw httpError(`card ${index+1} has an invalid type`,400,'CARD_TYPE_INVALID');
  if(title.length<2||title.length>180)throw httpError(`card ${index+1} title must contain 2-180 characters`,400,'CARD_TITLE_INVALID');
  if(words<MIN_CARD_WORDS||words>MAX_CARD_WORDS)throw httpError(`card ${index+1} must contain ${MIN_CARD_WORDS}-${MAX_CARD_WORDS} words; received ${words}`,400,'CARD_WORD_COUNT_INVALID');
  if(!sourceCandidateIds.length||sourceCandidateIds.some(id=>!selected.has(id)))throw httpError(`card ${index+1} has invalid source-unit provenance`,400,'CARD_PROVENANCE_INVALID');
  sourceCandidateIds.forEach(id=>referenced.add(id));
  return{order:index+1,type,title,text,sourceCandidateIds,wordCount:words,editorialStatus:'CREATOR_APPROVED_DERIVATIVE'};
 });
 const missing=selectedIds.filter(id=>!referenced.has(id));
 if(missing.length)throw httpError('every selected source unit must be referenced by at least one card',400,'UNREFERENCED_SOURCE_UNITS');
 return normalized;
}

function publicationSummary(row){
 const chapters=Array.isArray(row.published_chapters)?row.published_chapters.map(Number).filter(Number.isInteger):[...new Set((row.draft_cards||[]).map(card=>Number(card.chapterNumber)).filter(Number.isInteger))];
 return{
  ...publicationView(row),
  title:row.intake_title||row.source_title||'מקור ללא כותרת',
  fileName:row.intake_file_name||row.source_file||null,
  sourceTitle:row.source_title,
  candidateCount:Number(row.candidate_count||0),
  selectedCount:Number(row.selected_count||0),
  publishedCardCount:Number(row.published_card_count||0),
  publishedChapters:chapters.sort((a,b)=>a-b),
 };
}

export async function listSourcePublications(db,{limit=50,id=null}={}){
 if(!await publicationSchemaReady(db))return{schemaReady:false,items:[],chapters:JOURNEY_PUBLICATION_CHAPTERS};
 if(id){
  const row=await publicationRecord(db,id),candidates=await sourceCandidates(db,row.source_id);
  return{schemaReady:true,item:{...publicationSummary({...row,candidate_count:candidates.length,selected_count:(row.selected_candidate_ids||[]).length}),candidates},chapters:JOURNEY_PUBLICATION_CHAPTERS,policy:publicationPolicy()};
 }
 const safeLimit=Math.max(1,Math.min(200,Number(limit)||50));
 const rows=(await db.query(`
  SELECT p.*,s.title AS source_title,COALESCE(s.metadata->>'originalFileName',s.metadata->>'sourceFile',s.title) AS source_file,
         i.title AS intake_title,i.file_name AS intake_file_name,
         (SELECT COUNT(*) FROM extraction_candidates c WHERE c.source_id=p.source_id AND NOT c.exclude_from_knowledge AND c.review_status<>'REJECTED')::int AS candidate_count,
         cardinality(p.selected_candidate_ids)::int AS selected_count,
         (SELECT COUNT(*) FROM published_learning_cards pc WHERE pc.publication_id=p.id AND pc.status='PUBLISHED')::int AS published_card_count,
         ARRAY(SELECT DISTINCT pc.chapter_number FROM published_learning_cards pc WHERE pc.publication_id=p.id AND pc.status='PUBLISHED' ORDER BY pc.chapter_number) AS published_chapters
  FROM source_publications p
  JOIN sources s ON s.id=p.source_id
  LEFT JOIN intake_submissions i ON i.id=p.intake_submission_id
  ORDER BY CASE p.status WHEN 'REPOSITORY_ONLY' THEN 0 WHEN 'DRAFT' THEN 1 ELSE 2 END,p.updated_at DESC
  LIMIT $1
 `,[safeLimit])).rows;
 return{schemaReady:true,items:rows.map(publicationSummary),chapters:JOURNEY_PUBLICATION_CHAPTERS,policy:publicationPolicy()};
}

export async function previewSourcePublication(db,id,{chapterNumber,candidateIds}={}){
 if(!await publicationSchemaReady(db))throw httpError('publication schema is not ready',503,'PUBLICATION_SCHEMA_NOT_READY');
 const publication=await publicationRecord(db,id),chapter=validateChapter(chapterNumber),candidates=await validatedCandidates(db,publication.source_id,candidateIds),cards=buildPublicationCardDrafts(candidates).map(card=>({...card,chapterNumber:chapter}));
 return{publication:publicationSummary(publication),targetChapter:chapter,candidates,cards,checks:{cards:cards.length,allCardsWithinWordLimit:cards.every(card=>card.validWordCount),minWords:MIN_CARD_WORDS,maxWords:MAX_CARD_WORDS},policy:publicationPolicy()};
}

export async function saveSourcePublicationDraft(db,id,{chapterNumber,candidateIds,cards=[],note='',reviewer}={}){
 if(!reviewer)throw httpError('reviewer is required',400,'REVIEWER_REQUIRED');
 if(!await publicationSchemaReady(db))throw httpError('publication schema is not ready',503,'PUBLICATION_SCHEMA_NOT_READY');
 const publication=await publicationRecord(db,id);if(publication.status==='PUBLISHED')throw httpError('published source placements must be published directly or retracted before saving a replacement draft',409,'PUBLISHED_DRAFT_UNSUPPORTED');
 const chapter=validateChapter(chapterNumber),candidates=await validatedCandidates(db,publication.source_id,candidateIds),selectedIds=candidates.map(item=>item.id),draftCards=(cards.length?cards:buildPublicationCardDrafts(candidates)).map(card=>({...card,chapterNumber:chapter}));
 const row=(await db.query(`
  UPDATE source_publications SET status='DRAFT',target_chapter=$2,selected_candidate_ids=$3::uuid[],draft_cards=$4::jsonb,
    review_note=$5,reviewed_at=NOW(),reviewed_by=$6,updated_at=NOW()
  WHERE id=$1 RETURNING *
 `,[id,chapter,selectedIds,JSON.stringify(draftCards),String(note||'').slice(0,10_000),reviewer])).rows[0];
 return{publication:publicationView(row),cards:draftCards,policy:publicationPolicy()};
}

export async function publishSourcePublication(db,id,{chapterNumber,candidateIds,cards,note='',reviewer}={}){
 if(!reviewer)throw httpError('reviewer is required',400,'REVIEWER_REQUIRED');
 if(!await publicationSchemaReady(db))throw httpError('publication schema is not ready',503,'PUBLICATION_SCHEMA_NOT_READY');
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  const publication=await publicationRecord(client,id,{lock:true}),chapter=validateChapter(chapterNumber),candidates=await validatedCandidates(client,publication.source_id,candidateIds),batchCandidateIds=candidates.map(item=>item.id),normalizedBatch=normalizeCards(cards,batchCandidateIds).map(card=>({...card,chapterNumber:chapter})),version=Number(publication.publication_version||0)+1,sourceLabel=publication.intake_file_name||publication.source_file||publication.source_title||'';
  const carriedRows=publication.status==='PUBLISHED'?(await client.query(`
   SELECT chapter_number,card_order,card_type,title,card_text,source_candidate_ids
   FROM published_learning_cards
   WHERE publication_id=$1 AND publication_version=$2 AND status='PUBLISHED' AND chapter_number<>$3
   ORDER BY chapter_number,card_order
  `,[id,publication.publication_version,chapter])).rows:[];
  const carriedCards=carriedRows.map(row=>({chapterNumber:Number(row.chapter_number),order:Number(row.card_order),type:row.card_type,title:row.title,text:row.card_text,sourceCandidateIds:row.source_candidate_ids||[],wordCount:publicationWordCount(row.card_text),editorialStatus:'CREATOR_APPROVED_DERIVATIVE'}));
  const allCards=mergePublicationCardBatches(carriedCards,normalizedBatch,chapter),selectedIds=[...new Set(allCards.flatMap(card=>card.sourceCandidateIds))];
  await client.query(`UPDATE published_learning_cards SET status='RETRACTED',retracted_at=NOW(),retracted_by=$2 WHERE publication_id=$1 AND status='PUBLISHED'`,[id,reviewer]);
  for(const card of allCards){
   await client.query(`
    INSERT INTO published_learning_cards(publication_id,publication_version,source_id,chapter_number,card_order,card_type,title,card_text,source_candidate_ids,source_label,provenance,published_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::uuid[],$10,$11::jsonb,$12)
   `,[id,version,publication.source_id,card.chapterNumber,card.order,card.type,card.title,card.text,card.sourceCandidateIds,sourceLabel,JSON.stringify({sourceCandidateIds:card.sourceCandidateIds,editorialStatus:card.editorialStatus,sourcePreserved:true,creatorApproved:true}),reviewer]);
  }
  await client.query(`UPDATE extraction_candidates SET metadata=(COALESCE(metadata,'{}'::jsonb)-'learnerChapterNumber'-'learnerChapterNumbers'-'sourcePublicationId')||'{"learnerPublished":false}'::jsonb,updated_at=NOW() WHERE source_id=$1 AND COALESCE((metadata->>'intakeApprovedSource')::boolean,FALSE)=TRUE`,[publication.source_id]);
  for(const candidateId of selectedIds){
   const learnerChapterNumbers=[...new Set(allCards.filter(card=>card.sourceCandidateIds.includes(candidateId)).map(card=>card.chapterNumber))].sort((a,b)=>a-b);
   await client.query(`
    UPDATE extraction_candidates SET review_status='APPROVED',reviewed_at=COALESCE(reviewed_at,NOW()),reviewed_by=COALESCE(reviewed_by,$2),
      metadata=COALESCE(metadata,'{}'::jsonb)||$3::jsonb,updated_at=NOW()
    WHERE source_id=$1 AND id=$4 AND review_status<>'REJECTED'
   `,[publication.source_id,reviewer,JSON.stringify({learnerPublished:true,learnerChapterNumbers,sourcePublicationId:id}),candidateId]);
  }
  const row=(await client.query(`
   UPDATE source_publications SET status='PUBLISHED',target_chapter=$2,selected_candidate_ids=$3::uuid[],draft_cards=$4::jsonb,
     review_note=$5,publication_version=$6,reviewed_at=NOW(),reviewed_by=$7,published_at=NOW(),published_by=$7,updated_at=NOW()
   WHERE id=$1 RETURNING *
  `,[id,chapter,selectedIds,JSON.stringify(allCards),String(note||'').slice(0,10_000),version,reviewer])).rows[0];
  await client.query('COMMIT');
  return{publication:publicationView(row),cards:normalizedBatch,publishedChapters:[...new Set(allCards.map(card=>card.chapterNumber))].sort((a,b)=>a-b),publishedCardCount:allCards.length,canonicalSourceChanged:false,publishedLearnerCards:true,policy:publicationPolicy()};
 }catch(error){try{await client.query('ROLLBACK')}catch{};throw error}finally{client.release()}
}

export async function retractSourcePublication(db,id,{reviewer,note=''}={}){
 if(!reviewer)throw httpError('reviewer is required',400,'REVIEWER_REQUIRED');
 if(!await publicationSchemaReady(db))throw httpError('publication schema is not ready',503,'PUBLICATION_SCHEMA_NOT_READY');
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  const publication=await publicationRecord(client,id,{lock:true});
  await client.query(`UPDATE published_learning_cards SET status='RETRACTED',retracted_at=NOW(),retracted_by=$2 WHERE publication_id=$1 AND status='PUBLISHED'`,[id,reviewer]);
  await client.query(`UPDATE extraction_candidates SET metadata=(COALESCE(metadata,'{}'::jsonb)-'learnerChapterNumber'-'learnerChapterNumbers'-'sourcePublicationId')||'{"learnerPublished":false}'::jsonb,updated_at=NOW() WHERE source_id=$1 AND COALESCE((metadata->>'intakeApprovedSource')::boolean,FALSE)=TRUE`,[publication.source_id]);
  const row=(await client.query(`
   UPDATE source_publications SET status='REPOSITORY_ONLY',target_chapter=NULL,selected_candidate_ids='{}'::uuid[],draft_cards='[]'::jsonb,review_note=$2,reviewed_at=NOW(),reviewed_by=$3,
     published_at=NULL,published_by=NULL,updated_at=NOW()
   WHERE id=$1 RETURNING *
  `,[id,String(note||'').slice(0,10_000),reviewer])).rows[0];
  await client.query('COMMIT');
  return{publication:publicationView(row),canonicalSourceChanged:false,publishedLearnerCards:false,policy:publicationPolicy()};
 }catch(error){try{await client.query('ROLLBACK')}catch{};throw error}finally{client.release()}
}

export async function getPublishedLearningCards(db,{chapterNumber}={}){
 const chapter=validateChapter(chapterNumber);
 if(!await publicationSchemaReady(db))return{ok:true,schemaReady:false,chapterNumber:chapter,cards:[]};
 const rows=(await db.query(`
  SELECT c.id,c.card_order,c.card_type,c.title,c.card_text,c.source_candidate_ids,c.source_label,c.source_id,c.provenance,c.published_at,
         p.id AS publication_id,p.publication_version,s.title AS source_title
  FROM published_learning_cards c
  JOIN source_publications p ON p.id=c.publication_id AND p.status='PUBLISHED' AND p.publication_version=c.publication_version
  JOIN sources s ON s.id=c.source_id
  WHERE c.chapter_number=$1 AND c.status='PUBLISHED'
  ORDER BY c.published_at,c.publication_id,c.card_order
 `,[chapter])).rows;
 return{ok:true,schemaReady:true,chapterNumber:chapter,cards:rows.map((row,index)=>({id:`published-${row.id}`,order:index+1,type:row.card_type,title:row.title,text:row.card_text,sourceUnitIds:(row.source_candidate_ids||[]).map(id=>`candidate:${id}`),sourceCandidateIds:row.source_candidate_ids||[],sourceId:row.source_id,sourceLabel:row.source_label||row.source_title,provenanceLabel:`מקור מאושר · גרסה ${row.publication_version}`,publicationId:row.publication_id,publicationVersion:Number(row.publication_version),editorialStatus:'CREATOR_PUBLISHED',publishedAt:row.published_at}))};
}

export async function getSourcePublicationHealth(db){
 const schemaReady=await publicationSchemaReady(db);
 if(!schemaReady)return{ok:false,schemaReady:false,version:'source-publication-v0.1',summary:null,policy:publicationPolicy()};
 const summary=(await db.query(`
  SELECT
   (SELECT COUNT(*)::int FROM source_publications) AS sources,
   (SELECT COUNT(*)::int FROM source_publications WHERE status='REPOSITORY_ONLY') AS repository_only,
   (SELECT COUNT(*)::int FROM source_publications WHERE status='DRAFT') AS drafts,
   (SELECT COUNT(*)::int FROM source_publications WHERE status='PUBLISHED') AS published_sources,
   (SELECT COUNT(*)::int FROM published_learning_cards WHERE status='PUBLISHED') AS published_cards,
   (SELECT COUNT(*)::int FROM source_publications p WHERE p.status='PUBLISHED' AND NOT EXISTS(SELECT 1 FROM published_learning_cards c WHERE c.publication_id=p.id AND c.publication_version=p.publication_version AND c.status='PUBLISHED')) AS published_sources_without_cards,
   (SELECT COUNT(*)::int FROM published_learning_cards c JOIN source_publications p ON p.id=c.publication_id WHERE c.status='PUBLISHED' AND NOT c.source_candidate_ids <@ p.selected_candidate_ids) AS cards_outside_selection,
   (SELECT COUNT(*)::int FROM published_learning_cards c JOIN extraction_candidates x ON x.id=ANY(c.source_candidate_ids) WHERE c.status='PUBLISHED' AND x.source_id<>c.source_id) AS source_mismatches,
   (SELECT COUNT(*)::int FROM published_learning_cards c WHERE c.status='PUBLISHED' AND cardinality(regexp_split_to_array(trim(c.card_text),'\\s+')) NOT BETWEEN 40 AND 90) AS word_count_failures,
   (SELECT COUNT(*)::int FROM source_publications p JOIN extraction_candidates c ON c.id=ANY(p.selected_candidate_ids) WHERE p.status='PUBLISHED' AND COALESCE((c.metadata->>'learnerPublished')::boolean,FALSE)=FALSE) AS published_candidate_visibility_failures,
   (SELECT COUNT(*)::int FROM source_publications p JOIN extraction_candidates c ON c.source_id=p.source_id WHERE p.status<>'PUBLISHED' AND COALESCE((c.metadata->>'learnerPublished')::boolean,FALSE)=TRUE) AS repository_candidate_visibility_leaks
 `)).rows[0];
 const failures=['published_sources_without_cards','cards_outside_selection','source_mismatches','word_count_failures','published_candidate_visibility_failures','repository_candidate_visibility_leaks'].reduce((sum,key)=>sum+Number(summary[key]||0),0);
 return{ok:failures===0,schemaReady:true,version:'source-publication-v0.1',summary,policy:publicationPolicy()};
}

export function publicationPolicy(){
 return{
  sourceApprovalSeparateFromLearnerPublication:true,
  creatorDecisionRequired:true,
  sourceScopedCandidateSelection:true,
  targetChapterRequired:true,
  multipleChapterPlacementsPerSource:true,
  previewRequired:true,
  cardWordRange:[MIN_CARD_WORDS,MAX_CARD_WORDS],
  canonicalSourceImmutable:true,
  autoPublish:false,
  autoPlacement:false,
  rollbackToRepositoryOnly:true,
 };
}
