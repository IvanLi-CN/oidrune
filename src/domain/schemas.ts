import { z } from "zod";

export const outcomeSchema = z.enum([
  "success",
  "failure",
  "cancelled",
  "skipped",
]);

export const workflowCompletedSchema = z.object({
  schema_version: z.literal(1),
  event_type: z.literal("workflow.completed"),
  outcome: outcomeSchema,
  summary: z
    .string()
    .min(1)
    .max(8_000)
    .refine(
      (value) =>
        [...value].some((character) => {
          const code = character.charCodeAt(0);
          return code >= 32 && code !== 127 && character.trim().length > 0;
        }),
      "summary must contain printable text",
    ),
});

export const immutableIdSchema = z
  .string()
  .regex(/^\d+$/, "must be an immutable GitHub numeric ID");
export const shaSchema = z
  .string()
  .regex(/^[a-f0-9]{40}$/, "must be a full lowercase commit SHA");
export const destinationSchema = z.object({
  chatId: z.string().min(1).max(128),
  displayName: z.string().trim().min(1).max(100),
  confirmation: z.literal(true),
});
export const confirmationSchema = z.object({ confirmation: z.literal(true) });

export type WorkflowCompletedInput = z.infer<typeof workflowCompletedSchema>;
