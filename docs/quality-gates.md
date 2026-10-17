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
- Pull requests created by owners or project members do not require approval.

## Required Checks

| Check | Source workflow | Purpose |
| --- | --- | --- |
| `quality` | `CI PR` | Aggregates lint, typecheck, unit tests, Worker build, and console E2E. |

The checked-in declaration names `quality` as the only required PR check, lists
no informational checks or waivers, and enumerates the expected PR workflow/job
name. GitHub Rulesets must require the same context from GitHub Actions.

## Workflow Topology

- **CI PR**: runs for pull requests to `main` and `merge_group`; independent
  jobs are `Lint & Format Check`, `Typecheck`, `Unit Tests`, `Worker
  Integration`, `Dependency vulnerability scan`, `Worker Build`, and `Console
  E2E`; the final `quality` job fails unless all predecessors pass.
- **CI Main**: runs the production-relevant checks after merge. It is not
  cancelable by later pushes.
- **Release**: runs only from a manual dispatch on `main` with one
  `release_target` input. It resolves a stable SemVer from the latest verified
  stable Release, creates or reuses a durable Draft Release reservation, and
  publishes the reserved GitHub Release only after successful `CI Main` for
  the selected source commit. Release dispatches are serialized with a bounded
  pending queue; an unfinished reserved or published identity must recover
  before a new version is allocated.
- **Deploy**: runs automatically after `Release` succeeds, checks out the
  exact published source identity, deploys the Worker, verifies the protected
  route boundaries, and only then promotes that same SHA as a Trusted Workflow
  Release.
- **Release Failure Notification**: the failure job covers validation,
  reservation, Release, and Deploy failures through Oidrune's non-blocking
  notification policy. It uses a separately pinned, permanently trusted
  reusable workflow SHA and sends metadata-only context.

## Release Durability

The release target, canonical version, source commit, stable tag, and Draft
Release reservation form the release identity. The workflow rejects a tag or
Release owned by another commit, rejects a source commit with a different
release target, and reuses the same identity for recovery even after `main`
advances when the original source remains reachable. Unfinished identities
block successor allocation. Recovery across a workflow-file change requires
the externally provisioned `OIDRUNE_RELEASE_TOKEN`; the ordinary
`GITHUB_TOKEN` remains least-privileged for normal runs. Recovery uses the
recorded baseline tag and does not require the corresponding Release object to
remain listed. The workflow rechecks that the trusted source remains active
before recording the identity as deployed. GitHub tags and Releases are never
moved or overwritten for a conflicting request. PR labels and workflow run
numbers are not release inputs.

## Alignment Gate

Before the first release, an authorized operator must use `gh` to verify and
align the GitHub Ruleset with this document and the checked-in declaration.
The alignment checks branch protection, the `quality` context, signed commits,
PR-only behavior, and full-SHA action policy. External GitHub changes require
separate authorization and are not implied by local CI passing.
