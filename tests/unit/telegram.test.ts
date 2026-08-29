import { expect, it } from "vitest";
import { formatTelegramMessage } from "../../src/domain/telegram";

it("formats normalized event facts without credentials", () => {
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
  expect(message).toContain("Repository: acme/service");
  expect(message).toContain("Summary: Published v1.2.3");
  expect(message).not.toContain("-100123");
});
