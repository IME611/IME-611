import crypto from'node:crypto';

// Public repo contains only a SHA-256 verifier, never the editor key itself.
// Set EIL_EDITOR_KEY_HASH in Vercel later to rotate without code changes.
const FALLBACK_EDITOR_KEY_HASH='c39dee9c314a250ba35354de534187498c4234696683281d8f1e6457b2cdb672';
const sha256=value=>crypto.createHash('sha256').update(String(value||'')).digest('hex');

function suppliedKey(req){
 const authorization=String(req.headers?.authorization||'');
 if(/^Bearer\s+/i.test(authorization))return authorization.replace(/^Bearer\s+/i,'').trim();
 const encoded=String(req.headers?.['x-eil-editor-key-b64']||'').trim();
 if(encoded){try{return Buffer.from(encoded,'base64url').toString('utf8').trim()}catch{return''}}
 return String(req.headers?.['x-eil-editor-key']||'').trim();
}
export function isEditorAuthorized(req){
 const key=suppliedKey(req),expected=String(process.env.EIL_EDITOR_KEY_HASH||FALLBACK_EDITOR_KEY_HASH).toLowerCase();
 if(!key||!/^[0-9a-f]{64}$/i.test(expected))return false;
 const actual=sha256(key),a=Buffer.from(actual,'hex'),b=Buffer.from(expected,'hex');
 return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
export function requireEditor(req,res){
 if(isEditorAuthorized(req))return true;
 res.setHeader('WWW-Authenticate','Bearer realm="E.I.L Creator Review"');
 res.status(401).json({ok:false,error:'creator authorization required',code:'EDITOR_AUTH_REQUIRED'});
 return false;
}
