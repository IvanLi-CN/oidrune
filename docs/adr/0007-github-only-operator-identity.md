# GitHub-Only Operator Identity Through Cloudflare Access

Oidrune accepts Operator identities only through Cloudflare Access using its
GitHub identity provider and an explicit deployment-private allow policy.
Cloudflare Access owns the OAuth callback, client secret, session, and GitHub
identity evaluation; the Worker validates only the resulting Access JWT and
never stores a GitHub token or calls GitHub for Operator authorization. This
keeps one login model without creating an Oidrune account system, while keeping
Operator authentication separate from GitHub Actions OIDC Source identity.

This decision supersedes the Cloudflare account-member identity choice in
[ADR-0003](./0003-access-protected-operator-console.md) but retains its
Access-protected console and D1 policy-store architecture.

## Considered Options

- A Worker-owned GitHub OAuth callback would add application sessions, token
  lifecycle management, and a second authorization boundary without improving
  the single-Operator use case.
- Cloudflare account identity or one-time PIN fallback would create additional
  supported login paths and weaken the GitHub-only contract.
- A temporary fallback during migration would reduce lockout risk, but Oidrune
  instead accepts temporary console unavailability and fixes configuration
  forward through the GitHub and Cloudflare control planes.

## Consequences

- Every deployment, including a Fork Deployment, selects its own explicitly
  approved GitHub Operator identity without committing that identity or any
  Access or OAuth configuration value to the repository.
- Access policy failure may make administration temporarily unavailable, but it
  must not affect the separately authenticated public GitHub Actions ingress.
