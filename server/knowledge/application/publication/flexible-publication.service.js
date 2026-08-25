import{buildPublicationCardDrafts,publicationSchemaReady,publicationWordCount}from'./source-publication.service.js';
import{previewLearningDependencyGraph}from'../learning/learning-dependency.service.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UNIT_KEY=/^[\p{L}\p{N}][\p{L}\p{N}._:/-]{1,239}$/u;
const CARD_TYPES=new Set(['OPENER','CONCEPT','EXAMPLE','REFLECTION','SUMMARY']);
const compact=value=>String(value||'').replace(/\s+/gu,' ').trim();
const fail=(message,status=400,code='FLEXIBLE_PUBLICATION_INVALID')=>{throw Object.assign(new Error(message),{status,code})};

export function normalizeLearningUnitKey(value){
 const key=compact(value);
 if(!UNIT_KEY.test(key))fail('learningUnitKey must be a stable 2-240 character key without spaces',400,'LEARNING_UNIT_KEY_INVALID');
 return key;
}

function legacyChapterNumber(key){const match=/^legacy-chapter:(\d+)$/.exec(key);if(!match)return null;const value=Number(match[1]);return Number.isInteger(value)&&value>0?value:null}
export function normalizeLearningUnitTitle(value,key=''){
 const title=compact(value),legacy=legacyChapterNumber(String(key||''));
 if(!title&&legacy)return`פרק ${legacy}`;
 if(title.length<2||title.length>180)fail('learningUnitTitle must contain 2-180 characters',400,'LEARNING_UNIT_TITLE_INVALID');
 return title;
}
function normalizeIds(value){if(!Array.isArray(value)||!value.length)fail('select at least one source unit',400,'SOURCE_UNITS_REQUIRED');const ids=[...new Set(value.map(String))];if(ids.length>80||ids.some(id=>!UUID.test(id)))fail('candidate ids are invalid',400,'SOURCE_UNITS_INVALID');return ids}

async function publicationRow(db,id,{lock=false}={}){
 if(!UUID.test(String(id||'')))fail('valid publication id is required',400,'PUBLICATION_ID_REQUIRED');
 const row=(await db.query(`
  SELECT p.*,s.title AS source_title,COALESCE(s.metadata->>'originalFileName',s.metadata->>'sourceFile',s.title) AS source_file,
         i.title AS intake_title,i.file_name AS intake_file_name
  FROM source_publications p JOIN sources s ON s.id=p.source_id LEFT JOIN intake_submissions i ON i.id=p.intake_submission_id
  WHERE p.id=$1${lock?' FOR UPDATE OF p':''}
 `,[id])).rows[0];
 if(!row)fail('source publication not found',404,'PUBLICATION_NOT_FOUND');return row;
}

async function selectedCandidates(db,sourceId,candidateIds){
 const ids=normalizeIds(candidateIds),rows=(await db.query(`
  SELECT c.id,c.atom_type::text AS type,c.claim_type::text AS "claimType",c.candidate_text AS text,c.exact_quote AS quote,c.confidence,
         c.review_status::text AS "reviewStatus",c.metadata->>'section' AS section,c.source_start AS "sourceStart",c.source_end AS "sourceEnd"
  FROM extraction_candidates c WHERE c.source_id=$1 AND c.id=ANY($2::uuid[]) AND NOT c.exclude_from_knowledge AND c.review_status<>'REJECTED'
  ORDER BY c.source_start,c.created_at,c.id
 `,[sourceId,ids])).rows;
 if(rows.length!==ids.length)fail('one or more selected units are unavailable or belong to another source',409,'SOURCE_UNIT_SCOPE_MISMATCH');
 return rows.map(row=>({...row,confidence:Number(row.confidence)}));
}

