"""Signed diagnostic-error localization on the retained 125 common nodes.

These are coordinate-component squared norms, NOT gravitational energy,
boundary flux, a reflection coefficient, or a new scientific acceptance gate.
The reference reducer uses scalar math.fsum on the original field components.
"""
from __future__ import annotations

import math

import numpy as np

from .fo_ccz4_exterior_window import CORE

EPS = np.finfo(float).eps
REGIONS = ("lower_nearer", "equidistant", "upper_nearer")


def region_masks():
    """Disjoint regions measured relative to the ORIGINAL [1,3]^3 faces."""
    xyz = np.stack(np.meshgrid(CORE, CORE, CORE, indexing="ij"), axis=-1)
    lower_distance = np.min(xyz, axis=-1)-1.
    upper_distance = 3.-np.max(xyz, axis=-1)
    return dict(zip(REGIONS, (lower_distance < upper_distance,
                             lower_distance == upper_distance,
                             lower_distance > upper_distance), strict=True))


def _fields(total, initial):
    if np.iscomplexobj(total) or np.iscomplexobj(initial):
        raise ValueError("real diagnostic components required")
    a, b = np.asarray(total, dtype=float), np.asarray(initial, dtype=float)
    if (a.shape != b.shape or a.shape[:3] != (5, 5, 5) or a.size == 0
            or not np.all(np.isfinite(a)) or not np.all(np.isfinite(b))):
        raise ValueError("matched finite nonempty fields on the fixed 5^3 core required")
    return a.reshape(125, -1), b.reshape(125, -1)


def _scalar_reference(a, b):
    pairs = [(float(x), float(y)) for x, y in zip(a.flat, b.flat, strict=True)]
    n = len(pairs)
    return {
        "total_mean_square": math.fsum(x*x for x, _ in pairs)/n,
        "initial_mean_square": math.fsum(y*y for _, y in pairs)/n,
        "evolution_mean_square": math.fsum((x-y)*(x-y) for x, y in pairs)/n,
        "cross_mean": math.fsum(2.*y*(x-y) for x, y in pairs)/n,
        "positive_cross_mean": math.fsum(max(2.*y*(x-y), 0.) for x, y in pairs)/n,
        "negative_cross_magnitude": math.fsum(max(-2.*y*(x-y), 0.) for x, y in pairs)/n,
    }


def _stats(a, b):
    with np.errstate(over="ignore", invalid="ignore"):
        delta = a-b
        total2, initial2, change2, cross = a*a, b*b, delta*delta, 2.*b*delta
        value = {
            "total_mean_square": float(np.mean(total2)),
            "initial_mean_square": float(np.mean(initial2)),
            "evolution_mean_square": float(np.mean(change2)),
            "cross_mean": float(np.mean(cross)),
            "positive_cross_mean": float(np.mean(np.maximum(cross, 0.))),
            "negative_cross_magnitude": float(np.mean(np.maximum(-cross, 0.))),
        }
    if not all(math.isfinite(v) for v in value.values()):
        raise ValueError("diagnostic squared norm overflow")
    reference = _scalar_reference(a, b)
    scale = max(*value.values(), *reference.values(), np.finfo(float).tiny)
    tolerance = 128.*EPS*scale
    if any(abs(value[k]-reference[k]) > tolerance for k in value):
        raise ValueError("independent scalar reduction mismatch")
    closure = value["total_mean_square"]-value["initial_mean_square"]-value["evolution_mean_square"]-value["cross_mean"]
    if abs(closure) > tolerance:
        raise ValueError("signed squared-norm identity failed")
    product = math.sqrt(value["initial_mean_square"])*math.sqrt(value["evolution_mean_square"])
    return {**value, "total_rms": math.sqrt(value["total_mean_square"]),
            "initial_rms": math.sqrt(value["initial_mean_square"]),
            "evolution_rms": math.sqrt(value["evolution_mean_square"]),
            "alignment_cosine": value["cross_mean"]/(2.*product) if product > 0. else None,
            "squared_norm_closure": closure, "node_count": a.shape[0],
            "component_count": a.shape[1], "scalar_reference_checked": True}


def localize_error(total, initial):
    """Retain all nodes; report each disjoint region and every coordinate plane."""
    a, b = _fields(total, initial)
    whole = _stats(a, b)
    masks = region_masks()
    coverage = sum(m.astype(int) for m in masks.values())
    if not np.all(coverage == 1):
        raise ValueError("region partition is not exhaustive and disjoint")
    regions = {}
    for name, mask in masks.items():
        stats = _stats(a[mask.ravel()], b[mask.ravel()])
        stats["evolution_square_share"] = (
            (stats["node_count"]/125.)*stats["evolution_mean_square"]/whole["evolution_mean_square"]
            if whole["evolution_mean_square"] > 0. else None)
        regions[name] = stats
    for key in ("total_mean_square", "initial_mean_square", "evolution_mean_square", "cross_mean"):
        recovered = math.fsum(v["node_count"]*v[key]/125. for v in regions.values())
        scale = max(whole["total_mean_square"], whole["initial_mean_square"],
                    whole["evolution_mean_square"], abs(whole["cross_mean"]), np.finfo(float).tiny)
        if abs(recovered-whole[key]) > 128.*EPS*scale:
            raise ValueError("weighted region reconstruction failed")
    planes = []
    grid_index = np.indices((5, 5, 5))
    for axis in range(3):
        for index, coordinate in enumerate(CORE):
            mask = (grid_index[axis] == index).ravel()
            planes.append({"axis": axis, "coordinate": coordinate, **_stats(a[mask], b[mask])})
    return {"whole": whole, "regions": regions, "planes": planes,
            "reference_faces": {"lower": [1., 1., 1.], "upper": [3., 3., 3.]},
            "partition_node_counts": {name: int(mask.sum()) for name, mask in masks.items()},
            "physical_energy_or_flux": False, "new_acceptance_gate": False}
