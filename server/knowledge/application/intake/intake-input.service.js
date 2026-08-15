import dns from'node:dns/promises';
import net from'node:net';
import mammoth from'mammoth';
import{PDFParse}from'pdf-parse';

const MAX_FILE_BYTES=12_000_000;
const MAX_URL_BYTES=3_000_000;
const MAX_TEXT_CHARS=500_000;

function fail(code,message,status=400){const error=new Error(message);error.code=code;error.status=status;throw error}
function clean(value,max=2_000){return String(value||'').trim().slice(0,max)}
function decodeBase64(value){
 const raw=String(value||'');if(!raw)return null;
 const bytes=Buffer.from(raw,'base64');if(!bytes.length)fail('EMPTY_FILE','file contains no bytes');
 if(bytes.length>MAX_FILE_BYTES)fail('FILE_TOO_LARGE',`file exceeds ${MAX_FILE_BYTES} bytes`,413);return bytes;
}
function privateIpv4(ip){
 const parts=ip.split('.').map(Number);if(parts.length!==4||parts.some(x=>!Number.isInteger(x)))return true;
 const[a,b]=parts;return a===0||a===10||a===127||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||a>=224;
}
function isPrivateIp(ip){
 const kind=net.isIP(ip);if(kind===4)return privateIpv4(ip);if(kind===6){const value=ip.toLowerCase();return value==='::1'||value==='::'||value.startsWith('fc')||value.startsWith('fd')||value.startsWith('fe8')||value.startsWith('fe9')||value.startsWith('fea')||value.startsWith('feb')||value.startsWith('::ffff:127.')||value.startsWith('::ffff:10.')||value.startsWith('::ffff:192.168.')}return true;
}
async function assertPublicUrl(value){
 let url;try{url=new URL(value)}catch{fail('INVALID_URL','valid URL is required')}
 if(!['http:','https:'].includes(url.protocol))fail('INVALID_URL_SCHEME','only http/https URLs are allowed');
 if(url.username||url.password)fail('URL_CREDENTIALS_BLOCKED','URL credentials are not allowed');
 if(url.port&&!['80','443'].includes(url.port))fail('URL_PORT_BLOCKED','non-standard URL ports are not allowed');
 const records=await dns.lookup(url.hostname,{all:true});if(!records.length||records.some(record=>isPrivateIp(record.address)))fail('PRIVATE_URL_BLOCKED','private or local network URLs are not allowed');
 return url;
}
function htmlToText(html){
 return String(html||'')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
  .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/&nbsp;|&#160;/gi,' ')
  .replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
  .replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')
  .replace(/[ \t]+/g,' ').replace(/\n\s*\n\s*\n+/g,'\n\n').trim();
}
async function fetchPublicArticle(value){
 let url=await assertPublicUrl(value);
 for(let redirect=0;redirect<=3;redirect+=1){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10_000);
  let response;try{response=await fetch(url,{redirect:'manual',signal:controller.signal,headers:{'user-agent':'EIL-Knowledge-Intake/0.1','accept':'text/html,text/plain,application/json;q=0.8'}})}finally{clearTimeout(timer)}
  if([301,302,303,307,308].includes(response.status)){
   const location=response.headers.get('location');if(!location)fail('URL_REDIRECT_INVALID','redirect has no location',422);
   url=await assertPublicUrl(new URL(location,url).toString());continue;
  }
  if(!response.ok)fail('URL_FETCH_FAILED',`article fetch returned HTTP ${response.status}`,422);
  const length=Number(response.headers.get('content-length')||0);if(length>MAX_URL_BYTES)fail('URL_TOO_LARGE',`article exceeds ${MAX_URL_BYTES} bytes`,413);
  const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>MAX_URL_BYTES)fail('URL_TOO_LARGE',`article exceeds ${MAX_URL_BYTES} bytes`,413);
  const type=String(response.headers.get('content-type')||'text/plain').toLowerCase();
  if(!/(?:text\/|application\/(?:json|xml|xhtml\+xml))/.test(type))fail('URL_CONTENT_UNSUPPORTED',`unsupported article content type: ${type}`,415);
  const raw=bytes.toString('utf8'),text=type.includes('html')||type.includes('xhtml')?htmlToText(raw):raw.trim();
  if(!text)fail('URL_EMPTY','article contains no readable text',422);
  return{text,bytes,finalUrl:url.toString(),mimeType:type.split(';')[0]||'text/plain'};
 }
 fail('URL_REDIRECT_LIMIT','too many redirects',422);
}
async function extractFileText(fileName,mimeType,bytes){
 const lower=String(fileName||'').toLowerCase(),mime=String(mimeType||'application/octet-stream').toLowerCase();
 if(mime.startsWith('image/')||/\.(png|jpe?g|webp|gif)$/i.test(lower))return null;
 if(lower.endsWith('.pdf')||mime==='application/pdf'){
  const parser=new PDFParse({data:bytes});try{const result=await parser.getText();return String(result.text||'')}finally{await parser.destroy()}
 }
 if(lower.endsWith('.docx')||mime.includes('wordprocessingml')){const result=await mammoth.extractRawText({buffer:bytes});return result.value}
 if(lower.match(/\.(txt|md|csv|json|html?|xml)$/)||mime.startsWith('text/')||mime.includes('json')||mime.includes('xml')){
  const raw=bytes.toString('utf8');return lower.match(/\.html?$/)||mime.includes('html')?htmlToText(raw):raw;
 }
 fail('UNSUPPORTED_FILE_TYPE','supported files: PDF, DOCX, TXT, MD, CSV, JSON, HTML, XML, and images with supplied description/text',415);
}
function limitText(value){const text=String(value||'').trim();if(!text)fail('EMPTY_TEXT','input contains no readable text',422);if(text.length>MAX_TEXT_CHARS)fail('TEXT_TOO_LARGE',`extracted text exceeds ${MAX_TEXT_CHARS} characters`,413);return text}

