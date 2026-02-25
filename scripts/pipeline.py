#!/usr/bin/env python3
"""Reproducible map data pipeline for the Stalingrad web wargame.

Usage:
  python3 scripts/pipeline.py all
  python3 scripts/pipeline.py generate-hex --hex-size 250
  python3 scripts/pipeline.py build-tiles --input data/rasters/stalingrad_south.tif
"""

from __future__ import annotations
import argparse
import json
import math
import subprocess
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
VEC = DATA / "vector"
HEX_OUT = DATA / "hex" / "stalingrad_hex_500m.geojson"

# Battle area bounding box around central Stalingrad.
BBOX = {
    "min_lon": 44.43,
    "min_lat": 48.66,
    "max_lon": 44.62,
    "max_lat": 48.78,
}

R_MAJOR = 6378137.0


def lonlat_to_mercator(lon: float, lat: float) -> tuple[float, float]:
    x = R_MAJOR * math.radians(lon)
    y = R_MAJOR * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    return x, y


def mercator_to_lonlat(x: float, y: float) -> tuple[float, float]:
    lon = math.degrees(x / R_MAJOR)
    lat = math.degrees(2 * math.atan(math.exp(y / R_MAJOR)) - math.pi / 2)
    return lon, lat


def load_features(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8")).get("features", [])


def all_coords(geom: dict) -> list[tuple[float, float]]:
    t = geom["type"]
    c = geom["coordinates"]
    if t == "Point":
        return [tuple(c)]
    if t == "LineString":
        return [tuple(i) for i in c]
    if t == "Polygon":
        return [tuple(i) for ring in c for i in ring]
    return []


def distance_to_lines(p_xy: tuple[float, float], lines: list[list[tuple[float, float]]]) -> float:
    px, py = p_xy
    best = 1e18
    for line in lines:
        for i in range(len(line) - 1):
            x1, y1 = line[i]
            x2, y2 = line[i + 1]
            dx, dy = x2 - x1, y2 - y1
            seg_len2 = dx * dx + dy * dy
            if seg_len2 == 0:
                d = math.hypot(px - x1, py - y1)
            else:
                t = max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / seg_len2))
                projx, projy = x1 + t * dx, y1 + t * dy
                d = math.hypot(px - projx, py - projy)
            best = min(best, d)
    return best


def point_in_polygon(point: tuple[float, float], polygon: list[tuple[float, float]]) -> bool:
    x, y = point
    inside = False
    n = len(polygon)
    for i in range(n):
        x1, y1 = polygon[i]
        x2, y2 = polygon[(i + 1) % n]
        cond = ((y1 > y) != (y2 > y)) and (x < (x2 - x1) * (y - y1) / (y2 - y1 + 1e-12) + x1)
        if cond:
            inside = not inside
    return inside


def terrain_profile(center_xy, roads, rail, river, industries, elevations):
    terrain = "STEPPE"
    move_cost = 1
    cover = 0
    los_block = 0
    supply = True

    river_d = distance_to_lines(center_xy, river) if river else 1e9
    road_d = distance_to_lines(center_xy, roads) if roads else 1e9
    rail_d = distance_to_lines(center_xy, rail) if rail else 1e9

    if river_d < 120:
        terrain, move_cost, cover, los_block, supply = "RIVER", 99, 0, 0, False
    elif rail_d < 90:
        terrain, move_cost, cover = "RAIL", 1, 1
    elif road_d < 70:
        terrain, move_cost = "ROAD", 1

    for poly in industries:
        if point_in_polygon(center_xy, poly):
            terrain, move_cost, cover, los_block = "INDUSTRY", 2, 3, 1
            break

    for elev_xy, elev in elevations:
        if math.hypot(center_xy[0] - elev_xy[0], center_xy[1] - elev_xy[1]) < 260 and elev >= 90:
            terrain, move_cost, cover, los_block = "HILL", 2, max(cover, 2), 1

    return {
        "terrain": terrain,
        "move_cost": move_cost,
        "cover": cover,
        "los_block": los_block,
        "supply": supply,
    }


