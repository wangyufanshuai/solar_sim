"""Convert the archived PDS Tempel 1 VRML plate model to a normalized GLB.

The PDS source remains immutable. The converter parses the documented 16,022
vertices and 32,040 plates, maps source +Z onto runtime +Y without changing
handedness, uses a stable bounds-midpoint pivot, normalizes the maximum extent
to diameter two, and records the source constraint-flag distribution.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re

import numpy as np
import trimesh


def digest(path: Path, algorithm: str = "sha256") -> str:
    value = hashlib.new(algorithm)
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


def parse_vrml(path: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    text = path.read_text(encoding="ascii")
    point_marker = "point ["
    face_marker = "coordIndex ["
    if point_marker not in text or face_marker not in text:
        raise SystemExit("v591-tempel1-vrml-sections")
    point_block = text.split(point_marker, 1)[1].split("]", 1)[0]
    face_block = text.split(face_marker, 1)[1].split("]", 1)[0]
    vertices: list[list[float]] = []
    flags: list[int] = []
    for line in point_block.splitlines():
        coordinate_text, _, comment = line.partition("#")
        values = coordinate_text.replace(",", " ").split()
        if len(values) < 3:
            continue
        vertices.append([float(values[0]), float(values[1]), float(values[2])])
        flag_match = re.search(r"\b([123])\b", comment)
        if not flag_match:
            raise SystemExit(f"v591-tempel1-vrml-vertex-flag:{len(vertices) - 1}")
        flags.append(int(flag_match.group(1)))
    indices = [int(value) for value in re.findall(r"-?\d+", face_block)]
    faces: list[list[int]] = []
    current: list[int] = []
    for index in indices:
        if index == -1:
            if len(current) != 3:
                raise SystemExit(f"v591-tempel1-vrml-face-width:{len(current)}")
            faces.append(current)
            current = []
        else:
            current.append(index)
    if current:
        raise SystemExit("v591-tempel1-vrml-trailing-face")
    vertex_array = np.asarray(vertices, dtype=np.float64)
    face_array = np.asarray(faces, dtype=np.int64)
    flag_array = np.asarray(flags, dtype=np.uint8)
    if vertex_array.shape != (16022, 3) or face_array.shape != (32040, 3) or flag_array.shape != (16022,):
        raise SystemExit(f"v591-tempel1-vrml-counts:{vertex_array.shape}:{face_array.shape}:{flag_array.shape}")
    if face_array.min() != 0 or face_array.max() != 16021:
        raise SystemExit("v591-tempel1-vrml-index-range")
    return vertex_array, face_array, flag_array


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--label", required=True)
    parser.add_argument("--mosaic", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--receipt", required=True)
    args = parser.parse_args()

    root = Path.cwd().resolve()
    source = Path(args.source).resolve()
    label = Path(args.label).resolve()
    mosaic = Path(args.mosaic).resolve()
    output = Path(args.output).resolve()
    receipt_path = Path(args.receipt).resolve()
    for path in (source, label, mosaic):
        if not path.is_file():
            raise SystemExit(f"v591-tempel1-source-missing:{path}")

    vertices, faces, flags = parse_vrml(source)
    source_mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False, validate=False)
    if not source_mesh.is_watertight or source_mesh.euler_number != 2 or len(source_mesh.split(only_watertight=False)) != 1:
        raise SystemExit(f"v591-tempel1-source-topology:{source_mesh.is_watertight}:{source_mesh.euler_number}")
    source_bounds = source_mesh.bounds.astype(np.float64)

    # Source +Z is the positive spin pole. Runtime +Y is the spin axis.
    runtime_vertices = np.column_stack((vertices[:, 0], vertices[:, 2], -vertices[:, 1]))
    rotated_bounds = np.vstack((runtime_vertices.min(axis=0), runtime_vertices.max(axis=0)))
    center = (rotated_bounds[0] + rotated_bounds[1]) * 0.5
    extent = rotated_bounds[1] - rotated_bounds[0]
    diameter = float(np.max(extent))
    if not np.isfinite(runtime_vertices).all() or not np.isfinite(diameter) or diameter <= 0:
        raise SystemExit("v591-tempel1-finite-bounds")
    normalized_vertices = (runtime_vertices - center) * (2.0 / diameter)
    mesh = trimesh.Trimesh(vertices=normalized_vertices, faces=faces, process=False, validate=False)
    mesh.fix_normals(multibody=True)
    normals = np.asarray(mesh.vertex_normals, dtype=np.float64)
    if not np.isfinite(normals).all() or np.max(np.abs(np.linalg.norm(normals, axis=1) - 1.0)) > 1e-4:
        raise SystemExit("v591-tempel1-normal-unit")
    if not mesh.is_watertight or mesh.euler_number != 2 or len(mesh.faces) != 32040 or len(mesh.vertices) != 16022:
        raise SystemExit(f"v591-tempel1-output-topology:{mesh.is_watertight}:{mesh.euler_number}:{len(mesh.vertices)}:{len(mesh.faces)}")

    output.parent.mkdir(parents=True, exist_ok=True)
    receipt_path.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(output, file_type="glb")
    output_bounds = mesh.bounds.astype(np.float64)
    flag_counts = {str(flag): int(np.count_nonzero(flags == flag)) for flag in (1, 2, 3)}
    unsigned = {
        "version": "v591-tempel-1-normalized-pds-source-receipt-v1",
        "body": "tempel-1",
        "source": {
            "path": relative(source, root),
            "bytes": source.stat().st_size,
            "sha256": digest(source),
            "md5": digest(source, "md5"),
            "labelPath": relative(label, root),
            "labelSha256": digest(label),
            "mosaicPath": relative(mosaic, root),
            "mosaicBytes": mosaic.stat().st_size,
            "mosaicSha256": digest(mosaic),
            "vertexCount": 16022,
            "triangleCount": 32040,
            "constraintFlagCounts": flag_counts,
            "boundsKilometers": [[number(value) for value in row] for row in source_bounds],
            "watertight": True,
            "eulerNumber": 2,
        },
        "output": {
            "path": relative(output, root),
            "bytes": output.stat().st_size,
            "sha256": digest(output),
            "vertexCount": int(len(mesh.vertices)),
            "triangleCount": int(len(mesh.faces)),
            "bounds": [[number(value) for value in row] for row in output_bounds],
            "watertight": bool(mesh.is_watertight),
            "eulerNumber": int(mesh.euler_number),
            "normals": True,
        },
        "derivation": {
            "tool": "pds-vrml-parser+trimesh",
            "version": f"python-trimesh-{trimesh.__version__}",
            "parameters": "parse-documented-vrml-plates; source-positive-z-to-runtime-positive-y-right-handed; bounds-midpoint-pivot; max-extent-diameter-2; source-triangle-order-preserved; recompute-outward-normals",
            "sourceUnits": "kilometer",
            "units": "normalized-diameter-2",
            "rotationAxis": "positive-y",
            "pivot": "bounds-midpoint",
            "sourceFrameCenterOffsetKilometers": [number(value) for value in center],
            "sourceMaximumExtentKilometers": number(diameter),
            "geometryReshaped": False,
        },
        "authorityState": {
            "presentationOnly": True,
            "scientificAuthorityChanged": False,
            "scientificPayloadWriteback": False,
            "measuredAuthorityGranted": False,
        },
    }
    receipt = {
        **unsigned,
        "receiptSha256": hashlib.sha256(json.dumps(canonical(unsigned), separators=(",", ":")).encode("utf8")).hexdigest(),
    }
    part = receipt_path.with_suffix(receipt_path.suffix + ".part")
    part.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf8")
    part.replace(receipt_path)
    print(json.dumps({"vertices": len(mesh.vertices), "triangles": len(mesh.faces), "flags": flag_counts, "outputSha256": receipt["output"]["sha256"], "receiptSha256": receipt["receiptSha256"]}, indent=2))


if __name__ == "__main__":
    main()
