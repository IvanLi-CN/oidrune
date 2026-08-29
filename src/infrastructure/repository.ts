import type { NotificationEvent, OperatorIdentity } from "../domain/types";

interface DestinationRow {
  chat_id: string;
  display_name: string;
  updated_at: string;
}

interface EventRow {
  id: string;
  kind: NotificationEvent["kind"];
  owner_id: string;
  repository_id: string;
  repository: string;
  run_id: string | null;
  event_name: string;
  outcome: NotificationEvent["outcome"];
  workflow_sha: string;
  summary: string;
  destination_chat_id: string | null;
  status: NotificationEvent["status"];
  received_at: string;
  expires_at: string;
}

export interface PublicDestination {
  displayName: string;
  maskedChatId: string;
  updatedAt: string;
}

export interface AdminConfig {
  destination: PublicDestination | null;
  ownerIds: string[];
  repositoryIds: string[];
  trustedWorkflowShas: string[];
}

export class OidruneRepository {
  constructor(private readonly db: D1Database) {}

  async getSourcePolicy(): Promise<{
    ownerIds: Set<string>;
    repositoryIds: Set<string>;
  }> {
    const [owners, repositories] = await Promise.all([
      this.db
        .prepare("SELECT owner_id FROM owner_allowlist")
        .all<{ owner_id: string }>(),
      this.db
        .prepare("SELECT repository_id FROM repository_allowlist")
        .all<{ repository_id: string }>(),
    ]);
    return {
      ownerIds: new Set(owners.results.map((row) => row.owner_id)),
      repositoryIds: new Set(
        repositories.results.map((row) => row.repository_id),
      ),
    };
  }

  async isTrustedWorkflowRelease(sha: string): Promise<boolean> {
    const row = await this.db
      .prepare(
        "SELECT sha FROM trusted_workflow_releases WHERE sha = ? AND revoked_at IS NULL",
      )
      .bind(sha)
      .first<{ sha: string }>();
    return row !== null;
  }

  async getDestination(): Promise<DestinationRow | null> {
    return this.db
      .prepare(
        "SELECT chat_id, display_name, updated_at FROM destinations WHERE singleton = 1",
      )
      .first<DestinationRow>();
  }

  async getAdminConfig(): Promise<AdminConfig> {
    const [destination, owners, repositories, releases] = await Promise.all([
      this.getDestination(),
      this.db
        .prepare("SELECT owner_id FROM owner_allowlist ORDER BY owner_id")
        .all<{ owner_id: string }>(),
      this.db
        .prepare(
          "SELECT repository_id FROM repository_allowlist ORDER BY repository_id",
        )
        .all<{ repository_id: string }>(),
      this.db
        .prepare(
          "SELECT sha FROM trusted_workflow_releases WHERE revoked_at IS NULL ORDER BY created_at DESC",
        )
        .all<{ sha: string }>(),
    ]);

    return {
      destination: destination
        ? {
            displayName: destination.display_name,
            maskedChatId: maskDestination(destination.chat_id),
            updatedAt: destination.updated_at,
          }
        : null,
      ownerIds: owners.results.map((row) => row.owner_id),
      repositoryIds: repositories.results.map((row) => row.repository_id),
      trustedWorkflowShas: releases.results.map((row) => row.sha),
    };
  }

