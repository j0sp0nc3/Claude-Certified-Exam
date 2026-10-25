-- This table is populated only through a restricted operational workflow.
-- Answer keys are deliberately absent from the Git repository and public assets.
CREATE TABLE IF NOT EXISTS simulation_question_bank (
  question_id TEXT PRIMARY KEY,
  exam_code TEXT NOT NULL CHECK (exam_code IN ('CCAO-F', 'CCDV-F', 'CCAR-F', 'CCAR-P')),
  blueprint_version TEXT NOT NULL,
  official_domain_id TEXT NOT NULL,
  question_json TEXT NOT NULL,
  answer_json TEXT NOT NULL,
  multiple_response INTEGER NOT NULL CHECK (multiple_response IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'retired')),
  editorial_reviewed_at TEXT,
  technical_reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS simulation_question_bank_selection_idx
  ON simulation_question_bank(exam_code, blueprint_version, official_domain_id, status);
