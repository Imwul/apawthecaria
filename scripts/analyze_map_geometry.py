#!/usr/bin/env python3
"""Offline map-geometry audit.

Raster JPEG is the visual source of truth. This script never runs in the
browser. It scores existing traced polylines and location anchors against
the printed map, then writes intermediate JSON for human review.

It does not overwrite src/data/roadNetworkGeometry.ts.
"""

from __future__ import annotations

import json
import math
import re
import statistics
from collections import defaultdict
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "public" / "Apawthecaria Map Back.jpg"
GEOM_PATH = ROOT / "src" / "data" / "roadNetworkGeometry.ts"
APP_PATH = ROOT / "src" / "App.tsx"
OUT_DIR = ROOT / "output" / "map-detection"
SUMMARY_PATH = ROOT / "src" / "map" / "detection" / "mapDetectionSummary.json"

COORDINATE_SPACE = "percent-0-100"
MAX_LOCATION_SNAP_PERCENT = 2.5
ROAD_SEARCH_PX = 3
ROAD_WIDE_SEARCH_PX = 6
CANDIDATE_GRID = 8
NEAR_EXISTING_PX = 7

HIGH_ALIGN = 0.82
MEDIUM_ALIGN = 0.58


def rgb_to_hsl(r: int, g: int, b: int) -> tuple[float, float, float]:
    rf, gf, bf = r / 255.0, g / 255.0, b / 255.0
    mx, mn = max(rf, gf, bf), min(rf, gf, bf)
    lightness = (mx + mn) / 2.0
    if mx == mn:
        return 0.0, 0.0, lightness
    delta = mx - mn
    sat = delta / (1.0 - abs(2.0 * lightness - 1.0))
    if mx == rf:
        hue = ((gf - bf) / delta) % 6.0
    elif mx == gf:
        hue = (bf - rf) / delta + 2.0
    else:
        hue = (rf - gf) / delta + 4.0
    return hue * 60.0, sat, lightness


def parse_geometries(source: str) -> list[dict]:
    edges: list[dict] = []
    pattern = re.compile(
        r"\{\s*from:\s*(\d+),\s*to:\s*(\d+),\s*points:\s*\[(.*?)\]\s*\}",
        re.S,
    )
    pair = re.compile(r"\[(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)\]")
    for match in pattern.finditer(source):
        points = [(float(x), float(y)) for x, y in pair.findall(match.group(3))]
        if len(points) < 2:
            continue
        edges.append({
            "from": int(match.group(1)),
            "to": int(match.group(2)),
            "points": points,
        })
    return edges


def parse_named_locations(source: str) -> dict[str, dict]:
    block = re.search(
        r"const MAP_LOCATIONS: Record<string, MapLocationNode> = \{([\s\S]*?)\n\};",
        source,
    )
    if not block:
        raise SystemExit("MAP_LOCATIONS block not found")
    locations: dict[str, dict] = {}
    entry = re.compile(r"([a-z0-9_]+):\s*\{([^}]+)\}")
    for match in entry.finditer(block.group(1)):
        body = match.group(2)
        label_match = re.search(r"label:\s*(?:'((?:\\'|[^'])*)'|\"((?:\\\"|[^\"])*)\")", body)
        x_match = re.search(r"x:\s*([0-9.]+)", body)
        y_match = re.search(r"y:\s*([0-9.]+)", body)
        neighbors_match = re.search(r"neighbors:\s*\[([^\]]*)\]", body)
        if not (label_match and x_match and y_match and neighbors_match):
            continue
        neighbors = [token[1:-1] for token in re.findall(r"'[^']+'|\"[^\"]+\"", neighbors_match.group(1))]
        locations[match.group(1)] = {
            "id": match.group(1),
            "label": label_match.group(1) or label_match.group(2) or match.group(1),
            "x": float(x_match.group(1)),
            "y": float(y_match.group(1)),
            "neighbors": neighbors,
        }
    return locations


def to_px(x: float, y: float, width: int, height: int) -> tuple[int, int]:
    return int(round(x / 100.0 * (width - 1))), int(round(y / 100.0 * (height - 1)))


def to_pct(ix: int, iy: int, width: int, height: int) -> tuple[float, float]:
    return ix / (width - 1) * 100.0, iy / (height - 1) * 100.0


