import assert from'node:assert/strict';
import fs from'node:fs';
import path from'node:path';
import{fileURLToPath}from'node:url';
import{createServer}from'vite';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

const app=read('src/app/App.tsx');
const dashboard=read('src/features/knowledge-dashboard/KnowledgeDashboard.tsx');
const journey=read('src/features/journey/SpiralLibrary.tsx');
const cardReader=read('src/features/journey/LearningCardReader.tsx');
const cardExhibit=read('src/features/journey/CardSourceExhibit.tsx');
const savedCardComposer=read('src/features/crystals/CrystalCardComposer.tsx');
const likedCardsPage=read('src/features/crystals/LikedCardsPage.tsx');
const navigation=read('src/features/navigation/navigation.config.ts');
const navigationShell=read('src/features/navigation/NavigationShell.tsx');
const storage=read('src/core/storage.ts');
const sourceIntakeModal=read('src/features/sources/AddSourceModal.tsx');
const sourceIntakeApi=read('src/features/sources/source-intake.api.ts');
const embeddedChapter2=read('src/data/chapters-embedded.ts').split('\n').find(line=>line.startsWith('{id:"2"'))??'';

assert.match(app,/activePage==='dashboard'&&<KnowledgeDashboard\/>/,'dashboard route must remain intentionally present');
assert.match(dashboard,/emptyHome/,'home must stay intentionally empty while the menu is the hub');
assert.doesNotMatch(dashboard,/useLearningProgress|JOURNEY_LAYERS|dashHero/,'journey progress must not be duplicated on the home page');
assert.match(app,/activePage==='liked-cards'&&<LikedCardsPage\/>/,'liked cards must be reachable from the menu');
assert.doesNotMatch(app,/crystalLauncher|CrystalCollectionDrawer/,'saved cards must not duplicate a floating home launcher');
assert.match(likedCardsPage,/הכרטיסיות שאהבתי/,'saved-card collection must use the approved learner-facing name');
assert.match(savedCardComposer,/שמורה בכרטיסיות שאהבתי|♡ שמור/,'card save action must use the liked-card learner flow');
assert.doesNotMatch(savedCardComposer,/שמור בקריסטלים|הכרטיס שמור בקריסטלים/,'old crystal wording must not remain in the learner save flow');
assert.doesNotMatch(likedCardsPage,/sourceLabel|provenanceLabel/,'liked cards must not expose source/provenance metadata');

for(const id of['dashboard','library','liked-cards','practical-tools','exercises','connection-map','notes','settings'])assert.ok(navigation.includes(`id:'${id}'`),`approved learner menu route missing ${id}`);
assert.match(navigation,/id:'sources'.*ownerOnly:true/,'source library must stay creator-only');
assert.match(navigation,/id:'add-source'.*ownerOnly:true/,'source ingestion must stay creator-only');
assert.match(navigation,/id:'review'.*ownerOnly:true/,'publication review must stay creator-only');
assert.match(navigationShell,/navigationForMode\(owner\)/,'desktop and mobile navigation must share the same access policy');
assert.match(app,/activePage=isKnownNavigation\(page\)&&\(owner\|\|!isOwnerOnlyNavigation\(page\)\)\?page:'dashboard'/,'unknown and forbidden hashes must normalize to dashboard');

