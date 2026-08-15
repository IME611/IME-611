import assert from'node:assert/strict';
import pg from'pg';

const{Client}=pg;
const DATABASE_URL=process.env.DATABASE_URL;
if(!DATABASE_URL)throw new Error('DATABASE_URL is required for corpus quality gates');
const ssl=process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false};
const client=new Client({connectionString:DATABASE_URL,ssl});
const scalar=async(sql,params=[])=>Number((await client.query(sql,params)).rows[0]?.count||0);

await client.connect();
try{
 const checks={};
 checks.sources=await scalar('SELECT COUNT(*) FROM sources');
 checks.fragments=await scalar('SELECT COUNT(*) FROM source_fragments');
 checks.candidates=await scalar('SELECT COUNT(*) FROM extraction_candidates WHERE NOT exclude_from_knowledge');
 checks.candidatesWithoutEvidence=await scalar(`SELECT COUNT(*) FROM extraction_candidates c WHERE NOT c.exclude_from_knowledge AND NOT EXISTS(SELECT 1 FROM extraction_candidate_evidence e WHERE e.candidate_id=c.id)`);
 checks.unverifiedCandidateEvidence=await scalar('SELECT COUNT(*) FROM extraction_candidate_evidence WHERE NOT exact_quote_verified');
 checks.candidateSourceQuoteMismatch=await scalar(`SELECT COUNT(*) FROM extraction_candidates c JOIN sources s ON s.id=c.source_id WHERE NOT c.exclude_from_knowledge AND substring(s.raw_content FROM c.source_start+1 FOR c.source_end-c.source_start) IS DISTINCT FROM c.exact_quote`);
 checks.evidenceFragmentQuoteMismatch=await scalar(`SELECT COUNT(*) FROM extraction_candidate_evidence e JOIN source_fragments f ON f.id=e.fragment_id WHERE substring(f.raw_text FROM e.fragment_start+1 FOR e.fragment_end-e.fragment_start) IS DISTINCT FROM e.exact_quote`);
 checks.evidenceSourceMismatch=await scalar(`SELECT COUNT(*) FROM extraction_candidate_evidence e JOIN extraction_candidates c ON c.id=e.candidate_id JOIN source_fragments f ON f.id=e.fragment_id WHERE c.source_id<>f.source_id`);
 checks.claimsWithoutEvidence=await scalar(`SELECT COUNT(*) FROM claims c WHERE c.status<>'REJECTED' AND NOT EXISTS(SELECT 1 FROM evidence e WHERE e.claim_id=c.id)`);
 checks.approvedRelationsWithUnresolvedEndpoints=await scalar(`SELECT COUNT(*) FROM relation_candidates WHERE review_status='APPROVED' AND endpoint_resolution<>'MAPPED'`);
 checks.nonExplicitRelationEvidence=await scalar(`SELECT COUNT(*) FROM relation_candidates WHERE evidence_mode<>'EXPLICIT_LINGUISTIC'`);
 checks.relationSourceAtomMismatch=await scalar(`SELECT COUNT(*) FROM relation_candidates r JOIN extraction_candidates c ON c.id=r.source_atom_id WHERE r.source_id<>c.source_id`);
 checks.reviewDecisionsMissingReviewer=await scalar(`SELECT COUNT(*) FROM review_decisions WHERE length(trim(reviewer))=0`);
 checks.pendingIntakeWithCanonicalSource=await scalar(`SELECT COUNT(*) FROM intake_submissions WHERE review_status='PENDING' AND approved_source_id IS NOT NULL`);
 checks.rejectedIntakeWithCanonicalSource=await scalar(`SELECT COUNT(*) FROM intake_submissions WHERE review_status='REJECTED' AND approved_source_id IS NOT NULL`);

 assert.ok(checks.sources>=18,'canonical source corpus unexpectedly shrank below seed baseline');
 assert.ok(checks.fragments>=18,'canonical fragment corpus unexpectedly shrank below seed baseline');
 assert.ok(checks.candidates>0,'knowledge candidate layer must be non-empty');
 for(const name of ['candidatesWithoutEvidence','unverifiedCandidateEvidence','candidateSourceQuoteMismatch','evidenceFragmentQuoteMismatch','evidenceSourceMismatch','claimsWithoutEvidence','approvedRelationsWithUnresolvedEndpoints','nonExplicitRelationEvidence','relationSourceAtomMismatch','reviewDecisionsMissingReviewer','pendingIntakeWithCanonicalSource','rejectedIntakeWithCanonicalSource'])assert.equal(checks[name],0,`${name} must be zero`);

 console.log(JSON.stringify({ok:true,phase:'CORPUS_QUALITY_GATES_V0_1',checks,policy:{everyCandidateTraceable:true,exactQuotesVerified:true,canonicalClaimsEvidenceBacked:true,unresolvedRelationsCannotBeApproved:true,reviewDecisionsAttributed:true,intakeReviewGatePreserved:true}},null,2));
}finally{await client.end()}
