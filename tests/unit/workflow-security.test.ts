import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("release workflow security boundaries", () => {
  it("validates a backfill SHA as a main ancestor before checking it out", async () => {
    const workflow = await readWorkflow("release.yml");
    const validation = workflow.indexOf("name: Validate release target");
    const checkout = workflow.indexOf("uses: actions/checkout@");

    expect(validation).toBeGreaterThanOrEqual(0);
    expect(checkout).toBeGreaterThan(validation);
    expect(workflow).toContain("github.rest.repos.compareCommits");
    expect(workflow).toContain('base: sha, head: "main"');
    expect(workflow).toContain('pr.merged_at && pr.base.ref === "main"');
  });

  it("allows a manual release only from the main workflow definition", async () => {
    const workflow = await readWorkflow("release.yml");

    expect(workflow).toContain(
      "github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'",
    );
  });

  it("checks revocation before checking out the validated release target", async () => {
    const workflow = await readWorkflow("release.yml");
    const revocationCheck = workflow.indexOf(
      "name: Refuse a revoked workflow release",
    );
    const targetCheckout = workflow.indexOf("name: Checkout validated release");

    expect(revocationCheck).toBeGreaterThanOrEqual(0);
    expect(targetCheckout).toBeGreaterThan(revocationCheck);
  });

  it("uses a permanently pinned release for failure notification instead of a prepared snapshot", async () => {
    const workflow = await readWorkflow("release.yml");

    expect(workflow).toContain("close-failed-release-snapshot");
    expect(workflow).toMatch(
      /uses:\s+IvanLi-CN\/oidrune\/\.github\/workflows\/notify\.yml@[a-f0-9]{40}/,
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
