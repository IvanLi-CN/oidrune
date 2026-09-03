# Oidrune MVP

> 当前有效规范以本文为准；实现覆盖见 `./IMPLEMENTATION.md`，主题局部背景见
> `./HISTORY.md`，持久取舍见关联 ADR。

## Context and Scope

GitHub Actions 可以直接调用 Telegram，但这种做法要求每个仓库复制 Bot
凭据与目标配置。Oidrune 必须提供一个公开但可独立验证的入口，让调用仓库
只携带 GitHub 签发的短期 OIDC 身份证明。

## 目标 / 非目标

### Goals

- GitHub 项目零 Oidrune/Telegram 静态凭据地发送工作流完成通知。
- 仅从可验证、可审计的 GitHub Actions 来源接受事件。
- 将 Telegram 投递与调用方 CI/发布结果解耦。
- 让显式批准的 GitHub Operator 通过控制台管理运行时策略与失败投递。

### Non-goals

- 多目的地、自由文本广播、第二消息平台或 GitHub App ingress。
- 自建账号、密码、Worker-owned OAuth callback 或多环境部署。
- 替调用方发布、回滚、取消或修改 GitHub 资源。

## 范围（Scope）

### In scope

- `workflow.completed` 事件的 OIDC 认证、授权、持久受理与 Telegram 投递。
- owner/repository 并集白名单、受信任 reusable workflow SHA 与
  GitHub-hosted runner 策略。
- 一个 Telegram private chat、group 或 channel。
- Cloudflare Access 保护的同源 React 管理控制台。
- D1 审计、Cloudflare Queue、DLQ、Durable Object 重放保护和清理任务。
- 完整 PR/main/release quality contract。

### Out of scope

- 多租户、按调用方选择的 Telegram chat、动态模板语言和任意内容发送。

## Related ADRs

- [GitHub OIDC for Secretless Repository Ingress](../../adr/0001-github-oidc-for-secretless-ingress.md)
- [Durable Asynchronous Delivery](../../adr/0002-durable-asynchronous-delivery.md)
- [Access-Protected Operator Console and D1 Policy Store](../../adr/0003-access-protected-operator-console.md)
- [Custom Domain and Path-Level Access](../../adr/0004-custom-domain-path-access.md)
- [Leased Delivery Claims](../../adr/0005-leased-delivery-claims.md)
- [Portable Gateway Selection](../../adr/0006-portable-gateway-selection.md)
- [GitHub-Only Operator Identity Through Cloudflare Access](../../adr/0007-github-only-operator-identity.md)

## Requirements

- REQ-INGRESS: Each deployment MUST expose an HTTPS Public Protocol Endpoint.
  `/v1/events/workflow-completed` remains publicly reachable for GitHub OIDC,
  while `/console*` and `/api/admin*` are protected by path-level Cloudflare
  Access. The Default Gateway uses an operator-configured Custom Domain with
  `workers.dev` disabled; a Fork Deployment MAY use `workers.dev` with
  equivalent Access protection.

### MUST

- REQ-ADMISSION: Public ingress MUST accept only `POST /v1/events/workflow-completed` with a
  GitHub OIDC JWT in `Authorization: Bearer`.
- Public ingress MUST validate the OIDC token before consuming the request body.
  It MUST enforce the 8 KiB body limit while streaming whenever `Content-Length`
  is absent or invalid; syntactic Bearer extraction MUST NOT authorize buffering.
- The Worker MUST validate JWT signature through GitHub's JWKS and validate
  `iss`, exact `aud`, `exp`, `nbf`, `jti`, `repository_owner_id`,
  `repository_id`, `runner_environment`, `event_name`, `job_workflow_ref`, and
  `job_workflow_sha`.
- Source Admission MUST be
  `allowed_owner_ids contains repository_owner_id OR allowed_repository_ids
  contains repository_id` and MUST use immutable GitHub IDs.
- Only `github-hosted` runs may be accepted. Accepted events are `push`,
  `workflow_dispatch`, `schedule`, `release`, and guarded `pull_request`.
  `pull_request_target` and `workflow_run` are denied.
- REQ-WORKFLOW: The trusted reusable workflow MUST suppress `pull_request` notification
  unless its head repository equals the base repository. It MUST not check out
  or execute pull-request code for the notification step.
- A trusted reusable workflow reference MUST use the exact
  `<owner>/<repository>/.github/workflows/notify.yml@<full-commit-sha>` shape.
  The SHA MUST be an active Trusted Workflow Release; the owner and repository
  MAY be the upstream project or a deployment fork.
- Caller repositories MUST pass no Oidrune or Telegram secret. The shared
  workflow is referenced by full SHA. A caller MAY select a compatible gateway
  only by supplying both its HTTPS endpoint and OIDC audience as an explicit
  workflow override or paired repository Variables (`OIDRUNE_GATEWAY_URL` and
  `OIDRUNE_OIDC_AUDIENCE`); otherwise the Default Gateway is used. The selected
  endpoint MUST use HTTPS, have the exact `/v1/events/workflow-completed` path,
  and contain no credentials, query parameters, or fragment.
