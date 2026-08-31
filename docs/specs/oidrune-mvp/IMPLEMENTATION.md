# Oidrune MVP 实现状态

> 当前有效规范以 `./SPEC.md` 为准。本文件记录实现覆盖与 rollout 事实。

## Current Status

- Implementation: MVP source, validation suites, reusable workflow, and CI are implemented locally. Production Cloudflare, Telegram, Access, and Ruleset values are deployment-time configuration.
- Lifecycle: active
- Catalog note: 立项与 MVP 契约已确认，尚未初始化源码或外部资源。

## Planned Repository Shape

Oidrune remains a single Bun/TypeScript package, not a copy of KaisouMail's
multi-application workspace.

```text
src/
  worker/          public ingress, queue consumer, scheduled cleanup
  admin/           Access-verified administrator API
  domain/          source policy, event, delivery, release terms
  infrastructure/  D1 repositories, Queue producer, Durable Object bindings
  console/         React routes and feature modules
  shared/          schemas, presentation-safe types, formatter helpers
migrations/         D1 schema changes
.github/            CI, quality declaration, label/release/deploy workflows
docs/               product, ADR, quality contract, and Specs
```

## Planned Technology Choices

- Bun and TypeScript follow the established KaisouMail package-manager and
  static-checking conventions.
- Biome provides formatting, linting, import organization, and root `check`.
- Lefthook runs `check` before commit and `typecheck`, test, and build before
  push.
- Hono and Zod provide a small typed HTTP boundary consistent with the existing
  Cloudflare Worker reference project.
- `jose` verifies GitHub and Cloudflare Access JWTs through JWKS.
- React, Vite, and the Cloudflare Vite plugin build same-origin Worker Static
  Assets for the console. Set Vite base to `/console/` so Access protects
  scripts and styles as well as HTML.
- Vitest with the Workers runtime covers Worker/D1/Queue/DO integration;
  Playwright covers the operator console.

## Planned Cloudflare Resources

| Resource | Responsibility |
| --- | --- |
| Worker + Static Assets | Public ingress, queue consumer, scheduled retention cleanup, console API and UI. |
| D1 | Dynamic policy, destination metadata, normalized events, attempts, DLQ views, release snapshots, and audit trail. |
| Queue + DLQ | At-least-once handoff and bounded Telegram delivery retries. |
| Durable Object | Atomic JWT `jti` replay reservation until token expiry. |
| Worker Secrets | Telegram Bot Token and deployment-only secrets; never browser-readable. |
| Cloudflare Access | GitHub-only Operator gate for `/console*` and `/api/admin*` on the operator-configured Public Protocol Endpoint; public ingress remains outside Access. |

## Planned Implementation Sequence

1. Bootstrap the single-package Bun project, static gates, Worker test harness,
   and React/Worker Vite build without external deployment.
2. Implement the domain schemas and D1 migrations for policy, events,
   attempts, trusted releases, release snapshots, and audit records.
3. Implement GitHub OIDC verification, replay reservation, Source Admission,
   structured ingress, and Queue handoff.
4. Implement Telegram consumer retries, DLQ, cleanup schedule, caller-body
   normalization, and fixed operator test formatting.
5. Implement Access-aware administrator APIs and the console flows specified in
   the HTTP contract.
6. Add the public reusable workflow, same-repository PR guard, client retry,
   warning/fail policy, and example caller documentation.
7. Add the declared CI, Label Gate, release snapshot/backfill, Release,
   deployment, and release-failure notification workflows.
8. After explicit authorization, provision Cloudflare resources, configure
   Access paths, set Worker Secrets, and create the Telegram target.

## GitHub-Only Operator Authentication

### Repository implementation

1. Keep `/v1/events/workflow-completed` outside Access and preserve its existing
   GitHub Actions OIDC verification and Source Admission behavior.
