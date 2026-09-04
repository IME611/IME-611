import assert from'node:assert/strict';
import fs from'node:fs';

const root=new URL('../../',import.meta.url);
const read=relative=>fs.readFileSync(new URL(relative,root),'utf8');
const app=read('src/app/App.tsx');
const dashboard=read('src/features/knowledge-dashboard/KnowledgeDashboard.tsx');
const sourceReader=read('src/features/sources/PublicSourceDocument.tsx');
const knowledgeApi=read('api/knowledge.js');
const designIndex=read('src/design/index.css');
const layout=read('src/design/layout.css');

assert.match(dashboard,/find\(stage=>!state\.completedStageIds\.includes\(stage\.id\)\)/,'dashboard resume target must be the first actually incomplete foundation stage');
assert.doesNotMatch(dashboard,/Math\.min\(total,done\+1\)/,'dashboard must not infer the next chapter from completion count when learning is non-sequential');
assert.match(app,/fetch\('\/api\/sources'/,'learner source library must load from the publication-gated public source API');
assert.match(app,/metadata\.ingestion!==['"]repository-corpus-bootstrap-v1['"]/,'seed sources must be distinguished from newly published sources without inventing chapter numbers');
assert.match(app,/publishedExtraSources/,'new learner-visible sources must have an explicit library collection');
assert.match(app,/PublicSourceDocument sourceId=\{selectedPublicSourceId\}/,'published sources must open by stable source UUID');
assert.match(sourceReader,/\/api\/sources\?id=\$\{encodeURIComponent\(sourceId\)\}/,'published source reader must fetch the canonical source by UUID through the learner-safe API');
assert.match(sourceReader,/raw_text/,'published source reader must render canonical source fragment text rather than card text');
assert.match(sourceReader,/המקור נשמר בשלמותו/,'published source reader must explain the canonical-source boundary');
assert.match(knowledgeApi,/NOT EXISTS\(SELECT 1 FROM source_publications p WHERE p\.source_id=s\.id\)/,'seed sources without publication rows must remain learner-visible');
assert.match(knowledgeApi,/p\.status='PUBLISHED'/,'new intake sources must remain hidden until explicitly published');
assert.match(designIndex,/layout\.css/,'neutral structural layout must be part of the shipped UI baseline');
assert.match(layout,/\.sourceList/,'source library must retain a usable structural list layout after the visual reset');
assert.match(layout,/\.sourceItem/,'source items must retain structural layout after the visual reset');

console.log('PASS learner source library (first-incomplete resume + publication-gated source catalogue + canonical UUID reader + neutral structural layout)');
