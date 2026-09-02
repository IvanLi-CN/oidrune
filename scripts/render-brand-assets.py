#!/usr/bin/env python3
"""Render v25 SVG brand assets into content-hashed browser and PWA files."""

from __future__ import annotations

import hashlib
import re
import shutil
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "src/console/public/brand/v25"
SOURCE = ROOT / "docs/specs/oidrune-mvp/assets/logo/source"
HASH_LENGTH = 12
HASHED_ASSET = re.compile(
    r"^oidrune-(?:favicon(?:-dark)?(?:-\d+x\d+)?|app(?:-a3)?-(?:192x192|512x512)|app-maskable-(?:192x192|512x512))\.[0-9a-f]{12}\.(?:svg|png|ico)$"
)


def render(source: Path, target: Path, size: int) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "/opt/homebrew/bin/rsvg-convert",
            "-w",
            str(size),
            "-h",
            str(size),
            str(source),
            "-o",
            str(target),
        ],
        check=True,
    )


def content_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:HASH_LENGTH]


def publish(source: Path, logical_name: str) -> str:
    name = f"{logical_name}.{content_hash(source)}{source.suffix}"
    shutil.copyfile(source, ASSETS / name)
    return name


def replace_asset_references(
    path: Path,
    published: dict[str, str],
    prefix: str,
) -> None:
    content = path.read_text(encoding="utf-8")
    for logical_name, published_name in published.items():
        logical_path = Path(logical_name)
        pattern = re.compile(
            rf"{re.escape(prefix)}{re.escape(logical_path.stem)}"
            rf"(?:\.[0-9a-f]{{{HASH_LENGTH}}})?{re.escape(logical_path.suffix)}"
        )
        content = pattern.sub(f"{prefix}{published_name}", content)
    path.write_text(content, encoding="utf-8")


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    for path in ASSETS.iterdir():
        if path.is_file() and HASHED_ASSET.fullmatch(path.name):
            path.unlink()

    favicon = SOURCE / "oidrune-a2.svg"
    favicon_dark = SOURCE / "oidrune-a3.svg"
    app = SOURCE / "oidrune-a2.svg"
    app_dark = SOURCE / "oidrune-a3.svg"
    maskable = SOURCE / "oidrune-app-maskable.svg"
    published: dict[str, str] = {}
    for source, logical_name in (
        (favicon, "oidrune-favicon.svg"),
        (favicon_dark, "oidrune-favicon-dark.svg"),
    ):
        published[logical_name] = publish(source, Path(logical_name).stem)

    magick = shutil.which("magick") or shutil.which("convert")
    if magick is None:
        raise SystemExit("ImageMagick is required to build the favicon ICO")

    with tempfile.TemporaryDirectory(prefix="oidrune-brand-") as temporary_directory:
        temporary = Path(temporary_directory)
        rendered: dict[str, Path] = {}
        raster_sources = (
            (favicon, "oidrune-favicon-16x16", 16),
            (favicon, "oidrune-favicon-32x32", 32),
            (favicon, "oidrune-favicon-48x48", 48),
            (favicon_dark, "oidrune-favicon-dark-16x16", 16),
            (favicon_dark, "oidrune-favicon-dark-32x32", 32),
            (favicon_dark, "oidrune-favicon-dark-48x48", 48),
            (app, "oidrune-app-192x192", 192),
            (app, "oidrune-app-512x512", 512),
            (app_dark, "oidrune-app-a3-192x192", 192),
            (app_dark, "oidrune-app-a3-512x512", 512),
            (maskable, "oidrune-app-maskable-192x192", 192),
            (maskable, "oidrune-app-maskable-512x512", 512),
        )
        for source, logical_name, size in raster_sources:
            target = temporary / f"{logical_name}.png"
            render(source, target, size)
            rendered[logical_name] = target
            published[f"{logical_name}.png"] = publish(target, logical_name)

        for logical_name, names in (
            (
                "oidrune-favicon.ico",
                (
                    "oidrune-favicon-16x16",
                    "oidrune-favicon-32x32",
                    "oidrune-favicon-48x48",
                ),
            ),
            (
                "oidrune-favicon-dark.ico",
                (
                    "oidrune-favicon-dark-16x16",
                    "oidrune-favicon-dark-32x32",
                    "oidrune-favicon-dark-48x48",
                ),
            ),
        ):
            ico = temporary / logical_name
            subprocess.run(
                [magick, *(str(rendered[name]) for name in names), str(ico)],
                check=True,
            )
            published[logical_name] = publish(ico, Path(logical_name).stem)

    replace_asset_references(
        ROOT / "src/console/index.html",
        published,
        "%BASE_URL%brand/v25/",
    )
    replace_asset_references(
        ROOT / "src/console/public/manifest.webmanifest",
        published,
        "/console/brand/v25/",
    )


if __name__ == "__main__":
    main()
