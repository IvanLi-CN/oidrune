import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("release workflow security boundaries", () => {
  it("validates one owner target, trusted baseline, and current main commit", async () => {
    const workflow = await readWorkflow("release.yml");
    const validation = workflow.indexOf(
      "name: Validate release target, trusted baseline, and CI Main",
    );
    const reservation = workflow.indexOf(
      "name: Create or reuse durable Draft Release reservation",
    );

    expect(validation).toBeGreaterThanOrEqual(0);
    expect(reservation).toBeGreaterThan(validation);
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("release_target:");
    expect(workflow).toContain(`RELEASE_TARGET: \${{ inputs.release_target }}`);
    expect(workflow).toContain(`SOURCE_SHA: \${{ github.sha }}`);
    expect(workflow).toContain("github.rest.actions.listWorkflowRuns");
    expect(workflow).toContain('workflow_id: "ci-main.yml"');
    expect(workflow).toContain('run.conclusion === "success"');
    expect(workflow).toContain("No trusted stable GitHub Release exists");
    expect(workflow).toContain("baselineComparison");
    expect(workflow).toContain("canonical-version");
    expect(workflow).not.toContain("github.run_number");
    expect(workflow).not.toContain("type:patch");
    expect(workflow).not.toContain("channel:stable");
  });

  it("serializes release requests and preserves exact SemVer arithmetic", async () => {
    const workflow = await readWorkflow("release.yml");

    expect(workflow).toContain(`group: release-\${{ github.ref_name }}`);
    expect(workflow).toContain("queue: max");
    expect(workflow).not.toContain(
      `group: release-\${{ github.ref_name }}-\${{ inputs.release_target }}`,
    );
    expect(workflow).toContain("BigInt(base[0])");
    expect(workflow).toContain("BigInt(base[1])");
    expect(workflow).toContain("BigInt(base[2])");
    expect(workflow).not.toContain("map(Number)");
    expect(workflow).toContain("const dispatchSha");
    expect(workflow).toContain("unfinishedIdentities");
    expect(workflow).toContain("sourceReachability");
    expect(workflow).toContain('core.setOutput("source_sha", sourceSha)');
    expect(workflow).toContain("readWorkflowTree");
    expect(workflow).toContain(
      "if (!unfinishedIdentity && stableReleases.length === 0)",
    );
    expect(workflow).toContain("OIDRUNE_RELEASE_TOKEN");
    expect(workflow).toContain("RECOVERY_TOKEN_PRESENT");
    expect(workflow).toContain(
      'core.setOutput("recovery_token_required", "false")',
    );
    expect(workflow).toContain(
      'core.setOutput("recovery_token_required", "true")',
    );
    expect(workflow).toContain("recovery_token_required");
    expect(workflow).toContain(
      `github-token: \${{ steps.authority.outputs.recovery_token_required == 'true' && secrets.OIDRUNE_RELEASE_TOKEN || github.token }}`,
    );
    expect(workflow).toContain("Determine release write authorization");
    expect(workflow).toContain("mainWorkflowTree");
    expect(
      workflow.match(/name: Determine release write authorization/g),
    ).toHaveLength(3);
    expect(
      workflow.match(/const \[sourceWorkflowTree, mainWorkflowTree\]/g),
    ).toHaveLength(3);
    expect(workflow).not.toContain(
      `RECOVERY_TOKEN: \${{ secrets.OIDRUNE_RELEASE_TOKEN }}`,
    );
  });

  it("does not publish from CI Main or PR metadata changes", async () => {
    const workflow = await readWorkflow("release.yml");

    expect(workflow).toContain(
      "github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'",
    );
    expect(workflow).not.toContain("workflow_run:");
    expect(workflow).not.toContain("pull_request:");
    expect(workflow).not.toContain("push:");
    expect(workflow).not.toContain("github.event.workflow_run");
    expect(workflow).not.toContain("labels");
  });

  it("reserves and publishes a durable identity before automatic deployment", async () => {
    const workflow = await readWorkflow("release.yml");
    const reserve = workflow.indexOf("reserve-release:");
    const publish = workflow.indexOf("publish-release:");
    const deployStart = workflow.indexOf("deploy:");

    expect(reserve).toBeGreaterThanOrEqual(0);
    expect(publish).toBeGreaterThan(reserve);
    expect(deployStart).toBeGreaterThan(publish);
    expect(workflow).toContain("github.rest.repos.createRelease");
    expect(workflow).toContain("github.rest.repos.listReleases");
    expect(workflow).toContain("github.rest.repos.listTags");
    expect(workflow).not.toContain("getReleaseByTag");
    expect(workflow).toContain("draft: true");
    expect(workflow).toContain("reservation_id");
    expect(workflow).toContain(
      "stable release tags without a matching reservation identity",
    );
    expect(workflow).toContain(
      "needs: [validate-release-request, reserve-release, publish-release]",
    );
    expect(workflow).toContain("if: needs.publish-release.result == 'success'");
    expect(workflow).toContain("name: Deploy published release");
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).toContain(
      "Confirm trusted workflow release remains active",
    );
    expect(workflow).toContain(
      "The workflow release was revoked before trust promotion completed.",
    );
    expect(workflow).toContain(
      "The workflow release is not actively trusted; the Release identity remains unfinished.",
    );

    const markDeployedStart = workflow.indexOf("mark-release-deployed:");
    const deployJob = workflow.slice(deployStart, markDeployedStart);
    expect(markDeployedStart).toBeGreaterThan(
      workflow.indexOf("name: Deploy published release"),
    );
    expect(deployJob).toContain("contents: read");
    expect(deployJob).not.toContain("contents: write");
    expect(deployJob).not.toContain("id-token: write");
    expect(workflow.slice(markDeployedStart)).toContain("contents: write");
    const markJob = workflow.slice(markDeployedStart);
    expect(markJob).toContain("Checkout release infrastructure");
    expect(markJob).toContain("ref: main");
    expect(markJob).toContain("bun install --frozen-lockfile");

    const validationJob = workflow.slice(
      workflow.indexOf("validate-release-request:"),
      reserve,
    );
    expect(validationJob).toContain("contents: write");
  });

  it("checks revocation before checking out the validated release source", async () => {
    const workflow = await readWorkflow("release.yml");
    const revocationCheck = workflow.indexOf(
      "name: Refuse a revoked workflow release",
    );
    const migrationCheck = workflow.indexOf(
      "name: Bootstrap trusted workflow release table",
    );
    const applyMigrations = workflow.indexOf(
      "name: Apply validated release D1 migrations",
    );
    const targetCheckout = workflow.indexOf(
      "name: Checkout validated release source",
    );

    expect(migrationCheck).toBeGreaterThanOrEqual(0);
    expect(revocationCheck).toBeGreaterThanOrEqual(0);
    expect(revocationCheck).toBeGreaterThan(migrationCheck);
    expect(targetCheckout).toBeGreaterThan(revocationCheck);
    expect(applyMigrations).toBeGreaterThan(revocationCheck);
  });

  it("fails closed on conflicting tags and reuses same-identity recovery", async () => {
    const workflow = await readWorkflow("release.yml");

    expect(workflow).toContain("resolveTagTarget");
    expect(workflow).toContain("same release identity");
    expect(workflow).toContain(
      "already exists; same-identity recovery requires",
    );
    expect(workflow).toContain("source-sha:");
    expect(workflow).toContain("release-state: reserved");
    expect(workflow).toContain("release-state: published");
    expect(workflow).toContain("cannot allocate a successor");
    expect(workflow).toContain(
      "Multiple unfinished Oidrune release identities require operator recovery.",
    );
    expect(workflow).toContain("release-state");
    expect(workflow).toContain(
      'readMetadata(body, "release-state") === "deployed"',
    );

    const updateRelease = workflow.indexOf("github.rest.repos.updateRelease");
    const publishedTagCheck = workflow.indexOf("const publishedTagTarget");
    expect(publishedTagCheck).toBeGreaterThan(updateRelease);
  });

  it("verifies the configured Access login boundary after deployment", async () => {
    const workflow = await readWorkflow("release.yml");

    expect(workflow).toContain("ACCESS_TEAM_DOMAIN");
    expect(workflow).toContain("OIDRUNE_PUBLIC_ORIGIN");
    expect(workflow).toContain(
      "OIDRUNE_PUBLIC_ORIGIN must be an HTTPS origin without a path.",
    );
    expect(workflow).toContain("console_location");
    expect(workflow).toContain("admin_location");
    expect(workflow).toContain("admin_status");
    expect(workflow).toContain("/cdn-cgi/access/login");
    expect(workflow).toContain("access_login_path");
    expect(workflow).toContain("access_login_target");
    expect(workflow).toContain("protected production routes");
    expect(workflow).toContain(`\${origin}/api/admin/config`);
    expect(workflow).toContain(
      "The production console or administrator API is not protected by Cloudflare Access.",
    );
  });

  it("uses a permanently pinned release for Release and Deploy failures", async () => {
    const workflow = await readWorkflow("release.yml");

    expect(workflow).toMatch(
      /uses:\s+IvanLi-CN\/oidrune\/\.github\/workflows\/notify\.yml@[a-f0-9]{40}/,
    );
    expect(workflow).toContain("needs.reserve-release.result == 'failure'");
    expect(workflow).toContain("needs.deploy.result == 'failure'");
    expect(workflow).toContain(
      "needs.mark-release-deployed.result == 'failure'",
    );
    expect(workflow).toContain(
      "retry the same target for same-identity recovery",
    );
    expect(workflow).toContain(
      `source \${{ needs.validate-release-request.outputs.source_sha || github.sha }} failed`,
    );
    expect(workflow).not.toContain("uses: ./.github/workflows/notify.yml");
  });
});

