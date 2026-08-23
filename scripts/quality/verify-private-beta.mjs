import assert from'node:assert/strict';
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

const[{default:importHandler},{default:knowledgeHandler},{default:insightsHandler},{default:reviewsHandler}]=await Promise.all([
 import('../../api/import.js'),
 import('../../api/knowledge.js'),
 import('../../api/insights.js'),
 import('../../api/reviews.js'),
]);

await expectUnauthorized('canonical import',importHandler,request('/api/import','POST',{text:'private beta fixture'}));
await expectUnauthorized('knowledge item write',knowledgeHandler,request('/api/knowledge?resource=items','POST',{title:'fixture'}));
await expectUnauthorized('crystal database write',knowledgeHandler,request('/api/knowledge?resource=crystals','PUT',{fragmentId:'fixture'}));
await expectUnauthorized('taxonomy database write',knowledgeHandler,request('/api/knowledge?resource=taxonomy','PUT',{fragmentId:'fixture'}));
await expectUnauthorized('canonical core-loop write',insightsHandler,request('/api/insights?mode=core-loop','POST',{action:'create-insight'}));
await expectUnauthorized('legacy review write',reviewsHandler,request('/api/reviews','POST',{}));

const matchResponse=response();
await insightsHandler(request('/api/insights?mode=match','POST',{text:'מוח'}),matchResponse);
assert.equal(matchResponse.statusCode,200,'read-only match request should remain available');
assert.equal(matchResponse.payload?.ok,true,'read-only match request should return a valid response');

const app=read('src/app/App.tsx');
const dashboard=read('src/features/knowledge-dashboard/KnowledgeDashboard.tsx');
const journey=read('src/features/journey/SpiralLibrary.tsx');
const crystals=read('src/features/crystals/model/crystal.repository.ts');
const assignments=read('src/features/research/model/assignment.repository.ts');
const storage=read('src/core/storage.ts');

assert.match(app,/KnowledgeDashboard onOpenJourney=/,'the approved dashboard must be connected to the journey');
assert.doesNotMatch(app,/ProductDashboard/,'the hidden dashboard must not be connected');
assert.match(dashboard,/onOpenJourney/,'dashboard layers must open the journey');
assert.match(app,/openChapterFromResearch\(r\.ch\.number\)/,'search results must open the matched chapter');
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

memory.setItem('eil-crystals',JSON.stringify([{text:'תובנה ישנה',topic:'פרק ישן',chapterNum:2,date:'2026-08-01T00:00:00.000Z'}]));
const{crystalCollectionRepository}=await import('../../src/features/crystals/model/crystal.repository.ts');
assert.equal(crystalCollectionRepository.load().length,1,'legacy crystal should migrate into the canonical local collection');
assert.equal(memory.getItem('eil-crystals'),null,'legacy crystal key should be removed after migration');
assert.ok(memory.getItem('eil-crystals-v1'),'canonical crystal cache should be written after migration');
assert.equal(crystalCollectionRepository.save({fragmentId:'personal-test',conceptId:'chapter-1',topic:'בדיקה',text:'תובנה חדשה',sourceLabel:'פרק 1',provenanceLabel:'נכתב בבדיקה',savedAt:'2026-08-23T00:00:00.000Z'}),true,'new crystal should save locally');
assert.equal(crystalCollectionRepository.load().length,2,'old and new crystals should share one collection');
assert.equal(crystalCollectionRepository.clear(),true,'crystal collection should clear locally');
assert.equal(crystalCollectionRepository.load().length,0,'cleared collection should remain empty');

console.log('Private beta verification passed: protected writes, single dashboard, chapter search, unified local crystals, and complete reset contracts.');
