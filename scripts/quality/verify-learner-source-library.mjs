import assert from'node:assert/strict';
import fs from'node:fs';

const root=new URL('../../',import.meta.url);
const read=relative=>fs.readFileSync(new URL(relative,root),'utf8');
const app=read('src/app/App.tsx');
const dashboard=read('src/features/knowledge-dashboard/KnowledgeDashboard.tsx');
const navigation=read('src/features/navigation/navigation.config.ts');
const sourceReader=read('src/features/sources/PublicSourceDocument.tsx');
const knowledgeApi=read('api/knowledge.js');
const designIndex=read('src/design/index.css');
const layout=read('src/design/layout.css');

assert.match(dashboard,/emptyHome/,'home must remain intentionally empty while progress lives in the menu journey entry');
assert.doesNotMatch(dashboard,/useLearningProgress|completedStageIds|dashHero/,'home must not duplicate journey progress');
assert.match(navigation,/id:'sources'.*ownerOnly:true/,'the “my sources” route must be hidden from learner navigation');
assert.match(app,/fetch\('\/api\/sources'/,'the app may still read the publication-gated source API for canonical/published material');
assert.match(app,/metadata\.ingestion!==['"]repository-corpus-bootstrap-v1['"]/,'seed sources must be distinguished from newly published sources without inventing chapter numbers');
assert.match(app,/publishedExtraSources/,'new published sources must retain an explicit catalogue collection');
assert.match(app,/PublicSourceDocument sourceId=\{selectedPublicSourceId\}/,'creator source catalogue must open published sources by stable source UUID');
assert.match(sourceReader,/\/api\/sources\?id=\$\{encodeURIComponent\(sourceId\)\}/,'published source reader must fetch the canonical source by UUID through the safe API');
assert.match(sourceReader,/raw_text/,'published source reader must render canonical source fragment text rather than card text');
assert.match(sourceReader,/המקור נשמר בשלמותו/,'published source reader must explain the canonical-source boundary');
assert.match(knowledgeApi,/NOT EXISTS\(SELECT 1 FROM source_publications p WHERE p\.source_id=s\.id\)/,'seed sources without publication rows must remain available to the canonical public read path');
assert.match(knowledgeApi,/p\.status='PUBLISHED'/,'new intake sources must remain hidden until explicitly published');
assert.match(designIndex,/layout\.css/,'central layout must remain part of the shipped UI foundation');
assert.match(layout,/\.sourceList/,'source catalogue must retain a usable list layout');
assert.match(layout,/\.sourceItem/,'source items must retain a usable structural layout');

console.log('PASS source catalogue integrity (empty home + creator-only source route + publication-gated canonical UUID reader)');
