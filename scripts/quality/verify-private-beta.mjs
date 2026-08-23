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
const navigation=read('src/features/navigation/navigation.config.ts');
const crystals=read('src/features/crystals/model/crystal.repository.ts');
const assignments=read('src/features/research/model/assignment.repository.ts');
const storage=read('src/core/storage.ts');

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
assert.match(app,/const journeyChapters=embeddedChapters/,'the reader must preserve the curated marker-based Claude chapter edition');
assert.doesNotMatch(navigation,/id:'research'/,'research search must be removed from primary navigation');
assert.match(app,/className="sourceItem" onClick=\{\(\)=>openJourney\(source\.number\)\}/,'every source card must open its full chapter');
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
const{resetPersonalProgress}=await import('../../src/core/storage.ts');
assert.equal(resetPersonalProgress(),4,'reset should remove every seeded progress record');
assert.equal(memory.getItem('eil-settings'),'preserve','reset must preserve profile settings');
assert.equal(memory.getItem('eil-research-assignments-v1'),'preserve','reset must preserve research organization');

const{createServer}=await import('vite');
const moduleLoader=await createServer({root,server:{middlewareMode:true},appType:'custom',logLevel:'silent'});
const[{lifeResearchV1},{emptyLearningProgress,completeLearningStage},{saveLearningProgress,loadLearningProgress}]=await Promise.all([
 moduleLoader.ssrLoadModule('/src/data/learning-paths/life-research-v1.ts'),
 moduleLoader.ssrLoadModule('/src/core/learning-path/learning-progress.ts'),
 moduleLoader.ssrLoadModule('/src/core/learning-path/learning-progress.storage.ts'),
]);
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
assert.equal(crystalCollectionRepository.clear(),true,'crystal collection should clear locally');
assert.equal(crystalCollectionRepository.load().length,0,'cleared collection should remain empty');

console.log('Private beta verification passed: protected writes, Unicode creator access, open topic navigation, curated chapter rendering, openable sources, unified local crystals, and complete reset contracts.');
