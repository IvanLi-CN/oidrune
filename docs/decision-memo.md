# Decision Memo: Oidrune MVP

## Context

- **Deliverable**: a public GitHub Actions reusable workflow, an
  OIDC-authenticated Cloudflare Worker notification gateway, and a protected
  React operator console.
- **Runtime**: one production Cloudflare Worker on the `oidrune.707979.xyz`
  Custom Domain, with D1, Queues, Durable Objects, and path-based Cloudflare
  Access.
- **Primary risks**: accepting forged notifications, leaking Telegram
  credentials, silently losing delivery failures, and allowing notification
  errors to affect a completed release.

## Evidence

- `KaisouMail` demonstrates the selected Bun, TypeScript, Biome, Lefthook,
  Cloudflare Worker, React, and split CI/release habits.
- The `TypeScript web`, `Quality gates`, and `PR label release` style topics
  require explicit package/runtime contracts, a checked-in gate declaration,
  and separate PR, main, and release responsibilities.
- GitHub documents OIDC claims, reusable workflows, SHA pinning, and the
  `id-token: write` permission. Cloudflare documents Workers Access, Static
  Assets, Queues, Durable Objects, D1, and `workers.dev` routing.

## Recommendation

Build Oidrune as a single Bun/TypeScript repository. A Worker serves the
public ingress and the React console's same-origin APIs; Vite builds the
console as Worker Static Assets. The shared workflow sends no secret to the
Worker. The Worker validates the GitHub OIDC JWT, authorizes the verified
source, normalizes the event, records it, and enqueues it before responding
`202 Accepted`.

The console is protected by path-based Cloudflare Access using Cloudflare
account membership. The public OIDC ingress remains outside those protected
paths. It uses D1 for dynamic policy and audit records; the Telegram Bot Token
remains a Worker Secret and is never returned by an API.

## Alternatives

### GitHub App `workflow_run` Webhook

- Pros: no YAML change in individual workflows.
- Cons: requires a central HMAC webhook secret, provides less workflow-local
  context, and cannot provide the same custom completion contract.
- Choose when: zero per-workflow YAML is more important than secretless
  repository integration.

### Direct Telegram delivery from each repository

- Pros: no central service.
- Cons: duplicates Telegram credentials and destinations across repositories;
  credential rotation and target changes require repository-by-repository
  changes.
- Choose when: repositories must remain completely independent.

## Follow-ups

- Implement the contract in `docs/specs/oidrune-mvp/`.
- Align GitHub Rulesets and Cloudflare Access only during the authorized
  deployment phase; both are external state changes.
