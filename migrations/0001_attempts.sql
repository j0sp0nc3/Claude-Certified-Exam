CREATE TABLE IF NOT EXISTS attempts (
  attempt_id TEXT PRIMARY KEY,
  exam_code TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')),
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  finished_at TEXT,
  question_count INTEGER NOT NULL,
  answered_count INTEGER NOT NULL DEFAULT 0,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER,
  score_percent REAL,
  result_label TEXT,
  answers_json TEXT NOT NULL DEFAULT '{}',
  marked_json TEXT NOT NULL DEFAULT '[]',
  areas_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS attempts_started_at_idx ON attempts(started_at DESC);
CREATE INDEX IF NOT EXISTS attempts_exam_code_idx ON attempts(exam_code, status);
