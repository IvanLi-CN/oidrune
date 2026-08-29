# Oidrune MVP 主题历史

> 当前有效规范以 `./SPEC.md` 为准；持久取舍见 `docs/adr/`。

## Lifecycle / Compatibility

- This specification establishes Oidrune's first stable product boundary.
- Caller compatibility is defined by the pinned reusable workflow SHA and the
  `workflow.completed` contract. Callers do not inherit secrets from Oidrune.
- A Trusted Workflow Release may be revoked when its behavior is unsafe;
  affected callers must upgrade to another approved SHA.

## Replacements / Background

- Oidrune replaces the need to distribute a Telegram delivery secret such as a
  `SHOUTRRR_URL` to each GitHub repository.
- The existing direct-credential model remains a valid independent integration,
  but it is outside the Oidrune contract.

## References

- `./SPEC.md`
- `./IMPLEMENTATION.md`
