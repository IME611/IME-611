import crypto from 'crypto';
const CLAIM_TYPES=new Set(['FACTUAL','INTERPRETIVE','CAUSAL','NORMATIVE','DEFINITIONAL','EXPERIENTIAL','HYPOTHESIS']);
const EVIDENCE_RELATIONS=new Set(['SUPPORTS','CONTRADICTS','CONTEXTUALIZES']);
const normalize=v=>String(v||'').normalize('NFKC').replace(/\s+/g,' ').trim();
const sha256=v=>crypto.createHash('sha256').update(v).digest('hex');
export function normalizedClaimHash(statement){const n=normalize(statement).toLocaleLowerCase('en-US');if(!n)throw new Error('Claim statement is required.');return sha256(n)}
export async function createEvidenceBackedClaim({repository,input}){
 const statement=normalize(input.statement);if(!statement)throw new Error('Claim statement is required.');
 if(!CLAIM_TYPES.has(input.type))throw new Error(`Unsupported claim type: ${input.type}`);if(!input.fragmentId)throw new Error('A claim cannot be created without a SourceFragment.');
 const relation=input.evidenceRelation||'SUPPORTS';if(!EVIDENCE_RELATIONS.has(relation))throw new Error(`Unsupported evidence relation: ${relation}`);
 const fragment=await repository.getFragmentWithSource(input.fragmentId);if(!fragment)throw new Error('SourceFragment does not exist or is detached from Source.');
 const quote=normalize(input.quote||'');if(quote&&!normalize(fragment.raw_text).includes(quote))throw new Error('Evidence quote must exist verbatim inside the canonical SourceFragment.');
 return repository.transaction(async tx=>{const extractionMethod=input.extractionMethod||'manual-v1';const modelVersion=input.modelVersion||null;
  const claim=await tx.upsertClaim({statement,normalizedHash:normalizedClaimHash(statement),type:input.type,modelConfidence:input.modelConfidence??null,status:'EXTRACTED',extractionMethod,modelVersion,metadata:input.metadata||{}});
  const evidence=await tx.upsertEvidence({claimId:claim.id,fragmentId:fragment.id,relation,evidenceStrength:input.evidenceStrength??1,extractionMethod,modelVersion});
  await tx.upsertProvenance({derivedEntityType:'CLAIM',derivedEntityId:claim.id,sourceEntityType:'SOURCE_FRAGMENT',sourceEntityId:fragment.id,relation:'DERIVED_FROM',weight:input.evidenceStrength??1,extractionMethod,modelVersion,metadata:quote?{quote}:{}});
  return{claim,evidence,fragment};});
}
