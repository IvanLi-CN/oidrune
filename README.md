# Oidrune

Oidrune is a Cloudflare-hosted notification gateway for GitHub Actions. It
accepts only GitHub-signed OIDC tokens from an approved owner or repository,
then asynchronously delivers structured workflow-completion notifications to
one operator-controlled Telegram destination.

GitHub projects that use Oidrune hold no Telegram token, webhook secret,
destination identifier, or Oidrune credential. They call Oidrune's pinned
reusable workflow and grant only the narrowly scoped `id-token: write`
permission.

## MVP

- Public OIDC-authenticated ingress for `workflow.completed` events.
- One Telegram private chat, group, or channel selected by the operator.
- Owner/repository union allowlist, trusted workflow-release SHA policy, and
  GitHub-hosted runner requirement.
- Durable acceptance, automatic Telegram retry, DLQ, and an operator console.
- GitHub-only Operator authentication through Cloudflare Access for the console
  and administrator APIs.

Each deployment exposes an operator-configured Public Protocol Endpoint. The
public OIDC ingress remains reachable at `/v1/events/workflow-completed`;
Cloudflare Access protects only the `/console*` and `/api/admin*` paths.

## Project Truth

- [Product scope](./PRODUCT.md)
- [Domain language](./CONTEXT.md)
- [Decision memo](./docs/decision-memo.md)
- [MVP specification](./docs/specs/oidrune-mvp/SPEC.md)
- [Quality-gate contract](./docs/quality-gates.md)

## Local Development

Oidrune is a Bun single package. Install dependencies with `bun install`, then
use `bun run dev` for the same-origin console, `bun run quality` for the local
quality aggregate, or the focused `check`, `typecheck`, `test:unit`,
`test:integration`, and `test:e2e` scripts. The console demo is deterministic
and does not call Cloudflare Access, D1, Queues, or Telegram.

Provision the dedicated Cloudflare D1, queues, Public Protocol Endpoint,
GitHub-backed Access application, and Worker Secrets only during the separately
authorized deployment phase. A Fork Deployment may use `workers.dev` to get
started; Custom Domains remain the production recommendation. `wrangler.jsonc`
declares the deployment's Cloudflare bindings; destination metadata and Access
runtime values remain outside the source tree. GitHub Operator identities,
OAuth configuration, Access identity-provider details, and policy values are
also deployment-private and must not be committed.

## Production Smoke Test

The `Oidrune smoke` workflow is a permanent manual end-to-end check. From the
`main` branch, open GitHub Actions, select `Oidrune smoke`, and choose **Run
workflow**. It calls the SHA-pinned `notify.yml` release with GitHub OIDC,
expects the public gateway to return `202`, and fails the notification job when
the gateway handoff is exhausted. The accepted event queues one notification
attempt for the configured Telegram destination; delivery also requires the
Worker's separately managed Telegram secret. No caller secret is required.
The caller's required `summary` is the complete Telegram body; Oidrune only
normalizes it and does not add workflow metadata. The smoke workflow's
follow-up verification job queries the matching D1 event and fails unless the
Queue consumer records `delivered` for that exact caller body.

## License

MIT.
