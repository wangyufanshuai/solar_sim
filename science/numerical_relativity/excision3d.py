"""NR-K3 excision shadow evolution with explicit ghost-fill provenance.

The production-quality route requires a causal excision boundary and
constraint-compatible outer boundary.  This module intentionally supplies a
smaller, fail-closed diagnostic contract: invalid cells are filled from the
nearest valid cell with a deterministic zero-gradient copy, the fully filled
state is advanced with the existing Sommerfeld-proxy reference RHS, and the
original mask is restored after every coarse step.  The result is useful for
state-machine and determinism tests only; ``physical_excision_validated`` is
always false.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
import hashlib
import math
from typing import Any, Literal, Mapping

import numpy as np

from .boundary3d import (
    apply_inner_characteristic_penalty_rhs_3d,
    inner_characteristic_speed_report_3d,
)
from .bssn3d import advance_bssn_rk4_3d, bssn_rhs_3d
from .ccz4_3d import advance_ccz4_rk4_3d, ccz4_rhs_3d
from .ccz4_reference import GaugeConfig
from .ccz4_rhs import CCZ4Config
from .constraints3d import constraint_report_3d
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
class ExcisionCausalityReport3D:
    """Inner-face characteristic-speed audit for a masked 3-D state.

    The normal points from an excised cell into the valid exterior.  Speeds
    are the declared coordinate-speed proxy ``beta^n +/- alpha*sqrt(gamma^nn)``
    evaluated on the valid side of every valid-to-masked face.  This is not a
    full CCZ4 characteristic decomposition and therefore never validates a
    physical excision boundary.
    """

    face_count: int
    min_minus_speed: float
    max_minus_speed: float
    min_plus_speed: float
    max_plus_speed: float
    pure_outflow_fraction: float
    inflow_fraction: float
    max_outgoing_speed: float
    tolerance: float
    normal_convention: str
    method: str
    pure_outflow: bool
    physical_boundary_validated: bool


@dataclass(frozen=True)
class ExcisionShadowReport3D:
    """Auditable result of a masked-state shadow evolution."""

    formulation: Formulation3D
    coarse_steps: int
    dt: float
    ghost_fill: str
    outer_boundary: str
    valid_mask_preserved: bool
    finite_state: bool
    physical_excision_validated: bool
    max_ghost_distance: int
    causality_report: ExcisionCausalityReport3D
    constraint_history: tuple[Mapping[str, float], ...]
    state: BSSNState3D
    state_sha256: str


def _nearest_valid_sources(valid_mask: np.ndarray) -> tuple[np.ndarray, int]:
    """Return deterministic nearest-valid flat indices and max graph distance."""

    mask = np.asarray(valid_mask, dtype=bool)
    if mask.ndim != 3 or not np.any(mask) or np.all(mask):
        raise ValueError("excision shadow requires both valid and invalid cells")
    shape = mask.shape
    total = int(mask.size)
    source = np.full(total, -1, dtype=np.int64)
    distance = np.full(total, -1, dtype=np.int64)
    queue: deque[int] = deque()
    for flat_index in np.flatnonzero(mask):
        integer_index = int(flat_index)
        source[integer_index] = integer_index
        distance[integer_index] = 0
        queue.append(integer_index)
    directions = (
        (-1, 0, 0),
        (1, 0, 0),
        (0, -1, 0),
        (0, 1, 0),
        (0, 0, -1),
        (0, 0, 1),
    )
    while queue:
        current = queue.popleft()
        x, y, z = np.unravel_index(current, shape)
        for dx, dy, dz in directions:
            neighbor = (x + dx, y + dy, z + dz)
            if any(index < 0 or index >= limit for index, limit in zip(neighbor, shape)):
                continue
            neighbor_flat = int(np.ravel_multi_index(neighbor, shape))
            if source[neighbor_flat] >= 0:
                continue
            source[neighbor_flat] = source[current]
            distance[neighbor_flat] = distance[current] + 1
            queue.append(neighbor_flat)
    if np.any(source < 0):
        raise ValueError("invalid excision cells are disconnected from valid cells")
    return source.reshape(shape), int(np.max(distance))


def _filled_state(state: BSSNState3D) -> tuple[BSSNState3D, int]:
    source, max_distance = _nearest_valid_sources(state.valid_mask)
    source_flat = source.reshape(-1)
    filled: dict[str, np.ndarray] = {}
    for name in _STATE_FIELDS:
        field = np.asarray(getattr(state, name))
        flat = field.reshape(field.shape[0] * field.shape[1] * field.shape[2], -1)
        filled[name] = flat[source_flat].reshape(field.shape).copy()
    ghost_grid = Grid3D(
        state.grid.shape,
        state.grid.lower,
        state.grid.upper,
        boundary="sommerfeld",
        spatial_order=state.grid.spatial_order,
    )
    metadata = dict(state.metadata)
    metadata.update(
        {
            "excision_ghost_fill": "nearest-valid-zero-gradient",
            "excision_ghost_max_distance": str(max_distance),
            "excision_outer_boundary": "sommerfeld-scalar-proxy",
        }
    )
    return (
        BSSNState3D(
            grid=ghost_grid,
            chi=filled["chi"],
            h=filled["h"],
            trace_k=filled["trace_k"],
            a=filled["a"],
            theta=filled["theta"],
            conformal_gamma=filled["conformal_gamma"],
            lapse=filled["lapse"],
            shift=filled["shift"],
            b=filled["b"],
            valid_mask=np.ones(state.grid.shape, dtype=bool),
            formulation=state.formulation,
            metadata=metadata,
        ),
        max_distance,
    )


def _restore_mask(
    evolved: BSSNState3D,
    template: BSSNState3D,
) -> BSSNState3D:
    fields: dict[str, np.ndarray] = {}
    invalid = ~template.valid_mask
    for name in _STATE_FIELDS:
        value = np.asarray(getattr(evolved, name)).copy()
        value[invalid] = np.asarray(getattr(template, name))[invalid]
        fields[name] = value
    return BSSNState3D(
        grid=template.grid,
        chi=fields["chi"],
        h=fields["h"],
        trace_k=fields["trace_k"],
        a=fields["a"],
        theta=fields["theta"],
        conformal_gamma=fields["conformal_gamma"],
        lapse=fields["lapse"],
        shift=fields["shift"],
        b=fields["b"],
        valid_mask=template.valid_mask.copy(),
        formulation=template.formulation,
        metadata=dict(evolved.metadata),
    )


def _state_sha256(
    state: BSSNState3D,
    *,
    domain_tag: bytes = b"nr-k3-excision-shadow-v1\0",
) -> str:
    digest = hashlib.sha256()
    digest.update(domain_tag)
    for name in (*_STATE_FIELDS, "valid_mask"):
        field = np.ascontiguousarray(getattr(state, name))
        digest.update(name.encode("utf-8"))
        digest.update(field.tobytes(order="C"))
    return digest.hexdigest()


def excision_causality_report_3d(
    state: BSSNState3D,
    *,
    tolerance: float = 1.0e-12,
) -> ExcisionCausalityReport3D:
    """Audit a proxy characteristic speed on every inner-boundary face.

    The audit is intentionally read-only.  For each valid cell adjacent to a
    masked cell, the unit normal points from the masked region into the valid
    exterior.  The two reported speeds use ``beta^n +/- alpha*sqrt(gamma^nn)``
    with ``gamma^ij = chi*h^ij``.  A face is classified as pure outflow when
    its larger speed is no greater than ``tolerance``; a positive larger speed
    is counted as an inflow risk under this convention.  The result is a
    diagnostic proxy, not the full CCZ4 boundary characteristic system.
    """

    if state.grid.boundary != "excision":
        raise ValueError("causality audit requires Grid3D(boundary='excision')")
    mask = np.asarray(state.valid_mask, dtype=bool)
    if np.all(mask) or not np.any(mask):
        raise ValueError("causality audit requires both valid and masked cells")
    tolerance = float(tolerance)
    if not math.isfinite(tolerance) or tolerance < 0.0:
        raise ValueError("tolerance must be finite and non-negative")

    directions = (
        (-1, 0, 0),
        (1, 0, 0),
        (0, -1, 0),
        (0, 1, 0),
        (0, 0, -1),
        (0, 0, 1),
    )
    minus_speeds: list[float] = []
    plus_speeds: list[float] = []
    shape = mask.shape
    for index in np.ndindex(shape):
        if not mask[index]:
            continue
        for delta in directions:
            neighbor = tuple(component + offset for component, offset in zip(index, delta))
            if any(component < 0 or component >= limit for component, limit in zip(neighbor, shape)):
                continue
            if mask[neighbor]:
                continue
            normal = -np.asarray(delta, dtype=np.float64)
            h_cell = np.asarray(state.h[index], dtype=np.float64)
            determinant = float(np.linalg.det(h_cell))
            if not math.isfinite(determinant) or determinant <= 0.0:
                raise ValueError("valid conformal metric must be positive-orientated")
            try:
                inverse_h = np.linalg.inv(h_cell)
            except np.linalg.LinAlgError as exc:
                raise ValueError("valid conformal metric must be invertible") from exc
            gamma_nn = float(state.chi[index] * (normal @ inverse_h @ normal))
            if not math.isfinite(gamma_nn) or gamma_nn <= 0.0:
                raise ValueError("physical inverse metric must be positive along each face normal")
            lapse = float(state.lapse[index])
            beta_n = float(np.dot(state.shift[index], normal))
            if not math.isfinite(lapse) or lapse <= 0.0 or not math.isfinite(beta_n):
                raise ValueError("valid lapse and shift must be finite with positive lapse")
            light_speed = lapse * math.sqrt(gamma_nn)
            minus_speeds.append(beta_n - light_speed)
            plus_speeds.append(beta_n + light_speed)

    if not plus_speeds:
        raise ValueError("masked cells have no valid-to-masked interface faces")
    minus = np.asarray(minus_speeds, dtype=np.float64)
    plus = np.asarray(plus_speeds, dtype=np.float64)
    outflow = plus <= tolerance
    inflow = plus > tolerance
    return ExcisionCausalityReport3D(
        face_count=int(plus.size),
        min_minus_speed=float(np.min(minus)),
        max_minus_speed=float(np.max(minus)),
        min_plus_speed=float(np.min(plus)),
        max_plus_speed=float(np.max(plus)),
        pure_outflow_fraction=float(np.mean(outflow)),
        inflow_fraction=float(np.mean(inflow)),
        max_outgoing_speed=float(np.max(np.maximum(plus, 0.0))),
        tolerance=tolerance,
        normal_convention="normal points from masked excision into valid exterior",
        method="beta_n-pm-alpha-sqrt-gamma_nn-inner-face-proxy",
        pure_outflow=bool(np.all(outflow)),
        physical_boundary_validated=False,
    )


def advance_excision_shadow_3d(
    state: BSSNState3D,
    dt: float,
    *,
    steps: int = 1,
    gauge: GaugeConfig = GaugeConfig(),
    ccz4: CCZ4Config = CCZ4Config(),
    project_algebraic: bool = True,
    sommerfeld_speed: float = 1.0,
) -> ExcisionShadowReport3D:
    """Advance a masked state with deterministic nearest-valid ghost filling.

    This path is intentionally not used by the live adapter.  It preserves
    the original excision values and mask, reports the proxy policy, and
    refuses fourth-order non-periodic derivatives until a dedicated closure
    exists.
    """

    if state.grid.boundary != "excision":
        raise ValueError("excision shadow evolution requires Grid3D(boundary='excision')")
    if np.all(state.valid_mask) or not np.any(state.valid_mask):
        raise ValueError("excision shadow evolution requires both valid and masked cells")
    if state.grid.spatial_order != 2:
        raise ValueError("excision shadow evolution currently requires second-order stencils")
    if not math.isfinite(float(dt)) or float(dt) <= 0.0:
        raise ValueError("dt must be finite and positive")
    if not isinstance(steps, int) or steps < 1:
        raise ValueError("steps must be a positive integer")
    if state.formulation not in ("ccz4", "bssnok"):
        raise ValueError(f"unsupported formulation: {state.formulation}")

    causality_report = excision_causality_report_3d(state)
    working = state
    max_distance = 0
    constraint_history: list[Mapping[str, float]] = []
    for _ in range(steps):
        filled, max_distance = _filled_state(working)
        if state.formulation == "ccz4":
            evolved = advance_ccz4_rk4_3d(
                filled,
                float(dt),
                steps=1,
                ccz4=ccz4,
                gauge=gauge,
                project_algebraic=project_algebraic,
                sommerfeld_speed=sommerfeld_speed,
            )
        else:
            evolved = advance_bssn_rk4_3d(
                filled,
                float(dt),
                steps=1,
                gauge=gauge,
                project_algebraic=project_algebraic,
                sommerfeld_speed=sommerfeld_speed,
            )
        working = _restore_mask(evolved, working)
        constraint_history.append(dict(constraint_report_3d(working).norms))
    metadata = dict(working.metadata)
    metadata.update(
        {
            "excision_shadow_evolution": "nearest-valid-zero-gradient",
            "excision_physical_validation": "false",
            "excision_steps": str(steps),
            "excision_dt": f"{float(dt):.17g}",
        }
    )
    working.metadata = metadata
    finite = all(np.all(np.isfinite(getattr(working, name))) for name in _STATE_FIELDS)
    return ExcisionShadowReport3D(
        formulation=state.formulation,
        coarse_steps=steps,
        dt=float(dt),
        ghost_fill="nearest-valid-zero-gradient",
        outer_boundary="sommerfeld-scalar-proxy",
        valid_mask_preserved=bool(np.array_equal(working.valid_mask, state.valid_mask)),
        finite_state=finite,
        physical_excision_validated=False,
        max_ghost_distance=max_distance,
        causality_report=causality_report,
        constraint_history=tuple(constraint_history),
        state=working,
        state_sha256=_state_sha256(working),
    )


def _inner_shadow_state_add(
    state: BSSNState3D,
    rhs: Any,
    scale: float,
) -> BSSNState3D:
    candidate = BSSNState3D(
        grid=state.grid,
        chi=state.chi + scale * rhs.chi,
        h=state.h + scale * rhs.h,
        trace_k=state.trace_k + scale * rhs.trace_k,
        a=state.a + scale * rhs.a,
        theta=state.theta + scale * rhs.theta,
        conformal_gamma=state.conformal_gamma + scale * rhs.conformal_gamma,
        lapse=state.lapse + scale * rhs.lapse,
        shift=state.shift + scale * rhs.shift,
        b=state.b + scale * rhs.b,
        valid_mask=state.valid_mask.copy(),
        formulation=state.formulation,
        metadata=dict(state.metadata),
    )
    return _restore_mask(candidate, state)


def _inner_shadow_project(state: BSSNState3D) -> BSSNState3D:
    projected = project_algebraic_constraints_3d(state)
    return _restore_mask(projected, state)


def _inner_characteristic_shadow_rhs(
    state: BSSNState3D,
    *,
    gauge: GaugeConfig,
    ccz4: CCZ4Config,
    penalty_strength: float,
    sommerfeld_speed: float,
) -> Any:
    filled, _ = _filled_state(state)
    if state.formulation == "ccz4":
        raw = ccz4_rhs_3d(
            filled,
            ccz4=ccz4,
            gauge=gauge,
            sommerfeld_speed=sommerfeld_speed,
            boundary_mode="sommerfeld",
        )
    elif state.formulation == "bssnok":
        raw = bssn_rhs_3d(
            filled,
            gauge=gauge,
            sommerfeld_speed=sommerfeld_speed,
            boundary_mode="sommerfeld",
        )
    else:  # pragma: no cover - BSSNState3D validates this invariant.
        raise ValueError(f"unsupported formulation: {state.formulation}")
    return apply_inner_characteristic_penalty_rhs_3d(
        state,
        raw,
        gauge=gauge,
        penalty_strength=penalty_strength,
    )


def advance_excision_characteristic_shadow_3d(
    state: BSSNState3D,
    dt: float,
    *,
    steps: int = 1,
    gauge: GaugeConfig = GaugeConfig(),
    ccz4: CCZ4Config = CCZ4Config(),
    project_algebraic: bool = True,
    penalty_strength: float = 0.5,
    sommerfeld_speed: float = 1.0,
) -> ExcisionShadowReport3D:
    """Advance a masked state with an oriented inner characteristic penalty.

    Invalid cells are still filled by the deterministic nearest-valid policy,
    and the outer boundary is still the scalar Sommerfeld proxy.  The new
    part is an explicit incoming-speed penalty on valid-to-masked faces with
    one-sided valid-side targets.  It is a stronger boundary experiment than
    a bare zero-gradient fill, but it is not a full CCZ4/BSSN eigenbasis or a
    constraint-preserving excision boundary, so promotion remains blocked.
    """

    if state.grid.boundary != "excision":
        raise ValueError("characteristic excision shadow requires Grid3D(boundary='excision')")
    if np.all(state.valid_mask) or not np.any(state.valid_mask):
        raise ValueError("characteristic excision shadow requires both valid and masked cells")
    if state.grid.spatial_order != 2:
        raise ValueError("characteristic excision shadow currently requires second-order stencils")
    if not math.isfinite(float(dt)) or float(dt) <= 0.0:
        raise ValueError("dt must be finite and positive")
    if not isinstance(steps, int) or steps < 1:
        raise ValueError("steps must be a positive integer")
    if not math.isfinite(float(penalty_strength)) or float(penalty_strength) < 0.0:
        raise ValueError("penalty_strength must be finite and non-negative")

    causality_report = excision_causality_report_3d(state)
    characteristic_report = inner_characteristic_speed_report_3d(state, gauge=gauge)
    working = state
    max_distance = 0
    constraint_history: list[Mapping[str, float]] = []
    for _ in range(steps):
        k1 = _inner_characteristic_shadow_rhs(
            working,
            gauge=gauge,
            ccz4=ccz4,
            penalty_strength=penalty_strength,
            sommerfeld_speed=sommerfeld_speed,
        )
        stage2 = _inner_shadow_state_add(working, k1, 0.5 * dt)
        if project_algebraic:
            stage2 = _inner_shadow_project(stage2)
        k2 = _inner_characteristic_shadow_rhs(
            stage2,
            gauge=gauge,
            ccz4=ccz4,
            penalty_strength=penalty_strength,
            sommerfeld_speed=sommerfeld_speed,
        )
        stage3 = _inner_shadow_state_add(working, k2, 0.5 * dt)
        if project_algebraic:
            stage3 = _inner_shadow_project(stage3)
        k3 = _inner_characteristic_shadow_rhs(
            stage3,
            gauge=gauge,
            ccz4=ccz4,
            penalty_strength=penalty_strength,
            sommerfeld_speed=sommerfeld_speed,
        )
        stage4 = _inner_shadow_state_add(working, k3, dt)
        if project_algebraic:
            stage4 = _inner_shadow_project(stage4)
        k4 = _inner_characteristic_shadow_rhs(
            stage4,
            gauge=gauge,
            ccz4=ccz4,
            penalty_strength=penalty_strength,
            sommerfeld_speed=sommerfeld_speed,
        )
        combined = type(k1)(
            chi=k1.chi + 2.0 * k2.chi + 2.0 * k3.chi + k4.chi,
            h=k1.h + 2.0 * k2.h + 2.0 * k3.h + k4.h,
            trace_k=k1.trace_k + 2.0 * k2.trace_k + 2.0 * k3.trace_k + k4.trace_k,
            a=k1.a + 2.0 * k2.a + 2.0 * k3.a + k4.a,
            theta=k1.theta + 2.0 * k2.theta + 2.0 * k3.theta + k4.theta,
            conformal_gamma=(
                k1.conformal_gamma
                + 2.0 * k2.conformal_gamma
                + 2.0 * k3.conformal_gamma
                + k4.conformal_gamma
            ),
            lapse=k1.lapse + 2.0 * k2.lapse + 2.0 * k3.lapse + k4.lapse,
            shift=k1.shift + 2.0 * k2.shift + 2.0 * k3.shift + k4.shift,
            b=k1.b + 2.0 * k2.b + 2.0 * k3.b + k4.b,
        )
        working = _inner_shadow_state_add(working, combined, dt / 6.0)
        if project_algebraic:
            working = _inner_shadow_project(working)
        constraint_history.append(dict(constraint_report_3d(working).norms))
        _, max_distance = _filled_state(working)

    metadata = dict(working.metadata)
    metadata.update(
        {
            "excision_shadow_evolution": "nearest-valid-zero-gradient+inner-characteristic-penalty-proxy",
            "excision_inner_boundary_operator": "incoming-beta-n-plus-speed-one-sided-valid-target",
            "excision_characteristic_speed_method": characteristic_report.method,
            "excision_characteristic_incoming_fraction": f"{characteristic_report.incoming_fraction:.17g}",
            "excision_characteristic_constraint_incoming_fraction": (
                f"{characteristic_report.constraint_incoming_fraction:.17g}"
            ),
            "excision_physical_validation": "false",
            "excision_steps": str(steps),
            "excision_dt": f"{float(dt):.17g}",
        }
    )
    working.metadata = metadata
    finite = all(np.all(np.isfinite(getattr(working, name))) for name in _STATE_FIELDS)
    return ExcisionShadowReport3D(
        formulation=state.formulation,
        coarse_steps=steps,
        dt=float(dt),
        ghost_fill="nearest-valid-zero-gradient+inner-characteristic-penalty-proxy",
        outer_boundary="sommerfeld-scalar-proxy",
        valid_mask_preserved=bool(np.array_equal(working.valid_mask, state.valid_mask)),
        finite_state=finite,
        physical_excision_validated=False,
        max_ghost_distance=max_distance,
        causality_report=causality_report,
        constraint_history=tuple(constraint_history),
        state=working,
        state_sha256=_state_sha256(
            working,
            domain_tag=b"nr-k3-excision-characteristic-shadow-v1\0",
        ),
    )


__all__ = [
    "ExcisionCausalityReport3D",
    "ExcisionShadowReport3D",
    "advance_excision_shadow_3d",
    "advance_excision_characteristic_shadow_3d",
    "excision_causality_report_3d",
]
