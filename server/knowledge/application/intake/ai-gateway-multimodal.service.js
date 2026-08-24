const GATEWAY_BASE='https://ai-gateway.vercel.sh/v1';
const DEFAULT_VISION_MODEL='anthropic/claude-opus-5';
const DEFAULT_FALLBACK_MODEL='google/gemini-3.6-flash';
const MAX_IMAGE_BYTES=8_000_000;
const ALLOWED_MIME=new Set(['image/png','image/jpeg','image/webp','image/gif']);

const token=()=>process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN||'';
const compact=value=>String(value||'').replace(/\s+/gu,' ').trim();

export function multimodalCapability(){
 return{
  available:Boolean(token()),
  provider:Boolean(token())?'vercel-ai-gateway':'none',
  model:Boolean(token())?(process.env.EIL_VISION_MODEL||DEFAULT_VISION_MODEL):null,
  fallbackModel:Boolean(token())?(process.env.EIL_VISION_FALLBACK_MODEL||DEFAULT_FALLBACK_MODEL):null,
  authority:'SOURCE_DESCRIPTION_DRAFT_ONLY',
  fallback:'creator-supplied-description',
 };
}

export async function describeImageForKnowledgeIntake({bytes,mimeType,fileName=''}){
 const auth=token();
 if(!auth)throw Object.assign(new Error('native image understanding is unavailable; supply a description or enable Vercel AI Gateway'),{code:'IMAGE_AI_UNAVAILABLE',status:503});
 if(!Buffer.isBuffer(bytes)||!bytes.length)throw Object.assign(new Error('image bytes are required'),{code:'IMAGE_BYTES_REQUIRED',status:400});
 if(bytes.length>MAX_IMAGE_BYTES)throw Object.assign(new Error(`native image analysis supports images up to ${MAX_IMAGE_BYTES} bytes`),{code:'IMAGE_AI_TOO_LARGE',status:413});
 const mime=String(mimeType||'image/jpeg').toLowerCase().split(';')[0];
 if(!ALLOWED_MIME.has(mime))throw Object.assign(new Error(`unsupported image type for native analysis: ${mime}`),{code:'IMAGE_AI_TYPE_UNSUPPORTED',status:415});
 const model=process.env.EIL_VISION_MODEL||DEFAULT_VISION_MODEL,fallback=process.env.EIL_VISION_FALLBACK_MODEL||DEFAULT_FALLBACK_MODEL;
 const prompt=`Analyze this image as source material for a personal knowledge corpus. Return a faithful Hebrew description only. Include: (1) what is visibly present, (2) all readable text transcribed as accurately as possible, (3) explicit concepts/claims shown by the image, and (4) uncertainty where details are unclear. Do not infer hidden facts, diagnose people, or convert interpretations into verified facts. File: ${compact(fileName).slice(0,180)||'image'}.`;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20_000);
 try{
  const response=await fetch(`${GATEWAY_BASE}/chat/completions`,{
   method:'POST',signal:controller.signal,
   headers:{authorization:`Bearer ${auth}`,'content-type':'application/json'},
   body:JSON.stringify({model,models:[fallback],messages:[{role:'user',content:[{type:'text',text:prompt},{type:'image_url',image_url:{url:`data:${mime};base64,${bytes.toString('base64')}`,detail:'auto'}}]}],stream:false}),
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const error=new Error(`native image analysis failed with HTTP ${response.status}`);error.code='IMAGE_AI_FAILED';error.status=502;error.gatewayStatus=response.status;error.gatewayError=data?.error?.message||null;throw error}
  const description=compact(data?.choices?.[0]?.message?.content);
  if(!description)throw Object.assign(new Error('native image analysis returned no readable description'),{code:'IMAGE_AI_EMPTY',status:502});
  return{text:description,provider:'vercel-ai-gateway',model:data.model||model,usage:data.usage||null};
 }finally{clearTimeout(timer)}
}
