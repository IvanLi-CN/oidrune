import type { Hono } from "hono";
import { z } from "zod";
import { normalizeSummary, retentionExpiry } from "../domain/normalize";
import {
  destinationSchema,
  immutableIdSchema,
  shaSchema,
} from "../domain/schemas";
import type { NotificationEvent } from "../domain/types";
import { OidruneRepository } from "../infrastructure/repository";
import type { AppBindings } from "../worker/app";
import { HttpProblem } from "../worker/errors";

const sourceBodySchema = z.object({
  id: immutableIdSchema,
  confirmation: z.literal(true),
});
const releaseBodySchema = z.object({
  sha: shaSchema,
  confirmation: z.literal(true),
});
const confirmationBodySchema = z.object({ confirmation: z.literal(true) });

export function registerAdminRoutes(app: Hono<AppBindings>): void {
  app.get("/api/admin/config", async (context) => {
    const repository = new OidruneRepository(context.env.DB);
    return context.json(await repository.getAdminConfig());
  });

  app.put("/api/admin/destination", async (context) => {
    const body = destinationSchema.parse(await readJson(context.req.raw));
    const repository = new OidruneRepository(context.env.DB);
    await repository.setDestination(
      body.chatId,
      body.displayName,
      operator(context),
    );
    return context.body(null, 204);
  });

  app.get("/api/admin/sources/owners", async (context) => {
    const config = await new OidruneRepository(context.env.DB).getAdminConfig();
    return context.json({ ownerIds: config.ownerIds });
  });

  app.post("/api/admin/sources/owners", async (context) => {
    const body = sourceBodySchema.parse(await readJson(context.req.raw));
    await new OidruneRepository(context.env.DB).addOwner(
      body.id,
      operator(context),
    );
    return context.body(null, 204);
  });

  app.delete("/api/admin/sources/owners", async (context) => {
    const body = sourceBodySchema.parse(await readJson(context.req.raw));
    await new OidruneRepository(context.env.DB).removeOwner(
      body.id,
      operator(context),
    );
    return context.body(null, 204);
  });

  app.get("/api/admin/sources/repositories", async (context) => {
    const config = await new OidruneRepository(context.env.DB).getAdminConfig();
    return context.json({ repositoryIds: config.repositoryIds });
  });

  app.post("/api/admin/sources/repositories", async (context) => {
    const body = sourceBodySchema.parse(await readJson(context.req.raw));
    await new OidruneRepository(context.env.DB).addRepository(
      body.id,
      operator(context),
    );
    return context.body(null, 204);
  });

  app.delete("/api/admin/sources/repositories", async (context) => {
    const body = sourceBodySchema.parse(await readJson(context.req.raw));
    await new OidruneRepository(context.env.DB).removeRepository(
      body.id,
      operator(context),
    );
    return context.body(null, 204);
  });

  app.get("/api/admin/workflow-releases", async (context) => {
    const config = await new OidruneRepository(context.env.DB).getAdminConfig();
    return context.json({ shas: config.trustedWorkflowShas });
  });

  app.post("/api/admin/workflow-releases", async (context) => {
    const body = releaseBodySchema.parse(await readJson(context.req.raw));
    await new OidruneRepository(context.env.DB).trustWorkflowRelease(
      body.sha,
      operator(context),
    );
    return context.body(null, 204);
  });

  app.delete("/api/admin/workflow-releases", async (context) => {
    const body = releaseBodySchema.parse(await readJson(context.req.raw));
    await new OidruneRepository(context.env.DB).revokeWorkflowRelease(
      body.sha,
      operator(context),
    );
    return context.body(null, 204);
  });

  app.get("/api/admin/events", async (context) => {
    const status =
      context.req.query("status") === "dead_letter" ? "dead_letter" : undefined;
    return context.json({
      events: await new OidruneRepository(context.env.DB).listEvents(status),
    });
  });

  app.get("/api/admin/audit", async (context) => {
    return context.json({
      entries: await new OidruneRepository(context.env.DB).listAudit(),
    });
  });

  app.post("/api/admin/events/:eventId/retry", async (context) => {
    confirmationBodySchema.parse(await readJson(context.req.raw));
    const repository = new OidruneRepository(context.env.DB);
    const event = await repository.beginDeadLetterRetry(
      context.req.param("eventId"),
      operator(context),
    );
    if (!event) {
      throw new HttpProblem(
        404,
        "dead_letter_not_found",
        "The dead letter was not found.",
      );
    }
    try {
      await context.env.DELIVERY_QUEUE.send({ eventId: event.id });
    } catch {
      await repository.restoreDeadLetterRetry(event.id, operator(context));
      throw new HttpProblem(
        503,
        "dead_letter_retry_unavailable",
        "The dead letter remains available to retry.",
      );
    }
    return context.body(null, 202);
  });

  app.post("/api/admin/test-message", async (context) => {
    confirmationBodySchema.parse(await readJson(context.req.raw));
    const repository = new OidruneRepository(context.env.DB);
    const destination = await repository.getDestination();
    if (!destination) {
      throw new HttpProblem(
        409,
        "destination_required",
        "Configure the single Telegram destination first.",
      );
    }
    const now = new Date();
    const event: NotificationEvent = {
      id: crypto.randomUUID(),
      kind: "test.message",
      ownerId: "operator",
      repositoryId: "operator",
      repository: "Oidrune operator console",
      runId: null,
      eventName: "test_message",
      outcome: "success",
      workflowSha: "0".repeat(40),
      summary: normalizeSummary("Fixed-format operator delivery test."),
      destinationChatId: destination.chat_id,
      status: "accepted",
      receivedAt: now.toISOString(),
      expiresAt: retentionExpiry("accepted", now),
    };
    await repository.createEvent(event);
    try {
      await context.env.DELIVERY_QUEUE.send({ eventId: event.id });
    } catch {
      await repository.deleteEvent(event.id);
      throw new HttpProblem(
        503,
        "test_message_unavailable",
        "The test message could not be queued.",
      );
    }
    await repository.audit(
      operator(context),
      "test_message.queued",
      event.id,
      "fixed-format test message",
    );
    return context.body(null, 202);
  });
}

function operator(context: {
  get: (key: "operator") => AppBindings["Variables"]["operator"];
}): AppBindings["Variables"]["operator"] {
  return context.get("operator");
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpProblem(400, "invalid_json", "Request JSON is invalid.");
  }
}
