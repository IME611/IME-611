DO $$
DECLARE
  source_row sources%ROWTYPE;
  fragment_row source_fragments%ROWTYPE;
  run_uuid UUID;
  candidate_uuid UUID;
  evidence_count INTEGER;
BEGIN
  IF to_regclass('public.extraction_runs') IS NULL THEN
    RAISE EXCEPTION 'extraction_runs table missing';
  END IF;
  IF to_regclass('public.extraction_candidates') IS NULL THEN
    RAISE EXCEPTION 'extraction_candidates table missing';
  END IF;
  IF to_regclass('public.extraction_candidate_evidence') IS NULL THEN
    RAISE EXCEPTION 'extraction_candidate_evidence table missing';
  END IF;

  SELECT * INTO source_row
  FROM sources
  WHERE metadata->>'ingestion'='repository-corpus-bootstrap-v1'
  ORDER BY created_at
  LIMIT 1;
  IF source_row.id IS NULL THEN RAISE EXCEPTION 'canonical seed source missing'; END IF;

  SELECT * INTO fragment_row
  FROM source_fragments
  WHERE source_id=source_row.id AND length(raw_text)>20
  ORDER BY ordinal
  LIMIT 1;
  IF fragment_row.id IS NULL THEN RAISE EXCEPTION 'canonical source fragment missing'; END IF;

  INSERT INTO extraction_runs(source_id,scope,extraction_method,extractor_version,status,stats,completed_at)
  VALUES(source_row.id,'SOURCE','verification','verification-v1','COMPLETED','{"verification":true}'::jsonb,NOW())
  RETURNING id INTO run_uuid;

  INSERT INTO extraction_candidates(
    run_id,source_id,candidate_key,atom_type,claim_type,candidate_text,exact_quote,
    source_start,source_end,confidence,review_status,extraction_method,extractor_version,metadata
  ) VALUES(
    run_uuid,source_row.id,encode(digest('atomic-extraction-verification-'||run_uuid::text,'sha256'),'hex'),
    'CLAIM','FACTUAL',left(fragment_row.raw_text,20),left(fragment_row.raw_text,20),
    fragment_row.start_offset,fragment_row.start_offset+20,1,'PENDING','verification','verification-v1','{"verification":true}'::jsonb
  ) RETURNING id INTO candidate_uuid;

  INSERT INTO extraction_candidate_evidence(
    candidate_id,fragment_id,source_start,source_end,fragment_start,fragment_end,exact_quote,exact_quote_verified
  ) VALUES(
    candidate_uuid,fragment_row.id,fragment_row.start_offset,fragment_row.start_offset+20,0,20,left(fragment_row.raw_text,20),TRUE
  );

  SELECT count(*) INTO evidence_count FROM extraction_candidate_evidence WHERE candidate_id=candidate_uuid;
  IF evidence_count <> 1 THEN RAISE EXCEPTION 'candidate evidence persistence failed'; END IF;

  DELETE FROM extraction_runs WHERE id=run_uuid;
  IF EXISTS(SELECT 1 FROM extraction_candidates WHERE id=candidate_uuid AND run_id IS NOT NULL) THEN
    RAISE EXCEPTION 'run_id ON DELETE SET NULL behavior failed';
  END IF;
  DELETE FROM extraction_candidates WHERE id=candidate_uuid;
END $$;

SELECT '005 atomic extraction schema verification PASS' AS result;
