#!/usr/bin/env python3
"""Screenshot reverse-engineering CLI.

    python tools/vision/extract.py probe   docs/milestones/milestone_2/User.png
    python tools/vision/extract.py palette docs/milestones/milestone_2/User.png --accent
    python tools/vision/extract.py regions docs/milestones/milestone_2/Admin.png
    python tools/vision/extract.py crop    docs/milestones/milestone_2/User.png \
        --box 0,0,270,1024 --scale 3 --out build/crops/user/sidebar.png
    python tools/vision/extract.py ocr     build/crops/user/sidebar.png --upscale 2
    python tools/vision/extract.py sample  docs/milestones/milestone_2/User.png --points 120,137
    python tools/vision/extract.py diff    source.png build.png --out build/diff.png
    python tools/vision/extract.py strings source.png build.png

Every subcommand accepts --json <path> to persist machine-readable output.
Exit codes: 0 pass, 1 threshold breach (use in CI), 2 usage/IO error.
"""

from __future__ import annotations

import argparse
import json
import sys

import core


def _parse_points(s: str):
    return [tuple(int(v) for v in p.split(",")) for p in s.split(";") if p.strip()]


def _parse_box(s: str):
    x, y, w, h = (int(v) for v in s.split(","))
    return (x, y, w, h)


def _emit(obj, args, human: str = "") -> None:
    if getattr(args, "json", None):
        core.write_json(obj, args.json)
        print(f"→ {args.json}")
    if human:
        print(human)
    elif not getattr(args, "json", None):
        print(json.dumps(obj, indent=2))


def cmd_probe(args):
    r = core.probe(args.image, css_width=args.css_width)
    lines = [
        f"{r['path']}",
        f"  size          {r['width_px']}x{r['height_px']} px",
        f"  scale factor  {r['scale_factor']}  (assumes {r['assumed_css_width']}px CSS width)",
        f"  css size      {r['css_size'][0]}x{r['css_size'][1]} px",
        "  dominant colours:",
    ]
    for c in r["dominant_colors"]:
        lines.append(f"    {c['hex']}  {c['coverage_pct']:>6.2f}%")
    _emit(r, args, "\n".join(lines))


def cmd_palette(args):
    fn = core.accent_palette if args.accent else core.palette
    rows = fn(args.image, k=args.k)
    label = "accent palette" if args.accent else "palette"
    out = [f"{args.image} — {label} (k={args.k})"]
    for row in rows:
        out.append(f"  {row['hex']}  {row['coverage_pct']:>6.2f}%")
    _emit(rows, args, "\n".join(out))


def cmd_sample(args):
    rows = core.sample(args.image, _parse_points(args.points), box=args.box)
    out = [f"{args.image}"]
    for r in rows:
        out.append(
            f"  ({r['x']},{r['y']})  {r.get('hex', r.get('error'))}"
        )
    _emit(rows, args, "\n".join(out))


def cmd_grid(args):
    r = core.grid(args.image, purity=args.purity, scale=args.scale)
    out = [
        f"{args.image}",
        f"  canvas {r['canvas_hex']}  card {r['card_hex']}  separation {r['canvas_card_separation']}\n"
        f"  sidebar {r['sidebar_edge_px']}px "
        f"(consistency {r['sidebar_edge_consistency']})   gutter {r['median_gutter_px']}px",
        "  rows:",
    ]
    for row in r["rows"]:
        spans = ", ".join(f"{c['w']}" for c in row["cards"])
        out.append(f"    row {row['row']:>2}  y={row['y']:<5} h={row['h']:<5} "
                   f"cards={row['card_count']:<3} widths=[{spans}]")
    if r.get("css"):
        out.append(f"  CSS @scale {r['scale']}: sidebar={r['css']['sidebar_width']}px "
                   f"gutter={r['css']['gutter']}px")
    _emit(r, args, "\n".join(out))


def cmd_crop(args):
    path = core.crop(args.image, _parse_box(args.box), scale=args.scale, out_path=args.out)
    print(f"→ {path}")


def cmd_ocr(args):
    region = _parse_box(args.region) if args.region else None
    r = core.ocr(
        args.image,
        upscale=args.upscale,
        psm=args.psm,
        min_conf=args.min_conf,
        region=region,
    )
    if "error" in r:
        print(f"OCR unavailable: {r['error']}", file=sys.stderr)
        sys.exit(2)
    out = [
        f"{args.image}  words={r['word_count']} lines={r['line_count']} "
        f"suspect={r['suspect_line_count']}"
    ]
    for line in r["lines"]:
        flag = " ⚠" if line["suspect"] else "  "
        out.append(f" {flag} [{line['conf_mean']:>5.1f}] ({line['x']:>4},{line['y']:>4}) {line['text']}")
    _emit(r, args, "\n".join(out))


