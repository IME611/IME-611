BEGIN;

CREATE TABLE IF NOT EXISTS review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_type TEXT NOT NULL CHECK (queue_type IN ('INTAKE','DUPLICATE','CLASSIFICATION','CONFLICT','EPISTEMIC','RELATION_ENDPOINT','LEARNING_ORDER')),
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('APPROVE','REJECT','CHANGE','MERGE','KEEP_SEPARATE','RESOLVE')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(subject_type)) > 0),
  CHECK (length(trim(subject_key)) > 0),
  CHECK (length(trim(reviewer)) > 0)
);

CREATE INDEX IF NOT EXISTS review_decisions_queue_idx ON review_decisions(queue_type,created_at DESC);
CREATE INDEX IF NOT EXISTS review_decisions_subject_idx ON review_decisions(subject_type,subject_key,created_at DESC);
CREATE INDEX IF NOT EXISTS review_decisions_payload_gin_idx ON review_decisions USING GIN(payload);

COMMIT;
