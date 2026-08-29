# Oidrune Context

Oidrune verifies the provenance of GitHub Actions notifications and delivers
them to an operator-controlled Telegram destination. It separates source
admission from message delivery and from operator administration.

## Source Identity

**Source**:
A GitHub repository workflow run represented by GitHub-issued OIDC claims.
_Avoid_: Caller, client

**Owner Allowlist**:
A set of immutable GitHub owner IDs whose repositories are admitted as Sources.
_Avoid_: Organization name allowlist

**Repository Allowlist**:
A set of immutable GitHub repository IDs admitted as Sources regardless of
owner membership.
_Avoid_: Repository-name allowlist

**Source Admission**:
The authorization decision that admits a Source when its owner ID is in the
Owner Allowlist or its repository ID is in the Repository Allowlist.
_Avoid_: Authentication

**Trusted Workflow Release**:
An approved immutable commit SHA of Oidrune's reusable notification workflow.
_Avoid_: Main branch, latest workflow

## Notification Lifecycle

**Notification Event**:
A normalized `workflow.completed` record accepted from an admitted Source.
_Avoid_: Webhook payload

**Handoff**:
The durable acceptance of a Notification Event into Oidrune's delivery queue.
_Avoid_: Delivery

**Delivery Attempt**:
One attempt to send a Notification Event to the configured Telegram
Destination.
_Avoid_: Notification Event

**Dead Letter**:
A Notification Event whose retry policy is exhausted and requires operator
attention.
_Avoid_: Dropped notification

**Destination**:
The single operator-configured Telegram private chat, group, or channel that
receives accepted Notification Events.
_Avoid_: Caller destination

## Administration

**Operator Console**:
The Cloudflare Access-protected interface for Oidrune configuration and audit
operations.
_Avoid_: Public dashboard
