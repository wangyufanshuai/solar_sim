"""Local-patch AMR shadow contract for the 3-D reference kernels.

This module is the next K3 step beyond full-domain subcycling.  A periodic
coarse state drives a bounded fine patch through deterministic trilinear ghost
refreshes at every fine substep.  The patch uses the existing non-periodic
Sommerfeld scalar proxy at its outer numerical shell; therefore this is a
ghost-exchange and synchronization diagnostic, not a production
constraint-preserving AMR boundary or conservative reflux implementation.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from typing import Literal, Sequence

import numpy as np

from .bssn3d import advance_bssn_rk4_3d
from .ccz4_3d import advance_ccz4_rk4_3d
from .ccz4_reference import GaugeConfig
from .ccz4_rhs import CCZ4Config
from .nr3d import BSSNState3D, Grid3D, project_algebraic_constraints_3d


Formulation3D = Literal["ccz4", "bssnok"]


_STATE_FIELDS = (
    "chi",
    "h",
    "trace_k",
    "a",
    "theta",
    "conformal_gamma",
    "lapse",
    "shift",
    "b",
)


@dataclass(frozen=True)
class LocalAMRPatchReport3D:
    """Auditable result of one local-patch AMR shadow campaign."""

    formulation: Formulation3D
    refinement_ratio: int
    coarse_steps: int
    fine_steps: int
    coarse_dt: float
    fine_dt: float
    patch_lower: tuple[int, int, int]
    patch_upper: tuple[int, int, int]
    ghost_cells: int
    ghost_refreshes: int
    finite_state: bool
    ghost_consistent: bool
    coarse_fine_l2: float
    coarse_fine_l_inf: float
    predictor_endpoint_l2: float
    predictor_endpoint_l_inf: float
    synchronization: str
    boundary_operator: str
    reflux_applied: bool
    physical_amr_validated: bool
    coarse_state: BSSNState3D
    fine_patch_state: BSSNState3D
    state_sha256: str


def _state_arrays(state: BSSNState3D) -> tuple[np.ndarray, ...]:
    return tuple(np.asarray(getattr(state, name), dtype=np.float64) for name in _STATE_FIELDS)


def _difference_norms(
    left: Sequence[np.ndarray],
    right: Sequence[np.ndarray],
) -> tuple[float, float]:
    if len(left) != len(right):
        raise ValueError("AMR state field lists must have equal length")
    square = 0.0
    count = 0
    linf = 0.0
    for left_field, right_field in zip(left, right):
        if left_field.shape != right_field.shape:
            raise ValueError("AMR state fields must have matching shapes")
        difference = left_field - right_field
        square += float(np.sum(difference * difference, dtype=np.float64))
        count += int(difference.size)
        if difference.size:
            linf = max(linf, float(np.max(np.abs(difference))))
    return math.sqrt(square / count), linf


def _sample_periodic_field(
    values: np.ndarray,
    source_grid: Grid3D,
    target_grid: Grid3D,
) -> np.ndarray:
    """Sample a periodic node-centered field at arbitrary target nodes."""

    field = np.asarray(values, dtype=np.float64)
    if field.shape[:3] != source_grid.shape:
        raise ValueError("source field shape does not match source grid")
    coordinates = target_grid.coordinates
    index_axes: list[np.ndarray] = []
    fractions: list[np.ndarray] = []
    for axis, coordinate in enumerate(coordinates):
        coarse_coordinate = (coordinate - float(source_grid.lower[axis])) / source_grid.spacing[axis]
        floor = np.floor(coarse_coordinate)
        index_axes.append(floor.astype(np.int64) % source_grid.shape[axis])
        fractions.append(coarse_coordinate - floor)
    result = np.zeros((*target_grid.shape, *field.shape[3:]), dtype=np.float64)
    trailing = (None,) * (field.ndim - 3)
    for offset_x in (0, 1):
        weight_x = (1.0 - fractions[0]) if offset_x == 0 else fractions[0]
        index_x = (index_axes[0] + offset_x) % source_grid.shape[0]
        for offset_y in (0, 1):
            weight_y = (1.0 - fractions[1]) if offset_y == 0 else fractions[1]
            index_y = (index_axes[1] + offset_y) % source_grid.shape[1]
            for offset_z in (0, 1):
                weight_z = (1.0 - fractions[2]) if offset_z == 0 else fractions[2]
                index_z = (index_axes[2] + offset_z) % source_grid.shape[2]
                weight = (
                    weight_x * weight_y * weight_z
                )[(...,) + trailing]
                result += field[index_x, index_y, index_z] * weight
    return result


def _sample_periodic_state(source: BSSNState3D, target_grid: Grid3D) -> BSSNState3D:
    fields = {
        name: _sample_periodic_field(getattr(source, name), source.grid, target_grid)
        for name in _STATE_FIELDS
    }
    sampled = BSSNState3D(
        grid=target_grid,
        chi=fields["chi"],
        h=fields["h"],
        trace_k=fields["trace_k"],
        a=fields["a"],
        theta=fields["theta"],
        conformal_gamma=fields["conformal_gamma"],
        lapse=fields["lapse"],
        shift=fields["shift"],
        b=fields["b"],
        valid_mask=np.ones(target_grid.shape, dtype=bool),
        formulation=source.formulation,
        metadata={
            "amr_patch_transfer": "periodic-node-trilinear-ghost-sample",
            "amr_parent_shape": ",".join(str(point) for point in source.grid.shape),
        },
    )
    return project_algebraic_constraints_3d(sampled)


def _patch_grid(
    source_grid: Grid3D,
    patch_lower: tuple[int, int, int],
    patch_upper: tuple[int, int, int],
    refinement_ratio: int,
    ghost_cells: int,
) -> Grid3D:
    interior = tuple(
        (upper - lower) * refinement_ratio
        for lower, upper in zip(patch_lower, patch_upper)
    )
    shape = tuple(points + 2 * ghost_cells for points in interior)
    fine_spacing = tuple(spacing / refinement_ratio for spacing in source_grid.spacing)
    lower = tuple(
        source_grid.lower[axis]
        + patch_lower[axis] * source_grid.spacing[axis]
        - ghost_cells * fine_spacing[axis]
        for axis in range(3)
    )
    upper = tuple(
        lower[axis] + (shape[axis] - 1) * fine_spacing[axis]
        for axis in range(3)
    )
    return Grid3D(
        shape,
        lower,
        upper,
        boundary="sommerfeld",
        spatial_order=2,
    )


def _interior_slices(
    patch_grid: Grid3D,
    patch_lower: tuple[int, int, int],
    patch_upper: tuple[int, int, int],
    refinement_ratio: int,
    ghost_cells: int,
) -> tuple[slice, slice, slice]:
    expected = tuple(
        (upper - lower) * refinement_ratio
        for lower, upper in zip(patch_lower, patch_upper)
    )
    actual = tuple(points - 2 * ghost_cells for points in patch_grid.shape)
    if expected != actual:
        raise ValueError("patch grid shape does not match patch bounds")
    return tuple(
        slice(ghost_cells, ghost_cells + points)
        for points in expected
    )  # type: ignore[return-value]


def _refresh_patch_ghosts(
    patch: BSSNState3D,
    coarse: BSSNState3D,
    ghost_mask: np.ndarray,
) -> BSSNState3D:
    sampled = _sample_periodic_state(coarse, patch.grid)
    fields: dict[str, np.ndarray] = {}
    for name in _STATE_FIELDS:
        value = np.asarray(getattr(patch, name), dtype=np.float64).copy()
        value[ghost_mask] = np.asarray(getattr(sampled, name))[ghost_mask]
        fields[name] = value
    metadata = dict(patch.metadata)
    metadata.update({
        "amr_patch_ghost_fill": "periodic-node-trilinear",
        "amr_patch_outer_boundary": "sommerfeld-scalar-proxy",
    })
    return BSSNState3D(
        grid=patch.grid,
        chi=fields["chi"],
        h=fields["h"],
        trace_k=fields["trace_k"],
        a=fields["a"],
        theta=fields["theta"],
        conformal_gamma=fields["conformal_gamma"],
        lapse=fields["lapse"],
        shift=fields["shift"],
        b=fields["b"],
        valid_mask=np.ones(patch.grid.shape, dtype=bool),
        formulation=patch.formulation,
        metadata=metadata,
    )


def _advance_one(state: BSSNState3D, dt: float, *, gauge: GaugeConfig, ccz4: CCZ4Config) -> BSSNState3D:
    if state.formulation == "ccz4":
        return advance_ccz4_rk4_3d(
            state,
            dt,
            steps=1,
            ccz4=ccz4,
            gauge=gauge,
            project_algebraic=True,
        )
    return advance_bssn_rk4_3d(
        state,
        dt,
        steps=1,
        gauge=gauge,
        project_algebraic=True,
    )


def _extract_coarse_aligned_patch(
    fine_patch: BSSNState3D,
    patch_lower: tuple[int, int, int],
    patch_upper: tuple[int, int, int],
    refinement_ratio: int,
    ghost_cells: int,
) -> tuple[np.ndarray, ...]:
    interior = _interior_slices(
        fine_patch.grid,
        patch_lower,
        patch_upper,
        refinement_ratio,
        ghost_cells,
    )
    indices = tuple(
        np.arange(section.start, section.stop, refinement_ratio)
        for section in interior
    )
    return tuple(
        np.asarray(getattr(fine_patch, name))[np.ix_(*indices)]
        for name in _STATE_FIELDS
    )


def _state_sha256(
    coarse: BSSNState3D,
    fine_patch: BSSNState3D,
    *,
    refinement_ratio: int,
    coarse_steps: int,
    coarse_dt: float,
    patch_lower: tuple[int, int, int],
    patch_upper: tuple[int, int, int],
    ghost_cells: int,
) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-local-patch-amr-v1\0")
    digest.update(
        (
            f"ratio={refinement_ratio};steps={coarse_steps};dt={coarse_dt:.17g};"
            f"lower={patch_lower};upper={patch_upper};ghost={ghost_cells}\0"
        ).encode()
    )
    for label, state in (("coarse", coarse), ("fine-patch", fine_patch)):
        digest.update(label.encode())
        digest.update(b"\0")
        for name, field in zip(_STATE_FIELDS, _state_arrays(state)):
            array = np.ascontiguousarray(field)
            digest.update(name.encode())
            digest.update(repr(array.shape).encode())
            digest.update(array.tobytes(order="C"))
    return digest.hexdigest()


def advance_local_patch_periodic_amr(
    state: BSSNState3D,
    dt: float,
    *,
    patch_lower: Sequence[int],
    patch_upper: Sequence[int],
    coarse_steps: int = 1,
    refinement_ratio: int = 2,
    ghost_cells: int = 2,
    gauge: GaugeConfig = GaugeConfig(),
    ccz4: CCZ4Config = CCZ4Config(),
) -> LocalAMRPatchReport3D:
    """Advance a bounded fine patch with deterministic coarse ghost refreshes.

    ``patch_lower``/``patch_upper`` are half-open coarse-grid node indices.
    The current patch RHS is intentionally the existing Sommerfeld scalar
    proxy; no conservative flux is invented for the non-flux-form BSSN/CCZ4
    equations, so ``reflux_applied`` and ``physical_amr_validated`` remain
    false by construction.
    """

    if state.grid.boundary != "periodic" or not np.all(state.valid_mask):
        raise ValueError("local patch AMR requires a fully valid periodic coarse state")
    if len(patch_lower) != 3 or len(patch_upper) != 3:
        raise ValueError("patch bounds must contain three indices")
    lower = tuple(int(value) for value in patch_lower)
    upper = tuple(int(value) for value in patch_upper)
    if any(value != original for value, original in zip(lower, patch_lower)):
        raise ValueError("patch bounds must be integer-valued")
    if any(value != original for value, original in zip(upper, patch_upper)):
        raise ValueError("patch bounds must be integer-valued")
    if any(value < 0 for value in lower) or any(
        hi > limit for hi, limit in zip(upper, state.grid.shape)
    ) or any(hi <= lo for lo, hi in zip(lower, upper)):
        raise ValueError("patch bounds must be a non-empty in-domain half-open box")
    if any(hi - lo < 2 for lo, hi in zip(lower, upper)):
        raise ValueError("each patch axis must contain at least two coarse nodes")
    if not isinstance(refinement_ratio, int) or refinement_ratio < 2:
        raise ValueError("refinement_ratio must be an integer of at least two")
    if not isinstance(coarse_steps, int) or coarse_steps < 1:
        raise ValueError("coarse_steps must be a positive integer")
    if not isinstance(ghost_cells, int) or ghost_cells < 2:
        raise ValueError("ghost_cells must be an integer of at least two")
    coarse_dt = float(dt)
    if not math.isfinite(coarse_dt) or coarse_dt <= 0.0:
        raise ValueError("dt must be finite and positive")

    patch_grid = _patch_grid(state.grid, lower, upper, refinement_ratio, ghost_cells)
    interior = _interior_slices(patch_grid, lower, upper, refinement_ratio, ghost_cells)
    ghost_mask = np.ones(patch_grid.shape, dtype=bool)
    ghost_mask[interior] = False
    patch = _sample_periodic_state(state, patch_grid)
    predictor = state
    coarse_work = state
    fine_dt = coarse_dt / refinement_ratio
    predictor_l2 = 0.0
    predictor_l_inf = 0.0
    ghost_refreshes = 0
    for _ in range(coarse_steps):
        coarse_endpoint = _advance_one(
            coarse_work,
            coarse_dt,
            gauge=gauge,
            ccz4=ccz4,
        )
        predictor = coarse_work
        for _ in range(refinement_ratio):
            predictor = _advance_one(
                predictor,
                fine_dt,
                gauge=gauge,
                ccz4=ccz4,
            )
            patch = _refresh_patch_ghosts(patch, predictor, ghost_mask)
            ghost_refreshes += 1
            patch = _advance_one(
                patch,
                fine_dt,
                gauge=gauge,
                ccz4=ccz4,
            )
            patch = _refresh_patch_ghosts(patch, predictor, ghost_mask)
            ghost_refreshes += 1
        predictor_l2, predictor_l_inf = _difference_norms(
            _state_arrays(coarse_endpoint),
            _state_arrays(predictor),
        )
        coarse_work = coarse_endpoint

    # Synchronize the shell at the common coarse endpoint.  The predictor is
    # intentionally retained only for intermediate substep ghost data; the
    # final shell must be sourced from the endpoint used for diagnostics.
    patch = _refresh_patch_ghosts(patch, coarse_work, ghost_mask)
    ghost_refreshes += 1

    aligned_fine = _extract_coarse_aligned_patch(
        patch,
        lower,
        upper,
        refinement_ratio,
        ghost_cells,
    )
    coarse_views = tuple(
        np.asarray(getattr(coarse_work, name))[
            np.ix_(*[np.arange(lo, hi) for lo, hi in zip(lower, upper)])
        ]
        for name in _STATE_FIELDS
    )
    coarse_fine_l2, coarse_fine_l_inf = _difference_norms(coarse_views, aligned_fine)
    expected_ghost = _sample_periodic_state(coarse_work, patch_grid)
    ghost_differences = [
        np.asarray(getattr(patch, name))[ghost_mask]
        - np.asarray(getattr(expected_ghost, name))[ghost_mask]
        for name in _STATE_FIELDS
    ]
    ghost_consistent = bool(
        all(np.all(np.isfinite(difference)) for difference in ghost_differences)
        and all(np.array_equal(difference, np.zeros_like(difference)) for difference in ghost_differences)
    )
    finite = all(np.all(np.isfinite(field)) for field in _state_arrays(coarse_work) + _state_arrays(patch))
    metadata = dict(patch.metadata)
    metadata.update({
        "amr_patch_synchronization": "local-node-ghost-refresh-injection-only",
        "amr_patch_reflux": "false",
        "amr_patch_physical_validation": "false",
        "amr_patch_ghost_refreshes": str(ghost_refreshes),
    })
    patch.metadata = metadata
    return LocalAMRPatchReport3D(
        formulation=state.formulation,
        refinement_ratio=refinement_ratio,
        coarse_steps=coarse_steps,
        fine_steps=coarse_steps * refinement_ratio,
        coarse_dt=coarse_dt,
        fine_dt=fine_dt,
        patch_lower=lower,
        patch_upper=upper,
        ghost_cells=ghost_cells,
        ghost_refreshes=ghost_refreshes,
        finite_state=finite,
        ghost_consistent=ghost_consistent,
        coarse_fine_l2=coarse_fine_l2,
        coarse_fine_l_inf=coarse_fine_l_inf,
        predictor_endpoint_l2=predictor_l2,
        predictor_endpoint_l_inf=predictor_l_inf,
        synchronization="local-node-ghost-refresh-injection-only",
        boundary_operator="sommerfeld-scalar-proxy-on-patch-shell",
        reflux_applied=False,
        physical_amr_validated=False,
        coarse_state=coarse_work,
        fine_patch_state=patch,
        state_sha256=_state_sha256(
            coarse_work,
            patch,
            refinement_ratio=refinement_ratio,
            coarse_steps=coarse_steps,
            coarse_dt=coarse_dt,
            patch_lower=lower,
            patch_upper=upper,
            ghost_cells=ghost_cells,
        ),
    )


__all__ = ["LocalAMRPatchReport3D", "advance_local_patch_periodic_amr"]
