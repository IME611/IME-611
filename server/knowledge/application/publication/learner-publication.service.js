import{getPublicationPlacementCatalog,getPublishedCardsForLearningUnit,normalizeLearningUnitKey}from'./flexible-publication.service.js';

function legacyChapterNumber(key){
 const match=/^legacy-chapter:(\d+)$/u.exec(String(key||''));
 if(!match)return null;
 const number=Number(match[1]);
 return Number.isInteger(number)&&number>0?number:null;
}

export async function listPublishedLearningUnits(db){
 const rows=(await db.query(`
  SELECT c.learning_unit_key AS key,
         COUNT(*)::int AS card_count,
         COUNT(DISTINCT c.source_id)::int AS source_count,
         MIN(c.title) AS fallback_title,
         MAX(c.published_at) AS published_at
  FROM published_learning_cards c
  JOIN source_publications p
    ON p.id=c.publication_id
   AND p.status='PUBLISHED'
   AND p.publication_version=c.publication_version
  WHERE c.status='PUBLISHED' AND c.learning_unit_key IS NOT NULL
  GROUP BY c.learning_unit_key
  ORDER BY MAX(c.published_at) DESC,c.learning_unit_key
 `)).rows;
 if(!rows.length)return{ok:true,units:[],policy:{learnerSafe:true,fixedChapterCount:false,legacyUnitsRemainAvailable:true}};
 let titles=new Map();
 try{
  const catalog=await getPublicationPlacementCatalog(db);
  titles=new Map((catalog.learningUnits||[]).map(unit=>[unit.key,unit.title]));
 }catch{}
 return{
  ok:true,
  units:rows.map(row=>({
   key:row.key,
   title:titles.get(row.key)||row.fallback_title||row.key,
   cardCount:Number(row.card_count||0),
   sourceCount:Number(row.source_count||0),
   publishedAt:row.published_at,
   legacyChapterNumber:legacyChapterNumber(row.key),
  })),
  policy:{learnerSafe:true,fixedChapterCount:false,legacyUnitsRemainAvailable:true,creatorPublishedOnly:true},
 };
}

export async function getLearnerPublishedCardsForLearningUnit(db,learningUnitKey){
 const key=normalizeLearningUnitKey(learningUnitKey),result=await getPublishedCardsForLearningUnit(db,key);
 return{
  ...result,
  cards:(result.cards||[]).map(card=>({
   ...card,
   sourceUnitIds:(card.sourceCandidateIds||[]).map(id=>`candidate:${id}`),
   provenanceLabel:`מקור מאושר · גרסה ${Number(card.publicationVersion||0)}`,
  })),
  policy:{learnerSafe:true,creatorPublishedOnly:true,canonicalSourceImmutable:true},
 };
}
