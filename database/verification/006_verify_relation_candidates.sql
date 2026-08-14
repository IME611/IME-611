DO $$
DECLARE
  atom_row RECORD;
  run_uuid UUID;
  relation_uuid UUID;
  relation_key_text TEXT;
BEGIN
  IF to_regclass('public.relation_extraction_runs') IS NULL THEN RAISE EXCEPTION 'relation_extraction_runs table missing'; END IF;
  IF to_regclass('public.relation_candidates') IS NULL THEN RAISE EXCEPTION 'relation_candidates table missing'; END IF;

  SELECT c.id,c.source_id,c.candidate_text
  INTO atom_row
  FROM extraction_candidates c
  WHERE EXISTS(
    SELECT 1 FROM extraction_candidate_evidence e
    WHERE e.candidate_id=c.id AND e.exact_quote_verified
  )
  ORDER BY c.created_at
  LIMIT 1;
  IF atom_row.id IS NULL THEN RAISE EXCEPTION 'verified extraction atom missing'; END IF;

  INSERT INTO relation_extraction_runs(scope,extraction_method,extractor_version,status,stats,completed_at)
  VALUES('CORPUS','verification','verification-v1','COMPLETED','{"verification":true}'::jsonb,NOW())
  RETURNING id INTO run_uuid;

  relation_key_text=encode(digest('relation-verification-'||run_uuid::text,'sha256'),'hex');
  INSERT INTO relation_candidates(
    run_id,relation_key,relation_type,source_atom_id,source_id,
    from_node_key,from_kind,from_label,from_resolution,
    to_node_key,to_kind,to_label,to_resolution,endpoint_resolution,
    evidence_mode,cue,exact_quote,confidence,review_status,extractor_version,metadata
  ) VALUES(
    run_uuid,relation_key_text,'INFLUENCES',atom_row.id,atom_row.source_id,
    encode(digest('from-'||run_uuid::text,'sha256'),'hex'),'SOURCE_SPAN','verification from','UNRESOLVED',
    encode(digest('to-'||run_uuid::text,'sha256'),'hex'),'SOURCE_SPAN','verification to','UNRESOLVED','UNRESOLVED',
    'EXPLICIT_LINGUISTIC','verification',atom_row.candidate_text,1,'PENDING','verification-v1','{"verification":true}'::jsonb
  ) RETURNING id INTO relation_uuid;

  IF NOT EXISTS(
    SELECT 1 FROM relation_candidates r
    JOIN extraction_candidates c ON c.id=r.source_atom_id
    JOIN extraction_candidate_evidence e ON e.candidate_id=c.id
    WHERE r.id=relation_uuid AND e.exact_quote_verified
  ) THEN RAISE EXCEPTION 'relation-to-source-fragment evidence chain failed'; END IF;

  DELETE FROM relation_extraction_runs WHERE id=run_uuid;
  IF EXISTS(SELECT 1 FROM relation_candidates WHERE id=relation_uuid AND run_id IS NOT NULL) THEN
    RAISE EXCEPTION 'relation run ON DELETE SET NULL behavior failed';
  END IF;
  DELETE FROM relation_candidates WHERE id=relation_uuid;
END $$;

SELECT '006 relation candidate schema verification PASS' AS result;
