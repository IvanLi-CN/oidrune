# Portable Gateway Selection

Oidrune keeps its Default Gateway as the zero-configuration destination of the
shared reusable workflow, while allowing a caller to select a compatible
self-hosted gateway with a paired HTTPS endpoint and OIDC audience. An explicit
workflow pair takes precedence over paired caller repository configuration,
which takes precedence over the Default Gateway. A Default Gateway endpoint is
a public protocol constant; its provider resources and backing node are not
part of the public contract.

## Consequences

- A self-hosted deployment may trust the upstream notification-workflow SHA,
  its own released workflow SHA, or both.
- Each deployment keeps its own Cloudflare binding values in its versioned
  Wrangler configuration; those resource identifiers are deployment metadata,
  not authentication credentials.
- A Fork Deployment may use `workers.dev` as its Public Protocol Endpoint;
  Custom Domains remain the Default Gateway's production recommendation.
- A caller never selects a Telegram destination and never receives an Oidrune
  or Telegram secret.
