#!/usr/bin/env python3
"""Validate hashed brand references in the built Console artifact."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist/client"
HASHED_ASSET = re.compile(
    r"^oidrune-(?:favicon(?:-dark)?(?:-\d+x\d+)?|app(?:-a3)?-(?:192x192|512x512)|app-maskable-(?:192x192|512x512))\.[0-9a-f]{12}\.(?:svg|png|ico)$"
)


def fail(message: str) -> None:
    raise SystemExit(f"brand asset validation failed: {message}")


def verify_hash(path: Path) -> None:
    match = HASHED_ASSET.fullmatch(path.name)
    if match is None:
        fail(f"asset is not content hashed: {path.name}")
    expected = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
    actual = path.name.split(".")[-2]
    if actual != expected:
        fail(f"hash mismatch for {path.name}; expected {expected}")


def main() -> None:
    html_path = DIST / "index.html"
    manifest_path = DIST / "manifest.webmanifest"
    if not html_path.is_file() or not manifest_path.is_file():
        fail("built index.html or manifest.webmanifest is missing")

    html = html_path.read_text(encoding="utf-8")
    if "apple-touch-icon" in html.lower():
        fail("built HTML still declares apple-touch-icon")

    referenced_names = re.findall(r"/console/brand/v25/([^\"']+)", html)
    for name in referenced_names:
        path = DIST / "brand/v25" / name
        if not path.is_file():
            fail(f"HTML references missing asset {name}")
        verify_hash(path)

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for icon in manifest.get("icons", []):
        src = icon.get("src", "")
        if not src.startswith("/console/brand/v25/"):
            fail(f"manifest icon is outside /console/: {src}")
        name = src.removeprefix("/console/brand/v25/")
        path = DIST / "brand/v25" / name
        if not path.is_file():
            fail(f"manifest references missing asset {name}")
        verify_hash(path)


if __name__ == "__main__":
    main()
