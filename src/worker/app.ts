import { type Context, Hono } from "hono";
import { ZodError } from "zod";
import { registerAdminRoutes } from "../admin/routes";
import { normalizeWorkflowEvent } from "../domain/normalize";
import {
  admitsSource,
  hasTrustedWorkflowReference,
  satisfiesRuntimePolicy,
} from "../domain/policy";
import { workflowCompletedSchema } from "../domain/schemas";
import type { OperatorIdentity } from "../domain/types";
import { verifyAccessIdentity, verifyGitHubOidc } from "../infrastructure/oidc";
import { OidruneRepository } from "../infrastructure/repository";
import { MAX_REQUEST_BYTES } from "../shared/constants";
import type { Env } from "./bindings";
import { asProblem, HttpProblem } from "./errors";
import { releaseReplay, reserveReplay } from "./replay-guard";

export interface AppBindings {
  Bindings: Env;
  Variables: { operator: OperatorIdentity };
}

export function createApp(): Hono<AppBindings> {
  const app = new Hono<AppBindings>();

  app.onError((error, _context) => {
    const problem =
      error instanceof ZodError
        ? new HttpProblem(
            400,
            "invalid_request",
            "The request does not meet the API contract.",
          )
        : asProblem(error);
    return new Response(
      JSON.stringify({ error: problem.code, message: problem.message }),
      {
        status: problem.status,
        headers: { "content-type": "application/json" },
      },
    );
  });

  app.post("/v1/events/workflow-completed", async (context) => {
    const token = bearerToken(context.req.raw);
    const claims = await verifyGitHubOidc(token, context.env);
    const body = await parseBoundedWorkflowBody(context.req.raw);
    const repository = new OidruneRepository(context.env.DB);
    const [sourcePolicy, trusted, destination] = await Promise.all([
      repository.getSourcePolicy(),
      repository.isTrustedWorkflowRelease(claims.job_workflow_sha),
      repository.getDestination(),
    ]);

    if (
      !admitsSource(sourcePolicy, claims) ||
      !satisfiesRuntimePolicy(claims) ||
      !hasTrustedWorkflowReference(claims) ||
      !trusted
    ) {
      throw new HttpProblem(
        403,
        "source_not_admitted",
        "The verified workflow does not satisfy Oidrune policy.",
      );
    }
    if (!destination) {
      throw new HttpProblem(
        503,
        "destination_unavailable",
        "Oidrune has no active destination.",
      );
    }

    try {
      await reserveReplay(context.env.REPLAY_GUARD, claims.jti, claims.exp);
    } catch (error) {
      if (error instanceof Error && error.message === "replay") {
        throw new HttpProblem(
          409,
          "oidc_replay",
          "This OIDC token has already been accepted.",
        );
      }
      throw new HttpProblem(
        503,
        "replay_guard_unavailable",
        "Oidrune could not reserve this token.",
      );
    }

    const event = normalizeWorkflowEvent(body, claims, destination.chat_id);
    try {
      await repository.createEvent(event);
      await context.env.DELIVERY_QUEUE.send({ eventId: event.id });
    } catch {
      await repository.deleteEvent(event.id).catch(() => undefined);
      await releaseReplay(
        context.env.REPLAY_GUARD,
        claims.jti,
        claims.exp,
      ).catch(() => undefined);
      throw new HttpProblem(
        503,
        "durable_handoff_unavailable",
        "Oidrune could not durably accept the event.",
      );
    }
    return context.json({ id: event.id, status: "accepted" }, 202);
  });

  app.use("/api/admin/*", async (context, next) => {
    context.set(
      "operator",
      await verifyAccessIdentity(context.req.raw, context.env),
    );
    await next();
  });
  registerAdminRoutes(app);

  app.all("/console", serveConsoleAssets);
  app.all("/console/*", serveConsoleAssets);

  app.notFound((context) => context.json({ error: "not_found" }, 404));
  return app;
}

async function serveConsoleAssets(
  context: Context<AppBindings>,
): Promise<Response> {
  await verifyAccessIdentity(context.req.raw, context.env);
  const assetUrl = new URL(context.req.raw.url);
  assetUrl.pathname =
    assetUrl.pathname === "/console" || assetUrl.pathname === "/console/"
      ? "/index.html"
      : assetUrl.pathname.replace(/^\/console/, "");
  return context.env.ASSETS.fetch(new Request(assetUrl, context.req.raw));
}

function bearerToken(request: Request): string {
  const value = request.headers.get("authorization");
  const match = value?.match(/^Bearer ([^\s]+)$/i);
  if (!match?.[1]) {
    throw new HttpProblem(
      401,
      "oidc_token_required",
      "A GitHub OIDC bearer token is required.",
    );
  }
  return match[1];
}

async function parseBoundedWorkflowBody(request: Request) {
  const length = request.headers.get("content-length");
  if (isOversizedContentLength(length)) {
    throw new HttpProblem(
      400,
      "request_too_large",
      "The request body must not exceed 8 KiB.",
    );
  }
  const text = await readBoundedRequestText(request);
  try {
    return workflowCompletedSchema.parse(JSON.parse(text));
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw new HttpProblem(400, "invalid_json", "Request JSON is invalid.");
  }
}

function isOversizedContentLength(value: string | null): boolean {
  if (!value || !/^\d+$/.test(value)) {
    return false;
  }
  const length = Number(value);
  return Number.isSafeInteger(length) && length > MAX_REQUEST_BYTES;
}

export async function readBoundedRequestText(
  request: Request,
): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) {
    return "";
  }

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      byteLength += value.byteLength;
      if (byteLength > MAX_REQUEST_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new HttpProblem(
          400,
          "request_too_large",
          "The request body must not exceed 8 KiB.",
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}