  async setDestination(
    chatId: string,
    displayName: string,
    actor: OperatorIdentity,
  ): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO destinations (singleton, chat_id, display_name, updated_at, updated_by)
         VALUES (1, ?, ?, ?, ?)
         ON CONFLICT(singleton) DO UPDATE SET chat_id = excluded.chat_id, display_name = excluded.display_name,
           updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
      )
      .bind(chatId, displayName, now(), actor.subject)
      .run();
    await this.audit(actor, "destination.updated", "destination", displayName);
  }

  async addOwner(ownerId: string, actor: OperatorIdentity): Promise<void> {
    await this.db
      .prepare(
        "INSERT OR IGNORE INTO owner_allowlist (owner_id, created_by) VALUES (?, ?)",
      )
      .bind(ownerId, actor.subject)
      .run();
    await this.audit(
      actor,
      "source.owner.added",
      ownerId,
      "immutable GitHub owner ID",
    );
  }

  async removeOwner(ownerId: string, actor: OperatorIdentity): Promise<void> {
    await this.db
      .prepare("DELETE FROM owner_allowlist WHERE owner_id = ?")
      .bind(ownerId)
      .run();
    await this.audit(
      actor,
      "source.owner.removed",
      ownerId,
      "immutable GitHub owner ID",
    );
  }

  async addRepository(
    repositoryId: string,
    actor: OperatorIdentity,
  ): Promise<void> {
    await this.db
      .prepare(
        "INSERT OR IGNORE INTO repository_allowlist (repository_id, created_by) VALUES (?, ?)",
      )
      .bind(repositoryId, actor.subject)
      .run();
    await this.audit(
      actor,
      "source.repository.added",
      repositoryId,
      "immutable GitHub repository ID",
    );
  }

  async removeRepository(
    repositoryId: string,
    actor: OperatorIdentity,
  ): Promise<void> {
    await this.db
      .prepare("DELETE FROM repository_allowlist WHERE repository_id = ?")
      .bind(repositoryId)
      .run();
    await this.audit(
      actor,
      "source.repository.removed",
      repositoryId,
      "immutable GitHub repository ID",
    );
  }

  async trustWorkflowRelease(
    sha: string,
    actor: OperatorIdentity,
  ): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO trusted_workflow_releases (sha, created_by, revoked_at, revoked_by)
         VALUES (?, ?, NULL, NULL)
         ON CONFLICT(sha) DO UPDATE SET revoked_at = NULL, revoked_by = NULL`,
      )
      .bind(sha, actor.subject)
      .run();
    await this.audit(
      actor,
      "workflow_release.trusted",
      sha,
      "full reusable workflow commit SHA",
    );
  }

  async revokeWorkflowRelease(
    sha: string,
    actor: OperatorIdentity,
  ): Promise<void> {
    await this.db
      .prepare(
        "UPDATE trusted_workflow_releases SET revoked_at = ?, revoked_by = ? WHERE sha = ?",
      )
      .bind(now(), actor.subject, sha)
      .run();
    await this.audit(
      actor,
      "workflow_release.revoked",
      sha,
      "full reusable workflow commit SHA",
    );
  }

  async createEvent(event: NotificationEvent): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO notification_events (
          id, kind, owner_id, repository_id, repository, run_id, event_name, outcome, workflow_sha,
          summary, destination_chat_id, status, received_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        event.id,
        event.kind,
        event.ownerId,
        event.repositoryId,
        event.repository,
        event.runId,
        event.eventName,
        event.outcome,
        event.workflowSha,
        event.summary,
        event.destinationChatId,
        event.status,
        event.receivedAt,
        event.expiresAt,
      )
      .run();
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.db
      .prepare("DELETE FROM notification_events WHERE id = ?")
      .bind(eventId)
      .run();
  }

  async getEvent(eventId: string): Promise<NotificationEvent | null> {
    const row = await this.db
      .prepare("SELECT * FROM notification_events WHERE id = ?")
      .bind(eventId)
      .first<EventRow>();
    return row ? mapEvent(row) : null;
  }

  async markDelivered(eventId: string): Promise<void> {
    const deliveredAt = now();
    const expiresAt = inDays(30);
    await this.db
      .prepare(
        "UPDATE notification_events SET status = 'delivered', delivered_at = ?, expires_at = ? WHERE id = ?",
      )
      .bind(deliveredAt, expiresAt, eventId)
      .run();
  }

  async markRetrying(eventId: string): Promise<void> {
    await this.db
      .prepare(
        "UPDATE notification_events SET status = 'retrying' WHERE id = ?",
      )
      .bind(eventId)
      .run();
  }

  async markDeadLetter(eventId: string, reason: string): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          "UPDATE notification_events SET status = 'dead_letter', expires_at = ? WHERE id = ?",
        )
        .bind(inDays(90), eventId),
      this.db
        .prepare(
          `INSERT INTO dead_letters (event_id, reason, failed_at) VALUES (?, ?, ?)
             ON CONFLICT(event_id) DO UPDATE SET reason = excluded.reason, failed_at = excluded.failed_at`,
        )
        .bind(eventId, reason, now()),
    ]);
  }

  async recordAttempt(
    eventId: string,
    attemptNumber: number,
    result: "success" | "retryable_failure" | "terminal_failure",
    responseCode: number | null,
    errorCode: string | null,
  ): Promise<void> {
    await this.db
      .prepare(
        `INSERT OR REPLACE INTO delivery_attempts (id, event_id, attempt_number, result, response_code, error_code, occurred_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        eventId,
        attemptNumber,
        result,
        responseCode,
        errorCode,
        now(),
      )
      .run();
  }

  async listEvents(
    status?: "dead_letter",
  ): Promise<Array<Record<string, unknown>>> {
    const statement = status
      ? this.db
          .prepare(
            "SELECT id, repository, outcome, event_name, status, received_at, delivered_at FROM notification_events WHERE status = ? ORDER BY received_at DESC LIMIT 100",
          )
          .bind(status)
      : this.db.prepare(
          "SELECT id, repository, outcome, event_name, status, received_at, delivered_at FROM notification_events ORDER BY received_at DESC LIMIT 100",
        );
    const result = await statement.all<Record<string, unknown>>();
    return result.results;
  }

  async retryDeadLetter(
    eventId: string,
    actor: OperatorIdentity,
  ): Promise<NotificationEvent | null> {
    const event = await this.getEvent(eventId);
    if (event?.status !== "dead_letter") {
      return null;
    }
    await this.db.batch([
      this.db
        .prepare(
          "UPDATE notification_events SET status = 'accepted', expires_at = ? WHERE id = ?",
        )
        .bind(inDays(90), eventId),
      this.db
        .prepare(
          "UPDATE dead_letters SET retried_at = ?, retried_by = ? WHERE event_id = ?",
        )
        .bind(now(), actor.subject, eventId),
    ]);
    await this.audit(
      actor,
      "dead_letter.retried",
      eventId,
      "stored normalized event re-enqueued",
    );
    return { ...event, status: "accepted" };
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.db
      .prepare("DELETE FROM notification_events WHERE expires_at < ?")
      .bind(now())
      .run();
    return result.meta.changes;
  }

  async audit(
    actor: OperatorIdentity,
    action: string,
    subject: string,
    detail: string,
  ): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO audit_log (id, actor, action, subject, detail, occurred_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(
        crypto.randomUUID(),
        actor.email ?? actor.subject,
        action,
        subject,
        detail,
        now(),
      )
      .run();
  }
}

function mapEvent(row: EventRow): NotificationEvent {
  return {
    id: row.id,
    kind: row.kind,
    ownerId: row.owner_id,
    repositoryId: row.repository_id,
    repository: row.repository,
    runId: row.run_id,
    eventName: row.event_name,
    outcome: row.outcome,
    workflowSha: row.workflow_sha,
    summary: row.summary,
    destinationChatId: row.destination_chat_id,
    status: row.status,
    receivedAt: row.received_at,
    expiresAt: row.expires_at,
  };
}

function maskDestination(chatId: string): string {
  if (chatId.length <= 4) {
    return "*".repeat(chatId.length);
  }
  return `${"*".repeat(Math.max(4, chatId.length - 4))}${chatId.slice(-4)}`;
}

function now(): string {
  return new Date().toISOString();
}

function inDays(days: number): string {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString();
}
