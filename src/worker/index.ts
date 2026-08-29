import type { DeliveryQueueMessage } from "../domain/types";
import { OidruneRepository } from "../infrastructure/repository";
import { createApp } from "./app";
import type { Env } from "./bindings";
import { deliverBatch } from "./delivery";
import { ReplayGuard } from "./replay-guard";

const app = createApp();

export { ReplayGuard };

export default {
  fetch(
    request: Request,
    env: Env,
    context: ExecutionContext,
  ): Response | Promise<Response> {
    return app.fetch(request, env, context);
  },
  async queue(batch: MessageBatch<unknown>, env: Env): Promise<void> {
    await deliverBatch(batch as MessageBatch<DeliveryQueueMessage>, env);
  },
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    await new OidruneRepository(env.DB).cleanupExpired();
  },
} satisfies ExportedHandler<Env>;