- REQ-DELIVERY: The Worker MUST create a normalized event record and enqueue it before
  responding `202 Accepted`. It MUST never use GitHub credentials or APIs to
  roll back, cancel, or mutate a caller release.
- Telegram delivery MUST use one operator-controlled destination and retry
  automatically. An event MUST have at most one active D1 delivery claim before
  Telegram `sendMessage`; competing Queue or DLQ-retry messages wait for the
  claim lease and do not send concurrently. The outbound request timeout MUST
  be shorter than its claim lease. Terminal failures MUST appear as DLQ and
  audit records.
- The caller-facing default for a failed handoff is warning after bounded
  client retry. A caller may choose `on_gateway_failure: fail`; that choice
  affects only its notification job, not a completed release operation.
- REQ-CONSOLE: All console and `/api/admin/*` operations MUST require a valid Cloudflare
  Access identity authenticated only through the GitHub identity provider and
  admitted by an explicit deployment-private Operator allow policy. Other
  interactive login methods, including Cloudflare identity and one-time PIN,
  MUST NOT be enabled. The Worker MUST validate the Access JWT signature,
  configured team-domain issuer, exact audience, validity window, and required
  `sub` claim. It MUST use `sub` as the stable audit actor; `email` is optional
  identity context only. The Worker MUST NOT own an OAuth callback or GitHub
  session, and MUST NOT store or use a GitHub access token. The Bot Token MUST
  remain a Worker Secret and MUST never be read from D1 or returned to a
  browser.
- REQ-PRIVACY: GitHub Operator identities, OAuth application values, Access identity-provider
  details, Access audience and team domain, and deployed policy values MUST NOT
  be committed to the repository. Tests and documentation MAY use only clearly
  fictitious placeholders.
- REQ-RETENTION: Successful events MUST be retained for 30 days; failed and DLQ events for 90
  days. OIDC JWTs, Bot Tokens, and raw request bodies MUST NOT be persisted.

### SHOULD

- REQ-FAILURE: The console SHOULD mask destination identifiers, expose fixed-format tests,
  and require confirmation for retry, revocation, and destination mutation.
- The workflow-completion Telegram body MUST be the normalized caller-provided
  `summary`, capped at 1,000 characters before persistence. Oidrune MUST NOT
  prefix or append labels, repository, outcome, event, run, timestamp, or
  destination data to that body.
- The Worker SHOULD use a stable opaque OIDC audience independent of the
  production hostname.

### COULD

- Later versions may add adapter interfaces for other delivery platforms,
  multiple environments, or a GitHub App ingress.

## 功能与行为规格

### Core flows

1. A caller adds a final `notify` job that calls the full-SHA Oidrune reusable
   workflow with `id-token: write` and no `secrets:` block.
2. The reusable workflow obtains a custom-audience OIDC JWT and submits a
   small structured completion event. The caller passes its constrained
   completion `outcome` and complete notification body in `summary`; the
   workflow does not fetch or derive notification text from GitHub APIs.
3. The Worker rejects an invalid or replayed JWT before any enqueue operation.
   An admitted Source yields one normalized event, one queue message, and
   `202 Accepted`.
4. The consumer sends the stored normalized caller body through Telegram
   `sendMessage`. Structured provenance remains available in D1, audit, and
   console views. It retries retryable failures; exhausted events become Dead
   Letters.
5. An authenticated operator manages source policies, the one destination,
   trusted workflow releases, events, DLQ retry, and fixed test messages from
   the console.
6. The Oidrune Release workflow accepts manual dispatch only from `main` and
   validates every target is reachable from `main` before using its code. It
   checks revocation through trusted `main` release infrastructure, records a
   prepared release snapshot, and tags, deploys, then permanently trusts a
   successful release SHA. Prepared and failed snapshots are never trusted. The
   failure-notification job uses a separately pinned permanent trusted release,
   while the console can revoke or manually restore a permanent trust record.

### Edge cases / errors

- A same-repository PR can notify; a fork PR causes the trusted reusable
  workflow to skip the handoff.
- An owner allowlist match or repository allowlist match admits a Source; a
  source with neither match receives `403` and no Telegram attempt.
- A rejected policy, invalid JWT, or failed queue handoff is visible in the
  caller job. The default result is a warning; `fail` is opt-in.
- A `202` only promises durable handoff, not completed Telegram delivery.
- Retrying a Dead Letter reuses stored normalized content and destination; it
  never accepts caller-provided replacement text or a replacement chat.

## 接口契约（Interfaces & Contracts）

### 接口清单

