import{editorHeaders}from'../../core/editorAccess';

export type IntakeVerdict='EXISTS'|'EXTENDS'|'CONFLICTS'|'NEW'|'RELATED'|'UNCERTAIN';

export type IntakeMatch={
 authority?:string;
 id?:string;
 text?:string;
 sourceFile?:string;
 sourceTitle?:string;
 score?:number;
};

export type IntakeAnalysis={
 ok:true;
 verdict:{verdict:IntakeVerdict;confidence:number;reason:string;provisional:boolean};
 exactSourceMatch?:{id:string;title:string;sourceFile?:string|null}|null;
 atomic?:{analyzed:number;byVerdict?:Partial<Record<IntakeVerdict,number>>};
 closestExistingKnowledge?:IntakeMatch[];
 newMaterial?:{count:number;sample?:Array<{text:string}>};
 conflicts?:{count:number;sample?:Array<{text:string}>};
 placement?:{suggestedDrawer?:{label:string;confidence:number}|null};
 staging?:{persisted:boolean;id:string|null;status?:string};
 policy?:{canonicalWrites:boolean;autoMerge:boolean};
};

export type IntakeInput={
 title?:string;
 text?:string;
 url?:string;
 fileName?:string;
 mimeType?:string;
 fileBase64?:string;
};

type IntakeDecision='APPROVE'|'REJECT';

async function request<T>(url:string,key:string,init:RequestInit):Promise<T>{
 const response=await fetch(url,{...init,headers:{'Content-Type':'application/json',...editorHeaders(key),...(init.headers||{})}});
 const payload=await response.json().catch(()=>null)as({error?:string;code?:string}|null);
 if(response.status===401)throw new Error('מפתח היוצר אינו תקין. החומר לא נשמר.');
 if(response.status===413)throw new Error('הקובץ גדול מדי לבדיקה. נסה קובץ קטן יותר.');
 if(!response.ok)throw new Error(payload?.error||'לא ניתן היה להשלים את בדיקת המקור.');
 return payload as T;
}

export const sourceIntakeApi={
 async verifyAccess(key:string):Promise<void>{
  await request('/api/import',key,{method:'POST',body:JSON.stringify({mode:'verify-access'})});
 },
 analyze(input:IntakeInput,key:string):Promise<IntakeAnalysis>{
  return request('/api/intake',key,{method:'POST',body:JSON.stringify(input)});
 },
 decide(id:string,action:IntakeDecision,key:string):Promise<Record<string,unknown>>{
  return request(`/api/intake?id=${encodeURIComponent(id)}`,key,{method:'PATCH',body:JSON.stringify({action,reviewedBy:'creator'})});
 },
};
