import assert from'node:assert/strict';
import fs from'node:fs';
import{normalizeLearningUnitKey,normalizeLearningUnitTitle}from'../../server/knowledge/application/publication/flexible-publication.service.js';

const read=path=>fs.readFileSync(path,'utf8');
const editor=read('src/features/editor/SourcePublicationReview.tsx');
const consoleUi=read('src/features/editor/ReviewConsole.tsx');
const api=read('api/reviews.js');
const migration=read('database/migrations/011_learning_unit_titles.sql');
const migrations=read('scripts/db/run-migrations.mjs');
const ensure=read('scripts/db/ensure-production-migrations.mjs');
const learner=read('server/knowledge/application/publication/learner-publication.service.js');
const health=read('server/knowledge/application/quality/backend-completion.service.js');

assert.equal(normalizeLearningUnitKey('learning-unit:19'),'learning-unit:19');
assert.equal(normalizeLearningUnitKey('topic:תפיסה-רגש'),'topic:תפיסה-רגש');
assert.equal(normalizeLearningUnitTitle('תפיסה, רגש והתנהגות','learning-unit:19'),'תפיסה, רגש והתנהגות');
assert.equal(normalizeLearningUnitTitle('', 'legacy-chapter:19'),'פרק 19');
assert.throws(()=>normalizeLearningUnitTitle('א','learning-unit:19'),/2-180/);
assert.throws(()=>normalizeLearningUnitKey('learning unit 19'),/without spaces/);

assert.ok(migration.includes('target_learning_unit_title TEXT'),'migration 011 must add source publication unit title');
assert.ok(migration.includes('learning_unit_title TEXT'),'migration 011 must add learner card unit title');
assert.ok(migration.includes('source_publications_legacy_unit_compat'),'legacy source-publication writes must be upgraded before constraints');
assert.ok(migration.includes('published_learning_cards_legacy_unit_compat'),'legacy card writes must be upgraded before constraints');
assert.ok(migration.includes("NEW.target_learning_unit_key := 'legacy-chapter:'"),'legacy source placement must receive a stable unit key');
assert.ok(migration.includes("NEW.learning_unit_key := 'legacy-chapter:'"),'legacy cards must receive a stable unit key');
assert.ok(migrations.includes("'database/migrations/011_learning_unit_titles.sql'"),'migration runner must include 011');
assert.ok(migrations.includes("'database/migrations/012_legacy_review_boundary.sql'"),'migration runner must include latest canonical migration');
assert.ok(ensure.includes('001-012'),'production migration gate must advertise 001-012');

assert.ok(api.includes('learningUnitTitle:body.learningUnitTitle'),'publication API must forward the learner-facing unit title');
assert.ok(editor.includes("'/api/reviews?mode=publication-placement'"),'creator editor must use flexible publication endpoint');
assert.ok(editor.includes('learningUnitKey:unitKey.trim()'),'creator editor must send stable unit key');
assert.ok(editor.includes('learningUnitTitle:unitTitle.trim()'),'creator editor must send learner-facing unit title');
assert.ok(editor.includes('צור יחידה חדשה מהמקור הזה'),'creator editor must expose new-unit flow');
assert.ok(editor.includes('יחידה קיימת ממפת הלמידה'),'creator editor must expose existing learning units');
assert.ok(editor.includes('מסלול יסוד (תאימות לפרקים)'),'legacy chapter placement must be compatibility-only');
assert.ok(!editor.includes("onError('בחר פרק יעד לפני יצירת הכרטיסיות.')"),'creator editor must not require a fixed chapter');

assert.ok(consoleUi.includes('יחידת לימוד יעד'),'creator console publication copy must describe dynamic placement');
assert.ok(consoleUi.includes('יחידות ויחידת לימוד'),'source approval follow-up must describe dynamic placement');
assert.ok(!consoleUi.includes('בחירת יחידות, פרק יעד'),'creator console must not present fixed chapter placement as the current flow');
assert.ok(!consoleUi.includes('תמונה דורשת כרגע גם תיאור טקסטואלי'),'creator console must not claim text is always required for images');
assert.ok(consoleUi.includes('תמונות נתמכות ישירות'),'creator console must describe native image intake');
assert.ok(consoleUi.includes('אם ניתוח ה־AI אינו זמין'),'creator console must describe the safe image fallback');

assert.ok(learner.includes('learning_unit_title'),'learner publication listing must read persisted unit titles');
assert.ok(learner.includes('row.creator_title'),'learner unit title must prefer persisted creator title');
assert.ok(learner.includes('creatorTitlePreferred:true'),'learner policy must declare creator title precedence');

assert.ok(health.includes("healthScope:'LEGACY_COMPATIBILITY_SERVICE'"),'aggregate health must label the retained legacy health service');
assert.ok(health.includes('effectivePolicy:{fixedChapterCount:false,dynamicLearningUnitKeys:true,dynamicLearningUnitTitles:true'),'aggregate health must expose the effective dynamic publication policy');

console.log('PASS dynamic publication editor (unbounded units + creator titles + truthful creator copy + effective policy context)');
