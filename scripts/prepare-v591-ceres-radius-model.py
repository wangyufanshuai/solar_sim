"""Build a watertight Ceres mesh from the NASA PDS4 global radius GeoTIFF.

The source is the Dawn SPC radius product in meters.  The converter samples a
deterministic 512 x 256 longitude/latitude grid, keeps one vertex per pole,
uses the body-centered positive-Y spin axis, and exports mean-radius units.
No procedural displacement or synthetic crater detail is introduced.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import tifffile
import trimesh


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def canonical(value: object) -> object:
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value)}
    if isinstance(value, list):
        return [canonical(item) for item in value]
    return value


def number(value: float) -> str:
    return format(float(value), ".12g")


def relative(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def bilinear_periodic(source: np.ndarray, latitude_rad: np.ndarray, longitude_rad: np.ndarray) -> np.ndarray:
    height, width = source.shape
    y = np.clip((0.5 * np.pi - latitude_rad) / np.pi * (height - 1), 0.0, height - 1.0)
    x = np.mod(longitude_rad / (2.0 * np.pi) * width, width)
    y0 = np.floor(y).astype(np.int64)
    y1 = np.minimum(y0 + 1, height - 1)
    x0 = np.floor(x).astype(np.int64)
    x1 = (x0 + 1) % width
    fy = y - y0
    fx = x - x0
    return (
        source[y0, x0] * (1.0 - fy) * (1.0 - fx)
        + source[y0, x1] * (1.0 - fy) * fx
        + source[y1, x0] * fy * (1.0 - fx)
        + source[y1, x1] * fy * fx
    )


def build_mesh(radius_m: np.ndarray, longitude_segments: int, latitude_segments: int) -> trimesh.Trimesh:
    longitudes = np.arange(longitude_segments, dtype=np.float64) * (2.0 * np.pi / longitude_segments)
    interior_indices = np.arange(1, latitude_segments, dtype=np.float64)
    latitudes = 0.5 * np.pi - interior_indices * (np.pi / latitude_segments)
    latitude_grid, longitude_grid = np.meshgrid(latitudes, longitudes, indexing="ij")
    radii = bilinear_periodic(radius_m, latitude_grid, longitude_grid) / 470000.0
    cos_latitude = np.cos(latitude_grid)
    interior = np.column_stack((
        (radii * cos_latitude * np.cos(longitude_grid)).reshape(-1),
        (radii * np.sin(latitude_grid)).reshape(-1),
        (radii * cos_latitude * np.sin(longitude_grid)).reshape(-1),
    ))
    north_radius = float(np.mean(radius_m[0])) / 470000.0
    south_radius = float(np.mean(radius_m[-1])) / 470000.0
    vertices = np.vstack(([0.0, north_radius, 0.0], interior, [0.0, -south_radius, 0.0]))
    north = 0
    first_row = 1
    south = len(vertices) - 1
    faces: list[list[int]] = []
    for column in range(longitude_segments):
        next_column = (column + 1) % longitude_segments
        faces.append([north, first_row + column, first_row + next_column])
    interior_rows = latitude_segments - 1
    for row in range(interior_rows - 1):
        current = first_row + row * longitude_segments
        following = current + longitude_segments
        for column in range(longitude_segments):
            next_column = (column + 1) % longitude_segments
            faces.append([current + column, following + column, current + next_column])
            faces.append([current + next_column, following + column, following + next_column])
    last_row = first_row + (interior_rows - 1) * longitude_segments
    for column in range(longitude_segments):
        next_column = (column + 1) % longitude_segments
        faces.append([last_row + column, south, last_row + next_column])
    mesh = trimesh.Trimesh(vertices=vertices, faces=np.asarray(faces, dtype=np.int64), process=False, validate=False)
    mesh.fix_normals(multibody=True)
    return mesh


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--radius", required=True)
    parser.add_argument("--label", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--receipt", required=True)
    parser.add_argument("--longitude-segments", type=int, default=512)
    parser.add_argument("--latitude-segments", type=int, default=256)
    args = parser.parse_args()

    root = Path.cwd().resolve()
    radius_path = Path(args.radius).resolve()
    label_path = Path(args.label).resolve()
    output_path = Path(args.output).resolve()
    receipt_path = Path(args.receipt).resolve()
    if not radius_path.is_file() or not label_path.is_file():
        raise SystemExit("v591-ceres-radius-source-missing")
    if args.longitude_segments != 512 or args.latitude_segments != 256:
        raise SystemExit("v591-ceres-radius-grid-policy")

    radius = np.asarray(tifffile.imread(radius_path), dtype=np.float64)
    if radius.shape != (1111, 2222) or not np.isfinite(radius).all():
        raise SystemExit(f"v591-ceres-radius-layout:{radius.shape}:{np.isfinite(radius).all()}")
    minimum = float(radius.min())
    maximum = float(radius.max())
    if minimum != 442618.25 or maximum != 486849.59375:
        raise SystemExit(f"v591-ceres-radius-range:{minimum}:{maximum}")

    mesh = build_mesh(radius, args.longitude_segments, args.latitude_segments)
    expected_vertices = 2 + (args.latitude_segments - 1) * args.longitude_segments
    expected_triangles = 2 * args.longitude_segments * (args.latitude_segments - 1)
    if len(mesh.vertices) != expected_vertices or len(mesh.faces) != expected_triangles:
        raise SystemExit(f"v591-ceres-radius-counts:{len(mesh.vertices)}:{len(mesh.faces)}")
    if not mesh.is_watertight or mesh.euler_number != 2 or len(mesh.split(only_watertight=False)) != 1:
        raise SystemExit(f"v591-ceres-radius-topology:{mesh.is_watertight}:{mesh.euler_number}")
    normals = np.asarray(mesh.vertex_normals, dtype=np.float64)
    if not np.isfinite(normals).all() or float(np.max(np.abs(np.linalg.norm(normals, axis=1) - 1.0))) > 1e-4:
        raise SystemExit("v591-ceres-radius-normals")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(output_path, file_type="glb")
    bounds = np.asarray(mesh.bounds, dtype=np.float64)
    unsigned = {
        "version": "v591-ceres-radius-derived-source-receipt-v1",
        "body": "ceres",
        "source": {
            "path": relative(radius_path, root),
            "bytes": radius_path.stat().st_size,
            "sha256": digest(radius_path),
            "labelPath": relative(label_path, root),
            "labelSha256": digest(label_path),
            "width": 2222,
            "height": 1111,
            "dataType": "IEEE754LSBSingle",
            "units": "meter-from-body-center",
            "minimumRadiusMeters": number(minimum),
            "maximumRadiusMeters": number(maximum),
            "missingPixelCount": 0,
        },
        "output": {
            "path": relative(output_path, root),
            "bytes": output_path.stat().st_size,
            "sha256": digest(output_path),
            "vertexCount": int(len(mesh.vertices)),
            "triangleCount": int(len(mesh.faces)),
            "bounds": [[number(value) for value in row] for row in bounds],
            "watertight": bool(mesh.is_watertight),
            "eulerNumber": int(mesh.euler_number),
            "normals": True,
        },
        "derivation": {
            "tool": f"python-tifffile-{tifffile.__version__}+trimesh-{trimesh.__version__}",
            "parameters": "bilinear-periodic-radius-sampling;512-longitude-segments;256-latitude-segments;single-pole-vertices;body-centered-positive-y-spin-axis;mean-radius-470000m-to-1;no-procedural-displacement;recompute-outward-normals",
            "sourceProjection": "equirectangular-positive-east-planetocentric",
            "sourceReferenceRadiusMeters": 470000,
            "units": "mean-radius-1",
            "rotationAxis": "positive-y",
            "pivot": "body-center-origin",
            "syntheticDetailAdded": False,
        },
        "authorityState": {
            "presentationOnly": True,
            "scientificAuthorityChanged": False,
            "scientificPayloadWriteback": False,
            "measuredAuthorityGranted": False,
        },
    }
    receipt = {**unsigned, "receiptSha256": hashlib.sha256(json.dumps(canonical(unsigned), separators=(",", ":")).encode("utf8")).hexdigest()}
    partial = receipt_path.with_suffix(receipt_path.suffix + ".part")
    partial.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf8")
    partial.replace(receipt_path)
    print(json.dumps({"vertices": len(mesh.vertices), "triangles": len(mesh.faces), "watertight": mesh.is_watertight, "outputSha256": receipt["output"]["sha256"], "receiptSha256": receipt["receiptSha256"]}, indent=2))


if __name__ == "__main__":
    main()
