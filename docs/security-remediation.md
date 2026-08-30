# Security Remediation Boundaries

This repository enforces request streaming limits, permanent-only workflow
trust, release-target validation, D1 delivery claims, dependency scanning, and
Dependabot configuration. The following controls remain owner-only platform
configuration and are not changed by a repository pull request.

## GitHub Owner Actions

1. In **Settings > Actions > General**, enable **Require actions to be pinned
   to a full-length commit SHA**. The [GitHub Actions policy](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)
   is the only control that blocks a future non-SHA reference; repository tests
   and the quality declaration only check syntax.
2. In the `main` ruleset, require pull requests, verified signatures, and the
   `quality` and `Label Gate` required checks. Do not require approving reviews
   or last-pusher approval: these must not gate PRs created by owners or project
   members. GitHub documents these settings under [ruleset pull-request
   rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).
3. In **Settings > Advanced Security**, enable **Dependabot alerts** and
   **Dependabot security updates**. The committed `dependabot.yml` configures
   version updates, but security-update pull requests require the platform
   switch described in [GitHub's Dependabot security update
   documentation](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-security-updates).

## Cloudflare Owner Actions

1. Confirm the `oidrune.707979.xyz` zone has an active edge certificate and
   that SSL/TLS encryption is not disabled.
2. In **SSL/TLS > Edge Certificates**, enable [**Always Use HTTPS**](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/).
   This redirects HTTP requests before they reach the Worker, including the
   public OIDC ingress, and avoids an origin-level redirect loop.

No Cloudflare token, GitHub secret, account identifier, or production setting
is stored in this repository.
