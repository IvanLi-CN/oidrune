import { describe, expect, it } from "vitest";
import { consoleAssetCacheControl } from "../../src/worker/cache";

describe("Console static asset cache policy", () => {
  it("revalidates the entry document and manifest", () => {
    for (const pathname of [
      "/console",
      "/console/",
      "/console/manifest.webmanifest",
    ]) {
      expect(consoleAssetCacheControl(pathname)).toBe(
        "no-cache, must-revalidate",
      );
    }
  });

  it("makes content-hashed browser and install assets immutable", () => {
    for (const pathname of [
      "/console/brand/v25/oidrune-favicon.0123456789ab.svg",
      "/console/brand/v25/oidrune-favicon-dark.abcdef012345.ico",
      "/console/brand/v25/oidrune-app-192x192.0123456789ab.png",
      "/console/brand/v25/oidrune-app-maskable-512x512.abcdef012345.png",
    ]) {
      expect(consoleAssetCacheControl(pathname)).toBe(
        "public, max-age=31536000, immutable",
      );
    }
  });

  it("does not grant immutable caching to unversioned or unrelated files", () => {
    for (const pathname of [
      "/console/brand/v25/oidrune-lockup-b2-on-dark.svg",
      "/console/brand/v25/oidrune-favicon.svg",
      "/console/assets/index.js",
    ]) {
      expect(consoleAssetCacheControl(pathname)).toBe(
        "no-cache, must-revalidate",
      );
    }
  });
});