def generate_hex(hex_size: float):
    minx, miny = lonlat_to_mercator(BBOX["min_lon"], BBOX["min_lat"])
    maxx, maxy = lonlat_to_mercator(BBOX["max_lon"], BBOX["max_lat"])

    roads_f = load_features(VEC / "roads.geojson")
    rail_f = load_features(VEC / "railways.geojson")
    river_f = load_features(VEC / "river.geojson")
    ind_f = load_features(VEC / "industrial_zones.geojson")
    elev_f = load_features(VEC / "elevation_points.geojson")

    roads = [[lonlat_to_mercator(*xy) for xy in all_coords(f["geometry"])] for f in roads_f]
    rail = [[lonlat_to_mercator(*xy) for xy in all_coords(f["geometry"])] for f in rail_f]
    river = [[lonlat_to_mercator(*xy) for xy in all_coords(f["geometry"])] for f in river_f]
    industries = []
    for f in ind_f:
        rings = f["geometry"]["coordinates"]
        industries.extend([[lonlat_to_mercator(*xy) for xy in ring] for ring in rings])
    elevations = []
    for f in elev_f:
        lon, lat = f["geometry"]["coordinates"]
        elevations.append((lonlat_to_mercator(lon, lat), f["properties"].get("elevation_m", 0)))

    dx = math.sqrt(3) * hex_size
    dy = 1.5 * hex_size
    q = 0
    features = []
    x = minx
    while x <= maxx + dx:
        col_offset = 0.75 * hex_size if q % 2 else 0
        y = miny - col_offset
        r = 0
        while y <= maxy + dy:
            center = (x, y)
            corners = []
            for i in range(6):
                ang = math.radians(60 * i - 30)
                cx = x + hex_size * math.cos(ang)
                cy = y + hex_size * math.sin(ang)
                corners.append(mercator_to_lonlat(cx, cy))
            c_lon, c_lat = mercator_to_lonlat(x, y)
            attrs = terrain_profile(center, roads, rail, river, industries, elevations)
            feature = {
                "type": "Feature",
                "properties": {
                    "id": f"H_{q}_{r}",
                    "q": q,
                    "r": r,
                    "hex_size_m": hex_size,
                    **attrs,
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[*corners, corners[0]]],
                },
            }
            if BBOX["min_lon"] <= c_lon <= BBOX["max_lon"] and BBOX["min_lat"] <= c_lat <= BBOX["max_lat"]:
                features.append(feature)
            y += dy
            r += 1
        x += dx
        q += 1

    out = DATA / "hex" / f"stalingrad_hex_{int(hex_size)}m.geojson"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Hex written: {out} ({len(features)} cells)")


def fetch_loc_manifest():
    target = DATA / "rasters" / "loc_stalingrad_south_manifest.json"
    url = "https://www.loc.gov/resource/g7064v.ct000790/manifest.json"
    try:
        with urlopen(url, timeout=30) as resp:
            target.write_bytes(resp.read())
        print(f"Fetched IIIF manifest -> {target}")
        return True
    except Exception as exc:
        print(f"Manifest fetch skipped: {exc}")
        return False


def build_tiles(input_raster: str):
    out_dir = DATA / "tiles" / "stalingrad_south_xyz"
    out_dir.mkdir(parents=True, exist_ok=True)
    cmd = [
        "gdal2tiles.py",
        "--xyz",
        "--processes=4",
        "-z",
        "8-16",
        input_raster,
        str(out_dir),
    ]
    try:
        subprocess.run(cmd, check=True)
        print(f"XYZ tiles generated in {out_dir}")
    except FileNotFoundError:
        print("gdal2tiles.py not found. Install GDAL or use Allmaps tile server workflow in README.")


def all_pipeline(hex_size: float):
    fetch_loc_manifest()
    generate_hex(hex_size)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    ap_hex = sub.add_parser("generate-hex")
    ap_hex.add_argument("--hex-size", type=float, default=500)

    sub.add_parser("fetch-manifest")

    ap_tiles = sub.add_parser("build-tiles")
    ap_tiles.add_argument("--input", required=True)

    ap_all = sub.add_parser("all")
    ap_all.add_argument("--hex-size", type=float, default=500)

    args = ap.parse_args()

    if args.cmd == "generate-hex":
        generate_hex(args.hex_size)
    elif args.cmd == "fetch-manifest":
        fetch_loc_manifest()
    elif args.cmd == "build-tiles":
        build_tiles(args.input)
    elif args.cmd == "all":
        all_pipeline(args.hex_size)


if __name__ == "__main__":
    main()
