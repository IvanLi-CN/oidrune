import {
  cloudflarePool,
  cloudflareTest,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })],
  test: {
    include: ["tests/integration/**/*.test.ts"],
    pool: cloudflarePool({ wrangler: { configPath: "./wrangler.jsonc" } }),
  },
});
