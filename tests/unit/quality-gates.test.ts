import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

interface QualityGateDeclaration {
  default_branch: string;
  policy: {
    baseline_policy: string;
    require_signed_commits: boolean;
    branch_protection: {
      protected_branches: string[];
      require_pull_request: boolean;
      disallow_direct_pushes: boolean;
    };
  };
  required_checks: string[];
  expected_pr_workflows: Array<{
    workflow: string;
    jobs: string[];
  }>;
}

describe("quality-gate declaration", () => {
  it("declares the required PR checks from the repository contract", async () => {
    const declaration = JSON.parse(
      await readFile(".github/quality-gates.json", "utf8"),
    ) as QualityGateDeclaration;

    expect(declaration.default_branch).toBe("main");
    expect(declaration.required_checks).toEqual(["quality", "Label Gate"]);
    expect(declaration.policy.baseline_policy).toBe("explicit-waiver-required");
    expect(declaration.policy.require_signed_commits).toBe(true);
    expect(declaration.policy.branch_protection).toEqual({
      protected_branches: ["main"],
      require_pull_request: true,
      disallow_direct_pushes: true,
    });
    expect(declaration.policy).not.toHaveProperty("review_policy");
    expect(declaration.expected_pr_workflows).toEqual([
      { workflow: "CI PR", jobs: ["quality"] },
      { workflow: "Label Gate", jobs: ["Label Gate"] },
    ]);
  });

  it("validates release labels for merge-queue commits", async () => {
    const workflow = await readFile(".github/workflows/label-gate.yml", "utf8");

    expect(workflow).toContain("merge_group:");
    expect(workflow).toContain("listPullRequestsAssociatedWithCommit");
    expect(workflow).toContain("mergeGroup?.head_sha");
  });

  it("pins each external GitHub Action to a full commit SHA", async () => {
    const workflowFiles = await readdir(".github/workflows");
    const workflows = await Promise.all(
      workflowFiles.map((file) =>
        readFile(`.github/workflows/${file}`, "utf8"),
      ),
    );

    for (const workflow of workflows) {
      for (const match of workflow.matchAll(/^\s*uses:\s+([^\s]+)\s*$/gm)) {
        const reference = match[1] ?? "";
        if (reference.startsWith("./")) {
          continue;
        }
        expect(reference).toMatch(/^[^@]+@[a-f0-9]{40}$/);
      }
    }
  });
});