assert.doesNotMatch(journey,/spiralSearchInput|spiralContinue|spiralReflect/,'journey must stay focused on clickable topics and one reading flow');
assert.match(journey,/const unlocked\s*=\s*\(_num\s*:\s*number\)\s*=>\s*true/,'all chapter topics must remain open and clickable');
assert.match(journey,/סיימתי — לפרק הבא/,'chapter completion and next navigation must share one clear action');
assert.match(journey,/getPilotCardChapter/,'guided journey must use the reviewed short-card pilot');
assert.doesNotMatch(journey,/חדש במאגר|יחידה שפורסמה מהמאגר|מקור מאושר|מקורות מאושרים/,'learner journey copy must not expose repository/editorial workflow language');
assert.match(cardReader,/aria-roledescription="carousel"/,'learning cards must render as an accessible carousel');
assert.match(cardReader,/onTouchStart=\{onTouchStart\}/,'carousel must support touch swiping');
assert.match(cardReader,/learningCarouselDots/,'carousel must expose direct card-position controls');
assert.match(cardReader,/כרטיס \{position\+1\} מתוך/,'card reader must communicate short in-chapter progress');
assert.match(cardReader,/if\(isLast\)onComplete\(\)/,'last card must own the completion action');
assert.doesNotMatch(cardReader,/current\.sourceLabel|current\.provenanceLabel|evidenceRefs|canonicalSourceDetails|\/api\/sources/,'learner card UI must not expose or fetch internal source/provenance metadata');
assert.doesNotMatch(cardExhibit,/העלה היוצר|AuraFlow/,'learner exhibits must not expose creator/source names');
assert.match(savedCardComposer,/הערה אישית/,'saved cards must support one optional personal note');
assert.match(sourceIntakeApi,/\/api\/intake/,'new sources must pass through intake analysis before canonical ingestion');
assert.match(sourceIntakeModal,/sourceIntakeApi\.analyze/,'creator upload must compare a source with the corpus');
assert.match(sourceIntakeModal,/sourceIntakeApi\.decide/,'creator upload must require an explicit intake decision');
assert.match(embeddedChapter2,/title:"הכלי החיצוני"/,'chapter 2 must open the external-environment source');
assert.match(embeddedChapter2,/sourceFile:"פרק2_הכלי_החיצוני\.docx"/,'chapter 2 must preserve its canonical source mapping');
for(const contract of['eil-crystals-v1','eil-learning-progress:','eil-transformation-drafts:v1'])assert.ok(storage.includes(contract),`reset contract missing ${contract}`);

class MemoryStorage{
 #data=new Map();
 get length(){return this.#data.size}
 key(index){return[...this.#data.keys()][index]??null}
 getItem(key){return this.#data.has(String(key))?this.#data.get(String(key)):null}
 setItem(key,value){this.#data.set(String(key),String(value))}
 removeItem(key){this.#data.delete(String(key))}
 clear(){this.#data.clear()}
}
const memory=new MemoryStorage();
globalThis.CustomEvent??=class CustomEvent{constructor(type){this.type=type}};
globalThis.window={localStorage:memory,dispatchEvent(){return true}};
globalThis.localStorage=memory;

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
const learnerIds=[...learnerNavigation.primary,...learnerNavigation.groups.flatMap(group=>group.items)].map(item=>item.id);
assert.deepEqual(learnerIds,['dashboard','library','liked-cards','practical-tools','exercises','connection-map','notes','settings'],'learner menu must expose the approved hub without creator sources');
assert.equal(isOwnerOnlyNavigation('sources'),true,'source library must be creator-only');
assert.equal(isOwnerOnlyNavigation('add-source'),true,'source ingestion must be creator-only');
assert.equal(isOwnerOnlyNavigation('review'),true,'publication review must be creator-only');

assert.equal(pilotCardChapters.length,9,'short-card pilot must cover chapters 1–9');
assert.equal(pilotCardChapters.flatMap(chapter=>chapter.cards).length,60,'pilot must contain all 60 traceable cards');
for(const chapter of pilotCardChapters)for(const card of chapter.cards){
 const words=card.text.trim().split(/\s+/u).filter(Boolean).length;
 assert.ok(words>=40&&words<=90,`${card.id} must contain 40–90 words`);
 assert.ok(card.sourceUnitIds.length>0,`${card.id} must point to source evidence`);
}
cardProgressRepository.save(1,4);
assert.equal(cardProgressRepository.load(1,6),4,'card position must persist');
assert.equal(cardProgressRepository.load(1,3),2,'stored card position must clamp when script becomes shorter');
let progress=emptyLearningProgress(lifeResearchV1);
progress=completeLearningStage(progress,lifeResearchV1,lifeResearchV1.stages[0].id);
progress=completeLearningStage(progress,lifeResearchV1,lifeResearchV1.stages[1].id);
progress=completeLearningStage(progress,lifeResearchV1,lifeResearchV1.stages[0].id);
assert.equal(progress.activeStageId,lifeResearchV1.stages[2].id,'re-reading chapter 1 must not rewind progress');
saveLearningProgress(lifeResearchV1,progress);
assert.equal(loadLearningProgress(lifeResearchV1).activeStageId,lifeResearchV1.stages[2].id,'saved progress must resume correctly');
await moduleLoader.close();

console.log('PASS private beta surface (menu hub + private creator sources + carousel cards + learner metadata privacy + local progress + canonical intake flow)');