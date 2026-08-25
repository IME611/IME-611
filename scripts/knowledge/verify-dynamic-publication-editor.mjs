import assert from'node:assert/strict';
import fs from'node:fs';
import{normalizeLearningUnitKey,normalizeLearningUnitTitle}from'../../server/knowledge/application/publication/flexible-publication.service.js';

const read=path=>fs.readFileSync(path,'utf8');
const editor=read('src/features/editor/SourcePublicationReview.tsx');
const api=read('api/reviews.js');
const migration=read('database/migrations/011_learning_unit_titles.sql');
const migrations=read('scripts/db/run-migrations.mjs');
const ensure=read('scripts/db/ensure-production-migrations.mjs');
const learner=read('server/knowledge/application/publication/learner-publication.service.js');

assert.equal(normalizeLearningUnitKey('learning-unit:19'),'learning-unit:19');
assert.equal(normalizeLearningUnitKey('topic:תפיסה-רגש'),'topic:תפיסה-רגש');
assert.equal(normalizeLearningUnitTitle('תפיסה, רגש והתנהגות','learning-unit:19'),'תפיסה, רגש והתנהגות');
assert.equal(normalizeLearningUnitTitle('', 'legacy-chapter:19'),'פרק 19');
assert.throws(()=>normalizeLearningUnitTitle('א','learning-unit:19'),/2-180/);
assert.throws(()=>normalizeLearningUnitKey('learning unit 19'),/without spaces/);

assert.ok(migration.includes('target_learning_unit_title TEXT'),'migration 011 must add source publication unit title');
assert.ok(migration.includes('learning_unit_title TEXT'),'migration 011 must add learner card unit title');
assert.ok(migrations.includes("'database/migrations/011_learning_unit_titles.sql'"),'migration runner must include 011');
assert.ok(ensure.includes('001-011'),'production migration gate must advertise 001-011');

assert.ok(api.includes('learningUnitTitle:body.learningUnitTitle'),'publication API must forward the learner-facing unit title');
assert.ok(editor.includes("'/api/reviews?mode=publication-placement'"),'creator editor must use flexible publication endpoint');
assert.ok(editor.includes('learningUnitKey:unitKey.trim()'),'creator editor must send stable unit key');
assert.ok(editor.includes('learningUnitTitle:unitTitle.trim()'),'creator editor must send learner-facing unit title');
assert.ok(editor.includes('צור יחידה חדשה מהמקור הזה'),'creator editor must expose new-unit flow');
assert.ok(editor.includes('יחידה קיימת ממפת הלמידה'),'creator editor must expose existing learning units');
assert.ok(editor.includes('מסלול יסוד (תאימות לפרקים)'),'legacy chapter placement must be compatibility-only');
assert.ok(!editor.includes("onError('בחר פרק יעד לפני יצירת הכרטיסיות.')"),'creator editor must not require a fixed chapter');

assert.ok(learner.includes('learning_unit_title'),'learner publication listing must read persisted unit titles');
assert.ok(learner.includes('row.unit_title'),'learner unit title must prefer persisted creator title');

console.log('PASS dynamic publication editor (unbounded unit keys + creator titles + flexible placement UI + migration 011)');
