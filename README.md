<p align="center">
  <a href="./README.md">English</a> · <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="https://github.com/IvanLi-CN/oidrune/releases"><img src="https://img.shields.io/github/v/release/IvanLi-CN/oidrune?display_name=tag&label=release&style=flat-square" alt="Latest release" /></a>
  <a href="https://github.com/IvanLi-CN/oidrune/actions/workflows/ci-main.yml"><img src="https://img.shields.io/github/actions/workflow/status/IvanLi-CN/oidrune/ci-main.yml?branch=main&label=ci&style=flat-square" alt="CI status" /></a>
  <a href="https://github.com/IvanLi-CN/oidrune/actions/workflows/ci-pr.yml"><img src="https://img.shields.io/github/actions/workflow/status/IvanLi-CN/oidrune/ci-pr.yml?label=pr%20ci&style=flat-square" alt="Pull request CI status" /></a>
</p>

# Oidrune

Oidrune is an operator-controlled relay for GitHub Actions. It verifies short-lived GitHub OIDC identities, accepts workflow-completion events from approved repositories, and delivers their normalized notification body to one operator-controlled Telegram destination.

Caller repositories keep no Telegram token, webhook secret, destination identifier, or Oidrune credential. Oidrune is a focused notification relay, not a generic webhook broker or a service that mutates the caller's GitHub release.

<p align="center">
  <img src="./docs/marketing/social-preview/oidrune-social-preview-dark-en.png#gh-dark-mode-only" alt="Oidrune GitHub Actions to Telegram notification gateway" width="100%" />
  <img src="./docs/marketing/social-preview/oidrune-social-preview-light-en.png#gh-light-mode-only" alt="Oidrune GitHub Actions to Telegram notification gateway" width="100%" />
</p>

## What it does

- Accepts one `workflow.completed` event through a public OIDC-authenticated ingress.
- Admits only GitHub-hosted jobs from an approved owner or repository and a trusted full-SHA reusable workflow.
- Persists and queues an accepted event before returning `202 Accepted`.
- Retries Telegram delivery and exposes terminal failures through the dead-letter queue, audit records, and the operator console.
- Protects the console and administrator APIs with GitHub-only authentication through Cloudflare Access.

## How delivery works

1. A caller's final notification job requests a short-lived GitHub OIDC token and sends a small structured event.
2. The Worker verifies the token, source policy, trusted workflow release, replay guard, and normalized `summary` before enqueueing.
3. A durable `202 Accepted` response means the event was handed off to Oidrune; it does not mean Telegram delivery has completed.
4. The Queue consumer sends the caller-provided body to the configured destination, retries transient failures, and records exhausted events as dead letters.

## Use Oidrune

Add a final notification job with no `secrets:` block. Reference the reusable workflow with the exact full commit SHA published by a trusted release and grant only `id-token: write`:

```yaml
jobs:
  release:
    runs-on: ubuntu-24.04
    steps:
      - run: ./release.sh

  notify:
    if: always()
    needs: [release]
    permissions:
      id-token: write
    uses: IvanLi-CN/oidrune/.github/workflows/notify.yml@<full-commit-sha>
    with:
      outcome: ${{ needs.release.result == 'success' && 'success' || needs.release.result == 'cancelled' && 'cancelled' || 'failure' }}
      summary: Release job completed.
      on_gateway_failure: warn
```

`summary` is the complete caller-provided Telegram body. `on_gateway_failure: warn` keeps a completed release green when the handoff is exhausted; use `fail` only when the notification job itself must fail. Neither setting changes an already-completed release.

The shared workflow uses the default gateway unless both `gateway_url` and `oidc_audience` are provided. The same pair can be configured as repository Variables named `OIDRUNE_GATEWAY_URL` and `OIDRUNE_OIDC_AUDIENCE`; partial pairs are rejected before an OIDC token is requested.

## Local development

Requirements: Bun `>=1.4.0`.

```bash
bun install
bunx vite --config vite.demo.config.ts --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/` for the deterministic console demo. It does not call Cloudflare Access, D1, Queues, or Telegram.

Run the aggregate quality check or a focused check with:

```bash
bun run quality
bun run check
bun run typecheck
bun run test:unit
bun run test:integration
bun run test:e2e
```

## Deployment

An Oidrune deployment consists of a Cloudflare Worker, D1 database, delivery Queue and dead-letter Queue, replay-protection Durable Object, Cloudflare Access application, and a Worker-managed Telegram secret. The public ingress stays outside Access; `/console*` and `/api/admin*` remain protected.

The production deployment uses an operator-configured custom domain. A Fork Deployment may use `workers.dev` by enabling `workers_dev` and removing the custom-domain route, then selecting the fork's gateway URL and OIDC audience for its smoke test. Deployment metadata, Access policy values, operator identities, and Worker secrets stay outside the repository.

## Repository layout

- `src/worker/`: OIDC ingress, admin API, Queue consumer, and delivery logic.
- `src/console/`: same-origin operator console and deterministic local demo.
- `migrations/`: D1 schema migrations.
- `.github/workflows/`: reusable notification workflow, CI, release, and smoke test workflows.
- `docs/`: workflow examples, HTTP contracts, specifications, ADRs, and quality policy.

## More docs

- [Reusable workflow example](./docs/notify-example.md)
- [HTTP and workflow contract](./docs/specs/oidrune-mvp/contracts/http.md)
- [Product scope](./PRODUCT.md)
- [Domain language](./CONTEXT.md)
- [MVP specification](./docs/specs/oidrune-mvp/SPEC.md)
- [Implementation notes](./docs/specs/oidrune-mvp/IMPLEMENTATION.md)
- [Quality-gate contract](./docs/quality-gates.md)

## Production smoke test

From `main`, run [Oidrune smoke](./.github/workflows/oidrune-smoke.yml) manually in GitHub Actions. It calls the SHA-pinned reusable workflow, expects the public gateway to return `202`, and then verifies that the matching D1 event reaches `delivered` with the caller-provided body. This checks the configured deployment end to end; it does not require a caller repository secret.

## License

MIT.
