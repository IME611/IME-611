import assert from'node:assert/strict';
import fs from'node:fs';
import{normalizeLearningUnitKey}from'../../server/knowledge/application/publication/flexible-publication.service.js';
import{semanticCapability}from'../../server/knowledge/application/matching/semantic-matcher.js';
import{multimodalCapability}from'../../server/knowledge/application/intake/ai-gateway-multimodal.service.js';

assert.equal(normalizeLearningUnitKey('learning-unit:19'),'learning-unit:19');
assert.equal(normalizeLearningUnitKey('topic:brain/plasticity-v2'),'topic:brain/plasticity-v2');
assert.throws(()=>normalizeLearningUnitKey('learning unit with spaces'),/learningUnitKey/);

const semantic=semanticCapability(),multimodal=multimodalCapability();
assert.equal(semantic.authority,'REVIEW_SUGGESTION_ONLY');
assert.equal(semantic.fallback,'deterministic-concept-aware');
assert.equal(multimodal.authority,'SOURCE_DESCRIPTION_DRAFT_ONLY');
assert.equal(multimodal.fallback,'creator-supplied-description');

const root=new URL('../../',import.meta.url);
const api=fs.readFileSync(new URL('api/reviews.js',root),'utf8');
const learnerApi=fs.readFileSync(new URL('api/learning-publications.js',root),'utf8');
const migration=fs.readFileSync(new URL('database/migrations/010_backend_completion.sql',root),'utf8');
const flexible=fs.readFileSync(new URL('server/knowledge/application/publication/flexible-publication.service.js',root),'utf8');
const learnerPublication=fs.readFileSync(new URL('server/knowledge/application/publication/learner-publication.service.js',root),'utf8');
const semanticService=fs.readFileSync(new URL('server/knowledge/application/matching/semantic-matcher.js',root),'utf8');
const imageService=fs.readFileSync(new URL('server/knowledge/application/intake/ai-gateway-multimodal.service.js',root),'utf8');
const relationService=fs.readFileSync(new URL('server/knowledge/application/relations/relation-resolution-v2.service.js',root),'utf8');
const journey=fs.readFileSync(new URL('src/features/journey/SpiralLibrary.tsx',root),'utf8');
const publishedUnitsHook=fs.readFileSync(new URL('src/features/journey/model/usePublishedLearningUnits.ts',root),'utf8');

assert.match(api,/intake-input-v2\.service\.js/,'intake API must route through native-image capable resolver');
assert.match(api,/intake-analysis-v2\.service\.js/,'intake API must route through semantic-enhanced analysis');
assert.match(api,/mode==='relation-resolution'/,'creator relation-resolution endpoint must be connected');
assert.match(api,/mode==='publication-placement'/,'dynamic publication placement endpoint must be connected');
assert.match(api,/mode==='backend-health'/,'backend completion health endpoint must be connected');
assert.match(migration,/target_learning_unit_key/,'source publications must have dynamic learning-unit placement');
assert.match(migration,/learning_unit_key/,'published cards must have dynamic learning-unit placement');
assert.match(migration,/ALTER COLUMN chapter_number DROP NOT NULL/,'legacy numeric chapter placement must be optional');
assert.doesNotMatch(flexible,/chapter<1\|\|chapter>18|BETWEEN 1 AND 18|from 1 to 18/,'dynamic publication service must not impose a fixed 18-unit ceiling');
assert.match(flexible,/fixedChapterCount:false/,'dynamic publication policy must explicitly reject a fixed chapter count');
assert.match(semanticService,/REVIEW_SUGGESTION_ONLY/,'semantic matcher must remain review assistance only');
assert.match(imageService,/SOURCE_DESCRIPTION_DRAFT_ONLY/,'native vision output must remain a source-description draft');
assert.match(relationService,/autoResolve:false/,'semantic relation suggestions must never auto-resolve endpoints');
assert.match(relationService,/semanticSuggestionIsNotEvidence:true/,'semantic endpoint similarity must not become relation evidence');
assert.match(learnerApi,/getLearnerPublishedCardsForLearningUnit/,'learner API must expose cards by stable learning-unit key');
assert.match(learnerApi,/listPublishedLearningUnits/,'learner API must expose published dynamic units');
assert.doesNotMatch(learnerApi,/chapter\s*[<>]=?\s*18|from 1 to 18/,'dynamic learner API must not restore the fixed chapter ceiling');
assert.match(learnerPublication,/p\.status='PUBLISHED'/,'learner publication list must expose only creator-published material');
assert.match(learnerPublication,/p\.publication_version=c\.publication_version/,'learner publication list must use the current publication version');
assert.match(journey,/usePublishedLearningUnits/,'learner journey must load dynamic published units');
assert.match(journey,/activeDynamicUnitKey/,'learner journey must be able to open a dynamic unit');
assert.match(publishedUnitsHook,/\/api\/learning-publications/,'dynamic learner units must load from the learner-safe API');

console.log(JSON.stringify({ok:true,version:'backend-completion-regression-v1.1',semanticConfigured:semantic.available,multimodalConfigured:multimodal.available,policy:{fixedChapterCount:false,dynamicLearnerDelivery:true,aiNeverWritesCanonicalTruth:true,creatorReviewRequired:true,nativeImageFallbackSafe:true}},null,2));
