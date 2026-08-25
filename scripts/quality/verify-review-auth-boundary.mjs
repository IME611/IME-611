import assert from'node:assert/strict';
import fs from'node:fs';
import reviewHandler from'../../api/reviews.js';

function response(){
 const headers=new Map();
 return{
  statusCode:200,
  body:null,
  headersSent:false,
  setHeader(name,value){headers.set(String(name).toLowerCase(),String(value));return this},
  status(code){this.statusCode=code;return this},
  json(body){this.body=body;this.headersSent=true;return this},
  getHeader(name){return headers.get(String(name).toLowerCase())},
 };
}

async function request(url,method='GET'){
 const req={url,method,headers:{host:'localhost','x-forwarded-proto':'https'},body:{},socket:{remoteAddress:'127.0.0.1'}};
 const res=response();
 await reviewHandler(req,res);
 return res;
}

for(const mode of ['totally-unknown','legacy','foo']){
 const res=await request(`/api/reviews?mode=${mode}`,'POST');
 assert.equal(res.statusCode,404,`unknown mode ${mode} must stop before legacy review handling`);
 assert.equal(res.body?.code,'REVIEW_MODE_NOT_FOUND');
}

for(const url of [
 '/api/reviews',
 '/api/reviews?mode=intake',
 '/api/reviews?mode=relation-resolution',
 '/api/reviews?mode=publication-placement',
 '/api/reviews?mode=console',
]){
 const res=await request(url);
 assert.equal(res.statusCode,401,`${url} must require creator authorization before DB access`);
 assert.equal(res.body?.code,'EDITOR_AUTH_REQUIRED');
}

const route=fs.readFileSync(new URL('../../api/reviews.js',import.meta.url),'utf8');
const migration=fs.readFileSync(new URL('../../database/migrations/012_legacy_review_boundary.sql',import.meta.url),'utf8');
assert.doesNotMatch(route,/CREATE TABLE IF NOT EXISTS knowledge_reviews/i,'HTTP requests must never create the legacy review table');
assert.match(route,/const PROTECTED_MODES=new Set\(\['intake','relation-resolution','publication-placement','console'\]\)/,'protected review modes must be explicit');
assert.match(route,/const PUBLIC_MODES=new Set\(\['intake-health','backend-health'\]\)/,'only read-only health modes may be public');
assert.match(route,/if\(mode&&!KNOWN_MODES\.has\(mode\)\)return res\.status\(404\)/,'unknown modes must be rejected before DB access');
assert.ok(route.indexOf("if(mode&&!KNOWN_MODES.has(mode))")<route.indexOf('const db=getDb()'),'unknown mode rejection must happen before opening DB');
assert.match(migration,/CREATE TABLE IF NOT EXISTS knowledge_reviews/i,'legacy compatibility table must be migration-owned');

console.log('PASS review auth boundary (unknown modes fail closed; protected modes require creator auth; no request-time DDL)');
