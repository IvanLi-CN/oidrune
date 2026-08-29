# Oidrune MVP 实现状态

> 当前有效规范以 `./SPEC.md` 为准。本文件记录实现覆盖与 rollout 事实。

## Current Status

- Implementation: MVP source, validation suites, reusable workflow, and CI are implemented locally. External Cloudflare, Telegram, Access, and Ruleset provisioning remain intentionally unconfigured.
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
| Cloudflare Access | Account-member gate for `/console/*` and `/api/admin/*` on `workers.dev`. |

## Planned Implementation Sequence

1. Bootstrap the single-package Bun project, static gates, Worker test harness,
   and React/Worker Vite build without external deployment.
2. Implement the domain schemas and D1 migrations for policy, events,
   attempts, trusted releases, release snapshots, and audit records.
3. Implement GitHub OIDC verification, replay reservation, Source Admission,
   structured ingress, and Queue handoff.
4. Implement Telegram consumer retries, DLQ, cleanup schedule, and fixed
   formatting.
5. Implement Access-aware administrator APIs and the console flows specified in
   the HTTP contract.
6. Add the public reusable workflow, same-repository PR guard, client retry,
   warning/fail policy, and example caller documentation.
7. Add the declared CI, Label Gate, release snapshot/backfill, Release,
   deployment, and release-failure notification workflows.
8. After explicit authorization, provision Cloudflare resources, configure
   Access paths, set Worker Secrets, and create the Telegram target.

## Release Promotion Coverage

The Release workflow must deploy the Worker first, then transactionally record
the release commit's reusable workflow SHA as trusted. It must retain a durable
release snapshot keyed by merge commit so a failed or interrupted release can
be backfilled without recalculating PR labels from mutable state.

## Remaining Gaps

- Cloudflare account resources, Access application, Telegram bot, and Worker
  secrets remain external deployment work.
- External provisioning values, including the actual `workers.dev` account
  subdomain and Telegram target, are intentionally deployment-time inputs.

## Related Changes

- None

## References

- `./SPEC.md`
- `./HISTORY.md`
- `../../quality-gates.md`
