# Leased Delivery Claims

Oidrune uses a D1 `delivery_claims` row as an atomic lease before a Queue
consumer sends an event to Telegram. A successful claim grants the sole active
delivery attempt. Competing Queue redeliveries and concurrent DLQ retries defer
until the lease expires, then re-read the event state.

Every Telegram request has a timeout shorter than the lease. A stalled request
therefore fails and releases its claim before another consumer may acquire it.

The lease is released only with the corresponding state transition to
`delivered`, `retrying`, or `dead_letter`. An expired lease enables recovery if
a consumer stops before completing the transition. This replaces the earlier
assumption that a concurrent duplicate Telegram send was an acceptable normal
consequence of at-least-once Queue delivery.

## Consequences

- D1 provides one active outbound attempt per event without exposing an
  implementation-only delivery state in the operator console.
- Telegram does not provide an idempotency key for `sendMessage`; a worker
  failure after Telegram accepts a request but before Oidrune records success
  remains an at-least-once boundary and is retained as a delivery risk.
- Queue messages that find an active claim retry after the lease interval
  rather than acknowledging delivery that another consumer may not finish.
- The request timeout and claim lease must remain ordered so an in-flight
  Telegram request cannot outlive the claim that protects it.