def clamp_px(ix: int, iy: int, width: int, height: int) -> tuple[int, int]:
    return max(0, min(width - 1, ix)), max(0, min(height - 1, iy))


def is_roadish(h: float, s: float, l: float) -> bool:
    """Thin printed road ink: warm brown, mid-dark, not paper and not deep water."""
    warm = 8.0 <= h <= 55.0 or h >= 345.0
    return warm and 0.07 <= s <= 0.55 and 0.18 <= l <= 0.58


def is_waterish(h: float, s: float, l: float) -> bool:
    dark_loch = l <= 0.24 and s <= 0.35
    blue_swirl = 185.0 <= h <= 250.0 and s >= 0.12 and l <= 0.55
    return dark_loch or blue_swirl


def is_paperish(h: float, s: float, l: float) -> bool:
    return l >= 0.62 and s <= 0.28


def is_marker_ink(r: int, g: int, b: int) -> bool:
    h, s, l = rgb_to_hsl(r, g, b)
    saturated = s >= 0.28 and 0.18 <= l <= 0.72
    dark_square = l <= 0.22 and max(r, g, b) <= 80
    bright_city = l >= 0.86 and s <= 0.35 and min(r, g, b) >= 210
    return saturated or dark_square or bright_city


def sample_disk(pixels, cx: int, cy: int, radius: int, width: int, height: int):
    found = []
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            if dx * dx + dy * dy > radius * radius:
                continue
            ix, iy = clamp_px(cx + dx, cy + dy, width, height)
            found.append(pixels[ix, iy])
    return found


