import { applyD1Migrations, SELF, env as testEnv } from "cloudflare:test";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type {
  DeliveryQueueMessage,
  NotificationEvent,
} from "../../src/domain/types";
import { OidruneRepository } from "../../src/infrastructure/repository";
import { createApp, readBoundedRequestText } from "../../src/worker/app";
import type { Env } from "../../src/worker/bindings";
import { deliverBatch } from "../../src/worker/delivery";

const bindings = testEnv as unknown as Env;

declare const __OIDRUNE_D1_MIGRATIONS__: Array<{
  name: string;
  queries: string[];
}>;

beforeAll(async () => {
  await applyD1Migrations(bindings.DB, __OIDRUNE_D1_MIGRATIONS__);
});

describe("Worker security boundaries", () => {
  it("rejects a public workflow event without a GitHub OIDC bearer token", async () => {
    const response = await SELF.fetch(
      "http://example.com/v1/events/workflow-completed",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schema_version: 1,
          event_type: "workflow.completed",
          outcome: "success",
        }),
      },
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "oidc_token_required",
    });
  });

  it("rejects an invalid bearer before consuming a request body", async () => {
    let bodyWasRead = false;
    const baseRequest = new Request(
      "http://example.com/v1/events/workflow-completed",
      {
        method: "POST",
        headers: {
          authorization: "Bearer not-a-github-oidc-token",
          "content-type": "application/json",
        },
      },
    );
    const request = new Proxy(baseRequest, {
      get(target, property) {
        if (property === "body") {
          bodyWasRead = true;
          throw new Error("the request body must not be consumed");
        }
        const value = Reflect.get(target, property, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    const response = await createApp().fetch(
      request as Request,
      bindings,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "invalid_oidc_token",
    });
    expect(bodyWasRead).toBe(false);
  });

  it("bounds a chunked request with invalid Content-Length before buffering it", async () => {
    let chunksRead = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        chunksRead += 1;
        controller.enqueue(new Uint8Array(4 * 1024));
      },
    });
    const request = new Request("http://example.com", {
      method: "POST",
      headers: { "content-length": "not-a-number" },
      body,
    });

    await expect(readBoundedRequestText(request)).rejects.toMatchObject({
      code: "request_too_large",
    });
    expect(chunksRead).toBe(3);
  });

  it("requires Access identity for the console and administrator API", async () => {
    const [consoleResponse, adminResponse] = await Promise.all([
      SELF.fetch("http://example.com/console/"),
      SELF.fetch("http://example.com/api/admin/config"),
    ]);
    expect(consoleResponse.status).toBe(401);
    expect(adminResponse.status).toBe(401);
  });

  it("provisions the D1 schema and reserves an OIDC jti once", async () => {
    const tables = await bindings.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('notification_events', 'audit_log') ORDER BY name",
    ).all<{ name: string }>();
    expect(tables.results.map((table) => table.name)).toEqual([
      "audit_log",
      "notification_events",
    ]);

    const replayId = bindings.REPLAY_GUARD.idFromName(
      `integration-${crypto.randomUUID()}`,
    );
    const replay = bindings.REPLAY_GUARD.get(replayId);
    const expiresAt = Math.floor(Date.now() / 1_000) + 60;
    const first = await replay.fetch("https://replay/reserve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expiresAt }),
    });
    const duplicate = await replay.fetch("https://replay/reserve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expiresAt }),
    });
    expect(first.status).toBe(201);
    expect(duplicate.status).toBe(409);
  });

  it("fails closed when a revoked release still has a prepared snapshot", async () => {
    const sha = "a".repeat(40);
    const repository = new OidruneRepository(bindings.DB);
    await repository.trustWorkflowRelease(sha, {
      subject: "operator",
      email: null,
    });
    await repository.revokeWorkflowRelease(sha, {
      subject: "operator",
      email: null,
    });
    await bindings.DB.prepare(
      "INSERT INTO release_snapshots (merge_commit_sha, release_intent, workflow_sha, status, created_at, updated_at) VALUES (?, 'type:patch', ?, 'prepared', ?, ?)",
    )
      .bind(
        "b".repeat(40),
        sha,
        new Date().toISOString(),
        new Date().toISOString(),
      )
      .run();

    await expect(repository.isTrustedWorkflowRelease(sha)).resolves.toBe(false);
  });

  it("claims a queued event before Telegram delivery so concurrent messages send once", async () => {
    const repository = new OidruneRepository(bindings.DB);
    const event = notificationEvent();
    await repository.createEvent(event);

    let releaseSend: (() => void) | undefined;
    const sendMayComplete = new Promise<void>((resolve) => {
      releaseSend = resolve;
    });
    let sendCount = 0;
    let firstSendStarted: (() => void) | undefined;
    const firstSend = new Promise<void>((resolve) => {
      firstSendStarted = resolve;
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => {
        sendCount += 1;
        firstSendStarted?.();
        await sendMayComplete;
        return new Response("{}", { status: 200 });
      });
    const firstMessage = queueMessage(event.id);
    const secondMessage = queueMessage(event.id);
    const deliveryEnv = {
      ...bindings,
      TELEGRAM_BOT_TOKEN: "test-token",
    };

    try {
      const firstDelivery = deliverBatch(queueBatch(firstMessage), deliveryEnv);
      await firstSend;
      const secondDelivery = deliverBatch(
        queueBatch(secondMessage),
        deliveryEnv,
      );
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(sendCount).toBe(1);
      expect(secondMessage.retry).toHaveBeenCalledWith({ delaySeconds: 300 });
      releaseSend?.();
      await Promise.all([firstDelivery, secondDelivery]);
      expect(firstMessage.ack).toHaveBeenCalledOnce();
    } finally {
      releaseSend?.();
      fetchSpy.mockRestore();
    }
  });
});

function notificationEvent(): NotificationEvent {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    kind: "workflow.completed",
    ownerId: "1",
    repositoryId: "2",
    repository: "owner/repository",
    runId: "3",
    eventName: "push",
    outcome: "success",
    workflowSha: "c".repeat(40),
    summary: "caller-owned Telegram body",
    destinationChatId: "-1001234567890",
    status: "accepted",
    receivedAt: now,
    expiresAt: now,
  };
}

function queueMessage(eventId: string) {
  return {
    body: { eventId },
    attempts: 0,
    ack: vi.fn(),
    retry: vi.fn(),
  } as unknown as Message<DeliveryQueueMessage>;
}

function queueBatch(message: Message<DeliveryQueueMessage>) {
  return {
    messages: [message],
  } as unknown as MessageBatch<DeliveryQueueMessage>;
}
