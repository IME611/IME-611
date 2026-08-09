export type ContentKind='ידע'|'רעיון'|'סיכום'|'קישור'|'ציטוט'|'הערה';
export const CONTENT_KINDS:ContentKind[]=['ידע','רעיון','סיכום','קישור','ציטוט','הערה'];
export function normalizeTags(value:string|string[]|undefined){const list=Array.isArray(value)?value:value?.split(',')||[];return [...new Set(list.map(x=>String(x).trim()).filter(Boolean))]}
export function isUrl(value:string){try{new URL(value);return true}catch{return false}}
