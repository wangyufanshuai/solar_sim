"""Prepare one v589 small-body GLB with deterministic pivot, scale, and normals.

The source remains under vendor/ for provenance.  This helper only creates an
additive derived asset and receipt; it never mutates a source model.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import trimesh


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical(value: object) -> object:
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value)}
    if isinstance(value, list):
        return [canonical(item) for item in value]
    return value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--receipt", required=True)
    parser.add_argument("--body", required=True)
    args = parser.parse_args()

    source = Path(args.source).resolve()
    output = Path(args.output).resolve()
    receipt_path = Path(args.receipt).resolve()
    if not source.is_file():
        raise SystemExit(f"v589-model-source-missing:{source}")
    output.parent.mkdir(parents=True, exist_ok=True)
    receipt_path.parent.mkdir(parents=True, exist_ok=True)

    loaded = trimesh.load(source, force="scene", process=False)
    if isinstance(loaded, trimesh.Trimesh):
        mesh = loaded
    else:
        mesh = loaded.dump(concatenate=True)
    if not isinstance(mesh, trimesh.Trimesh) or len(mesh.vertices) == 0 or len(mesh.faces) == 0:
        raise SystemExit("v589-model-empty-mesh")

    bounds_before = mesh.bounds.astype(np.float64)
    center = (bounds_before[0] + bounds_before[1]) * 0.5
    extent = bounds_before[1] - bounds_before[0]
    diameter = float(np.max(extent))
    if not np.isfinite(diameter) or diameter <= 0:
        raise SystemExit("v589-model-invalid-bounds")
    mesh.apply_translation(-center)
    mesh.apply_scale(2.0 / diameter)
    mesh.remove_unreferenced_vertices()
    # Accessing vertex_normals forces a deterministic geometric normal buffer
    # into the exported glTF; the source contains position-only geometry.
    normals = np.asarray(mesh.vertex_normals, dtype=np.float32)
    if normals.shape != (len(mesh.vertices), 3) or not np.isfinite(normals).all():
        raise SystemExit("v589-model-normal-generation")
    mesh.export(output, file_type="glb")

    bounds_after = mesh.bounds.astype(np.float64)
    unsigned = {
        "version": "v589-derived-model-receipt-v1",
        "body": args.body,
        "source": {
            "path": str(source),
            "bytes": source.stat().st_size,
            "sha256": sha256(source),
        },
        "output": {
            "path": str(output),
            "bytes": output.stat().st_size,
            "sha256": sha256(output),
        },
        "derivation": {
            "tool": "trimesh",
            "version": trimesh.__version__,
            "parameters": "scene-concatenate; center-at-bounds-midpoint; max-extent-to-diameter-2; remove-unreferenced; vertex-normals",
        },
        "geometry": {
            "units": "normalized-diameter-2",
            "pivot": "bounds-midpoint",
            "rotationAxis": "source-frame-y-up",
            "vertexCount": int(len(mesh.vertices)),
            "triangleCount": int(len(mesh.faces)),
            "bounds": [[float(value) for value in row] for row in bounds_after],
            "normals": True,
        },
        "presentationOnly": True,
    }
    receipt = {
        **unsigned,
        "receiptSha256": hashlib.sha256(json.dumps(canonical(unsigned), separators=(",", ":")).encode("utf-8")).hexdigest(),
    }
    receipt_path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"body": args.body, "output": str(output), "triangles": len(mesh.faces), "sha256": receipt["output"]["sha256"]}, indent=2))


if __name__ == "__main__":
    main()
