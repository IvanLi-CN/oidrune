import type { NotificationEvent } from "./types";

export function formatTelegramMessage(event: NotificationEvent): string {
  if (event.kind === "test.message") {
    return formatFixedTestMessage();
  }
  return event.summary;
}

export function formatFixedTestMessage(): string {
  return [
    "Oidrune delivery test",
    "This fixed message confirms queue delivery.",
  ].join("\n");
}