describe("portable gateway selection", () => {
  it("exposes paired direct and caller-variable overrides with default fallback", async () => {
    const workflow = await readWorkflow("notify.yml");

    expect(workflow).toContain("gateway_url:");
    expect(workflow).toContain("oidc_audience:");
    expect(workflow).toContain(`INPUT_GATEWAY_URL: \${{ inputs.gateway_url }}`);
    expect(workflow).toContain(
      `INPUT_OIDC_AUDIENCE: \${{ inputs.oidc_audience }}`,
    );
    expect(workflow).toContain(
      `VARIABLE_GATEWAY_URL: \${{ vars.OIDRUNE_GATEWAY_URL }}`,
    );
    expect(workflow).toContain(
      `VARIABLE_OIDC_AUDIENCE: \${{ vars.OIDRUNE_OIDC_AUDIENCE }}`,
    );

    const explicit = workflow.indexOf(
      `OIDRUNE_GATEWAY_URL="\${INPUT_GATEWAY_URL}"`,
    );
    const variables = workflow.indexOf(
      `OIDRUNE_GATEWAY_URL="\${VARIABLE_GATEWAY_URL}"`,
    );
    const defaults = workflow.indexOf(
      `OIDRUNE_GATEWAY_URL="\${DEFAULT_GATEWAY_URL}"`,
    );
    expect(explicit).toBeGreaterThanOrEqual(0);
    expect(variables).toBeGreaterThan(explicit);
    expect(defaults).toBeGreaterThan(variables);
    expect(workflow).toContain(
      "gateway_url and oidc_audience must be provided together",
    );
    expect(workflow).toContain(
      "OIDRUNE_GATEWAY_URL and OIDRUNE_OIDC_AUDIENCE variables must be provided together",
    );
  });

  it("validates the gateway before requesting OIDC and URL-encodes the audience", async () => {
    const workflow = await readWorkflow("notify.yml");
    const validation = workflow.indexOf("if ! node -e");
    const tokenRequest = workflow.indexOf('token="$(curl');

    expect(validation).toBeGreaterThanOrEqual(0);
    expect(tokenRequest).toBeGreaterThan(validation);
    expect(workflow).toContain('url.protocol !== "https:"');
    expect(workflow).toContain("url.username");
    expect(workflow).toContain("url.password");
    expect(workflow).toContain("url.search");
    expect(workflow).toContain("url.hash");
    expect(workflow).toContain('value.includes("?")');
    expect(workflow).toContain('value.includes("#")');
    expect(workflow).toContain(
      'url.pathname !== "/v1/events/workflow-completed"',
    );
    expect(workflow).toContain(
      `--data-urlencode "audience=\${OIDRUNE_AUDIENCE}"`,
    );
    expect(workflow).not.toContain("ACTIONS_ID_TOKEN_REQUEST_URL}&audience=");
  });

  it("keeps the reusable workflow caller-owned and secretless", async () => {
    const workflow = await readWorkflow("notify.yml");

    expect(workflow).toContain(`SUMMARY: \${{ inputs.summary }}`);
    expect(workflow).not.toContain("secrets.");
    expect(workflow).not.toContain("actions/checkout");
  });

  it("lets the permanent smoke workflow pass a paired gateway override", async () => {
    const [workflow, example] = await Promise.all([
      readWorkflow("oidrune-smoke.yml"),
      readFile("docs/notify-example.md", "utf8"),
    ]);

    expect(workflow).toContain("gateway_url:");
    expect(workflow).toContain("oidc_audience:");
    expect(workflow).toContain(`gateway_url: \${{ inputs.gateway_url }}`);
    expect(workflow).toContain(`oidc_audience: \${{ inputs.oidc_audience }}`);
    expect(example).toContain("workers.dev");
    expect(example).toContain("trust that upstream SHA");
  });
});

