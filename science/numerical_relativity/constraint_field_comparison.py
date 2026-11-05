"""Same-grid, common-time ADM field differences, not a convergence gate.

This adapter exposes arrays from the frozen independent dense auditors. It is
independent of the evolution RHS, not a third implementation of Einstein's
equations. Supported grids are the inherited N9/N13/N17 cubes on [1,3]^3.
Momentum is a Cartesian component RMS (division by 3), not a covector norm
formed with the physical inverse metric. No interpolation or projection occurs.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from functools import lru_cache
import hashlib
import math
from pathlib import Path
import runpy
from types import MappingProxyType
from typing import Mapping

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
HELPERS = {
    "scripts/audit-nr-k3-nonlinear-dual-diagnostics.py": "f345cc4f37ae8e17199ea87cf4aecb49c552da1ab03242dbcd2c4c3d1b26453a",
    "scripts/audit-nr-k3-nonlinear-refinement.py": "f904bc8856a263435f236b7d18ba0ea964745f24fa1ade7504bae25c5cf05c1b",
    "scripts/audit-nr-k3-full58-sbp.py": "c841f85b8934a7e6bef7437c165330fc1065bb6d7c6bffe7f055f7f224d9f588",
}
METHOD = "independent-dense-sbp42-D1-connection-and-D2-lower-Riemann-v1"
UNITS = "G=c=mass=1;Cartesian-xyz"
NORMALIZATION = "SBP-tensor-weighted-node-component-mean-RMS-v1"
FIELDS = ("H_metric", "H_metric_hessian", "M_metric")
REGIONS = ("whole", "central_box", "faces", "edges", "corners")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verify_helpers():
    for name, expected in HELPERS.items():
        require(
            hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == expected,
            "frozen independent helper changed: " + name,
        )


@lru_cache(maxsize=1)
def independent_auditor():
    verify_helpers()
    return runpy.run_path(str(ROOT / next(iter(HELPERS))))


def finite_array(value, label):
    require(
        isinstance(value, np.ndarray)
        and value.dtype == np.float64
        and value.size > 0
        and np.isfinite(value).all(),
        label + " must be nonempty finite FP64 ndarray",
    )
    return value


def immutable_array(value):
    """Own immutable bytes; even setflags(write=True) must not create aliases."""
    value = np.ascontiguousarray(value, dtype=np.float64)
    return np.frombuffer(value.tobytes(), dtype=np.float64).reshape(value.shape)


def region_masks(n):
    require(type(n) is int and n in (9, 13, 17), "registered cubic grid required")
    indices = np.indices((n,) * 3)
    count = np.sum((indices == 0) | (indices == n - 1), axis=0)
    xyz = np.meshgrid(*(np.linspace(1.0, 3.0, n) for _ in range(3)), indexing="ij")
    central = np.logical_and.reduce([(x >= 1.5) & (x <= 2.5) for x in xyz])
    return dict(
        whole=np.ones((n,) * 3, dtype=bool),
        central_box=central,
        faces=count == 1,
        edges=count == 2,
        corners=count == 3,
    )


def weighted_rms(field, weights, mask):
    """Average squared components per node, then positive SBP volume weights."""
    finite_array(field, "field")
    finite_array(weights, "weights")
    require(weights.ndim == 3 and np.all(weights > 0.0), "positive 3D weights required")
    require(
        field.shape == weights.shape or field.shape == (*weights.shape, 3),
        "scalar or Cartesian vector on exact grid required; no broadcasting",
    )
    require(
        isinstance(mask, np.ndarray)
        and mask.dtype == np.bool_
        and mask.shape == weights.shape
        and mask.any(),
        "nonempty exact Boolean mask required",
    )
    selected = field[mask].reshape((int(np.count_nonzero(mask)), -1))
    scale = float(np.max(np.abs(selected)))
    if scale == 0.0:
        return 0.0
    # Scaling keeps finite huge/tiny arrays from overflowing/underflowing on square.
    weighted = weights[mask] / float(np.max(weights[mask]))
    mean_squares = np.mean((selected / scale) ** 2, axis=-1)
    result = scale * math.sqrt(math.fsum(weighted * mean_squares) / math.fsum(weighted))
    require(np.isfinite(result), "nonfinite weighted RMS")
    return result


def compare_arrays(left, right, weights, mask):
    """Norm gap is only a lower bound; report the actual norm of the difference."""
    finite_array(left, "left field")
    finite_array(right, "right field")
    require(
        left.shape == right.shape, "identical field shapes required; no broadcasting"
    )
    left_norm = weighted_rms(left, weights, mask)
    right_norm = weighted_rms(right, weights, mask)
    with np.errstate(over="raise", invalid="raise"):
        difference = left - right
    return dict(
        left_norm=left_norm,
        right_norm=right_norm,
        norm_gap=abs(left_norm - right_norm),
        field_difference_rms=weighted_rms(difference, weights, mask),
        field_difference_linf=float(np.max(np.abs(difference[mask]))),
    )


@dataclass(frozen=True)
class ConstraintFrame:
    time: Fraction
    coordinates: tuple[np.ndarray, np.ndarray, np.ndarray]
    weights: np.ndarray
    fields: Mapping[str, np.ndarray]
    state_sha256: str
    method: str = METHOD
    units: str = UNITS
    normalization: str = NORMALIZATION


def validate_frame(frame):
    require(isinstance(frame, ConstraintFrame), "constraint frame required")
    require(
        type(frame.time) is Fraction and frame.time >= 0,
        "exact nonnegative rational physical time required",
    )
    require(
        frame.method == METHOD
        and frame.units == UNITS
        and frame.normalization == NORMALIZATION,
        "diagnostic/units/normalization identity mismatch",
    )
    require(
        isinstance(frame.coordinates, tuple) and len(frame.coordinates) == 3,
        "three Cartesian coordinate axes required",
    )
    for coordinate in frame.coordinates:
        finite_array(coordinate, "coordinates")
        require(
            coordinate.ndim == 1
            and len(coordinate) in (9, 13, 17)
            and np.array_equal(coordinate, np.linspace(1.0, 3.0, len(coordinate))),
            "registered [1,3] axis required",
        )
    n = len(frame.coordinates[0])
    require(
        all(len(c) == n for c in frame.coordinates), "registered cubic grid required"
    )
    require(
        set(frame.fields) == set(FIELDS), "complete exact H/Hessian-H/M fields required"
    )
    for name, field in frame.fields.items():
        finite_array(field, name)
        expected = (n,) * 3 + ((3,) if name == "M_metric" else ())
        require(field.shape == expected, "constraint tensor layout mismatch")
    finite_array(frame.weights, "weights")
    _, w = independent_auditor()["A"]["SBP"](n)
    require(
        np.array_equal(
            frame.weights, w[:, None, None] * w[None, :, None] * w[None, None, :]
        ),
        "frozen SBP tensor weights required",
    )
    require(
        isinstance(frame.state_sha256, str)
        and len(frame.state_sha256) == 64
        and all(c in "0123456789abcdef" for c in frame.state_sha256),
        "state SHA256 required",
    )


def reconstruct(q, *, time):
    """No trace-free/determinant projection; preserve full physical K trace."""
    verify_helpers()
    require(
        type(time) is Fraction and time >= 0,
        "exact nonnegative rational physical time required",
    )
    finite_array(q, "canonical state")
    require(
        q.ndim == 4
        and q.shape[0] == 58
        and q.shape[1] in (9, 13, 17)
        and q.shape[1:] == (q.shape[1],) * 3,
        "canonical58 registered cube required",
    )
    # Work on an owned copy; returned arrays cannot alias caller or helper buffers.
    q = q.copy()
    state_sha = hashlib.sha256(q.astype("<f8", copy=False).tobytes()).hexdigest()
    dual = independent_auditor()
    legacy, weights = dual["A"]["tensor_fields"](q)
    n = q.shape[1]
    h, a = (np.zeros((n, n, n, 3, 3)) for _ in range(2))
    for slot, (i, j) in enumerate(dual["A"]["PAIRS"]):
        h[..., i, j] = h[..., j, i] = q[slot]
        a[..., i, j] = a[..., j, i] = q[11 + slot]
    with np.errstate(over="raise", invalid="raise", divide="raise", under="raise"):
        chi = np.exp(2.0 * q[10])
        g = h / chi[..., None, None]
        k = (a + h * q[17, ..., None, None] / 3.0) / chi[..., None, None]
        inverse = np.linalg.inv(g)
        mixed = np.einsum("...ij,...jk->...ik", inverse, k)
        ricci = dual["geometry"](g, (2.0 / (n - 1),) * 3)
        h_hessian = np.einsum("...ij,...ij->...", inverse, ricci)
        h_hessian += np.trace(mixed, axis1=-2, axis2=-1) ** 2
        h_hessian -= np.einsum("...ij,...ji->...", mixed, mixed)
    fields = dict(
        H_metric=legacy["H_metric"],
        H_metric_hessian=h_hessian,
        M_metric=legacy["M_metric"],
    )
    frame = ConstraintFrame(
        time=time,
        coordinates=tuple(immutable_array(np.linspace(1.0, 3.0, n)) for _ in range(3)),
        weights=immutable_array(weights),
        fields=MappingProxyType({k: immutable_array(v) for k, v in fields.items()}),
        state_sha256=state_sha,
    )
    validate_frame(frame)
    return frame


def compare_frames(left, right):
    verify_helpers()
    for frame in (left, right):
        validate_frame(frame)
    require(left.time == right.time, "common exact physical time required")
    require(
        all(
            np.array_equal(a, b)
            for a, b in zip(left.coordinates, right.coordinates, strict=True)
        )
        and np.array_equal(left.weights, right.weights),
        "same spatial grid required; cross-grid restriction is not implemented",
    )
    masks = region_masks(len(left.coordinates[0]))
    return dict(
        schema="nr-same-grid-constraint-field-difference-v1",
        method=METHOD,
        units=UNITS,
        normalization=NORMALIZATION,
        time=dict(numerator=left.time.numerator, denominator=left.time.denominator),
        shape=list(left.weights.shape),
        left_state_sha256=left.state_sha256,
        right_state_sha256=right.state_sha256,
        regions={
            region: {
                name: compare_arrays(
                    left.fields[name], right.fields[name], left.weights, mask
                )
                for name in FIELDS
            }
            for region, mask in masks.items()
        },
        new_evolution=False,
        constraint_convergence_validated=False,
        spatial_convergence_validated=False,
        primary_result_regraded=False,
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
    )
