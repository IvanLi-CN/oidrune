#!/usr/bin/env python3
"""Generate the path-only Oidrune v25 SVG source and runtime variants."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs/specs/oidrune-mvp/assets/logo"
SOURCE = DOCS / "source"
RUNTIME = ROOT / "src/console/public/brand/v25"
INK = "#121a2b"
LIME = "#d8f366"
PAPER = "#f6f7f9"

WORDMARK_PATHS = (
    ("0", "M1042 952Q1180 779 1180 543Q1180 303 1042 132.5Q904 -38 623 -38Q342 -38 204 132.5Q66 303 66 543Q66 779 204 952Q342 1125 623 1125Q904 1125 1042 952ZM622 884Q497 884 429.5 795.5Q362 707 362 543Q362 379 429.5 290Q497 201 622 201Q747 201 814 290Q881 379 881 543Q881 707 814 795.5Q747 884 622 884Z"),
    ("1251", "M426 1090V0H137V1090ZM426 1483V1220H137V1483Z"),
    ("1820", "M1125 1472V0H848V151Q787 54 709 10Q631 -34 515 -34Q324 -34 193.5 120.5Q63 275 63 517Q63 796 191.5 956Q320 1116 535 1116Q634 1116 711 1072.5Q788 1029 836 952V1472ZM357 538Q357 387 417 297Q476 206 597 206Q718 206 781 296Q844 386 844 529Q844 729 743 815Q681 867 599 867Q474 867 415.5 772.5Q357 678 357 538Z"),
    ("3071", "M681 827Q509 827 450 715Q417 652 417 521V0H130V1090H402V900Q468 1009 517 1049Q597 1116 725 1116Q733 1116 738.5 1115.5Q744 1115 763 1114V822Q736 825 715 826Q694 827 681 827Z"),
    ("3868", "M832 154Q828 149 812 124Q796 99 774 80Q707 20 644.5 -2Q582 -24 498 -24Q256 -24 172 150Q125 246 125 433V1090H417V433Q417 340 439 293Q478 210 592 210Q738 210 792 328Q820 392 820 497V1090H1109V0H832Z"),
    ("5119", "M646 879Q501 879 447 756Q419 691 419 590V0H135V1088H410V929Q465 1013 514 1050Q602 1116 737 1116Q906 1116 1013.5 1027.5Q1121 939 1121 734V0H829V663Q829 749 806 795Q764 879 646 879Z"),
    ("6370", "M1066 320Q1055 223 965 123Q825 -36 573 -36Q365 -36 206 98Q47 232 47 534Q47 817 190.5 968Q334 1119 563 1119Q699 1119 808 1068Q917 1017 988 907Q1052 810 1071 682Q1082 607 1080 466H334Q340 302 437 236Q496 195 579 195Q667 195 722 245Q752 272 775 320ZM784 654Q777 767 715.5 825.5Q654 884 563 884Q464 884 409.5 822Q355 760 341 654Z"),
)


def svg_document(width: int, height: int, viewbox: str, title: str, body: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="{viewbox}" role="img" aria-labelledby="title">\n'
        f'  <title id="title">{title}</title>\n{body}\n</svg>\n'
    )


def mark_body(kind: str, transform: str = "") -> str:
    if kind == "ink":
        core = (
            f'<path d="M72 -98 A116 116 0 1 0 72 98" fill="none" stroke="{INK}" '
            'stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>\n'
            f'<circle r="27" fill="{INK}"/>\n'
            f'<path d="M70 -35H132 M70 0H132 M70 35H132" fill="none" stroke="{INK}" '
            'stroke-width="22" stroke-linecap="round"/> '
        )
    elif kind == "primary":
        core = (
            f'<path d="M72 -98 A116 116 0 1 0 72 98" fill="none" stroke="{INK}" '
            'stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>\n'
            f'<circle r="54" fill="{LIME}"/><circle r="27" fill="{INK}"/>\n'
            f'<path d="M70 -35H132 M70 0H132 M70 35H132" fill="none" stroke="{INK}" '
            'stroke-width="22" stroke-linecap="round"/> '
        )
    elif kind == "reverse":
        core = (
            f'<path d="M72 -98 A116 116 0 1 0 72 98" fill="none" stroke="{LIME}" '
            'stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>\n'
            f'<circle r="54" fill="{LIME}"/><circle r="27" fill="{INK}"/>\n'
            f'<path d="M70 -35H132 M70 0H132 M70 35H132" fill="none" stroke="{LIME}" '
            'stroke-width="22" stroke-linecap="round"/> '
        )
    elif kind == "module":
        core = (
            f'<path d="M72 -98 A116 116 0 1 0 72 98" fill="none" stroke="{INK}" '
            'stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>\n'
            f'<rect x="-48" y="-70" width="205" height="140" rx="35" fill="{INK}"/>\n'
            f'<circle r="27" fill="{LIME}"/>\n'
            f'<path d="M70 -35H132 M70 0H132 M70 35H132" fill="none" stroke="{LIME}" '
            'stroke-width="22" stroke-linecap="round"/> '
        )
    elif kind == "module-reverse":
        core = (
            f'<path d="M72 -98 A116 116 0 1 0 72 98" fill="none" stroke="{LIME}" '
            'stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>\n'
            f'<rect x="-48" y="-70" width="205" height="140" rx="35" fill="{LIME}"/>\n'
            f'<circle r="27" fill="{INK}"/>\n'
            f'<path d="M70 -35H132 M70 0H132 M70 35H132" fill="none" stroke="{INK}" '
            'stroke-width="22" stroke-linecap="round"/> '
        )
    else:
        raise ValueError(kind)
    return f'<g transform="{transform}">{core}</g>'


def wordmark_body(x: float, baseline: float, scale: float, fill: str) -> str:
    paths = "\n".join(
        f'    <path transform="translate({offset} 0)" d="{path}"/>'
        for offset, path in WORDMARK_PATHS
    )
    return (
        f'<g transform="translate({x:g} {baseline:g}) scale({scale:g} {-scale:g})" fill="{fill}">\n'
        f"{paths}\n  </g>"
    )


def lockup_body(kind: str, *, inverse: bool = False, background: str | None = None) -> str:
    fill = LIME if inverse else INK
    parts = []
    if background:
        parts.append(f'<rect x="10" y="10" width="456" height="120" rx="30" fill="{background}"/>')
    parts.append(mark_body(kind, "translate(74 70) scale(.40)"))
    parts.append(wordmark_body(164, 94, 0.034, fill))
    return "\n  ".join(parts)


def grid_body() -> str:
    cells = []
    cells.append(f'<rect width="1536" height="1536" fill="{PAPER}"/>')
    for center, kind, bg in ((256, "ink", "circle"), (768, "ink", "lime"), (1280, "reverse", "navy")):
        if bg == "circle":
            cells.append(f'<circle cx="{center}" cy="248" r="168" fill="{LIME}"/>')
        else:
            color = LIME if bg == "lime" else INK
            cells.append(f'<rect x="{center - 168}" y="80" width="336" height="336" rx="60" fill="{color}"/>')
        cells.append(mark_body(kind, f"translate({center} 248) scale(.76)"))

    for center, kind in ((256, "primary"), (768, "module")):
        cells.append(mark_body(kind, f"translate({center - 106} 754) scale(.66)"))
        cells.append(wordmark_body(center + 4, 772, 0.0263671875, INK))
    cells.extend(
        [
            f'<rect x="1064" y="649" width="432" height="210" rx="40" fill="{INK}"/>',
            mark_body("reverse", "translate(1166 754) scale(.56)"),
            wordmark_body(1272, 770, 0.0244140625, LIME),
        ]
    )
    for center, bg, kind, word_fill in ((256, INK, "reverse", LIME), (768, LIME, "ink", INK)):
        cells.append(f'<rect x="{center - 228}" y="1144" width="456" height="220" rx="42" fill="{bg}"/>')
        cells.append(mark_body(kind, f"translate({center - 121} 1254) scale(.55)"))
        cells.append(wordmark_body(center - 8, 1270, 0.0244140625, word_fill))
    cells.append(f'<circle cx="1280" cy="1254" r="168" fill="{INK}"/>')
    cells.append(mark_body("reverse", "translate(1280 1254) scale(.76)"))
    return "\n  ".join(cells)


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main() -> None:
    SOURCE.mkdir(parents=True, exist_ok=True)
    RUNTIME.mkdir(parents=True, exist_ok=True)

    write(
        SOURCE / "oidrune-b2-refinement-v25-master.svg",
        svg_document(1536, 1536, "0 0 1536 1536", "Oidrune v25 logo system master", grid_body()),
    )

    write(
        SOURCE / "oidrune-mark-ink.svg",
        svg_document(336, 336, "0 0 336 336", "Oidrune ink relay mark", mark_body("ink", "translate(168 168) scale(.76)")),
    )
    write(
        SOURCE / "oidrune-mark-primary.svg",
        svg_document(336, 336, "0 0 336 336", "Oidrune primary relay mark", mark_body("primary", "translate(168 168) scale(.76)")),
    )
    write(
        SOURCE / "oidrune-mark-reverse.svg",
        svg_document(336, 336, "0 0 336 336", "Oidrune reverse relay mark", mark_body("reverse", "translate(168 168) scale(.76)")),
    )
    write(
        SOURCE / "oidrune-mark-module.svg",
        svg_document(336, 336, "0 0 336 336", "Oidrune module relay mark", mark_body("module", "translate(168 168) scale(.76)")),
    )
    write(
        SOURCE / "oidrune-wordmark.svg",
        svg_document(240, 48, "0 0 240 48", "Oidrune outlined wordmark", wordmark_body(0, 38, 0.031, INK)),
    )

    variants = {
        "a1": svg_document(336, 336, "0 0 336 336", "Oidrune A1 round icon", f'<circle cx="168" cy="168" r="168" fill="{LIME}"/>\n  {mark_body("ink", "translate(168 168) scale(.76)")}'),
        "a2": svg_document(336, 336, "0 0 336 336", "Oidrune A2 square icon", f'<rect width="336" height="336" rx="60" fill="{LIME}"/>\n  {mark_body("ink", "translate(168 168) scale(.76)")}'),
        "a3": svg_document(336, 336, "0 0 336 336", "Oidrune A3 inverse square icon", f'<rect width="336" height="336" rx="60" fill="{INK}"/>\n  {mark_body("reverse", "translate(168 168) scale(.76)")}'),
        "b1": svg_document(480, 140, "0 0 480 140", "Oidrune B1 website lockup", lockup_body("primary")),
        "b2": svg_document(480, 140, "0 0 480 140", "Oidrune B2 console lockup", lockup_body("module")),
        "b3": svg_document(480, 140, "0 0 480 140", "Oidrune B3 inverse lockup", lockup_body("reverse", inverse=True, background=INK)),
        "c1": svg_document(480, 140, "0 0 480 140", "Oidrune C1 inverse console lockup", lockup_body("reverse", inverse=True, background=INK)),
        "c2": svg_document(480, 140, "0 0 480 140", "Oidrune C2 lime console lockup", lockup_body("ink", background=LIME)),
        "c3": svg_document(336, 336, "0 0 336 336", "Oidrune C3 inverse round icon", f'<circle cx="168" cy="168" r="168" fill="{INK}"/>\n  {mark_body("reverse", "translate(168 168) scale(.76)")}'),
    }
    for name, content in variants.items():
        write(SOURCE / f"oidrune-{name}.svg", content)
        write(RUNTIME / "svg" / f"oidrune-{name}.svg", content)

    write(
        SOURCE / "oidrune-app-maskable.svg",
        svg_document(
            512,
            512,
            "0 0 512 512",
            "Oidrune maskable application icon",
            f'<rect width="512" height="512" fill="{INK}"/>\n  '
            f'{mark_body("reverse", "translate(256 256) scale(1.25)")}',
        ),
    )
    write(RUNTIME / "oidrune-mark-reverse.svg", SOURCE.joinpath("oidrune-mark-reverse.svg").read_text(encoding="utf-8"))
    # The Console rail is Navy, so the B2 module geometry uses its approved
    # inverse treatment while retaining the B2 lockup spacing and rhythm.
    write(RUNTIME / "oidrune-lockup-b2-on-dark.svg", svg_document(480, 140, "0 0 480 140", "Oidrune B2 inverse console lockup", lockup_body("module-reverse", inverse=True, background=INK)))


if __name__ == "__main__":
    main()