function normalizeCards(cards,selectedIds,unitKey,unitTitle){
 if(!Array.isArray(cards)||!cards.length||cards.length>40)fail('one to forty cards are required',400,'CARDS_REQUIRED');
 const selected=new Set(selectedIds),referenced=new Set();
 const normalized=cards.map((card,index)=>{
  const title=compact(card?.title),text=compact(card?.text),type=String(card?.type||'CONCEPT').toUpperCase(),sourceCandidateIds=[...new Set((card?.sourceCandidateIds||[]).map(String))],wordCount=publicationWordCount(text);
  if(!CARD_TYPES.has(type))fail(`card ${index+1} has an invalid type`,400,'CARD_TYPE_INVALID');
  if(title.length<2||title.length>180)fail(`card ${index+1} title must contain 2-180 characters`,400,'CARD_TITLE_INVALID');
  if(wordCount<40||wordCount>90)fail(`card ${index+1} must contain 40-90 words; received ${wordCount}`,400,'CARD_WORD_COUNT_INVALID');
  if(!sourceCandidateIds.length||sourceCandidateIds.some(id=>!selected.has(id)))fail(`card ${index+1} provenance is outside the selected source units`,400,'CARD_PROVENANCE_INVALID');
  sourceCandidateIds.forEach(id=>referenced.add(id));
  return{order:index+1,type,title,text,sourceCandidateIds,wordCount,learningUnitKey:unitKey,learningUnitTitle:unitTitle,editorialStatus:'CREATOR_APPROVED_DERIVATIVE'};
 });
 if(selectedIds.some(id=>!referenced.has(id)))fail('every selected source unit must be referenced by at least one card',400,'UNREFERENCED_SOURCE_UNITS');
 return normalized;
}

export async function getPublicationPlacementCatalog(db){
 const graph=await previewLearningDependencyGraph(db,{unitLimit:500,spiralLimit:500,dependencyLimit:1000});
 return{ok:true,version:'publication-placement-v1',learningUnits:(graph.learningUnits||[]).map(unit=>({key:unit.id,title:unit.title,anchorNodeId:unit.anchorNodeId,complexity:unit.complexity,orderStatus:unit.orderStatus})),policy:{fixedChapterCount:false,sourceOrderUsed:false,dynamicLearningUnitKeys:true,legacyChapterAliasesSupported:true}};
}

export async function previewFlexiblePublication(db,{publicationId,learningUnitKey,learningUnitTitle,candidateIds}={}){
 if(!await publicationSchemaReady(db))fail('publication schema is not ready',503,'PUBLICATION_SCHEMA_NOT_READY');
 const row=await publicationRow(db,publicationId),key=normalizeLearningUnitKey(learningUnitKey),unitTitle=normalizeLearningUnitTitle(learningUnitTitle,key),candidates=await selectedCandidates(db,row.source_id,candidateIds),cards=buildPublicationCardDrafts(candidates).map(card=>({...card,learningUnitKey:key,learningUnitTitle:unitTitle}));
 return{ok:true,publicationId:row.id,sourceId:row.source_id,learningUnitKey:key,learningUnitTitle:unitTitle,candidates,cards,checks:{cards:cards.length,allCardsWithinWordLimit:cards.every(card=>card.validWordCount)},policy:{fixedChapterCount:false,previewRequired:true,creatorDecisionRequired:true,canonicalSourceImmutable:true,autoPublish:false}};
}

