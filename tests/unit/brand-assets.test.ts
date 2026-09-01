import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const assetRoot = join(root, "src/console/public/brand/v25");
const sourceRoot = join(root, "docs/specs/oidrune-mvp/assets/logo/source");
const palette = new Set(["#121a2b", "#d8f366", "#f6f7f9"]);
const forbiddenSvg = /<(?:image|text|mask|clipPath|filter)\b|data:image/i;

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
      join(assetRoot, "oidrune-favicon.svg"),
      join(assetRoot, "oidrune-lockup-b2-on-dark.svg"),
      join(assetRoot, "oidrune-app-a3.svg"),
      join(assetRoot, "oidrune-app-maskable.svg"),
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
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        {
          src: "/console/brand/v25/oidrune-app-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/console/brand/v25/oidrune-app-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/console/brand/v25/oidrune-app-maskable-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/console/brand/v25/oidrune-app-maskable-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ]),
    );

    const sizes: Array<[string, number, number]> = [
      ["oidrune-favicon-16x16.png", 16, 16],
      ["oidrune-favicon-32x32.png", 32, 32],
      ["oidrune-favicon-48x48.png", 48, 48],
      ["oidrune-app-180x180.png", 180, 180],
      ["oidrune-app-192x192.png", 192, 192],
      ["oidrune-app-512x512.png", 512, 512],
      ["oidrune-app-maskable-192x192.png", 192, 192],
      ["oidrune-app-maskable-512x512.png", 512, 512],
    ];
    for (const [name, width, height] of sizes) {
      expect(pngDimensions(await readFile(join(assetRoot, name)))).toEqual([
        width,
        height,
      ]);
    }
    expect(
      Array.from(
        (await readFile(join(assetRoot, "oidrune-favicon.ico"))).subarray(0, 4),
      ),
    ).toEqual([0, 0, 1, 0]);
  });

  it("keeps the console metadata and brand boundaries explicit", async () => {
    const html = await read(join(root, "src/console/index.html"));
    expect(html).toContain("brand/v25/oidrune-favicon.svg");
    expect(html).toContain("brand/v25/oidrune-favicon.ico");
    expect(html).toContain("brand/v25/oidrune-app-180x180.png");
    expect(html).toContain("manifest.webmanifest");
    expect(html).toContain('content="#121A2B"');

    const maskable = await read(join(assetRoot, "oidrune-app-maskable.svg"));
    expect(maskable).toContain(
      '<rect width="512" height="512" fill="#121a2b"/>',
    );
    expect(maskable).toContain("translate(256 256) scale(1.25)");
    const runtime = await read(join(root, "src/console/main.tsx"));
    expect(runtime).not.toMatch(
      /serviceWorker|navigator\.serviceWorker|caches\.open/,
    );
    expect(runtime).toContain("oidrune-lockup-b2-on-dark.svg");
  });
});
