import assert from'node:assert/strict';
import pg from'pg';

const{Client}=pg;
const DATABASE_URL=process.env.DATABASE_URL;
if(!DATABASE_URL)throw new Error('DATABASE_URL is required for corpus quality gates');
const ssl=process.env.DATABASE_SSL==='false'?false:{rejectUnauthorized:false};
const client=new Client({connectionString:DATABASE_URL,ssl});
const scalar=async(sql,params=[])=>Number((await client.query(sql,params)).rows[0]?.count||0);
const expectedMigrations=[
 'database/migrations/001_knowledge_foundation.sql',
 'database/migrations/002_legacy_source_backfill.sql',
 'database/migrations/003_product_runtime_foundation.sql',
 'database/migrations/004_user_state_and_inbox.sql',
 'database/migrations/005_atomic_extraction_candidates.sql',
 'database/migrations/006_relation_candidates.sql',
 'database/migrations/007_intake_submissions.sql',
 'database/migrations/008_review_decisions.sql',
 'database/migrations/009_source_publications.sql',
];

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
 checks.orphanExtractionReviewDecisions=await scalar(`SELECT COUNT(*) FROM review_decisions d WHERE d.subject_type='EXTRACTION_CANDIDATE' AND NOT EXISTS(SELECT 1 FROM extraction_candidates c WHERE c.id::text=d.subject_key)`);
 checks.orphanRelationReviewDecisions=await scalar(`SELECT COUNT(*) FROM review_decisions d WHERE d.subject_type='RELATION_CANDIDATE' AND NOT EXISTS(SELECT 1 FROM relation_candidates r WHERE r.id::text=d.subject_key)`);
 checks.pendingIntakeWithCanonicalSource=await scalar(`SELECT COUNT(*) FROM intake_submissions WHERE review_status='PENDING' AND approved_source_id IS NOT NULL`);
 checks.rejectedIntakeWithCanonicalSource=await scalar(`SELECT COUNT(*) FROM intake_submissions WHERE review_status='REJECTED' AND approved_source_id IS NOT NULL`);
 checks.approvedIntakeWithoutCanonicalSource=await scalar(`SELECT COUNT(*) FROM intake_submissions WHERE review_status='APPROVED' AND approved_source_id IS NULL`);
 checks.publishedSourceWithoutCards=await scalar(`SELECT COUNT(*) FROM source_publications p WHERE p.status='PUBLISHED' AND NOT EXISTS(SELECT 1 FROM published_learning_cards c WHERE c.publication_id=p.id AND c.publication_version=p.publication_version AND c.status='PUBLISHED')`);
 checks.publishedCardOutsideSelectedCandidates=await scalar(`SELECT COUNT(*) FROM published_learning_cards c JOIN source_publications p ON p.id=c.publication_id WHERE c.status='PUBLISHED' AND NOT c.source_candidate_ids <@ p.selected_candidate_ids`);
 checks.publishedCardSourceMismatch=await scalar(`SELECT COUNT(*) FROM published_learning_cards c JOIN extraction_candidates x ON x.id=ANY(c.source_candidate_ids) WHERE c.status='PUBLISHED' AND x.source_id<>c.source_id`);
 checks.publishedCardWordCountFailures=await scalar(`SELECT COUNT(*) FROM published_learning_cards c WHERE c.status='PUBLISHED' AND cardinality(regexp_split_to_array(trim(c.card_text),'\\s+')) NOT BETWEEN 40 AND 90`);
 checks.publishedCandidateVisibilityFailures=await scalar(`SELECT COUNT(*) FROM source_publications p JOIN extraction_candidates c ON c.id=ANY(p.selected_candidate_ids) WHERE p.status='PUBLISHED' AND COALESCE((c.metadata->>'learnerPublished')::boolean,FALSE)=FALSE`);
 checks.repositoryCandidateVisibilityLeaks=await scalar(`SELECT COUNT(*) FROM source_publications p JOIN extraction_candidates c ON c.source_id=p.source_id WHERE p.status<>'PUBLISHED' AND COALESCE((c.metadata->>'learnerPublished')::boolean,FALSE)=TRUE`);
 checks.migrationsApplied=await scalar(`SELECT COUNT(*) FROM schema_migrations WHERE name=ANY($1::text[])`,[expectedMigrations]);
 checks.migrationChecksumShapeFailures=await scalar(`SELECT COUNT(*) FROM schema_migrations WHERE name=ANY($1::text[]) AND checksum !~ '^[0-9a-f]{64}$'`,[expectedMigrations]);

 assert.ok(checks.sources>=18,'canonical source corpus unexpectedly shrank below seed baseline');
 assert.ok(checks.fragments>=18,'canonical fragment corpus unexpectedly shrank below seed baseline');
 assert.ok(checks.candidates>0,'knowledge candidate layer must be non-empty');
 assert.equal(checks.migrationsApplied,expectedMigrations.length,'all canonical migrations 001-009 must be recorded');
 for(const name of ['candidatesWithoutEvidence','unverifiedCandidateEvidence','candidateSourceQuoteMismatch','evidenceFragmentQuoteMismatch','evidenceSourceMismatch','claimsWithoutEvidence','approvedRelationsWithUnresolvedEndpoints','nonExplicitRelationEvidence','relationSourceAtomMismatch','reviewDecisionsMissingReviewer','orphanExtractionReviewDecisions','orphanRelationReviewDecisions','pendingIntakeWithCanonicalSource','rejectedIntakeWithCanonicalSource','approvedIntakeWithoutCanonicalSource','publishedSourceWithoutCards','publishedCardOutsideSelectedCandidates','publishedCardSourceMismatch','publishedCardWordCountFailures','publishedCandidateVisibilityFailures','repositoryCandidateVisibilityLeaks','migrationChecksumShapeFailures'])assert.equal(checks[name],0,`${name} must be zero`);

 console.log(JSON.stringify({ok:true,phase:'CORPUS_QUALITY_GATES_V0_2',checks,policy:{everyCandidateTraceable:true,exactQuotesVerified:true,canonicalClaimsEvidenceBacked:true,unresolvedRelationsCannotBeApproved:true,reviewDecisionsAttributedAndReferential:true,intakeReviewGatePreserved:true,sourcePublicationSeparate:true,publishedCardsTraceable:true,migrationLedgerVerified:true}},null,2));
}finally{await client.end()}
