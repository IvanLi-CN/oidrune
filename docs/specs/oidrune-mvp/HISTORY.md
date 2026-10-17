# Oidrune MVP 主题历史

> 当前有效规范以 `./SPEC.md` 为准；持久取舍见 `docs/adr/`。

## Lifecycle / Compatibility

- This specification establishes Oidrune's first stable product boundary.
- Caller compatibility is defined by the pinned reusable workflow SHA and the
  `workflow.completed` contract. Callers do not inherit secrets from Oidrune.
- A Trusted Workflow Release may be revoked when its behavior is unsafe;
  affected callers must upgrade to another approved SHA.
- A failed manual release may be retried only with the same version and main
  commit; it never restores a revoked Trusted Workflow Release.
- GitHub-only Operator identity through Cloudflare Access is the current
  authentication contract; external Access and GitHub configuration remains
  separately authorized deployment work.
- Release publication is an explicit manual version request from `main`; merge
  labels no longer choose release type, version, or whether a release occurs.

## Replacements / Background

- Oidrune replaces the need to distribute a Telegram delivery secret such as a
  `SHOUTRRR_URL` to each GitHub repository.
- The existing direct-credential model remains a valid independent integration,
  but it is outside the Oidrune contract.

## References

- `./SPEC.md`
- `./IMPLEMENTATION.md`

## Delivery References

- Pull request [#17](https://github.com/IvanLi-CN/oidrune/pull/17) delivers the
  console accessibility, mobile layout, design-token, and visual-evidence
  updates covered by this topic.
