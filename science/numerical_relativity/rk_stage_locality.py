"""First-step stage diagnostics, not causal propagation or physical admission."""
from pathlib import Path
import struct

import numpy as np

from . import schwarzschild_rhs_locality as L

LABELS = ("k1", "s2", "k2", "s3", "k3", "s4", "k4", "final")
SUPPORT = dict(zip(LABELS, (0, 0, 2, 2, 4, 4, 6, 6), strict=True))
HEADER = struct.Struct("<8sQQQ")
LIMIT = 2.e-12


def read_trace(path, n):
    path = Path(path)
    if type(n) is not int or n < 17:
        raise ValueError("stage trace requires integer grid size >=17")
    with path.open("rb") as stream:
        header = stream.read(HEADER.size)
    if len(header) != HEADER.size or HEADER.unpack(header) != (b"NRRKSTG1", 1, n, 58):
        raise ValueError("not the declared RK4 stage trace")
    if path.stat().st_size != HEADER.size+len(LABELS)*58*n**3*8:
        raise ValueError("stage trace size differs")
    return np.memmap(path, dtype="<f8", mode="r", offset=HEADER.size, shape=(8, 58, n, n, n))


def distance(n, side):
    if type(n) is not int or n < 17 or side not in ("low", "high"):
        raise ValueError("original grid >=17 and low/high side required")
    ijk = np.indices((n,)*3)
    return np.maximum(np.min(ijk, axis=0)-1 if side == "low" else n-2-np.max(ijk, axis=0), 0)


def compare_stage(left, right, label, side):
    a, b = L.fields(left), L.fields(right)
    if label not in LABELS or a.shape != b.shape:
        raise ValueError("identified matched stage required")
    with np.errstate(over="ignore", invalid="ignore"):
        diff = L.fields(a-b)
    n = a.shape[1]
    depth = distance(n, side)
    masks = L.partitions(n)
    active = masks["active"]
    masks.update(core=L.core_mask(n))
    for name, lower, upper in (("depth_1_2", 1, 2), ("depth_3_4", 3, 4),
                                ("depth_5_6", 5, 6), ("depth_7_plus", 7, n)):
        masks[name] = active & (depth >= lower) & (depth <= upper)
    regions = {}
    for name, mask in masks.items():
        maximum = np.max(np.abs(diff[:, mask]), axis=0)
        regions[name] = {"node_count": int(mask.sum()), "slot_norms": L.slot_norms(diff, mask),
            "max_abs_difference": float(maximum.max()), "resolved_nodes": int(np.count_nonzero(maximum > LIMIT)),
            "bytes_equal": a[:, mask].tobytes() == b[:, mask].tobytes()}
    outside = active & (depth > SUPPORT[label])
    outside_max = float(np.max(np.abs(diff[:, outside])))
    location = tuple(int(i) for i in np.unravel_index(np.argmax(np.abs(diff)), diff.shape))
    return {"regions": regions, "maximum_location_slot_ijk": location,
            "support_depth_cells": SUPPORT[label], "outside_support_max_abs": outside_max,
            "support_consistency_passed": outside_max <= LIMIT,
            "support_is_causal_domain": False, "intermediate_stage": label != "final"}
