import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

interface ReleaseContract {
  policy: string;
  target_input: string;
  target_grammar: {
    symbolic: string[];
    explicit: string;
    channel: string;
  };
  baseline: {
    source: string;
    tag_pattern: string;
    must_be_reachable_from: string;
  };
  identity: string[];
  reservation: {
    provider: string;
    states: string[];
    same_identity_recovery: boolean;
  };
  workflow: {
    release_trigger: string;
    release_branch: string;
    serialization: string;
    recovery_token: string;
    deploy: string;
    release_workflow: string;
  };
  notifications: {
    transport: string;
    mode: string;
    on: string;
  };
  excluded_routes: string[];
}

describe("manual release contract", () => {
  it("declares target-only stable release delivery", async () => {
    const contract = JSON.parse(
      await readFile(".github/release-contract.json", "utf8"),
    ) as ReleaseContract;

    expect(contract.policy).toBe("manual-version-release-delivery");
    expect(contract.target_input).toBe("release_target");
    expect(contract.target_grammar).toEqual({
      symbolic: ["patch", "minor", "major"],
      explicit: "X.Y.Z",
      channel: "stable",
    });
    expect(contract.baseline).toEqual({
      source: "latest-deployed-or-unmanaged-non-prerelease-github-release",
      tag_pattern: "vX.Y.Z",
      must_be_reachable_from: "main",
    });
    expect(contract.identity).toEqual([
      "source_sha",
      "release_target",
      "canonical_version",
      "tag",
      "reservation_id",
    ]);
  });

  it("declares durable identity, automatic deploy, and excluded label routing", async () => {
    const contract = JSON.parse(
      await readFile(".github/release-contract.json", "utf8"),
    ) as ReleaseContract;

    expect(contract.reservation).toEqual({
      provider: "github-draft-release",
      states: ["reserved", "published", "deployed"],
      same_identity_recovery: true,
    });
    expect(contract.workflow).toEqual({
      release_trigger: "workflow_dispatch",
      release_branch: "main",
      serialization: "queued-release-dispatches",
      recovery_token: "OIDRUNE_RELEASE_TOKEN-when-workflows-change",
      deploy: "automatic-after-release",
      release_workflow: "Release",
    });
    expect(contract.notifications).toEqual({
      transport: "oidrune-gateway-telegram",
      mode: "metadata-only",
      on: "release-or-deploy-failure",
    });
    expect(contract.excluded_routes).toEqual([
      "pr-label-release",
      "pull-request-labels",
      "run-number-versioning",
    ]);
  });

  it("keeps the checked-in contract connected to the Release workflow", async () => {
    const [contractText, workflow] = await Promise.all([
      readFile(".github/release-contract.json", "utf8"),
      readFile(".github/workflows/release.yml", "utf8"),
    ]);
    const contract = JSON.parse(contractText) as ReleaseContract;

    expect(workflow).toContain(`${contract.workflow.release_trigger}:`);
    expect(workflow).toContain(
      `github.ref == 'refs/heads/${contract.workflow.release_branch}'`,
    );
    expect(workflow).toContain(`name: ${contract.workflow.release_workflow}`);
    expect(workflow).toContain("queue: max");
    expect(workflow).toContain(contract.workflow.recovery_token.split("-")[0]);
    expect(contract.workflow.deploy).toBe("automatic-after-release");
    expect(workflow).toContain("name: Deploy published release");
    expect(workflow).toContain("if: needs.publish-release.result == 'success'");
    expect(workflow).toContain("github.rest.repos.createRelease");
    expect(workflow).toContain(
      "oidrune-release-policy: manual-version-release-delivery",
    );
    expect(workflow).toContain("notify.yml");
  });
});