def cmd_strings(args):
    src = core.ocr(args.source, upscale=args.upscale, psm=args.psm)
    bld = core.ocr(args.build, upscale=args.upscale, psm=args.psm)
    cmp_ = core.compare_strings(src, bld)
    out = [
        f"source {args.source}  ({cmp_['source_count']} lines)",
        f"build  {args.build}  ({cmp_['build_count']} lines)",
        f"matched {cmp_['matched']}  coverage {cmp_['coverage_pct']}%",
        f"MISSING IN BUILD ({len(cmp_['missing_in_build'])}):",
    ]
    for s in cmp_["missing_in_build"]:
        out.append(f"    - {s}")
    _emit(cmp_, args, "\n".join(out))
    if cmp_["missing_in_build"]:
        sys.exit(1)


def cmd_diff(args):
    ignore = [_parse_box(b) for b in (args.ignore or [])]
    if args.structural:
        r = core.structural_diff(args.a, args.b, dilate=args.dilate,
                                 ignore=ignore, out_path=args.out)
        human = (f"{args.a} vs {args.b}  [structural]\n"
                 f"  edge IoU {r['edge_iou_pct']}%  structure mismatch "
                 f"{r['structure_mismatch_pct']}%\n"
                 f"  missing-from-build {r['missing_from_build_px']:,}px  "
                 f"extra-in-build {r['extra_in_build_px']:,}px")
        metric = r["structure_mismatch_pct"]
    else:
        r = core.diff(args.a, args.b, threshold=args.threshold,
                      ignore=ignore, out_path=args.out)
        human = (f"{args.a} vs {args.b}\n"
                 f"  mismatch {r['mismatch_pct']}%  "
                 f"({r['pixels_mismatched']:,} / {r['pixels_considered']:,} px)")
        metric = r["mismatch_pct"]
    if args.out:
        human += f"\n  diff image → {args.out}"
    _emit(r, args, human)
    if metric > args.max_pct:
        print(f"FAIL: {metric}% > {args.max_pct}% budget", file=sys.stderr)
        sys.exit(1)


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="extract.py", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    def add_json(sp):
        sp.add_argument("--json", help="write machine-readable output here")

    sp = sub.add_parser("probe"); sp.add_argument("image")
    sp.add_argument("--css-width", type=float, default=1440.0); add_json(sp)
    sp.set_defaults(func=cmd_probe)

    sp = sub.add_parser("palette"); sp.add_argument("image")
    sp.add_argument("--k", type=int, default=12)
    sp.add_argument("--accent", action="store_true", help="drop neutrals, keep brand colours")
    add_json(sp); sp.set_defaults(func=cmd_palette)

    sp = sub.add_parser("sample"); sp.add_argument("image")
    sp.add_argument("--points", required=True, help="x,y;x,y;...")
    sp.add_argument("--box", type=int, default=3); add_json(sp)
    sp.set_defaults(func=cmd_sample)

    sp = sub.add_parser("grid"); sp.add_argument("image")
    sp.add_argument("--purity", type=float, default=0.90)
    sp.add_argument("--scale", type=float, default=None); add_json(sp)
    sp.set_defaults(func=cmd_grid)

    sp = sub.add_parser("crop"); sp.add_argument("image")
    sp.add_argument("--box", required=True, help="x,y,w,h")
    sp.add_argument("--scale", type=int, default=3)
    sp.add_argument("--out", default=""); sp.set_defaults(func=cmd_crop)

    sp = sub.add_parser("ocr"); sp.add_argument("image")
    sp.add_argument("--upscale", type=int, default=3)
    sp.add_argument("--psm", type=int, default=6)
    sp.add_argument("--min-conf", type=int, default=40)
    sp.add_argument("--region", help="x,y,w,h"); add_json(sp)
    sp.set_defaults(func=cmd_ocr)

    sp = sub.add_parser("strings"); sp.add_argument("source"); sp.add_argument("build")
    sp.add_argument("--upscale", type=int, default=3)
    sp.add_argument("--psm", type=int, default=6); add_json(sp)
    sp.set_defaults(func=cmd_strings)

    sp = sub.add_parser("diff"); sp.add_argument("a"); sp.add_argument("b")
    sp.add_argument("--threshold", type=int, default=24)
    sp.add_argument("--structural", action="store_true",
                    help="colour-invariant edge comparison (use when the build palette differs from the design)")
    sp.add_argument("--dilate", type=int, default=2)
    sp.add_argument("--max-pct", type=float, default=2.0)
    sp.add_argument("--ignore", action="append", help="x,y,w,h (repeatable)")
    sp.add_argument("--out", default=""); add_json(sp)
    sp.set_defaults(func=cmd_diff)

    return p


if __name__ == "__main__":
    args = build_parser().parse_args()
    args.func(args)
