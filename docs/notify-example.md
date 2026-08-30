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
      id-token: write
    uses: IvanLi-CN/oidrune/.github/workflows/notify.yml@<full-commit-sha>
    with:
      outcome: ${{ needs.release.result == 'success' && 'success' || needs.release.result == 'cancelled' && 'cancelled' || 'failure' }}
      summary: Release job completed.
      on_gateway_failure: warn
```

Use `on_gateway_failure: fail` only when the notification job itself must be
red. It never changes an already-completed release job.

`summary` is the complete caller-provided Telegram body. Oidrune only
normalizes it and does not add workflow, repository, outcome, or run metadata.

## Gateway Selection

The shared workflow uses the public default gateway when no override is
provided. A caller can select another deployment by providing both inputs:

```yaml
with:
  gateway_url: https://gateway.example.com/v1/events/workflow-completed
  oidc_audience: gateway.example
```

The same pair can be configured as caller-repository Variables named
`OIDRUNE_GATEWAY_URL` and `OIDRUNE_OIDC_AUDIENCE`. Direct `with` inputs take
precedence over Variables, and a partial pair fails before an OIDC token is
requested. The endpoint must be HTTPS, have the exact workflow-completed path,
and contain no credentials, query parameters, or fragment.

## Fork Deployment

After forking, deploy the fork's Worker using its own version-controlled
`wrangler.jsonc`. A fork may use `workers.dev` by setting `workers_dev` to
`true` and removing the custom-domain route. Set the smoke workflow's paired
inputs when testing that gateway. The release workflow trusts the fork's own
notify workflow SHA; using the upstream reusable workflow instead requires an
operator to trust that upstream SHA through the Console before sending events.

The manual `oidrune-smoke` workflow accepts the same paired inputs, so a fork
can test its own gateway without changing the shared workflow source or adding
caller secrets.
