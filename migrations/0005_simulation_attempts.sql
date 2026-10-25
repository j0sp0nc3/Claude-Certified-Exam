ALTER TABLE attempts ADD COLUMN mode TEXT NOT NULL DEFAULT 'study' CHECK (mode IN ('study', 'simulation'));
ALTER TABLE attempts ADD COLUMN blueprint_version TEXT;
ALTER TABLE attempts ADD COLUMN deadline_at TEXT;
ALTER TABLE attempts ADD COLUMN completion_reason TEXT;
ALTER TABLE attempts ADD COLUMN question_set_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE attempts ADD COLUMN integrity_event_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE attempts ADD COLUMN last_event_at TEXT;

CREATE INDEX IF NOT EXISTS attempts_mode_status_idx ON attempts(mode, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS attempts_deadline_idx ON attempts(deadline_at);

CREATE TABLE IF NOT EXISTS simulation_integrity_events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'visibility_hidden', 'window_blur', 'fullscreen_exit', 'reload', 'reconnect', 'submission'
  )),
  occurred_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS simulation_integrity_events_attempt_idx
  ON simulation_integrity_events(attempt_id, occurred_at DESC);
