import { afterEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "../../src/console/api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("console admin API", () => {
  it("accepts the empty 202 response returned after a test message is queued", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 202 })),
    );

    await expect(adminApi.sendTest()).resolves.toBeUndefined();
  });
});
