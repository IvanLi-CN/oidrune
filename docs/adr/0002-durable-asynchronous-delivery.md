# Durable Asynchronous Delivery

Oidrune writes a normalized accepted Notification Event to D1 and Cloudflare
Queues before returning `202 Accepted`; a queue consumer performs Telegram
delivery with bounded retry and DLQ handling. This makes Telegram availability
independent from the caller workflow and prevents a delivered release from
being rolled back or reclassified solely because notification delivery later
fails.

## Consequences

- Delivery is at least once and a rare duplicate is preferable to silent loss.
- The reusable workflow defaults to warning on an unaccepted handoff after
  client retry; callers may explicitly request a failing notification job.
- Replay protection is handled separately with a Durable Object keyed by the
  GitHub OIDC `jti`.
