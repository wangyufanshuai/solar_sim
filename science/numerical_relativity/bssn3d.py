"""NR-K3b vacuum 3-D BSSNOK method-of-lines reference.

This is a CPU/reference implementation for periodic and explicitly bounded
Cartesian validation states.  It keeps the full tensor structure and evolved
conformal connection functions, but deliberately rejects excision/masked
cells.  Its Sommerfeld option is only a scalar outer-face proxy, not a
characteristic Einstein boundary.  It is not yet the AMR or production
binary-black-hole backend.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .boundary3d import apply_characteristic_penalty_rhs_3d
from .ccz4_reference import GaugeConfig
from .nr3d import (
    Array,
    BSSNState3D,
    apply_sommerfeld_boundary_rhs,
    project_algebraic_constraints_3d,
)


def _require_evolution_domain(state: BSSNState3D) -> None:
    if state.grid.boundary not in ("periodic", "sommerfeld"):
        raise ValueError(
            "NR-K3b reference RHS requires periodic or explicit Sommerfeld boundaries"
        )
    if not np.all(state.valid_mask):
        raise ValueError("NR-K3b reference RHS does not evolve excised or masked cells")


def _d1(values: Array, state: BSSNState3D, axis: int) -> Array:
    if state.grid.boundary == "schwarzschild-dirichlet":
        from .fo_ccz4_schwarzschild import closed_derivative
        return closed_derivative(values, state.grid, axis)
    spacing = state.grid.spacing[axis]
    if state.grid.boundary != "periodic":
        if state.grid.spatial_order != 2:
            raise ValueError("fourth-order derivatives require periodic boundaries")
        return np.gradient(values, spacing, axis=axis, edge_order=2)
    if state.grid.spatial_order == 4:
        # Difference symmetric pairs first: constants and exactly invariant
        # transverse directions must have zero derivative even in floating point.
        return (
            8.0 * (np.roll(values, -1, axis=axis) - np.roll(values, 1, axis=axis))
            - (np.roll(values, -2, axis=axis) - np.roll(values, 2, axis=axis))
        ) / (12.0 * spacing)
    return (np.roll(values, -1, axis=axis) - np.roll(values, 1, axis=axis)) / (2.0 * spacing)


def _d2(values: Array, state: BSSNState3D, axis: int) -> Array:
    spacing = state.grid.spacing[axis]
    if state.grid.boundary != "periodic":
        if state.grid.spatial_order != 2:
            raise ValueError("fourth-order derivatives require periodic boundaries")
        return np.gradient(
            np.gradient(values, spacing, axis=axis, edge_order=2),
            spacing,
            axis=axis,
            edge_order=2,
        )
    if state.grid.spatial_order == 4:
        return (
            -np.roll(values, 2, axis=axis)
            + 16.0 * np.roll(values, 1, axis=axis)
            - 30.0 * values
            + 16.0 * np.roll(values, -1, axis=axis)
            - np.roll(values, -2, axis=axis)
        ) / (12.0 * spacing * spacing)
    return (
        np.roll(values, -1, axis=axis) - 2.0 * values + np.roll(values, 1, axis=axis)
    ) / (spacing * spacing)


def _second_partials(values: Array, state: BSSNState3D) -> list[list[Array]]:
    """Return second partials with the direct centered stencil on the diagonal."""

    return [
        [
            _d2(values, state, first)
            if first == second
            else _d1(_d1(values, state, first), state, second)
            for second in range(3)
        ]
        for first in range(3)
    ]


def _christoffel(metric: Array, inverse: Array, state: BSSNState3D) -> Array:
    derivatives = [_d1(metric, state, axis) for axis in range(3)]
    result = np.zeros((*state.grid.shape, 3, 3, 3), dtype=np.float64)
    for upper in range(3):
        for first in range(3):
            for second in range(3):
                value = np.zeros(state.grid.shape, dtype=np.float64)
                for ell in range(3):
                    value += inverse[..., upper, ell] * (
                        derivatives[first][..., ell, second]
                        + derivatives[second][..., ell, first]
                        - derivatives[ell][..., first, second]
                    )
                result[..., upper, first, second] = 0.5 * value
    return result


def _hessian(scalar: Array, metric: Array, inverse: Array, state: BSSNState3D) -> Array:
    gradient = [_d1(scalar, state, axis) for axis in range(3)]
    second = _second_partials(scalar, state)
    christoffel = _christoffel(metric, inverse, state)
    result = np.zeros((*state.grid.shape, 3, 3), dtype=np.float64)
    for first in range(3):
        for second_axis in range(3):
            value = second[first][second_axis].copy()
            for upper in range(3):
                value -= christoffel[..., upper, first, second_axis] * gradient[upper]
            result[..., first, second_axis] = value
    return result


def _conformal_ricci(state: BSSNState3D, inverse: Array, christoffel: Array) -> Array:
    d_metric = [_d1(state.h, state, axis) for axis in range(3)]
    d_gamma = [_d1(state.conformal_gamma, state, axis) for axis in range(3)]
    d2_metric = _second_partials(state.h, state)
    # This is the same all-lower/raised-third-index arrangement audited in
    # the 1-D reference.  Treating these terms as a simple permutation of
    # Gamma^i_jk gives a plausible-looking but non-convergent Ricci tensor for
    # nontrivial conformal metrics.
    christoffel_lower = np.einsum("...al,...lbc->...abc", state.h, christoffel)
    christoffel_llu = np.einsum("...lm,...jkm->...ljk", inverse, christoffel_lower)
    result = np.zeros((*state.grid.shape, 3, 3), dtype=np.float64)
    for first in range(3):
        for second in range(3):
            value = np.zeros(state.grid.shape, dtype=np.float64)
            for k in range(3):
                derivative_gamma_second = d_gamma[second][..., k]
                derivative_gamma_first = d_gamma[first][..., k]
                derivative_metric = d_metric[k][..., first, second]
                value += 0.5 * (
                    state.h[..., k, first] * derivative_gamma_second
                    + state.h[..., k, second] * derivative_gamma_first
                    + state.conformal_gamma[..., k] * derivative_metric
                )
                for ell in range(3):
                    value -= 0.5 * inverse[..., k, ell] * d2_metric[k][ell][..., first, second]
                    value += (
                        christoffel[..., k, ell, first] * christoffel_llu[..., ell, second, k]
                        + christoffel[..., k, ell, second] * christoffel_llu[..., ell, first, k]
                        + christoffel[..., k, first, ell] * christoffel_llu[..., ell, k, second]
                    )
            result[..., first, second] = value
    return result


def _physical_ricci(state: BSSNState3D, inverse: Array) -> Array:
    conformal_christoffel = _christoffel(state.h, inverse, state)
    conformal_ricci = _conformal_ricci(state, inverse, conformal_christoffel)
    gradient = np.stack([_d1(state.chi, state, axis) for axis in range(3)], axis=-1)
    hessian = _hessian(state.chi, state.h, inverse, state)
    laplace = np.einsum("...ij,...ij->...", inverse, hessian)
    gradient_square = np.einsum("...i,...ij,...j->...", gradient, inverse, gradient)
    correction = (hessian + state.h * laplace[..., None, None]) / (2.0 * state.chi[..., None, None])
    correction -= (
        gradient[..., :, None] * gradient[..., None, :]
        + 3.0 * state.h * gradient_square[..., None, None]
    ) / (4.0 * state.chi[..., None, None] ** 2)
    return conformal_ricci + correction


@dataclass(frozen=True)
class BSSNRHS3D:
    chi: Array
    h: Array
    trace_k: Array
    a: Array
    theta: Array
    conformal_gamma: Array
    lapse: Array
    shift: Array
    b: Array


def bssn_rhs_3d(
    state: BSSNState3D,
    gauge: GaugeConfig = GaugeConfig(),
    *,
    sommerfeld_speed: float = 1.0,
    boundary_mode: str = "sommerfeld",
) -> BSSNRHS3D:
    """Evaluate the vacuum BSSNOK RHS on a periodic/Sommerfeld grid.

    ``boundary_mode='characteristic-proxy'`` selects the explicit K3
    speed-census/penalty shadow; it is not a production characteristic
    boundary.
    """

    if state.formulation != "bssnok" or np.any(state.theta != 0.0):
        raise ValueError("BSSNOK requires formulation='bssnok' and Theta=0; use CCZ4 otherwise")
    _require_evolution_domain(state)
    inverse = np.linalg.inv(state.h)
    physical_inverse = state.chi[..., None, None] * inverse
    physical_metric = state.h / state.chi[..., None, None]
    physical_ricci = _physical_ricci(state, inverse)
    lapse_hessian = _hessian(state.lapse, physical_metric, physical_inverse, state)
    lapse_laplacian = np.einsum("...ij,...ij->...", physical_inverse, lapse_hessian)

    d_chi = [_d1(state.chi, state, axis) for axis in range(3)]
    d_lapse = [_d1(state.lapse, state, axis) for axis in range(3)]
    d_trace_k = [_d1(state.trace_k, state, axis) for axis in range(3)]
    d_shift = [_d1(state.shift, state, axis) for axis in range(3)]
    d_a = [_d1(state.a, state, axis) for axis in range(3)]
    d_h = [_d1(state.h, state, axis) for axis in range(3)]
    d_gamma = [_d1(state.conformal_gamma, state, axis) for axis in range(3)]
    d_b = [_d1(state.b, state, axis) for axis in range(3)]
    d2_shift = _second_partials(state.shift, state)
    div_shift = sum(d_shift[axis][..., axis] for axis in range(3))
    beta = state.shift

    a_up_one = np.einsum("...ik,...kj->...ij", inverse, state.a)
    a_upup = np.einsum("...ia,...ab->...ib", a_up_one, inverse)
    a_squared = np.einsum("...ij,...ij->...", state.a, a_upup)
    a_square_lower = np.einsum("...ik,...kj->...ij", state.a, a_up_one)
    conformal_christoffel = _christoffel(state.h, inverse, state)

    rhs_chi = (2.0 / 3.0) * state.chi * (state.lapse * state.trace_k - div_shift)
    rhs_chi += sum(beta[..., axis] * d_chi[axis] for axis in range(3))

    rhs_h = -2.0 * state.lapse[..., None, None] * state.a
    rhs_h += sum(beta[..., axis, None, None] * d_h[axis] for axis in range(3))
    for first in range(3):
        for second in range(3):
            lie = np.zeros(state.grid.shape, dtype=np.float64)
            for component in range(3):
                lie += (
                    state.h[..., component, first] * d_shift[second][..., component]
                    + state.h[..., component, second] * d_shift[first][..., component]
                )
            rhs_h[..., first, second] += lie - (2.0 / 3.0) * state.h[..., first, second] * div_shift

    rhs_trace_k = -lapse_laplacian + state.lapse * (
        a_squared + state.trace_k * state.trace_k / 3.0
    ) + sum(beta[..., axis] * d_trace_k[axis] for axis in range(3))

    source_a = state.chi[..., None, None] * (
        -lapse_hessian + state.lapse[..., None, None] * physical_ricci
    )
    source_trace = np.einsum("...ij,...ij->...", inverse, source_a)
    rhs_a = source_a - state.h * source_trace[..., None, None] / 3.0
    rhs_a += state.lapse[..., None, None] * (
        state.trace_k[..., None, None] * state.a - 2.0 * a_square_lower
    )
    rhs_a += sum(beta[..., axis, None, None] * d_a[axis] for axis in range(3))
    for first in range(3):
        for second in range(3):
            lie = np.zeros(state.grid.shape, dtype=np.float64)
            for component in range(3):
                lie += (
                    state.a[..., component, first] * d_shift[second][..., component]
                    + state.a[..., component, second] * d_shift[first][..., component]
                )
            rhs_a[..., first, second] += lie - (2.0 / 3.0) * state.a[..., first, second] * div_shift

    connection_a = np.einsum("...kij,...ij->...k", conformal_christoffel, a_upup)
    grad_phi = [-0.25 * d_chi[axis] / state.chi for axis in range(3)]
    rhs_gamma = -2.0 * np.einsum("...ij,...j->...i", a_upup, np.stack(d_lapse, axis=-1))
    rhs_gamma += 2.0 * state.lapse[..., None] * (
        connection_a
        - (2.0 / 3.0) * np.einsum("...ij,...j->...i", inverse, np.stack(d_trace_k, axis=-1))
        + 6.0 * np.einsum("...ij,...j->...i", a_upup, np.stack(grad_phi, axis=-1))
    )
    rhs_gamma += sum(beta[..., axis, None] * d_gamma[axis] for axis in range(3))
    rhs_gamma -= np.einsum(
        "...j,...ji->...i", state.conformal_gamma, np.stack(d_shift, axis=-2)
    )
    rhs_gamma += (2.0 / 3.0) * state.conformal_gamma * div_shift[..., None]
    for component in range(3):
        rhs_gamma[..., component] += sum(
            inverse[..., first, second] * d2_shift[first][second][..., component]
            for first in range(3) for second in range(3)
        )
        rhs_gamma[..., component] += (1.0 / 3.0) * sum(
            inverse[..., component, first] * d2_shift[first][second][..., second]
            for first in range(3) for second in range(3)
        )

    rhs_lapse = -gauge.lapse_coefficient * state.lapse * state.trace_k
    rhs_shift = gauge.shift_coefficient * state.b
    rhs_b = rhs_gamma - gauge.shift_damping * state.b
    if gauge.advective:
        rhs_lapse += sum(beta[..., axis] * d_lapse[axis] for axis in range(3))
        rhs_shift += sum(beta[..., axis, None] * d_shift[axis] for axis in range(3))
        rhs_b += sum(beta[..., axis, None] * (d_b[axis] - d_gamma[axis]) for axis in range(3))
    rhs = BSSNRHS3D(
        chi=rhs_chi,
        h=rhs_h,
        trace_k=rhs_trace_k,
        a=rhs_a,
        theta=np.zeros_like(state.theta),
        conformal_gamma=rhs_gamma,
        lapse=rhs_lapse,
        shift=rhs_shift,
        b=rhs_b,
    )
    if state.grid.boundary == "sommerfeld":
        if boundary_mode == "sommerfeld":
            return apply_sommerfeld_boundary_rhs(
                state,
                rhs,
                wave_speed=sommerfeld_speed,
            )
        if boundary_mode == "characteristic-proxy":
            return apply_characteristic_penalty_rhs_3d(state, rhs, gauge=gauge)
        raise ValueError(f"unsupported Sommerfeld boundary mode: {boundary_mode}")
    if boundary_mode != "sommerfeld":
        raise ValueError("characteristic boundary modes require a Sommerfeld grid")
    return rhs


def _state_add(state: BSSNState3D, rhs: BSSNRHS3D, scale: float) -> BSSNState3D:
    return BSSNState3D(
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
        metadata=state.metadata,
    )


def advance_bssn_rk4_3d(
    state: BSSNState3D,
    dt: float,
    *,
    steps: int = 1,
    gauge: GaugeConfig = GaugeConfig(),
    project_algebraic: bool = False,
    sommerfeld_speed: float = 1.0,
    boundary_mode: str = "sommerfeld",
) -> BSSNState3D:
    """Advance the periodic 3-D BSSN reference with classical RK4.

    When requested, the algebraic determinant/trace constraints are projected
    after every RK stage.  Differential constraints are never silently
    projected by this option.
    """

    if not np.isfinite(dt) or dt <= 0.0 or not isinstance(steps, int) or steps < 1:
        raise ValueError("dt must be finite and positive and steps must be positive")
    working = state
    for _ in range(steps):
        k1 = bssn_rhs_3d(
            working,
            gauge,
            sommerfeld_speed=sommerfeld_speed,
            boundary_mode=boundary_mode,
        )
        stage2 = _state_add(working, k1, 0.5 * dt)
        if project_algebraic:
            stage2 = project_algebraic_constraints_3d(stage2)
        k2 = bssn_rhs_3d(
            stage2,
            gauge,
            sommerfeld_speed=sommerfeld_speed,
            boundary_mode=boundary_mode,
        )
        stage3 = _state_add(working, k2, 0.5 * dt)
        if project_algebraic:
            stage3 = project_algebraic_constraints_3d(stage3)
        k3 = bssn_rhs_3d(
            stage3,
            gauge,
            sommerfeld_speed=sommerfeld_speed,
            boundary_mode=boundary_mode,
        )
        stage4 = _state_add(working, k3, dt)
        if project_algebraic:
            stage4 = project_algebraic_constraints_3d(stage4)
        k4 = bssn_rhs_3d(
            stage4,
            gauge,
            sommerfeld_speed=sommerfeld_speed,
            boundary_mode=boundary_mode,
        )
        working = _state_add(working, BSSNRHS3D(
            chi=(k1.chi + 2.0 * k2.chi + 2.0 * k3.chi + k4.chi),
            h=(k1.h + 2.0 * k2.h + 2.0 * k3.h + k4.h),
            trace_k=(k1.trace_k + 2.0 * k2.trace_k + 2.0 * k3.trace_k + k4.trace_k),
            a=(k1.a + 2.0 * k2.a + 2.0 * k3.a + k4.a),
            theta=(k1.theta + 2.0 * k2.theta + 2.0 * k3.theta + k4.theta),
            conformal_gamma=(k1.conformal_gamma + 2.0 * k2.conformal_gamma + 2.0 * k3.conformal_gamma + k4.conformal_gamma),
            lapse=(k1.lapse + 2.0 * k2.lapse + 2.0 * k3.lapse + k4.lapse),
            shift=(k1.shift + 2.0 * k2.shift + 2.0 * k3.shift + k4.shift),
            b=(k1.b + 2.0 * k2.b + 2.0 * k3.b + k4.b),
        ), dt / 6.0)
        if project_algebraic:
            working = project_algebraic_constraints_3d(working)
    return working
