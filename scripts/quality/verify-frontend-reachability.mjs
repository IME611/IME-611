import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const srcRoot=path.join(root,'src');
const extensions=['.ts','.tsx','.js','.jsx','.css','.json'];
const sourceExtensions=new Set(['.ts','.tsx','.js','.jsx','.css']);

function walk(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const absolute=path.join(dir,entry.name);
  return entry.isDirectory()?walk(absolute):[absolute];
 });
}

function relative(absolute){return path.relative(root,absolute).split(path.sep).join('/')}
function isTrackedFrontendFile(absolute){
 const rel=relative(absolute);
 if(rel==='src/vite-env.d.ts'||rel.endsWith('/README.md'))return false;
 return sourceExtensions.has(path.extname(absolute));
}

function resolveImport(fromFile,specifier){
 if(!specifier.startsWith('.'))return null;
 const base=path.resolve(path.dirname(fromFile),specifier);
 const candidates=[];
 if(path.extname(base))candidates.push(base);
 else{
  for(const ext of extensions)candidates.push(base+ext);
  for(const ext of extensions)candidates.push(path.join(base,'index'+ext));
 }
 return candidates.find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile())??null;
}

function importSpecifiers(content){
 const patterns=[
  /(?:import|export)\s*(?:[^'"()]*?from\s*)?['"]([^'"]+)['"]/g,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
 ];
 const values=[];
 for(const pattern of patterns){for(const match of content.matchAll(pattern))values.push(match[1])}
 return values;
}

const entry=path.join(srcRoot,'main.tsx');
assert.ok(fs.existsSync(entry),'src/main.tsx must exist');
const reachable=new Set();
const queue=[entry];
while(queue.length){
 const file=queue.pop();
 if(!file||reachable.has(file))continue;
 reachable.add(file);
 const content=fs.readFileSync(file,'utf8');
 for(const specifier of importSpecifiers(content)){
  const resolved=resolveImport(file,specifier);
  if(resolved&&!reachable.has(resolved))queue.push(resolved);
 }
}

const tracked=walk(srcRoot).filter(isTrackedFrontendFile);
const unreachable=tracked.filter(file=>!reachable.has(file)).map(relative).sort();
if(unreachable.length){
 console.error(`UNREACHABLE FRONTEND FILES (${unreachable.length})`);
 for(const file of unreachable)console.error(` - ${file}`);
}
assert.deepEqual(unreachable,[],'src must not contain unreachable implementation files; delete obsolete code or connect it through an intentional entry point');

console.log(`PASS frontend reachability (${reachable.size} reachable modules; no orphan implementation files)`);
