# Custom Domain and Path-Level Access

The Default Gateway uses an operator-configured Cloudflare Custom Domain with
`workers_dev` disabled. Cloudflare Access protects only the `/console*` and
`/api/admin*` paths, while the public workflow ingress remains reachable and is
authenticated by GitHub OIDC inside the Worker. One Access application covers
the protected paths so the Worker can validate a single Access audience; its
policy allows only the explicitly approved GitHub Operator identity. A Fork
Deployment may instead use its Cloudflare `workers.dev` hostname with
equivalent path-level Access.

## Considered Options

- Worker-level Access is simpler, but it protects every route and would block
  the public OIDC ingress.
- A `workers.dev` hostname with path rules is suitable for a Fork Deployment,
  but is not the Default Gateway's production endpoint.
- A Custom Domain with path-level Access preserves both requirements and lets
  Cloudflare manage DNS and certificates for the Worker hostname.
