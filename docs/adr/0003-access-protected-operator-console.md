# Access-Protected Operator Console and D1 Policy Store

Oidrune uses a same-origin React console protected by path-based Cloudflare
Access restricted to Cloudflare account members. Dynamic admission policy,
trusted workflow releases, one Telegram destination record, audit events, and
delivery attempts live in D1; the Bot Token remains a non-readable Worker
Secret. This avoids a custom account system while permitting audited runtime
administration without redeploying the Worker for every policy update.

## Considered Options

- Static Worker configuration is simpler but cannot meet the required console
  operations without deployments.
- GitHub OAuth adds a separate OAuth application and client secret when the
  intended operators already belong to the controlling Cloudflare account.
