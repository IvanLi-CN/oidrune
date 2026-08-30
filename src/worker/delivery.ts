import { formatTelegramMessage } from "../domain/telegram";
import type { DeliveryQueueMessage } from "../domain/types";
import { OidruneRepository } from "../infrastructure/repository";
import {
  DELIVERY_CLAIM_RETRY_SECONDS,
  MAX_DELIVERY_ATTEMPTS,
  TELEGRAM_REQUEST_TIMEOUT_SECONDS,
} from "../shared/constants";
import type { Env } from "./bindings";

export async function deliverBatch(
  batch: MessageBatch<DeliveryQueueMessage>,
  env: Env,
): Promise<void> {
  const repository = new OidruneRepository(env.DB);
  for (const message of batch.messages) {
    const event = await repository.getEvent(message.body.eventId);
    if (!event || event.status === "delivered") {
      message.ack();
      continue;
    }
    if (event.status === "dead_letter") {
      await env.DELIVERY_DLQ.send({ eventId: event.id });
      message.ack();
      continue;
    }
    const claimId = await repository.claimDelivery(event.id);
    if (!claimId) {
      message.retry({ delaySeconds: DELIVERY_CLAIM_RETRY_SECONDS });
      continue;
    }
    if (!event.destinationChatId || !env.TELEGRAM_BOT_TOKEN) {
      await failTerminal(
        repository,
        env,
        event.id,
        claimId,
        message,
        "telegram_not_configured",
      );
      continue;
    }
    const result = await sendTelegram(
      env.TELEGRAM_BOT_TOKEN,
      event.destinationChatId,
      formatTelegramMessage(event),
    );
    const attempt = message.attempts + 1;
    if (result.ok) {
      await repository.recordAttempt(
        event.id,
        attempt,
        "success",
        result.status,
        null,
      );
      await repository.markDelivered(event.id, claimId);
      message.ack();
      continue;
    }
    if (result.retryable && attempt < MAX_DELIVERY_ATTEMPTS) {
      await repository.recordAttempt(
        event.id,
        attempt,
        "retryable_failure",
        result.status,
        result.errorCode,
      );
      await repository.markRetrying(event.id, claimId);
      message.retry({ delaySeconds: Math.min(300, 2 ** attempt * 10) });
      continue;
    }
    await failTerminal(
      repository,
      env,
      event.id,
      claimId,
      message,
      result.errorCode,
      result.status,
    );
  }
}

async function failTerminal(
  repository: OidruneRepository,
  env: Env,
  eventId: string,
  claimId: string,
  message: Message<DeliveryQueueMessage>,
  errorCode: string,
  status: number | null = null,
): Promise<void> {
  const attempt = message.attempts + 1;
  await repository.recordAttempt(
    eventId,
    attempt,
    "terminal_failure",
    status,
    errorCode,
  );
  await repository.markDeadLetter(eventId, claimId, errorCode);
  await repository.auditSystem(
    "delivery.dead_lettered",
    eventId,
    `terminal Telegram failure: ${errorCode}`,
  );
  await env.DELIVERY_DLQ.send({ eventId });
  message.ack();
}

async function sendTelegram(
  token: string,
  chatId: string,
  text: string,
): Promise<{
  ok: boolean;
  retryable: boolean;
  status: number | null;
  errorCode: string;
}> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(TELEGRAM_REQUEST_TIMEOUT_SECONDS * 1_000),
      },
    );
    if (response.ok) {
      return {
        ok: true,
        retryable: false,
        status: response.status,
        errorCode: "",
      };
    }
    return {
      ok: false,
      retryable: response.status === 429 || response.status >= 500,
      status: response.status,
      errorCode: `telegram_http_${response.status}`,
    };
  } catch {
    return {
      ok: false,
      retryable: true,
      status: null,
      errorCode: "telegram_network_error",
    };
  }
}
