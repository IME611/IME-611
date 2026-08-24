import{getVercelOidcToken}from'@vercel/oidc';

const GATEWAY_BASE='https://ai-gateway.vercel.sh/v1';
const DEFAULT_MODEL='openai/text-embedding-3-small';
const MAX_RECORDS=320;
const MAX_TEXT_CHARS=1400;

const compact=value=>String(value||'').replace(/\s+/gu,' ').trim();
const staticToken=()=>process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN||'';
const hasPotentialAuth=()=>Boolean(staticToken()||process.env.VERCEL);
async function authToken(){
 const direct=staticToken();if(direct)return direct;
 if(!process.env.VERCEL)return'';
 try{return await getVercelOidcToken()||''}catch{return''}
}

export class SemanticMatcherUnavailableError extends Error {
  constructor(message='Semantic matcher is not configured'){
    super(message);
    this.name='SemanticMatcherUnavailableError';
    this.code='SEMANTIC_MATCHER_UNAVAILABLE';
  }
}

function cosine(a,b){
  if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length||!a.length)return 0;
  let dot=0,na=0,nb=0;
  for(let i=0;i<a.length;i+=1){const x=Number(a[i])||0,y=Number(b[i])||0;dot+=x*y;na+=x*x;nb+=y*y}
  return na&&nb?dot/(Math.sqrt(na)*Math.sqrt(nb)):0;
}

function cleanRecords(records=[]){
  const seen=new Set(),out=[];
  for(const record of records){
    const id=String(record?.id||''),text=compact(record?.text).slice(0,MAX_TEXT_CHARS);
    if(!id||!text||seen.has(id))continue;
    seen.add(id);out.push({...record,id,text});
    if(out.length>=MAX_RECORDS)break;
  }
  return out;
}

async function gatewayEmbeddings(model,values){
  const token=await authToken();
  if(!token)throw new SemanticMatcherUnavailableError('AI Gateway authentication is unavailable');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12_000);
  try{
    const response=await fetch(`${GATEWAY_BASE}/embeddings`,{
      method:'POST',signal:controller.signal,
      headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},
      body:JSON.stringify({model,input:values}),
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      const error=new Error(`semantic embedding request failed with HTTP ${response.status}`);
      error.code='SEMANTIC_GATEWAY_FAILED';error.status=502;error.gatewayStatus=response.status;error.gatewayError=data?.error?.message||null;throw error;
    }
    const ordered=[...(data.data||[])].sort((a,b)=>Number(a.index)-Number(b.index));
    if(ordered.length!==values.length||ordered.some(item=>!Array.isArray(item.embedding)))throw Object.assign(new Error('semantic embedding response shape is invalid'),{code:'SEMANTIC_GATEWAY_INVALID',status:502});
    return{vectors:ordered.map(item=>item.embedding),model:data.model||model,usage:data.usage||null,providerMetadata:data.providerMetadata||null};
  }finally{clearTimeout(timer)}
}

export class SemanticMatcher {
  get available(){return hasPotentialAuth()}
  get provider(){return this.available?'vercel-ai-gateway':'none'}
  get model(){return this.available?(process.env.EIL_SEMANTIC_EMBEDDING_MODEL||DEFAULT_MODEL):null}

  async rank(query,records,{topK=8}={}){
    const text=compact(query).slice(0,MAX_TEXT_CHARS),pool=cleanRecords(records);
    if(!text)throw Object.assign(new Error('semantic query text is required'),{code:'SEMANTIC_QUERY_REQUIRED',status:400});
    if(!pool.length)return{available:this.available,provider:this.provider,model:this.model,matches:[],usage:null};
    if(!this.available)throw new SemanticMatcherUnavailableError();
    const result=await gatewayEmbeddings(this.model,[text,...pool.map(item=>item.text)]),queryVector=result.vectors[0];
    const matches=pool.map((record,index)=>({...record,score:Number(Math.max(-1,Math.min(1,cosine(queryVector,result.vectors[index+1]))).toFixed(6)),semantic:true}))
      .sort((a,b)=>b.score-a.score)
      .slice(0,Math.max(1,Math.min(25,Number(topK)||8)));
    return{available:true,provider:this.provider,model:result.model,matches,usage:result.usage,providerMetadata:result.providerMetadata};
  }
}

export const semanticMatcher=new SemanticMatcher();

export function semanticCapability(){
  return{
    available:semanticMatcher.available,
    provider:semanticMatcher.provider,
    model:semanticMatcher.model,
    authMode:staticToken()?'static-token':process.env.VERCEL?'vercel-oidc-context':'none',
    requiredFor:['semantic-near-duplicate','synonym-resolution','paraphrase-equivalence'],
    authority:'REVIEW_SUGGESTION_ONLY',
    fallback:'deterministic-concept-aware',
  };
}
