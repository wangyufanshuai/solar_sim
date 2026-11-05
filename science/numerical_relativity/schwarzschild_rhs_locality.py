"""Instantaneous RHS locality diagnostics; no evolution or physical admission."""
from __future__ import annotations

import numpy as np

from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER
from .fo_ccz4_exterior_window import CORE, indices
from .fo_ccz4_schwarzschild import BOUNDARY, HALO


def fields(values):
    if np.iscomplexobj(values):
        raise ValueError("real RHS components required")
    q = np.asarray(values, dtype=float)
    if (q.ndim != 4 or q.shape[0] != 58 or len(set(q.shape[1:])) != 1
            or q.shape[1] < 9 or not np.all(np.isfinite(q))):
        raise ValueError("58 finite cubic fields with at least nine nodes required")
    return q


def common_cube(values, grid, original_n):
    """Crop matched nodes, without interpolating or changing the input."""
    q = fields(values)
    if (type(original_n) is not int or original_n < 9 or q.shape[1:] != grid.shape
            or grid.boundary != BOUNDARY or grid.spatial_order != 4
            or not np.allclose(grid.spacing, 2./(original_n-1), rtol=0., atol=2.e-15)):
        raise ValueError("matched FD4 exterior grid required")
    positions = np.linspace(1., 3., original_n)
    selected = [indices(grid, positions, axis) for axis in range(3)]
    if any(not np.array_equal(np.diff(v), np.ones(original_n-1, dtype=int)) for v in selected):
        raise ValueError("contiguous identical-spacing nodes required")
    slices = tuple(slice(int(v[0]), int(v[-1])+1) for v in selected)
    return q[(slice(None), *slices)].copy()


def partitions(n):
    if type(n) is not int or n < 9:
        raise ValueError("integer original grid size >=9 required")
    ijk = np.indices((n,)*3)
    low = np.any(ijk < HALO, axis=0)
    high = np.any(ijk >= n-HALO, axis=0)
    return {"active": ~(low | high), "lower_only": low & ~high,
            "upper_only": high & ~low, "mixed_lower_upper": low & high}


def core_mask(n):
    if type(n) is not int or n < 9:
        raise ValueError("integer original grid size >=9 required")
    offsets = (np.asarray(CORE)-1.)*(n-1)/2.
    chosen = np.rint(offsets).astype(int)
    if not np.allclose(offsets, chosen, rtol=0., atol=2.e-12):
        raise ValueError("original grid must contain the fixed quarter-spaced core")
    mask = np.zeros((n,)*3, dtype=bool)
    mask[np.ix_(chosen, chosen, chosen)] = True
    return mask


def slot_norms(values, mask):
    q = fields(values)
    mask = np.asarray(mask)
    if mask.dtype != np.dtype(bool) or mask.shape != q.shape[1:] or not np.any(mask):
        raise ValueError("nonempty boolean node mask required")
    sample = q[:, mask]
    maxima = np.max(np.abs(sample), axis=1)
    scaled = np.divide(sample, maxima[:, None], out=np.zeros_like(sample), where=maxima[:, None] != 0.)
    rms = maxima*np.sqrt(np.mean(scaled*scaled, axis=1))
    return [{"slot": i, "name": name, "l2": float(rms[i]), "linf": float(maxima[i]),
             "minimum": float(sample[i].min()), "maximum": float(sample[i].max())}
            for i, name in enumerate(FOCCZ4_VARIABLE_ORDER)]


def compare(left, right):
    a, b = fields(left), fields(right)
    if a.shape != b.shape:
        raise ValueError("matched original cubes required")
    masks = {**partitions(a.shape[1]), "core": core_mask(a.shape[1])}
    with np.errstate(over="ignore", invalid="ignore"):
        difference = fields(a-b)
    return {name: {"node_count": int(mask.sum()), "left": slot_norms(a, mask),
                   "right": slot_norms(b, mask), "difference": slot_norms(difference, mask),
                   "max_abs_difference": float(np.max(np.abs(difference[:, mask]))),
                   "bytes_equal": a[:, mask].tobytes() == b[:, mask].tobytes()}
            for name, mask in masks.items()}


def support_envelopes(grid):
    """Conservative geometric reach, NOT an influence/propagation measurement.

    Radius 2 bounds an FD4 first derivative; radius 4 bounds two composed
    derivatives. The Cartesian-box envelope overestimates mixed-derivative
    support, and does not assert that all supported terms have nonzero weights.
    """
    if grid.boundary != BOUNDARY or grid.spatial_order != 4:
        raise ValueError("FD4 exterior grid required")
    nodes = np.stack(np.meshgrid(*(indices(grid, CORE, k) for k in range(3)), indexing="ij"), axis=-1)
    result = []
    for radius in (2, 4):
        low = np.any(nodes-radius < HALO, axis=-1)
        high = np.any(nodes+radius >= np.asarray(grid.shape)-HALO, axis=-1)
        result.append({"radius_cells": radius, "core_nodes": 125,
                       "lower_halo_reach_nodes": int(low.sum()),
                       "upper_halo_reach_nodes": int(high.sum()),
                       "either_halo_reach_nodes": int((low | high).sum()),
                       "causal_domain_of_dependence": False})
    return result
