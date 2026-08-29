import { MAX_SUMMARY_LENGTH } from "../shared/constants";
import type { WorkflowCompletedInput } from "./schemas";
import type { GitHubClaims, NotificationEvent } from "./types";

export function normalizeSummary(summary: string): string {
  return summary
    .split("")
    .map((character) => {
      const code = character.charCodeAt(0);
      if (code === 9 || code === 10 || code === 13) {
        return " ";
      }
      return code < 32 || code === 127 ? "" : character;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SUMMARY_LENGTH);
}

export function retentionExpiry(
  status: NotificationEvent["status"],
  now: Date,
): string {
  const days = status === "delivered" ? 30 : 90;
  const expiry = new Date(now);
  expiry.setUTCDate(expiry.getUTCDate() + days);
  return expiry.toISOString();
}

export function normalizeWorkflowEvent(
  body: WorkflowCompletedInput,
  claims: GitHubClaims,
  destinationChatId: string | null,
  now = new Date(),
  id = crypto.randomUUID(),
): NotificationEvent {
  return {
    id,
    kind: "workflow.completed",
    ownerId: claims.repository_owner_id,
    repositoryId: claims.repository_id,
    repository: claims.repository,
    runId: claims.run_id ?? null,
    eventName: claims.event_name,
    outcome: body.outcome,
    workflowSha: claims.job_workflow_sha,
    summary: normalizeSummary(body.summary),
    destinationChatId,
    status: "accepted",
    receivedAt: now.toISOString(),
    expiresAt: retentionExpiry("accepted", now),
  };
}
