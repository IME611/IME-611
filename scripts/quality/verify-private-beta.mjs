import assert from'node:assert/strict';
import crypto from'node:crypto';
import fs from'node:fs';
import path from'node:path';
import{fileURLToPath}from'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

function request(url,method='GET',body={}){
 return{url,method,body,headers:{host:'localhost'},socket:{remoteAddress:'127.0.0.1'}};
}

function response(){
 return{
  statusCode:200,
  headers:{},
  payload:null,
  setHeader(name,value){this.headers[String(name).toLowerCase()]=value},
  status(code){this.statusCode=code;return this},
  json(payload){this.payload=payload;return this},
  end(){return this},
 };
}

async function expectUnauthorized(label,handler,req){
 const res=response();
 await handler(req,res);
 assert.equal(res.statusCode,401,`${label} must reject an anonymous write`);
 assert.equal(res.payload?.code,'EDITOR_AUTH_REQUIRED',`${label} must use the shared creator gate`);
}

const[{default:importHandler},{default:knowledgeHandler},{default:insightsHandler},{default:reviewsHandler},{default:chaptersHandler}]=await Promise.all([
 import('../../api/import.js'),
 import('../../api/knowledge.js'),
 import('../../api/insights.js'),
 import('../../api/reviews.js'),
 import('../../api/chapters.js'),
]);

await expectUnauthorized('canonical import',importHandler,request('/api/import','POST',{text:'private beta fixture'}));
await expectUnauthorized('knowledge item write',knowledgeHandler,request('/api/knowledge?resource=items','POST',{title:'fixture'}));
await expectUnauthorized('crystal database write',knowledgeHandler,request('/api/knowledge?resource=crystals','PUT',{fragmentId:'fixture'}));
await expectUnauthorized('taxonomy database write',knowledgeHandler,request('/api/knowledge?resource=taxonomy','PUT',{fragmentId:'fixture'}));
await expectUnauthorized('canonical core-loop write',insightsHandler,request('/api/insights?mode=core-loop','POST',{action:'create-insight'}));
await expectUnauthorized('legacy review write',reviewsHandler,request('/api/reviews','POST',{}));
await expectUnauthorized('intake analysis',reviewsHandler,request('/api/intake','POST',{text:'private beta intake fixture'}));

const unicodeKey='מפתח בדיקה בטוח';
process.env.EIL_EDITOR_KEY_HASH=crypto.createHash('sha256').update(unicodeKey).digest('hex');
const encodedKey=Buffer.from(unicodeKey,'utf8').toString('base64url');
const authorizedRequest=request('/api/import','POST',{mode:'verify-access'});
authorizedRequest.headers['x-eil-editor-key-b64']=encodedKey;
const authorizedResponse=response();
await importHandler(authorizedRequest,authorizedResponse);
assert.equal(authorizedResponse.statusCode,200,'Unicode creator keys must be transported safely');
assert.equal(authorizedResponse.payload?.authorized,true,'creator key verification must not write a source');
delete process.env.EIL_EDITOR_KEY_HASH;

const chapterCollectionResponse=response();
await chaptersHandler(request('/api/chapters'),chapterCollectionResponse);
assert.equal(chapterCollectionResponse.statusCode,200,'chapter collection endpoint must not treat a missing number as chapter zero');
assert.equal(chapterCollectionResponse.payload?.total,18,'chapter collection must return all 18 canonical chapters');

const matchResponse=response();
await insightsHandler(request('/api/insights?mode=match','POST',{text:'מוח'}),matchResponse);
assert.equal(matchResponse.statusCode,200,'read-only match request should remain available');
assert.equal(matchResponse.payload?.ok,true,'read-only match request should return a valid response');

const app=read('src/app/App.tsx');
const dashboard=read('src/features/knowledge-dashboard/KnowledgeDashboard.tsx');
const journey=read('src/features/journey/SpiralLibrary.tsx');
const cardReader=read('src/features/journey/LearningCardReader.tsx');
const cardScript=read('src/features/journey/data/pilot-card-script.ts');
const crystalComposer=read('src/features/crystals/CrystalCardComposer.tsx');
const navigation=read('src/features/navigation/navigation.config.ts');
const navigationShell=read('src/features/navigation/NavigationShell.tsx');
const crystals=read('src/features/crystals/model/crystal.repository.ts');
const assignments=read('src/features/research/model/assignment.repository.ts');
const storage=read('src/core/storage.ts');
const sourceIntakeModal=read('src/features/sources/AddSourceModal.tsx');
const sourceIntakeApi=read('src/features/sources/source-intake.api.ts');
const embeddedChapter2=read('src/data/chapters-embedded.ts').split('\n').find(line=>line.startsWith('{id:"2"'))??'';

