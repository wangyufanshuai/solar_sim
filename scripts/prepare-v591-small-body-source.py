"""Normalize one admitted NASA STL into a deterministic glTF source mesh.

The source STL remains immutable in source-cache.  This helper centers the
mesh, converts the source Z-up frame to glTF Y-up, normalizes the maximum
extent to a diameter of two, validates finite geometry, and emits one GLB plus
a sealed receipt.  LOD simplification and meshopt compression are performed by
the separate glTF Transform orchestration step.
"""

from __future__ import annotations

import argparse
from collections import defaultdict
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


def relative(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def canonical_number(value: float) -> str:
    """Cross-language decimal used by both Python and JSON/TypeScript seals."""
    return format(float(value), ".12g")


def load_single_mesh(source: Path) -> trimesh.Trimesh:
    loaded = trimesh.load(source, force="scene", process=True)
    if isinstance(loaded, trimesh.Trimesh):
        mesh = loaded
    else:
        geometry = loaded.to_geometry()
        mesh = geometry if isinstance(geometry, trimesh.Trimesh) else loaded.dump(concatenate=True)
    if not isinstance(mesh, trimesh.Trimesh) or len(mesh.vertices) == 0 or len(mesh.faces) == 0:
        raise SystemExit("v591-small-body-empty-mesh")
    return mesh


def boundary_loop(mesh: trimesh.Trimesh) -> np.ndarray:
    edges, counts = np.unique(mesh.edges_sorted, axis=0, return_counts=True)
    boundary = edges[counts == 1]
    adjacency: dict[int, list[int]] = defaultdict(list)
    for first, second in boundary:
        adjacency[int(first)].append(int(second))
        adjacency[int(second)].append(int(first))
    if not adjacency or any(len(neighbors) != 2 for neighbors in adjacency.values()):
        raise SystemExit("v591-eros-printable-boundary-topology")
    start = min(adjacency, key=lambda index: tuple(float(value) for value in mesh.vertices[index]))
    loop = [start]
    previous: int | None = None
    current = start
    for _ in range(len(adjacency) - 1):
        neighbors = adjacency[current]
        next_index = neighbors[0] if neighbors[0] != previous else neighbors[1]
        loop.append(next_index)
        previous, current = current, next_index
    if len(set(loop)) != len(adjacency) or loop[-1] not in adjacency[start]:
        raise SystemExit("v591-eros-printable-boundary-loop")
    return np.asarray(loop, dtype=np.int64)


def reconstruct_eros_printable_halves(mesh: trimesh.Trimesh) -> tuple[trimesh.Trimesh, dict[str, object]]:
    parts = sorted(mesh.split(only_watertight=False), key=lambda part: float(part.centroid[1]))
    if len(parts) != 2 or any(not part.is_watertight for part in parts):
        raise SystemExit("v591-eros-printable-halves")
    open_parts: list[trimesh.Trimesh] = []
    loops: list[np.ndarray] = []
    cap_face_counts: list[int] = []
    cap_areas: list[float] = []
    for part in parts:
        cap_mask = np.asarray(part.face_normals[:, 2] < -0.999)
        cap_face_count = int(np.count_nonzero(cap_mask))
        if cap_face_count < 1000:
            raise SystemExit("v591-eros-printable-cap-detection")
        cap_face_counts.append(cap_face_count)
        cap_areas.append(float(part.area_faces[cap_mask].sum()))
        opened = part.copy()
        opened.update_faces(~cap_mask)
        opened.remove_unreferenced_vertices()
        loop = boundary_loop(opened)
        if len(loop) != 1065:
            raise SystemExit(f"v591-eros-printable-boundary-count:{len(loop)}")
        open_parts.append(opened)
        loops.append(loop)

    first_points = open_parts[0].vertices[loops[0]]
    second_points = open_parts[1].vertices[loops[1]]
    first_center = first_points[:, :2].mean(axis=0)
    second_center = second_points[:, :2].mean(axis=0)
    first_xy = first_points[:, :2] - first_center
    second_xy = second_points[:, :2] - second_center
    second_xy[:, 0] *= -1
    angle_deg = -15.0
    angle = np.deg2rad(angle_deg)
    rotation = np.asarray([[np.cos(angle), -np.sin(angle)], [np.sin(angle), np.cos(angle)]])
    transformed_second_xy = second_xy @ rotation.T
    best: tuple[float, bool, int, np.ndarray] | None = None
    for reversed_order in (False, True):
        ordered = transformed_second_xy[::-1] if reversed_order else transformed_second_xy
        for shift in range(len(first_xy)):
            shifted = np.roll(ordered, shift, axis=0)
            residual = np.linalg.norm(first_xy - shifted, axis=1)
            score = float(np.sqrt(np.mean(residual * residual)))
            if best is None or score < best[0]:
                best = (score, reversed_order, shift, residual)
    if best is None:
        raise SystemExit("v591-eros-printable-alignment")
    rms_error, reversed_order, shift, residual = best
    maximum_error = float(np.max(residual))
    if rms_error > 2e-6 or maximum_error > 5e-6:
        raise SystemExit(f"v591-eros-printable-alignment-error:{rms_error}:{maximum_error}")

    open_parts[0].vertices[:, :2] -= first_center
    open_parts[0].vertices[:, 2] -= float(np.median(first_points[:, 2]))
    second_all_xy = open_parts[1].vertices[:, :2] - second_center
    second_all_xy[:, 0] *= -1
    open_parts[1].vertices[:, :2] = second_all_xy @ rotation.T
    open_parts[1].vertices[:, 2] = -(open_parts[1].vertices[:, 2] - float(np.median(second_points[:, 2])))
    second_sequence = loops[1][::-1] if reversed_order else loops[1]
    second_sequence = np.roll(second_sequence, shift)
    open_parts[1].vertices[second_sequence] = open_parts[0].vertices[loops[0]]

    reconstructed = trimesh.util.concatenate(open_parts)
    reconstructed.merge_vertices(digits_vertex=8)
    reconstructed.update_faces(reconstructed.unique_faces())
    reconstructed.remove_unreferenced_vertices()
    reconstructed.fix_normals(multibody=True)
    edge_counts = np.unique(reconstructed.edges_sorted, axis=0, return_counts=True)[1]
    boundary_edge_count = int(np.count_nonzero(edge_counts == 1))
    non_manifold_edge_count = int(np.count_nonzero(edge_counts > 2))
    component_count = len(reconstructed.split(only_watertight=False))
    if (
        not reconstructed.is_watertight
        or component_count != 1
        or boundary_edge_count != 0
        or non_manifold_edge_count != 0
        or int(reconstructed.euler_number) != 2
    ):
        raise SystemExit(
            f"v591-eros-printable-reconstruction-topology:{reconstructed.is_watertight}:"
            f"{component_count}:{boundary_edge_count}:{non_manifold_edge_count}:{reconstructed.euler_number}"
        )
    audit = {
        "sourceComponentCount": 2,
        "sourceEulerNumber": 4,
        "capFaceCounts": cap_face_counts,
        "capAreas": [canonical_number(value) for value in cap_areas],
        "boundaryVertexCountPerHalf": len(loops[0]),
        "secondHalfTransform": "reflect-x;rotate-z-minus-15deg;reflect-across-cap-plane",
        "topologyOrderReversed": reversed_order,
        "topologyCyclicShift": shift,
        "seamRmsSourceUnits": canonical_number(rms_error),
        "seamMaximumSourceUnits": canonical_number(maximum_error),
        "outputComponentCount": component_count,
        "outputEulerNumber": int(reconstructed.euler_number),
        "boundaryEdgeCount": boundary_edge_count,
        "nonManifoldEdgeCount": non_manifold_edge_count,
        "watertight": True,
    }
    return reconstructed, audit


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--receipt", required=True)
    parser.add_argument("--body", required=True)
    args = parser.parse_args()

    root = Path.cwd().resolve()
    source = Path(args.source).resolve()
    output = Path(args.output).resolve()
    receipt_path = Path(args.receipt).resolve()
    if not source.is_file():
        raise SystemExit(f"v591-small-body-source-missing:{source}")
    output.parent.mkdir(parents=True, exist_ok=True)
    receipt_path.parent.mkdir(parents=True, exist_ok=True)

    mesh = load_single_mesh(source)
    source_vertices = int(len(mesh.vertices))
    source_triangles = int(len(mesh.faces))
    source_bounds = mesh.bounds.astype(np.float64)
    source_watertight = bool(mesh.is_watertight)
    source_euler_number = int(mesh.euler_number)
    source_component_count = len(mesh.split(only_watertight=False))
    printable_split_reconstruction = None
    if args.body == "eros":
        mesh, printable_split_reconstruction = reconstruct_eros_printable_halves(mesh)

    # NASA printable meshes are Z-up. Rotate Z onto glTF's Y axis while
    # preserving handedness, then center and normalize without reshaping.
    mesh.apply_transform(trimesh.transformations.rotation_matrix(-np.pi / 2.0, [1.0, 0.0, 0.0]))
    rotated_bounds = mesh.bounds.astype(np.float64)
    center = (rotated_bounds[0] + rotated_bounds[1]) * 0.5
    extent = rotated_bounds[1] - rotated_bounds[0]
    diameter = float(np.max(extent))
    if not np.isfinite(diameter) or diameter <= 0:
        raise SystemExit("v591-small-body-invalid-bounds")
    mesh.apply_translation(-center)
    mesh.apply_scale(2.0 / diameter)
    mesh.update_faces(mesh.unique_faces())
    mesh.remove_unreferenced_vertices()
    mesh.merge_vertices()
    mesh.fix_normals(multibody=True)

    vertices = np.asarray(mesh.vertices, dtype=np.float64)
    faces = np.asarray(mesh.faces)
    normals = np.asarray(mesh.vertex_normals, dtype=np.float32)
    if (
        vertices.ndim != 2
        or vertices.shape[1] != 3
        or faces.ndim != 2
        or faces.shape[1] != 3
        or normals.shape != vertices.shape
        or not np.isfinite(vertices).all()
        or not np.isfinite(normals).all()
    ):
        raise SystemExit("v591-small-body-finite-geometry")
    if np.max(np.abs(np.linalg.norm(normals, axis=1) - 1.0)) > 1e-4:
        raise SystemExit("v591-small-body-normal-unit")

    mesh.export(output, file_type="glb")
    output_bounds = mesh.bounds.astype(np.float64)
    unsigned = {
        "version": "v591-normalized-small-body-source-receipt-v1",
        "body": args.body,
        "source": {
            "path": relative(source, root),
            "bytes": source.stat().st_size,
            "sha256": sha256(source),
            "vertexCount": source_vertices,
            "triangleCount": source_triangles,
            "bounds": [[canonical_number(value) for value in row] for row in source_bounds],
            "watertight": source_watertight,
            "eulerNumber": source_euler_number,
            "componentCount": source_component_count,
        },
        "output": {
            "path": relative(output, root),
            "bytes": output.stat().st_size,
            "sha256": sha256(output),
            "vertexCount": int(len(mesh.vertices)),
            "triangleCount": int(len(mesh.faces)),
            "bounds": [[canonical_number(value) for value in row] for row in output_bounds],
            "watertight": bool(mesh.is_watertight),
            "eulerNumber": int(mesh.euler_number),
            "normals": True,
        },
        "derivation": {
            "tool": "trimesh",
            "version": trimesh.__version__,
            "parameters": "process; source-z-up-to-gltf-y-up; bounds-midpoint-pivot; max-extent-diameter-2; unique-faces; remove-unreferenced; merge-vertices; fix-normals",
            "units": "normalized-diameter-2",
            "rotationAxis": "positive-y",
            "pivot": "bounds-midpoint",
            "geometryReshaped": False,
            "printableSplitReconstruction": printable_split_reconstruction,
        },
        "presentationOnly": True,
    }
    receipt = {
        **unsigned,
        "receiptSha256": hashlib.sha256(
            json.dumps(canonical(unsigned), separators=(",", ":")).encode("utf-8")
        ).hexdigest(),
    }
    partial_receipt = receipt_path.with_suffix(receipt_path.suffix + ".part")
    partial_receipt.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    partial_receipt.replace(receipt_path)
    print(
        json.dumps(
            {
                "body": args.body,
                "sourceTriangles": source_triangles,
                "normalizedTriangles": len(mesh.faces),
                "watertight": bool(mesh.is_watertight),
                "outputSha256": receipt["output"]["sha256"],
                "receiptSha256": receipt["receiptSha256"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
