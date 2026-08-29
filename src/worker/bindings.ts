export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  DELIVERY_QUEUE: Queue;
  DELIVERY_DLQ: Queue;
  REPLAY_GUARD: DurableObjectNamespace;
  TELEGRAM_BOT_TOKEN?: string;
  OIDC_AUDIENCE?: string;
  ACCESS_AUD?: string;
  ACCESS_TEAM_DOMAIN?: string;
}
