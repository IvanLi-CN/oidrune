# GitHub OIDC for Secretless Repository Ingress

Oidrune accepts GitHub Actions notifications through GitHub-issued OIDC JWTs,
not a per-repository webhook secret. The Worker validates the issuer,
signature, audience, expiry, replay identifier, source IDs, runner type, event
type, and Trusted Workflow Release before accepting an event. This centralizes
the Telegram credential in Cloudflare while every caller repository holds no
static Oidrune or Telegram secret.

## Considered Options

- Per-repository HMAC webhook secrets duplicate sensitive configuration and do
  not meet the product promise.
- A GitHub App webhook removes YAML integration but replaces OIDC with a
  central HMAC secret and loses the desired workflow-local contract.
