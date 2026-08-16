#!/usr/bin/env python3
"""Review existing polylines that cross printed water.

This is a development-time audit. It does not overwrite roadNetworkGeometry.ts.
It writes candidate crossings for human review, then a reviewed subset can be
imported as static data.
"""

from __future__ import annotations

import json
import math
import re
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "public" / "Apawthecaria Map Back.jpg"
GEOM_PATH = ROOT / "src" / "data" / "roadNetworkGeometry.ts"
OUT_DIR = ROOT / "output" / "map-detection"
SUMMARY_PATH = ROOT / "src" / "map" / "detection" / "mapDetectionSummary.json"

MIN_WATER_COMPONENT = 180
WATER_RUN_MIN = 0.22
WATER_HIT_MIN = 0.28
WATER_LENGTH_MIN = 2.4


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


def is_water_pixel(r: int, g: int, b: int) -> bool:
    h, s, l = rgb_to_hsl(r, g, b)
    dark_fill = l <= 0.23 and s <= 0.38 and max(r, g, b) <= 95
    blue_swirl = 185.0 <= h <= 250.0 and s >= 0.10 and l <= 0.58
    return dark_fill or blue_swirl


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
        edges.append({"from": int(match.group(1)), "to": int(match.group(2)), "points": points})
    return edges


def to_px(x: float, y: float, width: int, height: int) -> tuple[int, int]:
    return int(round(x / 100.0 * (width - 1))), int(round(y / 100.0 * (height - 1)))


def polyline_length(points: list[tuple[float, float]]) -> float:
    total = 0.0
    for index in range(1, len(points)):
        total += math.hypot(points[index][0] - points[index - 1][0], points[index][1] - points[index - 1][1])
    return total


def build_water_mask(image: Image.Image) -> tuple[list[list[bool]], int]:
    width, height = image.size
    pixels = image.load()
    seed = [[is_water_pixel(*pixels[x, y]) for x in range(width)] for y in range(height)]
    seen = [[False] * width for _ in range(height)]
    keep = [[False] * width for _ in range(height)]
    components = 0
    for y in range(height):
        for x in range(width):
            if not seed[y][x] or seen[y][x]:
                continue
            queue = deque([(x, y)])
            seen[y][x] = True
            blob: list[tuple[int, int]] = []
            while queue:
                cx, cy = queue.popleft()
                blob.append((cx, cy))
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    if seen[ny][nx] or not seed[ny][nx]:
                        continue
                    seen[ny][nx] = True
                    queue.append((nx, ny))
            if len(blob) < MIN_WATER_COMPONENT:
                continue
            components += 1
            for cx, cy in blob:
                keep[cy][cx] = True
    return keep, components


def sample_edge(mask: list[list[bool]], edge: dict, width: int, height: int) -> dict:
    points = edge["points"]
    step = max(1, len(points) // 36)
    sampled = points[::step]
    if sampled[-1] != points[-1]:
        sampled.append(points[-1])
    flags = []
    for x, y in sampled:
        ix, iy = to_px(x, y, width, height)
        ix = max(0, min(width - 1, ix))
        iy = max(0, min(height - 1, iy))
        flags.append(mask[iy][ix])
    hits = sum(1 for flag in flags if flag)
    longest = 0
    run = 0
    for flag in flags:
        run = run + 1 if flag else 0
        longest = max(longest, run)
    # Ignore a short shoreline touch at either endpoint.
    interior = flags[1:-1] if len(flags) > 2 else flags
    interior_hits = sum(1 for flag in interior if flag)
    length = polyline_length(points)
    water_run_ratio = longest / max(1, len(flags))
    water_hit_ratio = hits / max(1, len(flags))
    interior_ratio = interior_hits / max(1, len(interior))
    water_length = length * water_run_ratio
    is_crossing = (
        water_run_ratio >= WATER_RUN_MIN
        and interior_ratio >= WATER_HIT_MIN
        and water_length >= WATER_LENGTH_MIN
    )
    return {
        "from": edge["from"],
        "to": edge["to"],
        "pointCount": len(points),
        "samples": len(flags),
        "lengthPercent": round(length, 3),
        "waterHitRatio": round(water_hit_ratio, 4),
        "interiorWaterRatio": round(interior_ratio, 4),
        "longestWaterRun": longest,
        "waterRunRatio": round(water_run_ratio, 4),
        "waterLengthPercent": round(water_length, 3),
        "start": [round(points[0][0], 2), round(points[0][1], 2)],
        "end": [round(points[-1][0], 2), round(points[-1][1], 2)],
        "crossing": is_crossing,
    }


def main() -> None:
    image = Image.open(MAP_PATH).convert("RGB")
    # Half-res is enough to find lochs/rivers and is much faster.
    working = image.resize((image.width // 2, image.height // 2), Image.Resampling.BOX)
    mask, component_count = build_water_mask(working)
    width, height = working.size
    edges = parse_geometries(GEOM_PATH.read_text())
    summary = json.loads(SUMMARY_PATH.read_text())
    low_keys = {
        (min(row["from"], row["to"]), max(row["from"], row["to"]))
        for row in summary.get("lowConfidenceEdges", [])
    }

    reviews = [sample_edge(mask, edge, width, height) for edge in edges]
    crossings = [row for row in reviews if row["crossing"]]
    crossings.sort(key=lambda row: (-row["waterRunRatio"], -row["waterLengthPercent"]))

    overlay = image.convert("RGBA")
    draw = ImageDraw.Draw(overlay, "RGBA")
    full_w, full_h = image.size
    by_key = {(edge["from"], edge["to"]): edge for edge in edges}
    for row in crossings:
        points = [to_px(x, y, full_w, full_h) for x, y in by_key[(row["from"], row["to"])]["points"][::2]]
        if len(points) >= 2:
            draw.line(points, fill=(40, 110, 220, 220), width=3)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "coordinateSpace": "percent-0-100",
        "thresholds": {
            "minWaterComponent": MIN_WATER_COMPONENT,
            "waterRunMin": WATER_RUN_MIN,
            "waterHitMin": WATER_HIT_MIN,
            "waterLengthMin": WATER_LENGTH_MIN,
        },
        "waterComponents": component_count,
        "reviewedAgainst": "public/Apawthecaria Map Back.jpg",
        "totalEdges": len(reviews),
        "crossingCount": len(crossings),
        "lowAndCrossing": sum(
            1 for row in crossings if (min(row["from"], row["to"]), max(row["from"], row["to"])) in low_keys
        ),
        "crossings": crossings,
    }
    (OUT_DIR / "water_crossing_candidates.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    overlay.save(OUT_DIR / "water_crossing_overlay.png")
    print(json.dumps({
        "waterComponents": component_count,
        "crossingCount": len(crossings),
        "lowAndCrossing": payload["lowAndCrossing"],
        "top": [
            {
                "from": row["from"],
                "to": row["to"],
                "run": row["waterRunRatio"],
                "len": row["waterLengthPercent"],
                "start": row["start"],
                "end": row["end"],
            }
            for row in crossings[:20]
        ],
    }, indent=2))


if __name__ == "__main__":
    main()
