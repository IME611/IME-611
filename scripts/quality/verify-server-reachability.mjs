import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const extensions=['.js','.mjs','.cjs','.ts','.json'];
const implementationExtensions=new Set(['.js','.mjs','.cjs','.ts']);

function walk(dir){
 if(!fs.existsSync(dir))return[];
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const absolute=path.join(dir,entry.name);
  return entry.isDirectory()?walk(absolute):[absolute];
 });
}
function relative(absolute){return path.relative(root,absolute).split(path.sep).join('/')}
function resolveImport(fromFile,specifier){
 if(!specifier.startsWith('.'))return null;
 const base=path.resolve(path.dirname(fromFile),specifier),candidates=[];
 if(extensions.includes(path.extname(base)))candidates.push(base);
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
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
 ];
 const values=[];
 for(const pattern of patterns){for(const match of content.matchAll(pattern))values.push(match[1])}
 return values;
}

const roots=[
 ...walk(path.join(root,'api')).filter(file=>implementationExtensions.has(path.extname(file))),
 ...walk(path.join(root,'scripts')).filter(file=>implementationExtensions.has(path.extname(file))),
];
assert.ok(roots.length>0,'backend audit requires api or script entry points');
const reachable=new Set(),queue=[...roots];
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

const serverFiles=walk(path.join(root,'server')).filter(file=>implementationExtensions.has(path.extname(file)));
const unreachable=serverFiles.filter(file=>!reachable.has(file)).map(relative).sort();
if(unreachable.length){
 console.error(`UNREACHABLE SERVER FILES (${unreachable.length})`);
 for(const file of unreachable)console.error(` - ${file}`);
}
assert.deepEqual(unreachable,[],'server must not contain unreachable implementation files; remove obsolete code or connect it through an intentional api/script entry point');
console.log(`PASS server reachability (${serverFiles.length} server modules; no orphan implementation files)`);
