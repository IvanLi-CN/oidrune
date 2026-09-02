const HASHED_BRAND_ASSET =
  /^\/console\/brand\/v25\/oidrune-(?:favicon(?:-dark)?(?:-\d+x\d+)?|app(?:-a3)?-(?:192x192|512x512)|app-maskable-(?:192x192|512x512))\.[a-f0-9]{12}\.(?:svg|png|ico)$/;

export function consoleAssetCacheControl(pathname: string): string {
  if (
    pathname === "/console" ||
    pathname === "/console/" ||
    pathname === "/console/manifest.webmanifest"
  ) {
    return "no-cache, must-revalidate";
  }
  if (HASHED_BRAND_ASSET.test(pathname)) {
    return "public, max-age=31536000, immutable";
  }
  return "no-cache, must-revalidate";
}
