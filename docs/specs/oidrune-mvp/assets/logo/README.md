# Oidrune Logo Reference

`oidrune-b2-refinement-v25-reference.png` is the approved visual reference for
the B2-derived logo system. Vector reconstruction is evaluated only against
this 1536 by 1536 PNG.

SHA-256: `65099be6d63171aca1d1b4aceec1d41b495cf435c30eeb20c79d092467a95de6`

The reference image must not be used as an embedded image, clipping mask, or
pixel-derived shape in reconstructed SVG artwork.

## Source and Outputs

- `source/oidrune-b2-refinement-v25-master.svg` is the path-only 1536 x 1536
  nine-grid master used for reconstruction checks.
- `source/oidrune-mark-*.svg` contains the independent relay mark paths.
- `source/oidrune-wordmark.svg` contains the independent outlined wordmark
  paths. It contains no SVG `text` element or font dependency.
- `source/oidrune-app-maskable.svg` is the opaque Navy maskable application
  source with the mark kept inside the platform safe zone.
- `source/oidrune-a1.svg` through `source/oidrune-c3.svg` are the nine locked
  variants. The same variants are copied to the versioned runtime directory at
  `src/console/public/brand/v25/svg/`.
- `proof/logo-nine-grid-v25.png` is the deterministic render of the master for
  final nine-grid review.
- `proof/logo-reconstruction.json` and `proof/logo-reconstruction-diff.png`
  record the deterministic raster comparison against the reference.

The runtime palette is intentionally limited to Ink Navy `#121A2B`, Signal Lime
`#D8F366`, and Paper `#F6F7F9`. A2 is the light favicon and regular application
source. A3 is retained as the dark/inverse application and
favicon source. Published browser and application files in
`src/console/public/brand/v25/` use a 12-character SHA-256 content hash in the
filename. The Manifest and HTML point only to those hashed files. The maskable
icon uses an opaque Navy canvas with a mark occupying about 64% of the canvas
inside the platform safe zone. The mark represents a
controlled relay, accepted event, and state output; it does not reference an
identity protocol or delivery provider.

The Worker marks `/console/` and `/console/manifest.webmanifest` as
`no-cache, must-revalidate`. Hashed favicon and application files are served
with `public, max-age=31536000, immutable`, so an installed client can update
its metadata without retaining an old icon URL.

## Variant Intent

| Variant | Use | Intent and recommendation |
| --- | --- | --- |
| A1 | Round icon | Lime field with the ink relay mark. Recommended where a circular avatar or badge is required. |
| A2 | Favicon and app icon | Lime square field with the ink relay mark. Recommended as the primary browser and installed app visual because the counter remains legible at small sizes. |
| A3 | Dark app/favicon variant | Navy rounded square with the reverse mark. Retained for explicit dark/inverse surfaces and the dark favicon media branch. |
| B1 | Website lockup | Primary mark plus navy wordmark. Recommended for public-facing site navigation. |
| B2 | Console lockup | Module mark plus navy wordmark. Recommended for operator Console branding. |
| B3 | Inverse lockup | Navy field with lime lockup. Recommended for dark or high-contrast brand surfaces. |
| C1 | Console inverse | Compact inverse lockup on a Navy tile. Recommended for dark navigation rails. |
| C2 | Console lime | Compact lockup on a Lime tile. Recommended for selected or featured brand placements. |
| C3 | Compact inverse | Navy round icon with the reverse mark. Recommended where a circular compact mark is needed. |
