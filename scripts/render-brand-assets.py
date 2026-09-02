#!/usr/bin/env python3
"""Render v25 SVG brand assets into browser, Apple, and PWA raster files."""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "src/console/public/brand/v25"


def render(source: Path, target: Path, size: int) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["/opt/homebrew/bin/rsvg-convert", "-w", str(size), "-h", str(size), str(source), "-o", str(target)],
        check=True,
    )


def main() -> None:
    favicon = ASSETS / "oidrune-favicon.svg"
    favicon_dark = ASSETS / "oidrune-favicon-dark.svg"
    app = ASSETS / "oidrune-app-a2.svg"
    app_dark = ASSETS / "oidrune-app-a3.svg"
    maskable = ASSETS / "oidrune-app-maskable.svg"
    render(favicon, ASSETS / "oidrune-favicon-16x16.png", 16)
    render(favicon, ASSETS / "oidrune-favicon-32x32.png", 32)
    render(favicon, ASSETS / "oidrune-favicon-48x48.png", 48)
    render(favicon_dark, ASSETS / "oidrune-favicon-dark-16x16.png", 16)
    render(favicon_dark, ASSETS / "oidrune-favicon-dark-32x32.png", 32)
    render(favicon_dark, ASSETS / "oidrune-favicon-dark-48x48.png", 48)
    render(app, ASSETS / "oidrune-app-180x180.png", 180)
    render(app, ASSETS / "oidrune-app-192x192.png", 192)
    render(app, ASSETS / "oidrune-app-512x512.png", 512)
    render(app_dark, ASSETS / "oidrune-app-a3-192x192.png", 192)
    render(app_dark, ASSETS / "oidrune-app-a3-512x512.png", 512)
    render(maskable, ASSETS / "oidrune-app-maskable-192x192.png", 192)
    render(maskable, ASSETS / "oidrune-app-maskable-512x512.png", 512)
    magick = shutil.which("magick") or shutil.which("convert")
    if magick is None:
        raise SystemExit("ImageMagick is required to build the favicon ICO")
    subprocess.run(
        [
            magick,
            str(ASSETS / "oidrune-favicon-16x16.png"),
            str(ASSETS / "oidrune-favicon-32x32.png"),
            str(ASSETS / "oidrune-favicon-48x48.png"),
            str(ASSETS / "oidrune-favicon.ico"),
        ],
        check=True,
    )
    subprocess.run(
        [
            magick,
            str(ASSETS / "oidrune-favicon-dark-16x16.png"),
            str(ASSETS / "oidrune-favicon-dark-32x32.png"),
            str(ASSETS / "oidrune-favicon-dark-48x48.png"),
            str(ASSETS / "oidrune-favicon-dark.ico"),
        ],
        check=True,
    )


if __name__ == "__main__":
    main()
