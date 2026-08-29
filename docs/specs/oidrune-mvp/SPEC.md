# Oidrune MVP

> 当前有效规范以本文为准；实现覆盖见 `./IMPLEMENTATION.md`，主题局部背景见
> `./HISTORY.md`，持久取舍见关联 ADR。

## 背景 / 问题陈述

GitHub Actions 可以直接调用 Telegram，但这种做法要求每个仓库复制 Bot
凭据与目标配置。Oidrune 必须提供一个公开但可独立验证的入口，让调用仓库
只携带 GitHub 签发的短期 OIDC 身份证明。

## 目标 / 非目标

### Goals

- GitHub 项目零 Oidrune/Telegram 静态凭据地发送工作流完成通知。
- 仅从可验证、可审计的 GitHub Actions 来源接受事件。
- 将 Telegram 投递与调用方 CI/发布结果解耦。
- 让 Cloudflare 账户成员通过控制台管理运行时策略与失败投递。

### Non-goals

- 多目的地、自由文本广播、第二消息平台或 GitHub App ingress。
- 自建账号、密码、GitHub OAuth 或多环境部署。
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
- 迁入自定义域名；首版仅使用 `workers.dev`。

## Related ADRs

- [GitHub OIDC for Secretless Repository Ingress](../../adr/0001-github-oidc-for-secretless-ingress.md)
- [Durable Asynchronous Delivery](../../adr/0002-durable-asynchronous-delivery.md)
- [Access-Protected Operator Console and D1 Policy Store](../../adr/0003-access-protected-operator-console.md)

## 需求（Requirements）

### MUST

- Public ingress MUST accept only `POST /v1/events/workflow-completed` with a
  GitHub OIDC JWT in `Authorization: Bearer`.
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
- The trusted reusable workflow MUST suppress `pull_request` notification
  unless its head repository equals the base repository. It MUST not check out
  or execute pull-request code for the notification step.
- Caller repositories MUST pass no Oidrune or Telegram secret. The shared
  workflow hides the ingress URL and audience and is referenced by full SHA.
- The Worker MUST create a normalized event record and enqueue it before
  responding `202 Accepted`. It MUST never use GitHub credentials or APIs to
  roll back, cancel, or mutate a caller release.
- Telegram delivery MUST use one operator-controlled destination and retry
  automatically. Terminal failures MUST appear as DLQ and audit records.
- The caller-facing default for a failed handoff is warning after bounded
  client retry. A caller may choose `on_gateway_failure: fail`; that choice
  affects only its notification job, not a completed release operation.
- All console and `/api/admin/*` operations MUST require Cloudflare Access
  account-member identity. The Bot Token MUST remain a Worker Secret and MUST
  never be read from D1 or returned to a browser.
- Successful events MUST be retained for 30 days; failed and DLQ events for 90
  days. OIDC JWTs, Bot Tokens, and raw request bodies MUST NOT be persisted.

### SHOULD

- The console SHOULD mask destination identifiers, expose fixed-format tests,
  and require confirmation for retry, revocation, and destination mutation.
- Event summaries SHOULD be normalized to plain text and capped at 1,000
  characters before persistence or Telegram formatting.
- The Worker SHOULD use a stable opaque OIDC audience independent of the
  `workers.dev` hostname.

### COULD

- Later versions may add adapter interfaces for other delivery platforms,
  custom domains, multiple environments, or a GitHub App ingress.

## 功能与行为规格

### Core flows

1. A caller adds a final `notify` job that calls the full-SHA Oidrune reusable
   workflow with `id-token: write` and no `secrets:` block.
2. The reusable workflow obtains a custom-audience OIDC JWT and submits a
   small structured completion event. The caller passes its constrained
   completion `outcome`; the workflow fetches GitHub run metadata through the
   automatic read-scoped `GITHUB_TOKEN`, not a configured secret.
3. The Worker rejects an invalid or replayed JWT before any enqueue operation.
   An admitted Source yields one normalized event, one queue message, and
   `202 Accepted`.
4. The consumer formats and sends the event through Telegram `sendMessage`.
   It retries retryable failures; exhausted events become Dead Letters.
5. An authenticated operator manages source policies, the one destination,
   trusted workflow releases, events, DLQ retry, and fixed test messages from
   the console.
6. The Oidrune Release workflow tags and deploys a successful release, then
   registers its own reusable workflow SHA as trusted. The console can revoke
   or manually restore that trust record.

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

## 验收标准

- Given an approved owner or repository and Trusted Workflow Release, when a
  GitHub-hosted workflow presents a valid OIDC token, then Oidrune returns
  `202` only after storing and queueing one normalized event.
- Given a token from an unapproved owner/repository, an untrusted workflow
  SHA, a forbidden event, a self-hosted runner, or a used `jti`, when it calls
  ingress, then Oidrune rejects it without a queue or Telegram side effect.
- Given a same-repository pull request, when the shared workflow runs, then it
  may notify; given a fork pull request, it creates no OIDC handoff.
- Given Telegram delivery failure after handoff, when retries exhaust, then the
  event is visible as a Dead Letter while the original release remains intact.
- Given a Cloudflare account member, when they access the console path, then
  they can manage only the defined operations; an unauthenticated request is
  blocked by Access and the API rejects missing identity.

## 非功能性验收 / 质量门槛

### Testing

- Unit: policy union, claim matrix, event normalization, Telegram formatting,
  retention decisions, and release-SHA transitions.
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
  `../../quality-gates.md`.

## Visual Evidence

No visual evidence exists before UI implementation.

## Related PRs

- None

## 风险 / 开放问题 / 假设

- Cloudflare Access, D1, Queue, Durable Object, and GitHub Ruleset alignment
  are external configuration tasks and require separate deployment authority.
- A Telegram bot must be added to the chosen group/channel with the permissions
  Telegram requires; private-chat recipients must start the bot first.
- Callers are responsible for adding the no-secret final notification job; a
  repository with no call cannot emit a workflow-local completion event.

## 参考

- [GitHub Actions OIDC](https://docs.github.com/en/actions/reference/security/oidc)
- [GitHub reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)
- [Cloudflare Access for Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [Cloudflare Workers Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)
- [Cloudflare `workers.dev`](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)
