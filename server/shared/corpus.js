import fs from'fs';
import path from'path';
import zlib from'zlib';

export function readJson(relativeFile){return JSON.parse(fs.readFileSync(path.join(process.cwd(),relativeFile),'utf8'))}

export function loadCorpus(){
 const dir=path.join(process.cwd(),'data'),parts=[];
 for(let i=1;i<=99;i++){
  const file=path.join(dir,`chapters.part${String(i).padStart(2,'0')}.b64`);
  if(!fs.existsSync(file))break;
  parts.push(fs.readFileSync(file,'utf8').trim());
 }
 if(!parts.length)throw Error('chapter corpus parts missing');
 const chapters=JSON.parse(zlib.gunzipSync(Buffer.from(parts.join(''),'base64')).toString('utf8'));
 if(!Array.isArray(chapters)||chapters.length!==18)throw Error('corpus integrity failed');
 return chapters;
}

export const normalizeText=value=>String(value||'').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
export const tokenize=value=>[...new Set(String(value||'').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(token=>token.length>2))];
