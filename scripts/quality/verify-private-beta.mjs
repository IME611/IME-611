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
 return{statusCode:200,headers:{},payload:null,setHeader(name,value){this.headers[String(name).toLowerCase()]=value},status(code){this.statusCode=code;return this},json(payload){this.payload=payload;return this},end(){return this}};
}
async function expectUnauthorized(label,handler,req){
 const res=response();
 await handler(req,res);
 assert.equal(res.statusCode,401,`${label} must reject an anonymous write`);
 assert.equal(res.payload?.code,'EDITOR_AUTH_REQUIRED',`${label} must use the shared creator gate`);
}

const[{default:importHandler},{default:knowledgeHandler},{default:insightsHandler},{default:reviewsHandler},{default:chaptersHandler}]=await Promise.all([
 import('../../api/import.js'),import('../../api/knowledge.js'),import('../../api/insights.js'),import('../../api/reviews.js'),import('../../api/chapters.js'),
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
const authorizedRequest=request('/api/import','POST',{mode:'verify-access'});
authorizedRequest.headers['x-eil-editor-key-b64']=Buffer.from(unicodeKey,'utf8').toString('base64url');
const authorizedResponse=response();
await importHandler(authorizedRequest,authorizedResponse);
assert.equal(authorizedResponse.statusCode,200,'Unicode creator keys must be transported safely');
assert.equal(authorizedResponse.payload?.authorized,true,'creator key verification must not write a source');
delete process.env.EIL_EDITOR_KEY_HASH;

const chapterCollectionResponse=response();
await chaptersHandler(request('/api/chapters'),chapterCollectionResponse);
assert.equal(chapterCollectionResponse.statusCode,200,'chapter collection endpoint must remain public');
assert.equal(chapterCollectionResponse.payload?.total,18,'chapter collection must return all 18 canonical foundation sources');
const matchResponse=response();
await insightsHandler(request('/api/insights?mode=match','POST',{text:'מוח'}),matchResponse);
assert.equal(matchResponse.statusCode,200,'read-only match request should remain available');
assert.equal(matchResponse.payload?.ok,true,'read-only match request should return a valid response');

const app=read('src/app/App.tsx');
const dashboard=read('src/features/knowledge-dashboard/KnowledgeDashboard.tsx');
const journey=read('src/features/journey/SpiralLibrary.tsx');
const cardReader=read('src/features/journey/LearningCardReader.tsx');
const crystalComposer=read('src/features/crystals/CrystalCardComposer.tsx');
const navigation=read('src/features/navigation/navigation.config.ts');
const navigationShell=read('src/features/navigation/NavigationShell.tsx');
const crystals=read('src/features/crystals/model/crystal.repository.ts');
const storage=read('src/core/storage.ts');
const sourceIntakeModal=read('src/features/sources/AddSourceModal.tsx');
const sourceIntakeApi=read('src/features/sources/source-intake.api.ts');
const knowledgeApi=read('api/knowledge.js');
const embeddedChapter2=read('src/data/chapters-embedded.ts').split('\n').find(line=>line.startsWith('{id:"2"'))??'';

assert.match(app,/KnowledgeDashboard onOpenJourney=/,'the approved dashboard must be connected to the journey');
assert.doesNotMatch(app,/ProductDashboard|globalSearch|research-search|searchResult/,'removed dashboard/research surfaces must not return');
assert.match(dashboard,/onOpenJourney/,'dashboard layers must open the journey');
assert.doesNotMatch(journey,/spiralSearchInput|spiralContinue|spiralReflect/,'journey must stay focused on clickable topics and one reading flow');
assert.match(journey,/const unlocked\s*=\s*\(_num: number\) => true/,'all chapter topics must remain open and clickable');
assert.match(journey,/סיימתי — לפרק הבא/,'chapter completion and next navigation must share one clear action');
assert.match(journey,/getPilotCardChapter/,'the guided journey must connect the reviewed short-card pilot');
assert.match(cardReader,/כרטיס \{position\+1\} מתוך/,'card reader must communicate short in-chapter progress');
assert.match(cardReader,/if\(isLast\)onComplete\(\)/,'the last card must own the completion action');
assert.doesNotMatch(cardReader,/crystalSaveCard|שמור כקריסטל/,'card chapters must not duplicate the crystal composer');
assert.match(crystalComposer,/הערה אישית/,'a saved card must support one optional personal note in the same flow');
assert.doesNotMatch(navigation,/id:'research'|id:'add-learning'|id:'crystals'/,'removed/duplicate production routes must not return');
assert.match(navigation,/id:'add-source'.*ownerOnly:true/,'source ingestion must stay creator-only');
assert.match(navigation,/id:'review'.*ownerOnly:true/,'publication review must stay creator-only');
assert.match(navigationShell,/navigationForMode\(owner\)/,'desktop and mobile navigation must share the same access policy');
assert.match(app,/activePage=isKnownNavigation\(page\)&&\(owner\|\|!isOwnerOnlyNavigation\(page\)\)\?page:'dashboard'/,'unknown and forbidden hashes must normalize to the dashboard');
assert.match(sourceIntakeApi,/\/api\/intake/,'new sources must pass through intake analysis before canonical ingestion');
assert.match(sourceIntakeModal,/sourceIntakeApi\.analyze/,'creator upload must compare a source with the corpus');
assert.match(sourceIntakeModal,/sourceIntakeApi\.decide/,'creator upload must require an explicit intake decision');
assert.doesNotMatch(sourceIntakeModal,/fetch\(['"]\/api\/import/,'source modal must not bypass intake analysis');
assert.match(knowledgeApi,/source_publications p WHERE p\.source_id=s\.id AND p\.status='PUBLISHED'/,'repository-only intake sources must stay hidden from the public source API');
assert.match(embeddedChapter2,/title:"הכלי החיצוני"/,'chapter 2 must open the external-environment source');
assert.match(embeddedChapter2,/sourceFile:"פרק2_הכלי_החיצוני\.docx"/,'chapter 2 must preserve its canonical source mapping');
assert.doesNotMatch(crystals,/\/api\/knowledge\?resource=crystals/,'private-beta crystals must remain local-only');
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
memory.setItem('eil-crystals-v1','[{"fragmentId":"old"}]');
memory.setItem('eil-learning-progress:life-research:v1','progress');
memory.setItem('eil-chapter-reflection-1','reflection');
memory.setItem('eil-transformation-drafts:v1','draft');
memory.setItem('eil-card-progress-v1','{"schemaVersion":1,"positions":{"1":3}}');
const{resetPersonalProgress}=await import('../../src/core/storage.ts');
assert.equal(resetPersonalProgress(),5,'reset should remove all seeded learner-progress records');
assert.equal(memory.getItem('eil-settings'),'preserve','reset must preserve profile settings');

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
assert.deepEqual(learnerNavigationIds,['dashboard','library','sources','settings'],'learner navigation must stay focused');
assert.equal(isOwnerOnlyNavigation('add-source'),true,'source ingestion must be creator-only');
assert.equal(isOwnerOnlyNavigation('review'),true,'publication review must be creator-only');
assert.equal(pilotCardChapters.length,9,'the short-card pilot must cover chapters 1–9');
assert.equal(pilotCardChapters.flatMap(chapter=>chapter.cards).length,60,'the pilot must contain all 60 traceable cards');
assert.equal(pilotCardChapters[3].sourceFile,'פרק5_המוח_המפורט.docx','learning chapter 4 must use the brain source before the operating-system metaphor');
assert.equal(pilotCardChapters[4].sourceFile,'פרק4_מערכת_ההפעלה.docx','learning chapter 5 must use the operating-system source after the brain');
assert.match(pilotCardChapters[6].cards.map(item=>item.text).join(' '),/לא הוכח שהאצטרובל האנושי/,'pineal DMT claims must not become established human biology');
assert.match(pilotCardChapters[7].cards.map(item=>item.text).join(' '),/אינו לבדו הוכחה לריפוי/,'sound frequency must not become a universal healing mechanism');
assert.match(pilotCardChapters[8].cards.map(item=>item.text).join(' '),/אינה מסקנה רפואית מבוססת/,'spiritual maps must not become medical anatomy');
for(const chapter of pilotCardChapters)for(const card of chapter.cards){
 const words=card.text.trim().split(/\s+/u).filter(Boolean).length;
 assert.ok(words>=40&&words<=90,`${card.id} must contain 40–90 words`);
 assert.ok(card.sourceUnitIds.length>0,`${card.id} must point to source evidence`);
}
cardProgressRepository.save(1,4);
assert.equal(cardProgressRepository.load(1,6),4,'card position must persist');
assert.equal(cardProgressRepository.load(1,3),2,'stored card position must clamp when a script becomes shorter');
let progress=emptyLearningProgress(lifeResearchV1);
progress=completeLearningStage(progress,lifeResearchV1,lifeResearchV1.stages[0].id);
progress=completeLearningStage(progress,lifeResearchV1,lifeResearchV1.stages[1].id);
progress=completeLearningStage(progress,lifeResearchV1,lifeResearchV1.stages[0].id);
assert.equal(progress.activeStageId,lifeResearchV1.stages[2].id,'re-reading chapter 1 must not rewind progress');
progress=completeLearningStage(progress,lifeResearchV1,lifeResearchV1.stages[3].id);
assert.ok(progress.completedStageIds.includes(lifeResearchV1.stages[3].id),'an open topic must be completable without a sequential lock');
assert.equal(progress.activeStageId,lifeResearchV1.stages[2].id,'resume must remain the first incomplete chapter');
saveLearningProgress(lifeResearchV1,progress);
assert.equal(loadLearningProgress(lifeResearchV1).activeStageId,lifeResearchV1.stages[2].id,'saved progress must resume correctly');
await moduleLoader.close();

memory.setItem('eil-crystals',JSON.stringify([{text:'תובנה ישנה',topic:'פרק ישן',chapterNum:2,date:'2026-08-01T00:00:00.000Z'}]));
const{crystalCollectionRepository}=await import('../../src/features/crystals/model/crystal.repository.ts');
assert.equal(crystalCollectionRepository.load().length,1,'legacy crystal must migrate to the canonical local collection');
assert.equal(memory.getItem('eil-crystals'),null,'legacy crystal key must be removed after migration');
assert.equal(crystalCollectionRepository.save({fragmentId:'personal-test',conceptId:'chapter-1',topic:'בדיקה',text:'תובנה חדשה',sourceLabel:'פרק 1',provenanceLabel:'נכתב בבדיקה',savedAt:'2026-08-23T00:00:00.000Z'}),true,'new crystal must save locally');
assert.equal(crystalCollectionRepository.save({fragmentId:'personal-test',conceptId:'chapter-1',topic:'בדיקה',text:'תובנה חדשה',sourceLabel:'פרק 1',provenanceLabel:'נכתב בבדיקה',personalNote:'הערה אישית',savedAt:'2026-08-23T00:00:00.000Z'}),true,'personal note must update the existing crystal');
assert.equal(crystalCollectionRepository.load().find(item=>item.fragmentId==='personal-test')?.personalNote,'הערה אישית','personal note must survive normalization');
assert.equal(crystalCollectionRepository.load().length,2,'updating a crystal must not duplicate it');
assert.equal(crystalCollectionRepository.clear(),true,'crystal collection should clear locally');
assert.equal(crystalCollectionRepository.load().length,0,'cleared collection should remain empty');

console.log('PASS private beta surface (protected writes + focused navigation + traceable cards + local progress/crystals + canonical source flow)');
