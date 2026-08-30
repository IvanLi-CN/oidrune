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
