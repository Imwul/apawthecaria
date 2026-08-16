#!/usr/bin/env python3
"""Detect printed map markers first, then infer black/blue ink connections.

The raster JPEG is the visual source of truth. This script never runs in the
browser. It writes reviewed static JSON consumed by the app graph.
"""

from __future__ import annotations

import json
import math
import re
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MAP_PATH = ROOT / "public" / "Apawthecaria Map Back.jpg"
APP_PATH = ROOT / "src" / "App.tsx"
OUT_JSON = ROOT / "src" / "map" / "detection" / "markerGraph.json"
OUT_OVERLAY = ROOT / "output" / "map-detection" / "marker_graph_overlay.png"

CITIES = {
    "glasswall", "summit", "spoolkeep", "newdam", "vessel", "odoak", "noonhill",
}


def rgb_to_hsl(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    rf, gf, bf = rgb[..., 0] / 255.0, rgb[..., 1] / 255.0, rgb[..., 2] / 255.0
    mx = np.maximum(np.maximum(rf, gf), bf)
    mn = np.minimum(np.minimum(rf, gf), bf)
    lightness = (mx + mn) / 2.0
    delta = mx - mn
    sat = np.zeros_like(lightness)
    denom = 1.0 - np.abs(2.0 * lightness - 1.0)
    np.divide(delta, denom, out=sat, where=denom > 1e-6)
    hue = np.zeros_like(lightness)
    is_r = (mx == rf) & (delta > 1e-6)
    is_g = (mx == gf) & (delta > 1e-6) & ~is_r
    is_b = (mx == bf) & (delta > 1e-6) & ~is_r & ~is_g
    hue[is_r] = ((gf[is_r] - bf[is_r]) / delta[is_r]) % 6.0
    hue[is_g] = (bf[is_g] - rf[is_g]) / delta[is_g] + 2.0
    hue[is_b] = (rf[is_b] - gf[is_b]) / delta[is_b] + 4.0
    return hue * 60.0, sat, lightness


def region_from_hsl(h: float, s: float, l: float) -> str | None:
    if s < 0.22 or l < 0.16 or l > 0.78:
        return None
    if h <= 18 or h >= 345:
        return "Mountain"
    if 28 <= h <= 62:
        return "Meadow"
    if 70 <= h <= 155:
        return "Forest"
    if 175 <= h <= 235:
        return "Loch"
    if 250 <= h <= 325:
        return "Bog"
    return None


def parse_waypoints(source: str) -> list[tuple[float, float, str]]:
    block = re.search(r"const MAP_WAYPOINTS = `([^`]+)`", source)
    codes = re.search(r"const MAP_WILD_REGION_CODES = `([^`]+)`", source)
    if not block:
        return []
    region_map = {"B": "Bog", "F": "Forest", "L": "Loch", "M": "Meadow", "R": "Mountain", "T": "Titan", "W": "Wilds"}
    code_str = codes.group(1) if codes else ""
    points = []
    for index, pair in enumerate(block.group(1).split(";")):
        x_s, y_s = pair.split(",")
        region = region_map.get(code_str[index] if index < len(code_str) else "", "Forest")
        points.append((float(x_s), float(y_s), region))
    return points


def parse_named_locations(source: str) -> dict[str, dict]:
    block = re.search(
        r"const MAP_LOCATIONS: Record<string, MapLocationNode> = \{([\s\S]*?)\n\};",
        source,
    )
    if not block:
        return {}
    locations: dict[str, dict] = {}
    for match in re.finditer(r"([a-z0-9_]+):\s*\{([^}]+)\}", block.group(1)):
        body = match.group(2)
        label = re.search(r"label:\s*(?:'((?:\\'|[^'])*)'|\"((?:\\\"|[^\"])*)\")", body)
        x = re.search(r"x:\s*([0-9.]+)", body)
        y = re.search(r"y:\s*([0-9.]+)", body)
        if not (label and x and y):
            continue
        loc_id = match.group(1)
        locations[loc_id] = {
            "id": loc_id,
            "label": label.group(1) or label.group(2) or loc_id,
            "x": float(x.group(1)),
            "y": float(y.group(1)),
            "kind": "city" if loc_id in CITIES or loc_id == "newdam" else "settlement",
        }
    locations["newdam"]["kind"] = "city"
    return locations


def connected_components(mask: np.ndarray, min_size: int, max_size: int) -> list[dict]:
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    blobs: list[dict] = []
    ys, xs = np.nonzero(mask)
    for y0, x0 in zip(ys.tolist(), xs.tolist()):
        if seen[y0, x0]:
            continue
        queue = deque([(y0, x0)])
        seen[y0, x0] = True
        pixels: list[tuple[int, int]] = []
        while queue:
            y, x = queue.popleft()
            pixels.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((ny, nx))
        if not (min_size <= len(pixels) <= max_size):
            continue
        yy = np.array([p[0] for p in pixels])
        xx = np.array([p[1] for p in pixels])
        cy, cx = float(yy.mean()), float(xx.mean())
        min_y, max_y = int(yy.min()), int(yy.max())
        min_x, max_x = int(xx.min()), int(xx.max())
        box_w = max_x - min_x + 1
        box_h = max_y - min_y + 1
        area = len(pixels)
        box_area = box_w * box_h
        fill = area / max(1, box_area)
        radius = math.sqrt(area / math.pi)
        circularity = area / max(1.0, math.pi * ((max(box_w, box_h) / 2.0) ** 2))
        blobs.append({
            "cx": cx,
            "cy": cy,
            "area": area,
            "w": box_w,
            "h": box_h,
            "fill": fill,
            "radius": radius,
            "circularity": circularity,
            "pixels": pixels,
        })
    return blobs


def classify_blob(blob: dict, hue: float) -> str:
    aspect = blob["w"] / max(1, blob["h"])
    if blob["circularity"] >= 0.46 and 0.55 <= aspect <= 1.7:
        return "wild"
    if blob["h"] >= blob["w"] * 0.9 and blob["circularity"] < 0.52:
        return "settlement"
    if blob["w"] >= 8 and blob["h"] >= 8 and blob["fill"] > 0.42:
        return "city"
    return "wild"


def dilate(mask: np.ndarray, radius: int) -> np.ndarray:
    if radius <= 0:
        return mask
    h, w = mask.shape
    out = mask.copy()
    ys, xs = np.nonzero(mask)
    for y, x in zip(ys.tolist(), xs.tolist()):
        y0, y1 = max(0, y - radius), min(h, y + radius + 1)
        x0, x1 = max(0, x - radius), min(w, x + radius + 1)
        out[y0:y1, x0:x1] = True
    return out


def infer_edges(
    markers: list[dict],
    ink: np.ndarray,
    width: int,
    height: int,
    max_distance_px: int = 160,
) -> list[dict]:
    owner = np.full(ink.shape, -1, dtype=np.int16)
    for index, marker in enumerate(markers):
        r = max(3, int(round(marker["radius_px"] + 2)))
        cx, cy = int(marker["px"]), int(marker["py"])
        y0, y1 = max(0, cy - r), min(height, cy + r + 1)
        x0, x1 = max(0, cx - r), min(width, cx + r + 1)
        yy, xx = np.ogrid[y0:y1, x0:x1]
        disk = (yy - cy) ** 2 + (xx - cx) ** 2 <= r * r
        owner[y0:y1, x0:x1][disk] = index

    walkable = ink | (owner >= 0)
    edges: dict[tuple[int, int], list[tuple[int, int]]] = {}
    neighbors = ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1))

    for start, marker in enumerate(markers):
        sx, sy = int(marker["px"]), int(marker["py"])
        if not (0 <= sx < width and 0 <= sy < height):
            continue
        queue = deque([(sy, sx, 0)])
        prev: dict[tuple[int, int], tuple[int, int] | None] = {(sy, sx): None}
        found: set[int] = set()
        while queue:
            y, x, dist = queue.popleft()
            current_owner = int(owner[y, x])
            if current_owner >= 0 and current_owner != start and current_owner not in found:
                found.add(current_owner)
                path = []
                cursor: tuple[int, int] | None = (y, x)
                while cursor is not None:
                    path.append(cursor)
                    cursor = prev[cursor]
                path.reverse()
                pair = (start, current_owner) if start < current_owner else (current_owner, start)
                if pair not in edges or len(path) < len(edges[pair]):
                    edges[pair] = path
                continue
            if current_owner >= 0 and current_owner != start:
                continue
            if dist >= max_distance_px:
                continue
            for dy, dx in neighbors:
                ny, nx = y + dy, x + dx
                if not (0 <= ny < height and 0 <= nx < width):
                    continue
                if (ny, nx) in prev or not walkable[ny, nx]:
                    continue
                prev[(ny, nx)] = (y, x)
                step = 1.414 if dy and dx else 1.0
                queue.append((ny, nx, dist + step))

    result = []
    for (a, b), path in edges.items():
        if len(path) < 4:
            continue
        points = [
            [round(x / width * 100, 3), round(y / height * 100, 3)]
            for y, x in path[:: max(1, len(path) // 24)]
        ]
        if points[-1] != [round(path[-1][1] / width * 100, 3), round(path[-1][0] / height * 100, 3)]:
            points.append([round(path[-1][1] / width * 100, 3), round(path[-1][0] / height * 100, 3)])
        blue_hits = 0
        sample = path[:: max(1, len(path) // 12)]
        for y, x in sample:
            if ink[y, x]:
                blue_hits += 0
        result.append({"from": a, "to": b, "points": points, "kind": "path", "inkPixels": len(path)})
    return result


def main() -> None:
    image = Image.open(MAP_PATH).convert("RGB")
    width, height = image.size
    arr = np.asarray(image)
    hue, sat, light = rgb_to_hsl(arr)

    source = APP_PATH.read_text()
    named = parse_named_locations(source)
    waypoints = parse_waypoints(source)

    markers: list[dict] = []
    for loc_id, loc in named.items():
        markers.append({
            "x": loc["x"],
            "y": loc["y"],
            "px": loc["x"] / 100 * width,
            "py": loc["y"] / 100 * height,
            "region": "Forest",
            "kind": loc["kind"],
            "radius_px": 7.0,
            "namedId": loc_id,
            "waypointIndex": None,
            "label": loc["label"],
        })
    for index, (x, y, region) in enumerate(waypoints):
        if any(math.hypot(x - marker["x"], y - marker["y"]) < 1.2 for marker in markers):
            continue
        markers.append({
            "x": round(x, 3),
            "y": round(y, 3),
            "px": x / 100 * width,
            "py": y / 100 * height,
            "region": region,
            "kind": "wild",
            "radius_px": 5.0,
            "namedId": None,
            "waypointIndex": index,
            "label": None,
        })

    # Dark brown/black path ink. Keep thin networks even when they form one
    # giant component; drop only filled blobs such as loch water or borders.
    ink = (light < 0.48) & (sat < 0.38)
    large = np.zeros_like(ink)
    seen = np.zeros_like(ink, dtype=bool)
    ys, xs = np.nonzero(ink)
    h, w = ink.shape
    for y0, x0 in zip(ys.tolist(), xs.tolist()):
        if seen[y0, x0]:
            continue
        queue = deque([(y0, x0)])
        seen[y0, x0] = True
        pixels = []
        min_y = max_y = y0
        min_x = max_x = x0
        while queue:
            y, x = queue.popleft()
            pixels.append((y, x))
            if y < min_y: min_y = y
            if y > max_y: max_y = y
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and ink[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    queue.append((ny, nx))
        box = max(1, (max_y - min_y + 1) * (max_x - min_x + 1))
        fill = len(pixels) / box
        if len(pixels) > 8000 and fill > 0.28:
            for y, x in pixels:
                large[y, x] = True
    ink = ink & ~large
    ink = dilate(ink, 1)

    # Blue waterway ink, excluding marker-sized blue blobs.
    water = (hue >= 185) & (hue <= 235) & (sat >= 0.18) & (light >= 0.18) & (light <= 0.62)
    water_blobs = connected_components(water, min_size=4, max_size=80)
    water_marker = np.zeros_like(water)
    for blob in water_blobs:
        if blob["circularity"] >= 0.4 and blob["area"] <= 90:
            for y, x in blob["pixels"]:
                water_marker[y, x] = True
    water_ink = dilate(water & ~water_marker, 1)

    path_edges = infer_edges(markers, ink, width, height, max_distance_px=92)
    water_edges = infer_edges(markers, water_ink, width, height, max_distance_px=110)
    water_pairs = {(edge["from"], edge["to"]) for edge in water_edges}
    for edge in path_edges:
        if (edge["from"], edge["to"]) in water_pairs:
            edge["kind"] = "waterway"

    for index, marker in enumerate(markers):
        marker["id"] = marker["namedId"] or f"loc_{marker.get('waypointIndex', index)}"
        marker.pop("pixels", None)

    id_by_index = [marker["id"] for marker in markers]
    serial_edges = []
    for edge in path_edges:
        serial_edges.append({
            "from": id_by_index[edge["from"]],
            "to": id_by_index[edge["to"]],
            "kind": edge["kind"],
            "points": edge["points"],
            "length": edge["inkPixels"],
        })

    def pair(a: str, b: str) -> tuple[str, str]:
        return (a, b) if a < b else (b, a)

    by_pair = {pair(edge["from"], edge["to"]): edge for edge in serial_edges}
    neighbors: dict[str, list[str]] = {}
    for edge in serial_edges:
        neighbors.setdefault(edge["from"], []).append(edge["to"])
        neighbors.setdefault(edge["to"], []).append(edge["from"])

    pruned = []
    for edge in serial_edges:
        a, b = edge["from"], edge["to"]
        skip = False
        for mid in set(neighbors.get(a, [])) & set(neighbors.get(b, [])):
            left = by_pair.get(pair(a, mid))
            right = by_pair.get(pair(mid, b))
            if left and right and left["length"] + right["length"] < edge["length"] * 1.28:
                skip = True
                break
        if not skip:
            pruned.append({key: edge[key] for key in ("from", "to", "kind", "points")})
    kept_pairs = {(edge["from"], edge["to"]) for edge in pruned}
    kept_pairs |= {(edge["to"], edge["from"]) for edge in pruned}
    connected = {edge["from"] for edge in pruned} | {edge["to"] for edge in pruned}
    rescued = []
    for marker in markers:
        if marker["id"] in connected:
            continue
        candidates = [
            edge for edge in serial_edges
            if edge["from"] == marker["id"] or edge["to"] == marker["id"]
        ]
        if not candidates:
            continue
        best = min(candidates, key=lambda edge: edge["length"])
        if (best["from"], best["to"]) not in kept_pairs:
            rescued.append({key: best[key] for key in ("from", "to", "kind", "points")})
            connected.add(best["from"])
            connected.add(best["to"])
    serial_edges = pruned + rescued

    def components(edges: list[dict]) -> list[set[str]]:
        parent = {marker["id"]: marker["id"] for marker in markers}

        def find(node: str) -> str:
            while parent[node] != node:
                parent[node] = parent[parent[node]]
                node = parent[node]
            return node

        def union(a: str, b: str) -> None:
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[rb] = ra

        for edge in edges:
            union(edge["from"], edge["to"])
        groups: dict[str, set[str]] = {}
        for marker in markers:
            groups.setdefault(find(marker["id"]), set()).add(marker["id"])
        return list(groups.values())

    by_id = {marker["id"]: marker for marker in markers}
    comps = components(serial_edges)
    while len(comps) > 1:
        best = None
        for i, left in enumerate(comps):
            for right in comps[i + 1:]:
                for a in left:
                    for b in right:
                        dist = math.hypot(by_id[a]["x"] - by_id[b]["x"], by_id[a]["y"] - by_id[b]["y"])
                        if best is None or dist < best[0]:
                            best = (dist, a, b)
        if not best or best[0] > 8.5:
            break
        _, a, b = best
        serial_edges.append({
            "from": a,
            "to": b,
            "kind": "path",
            "points": [[by_id[a]["x"], by_id[a]["y"]], [by_id[b]["x"], by_id[b]["y"]]],
        })
        comps = components(serial_edges)
    still = [marker for marker in markers if marker["id"] not in {edge["from"] for edge in serial_edges} | {edge["to"] for edge in serial_edges}]
    for marker in still:
        nearest = None
        best = 6.5
        for other in markers:
            if other["id"] == marker["id"]:
                continue
            dist = math.hypot(marker["x"] - other["x"], marker["y"] - other["y"])
            if dist < best:
                best = dist
                nearest = other
        if nearest:
            serial_edges.append({
                "from": marker["id"],
                "to": nearest["id"],
                "kind": "path",
                "points": [[marker["x"], marker["y"]], [nearest["x"], nearest["y"]]],
            })

    payload = {
        "coordinateSpace": "percent-0-100",
        "imageSize": [width, height],
        "method": "markers-then-ink",
        "markerCount": len(markers),
        "edgeCount": len(serial_edges),
        "waterwayCount": sum(1 for edge in serial_edges if edge["kind"] == "waterway"),
        "markers": [
            {
                "id": marker["id"],
                "label": marker["label"] or marker["id"],
                "x": marker["x"],
                "y": marker["y"],
                "region": marker["region"],
                "kind": marker["kind"],
                "named": bool(marker["namedId"]),
            }
            for marker in markers
        ],
        "edges": serial_edges,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, indent=2) + "\n")

    overlay = image.copy()
    draw = ImageDraw.Draw(overlay)
    for edge in serial_edges:
        pts = [(pt[0] / 100 * width, pt[1] / 100 * height) for pt in edge["points"]]
        color = (30, 110, 180) if edge["kind"] == "waterway" else (40, 40, 40)
        if len(pts) >= 2:
            draw.line(pts, fill=color, width=2)
    for marker in markers:
        x, y = marker["x"] / 100 * width, marker["y"] / 100 * height
        color = {
            "city": (20, 20, 20),
            "settlement": (90, 50, 20),
            "wild": (20, 90, 40),
        }.get(marker["kind"], (0, 0, 0))
        r = 4
        draw.ellipse((x - r, y - r, x + r, y + r), outline=color, width=2)
    OUT_OVERLAY.parent.mkdir(parents=True, exist_ok=True)
    overlay.save(OUT_OVERLAY)

    named_count = sum(1 for marker in markers if marker["namedId"])
    print(f"markers {len(markers)} named {named_count} edges {len(serial_edges)} waterways {payload['waterwayCount']}")
    print(f"wrote {OUT_JSON}")
    print(f"wrote {OUT_OVERLAY}")


if __name__ == "__main__":
    main()
