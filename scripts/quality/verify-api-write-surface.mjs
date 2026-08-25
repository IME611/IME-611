import assert from'node:assert/strict';
import fs from'node:fs';
import importHandler from'../../api/import.js';
import knowledgeHandler from'../../api/knowledge.js';
import insightsHandler from'../../api/insights.js';

function response(){
 const headers=new Map();
 return{
  statusCode:200,
  body:null,
  headersSent:false,
  setHeader(name,value){headers.set(String(name).toLowerCase(),String(value));return this},
  getHeader(name){return headers.get(String(name).toLowerCase())},
  status(code){this.statusCode=code;return this},
  json(body){this.body=body;this.headersSent=true;return this},
  end(){this.headersSent=true;return this},
 };
}

async function request(handler,url,method='GET',body={}){
 const req={url,method,headers:{host:'localhost','x-forwarded-proto':'https'},body,socket:{remoteAddress:'127.0.0.1'}};
 const res=response();
 await handler(req,res);
 return res;
}

for(const test of[
 [importHandler,'/api/import','POST',{text:'canonical mutation must not run'}],
 [knowledgeHandler,'/api/knowledge?resource=items','POST',{title:'blocked'}],
 [knowledgeHandler,'/api/knowledge?resource=inbox','POST',{title:'blocked'}],
 [knowledgeHandler,'/api/knowledge?resource=crystals','PUT',{fragmentId:'blocked'}],
 [knowledgeHandler,'/api/knowledge?resource=taxonomy','PUT',{fragmentId:'blocked',topicId:'blocked'}],
 [insightsHandler,'/api/insights?mode=core-loop','POST',{action:'create-insight'}],
]){
 const[handler,url,method,body]=test;
 const res=await request(handler,url,method,body);
 assert.equal(res.statusCode,401,`${method} ${url} must require creator authorization before mutation/DB access`);
 assert.equal(res.body?.code,'EDITOR_AUTH_REQUIRED',`${method} ${url} must fail with the stable auth code`);
}

const read=path=>fs.readFileSync(path,'utf8');
const knowledge=read('api/knowledge.js');
const importer=read('api/import.js');
const insights=read('api/insights.js');

assert.match(knowledge,/const WRITE_RESOURCES=new Set\(\['items','inbox','crystals','taxonomy'\]\)/,'knowledge write resources must stay explicit');
assert.ok(knowledge.indexOf('if(isProtectedWrite(resource,req.method)&&!requireEditor(req,res))return;')<knowledge.indexOf('const db=getDb();'),'knowledge writes must authorize before opening the DB');
assert.ok(importer.indexOf('if(!requireEditor(req,res))return;')<importer.indexOf('const body=req.body||{};'),'canonical import must authorize before parsing/import work');
assert.match(insights,/if\(req\.method==='POST'&&!requireEditor\(req,res\)\)return;/,'core-loop writes must require creator auth');

const readOnlyAdapters=['atlas.js','chapters.js','corpus-map.js','health.js','learning-graph.js','learning-health.js','mentor.js','relation-summary.js'];
const mutationSql=/\b(?:INSERT\s+INTO|UPDATE\s+[A-Za-z_]|DELETE\s+FROM|CREATE\s+(?:TABLE|TYPE|INDEX)|ALTER\s+TABLE|DROP\s+(?:TABLE|TYPE|INDEX))\b/i;
for(const file of readOnlyAdapters){
 assert.doesNotMatch(read(`api/${file}`),mutationSql,`${file} is classified read-only and must not gain direct mutation SQL`);
}

const apiFunctions=fs.readdirSync('api',{withFileTypes:true}).filter(entry=>entry.isFile()&&entry.name.endsWith('.js')).map(entry=>entry.name).sort();
const expected=[...readOnlyAdapters,'import.js','insights.js','knowledge.js','reviews.js'].sort();
assert.deepEqual(apiFunctions,expected,'every deployed API function must remain explicitly classified as read-only or auth-protected write-capable');

console.log('PASS API write surface (all DB/canonical mutations creator-authorized; remaining adapters explicitly read-only)');
