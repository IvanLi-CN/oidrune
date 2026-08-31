# Oidrune Product

## Product

Oidrune is an operator-controlled relay for GitHub Actions notifications. It
lets many approved GitHub repositories report workflow completion without
duplicating a Telegram credential, a target chat identifier, or a webhook
secret in every repository.

## Primary User

The primary user is the operator who owns the Cloudflare account, manages the
approved GitHub sources, and owns the single Telegram destination.

## Core Promise

A GitHub Actions workflow can report through Oidrune using a short-lived,
GitHub-signed identity token. Oidrune independently verifies that identity,
decides whether the source is admitted, and alone controls the destination.

## MVP Surfaces

- **Reusable workflow**: a public, SHA-pinned `workflow_call` entry that makes
  the OIDC-authenticated handoff. It accepts no caller secrets.
- **Public ingress**: accepts a structured `workflow.completed` event and
  returns after durable queue acceptance.
- **Delivery worker**: sends Telegram messages, retries transient failures,
  and records terminal failures in the DLQ and audit log.
- **Operator console**: protected with GitHub-only authentication brokered by
  Cloudflare Access; manages source admission, the one destination, trusted
  Oidrune workflow releases, audit records, retries, and fixed-format test
  messages.

## Non-goals

- Multiple Telegram destinations, arbitrary broadcast text, or caller-selected
  destinations.
- Discord, Slack, GitHub App Webhook, or generic webhook adapters.
- A self-managed account system, password authentication, or Worker-owned OAuth
  callback.
- Staging or multi-environment operation.
- Automatic rollback, cancellation, or mutation of a caller's GitHub release.
