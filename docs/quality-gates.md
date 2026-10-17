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
- **Release**: runs only from a manual dispatch on `main`. The operator enters
  a stable SemVer, the workflow normalizes it to a `vMAJOR.MINOR.PATCH` tag,
  binds the release to the dispatch commit, requires successful CI Main for
  that commit, deploys the Worker, creates the GitHub Release, and promotes
  the same commit as a Trusted Workflow Release.
- **Release Failure Notification**: the failure job in `Release` reports a
  failed manual release through Oidrune's non-blocking notification policy. It
  uses a separately pinned, permanently trusted reusable workflow SHA.

## Release Durability

The explicit version and the dispatch commit are the release identity. The
workflow rejects a version tag owned by another commit, rejects a stable tag
already assigned to the same commit under another version, and reuses a
matching tag or Release on retry. GitHub tags and Releases are never moved or
overwritten for a conflicting request. PR labels are metadata only and never
choose a release type or version.

## Alignment Gate

Before the first release, an authorized operator must use `gh` to verify and
align the GitHub Ruleset with this document and the checked-in declaration.
The alignment checks branch protection, the `quality` context, signed commits,
PR-only behavior, and full-SHA action policy. External GitHub changes require
separate authorization and are not implied by local CI passing.
