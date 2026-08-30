# Quality Gates

This document is the intended source of truth for Oidrune's merge and release
policy. The implementation must add the matching `.github/quality-gates.json`
and validate it with the style-playbook quality-gate checker before calling the
policy aligned.

## Repository Policy

- Default branch: `main`.
- `main` is PR-only; direct pushes are disallowed.
- All commits that reach `main` require verified signatures.
- GitHub Actions and reusable workflows are pinned to full commit SHAs, and the
  GitHub Actions platform policy must reject non-SHA references.
- Every pull request requires one approving review from someone other than the
  latest pusher. GitHub must dismiss stale approvals on new commits.

## Required Checks

| Check | Source workflow | Purpose |
| --- | --- | --- |
| `quality` | `CI PR` | Aggregates lint, typecheck, unit tests, Worker build, and console E2E. |
| `Label Gate` | `Label Gate` | Requires one valid release intent before merge. |

The checked-in declaration will name both checks as `required_checks`, list no
informational checks or waivers, and enumerate the expected PR workflow/job
names. GitHub Rulesets must require the same two contexts from GitHub Actions
and the review policy above.

## Workflow Topology

- **CI PR**: runs for pull requests to `main` and `merge_group`; independent
  jobs are `Lint & Format Check`, `Typecheck`, `Unit Tests`, `Worker
  Integration`, `Dependency vulnerability scan`, `Worker Build`, and `Console
  E2E`; the final `quality` job fails unless all predecessors pass.
- **Label Gate**: runs from trusted workflow source when a pull request is
  opened, synchronized, or its labels change. It validates exactly one
  `type:major`, `type:minor`, `type:patch`, or `type:skip`, plus
  `channel:stable`.
- **CI Main**: runs the production-relevant checks after merge. It is not
  cancelable by later pushes.
- **Release**: consumes the validated merge intent after successful CI Main,
  creates a stable SemVer GitHub Release, deploys the Worker, records the
  release snapshot, and automatically promotes its reusable workflow SHA.
- **Release Failure Notification**: the failure job in `Release` reports
  release failures through Oidrune's non-blocking notification policy and
  sends its caller-provided failure summary. Structured release intent, commit,
  and run context remain in the workflow and Oidrune audit records. It uses a
  separately pinned, permanently trusted reusable workflow SHA; a prepared
  snapshot never grants ingress authority.

## Release Durability

Release intent is snapshotted by merge commit. A durable release record or
queue supports serialized processing, manual backfill by commit SHA, and
retrying a failed release without guessing labels from a changed PR head.
Prepared and failed snapshots are release metadata only. They never authorize
a reusable workflow SHA, and a release failure closes a prepared snapshot.

## Alignment Gate

Before the first release, an authorized operator must use `gh` to verify and
align the GitHub Ruleset with this document and the checked-in declaration.
The alignment checks branch protection, required contexts, signed commits,
PR-only behavior, and full-SHA action policy. External GitHub changes require
separate authorization and are not implied by local CI passing.
