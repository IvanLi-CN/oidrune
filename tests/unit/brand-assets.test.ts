import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const assetRoot = join(root, "src/console/public/brand/v25");
const sourceRoot = join(root, "docs/specs/oidrune-mvp/assets/logo/source");
const palette = new Set(["#121a2b", "#d8f366", "#f6f7f9"]);
const forbiddenSvg = /<(?:image|text|mask|clipPath|filter)\b|data:image/i;
const hashedAsset =
  /^oidrune-(?:favicon(?:-dark)?(?:-\d+x\d+)?|app(?:-a3)?-(?:192x192|512x512)|app-maskable-(?:192x192|512x512))\.[a-f0-9]{12}\.(?:svg|png|ico)$/;

async function read(path: string): Promise<string> {
  return readFile(path, "utf8");
}

function pngDimensions(bytes: Uint8Array): [number, number] {
  expect(Array.from(bytes.subarray(0, 8))).toEqual([
    137, 80, 78, 71, 13, 10, 26, 10,
  ]);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return [view.getUint32(16), view.getUint32(20)];
}

function contentHash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex").slice(0, 12);
}

function requiredName(name: string | undefined): string {
  if (!name) {
    throw new Error("expected generated asset name");
  }
  return name;
}

describe("Oidrune v25 brand asset contract", () => {
  it("keeps every source and runtime SVG path-only and on the approved palette", async () => {
    const names = ["a1", "a2", "a3", "b1", "b2", "b3", "c1", "c2", "c3"];
    const paths = [
      ...names.map((name) => join(sourceRoot, `oidrune-${name}.svg`)),
      ...names.map((name) => join(assetRoot, "svg", `oidrune-${name}.svg`)),
      join(sourceRoot, "oidrune-b2-refinement-v25-master.svg"),
      join(sourceRoot, "oidrune-mark-ink.svg"),
      join(sourceRoot, "oidrune-mark-primary.svg"),
      join(sourceRoot, "oidrune-mark-reverse.svg"),
      join(sourceRoot, "oidrune-mark-module.svg"),
      join(sourceRoot, "oidrune-wordmark.svg"),
      join(sourceRoot, "oidrune-app-maskable.svg"),
      join(assetRoot, "oidrune-lockup-b2-on-dark.svg"),
      join(assetRoot, "oidrune-mark-reverse.svg"),
    ];

    for (const path of paths) {
      const source = await read(path);
      expect(source).not.toMatch(forbiddenSvg);
      for (const color of source.match(/#[0-9a-f]{6}/gi) ?? []) {
        expect(palette.has(color.toLowerCase())).toBe(true);
      }
    }
  });

  it("declares the /console metadata-only manifest and all raster sizes", async () => {
    const manifest = JSON.parse(
      await read(join(root, "src/console/public/manifest.webmanifest")),
    ) as {
      id: string;
      start_url: string;
      scope: string;
      display: string;
      theme_color: string;
      background_color: string;
      icons: Array<{ src: string; sizes: string; purpose?: string }>;
    };
    expect(manifest).toMatchObject({
      id: "/console/",
      start_url: "/console/",
      scope: "/console/",
      display: "standalone",
      theme_color: "#121A2B",
      background_color: "#121A2B",
    });
    expect(manifest.icons).toHaveLength(4);
    for (const icon of manifest.icons) {
      expect(icon.src).toMatch(
        /^\/console\/brand\/v25\/oidrune-(?:app-(?:192x192|512x512)|app-maskable-(?:192x192|512x512))\.[a-f0-9]{12}\.png$/,
      );
      const bytes = await readFile(
        join(assetRoot, requiredName(icon.src.split("/").pop())),
      );
      expect(contentHash(bytes)).toBe(icon.src.split(".").at(-2));
    }

    const sizes: Array<[string, number, number]> = [
      ["oidrune-favicon-16x16", 16, 16],
      ["oidrune-favicon-32x32", 32, 32],
      ["oidrune-favicon-48x48", 48, 48],
      ["oidrune-favicon-dark-16x16", 16, 16],
      ["oidrune-favicon-dark-32x32", 32, 32],
      ["oidrune-favicon-dark-48x48", 48, 48],
      ["oidrune-app-192x192", 192, 192],
      ["oidrune-app-512x512", 512, 512],
      ["oidrune-app-a3-192x192", 192, 192],
      ["oidrune-app-a3-512x512", 512, 512],
      ["oidrune-app-maskable-192x192", 192, 192],
      ["oidrune-app-maskable-512x512", 512, 512],
    ];
    const assetNames = await readdir(assetRoot);
    for (const [name, width, height] of sizes) {
      const filename = assetNames.find((candidate) =>
        candidate.startsWith(`${name}.`),
      );
      expect(filename).toMatch(hashedAsset);
      expect(
        pngDimensions(await readFile(join(assetRoot, requiredName(filename)))),
      ).toEqual([width, height]);
    }
    for (const name of ["oidrune-favicon", "oidrune-favicon-dark"]) {
      const filename = assetNames.find(
        (candidate) =>
          candidate.startsWith(`${name}.`) && candidate.endsWith(".ico"),
      );
      expect(filename).toMatch(hashedAsset);
      expect(
        Array.from(
          (await readFile(join(assetRoot, requiredName(filename)))).subarray(
            0,
            4,
          ),
        ),
      ).toEqual([0, 0, 1, 0]);
    }

    const hashedFiles = assetNames.filter((name) => hashedAsset.test(name));
    expect(hashedFiles).toHaveLength(16);
    for (const name of hashedFiles) {
      const bytes = await readFile(join(assetRoot, name));
      expect(contentHash(bytes)).toBe(name.split(".").at(-2));
      if (name.endsWith(".svg")) {
        const source = new TextDecoder().decode(bytes);
        expect(source).not.toMatch(forbiddenSvg);
        for (const color of source.match(/#[0-9a-f]{6}/gi) ?? []) {
          expect(palette.has(color.toLowerCase())).toBe(true);
        }
      }
    }
  });

  it("keeps the console metadata and brand boundaries explicit", async () => {
    const html = await read(join(root, "src/console/index.html"));
    expect(html).toMatch(/brand\/v25\/oidrune-favicon\.[a-f0-9]{12}\.svg/);
    expect(html).toMatch(/brand\/v25\/oidrune-favicon-dark\.[a-f0-9]{12}\.svg/);
    expect(html).toContain('media="(prefers-color-scheme: light)"');
    expect(html).toContain('media="(prefers-color-scheme: dark)"');
    expect(html).toMatch(/brand\/v25\/oidrune-favicon\.[a-f0-9]{12}\.ico/);
    expect(html).not.toContain("apple-touch-icon");
    expect(html).toContain(
      '<link rel="icon" type="image/x-icon" sizes="any" media="(prefers-color-scheme: light)"',
    );
    expect(html).toContain("manifest.webmanifest");
    expect(html).toContain('content="#121A2B"');

    const assetLinks = [
      ...html.matchAll(/(?:%BASE_URL%|\/console\/)brand\/v25\/([^"']+)/g),
    ];
    expect(assetLinks.length).toBeGreaterThanOrEqual(8);
    for (const [, name] of assetLinks) {
      const filename = requiredName(name);
      expect(filename).toMatch(hashedAsset);
      await expect(readFile(join(assetRoot, filename))).resolves.toBeInstanceOf(
        Buffer,
      );
    }

    const maskable = await read(join(sourceRoot, "oidrune-app-maskable.svg"));
    expect(maskable).toContain(
      '<rect width="512" height="512" fill="#121a2b"/>',
    );
    expect(maskable).toContain("translate(256 256) scale(1.25)");
    const appLight = await read(join(sourceRoot, "oidrune-a2.svg"));
    const appDark = await read(join(sourceRoot, "oidrune-a3.svg"));
    expect(appLight).toContain('fill="#d8f366"');
    expect(appDark).toContain('fill="#121a2b"');
    const runtime = await read(join(root, "src/console/main.tsx"));
    expect(runtime).not.toMatch(
      /serviceWorker|navigator\.serviceWorker|caches\.open/,
    );
    expect(runtime).toContain("oidrune-lockup-b2-on-dark.svg");
    expect(runtime).toContain("oidrune-mark-reverse.svg");
  });
});