| 接口 | 类型 | 范围 | 变更 | 契约文档 | Owner | Consumers | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /v1/events/workflow-completed` | HTTPS API | external | New | [HTTP contract](./contracts/http.md) | Oidrune | reusable workflow | Public but OIDC-authenticated |
| `/api/admin/*` | HTTPS API | internal | New | [HTTP contract](./contracts/http.md) | Oidrune | operator console | Cloudflare Access required |
| `notify.yml` | reusable workflow | external | New | [HTTP contract](./contracts/http.md) | Oidrune | approved GitHub repositories | Full SHA only |

### 契约文档

- [HTTP and reusable workflow contract](./contracts/http.md)

## Verification

- VER-INGRESS covers: REQ-INGRESS REQ-ADMISSION
  Given an approved owner or repository and Trusted Workflow Release, when a
  GitHub-hosted workflow presents a valid OIDC token, then Oidrune returns
  `202` only after storing and queueing one normalized event.
- Given a token from an unapproved owner/repository, an untrusted workflow
  SHA, a forbidden event, a self-hosted runner, or a used `jti`, when it calls
  ingress, then Oidrune rejects it without a queue or Telegram side effect.
- VER-WORKFLOW covers: REQ-WORKFLOW
  Given a same-repository pull request, when the shared workflow runs, then it
  may notify; given a fork pull request, it creates no OIDC handoff.
- VER-DELIVERY covers: REQ-DELIVERY REQ-RETENTION
  Given a complete explicit gateway pair, a complete caller Variables pair, or
  no override, when the shared workflow runs, then it selects the pair in that
  precedence order and requests OIDC only after validating the HTTPS endpoint.
- VER-FAILURE covers: REQ-FAILURE
  Given Telegram delivery failure after handoff, when retries exhaust, then the
  event is visible as a Dead Letter while the original release remains intact.
- Given a caller-provided `summary`, when delivery succeeds, then the Telegram
  body equals the normalized caller body and contains no Oidrune-added event
  metadata.
- VER-CONSOLE covers: REQ-CONSOLE REQ-PRIVACY
  Given an explicitly approved GitHub Operator, when they authenticate through
  Access and open the console, then they can manage only the defined operations.
  A GitHub identity outside the deployment-private allow policy and every
  non-GitHub login method are denied; the API rejects a missing or invalid
  Access identity, including an invalid issuer, audience, signature, validity
  window, or required `sub` claim. Mutating operations record that `sub` as the
  audit actor even when an `email` claim is present.
- VER-PRIVACY covers: REQ-PRIVACY
  Given a GitHub-only Operator authentication change or failure, the public
  GitHub Actions OIDC ingress remains reachable and independently authenticated.

## 非功能性验收 / 质量门槛

### Testing

- Unit: policy union, claim matrix, event normalization, Telegram formatting,
  retention decisions, release-SHA transitions, and a repository privacy guard
  against checked-in Operator allowlists or Access IdP configuration.
- Worker integration: JWKS verification fixtures, D1 transactions, Queue/DLQ
  behavior, Durable Object replay rejection, and Access identity checks.
- E2E: console access state, CRUD operations, audit filtering, DLQ retry, and
  fixed-format test-message confirmation.

### UI

- Console page/state coverage for empty configuration, source policy editing,
  destination mutation confirmation, trusted-release revocation, audit errors,
  and DLQ retry.
- Playwright covers desktop and mobile critical paths. Visual evidence is
  required only when UI implementation begins.

### Quality checks

- Biome `check`, TypeScript `typecheck`, unit/integration test, Worker build,
  console E2E, `quality` aggregate, and Label Gate as defined in
  `../../quality-gates.md`. Label Gate MUST validate the same release-label
  contract for pull requests and merge-queue groups.

## Visual Evidence

The deterministic `ui_demo` uses mock data only and does not contact Cloudflare,
Access, D1, Queues, or Telegram. Storybook is not applicable to this page-level
console surface.

- [Desktop Delivery and audit trail at 1440x960 CSS px](./assets/console-delivery-desktop.png)
- [Mobile Delivery and audit trail at 393x852 CSS px](./assets/console-delivery-mobile.png)

This MVP adds the console surface, so `main` has no same-path visual baseline.
The accepted captures show the active Delivery navigation, readable compact
states, and the contained mobile retry action. The owner reviewed and
confirmed the desktop and mobile renders.

## 风险 / 开放问题 / 假设

- Cloudflare Access, D1, Queue, and Durable Object are external configuration
  tasks and require separate deployment authority.
- GitHub OAuth application creation, Access identity-provider and policy
  changes, login-method removal, and real-browser identity verification are
  external configuration tasks and require separate deployment authority.
- A Telegram bot must be added to the chosen group/channel with the permissions
  Telegram requires; private-chat recipients must start the bot first.
- Callers are responsible for adding the no-secret final notification job; a
  repository with no call cannot emit a workflow-local completion event.

## 参考

- [GitHub Actions OIDC](https://docs.github.com/en/actions/reference/security/oidc)
- [GitHub reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
- [Cloudflare Access for Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [Cloudflare Workers Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)
- [Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
