-- Kept separate from attempts so existing Study clients remain compatible.
-- The Worker can provision this same idempotent table on the first new practice save.
CREATE TABLE IF NOT EXISTS practice_feedback (
  attempt_id TEXT PRIMARY KEY REFERENCES attempts(attempt_id),
  feedback_mode TEXT NOT NULL CHECK (feedback_mode IN ('immediate', 'none')),
  verified_json TEXT NOT NULL DEFAULT '[]'
);