export async function saveFlexiblePublicationDraft(db,{publicationId,learningUnitKey,learningUnitTitle,candidateIds,cards=[],note='',reviewer}={}){
 if(!reviewer)fail('reviewer is required',400,'REVIEWER_REQUIRED');
 const row=await publicationRow(db,publicationId),key=normalizeLearningUnitKey(learningUnitKey),unitTitle=normalizeLearningUnitTitle(learningUnitTitle,key),candidates=await selectedCandidates(db,row.source_id,candidateIds),ids=candidates.map(item=>item.id),draft=(cards.length?normalizeCards(cards,ids,key,unitTitle):buildPublicationCardDrafts(candidates).map(card=>({...card,learningUnitKey:key,learningUnitTitle:unitTitle}))),legacy=legacyChapterNumber(key);
 const updated=(await db.query(`UPDATE source_publications SET status='DRAFT',target_learning_unit_key=$2,target_learning_unit_title=$3,target_chapter=$4,selected_candidate_ids=$5::uuid[],draft_cards=$6::jsonb,review_note=$7,reviewed_at=NOW(),reviewed_by=$8,updated_at=NOW() WHERE id=$1 RETURNING id,status,target_learning_unit_key,target_learning_unit_title,target_chapter,selected_candidate_ids,draft_cards,publication_version`,[publicationId,key,unitTitle,legacy,ids,JSON.stringify(draft),String(note||'').slice(0,10000),reviewer])).rows[0];
 return{ok:true,publication:updated,cards:draft,policy:{fixedChapterCount:false,autoPublish:false}};
}

export async function publishFlexiblePublication(db,{publicationId,learningUnitKey,learningUnitTitle,candidateIds,cards,note='',reviewer}={}){
 if(!reviewer)fail('reviewer is required',400,'REVIEWER_REQUIRED');
 if(!await publicationSchemaReady(db))fail('publication schema is not ready',503,'PUBLICATION_SCHEMA_NOT_READY');
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  const row=await publicationRow(client,publicationId,{lock:true}),key=normalizeLearningUnitKey(learningUnitKey),unitTitle=normalizeLearningUnitTitle(learningUnitTitle,key),candidates=await selectedCandidates(client,row.source_id,candidateIds),ids=candidates.map(item=>item.id),batch=normalizeCards(cards,ids,key,unitTitle),version=Number(row.publication_version||0)+1,legacy=legacyChapterNumber(key),sourceLabel=row.intake_file_name||row.source_file||row.source_title||'';
  const carried=(row.status==='PUBLISHED'?(await client.query(`SELECT learning_unit_key,learning_unit_title,chapter_number,card_order,card_type,title,card_text,source_candidate_ids FROM published_learning_cards WHERE publication_id=$1 AND publication_version=$2 AND status='PUBLISHED' AND learning_unit_key<>$3 ORDER BY learning_unit_key,card_order`,[publicationId,row.publication_version,key])).rows:[]).map(item=>({learningUnitKey:item.learning_unit_key,learningUnitTitle:item.learning_unit_title||item.learning_unit_key,chapterNumber:item.chapter_number===null?null:Number(item.chapter_number),order:Number(item.card_order),type:item.card_type,title:item.title,text:item.card_text,sourceCandidateIds:item.source_candidate_ids||[],editorialStatus:'CREATOR_APPROVED_DERIVATIVE'}));
  const all=[...carried,...batch.map(card=>({...card,chapterNumber:legacy}))],allIds=[...new Set(all.flatMap(card=>card.sourceCandidateIds))];
  await client.query(`UPDATE published_learning_cards SET status='RETRACTED',retracted_at=NOW(),retracted_by=$2 WHERE publication_id=$1 AND status='PUBLISHED'`,[publicationId,reviewer]);
  for(const card of all)await client.query(`INSERT INTO published_learning_cards(publication_id,publication_version,source_id,learning_unit_key,learning_unit_title,chapter_number,card_order,card_type,title,card_text,source_candidate_ids,source_label,provenance,published_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::uuid[],$12,$13::jsonb,$14)`,[publicationId,version,row.source_id,card.learningUnitKey,card.learningUnitTitle||unitTitle,card.chapterNumber??legacy,card.order,card.type,card.title,card.text,card.sourceCandidateIds,sourceLabel,JSON.stringify({sourceCandidateIds:card.sourceCandidateIds,editorialStatus:card.editorialStatus,sourcePreserved:true,creatorApproved:true,learningUnitKey:card.learningUnitKey,learningUnitTitle:card.learningUnitTitle||unitTitle}),reviewer]);
  await client.query(`UPDATE extraction_candidates SET metadata=(COALESCE(metadata,'{}'::jsonb)-'learnerLearningUnitKeys'-'learnerChapterNumbers'-'sourcePublicationId')||'{"learnerPublished":false}'::jsonb,updated_at=NOW() WHERE source_id=$1 AND COALESCE((metadata->>'intakeApprovedSource')::boolean,FALSE)=TRUE`,[row.source_id]);
  for(const candidateId of allIds){
   const unitKeys=[...new Set(all.filter(card=>card.sourceCandidateIds.includes(candidateId)).map(card=>card.learningUnitKey))],chapterNumbers=[...new Set(all.filter(card=>card.sourceCandidateIds.includes(candidateId)&&card.chapterNumber!==null).map(card=>Number(card.chapterNumber)))].sort((a,b)=>a-b);
   await client.query(`UPDATE extraction_candidates SET review_status='APPROVED',reviewed_at=COALESCE(reviewed_at,NOW()),reviewed_by=COALESCE(reviewed_by,$2),metadata=COALESCE(metadata,'{}'::jsonb)||$3::jsonb,updated_at=NOW() WHERE source_id=$1 AND id=$4 AND review_status<>'REJECTED'`,[row.source_id,reviewer,JSON.stringify({learnerPublished:true,learnerLearningUnitKeys:unitKeys,learnerChapterNumbers:chapterNumbers,sourcePublicationId:publicationId}),candidateId]);
  }
  const updated=(await client.query(`UPDATE source_publications SET status='PUBLISHED',target_learning_unit_key=$2,target_learning_unit_title=$3,target_chapter=$4,selected_candidate_ids=$5::uuid[],draft_cards=$6::jsonb,review_note=$7,publication_version=$8,reviewed_at=NOW(),reviewed_by=$9,published_at=NOW(),published_by=$9,updated_at=NOW() WHERE id=$1 RETURNING id,status,target_learning_unit_key,target_learning_unit_title,target_chapter,publication_version,published_at,published_by`,[publicationId,key,unitTitle,legacy,allIds,JSON.stringify(all),String(note||'').slice(0,10000),version,reviewer])).rows[0];
  await client.query('COMMIT');
  return{ok:true,publication:updated,publishedLearningUnitKey:key,publishedLearningUnitTitle:unitTitle,publishedCardCount:all.length,canonicalSourceChanged:false,policy:{fixedChapterCount:false,creatorDecisionRequired:true,autoPublish:false}};
 }catch(error){try{await client.query('ROLLBACK')}catch{};throw error}finally{client.release()}
}

