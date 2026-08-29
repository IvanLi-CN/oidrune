# Custom Domain and Path-Level Access

Oidrune uses the `oidrune.707979.xyz` Cloudflare Custom Domain with
`workers_dev` disabled. Cloudflare Access protects only the `/console*` and
`/api/admin*` paths, while the public workflow ingress remains reachable and
is authenticated by GitHub OIDC inside the Worker. One Access application
covers the protected paths so the Worker can validate a single Access
audience; its policy allows only the configured account owner.

## Considered Options

- Worker-level Access is simpler, but it protects every route and would block
  the public OIDC ingress.
- A `workers.dev` hostname with path rules keeps the default domain, but does
  not provide the production hostname selected for this deployment.
- A Custom Domain with path-level Access preserves both requirements and lets
  Cloudflare manage DNS and certificates for the Worker hostname.
