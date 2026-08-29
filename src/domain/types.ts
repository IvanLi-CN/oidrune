export type Outcome = "success" | "failure" | "cancelled" | "skipped";
export type EventStatus = "accepted" | "delivered" | "retrying" | "dead_letter";

export interface GitHubClaims {
  jti: string;
  exp: number;
  repository_owner_id: string;
  repository_id: string;
  repository: string;
  runner_environment: string;
  event_name: string;
  job_workflow_ref: string;
  job_workflow_sha: string;
  run_id?: string;
}

export interface NotificationEvent {
  id: string;
  kind: "workflow.completed" | "test.message";
  ownerId: string;
  repositoryId: string;
  repository: string;
  runId: string | null;
  eventName: string;
  outcome: Outcome;
  workflowSha: string;
  summary: string;
  destinationChatId: string | null;
  status: EventStatus;
  receivedAt: string;
  expiresAt: string;
}

export interface DeliveryQueueMessage {
  eventId: string;
}

export interface OperatorIdentity {
  subject: string;
  email: string | null;
}
