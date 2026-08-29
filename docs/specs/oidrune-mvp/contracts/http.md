# HTTP and Reusable Workflow Contract

## Public Ingress

### `POST /v1/events/workflow-completed`

This endpoint is publicly reachable on the Oidrune `workers.dev` host. It is
not anonymously usable.

**Request requirements**

- `Authorization: Bearer <GitHub OIDC JWT>`
- `Content-Type: application/json`
- Request body at most 8 KiB
- JSON body:

```json
{
  "schema_version": 1,
  "event_type": "workflow.completed",
  "outcome": "success",
  "summary": "optional plain-text summary"
}
```

`outcome` is one of `success`, `failure`, `cancelled`, or `skipped`. `summary`
is optional and normalized to at most 1,000 characters. The Worker treats all
repository identity, run identity, event type, workflow identity, and
destination information as JWT- or server-derived facts, never body facts.

**Responses**

| Status | Meaning |
| --- | --- |
| `202` | Event record and queue handoff are durable. Telegram may still be retried later. |
| `400` | Body or schema is invalid. |
| `401` | OIDC token is absent, invalid, expired, or has the wrong audience. |
| `403` | Verified identity violates source, event, runner, or workflow-release policy. |
| `409` | The JWT `jti` was already accepted. |
| `503` | Oidrune could not durably accept the event. |

The reusable workflow retries transient transport or `503` errors with bounded
backoff. Its default `on_gateway_failure: warn` emits a GitHub warning and
exits successfully after retry exhaustion; `fail` exits unsuccessfully.

## Reusable Workflow

`IvanLi-CN/oidrune/.github/workflows/notify.yml@<full-commit-sha>` is called
as a GitHub Actions job, not a step. It requires no `secrets:` value.

**Caller requirements**

- Set `if: always()` when the caller wants notification after upstream failure.
- Set `needs` to the jobs after which completion should be reported.
- Grant only `actions: read` and `id-token: write` to the notify job.
- For pull requests, do not bypass the shared workflow's same-repository guard.

**Inputs**

| Input | Required | Values | Default |
| --- | --- | --- | --- |
| `outcome` | Yes | `success`, `failure`, `cancelled`, `skipped` | — |
| `on_gateway_failure` | No | `warn`, `fail` | `warn` |
| `summary` | No | plain text, max 1,000 characters after normalization | empty |

No input selects a destination, audience, owner, repository, Token, Bot, or
workflow release.

## Administrator API

Every `/api/admin/*` request requires a valid Cloudflare Access identity from
the configured account-member policy. The Worker verifies the authenticated
identity in addition to Access path protection. Browser assets use the
`/console/` base path so the same Access path policy protects them.

| Operation | Endpoint | Rules |
| --- | --- | --- |
| Read configuration | `GET /api/admin/config` | Bot Token is never included. |
| Set destination | `PUT /api/admin/destination` | One Telegram target only; requires confirmation. |
| Manage owner allowlist | `GET/POST/DELETE /api/admin/sources/owners` | Immutable GitHub owner IDs only. |
| Manage repository allowlist | `GET/POST/DELETE /api/admin/sources/repositories` | Immutable GitHub repository IDs only. |
| Manage trusted releases | `GET/POST/DELETE /api/admin/workflow-releases` | SHA only; release automation may add its own SHA. |
| Inspect deliveries | `GET /api/admin/events` | Filters never expose JWTs or raw bodies. |
| Retry DLQ event | `POST /api/admin/events/{eventId}/retry` | Re-enqueues stored normalized content only. |
| Send test | `POST /api/admin/test-message` | Fixed-format test only; requires confirmation. |
