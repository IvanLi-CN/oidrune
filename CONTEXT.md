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
An approved immutable commit SHA of a compatible Oidrune reusable notification
workflow, whether distributed upstream or released by a self-hosted fork.
_Avoid_: Main branch, latest workflow

## Gateway Selection

**Default Gateway**:
The Oidrune-operated public gateway selected when a notification caller does
not choose another compatible gateway.
_Avoid_: Production node, hard-coded endpoint

**Public Protocol Endpoint**:
The stable HTTPS address through which a Default Gateway accepts authenticated
notification handoffs; it identifies a protocol surface, not its provider
resources or backing node.
_Avoid_: Private deployment address

**Gateway Override**:
A caller-selected compatible gateway that replaces the Default Gateway for one
notification workflow invocation.
_Avoid_: Fork-specific configuration

**Gateway Selection Pair**:
An HTTPS Public Protocol Endpoint and its OIDC audience, treated as one
indivisible selection of a compatible gateway.
_Avoid_: Partial override

**Fork Deployment**:
An independently operated Oidrune gateway built from a fork and configured
with its own Cloudflare resources and Public Protocol Endpoint.
_Avoid_: Tenant

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

**Operator**:
A person authorized to administer one Oidrune deployment through an explicitly
approved GitHub identity.
_Avoid_: Cloudflare account member, Source

**Operator Console**:
The administrative interface through which an Operator manages Oidrune
configuration and audit operations.
_Avoid_: Public dashboard
