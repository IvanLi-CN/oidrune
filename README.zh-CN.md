<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./src/console/public/brand/v25/oidrune-lockup-b3-transparent.svg" />
    <img src="./src/console/public/brand/v25/svg/oidrune-b1.svg" alt="Oidrune 标志" width="300" />
  </picture>
</p>

<p align="center">
  <a href="./README.md">English</a> · <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="https://github.com/IvanLi-CN/oidrune/releases"><img src="https://img.shields.io/github/v/release/IvanLi-CN/oidrune?display_name=tag&label=%E5%8F%91%E5%B8%83&style=flat-square" alt="最新发布" /></a>
  <a href="https://github.com/IvanLi-CN/oidrune/actions/workflows/ci-main.yml"><img src="https://img.shields.io/github/actions/workflow/status/IvanLi-CN/oidrune/ci-main.yml?branch=main&label=CI&style=flat-square" alt="CI 状态" /></a>
  <a href="https://github.com/IvanLi-CN/oidrune/actions/workflows/ci-pr.yml"><img src="https://img.shields.io/github/actions/workflow/status/IvanLi-CN/oidrune/ci-pr.yml?label=PR%20CI&style=flat-square" alt="Pull request CI 状态" /></a>
  <a href="https://github.com/IvanLi-CN/oidrune/actions/workflows/oidrune-smoke.yml"><img src="https://img.shields.io/badge/%E7%94%9F%E4%BA%A7%20%E5%86%92%E7%83%9F-manual-0f766e?style=flat-square" alt="生产冒烟工作流" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square" alt="MIT 许可证" /></a>
</p>

<p align="center">
  <a href="https://bun.sh/"><img src="https://img.shields.io/badge/Bun-%3E%3D1.4.0-f9f1e1?logo=bun&logoColor=111111&style=flat-square" alt="Bun &gt;=1.4.0" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript 7" /></a>
  <a href="https://developers.cloudflare.com/workers/"><img src="https://img.shields.io/badge/Cloudflare%20Workers-runtime-F38020?logo=cloudflare&logoColor=white&style=flat-square" alt="Cloudflare Workers" /></a>
  <a href="https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect"><img src="https://img.shields.io/badge/GitHub%20OIDC-secretless-24292F?logo=github&logoColor=white&style=flat-square" alt="GitHub OIDC" /></a>
  <a href="https://core.telegram.org/bots/api"><img src="https://img.shields.io/badge/Telegram-delivery-26A5E4?logo=telegram&logoColor=white&style=flat-square" alt="Telegram delivery" /></a>
</p>

# Oidrune

Oidrune 是一个由运营者控制的 GitHub Actions 通知中继。它验证短期 GitHub OIDC 身份，只接受来自已批准仓库的工作流完成事件，然后把规范化后的通知正文发送到一个由运营者控制的 Telegram 目的地。

调用方仓库不需要保存 Telegram token、webhook secret、目的地标识符或 Oidrune 凭据。Oidrune 是专注于通知投递的中继，不是通用 webhook broker，也不会修改调用方的 GitHub 发布流程。

<p align="center">
  <img src="./docs/marketing/social-preview/oidrune-social-preview-dark.png#gh-dark-mode-only" alt="Oidrune GitHub Actions 到 Telegram 通知网关" width="100%" />
  <img src="./docs/marketing/social-preview/oidrune-social-preview-light.png#gh-light-mode-only" alt="Oidrune GitHub Actions 到 Telegram 通知网关" width="100%" />
</p>

## 它做什么

- 通过公开的 OIDC 认证入口接收一个 `workflow.completed` 事件。
- 只允许来自已批准所有者或仓库、并使用受信任 full-SHA 可复用工作流的 GitHub 托管 job。
- 在返回 `202 Accepted` 之前持久化并将已接受事件加入队列。
- 自动重试 Telegram 投递，并通过死信队列、审计记录和运营者控制台暴露最终失败。
- 通过 Cloudflare Access 使用仅限 GitHub 的身份认证保护控制台和管理员 API。

## 投递如何工作

