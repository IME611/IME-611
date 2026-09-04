import assert from'node:assert/strict';
import fs from'node:fs';
import path from'node:path';

const root=process.cwd();
const generatedRootDirs=new Set(['.git','.vercel','node_modules','dist','coverage']);
const directories=(relative,{ignoreGenerated=false}={})=>fs.readdirSync(path.join(root,relative),{withFileTypes:true}).filter(entry=>entry.isDirectory()&&(!ignoreGenerated||!generatedRootDirs.has(entry.name))).map(entry=>entry.name).sort();
const expectDirs=(relative,expected,options)=>assert.deepEqual(directories(relative,options),[...expected].sort(),`${relative||'.'} folder layout drifted; update the architecture deliberately instead of accumulating parallel drawers`);

expectDirs('.', ['.github','api','data','database','docs','scripts','server','src'],{ignoreGenerated:true});
expectDirs('src',['app','core','data','design','features','lib']);
expectDirs('src/features',['accessibility','crystals','editor','journey','knowledge-dashboard','navigation','sources','welcome']);
expectDirs('server',['knowledge','shared','synthesis']);
expectDirs('scripts',['db','knowledge','quality']);
expectDirs('database',['migrations','verification']);
expectDirs('docs',['engineering','product']);

for(const obsolete of[
 'public',
 'database/schema.sql',
 'src/features/cards',
 'src/features/dashboard',
 'src/features/evolution',
 'src/features/media',
 'src/features/research',
 'src/features/shell',
 'src/features/transformation',
 'server/learning-paths',
])assert.equal(fs.existsSync(path.join(root,obsolete)),false,`${obsolete} is obsolete and must not return without an explicit architecture change`);

console.log('PASS repository layout (tracked root/frontend/server/scripts/database/docs drawers match the current architecture)');
