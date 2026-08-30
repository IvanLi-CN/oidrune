import { describe, expect, it } from "vitest";
import { normalizeSummary, retentionExpiry } from "../../src/domain/normalize";
import {
  admitsSource,
  hasTrustedWorkflowReference,
  satisfiesRuntimePolicy,
} from "../../src/domain/policy";

describe("source admission", () => {
  it("admits the immutable owner or repository union", () => {
    const policy = { ownerIds: new Set(["1"]), repositoryIds: new Set(["22"]) };
    expect(
      admitsSource(policy, { repository_owner_id: "1", repository_id: "no" }),
    ).toBe(true);
    expect(
      admitsSource(policy, { repository_owner_id: "no", repository_id: "22" }),
    ).toBe(true);
    expect(
      admitsSource(policy, { repository_owner_id: "no", repository_id: "no" }),
    ).toBe(false);
  });

  it("requires a GitHub-hosted allowed event and exact reusable workflow ref", () => {
    const sha = "a".repeat(40);
    expect(
      satisfiesRuntimePolicy({
        runner_environment: "github-hosted",
        event_name: "push",
      }),
    ).toBe(true);
    expect(
      satisfiesRuntimePolicy({
        runner_environment: "self-hosted",
        event_name: "push",
      }),
    ).toBe(false);
    expect(
      satisfiesRuntimePolicy({
        runner_environment: "github-hosted",
        event_name: "pull_request_target",
      }),
    ).toBe(false);
    expect(
      hasTrustedWorkflowReference({
        job_workflow_sha: sha,
        job_workflow_ref: `IvanLi-CN/oidrune/.github/workflows/notify.yml@${sha}`,
      }),
    ).toBe(true);
    expect(
      hasTrustedWorkflowReference({
        job_workflow_sha: sha,
        job_workflow_ref: `fork-owner/forked-oidrune/.github/workflows/notify.yml@${sha}`,
      }),
    ).toBe(true);
    expect(
      hasTrustedWorkflowReference({
        job_workflow_sha: sha,
        job_workflow_ref: "IvanLi-CN/oidrune/.github/workflows/notify.yml@main",
      }),
    ).toBe(false);
    expect(
      hasTrustedWorkflowReference({
        job_workflow_sha: sha,
        job_workflow_ref: `fork-owner/forked-oidrune/.github/workflows/other.yml@${sha}`,
      }),
    ).toBe(false);
    expect(
      hasTrustedWorkflowReference({
        job_workflow_sha: sha,
        job_workflow_ref: `fork-owner/forked-oidrune/.github/workflows/notify.yml@${"b".repeat(40)}`,
      }),
    ).toBe(false);
  });
});

describe("normalization and retention", () => {
  it("removes controls, collapses whitespace, and caps summaries", () => {
    expect(normalizeSummary("  release\u0000   completed\nnow  ")).toBe(
      "release completed now",
    );
    expect(normalizeSummary("x".repeat(1_001))).toHaveLength(1_000);
  });

  it("retains delivered records for 30 days and failures for 90 days", () => {
    const now = new Date("2026-08-29T00:00:00.000Z");
    expect(retentionExpiry("delivered", now)).toBe("2026-09-28T00:00:00.000Z");
    expect(retentionExpiry("dead_letter", now)).toBe(
      "2026-11-27T00:00:00.000Z",
    );
  });
});
