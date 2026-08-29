import type { NotificationEvent } from "./types";

export function formatTelegramMessage(event: NotificationEvent): string {
  if (event.kind === "test.message") {
    return formatFixedTestMessage();
  }
  const headline = "Workflow completed";
  const lines = [
    headline,
    `Repository: ${event.repository}`,
    `Outcome: ${event.outcome}`,
    `Event: ${event.eventName}`,
    `Run: ${event.runId ?? "not provided"}`,
  ];

  if (event.summary) {
    lines.push(`Summary: ${event.summary}`);
  }

  return lines.join("\n");
}

export function formatFixedTestMessage(): string {
  return [
    "Oidrune delivery test",
    "This fixed message confirms queue delivery.",
  ].join("\n");
}
