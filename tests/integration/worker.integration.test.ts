import { SELF } from "cloudflare:test";
import { expect, it } from "vitest";

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