describe("CI supply-chain hardening", () => {
  it("scans the Bun lockfile in pull-request and main CI", async () => {
    const [prWorkflow, mainWorkflow] = await Promise.all([
      readWorkflow("ci-pr.yml"),
      readWorkflow("ci-main.yml"),
    ]);

    expect(prWorkflow).toContain("bun pm scan");
    expect(mainWorkflow).toContain("bun pm scan");
  });

  it("configures Bun's scanner with a locked local dependency", async () => {
    const [bunfig, packageJson] = await Promise.all([
      readFile("bunfig.toml", "utf8"),
      readFile("package.json", "utf8"),
    ]);

    expect(bunfig).toContain(
      'scanner = "@socketsecurity/bun-security-scanner"',
    );
    expect(packageJson).toContain(
      '"@socketsecurity/bun-security-scanner": "1.1.2"',
    );
  });

  it("bounds a Telegram request before another worker can take its claim", async () => {
    const delivery = await readFile("src/worker/delivery.ts", "utf8");
    const constants = await readFile("src/shared/constants.ts", "utf8");

    expect(delivery).toContain("AbortSignal.timeout");
    expect(delivery).toContain("TELEGRAM_REQUEST_TIMEOUT_SECONDS");
    expect(constants).toContain("TELEGRAM_REQUEST_TIMEOUT_SECONDS = 240");
  });

  it("keeps Cloudflare credentials out of the smoke dependency installation step", async () => {
    const workflow = await readWorkflow("oidrune-smoke.yml");
    const install = workflow.indexOf("bun install --frozen-lockfile");
    const credentials = workflow.indexOf("CLOUDFLARE_API_TOKEN");

    expect(install).toBeGreaterThanOrEqual(0);
    expect(credentials).toBeGreaterThan(install);
    expect(workflow).not.toContain("bunx");
    expect(workflow).toContain("bun ./node_modules/wrangler/bin/wrangler.js");
  });

  it("enables grouped security update checks for Bun and GitHub Actions", async () => {
    const dependabot = await readFile(".github/dependabot.yml", "utf8");

    expect(dependabot).toContain('package-ecosystem: "npm"');
    expect(dependabot).toContain('package-ecosystem: "github-actions"');
    expect(dependabot).toContain("open-pull-requests-limit");
  });
});

async function readWorkflow(name: string): Promise<string> {
  return readFile(`.github/workflows/${name}`, "utf8");
}
