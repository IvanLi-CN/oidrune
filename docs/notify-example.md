# Reusable Workflow Example

Reference the Oidrune workflow with the exact full commit SHA published by a
trusted release. The final notify job has no `secrets:` block and only affects
notification handling. It cannot roll back, cancel, or otherwise mutate the
release jobs it follows.

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
      actions: read
      id-token: write
    uses: IvanLi-CN/oidrune/.github/workflows/notify.yml@<full-commit-sha>
    with:
      outcome: ${{ needs.release.result == 'success' && 'success' || needs.release.result == 'cancelled' && 'cancelled' || 'failure' }}
      summary: Release job completed.
      on_gateway_failure: warn
```

Use `on_gateway_failure: fail` only when the notification job itself must be
red. It never changes an already-completed release job.
