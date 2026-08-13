const OWNER_KEY='eil-owner-id-v1';

function createId():string{
 if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return crypto.randomUUID();
 return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&0x3)|0x8;return v.toString(16)});
}

export function getOwnerId():string{
 if(typeof window==='undefined')return'';
 const existing=window.localStorage.getItem(OWNER_KEY);
 if(existing)return existing;
 const id=createId();
 window.localStorage.setItem(OWNER_KEY,id);
 return id;
}

export function ownerHeaders():Record<string,string>{
 const ownerId=getOwnerId();
 return ownerId?{'x-eil-owner-id':ownerId}:{};
}

export const ownerIdentityStorageKey=OWNER_KEY;
