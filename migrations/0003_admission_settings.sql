CREATE TABLE IF NOT EXISTS admission_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  allowed_domain TEXT NOT NULL DEFAULT '',
  allowed_emails_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO admission_settings (id, allowed_domain, allowed_emails_json)
VALUES (1, 'nxtara.com', '[]');
