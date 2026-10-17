# Manual Version Release Delivery

Oidrune publishes only after an operator manually dispatches the Release workflow from `main` with a stable SemVer. The workflow normalizes an optional `v` prefix, binds the release to the dispatch commit, requires successful `CI Main` for that commit, and uses that same commit for deployment, the GitHub Release, and Trusted Workflow Release promotion; pull request labels have no release meaning.

This replaces the previous label-driven automatic `CI Main` release because merging documentation or other non-release work must not create a production release, while an explicit version request makes the release boundary visible and auditable. Matching tag and Release identities are reused on retry, but a tag or stable version already owned by another commit fails closed.
