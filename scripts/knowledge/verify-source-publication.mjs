import assert from'node:assert/strict';
import fs from'node:fs';
import{buildPublicationCardDrafts,getPublishedLearningCards,JOURNEY_PUBLICATION_CHAPTERS,mergePublicationCardBatches,publicationPolicy,publicationWordCount}from'../../server/knowledge/application/publication/source-publication.service.js';

const words=(prefix,count)=>Array.from({length:count},(_,index)=>`${prefix}${index+1}`).join(' ');
const candidates=[
 {id:'11111111-1111-4111-8111-111111111111',type:'CONCEPT',section:'נוירופלסטיות',text:words('א',22)},
 {id:'22222222-2222-4222-8222-222222222222',type:'EXAMPLE',section:'נוירופלסטיות',text:words('ב',24)},
 {id:'33333333-3333-4333-8333-333333333333',type:'QUESTION',section:'תרגול',text:words('ג',180)},
];

const cards=buildPublicationCardDrafts(candidates);
assert.equal(cards.length,3,'short adjacent units should combine while a 180-word unit should split into two cards');
assert.equal(cards[0].wordCount,46);
assert.deepEqual(cards[0].sourceCandidateIds,[candidates[0].id,candidates[1].id],'combined cards must retain every source unit id');
assert.equal(cards[0].type,'EXAMPLE','a source example should remain visibly framed as an example');
assert.equal(cards[1].wordCount,90);
assert.equal(cards[2].wordCount,90);
assert(cards.every(card=>card.validWordCount),'generated preview cards must satisfy the 40-90 word contract when enough source text exists');
assert(cards.slice(1).every(card=>card.sourceCandidateIds[0]===candidates[2].id),'split cards must retain the original source unit id');
assert.equal(publicationWordCount('  מילה   ועוד\nמילה  '),3);
assert.equal(JOURNEY_PUBLICATION_CHAPTERS.length,18,'the current creator placement catalog must cover every live journey chapter');
assert.deepEqual(JOURNEY_PUBLICATION_CHAPTERS.map(item=>item.number),Array.from({length:18},(_,index)=>index+1));
const chapter2Card={...cards[0],chapterNumber:2},oldChapter4Card={...cards[1],chapterNumber:4},replacementChapter4Card={...cards[2],order:1,chapterNumber:4};
const multiChapter=mergePublicationCardBatches([chapter2Card,oldChapter4Card],[replacementChapter4Card],4);
assert.equal(multiChapter.length,2,'publishing one chapter must preserve cards from the same source in other chapters');
assert.equal(multiChapter.find(card=>card.chapterNumber===2)?.text,chapter2Card.text,'an existing placement in another chapter must remain unchanged');
assert.equal(multiChapter.find(card=>card.chapterNumber===4)?.text,replacementChapter4Card.text,'publishing to an existing chapter must replace only that chapter batch');
const policy=publicationPolicy();
assert.equal(policy.autoPublish,false);
assert.equal(policy.autoPlacement,false);
assert.equal(policy.multipleChapterPlacementsPerSource,true);
assert.equal(policy.canonicalSourceImmutable,true);
assert.equal(policy.rollbackToRepositoryOnly,true);
const librarySource=fs.readFileSync(new URL('../../server/knowledge/application/library/content-library.service.js',import.meta.url),'utf8');
const mapSource=fs.readFileSync(new URL('../../server/knowledge/application/map/emergent-corpus-map.service.js',import.meta.url),'utf8');
assert.match(librarySource,/intakeApprovedSource[\s\S]{0,180}learnerPublished/,'learner content queries must hide approved intake units until explicit publication');
assert.match(mapSource,/learnerVisibleOnly[\s\S]{0,500}learnerPublished/,'learner hierarchy must use the same publication visibility gate');

const publishedText=words('תוכן',44),publishedCandidate='44444444-4444-4444-8444-444444444444';
const fakeDb={query:async sql=>{
 if(String(sql).includes("to_regclass('public.source_publications')"))return{rows:[{publications:'source_publications',cards:'published_learning_cards'}]};
 if(String(sql).includes('FROM published_learning_cards c'))return{rows:[{id:'55555555-5555-4555-8555-555555555555',card_order:1,card_type:'CONCEPT',title:'כרטיס שפורסם',card_text:publishedText,source_candidate_ids:[publishedCandidate],source_label:'future-source.docx',source_id:'66666666-6666-4666-8666-666666666666',provenance:{sourcePreserved:true},published_at:'2026-08-24T00:00:00.000Z',publication_id:'77777777-7777-4777-8777-777777777777',publication_version:2,source_title:'מקור עתידי'}]};
 throw new Error(`unexpected fake publication query: ${String(sql).slice(0,80)}`);
}};
const published=await getPublishedLearningCards(fakeDb,{chapterNumber:4});
assert.equal(published.schemaReady,true);
assert.equal(published.cards.length,1);
assert.equal(published.cards[0].editorialStatus,'CREATOR_PUBLISHED');
assert.deepEqual(published.cards[0].sourceUnitIds,[`candidate:${publishedCandidate}`]);
assert.equal(published.cards[0].sourceLabel,'future-source.docx');
assert.equal(publicationWordCount(published.cards[0].text),44);

console.log('PASS source publication preview (40-90 words, scoped provenance, explicit placement, no auto-publish)');
