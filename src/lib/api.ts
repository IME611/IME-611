export async function api<T>(path:string,options:RequestInit={}){const r=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});let data:any={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data.error||`Request failed (${r.status})`);return data as T}
export const health=()=>api<{ok:boolean;database:boolean}>('/api/health');