def alignment_for_edge(pixels, edge: dict, width: int, height: int) -> dict:
    points = edge["points"]
    step = max(1, len(points) // 24)
    sampled = points[::step]
    if sampled[-1] != points[-1]:
        sampled.append(points[-1])

    hits = 0
    wide_hits = 0
    water_hits = 0
    offsets: list[float] = []
    for x, y in sampled:
        ix, iy = to_px(x, y, width, height)
        disk = sample_disk(pixels, ix, iy, ROAD_SEARCH_PX, width, height)
        wide = sample_disk(pixels, ix, iy, ROAD_WIDE_SEARCH_PX, width, height)
        road_near = False
        best = ROAD_WIDE_SEARCH_PX + 1
        for index, (r, g, b) in enumerate(disk):
            h, s, l = rgb_to_hsl(r, g, b)
            if is_waterish(h, s, l):
                water_hits += 1
            if is_roadish(h, s, l):
                road_near = True
                dy = (index // (ROAD_SEARCH_PX * 2 + 1)) - ROAD_SEARCH_PX
                dx = (index % (ROAD_SEARCH_PX * 2 + 1)) - ROAD_SEARCH_PX
                best = min(best, math.hypot(dx, dy))
        if any(is_roadish(*rgb_to_hsl(*color)) for color in wide):
            wide_hits += 1
        if road_near:
            hits += 1
            offsets.append(best)

    count = len(sampled)
    hit_ratio = hits / count
    wide_ratio = wide_hits / count
    water_ratio = water_hits / max(1, count * (ROAD_SEARCH_PX * 2 + 1) ** 2)
    mean_offset = statistics.fmean(offsets) if offsets else ROAD_WIDE_SEARCH_PX
    max_offset = max(offsets) if offsets else ROAD_WIDE_SEARCH_PX
    score = (0.7 * hit_ratio) + (0.3 * wide_ratio) - min(0.25, water_ratio * 4)
    if score >= HIGH_ALIGN:
        band = "HIGH"
    elif score >= MEDIUM_ALIGN:
        band = "MEDIUM"
    else:
        band = "LOW"
    return {
        "from": edge["from"],
        "to": edge["to"],
        "pointCount": len(points),
        "samples": count,
        "hitRatio": round(hit_ratio, 4),
        "wideHitRatio": round(wide_ratio, 4),
        "waterRatio": round(water_ratio, 4),
        "meanOffsetPx": round(mean_offset, 3),
        "maxOffsetPx": round(max_offset, 3),
        "score": round(max(0.0, min(1.0, score)), 4),
        "confidence": band,
    }


def waypoint_positions(edges: list[dict]) -> dict[int, tuple[float, float]]:
    positions: dict[int, tuple[float, float]] = {}
    for edge in edges:
        if edge["from"] not in positions:
            positions[edge["from"]] = edge["points"][0]
        if edge["to"] not in positions:
            positions[edge["to"]] = edge["points"][-1]
    return positions


def junction_nodes(edges: list[dict]) -> list[dict]:
    degree: dict[int, int] = defaultdict(int)
    for edge in edges:
        degree[edge["from"]] += 1
        degree[edge["to"]] += 1
    positions = waypoint_positions(edges)
    return [
        {
            "id": node,
            "degree": degree[node],
            "x": positions[node][0],
            "y": positions[node][1],
            "kind": "junction" if degree[node] >= 3 else "endpoint",
        }
        for node in sorted(degree)
        if degree[node] != 2
    ]


def match_location(pixels, location: dict, width: int, height: int) -> dict:
    cx, cy = to_px(location["x"], location["y"], width, height)
    radius = int(round(MAX_LOCATION_SNAP_PERCENT / 100.0 * width))
    best = None
    for iy in range(cy - radius, cy + radius + 1, 1):
        for ix in range(cx - radius, cx + radius + 1, 1):
            if ix < 1 or iy < 1 or ix >= width - 1 or iy >= height - 1:
                continue
            if (ix - cx) ** 2 + (iy - cy) ** 2 > radius * radius:
                continue
            r, g, b = pixels[ix, iy]
            if not is_marker_ink(r, g, b):
                continue
            neighbors = [pixels[ix + dx, iy + dy] for dx in (-1, 0, 1) for dy in (-1, 0, 1)]
            similar = sum(1 for nr, ng, nb in neighbors if is_marker_ink(nr, ng, nb))
            if similar < 4:
                continue
            dist_px = math.hypot(ix - cx, iy - cy)
            score = similar / 9.0 - dist_px / (radius + 1)
            if best is None or score > best["score"]:
                px, py = to_pct(ix, iy, width, height)
                best = {
                    "x": round(px, 3),
                    "y": round(py, 3),
                    "offsetPercent": round(math.hypot(px - location["x"], py - location["y"]), 3),
                    "offsetPx": round(dist_px, 2),
                    "score": round(score, 4),
                }
    if best is None:
        status = "UNMATCHED"
        readiness = "UNSAFE"
    elif best["offsetPercent"] <= 1.1:
        status = "VERIFIED"
        readiness = "READY"
    elif best["offsetPercent"] <= MAX_LOCATION_SNAP_PERCENT:
        status = "PROBABLE"
        readiness = "NEEDS_REVIEW"
    else:
        status = "UNMATCHED"
        readiness = "UNSAFE"
    return {
        "id": location["id"],
        "label": location["label"],
        "x": location["x"],
        "y": location["y"],
        "status": status,
        "readiness": readiness,
        "candidate": None if status == "UNMATCHED" else {
            "x": best["x"],
            "y": best["y"],
            "offsetPercent": best["offsetPercent"],
            "offsetPx": best["offsetPx"],
        },
    }


def missing_road_cells(pixels, edges: list[dict], width: int, height: int) -> list[dict]:
    occupied = set()
    for edge in edges:
        for x, y in edge["points"][::3]:
            ix, iy = to_px(x, y, width, height)
            gx, gy = ix // CANDIDATE_GRID, iy // CANDIDATE_GRID
            for ox in range(-1, 2):
                for oy in range(-1, 2):
                    occupied.add((gx + ox, gy + oy))

    cells: list[dict] = []
    for iy in range(CANDIDATE_GRID, height - CANDIDATE_GRID, CANDIDATE_GRID):
        for ix in range(CANDIDATE_GRID, width - CANDIDATE_GRID, CANDIDATE_GRID):
            key = (ix // CANDIDATE_GRID, iy // CANDIDATE_GRID)
            if key in occupied:
                continue
            r, g, b = pixels[ix, iy]
            h, s, l = rgb_to_hsl(r, g, b)
            if not is_roadish(h, s, l) or is_waterish(h, s, l) or is_paperish(h, s, l):
                continue
            ring = sample_disk(pixels, ix, iy, 2, width, height)
            road_count = sum(1 for color in ring if is_roadish(*rgb_to_hsl(*color)))
            water_count = sum(1 for color in ring if is_waterish(*rgb_to_hsl(*color)))
            if road_count < 10 or water_count >= 4:
                continue
            px, py = to_pct(ix, iy, width, height)
            cells.append({"x": round(px, 2), "y": round(py, 2), "roadNeighbors": road_count})
    return cells


def draw_overlay(image: Image.Image, edges: list[dict], alignments: list[dict], locations: list[dict], junctions: list[dict], missing: list[dict]) -> Image.Image:
    overlay = image.convert("RGBA")
    draw = ImageDraw.Draw(overlay, "RGBA")
    width, height = overlay.size
    by_key = {(row["from"], row["to"]): row for row in alignments}
    colors = {
        "HIGH": (46, 160, 67, 180),
        "MEDIUM": (232, 176, 48, 190),
        "LOW": (214, 64, 69, 210),
    }
    for edge in edges:
        row = by_key[(edge["from"], edge["to"])]
        color = colors[row["confidence"]]
        pts = [to_px(x, y, width, height) for x, y in edge["points"][::2]]
        if len(pts) >= 2:
            draw.line(pts, fill=color, width=2)
    for cell in missing[:400]:
        ix, iy = to_px(cell["x"], cell["y"], width, height)
        draw.ellipse((ix - 2, iy - 2, ix + 2, iy + 2), fill=(120, 80, 255, 160))
    for node in junctions:
        if node["kind"] != "junction":
            continue
        ix, iy = to_px(node["x"], node["y"], width, height)
        draw.ellipse((ix - 3, iy - 3, ix + 3, iy + 3), outline=(255, 120, 0, 220), width=2)
    status_color = {
        "VERIFIED": (40, 180, 90, 230),
        "PROBABLE": (230, 160, 20, 230),
        "UNMATCHED": (220, 40, 40, 230),
        "MANUAL": (80, 140, 220, 230),
    }
    for loc in locations:
        ix, iy = to_px(loc["x"], loc["y"], width, height)
        color = status_color[loc["status"]]
        draw.rectangle((ix - 4, iy - 4, ix + 4, iy + 4), outline=color, width=2)
        if loc.get("candidate"):
            cx, cy = to_px(loc["candidate"]["x"], loc["candidate"]["y"], width, height)
            draw.line((ix, iy, cx, cy), fill=color, width=1)
    return overlay


def classify_strategy(road_stats: dict, location_stats: dict) -> str:
    total = max(1, road_stats["total"])
    high_share = road_stats["high"] / total
    usable_share = (road_stats["high"] + road_stats["medium"]) / total
    unmatched_share = location_stats["unmatched"] / max(1, location_stats["total"])
    if high_share >= 0.75 and unmatched_share <= 0.2:
        return "A"
    # The existing graph is a useful prior even when many edges leave the brown ink.
    if usable_share >= 0.40 or road_stats["meanScore"] >= 0.5:
        return "B"
    return "C"


def main() -> None:
    if not MAP_PATH.exists():
        raise SystemExit(f"missing map image: {MAP_PATH}")
    image = Image.open(MAP_PATH).convert("RGB")
    width, height = image.size
    if (width, height) != (1754, 1754):
        raise SystemExit(f"unexpected map size {width}x{height}; expected 1754x1754")
    pixels = image.load()

    edges = parse_geometries(GEOM_PATH.read_text())
    locations = parse_named_locations(APP_PATH.read_text())
    alignments = [alignment_for_edge(pixels, edge, width, height) for edge in edges]
    location_rows = [match_location(pixels, loc, width, height) for loc in locations.values()]
    junctions = junction_nodes(edges)
    missing = missing_road_cells(pixels, edges, width, height)

    road_stats = {
        "total": len(alignments),
        "high": sum(1 for row in alignments if row["confidence"] == "HIGH"),
        "medium": sum(1 for row in alignments if row["confidence"] == "MEDIUM"),
        "low": sum(1 for row in alignments if row["confidence"] == "LOW"),
        "meanScore": round(statistics.fmean(row["score"] for row in alignments), 4) if alignments else 0,
        "suspectedMissingCells": len(missing),
    }
    location_stats = {
        "total": len(location_rows),
        "verified": sum(1 for row in location_rows if row["status"] == "VERIFIED"),
        "probable": sum(1 for row in location_rows if row["status"] == "PROBABLE"),
        "unmatched": sum(1 for row in location_rows if row["status"] == "UNMATCHED"),
        "manual": 0,
    }
    junction_stats = {
        "total": sum(1 for row in junctions if row["kind"] == "junction"),
        "endpoints": sum(1 for row in junctions if row["kind"] == "endpoint"),
        "suspicious": sum(1 for row in junctions if row["kind"] == "junction" and row["degree"] >= 6),
    }
    strategy = classify_strategy(road_stats, location_stats)
    low_edges = sorted(alignments, key=lambda row: row["score"])[:12]
    unmatched_locations = [row for row in location_rows if row["status"] != "VERIFIED"]

    report = {
        "coordinateSpace": COORDINATE_SPACE,
        "image": {"path": "public/Apawthecaria Map Back.jpg", "width": width, "height": height},
        "visualCategoriesObserved": [
            "ROAD",
            "LOCATION_MARK",
            "LOCATION_LABEL",
            "JUNCTION",
            "ROAD_ENDPOINT",
            "WATER",
            "WATER_CONNECTION",
            "SPECIAL_LANDMARK",
        ],
        "notes": {
            "ROAD": "Warm brown winding strokes. Contour hatching and some text shadows share similar ink.",
            "LOCATION_MARK": "Colored dots/triangles for settlements; black or cream squares for cities.",
            "LOCATION_LABEL": "Printed serif names, often on a pale banner near the mark.",
            "WATER": "Dark Crossing Loch / Katrine / Mentheith fills plus blue swirl decoration.",
            "WATER_CONNECTION": "Vessel, Glasswall, Waveshade, Sailor's Fang sit on or across Crossing Loch.",
            "SPECIAL_LANDMARK": "The Ordered Flats grid and titan/ruin symbols are distinct from roads.",
        },
        "roads": road_stats,
        "locations": location_stats,
        "junctions": junction_stats,
        "strategy": strategy,
        "lowestRoadScores": low_edges,
        "nonVerifiedLocations": unmatched_locations,
        "thresholds": {
            "maxLocationSnapPercent": MAX_LOCATION_SNAP_PERCENT,
            "highAlign": HIGH_ALIGN,
            "mediumAlign": MEDIUM_ALIGN,
        },
    }

    summary = {
        "coordinateSpace": COORDINATE_SPACE,
        "imageSize": [width, height],
        "strategy": strategy,
        "roads": road_stats,
        "locations": location_stats,
        "junctions": junction_stats,
        "lowConfidenceEdges": [
            {"from": row["from"], "to": row["to"], "score": row["score"], "confidence": row["confidence"]}
            for row in alignments if row["confidence"] == "LOW"
        ],
        "locationAnchors": [
            {
                "id": row["id"],
                "x": row["x"],
                "y": row["y"],
                "status": row["status"],
                "readiness": row["readiness"],
                "candidate": row["candidate"],
            }
            for row in location_rows
        ],
        "junctionsPreview": [
            {"id": row["id"], "x": row["x"], "y": row["y"], "degree": row["degree"]}
            for row in junctions if row["kind"] == "junction"
        ][:80],
        "missingRoadPreview": missing[:120],
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.parent.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (OUT_DIR / "road_alignment.json").write_text(json.dumps(alignments, indent=2), encoding="utf-8")
    (OUT_DIR / "location_matches.json").write_text(json.dumps(location_rows, indent=2), encoding="utf-8")
    (OUT_DIR / "detected_road_candidates.json").write_text(
        json.dumps({
            "coordinateSpace": COORDINATE_SPACE,
            "note": "Unverified brown cells far from existing geometry. Not production roads.",
            "cells": missing,
        }, indent=2),
        encoding="utf-8",
    )
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    overlay = draw_overlay(image, edges, alignments, location_rows, junctions, missing)
    overlay.save(OUT_DIR / "overlay_debug.png")

    print(json.dumps({
        "strategy": strategy,
        "roads": road_stats,
        "locations": location_stats,
        "junctions": junction_stats,
        "wrote": [
            str(OUT_DIR / "report.json"),
            str(SUMMARY_PATH),
            str(OUT_DIR / "overlay_debug.png"),
        ],
    }, indent=2))


if __name__ == "__main__":
    main()
