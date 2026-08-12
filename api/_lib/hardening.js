const buckets=new Map();

export function applySecurityHeaders(res){
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 res.setHeader('Cache-Control','no-store');
}

export function requestUrl(req){
 const host=String(req.headers?.host||'localhost');
 const proto=String(req.headers?.['x-forwarded-proto']||'https');
 return new URL(String(req.url||'/'),`${proto}://${host}`);
}

export function rateLimit(req,{limit=30,windowMs=60_000,keyPrefix='api'}={}){
 const forwarded=String(req.headers?.['x-forwarded-for']||'').split(',')[0].trim();
 const ip=forwarded||req.socket?.remoteAddress||'unknown';
 const now=Date.now(),key=`${keyPrefix}:${ip}`;
 const current=buckets.get(key);
 if(!current||current.resetAt<=now){buckets.set(key,{count:1,resetAt:now+windowMs});return{ok:true,remaining:limit-1,resetAt:now+windowMs}}
 current.count+=1;
 if(current.count>limit)return{ok:false,remaining:0,resetAt:current.resetAt};
 return{ok:true,remaining:limit-current.count,resetAt:current.resetAt};
}

export function rejectLargeJson(req,res,maxBytes=2_000_000){
 const length=Number(req.headers?.['content-length']||0);
 if(length>maxBytes){res.status(413).json({ok:false,error:'payload too large'});return true}
 return false;
}

export function text(value,{max=200_000,trim=true}={}){
 const out=String(value??'');
 const safe=trim?out.trim():out;
 if(safe.length>max)throw new Error(`input exceeds ${max} characters`);
 return safe;
}

export function safeError(error,fallback='request failed'){
 const message=String(error?.message||fallback);
 if(/password|secret|token|database_url|postgres:\/\//i.test(message))return fallback;
 return message.slice(0,240);
}

export function logEvent(level,event,details={}){
 const sanitized={...details};
 for(const key of Object.keys(sanitized))if(/password|secret|token|authorization|cookie|database/i.test(key))sanitized[key]='[redacted]';
 const entry={ts:new Date().toISOString(),level,event,...sanitized};
 const line=JSON.stringify(entry);
 if(level==='error')console.error(line);else if(level==='warn')console.warn(line);else console.log(line);
}

export function withHardening(handler,options={}){
 return async function hardened(req,res){
  applySecurityHeaders(res);
  const limited=rateLimit(req,options.rateLimit);
  res.setHeader('X-RateLimit-Remaining',String(limited.remaining));
  if(!limited.ok)return res.status(429).json({ok:false,error:'too many requests'});
  if(rejectLargeJson(req,res,options.maxBytes))return;
  try{return await handler(req,res)}catch(error){
   logEvent('error','api.unhandled',{route:req.url,method:req.method,message:safeError(error)});
   if(!res.headersSent)return res.status(500).json({ok:false,error:'internal server error'});
  }
 };
}