1. 调用方的最终通知 job 请求短期 GitHub OIDC token，并发送一个小型结构化事件。
2. Worker 在入队前验证 token、来源策略、受信任工作流发布版本、重放保护和规范化后的 `summary`。
3. 持久化的 `202 Accepted` 只表示事件已经交给 Oidrune，不代表 Telegram 已经投递完成。
4. Queue consumer 将调用方提供的正文发送到配置的目的地，重试临时失败，并把耗尽重试的事件记录为死信。

## 接入 Oidrune

在工作流末尾增加一个不包含 `secrets:` 的通知 job。使用受信任发布版本对应的完整 commit SHA 引用可复用工作流，并只授予 `id-token: write`：

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

`summary` 就是调用方提供的完整 Telegram 正文。`on_gateway_failure: warn` 会在移交耗尽时保持已完成的发布 job 为绿色；只有需要让通知 job 自身失败时才使用 `fail`。两种设置都不会改变已经完成的发布任务。

如果没有同时提供 `gateway_url` 和 `oidc_audience`，可复用工作流会使用默认网关。也可以在调用方仓库中配置名为 `OIDRUNE_GATEWAY_URL` 和 `OIDRUNE_OIDC_AUDIENCE` 的 Variables；配对不完整时，会在请求 OIDC token 之前失败。

## 本地开发

环境要求：Bun `>=1.4.0`。

```bash
bun install
bunx vite --config vite.demo.config.ts --host 127.0.0.1 --port 4173
```

打开 `http://127.0.0.1:4173/` 查看确定性的控制台演示。该演示不会调用 Cloudflare Access、D1、Queues 或 Telegram。

执行聚合质量检查或专项检查：

```bash
bun run quality
bun run check
bun run typecheck
bun run test:unit
bun run test:integration
bun run test:e2e
```

## 部署方式

一个 Oidrune 部署由 Cloudflare Worker、D1 数据库、投递 Queue 和死信 Queue、重放保护 Durable Object、Cloudflare Access 应用以及由 Worker 管理的 Telegram secret 组成。公开入口不经过 Access；`/console*` 和 `/api/admin*` 继续受到保护。

生产部署使用运营者配置的自定义域名。Fork Deployment 可以启用 `workers_dev` 并移除自定义域名路由，然后在冒烟测试中选择 fork 自己的 gateway URL 和 OIDC audience。部署元数据、Access 策略值、运营者身份和 Worker secrets 保留在仓库之外。

## 发布交付

合并 pull request 不会发布版本。运营者必须从 `main` 手动运行 `Release` 工作流，并将 `release_target` 设置为 `patch`、`minor`、`major` 或最终版 `X.Y.Z`。工作流根据最新已验证的稳定 Release 解析版本，在该提交的 `CI Main` 成功后创建并发布 Draft Release 身份，然后自动部署同一个 source，验证受保护路由，最后将同一个提交登记为受信任可复用工作流版本。PR 标签和工作流运行编号只作为元数据，不决定是否发布。

## 仓库结构

- `src/worker/`：OIDC 入口、管理员 API、Queue consumer 和投递逻辑。
- `src/console/`：同源运营者控制台和确定性的本地演示。
- `migrations/`：D1 schema migrations。
- `.github/workflows/`：可复用通知工作流、CI、发布和冒烟测试工作流。
- `docs/`：工作流示例、HTTP 契约、规格、ADR 和质量策略。

## 更多文档

- [可复用工作流示例](./docs/notify-example.md)
- [HTTP 与工作流契约](./docs/specs/oidrune-mvp/contracts/http.md)
- [产品范围](./PRODUCT.md)
- [领域语言](./CONTEXT.md)
- [MVP 规格](./docs/specs/oidrune-mvp/SPEC.md)
- [实现说明](./docs/specs/oidrune-mvp/IMPLEMENTATION.md)
- [质量门禁契约](./docs/quality-gates.md)

## 生产冒烟测试

从 `main` 分支在 GitHub Actions 中手动运行 [Oidrune smoke](./.github/workflows/oidrune-smoke.yml)。它会调用 SHA 固定的可复用工作流，要求公开网关返回 `202`，然后验证对应的 D1 事件是否带着调用方正文达到 `delivered`。这会端到端检查已配置的部署，但不需要调用方仓库 secret。

## 许可

[MIT License](./LICENSE)。
