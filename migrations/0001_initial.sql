CREATE TABLE IF NOT EXISTS owner_allowlist (
  owner_id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS repository_allowlist (
  repository_id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS destinations (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  chat_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trusted_workflow_releases (
  sha TEXT PRIMARY KEY NOT NULL CHECK (length(sha) = 40),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,
  revoked_at TEXT,
  revoked_by TEXT
);

CREATE TABLE IF NOT EXISTS notification_events (
  id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL DEFAULT 'workflow.completed',
  owner_id TEXT NOT NULL,
  repository_id TEXT NOT NULL,
  repository TEXT NOT NULL,
  run_id TEXT,
  event_name TEXT NOT NULL,
  outcome TEXT NOT NULL,
  workflow_sha TEXT NOT NULL,
  summary TEXT NOT NULL,
  destination_chat_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('accepted', 'delivered', 'retrying', 'dead_letter')),
  received_at TEXT NOT NULL,
  delivered_at TEXT,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS notification_events_retention_idx ON notification_events(status, expires_at);
CREATE INDEX IF NOT EXISTS notification_events_received_idx ON notification_events(received_at DESC);

CREATE TABLE IF NOT EXISTS delivery_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL REFERENCES notification_events(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('success', 'retryable_failure', 'terminal_failure')),
  response_code INTEGER,
  error_code TEXT,
  occurred_at TEXT NOT NULL,
  UNIQUE(event_id, attempt_number)
);

CREATE TABLE IF NOT EXISTS dead_letters (
  event_id TEXT PRIMARY KEY NOT NULL REFERENCES notification_events(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  failed_at TEXT NOT NULL,
  retried_at TEXT,
  retried_by TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  subject TEXT NOT NULL,
  detail TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_log_occurred_idx ON audit_log(occurred_at DESC);

CREATE TABLE IF NOT EXISTS release_snapshots (
  merge_commit_sha TEXT PRIMARY KEY NOT NULL CHECK (length(merge_commit_sha) = 40),
  release_intent TEXT NOT NULL,
  workflow_sha TEXT NOT NULL CHECK (length(workflow_sha) = 40),
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
