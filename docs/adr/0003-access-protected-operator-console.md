# Access-Protected Operator Console and D1 Policy Store

Oidrune uses a same-origin React console protected by path-based Cloudflare
Access. Dynamic admission policy,
trusted workflow releases, one Telegram destination record, audit events, and
delivery attempts live in D1; the Bot Token remains a non-readable Worker
Secret. This avoids a custom account system while permitting audited runtime
administration without redeploying the Worker for every policy update.

Operator identity selection is defined by
[ADR-0007](./0007-github-only-operator-identity.md).

## Considered Options

- Static Worker configuration is simpler but cannot meet the required console
  operations without deployments.
- A Worker-owned OAuth flow would add application-managed credentials and
  sessions to the Access-protected architecture.