export async function resolveIntakeInput(body={}){
 const suppliedText=String(body.text||body.content||body.caption||'').trim(),fileBytes=decodeBase64(body.fileBase64||body.imageBase64),sourceUrl=clean(body.url||body.sourceUrl,4_000),fileName=clean(body.fileName||body.sourceFilename,500),mimeType=clean(body.mimeType||'',200);
 let kind=clean(body.kind,30).toUpperCase(),text='',originalBytes=fileBytes,finalUrl=sourceUrl,finalMime=mimeType||'text/plain';
 if(fileBytes){
  const image=(mimeType||'').toLowerCase().startsWith('image/')||/\.(png|jpe?g|webp|gif)$/i.test(fileName);
  kind=image?'IMAGE':'FILE';
  if(image){if(!suppliedText)fail('IMAGE_TEXT_REQUIRED','image intake requires supplied visual description/text until a multimodal provider is connected',422);text=suppliedText}
  else text=suppliedText||await extractFileText(fileName,finalMime,fileBytes);
 }else if(sourceUrl){
  kind='URL';
  if(suppliedText){text=suppliedText;originalBytes=Buffer.from(suppliedText,'utf8')}
  else{const fetched=await fetchPublicArticle(sourceUrl);text=fetched.text;originalBytes=fetched.bytes;finalUrl=fetched.finalUrl;finalMime=fetched.mimeType}
 }else{
  kind=['TOPIC','NOTE','TEXT'].includes(kind)?kind:'TEXT';text=suppliedText;originalBytes=Buffer.from(text,'utf8');
 }
 text=limitText(text);
 const title=clean(body.title,500)||fileName.replace(/\.[^.]+$/,'')||finalUrl||text.slice(0,90);
 return{kind,title,sourceUrl:finalUrl||null,fileName:fileName||(`${kind.toLowerCase()}.txt`),mimeType:finalMime||'text/plain',text,originalBytes:originalBytes||Buffer.from(text,'utf8'),metadata:{imageAnalysisMode:kind==='IMAGE'?'SUPPLIED_DESCRIPTION':'NATIVE_TEXT',urlFetched:Boolean(sourceUrl&&!suppliedText)}};
}