2. Keep `/console*` and `/api/admin*` behind the same Access application and
   continue validating `cf-access-jwt-assertion` with the configured audience,
   normalized team-domain issuer, signature, and validity window in the Worker.
3. Treat the verified Access `sub` as the stable audit actor and persist it for
   every operator audit entry. An `email` claim may be retained as optional
   identity context but must not become the authorization source or audit key.
4. Do not add Worker routes for OAuth initiation or callback, a session store,
   GitHub API calls, GitHub token persistence, or authentication dependencies.
5. Cover the unchanged Worker trust boundary with integration tests: missing or
   invalid Access JWTs fail closed for both protected surfaces, while the public
   ingress remains governed only by its existing OIDC contract.
6. Add a repository privacy check that rejects Operator allowlists and Access
   IdP or OAuth configuration in versioned deployment configuration. Use only
   clearly fictitious placeholders in fixtures. Keep secret scanning enabled;
   neither check replaces review of the full diff because the repository does
   not know which deployment-private identity values to match.

### Deployment-private configuration

The following work is intentionally outside repository automation and requires
separate authority for GitHub and Cloudflare writes:

1. Create an operator-controlled GitHub OAuth application using the Cloudflare
   Access team domain as its homepage and the Access callback endpoint as its
   authorization callback.
2. Store the OAuth client ID and client secret only in the Cloudflare Access
   GitHub identity-provider configuration. Do not expose either value to the
   Worker, GitHub Actions, D1, browser code, logs, or repository variables.
3. Configure the Access application protecting `/console*` and `/api/admin*` to
   use only the GitHub identity provider with instant authentication enabled.
4. Replace the account-member policy with an explicit allow policy for the
   deployment's approved GitHub Operator identity. Do not derive this identity
   from the repository namespace, Source Owner Allowlist, or Repository
   Allowlist.
5. Remove Cloudflare identity, one-time PIN, and every other interactive login
   method from the application without a compatibility window. Existing Access
   sessions must be revoked so the new policy is evaluated immediately.
6. If the cutover fails, repair the OAuth application, identity provider, or
   policy through the GitHub and Cloudflare control planes. Do not restore a
   fallback login or add a Worker bypass. Temporary console unavailability is
   acceptable; public ingress availability is not.

No real Operator identity, OAuth application value, Access audience, Access team
domain, policy value, account identifier, or production snapshot belongs in the
repository. Each Fork Deployment supplies and protects its own values.

### Acceptance

After explicit authorization for real-environment verification:

1. Confirm the approved GitHub Operator is redirected directly to GitHub and can
   load `/console/`.
2. Confirm the same session can call `GET /api/admin/config` and that a mutating
   operation records the verified Access subject as its audit actor.
3. Confirm a GitHub identity outside the explicit allow policy is denied before
   reaching the Worker.
4. Confirm Cloudflare identity, one-time PIN, and other login methods are not
   offered or accepted.
5. Revoke the approved Operator's Access session, sign in again, and repeat the
   protected-surface checks so a pre-cutover cookie cannot mask a policy error.
6. Call the public workflow ingress without Access and verify its existing
   GitHub Actions OIDC behavior, including rejection of a request without a
   valid workflow token.
7. Run the permanent Oidrune smoke workflow and confirm durable delivery remains
   successful after the Access change.

## Release Promotion Coverage

The Release workflow must deploy the Worker first, then transactionally record
the release commit's reusable workflow SHA as trusted. It must retain a durable
release snapshot keyed by merge commit so a failed or interrupted release can
be backfilled without recalculating PR labels from mutable state.

## Remaining Gaps

- Cloudflare account resources, GitHub-backed Access application and private
  Operator allow policy, Telegram bot, and Worker secrets remain external
  deployment work.
- External provisioning values, including the D1 identifier, Access audience and
  team domain, and Telegram target, are intentionally deployment-time inputs.

## Related Changes

- None

## References

- `./SPEC.md`
- `./HISTORY.md`
- `../../quality-gates.md`
