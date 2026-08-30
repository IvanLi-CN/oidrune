CREATE TABLE IF NOT EXISTS delivery_claims (
  event_id TEXT PRIMARY KEY NOT NULL REFERENCES notification_events(id) ON DELETE CASCADE,
  claim_id TEXT NOT NULL,
  claimed_at TEXT NOT NULL,
  lease_expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS delivery_claims_lease_idx ON delivery_claims(lease_expires_at);
