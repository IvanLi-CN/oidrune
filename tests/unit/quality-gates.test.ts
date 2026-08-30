import { readdir, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

interface QualityGateDeclaration {
  default_branch: string;
  policy: {
    full_sha_action_pinning_required: boolean;
    review_policy_required: boolean;
  };
  required_checks: string[];
  pull_request_workflows: Record<string, string[]>;
}

describe("quality-gate declaration", () => {
  it("declares the required PR checks from the repository contract", async () => {
    const declaration = JSON.parse(
      await readFile(".github/quality-gates.json", "utf8"),
    ) as QualityGateDeclaration;

    expect(declaration.default_branch).toBe("main");
    expect(declaration.required_checks).toEqual(["quality", "Label Gate"]);
    expect(declaration.policy.full_sha_action_pinning_required).toBe(true);
    expect(declaration.policy.review_policy_required).toBe(true);
    expect(declaration.pull_request_workflows["CI PR"]).toContain("quality");
    expect(declaration.pull_request_workflows["Label Gate"]).toEqual([
      "Label Gate",
    ]);
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
