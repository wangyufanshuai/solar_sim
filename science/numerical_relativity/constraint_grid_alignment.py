"""Diagnostic-only nodal alignment; not an AMR transfer or convergence gate.

Six-point degree-five local interpolation on uniform closed [1,3] axes.
Coefficients and coincident-node identities are constructed from rational grid
indices. No periodic wrapping, extrapolation, cell averaging, derivative,
projection or evolution is performed. Grid norms are retained because coarse
sampling cannot certify that an unresolved fine-grid mode is absent.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from functools import lru_cache
import hashlib
import math

import numpy as np

from . import constraint_field_comparison as C

METHOD = "closed-uniform-nodal-local-six-point-degree5-rational-weights-v1"
DEGREE = 5
MAX_POINTS = 65  # Bounded diagnostic arrays; not a native solver grid extension.


@dataclass(frozen=True)
class AxisTransfer:
    source_points: int
    target_points: int
    weights: np.ndarray
    # -1 indicates interpolation; otherwise the exact source index is copied.
    coincident_indices: tuple[int, ...]


def axis_transfer(source_points, target_points):
    C.require(
        all(
            type(n) is int and 6 <= n <= MAX_POINTS
            for n in (source_points, target_points)
        ),
        "bounded uniform closed axes require 6..65 points",
    )
    return _axis_transfer(source_points, target_points)


@lru_cache(maxsize=32)
def _axis_transfer(source_points, target_points):
    rows, coincident = [], []
    for target_index in range(target_points):
        position = Fraction(target_index * (source_points - 1), target_points - 1)
        row = [Fraction(0) for _ in range(source_points)]
        if position.denominator == 1:
            node = int(position)
            row[node] = Fraction(1)
            coincident.append(node)
        else:
            # Same six nearest stencil nodes in both directions; shift at ends.
            start = min(
                max(position.numerator // position.denominator - 2, 0),
                source_points - 6,
            )
            nodes = range(start, start + 6)
            for node in nodes:
                row[node] = math.prod(
                    (position - other) / (node - other)
                    for other in nodes
                    if other != node
                )
            coincident.append(-1)
        # Exact constant preservation before any conversion to FP64.
        C.require(sum(row) == 1, "rational interpolation partition failure")
        rows.append([float(value) for value in row])
    return AxisTransfer(
        source_points,
        target_points,
        C.immutable_array(np.array(rows)),
        tuple(coincident),
    )


def transfer_metadata(plan):
    return dict(
        method=METHOD,
        source_points=plan.source_points,
        target_points=plan.target_points,
        lower=1.0,
        upper=3.0,
        centering="closed-node",
        polynomial_degree=DEGREE,
        max_stencil_points=6,
        coincident_node_count=sum(i >= 0 for i in plan.coincident_indices),
        axis_linf_amplification_bound=max(math.fsum(abs(row)) for row in plan.weights),
        weights_sha256=hashlib.sha256(
            plan.weights.astype("<f8", copy=False).tobytes()
        ).hexdigest(),
        extrapolation=False,
        periodic_wrapping=False,
        cell_averaging=False,
        algebraic_projection=False,
        truncation_error_bound_known=False,
        conservative_transfer=False,
        sbp_norm_compatible_transfer=False,
        evolution_connected=False,
    )


def apply_axis(field, plan, axis):
    C.finite_array(field, "diagnostic field")
    C.require(
        type(axis) is int and 0 <= axis < field.ndim, "valid transfer axis required"
    )
    C.require(isinstance(plan, AxisTransfer), "axis transfer required")
    C.finite_array(plan.weights, "transfer weights")
    expected = axis_transfer(plan.source_points, plan.target_points)
    C.require(
        np.array_equal(plan.weights, expected.weights)
        and type(plan.coincident_indices) is tuple
        and all(type(i) is int for i in plan.coincident_indices)
        and plan.coincident_indices == expected.coincident_indices,
        "unaltered registered transfer required",
    )
    C.require(field.shape[axis] == plan.source_points, "source axis shape mismatch")
    C.require(field.size <= 3 * MAX_POINTS**3, "bounded diagnostic field required")
    if all(i >= 0 for i in plan.coincident_indices):
        return C.immutable_array(np.take(field, plan.coincident_indices, axis=axis))
    with np.errstate(over="raise", invalid="raise"):
        values = np.moveaxis(np.tensordot(plan.weights, field, axes=(1, axis)), 0, axis)
    # Exact source values win over FP arithmetic at coincident nodes.
    for target, source in enumerate(plan.coincident_indices):
        if source >= 0:
            index = [slice(None)] * field.ndim
            index[axis] = target
            values[tuple(index)] = np.take(field, source, axis=axis)
    C.finite_array(values, "transferred diagnostic field")
    return C.immutable_array(values)


def align_cube(field, target_points):
    """Sample scalar or Cartesian vector diagnostics, never canonical states."""
    C.finite_array(field, "diagnostic field")
    C.require(
        field.ndim in (3, 4)
        and field.shape[:3] == (field.shape[0],) * 3
        and (field.ndim == 3 or field.shape[3] == 3),
        "cubic scalar/vector diagnostic layout required",
    )
    plan = axis_transfer(field.shape[0], target_points)
    current = field
    for axis in range(3):
        current = apply_axis(current, plan, axis)
    metadata = transfer_metadata(plan)
    metadata["tensor_linf_amplification_bound"] = (
        metadata["axis_linf_amplification_bound"] ** 3
    )
    metadata["source_shape"], metadata["target_shape"] = (
        list(field.shape[:3]),
        [target_points] * 3,
    )
    return current, metadata


def compare_registered_triplet(frames):
    """Native-grid constraints first, then all pairs on the fixed N9 grid.

    Original grid norms are indispensable context. Interpolation error and sampling
    aliasing are not bounded by small pair differences. Unequal h ratios preclude
    the uniform-ratio log2 order formula; no order is computed here.
    """
    C.verify_helpers()
    C.require(
        isinstance(frames, (tuple, list)) and len(frames) == 3,
        "ordered N9/N13/N17 triplet required",
    )
    for frame in frames:
        C.validate_frame(frame)
    C.require(
        tuple(len(frame.coordinates[0]) for frame in frames) == (9, 13, 17),
        "ordered N9/N13/N17 triplet required",
    )
    C.require(
        frames[0].time == frames[1].time == frames[2].time,
        "common exact physical time required",
    )
    target = frames[0]
    masks = C.region_masks(9)
    aligned, native, transfers = [], [], []
    for frame in frames:
        values = {}
        for name in C.FIELDS:
            values[name], metadata = align_cube(frame.fields[name], 9)
        aligned.append(values)
        transfers.append(metadata)
        native.append(
            {
                region: {
                    name: C.weighted_rms(frame.fields[name], frame.weights, mask)
                    for name in C.FIELDS
                }
                for region, mask in C.region_masks(len(frame.coordinates[0])).items()
            }
        )
    pairs = []
    for i, j, label in (
        (0, 1, "coarse-medium"),
        (1, 2, "medium-fine"),
        (0, 2, "coarse-fine"),
    ):
        pairs.append(
            dict(
                pair=label,
                regions={
                    region: {
                        name: C.compare_arrays(
                            aligned[i][name], aligned[j][name], target.weights, mask
                        )
                        for name in C.FIELDS
                    }
                    for region, mask in masks.items()
                },
            )
        )
    return dict(
        schema="nr-diagnostic-grid-alignment-v1",
        alignment_method=METHOD,
        diagnostic_method=C.METHOD,
        units=C.UNITS,
        normalization=C.NORMALIZATION,
        time=dict(numerator=target.time.numerator, denominator=target.time.denominator),
        source_grid_points=[9, 13, 17],
        target_grid_points=9,
        source_state_sha256=[frame.state_sha256 for frame in frames],
        refinement_ratios=[
            dict(numerator=3, denominator=2),
            dict(numerator=4, denominator=3),
        ],
        native_grid_norms=native,
        transfers=transfers,
        comparisons=pairs,
        continuum_error_bound_known=False,
        interpolation_error_bound_known=False,
        aliasing_excluded=False,
        order_estimated=False,
        new_evolution=False,
        rhs_recomputed=False,
        primary_result_regraded=False,
        spatial_convergence_validated=False,
        constraint_convergence_validated=False,
        amr_validated=False,
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
    )
