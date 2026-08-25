import assert from'node:assert/strict';
import fs from'node:fs';
import{normalizeDatabaseUrl}from'../../server/shared/postgres.js';

const sample='postgres://user:pass@example.com:5432/eil?sslmode=require&uselibpqcompat=true&application_name=eil';
const normalized=new URL(normalizeDatabaseUrl(sample));
assert.equal(normalized.searchParams.has('sslmode'),false,'sslmode must be removed when pg ssl options are supplied explicitly');
assert.equal(normalized.searchParams.has('uselibpqcompat'),false,'uselibpqcompat must be removed with connection-level SSL mode');
assert.equal(normalized.searchParams.get('application_name'),'eil','unrelated connection parameters must be preserved');

for(const path of['scripts/db/health-check.mjs','scripts/knowledge/verify-quality-gates.mjs']){
 const source=fs.readFileSync(path,'utf8');
 assert.ok(source.includes('normalizeDatabaseUrl'),'production DB checks must use the shared URL normalizer: '+path);
 assert.ok(source.includes('connectionString:normalizeDatabaseUrl(DATABASE_URL)')||source.includes('connectionString: normalizeDatabaseUrl(DATABASE_URL)'),'production DB checks must normalize DATABASE_URL before pg parses it: '+path);
 assert.ok(!source.includes('connectionString:DATABASE_URL,ssl')&&!source.includes('connectionString: DATABASE_URL, ssl'),'raw DATABASE_URL must not be combined with explicit pg ssl options: '+path);
}

console.log('PASS PostgreSQL URL normalization (SSL query modes removed; explicit TLS policy preserved)');