export async function getPublishedCardsForLearningUnit(db,learningUnitKey){
 const key=normalizeLearningUnitKey(learningUnitKey);
 const rows=(await db.query(`SELECT c.id,c.card_order,c.card_type,c.title,c.card_text,c.source_candidate_ids,c.source_label,c.source_id,c.learning_unit_title,c.provenance,c.published_at,p.id AS publication_id,p.publication_version,s.title AS source_title FROM published_learning_cards c JOIN source_publications p ON p.id=c.publication_id AND p.status='PUBLISHED' AND p.publication_version=c.publication_version JOIN sources s ON s.id=c.source_id WHERE c.learning_unit_key=$1 AND c.status='PUBLISHED' ORDER BY c.published_at,c.publication_id,c.card_order`,[key])).rows;
 return{ok:true,learningUnitKey:key,learningUnitTitle:rows[0]?.learning_unit_title||null,cards:rows.map((row,index)=>({id:`published-${row.id}`,order:index+1,type:row.card_type,title:row.title,text:row.card_text,sourceCandidateIds:row.source_candidate_ids||[],sourceId:row.source_id,sourceLabel:row.source_label||row.source_title,learningUnitTitle:row.learning_unit_title||null,publicationId:row.publication_id,publicationVersion:Number(row.publication_version),editorialStatus:'CREATOR_PUBLISHED',publishedAt:row.published_at,provenance:row.provenance}))};
}
