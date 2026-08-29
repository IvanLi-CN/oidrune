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
- Cloudflare Access authentication for the console and administrator APIs.

The first deployment uses the account-provided `workers.dev` hostname. No
personal domain needs to move to Cloudflare.

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

Provision Cloudflare resources and Worker secrets only during the separately
authorized deployment phase. `wrangler.jsonc` contains no real account,
database, queue, destination, or Access configuration.

## License

MIT.
