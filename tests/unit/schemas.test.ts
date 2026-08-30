import { expect, it } from "vitest";
import { workflowCompletedSchema } from "../../src/domain/schemas";

it("requires a caller-provided workflow notification body", () => {
  const result = workflowCompletedSchema.safeParse({
    schema_version: 1,
    event_type: "workflow.completed",
    outcome: "success",
  });

  expect(result.success).toBe(false);
});

it("rejects a body that contains no printable text", () => {
  const result = workflowCompletedSchema.safeParse({
    schema_version: 1,
    event_type: "workflow.completed",
    outcome: "success",
    summary: "\u0000\t\n",
  });

  expect(result.success).toBe(false);
});
