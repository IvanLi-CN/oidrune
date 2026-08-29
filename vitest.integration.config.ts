import {
  cloudflarePool,
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const d1Migrations = await readD1Migrations("./migrations");

export default defineConfig({
  define: {
    __OIDRUNE_D1_MIGRATIONS__: JSON.stringify(d1Migrations),
  },
  plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })],
  test: {
    include: ["tests/integration/**/*.test.ts"],
    pool: cloudflarePool({ wrangler: { configPath: "./wrangler.jsonc" } }),
  },
});