assert.match(app,/KnowledgeDashboard onOpenJourney=/,'the approved dashboard must be connected to the journey');
assert.doesNotMatch(app,/ProductDashboard/,'the hidden dashboard must not be connected');
assert.match(dashboard,/onOpenJourney/,'dashboard layers must open the journey');
assert.doesNotMatch(dashboard,/dashStartBtn|המשך לפרק/,'dashboard must not steer the reader to a numbered next chapter');
assert.doesNotMatch(app,/globalSearch|research-search|searchResult/,'the guided journey must not expose free-text chapter search');
assert.doesNotMatch(journey,/spiralSearchInput|filtered search/,'the journey must remain chapter-by-chapter without text filtering');
assert.doesNotMatch(journey,/spiralContinue|המשך לפרק/,'journey index must expose clickable topics instead of a numbered continue CTA');
assert.match(journey,/const unlocked\s*=\s*\(_num: number\) => true/,'all chapter topics must remain open and clickable');
assert.doesNotMatch(journey,/spiralReflect|onNext|canGoNext/,'chapter view must not duplicate reflection or next-navigation controls');
assert.match(journey,/סיימתי — לפרק הבא/,'chapter completion and next navigation must share one clear action');
assert.match(journey,/getPilotCardChapter/,'the guided journey must connect the reviewed short-card pilot');
assert.match(cardReader,/כרטיס \{position\+1\} מתוך/,'card reader must communicate short in-chapter progress');
assert.match(cardReader,/isLast\?'סיימתי — לפרק הבא/,'the last card must own the only completion and next-chapter action');
assert.doesNotMatch(cardReader,/crystalSaveCard|שמור כקריסטל/,'card chapters must not duplicate the crystal composer');
assert.match(crystalComposer,/הערה אישית/,'a saved card must support one optional personal note in the same flow');
assert.match(cardScript,/S01-U01/,'pilot cards must retain source-unit traceability');
assert.match(app,/const journeyChapters=embeddedChapters/,'the reader must preserve the curated marker-based Claude chapter edition');
assert.doesNotMatch(navigation,/id:'research'/,'research search must be removed from primary navigation');
assert.match(storage,/readText\(storageKeys\.accessMode,'learner'\)/,'a fresh browser must enter the learner journey, not creator mode');
assert.match(navigation,/id:'add-learning'.*ownerOnly:true/,'standalone learning capture must stay in creator mode because learner notes belong to crystals');
assert.match(navigation,/id:'add-source'.*ownerOnly:true/,'source ingestion must stay in creator mode');
assert.match(sourceIntakeApi,/\/api\/intake/,'new sources must pass through intake analysis before canonical ingestion');
assert.match(sourceIntakeModal,/sourceIntakeApi\.analyze/,'the creator upload flow must compare a source with the corpus');
assert.match(sourceIntakeModal,/sourceIntakeApi\.decide/,'the creator upload flow must require an explicit intake decision');
assert.doesNotMatch(sourceIntakeModal,/fetch\(['"]\/api\/import/,'the source modal must not bypass intake analysis with direct canonical import');
assert.doesNotMatch(navigation,/id:'crystals'/,'the navigation must not duplicate the persistent crystal launcher');
assert.match(navigationShell,/navigationForMode\(owner\)/,'desktop and mobile navigation must filter items through the same access policy');
assert.match(app,/activePage=owner\|\|!isOwnerOnlyNavigation\(page\)\?page:'dashboard'/,'learner routes must fail closed when an owner-only hash is requested');
assert.match(app,/replaceNav\('dashboard'\)/,'a blocked creator hash must be replaced with the learner dashboard URL');
assert.match(app,/className="sourceItem" onClick=\{\(\)=>openSource\(source\.number\)\}/,'source cards must open canonical documents independently of the learning sequence');
assert.match(journey,/chapters\.find\(item=>item\.sourceFile===pilotCardChapter\.sourceFile\)/,'reordered learning chapters must resolve their own canonical source by file');
assert.match(embeddedChapter2,/title:"הכלי החיצוני"/,'chapter 2 must open the external-environment source');
assert.match(embeddedChapter2,/sourceFile:"פרק2_הכלי_החיצוני\.docx"/,'chapter 2 must preserve its canonical source mapping');
assert.doesNotMatch(embeddedChapter2,/title:"מערכת ההפעלה"/,'chapter 2 must not duplicate chapter 4');
assert.doesNotMatch(journey,/localStorage\.getItem\(['"]eil-crystals['"]\)/,'journey must not use the legacy crystal store');
assert.doesNotMatch(crystals,/\/api\/knowledge\?resource=crystals/,'private-beta crystals must remain local-only');
assert.doesNotMatch(assignments,/method:['"]PUT['"]/,'private-beta taxonomy assignments must remain local-only');
for(const contract of['eil-crystals-v1','eil-learning-progress:','eil-transformation-drafts:v1'])assert.ok(storage.includes(contract),`reset contract missing ${contract}`);

class MemoryStorage{
 #data=new Map();
 get length(){return this.#data.size}
 key(index){return[...this.#data.keys()][index]??null}
 getItem(key){return this.#data.has(key)?this.#data.get(key):null}
 setItem(key,value){this.#data.set(String(key),String(value))}
 removeItem(key){this.#data.delete(String(key))}
}
const memory=new MemoryStorage();
globalThis.CustomEvent??=class CustomEvent{constructor(type){this.type=type}};
globalThis.window={localStorage:memory,dispatchEvent(){return true}};
globalThis.localStorage=memory;
memory.setItem('eil-settings','preserve');
memory.setItem('eil-research-assignments-v1','preserve');
memory.setItem('eil-crystals-v1','[{"fragmentId":"old"}]');
memory.setItem('eil-learning-progress:life-research:v1','progress');
memory.setItem('eil-chapter-reflection-1','reflection');
memory.setItem('eil-transformation-drafts:v1','draft');
memory.setItem('eil-card-progress-v1','{"schemaVersion":1,"positions":{"1":3}}');
const{resetPersonalProgress}=await import('../../src/core/storage.ts');
assert.equal(resetPersonalProgress(),5,'reset should remove every seeded progress record, including in-chapter card position');
assert.equal(memory.getItem('eil-settings'),'preserve','reset must preserve profile settings');
assert.equal(memory.getItem('eil-research-assignments-v1'),'preserve','reset must preserve research organization');

const{createServer}=await import('vite');
const moduleLoader=await createServer({root,server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
const[{lifeResearchV1},{emptyLearningProgress,completeLearningStage},{saveLearningProgress,loadLearningProgress},{pilotCardChapters},{cardProgressRepository},{navigationForMode,isOwnerOnlyNavigation}]=await Promise.all([
 moduleLoader.ssrLoadModule('/src/data/learning-paths/life-research-v1.ts'),
 moduleLoader.ssrLoadModule('/src/core/learning-path/learning-progress.ts'),
 moduleLoader.ssrLoadModule('/src/core/learning-path/learning-progress.storage.ts'),
 moduleLoader.ssrLoadModule('/src/features/journey/data/pilot-card-script.ts'),
 moduleLoader.ssrLoadModule('/src/features/journey/model/card-progress.repository.ts'),
 moduleLoader.ssrLoadModule('/src/features/navigation/navigation.config.ts'),
]);
const learnerNavigation=navigationForMode(false);
const learnerNavigationIds=[...learnerNavigation.primary,...learnerNavigation.groups.flatMap(group=>group.items)].map(item=>item.id);
assert.deepEqual(learnerNavigationIds,['dashboard','library','sources','settings'],'learner navigation must stay focused on the journey, full sources and settings');
assert.equal(isOwnerOnlyNavigation('add-source'),true,'direct source-ingestion routes must be recognized as creator-only');
assert.equal(isOwnerOnlyNavigation('add-learning'),true,'standalone learning capture must be recognized as creator-only');
assert.equal(pilotCardChapters.length,9,'the card-format draft must cover the first nine learning chapters');
assert.equal(pilotCardChapters.flatMap(chapter=>chapter.cards).length,60,'the first nine chapters must contain all 60 traceable cards');
assert.equal(pilotCardChapters[3].sourceFile,'פרק5_המוח_המפורט.docx','learning chapter 4 must use the brain source before the operating-system metaphor');
assert.equal(pilotCardChapters[4].sourceFile,'פרק4_מערכת_ההפעלה.docx','learning chapter 5 must use the operating-system source after the brain');
assert.equal(pilotCardChapters[6].title,'אור, שינה ובלוטת האצטרובל','learning chapter 7 must begin from measurable circadian biology');
assert.equal(pilotCardChapters[7].title,'צליל — מפיזיקה לחוויה','learning chapter 8 must move from physical sound to subjective experience');
assert.equal(pilotCardChapters[8].title,'מפות אנרגטיות — מסורת, מטפורה ומדידה','learning chapter 9 must distinguish tradition, metaphor and measurement');
assert.match(pilotCardChapters[6].cards.map(item=>item.text).join(' '),/לא הוכח שהאצטרובל האנושי/,'pineal DMT claims must not be promoted as established human biology');
assert.match(pilotCardChapters[7].cards.map(item=>item.text).join(' '),/אינו לבדו הוכחה לריפוי/,'sound frequency must not be presented as a universal healing mechanism');
assert.match(pilotCardChapters[8].cards.map(item=>item.text).join(' '),/אינה מסקנה רפואית מבוססת/,'spiritual maps must not be presented as medical anatomy');
for(const chapter of pilotCardChapters){
 for(const card of chapter.cards){
  const words=card.text.trim().split(/\s+/u).filter(Boolean).length;
  assert.ok(words>=40&&words<=90,`${card.id} must contain 40–90 words`);
  assert.ok(card.sourceUnitIds.length>0,`${card.id} must point back to at least one source unit`);
 }
}
cardProgressRepository.save(1,4);
assert.equal(cardProgressRepository.load(1,6),4,'card position must persist across a reload');
assert.equal(cardProgressRepository.load(1,3),2,'stored card position must be clamped when a reviewed script becomes shorter');
let progress=emptyLearningProgress(lifeResearchV1);
progress=completeLearningStage(progress,lifeResearchV1,lifeResearchV1.stages[0].id);
progress=completeLearningStage(progress,lifeResearchV1,lifeResearchV1.stages[1].id);
progress=completeLearningStage(progress,lifeResearchV1,lifeResearchV1.stages[0].id);
assert.equal(progress.activeStageId,lifeResearchV1.stages[2].id,'re-reading chapter 1 must not send progress back to chapter 2');
progress=completeLearningStage(progress,lifeResearchV1,lifeResearchV1.stages[3].id);
assert.ok(progress.completedStageIds.includes(lifeResearchV1.stages[3].id),'an opened topic must be completable without a sequential lock');
assert.equal(progress.activeStageId,lifeResearchV1.stages[2].id,'open-topic completion must still resume at the first incomplete chapter');
saveLearningProgress(lifeResearchV1,progress);
assert.equal(memory.getItem('eil-journey-progress'),'3','legacy progress must stay synchronized with canonical progress');
assert.equal(loadLearningProgress(lifeResearchV1).activeStageId,lifeResearchV1.stages[2].id,'saved progress must resume at the first incomplete chapter');
await moduleLoader.close();

memory.setItem('eil-crystals',JSON.stringify([{text:'תובנה ישנה',topic:'פרק ישן',chapterNum:2,date:'2026-08-01T00:00:00.000Z'}]));
const{crystalCollectionRepository}=await import('../../src/features/crystals/model/crystal.repository.ts');
assert.equal(crystalCollectionRepository.load().length,1,'legacy crystal should migrate into the canonical local collection');
assert.equal(memory.getItem('eil-crystals'),null,'legacy crystal key should be removed after migration');
assert.ok(memory.getItem('eil-crystals-v1'),'canonical crystal cache should be written after migration');
assert.equal(crystalCollectionRepository.save({fragmentId:'personal-test',conceptId:'chapter-1',topic:'בדיקה',text:'תובנה חדשה',sourceLabel:'פרק 1',provenanceLabel:'נכתב בבדיקה',savedAt:'2026-08-23T00:00:00.000Z'}),true,'new crystal should save locally');
assert.equal(crystalCollectionRepository.load().length,2,'old and new crystals should share one collection');
assert.equal(crystalCollectionRepository.save({fragmentId:'personal-test',conceptId:'chapter-1',topic:'בדיקה',text:'תובנה חדשה',sourceLabel:'פרק 1',provenanceLabel:'נכתב בבדיקה',personalNote:'הערה אישית',savedAt:'2026-08-23T00:00:00.000Z'}),true,'a personal note must update the same crystal instead of creating a duplicate');
assert.equal(crystalCollectionRepository.load().find(item=>item.fragmentId==='personal-test')?.personalNote,'הערה אישית','a crystal personal note must survive repository normalization');
assert.equal(crystalCollectionRepository.load().length,2,'updating a crystal note must not increase the collection count');
assert.equal(crystalCollectionRepository.clear(),true,'crystal collection should clear locally');
assert.equal(crystalCollectionRepository.load().length,0,'cleared collection should remain empty');

console.log('Private beta verification passed: protected writes, open topic navigation, 60 traceable short cards across chapters 1–9, persistent card position, unified crystals with personal notes, canonical sources, and complete reset contracts.');
