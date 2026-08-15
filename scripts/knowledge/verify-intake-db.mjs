import assert from'node:assert/strict';
import{getDb}from'../../server/shared/postgres.js';
import{stageIntakeSubmission,changeIntakeSubmission,rejectIntakeSubmission,approveIntakeSubmission,intakeSchemaReady}from'../../server/knowledge/application/intake/intake-review.service.js';

const db=getDb(),prefix=`__EIL_INTAKE_DB_VERIFY__${Date.now()}`;
const analysis={analysisVersion:'db-verification-v0.1',verdict:{verdict:'UNCERTAIN',confidence:1,provisional:true},placement:{suggestedDrawer:null},atomic:{totalExtracted:0,analyzed:0,byType:{},byVerdict:{}},decision:{required:true,allowed:['APPROVE','CHANGE','REJECT']},policy:{canonicalWrites:false,verification:true}};
const counts=async()=>{const row=(await db.query(`SELECT (SELECT COUNT(*)::int FROM sources) sources,(SELECT COUNT(*)::int FROM extraction_candidates) candidates`)).rows[0];return{sources:Number(row.sources),candidates:Number(row.candidates)}};

try{
 assert.equal(await intakeSchemaReady(db),true,'intake schema must be ready');
 const before=await counts();

 const rejectText='E.I.L intake verification fixture — this row must be rejected and removed after the check.';
 const rejectStage=await stageIntakeSubmission(db,{kind:'TEXT',title:`${prefix}:reject`,sourceUrl:null,fileName:'verification.txt',mimeType:'text/plain',text:rejectText,originalBytes:Buffer.from(rejectText),metadata:{verification:true}},analysis);
 assert.equal(rejectStage.persisted,true);assert.ok(rejectStage.id);
 const changed=await changeIntakeSubmission(db,rejectStage.id,{reviewedBy:'system-verification',overrides:{title:'creator-corrected-title'},note:'CHANGE lifecycle verification'});
 assert.equal(changed.reviewStatus,'PENDING');assert.equal(changed.decisionOverrides.title,'creator-corrected-title');
 const rejected=await rejectIntakeSubmission(db,rejectStage.id,{reviewedBy:'system-verification',note:'REJECT lifecycle verification'});
 assert.equal(rejected.reviewStatus,'REJECTED');assert.equal(rejected.approvedSourceId,null);

 const seed=(await db.query(`SELECT id,title,raw_content,mime_type,content_hash,metadata FROM sources WHERE metadata->>'ingestion'='repository-corpus-bootstrap-v1' ORDER BY created_at LIMIT 1`)).rows[0];
 assert.ok(seed?.id&&seed?.raw_content,'seed source is required for duplicate approval verification');
 const seedBytes=Buffer.from(seed.raw_content,'utf8');
 const approveStage=await stageIntakeSubmission(db,{kind:'FILE',title:`${prefix}:approve-duplicate`,sourceUrl:null,fileName:seed.metadata?.sourceFile||'seed.txt',mimeType:seed.mime_type||'text/plain',text:seed.raw_content,originalBytes:seedBytes,metadata:{verification:true,expectedExistingSourceId:seed.id}},analysis);
 assert.equal(approveStage.persisted,true);assert.ok(approveStage.id);
 const approved=await approveIntakeSubmission(db,approveStage.id,{reviewedBy:'system-verification',note:'APPROVE duplicate-source lifecycle verification'});
 assert.equal(approved.submission.reviewStatus,'APPROVED');assert.equal(approved.submission.approvedSourceId,seed.id);assert.equal(approved.ingestion.deduplicated,true);assert.equal(approved.ingestion.source.id,seed.id);assert.equal(approved.extraction.skipped,true);assert.equal(approved.extraction.reason,'EXISTING_SOURCE_EXTRACTION');

 const after=await counts();assert.deepEqual(after,before,'verification must not change canonical source/candidate counts');
 console.log(JSON.stringify({ok:true,phase:'INTAKE_REVIEW_LIFECYCLE',change:'PASS',reject:'PASS',approveDuplicate:'PASS',canonicalCountsUnchanged:true,before,after},null,2));
}finally{
 try{await db.query(`DELETE FROM intake_submissions WHERE title LIKE $1`,[`${prefix}%`])}catch(error){console.error('verification cleanup failed',error)}
 await db.end();
}
