import { expect, it } from "vitest";
import { formatTelegramMessage } from "../../src/domain/telegram";

it("uses only the caller-provided body for workflow notifications", () => {
  const message = formatTelegramMessage({
    id: "event-1",
    kind: "workflow.completed",
    ownerId: "1",
    repositoryId: "2",
    repository: "acme/service",
    runId: "42",
    eventName: "release",
    outcome: "success",
    workflowSha: "a".repeat(40),
    summary: "Published v1.2.3",
    destinationChatId: "-100123",
    status: "accepted",
    receivedAt: "2026-08-29T00:00:00.000Z",
    expiresAt: "2026-11-27T00:00:00.000Z",
  });
  expect(message).toBe("Published v1.2.3");
  expect(message).not.toContain("Repository:");
  expect(message).not.toContain("Outcome:");
  expect(message).not.toContain("Event:");
  expect(message).not.toContain("Run:");
});

it("keeps operator test messages fixed", () => {
  const message = formatTelegramMessage({
    id: "test-event-1",
    kind: "test.message",
    ownerId: "operator",
    repositoryId: "operator",
    repository: "Oidrune operator console",
    runId: null,
    eventName: "operator.test",
    outcome: "success",
    workflowSha: "0".repeat(40),
    summary: "Caller text is ignored for fixed tests.",
    destinationChatId: "-100123",
    status: "accepted",
    receivedAt: "2026-08-29T00:00:00.000Z",
    expiresAt: "2026-11-27T00:00:00.000Z",
  });
  expect(message).toBe(
    "Oidrune delivery test\nThis fixed message confirms queue delivery.",
  );
});
