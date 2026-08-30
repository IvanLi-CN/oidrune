export const OIDRUNE_AUDIENCE = "oidrune-gateway";
export const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
export const TRUSTED_WORKFLOW_REPOSITORY = "IvanLi-CN/oidrune";
export const TRUSTED_WORKFLOW_PATH = ".github/workflows/notify.yml";
export const ACCEPTED_EVENTS = new Set([
  "push",
  "workflow_dispatch",
  "schedule",
  "release",
  "pull_request",
]);
export const SUCCESS_RETENTION_DAYS = 30;
export const FAILURE_RETENTION_DAYS = 90;
export const MAX_SUMMARY_LENGTH = 1_000;
export const MAX_REQUEST_BYTES = 8 * 1024;
export const MAX_DELIVERY_ATTEMPTS = 3;
export const DELIVERY_CLAIM_RETRY_SECONDS = 300;
export const TELEGRAM_REQUEST_TIMEOUT_SECONDS = 240;
