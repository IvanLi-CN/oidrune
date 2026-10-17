# Manual Release Delivery

Oidrune publishes only after an operator manually dispatches the Release workflow from `main`. The workflow generates a stable `v0.1.<run-number>` tag, binds the release to the dispatch commit, requires successful `CI Main` for that commit, and uses that same commit for deployment, the GitHub Release, and Trusted Workflow Release promotion; pull request labels have no release meaning.

This replaces the previous label-driven automatic `CI Main` release because merging documentation or other non-release work must not create a production release. A retry of the same workflow run reuses matching tag and Release identities, but a tag or stable version already owned by another commit fails closed.
