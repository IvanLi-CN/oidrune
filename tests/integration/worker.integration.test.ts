import { applyD1Migrations, SELF, env as testEnv } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import type { Env } from "../../src/worker/bindings";

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
});
