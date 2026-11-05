"""NR-K3c vacuum 3-D CCZ4 reference on periodic Cartesian grids."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .boundary3d import apply_characteristic_penalty_rhs_3d
from .bssn3d import (
    _christoffel,
    _d1,
    _hessian,
    _require_evolution_domain,
    _second_partials,
)
from .ccz4_reference import GaugeConfig
from .ccz4_rhs import CCZ4Config
from .nr3d import (
    Array,
    BSSNState3D,
    apply_sommerfeld_boundary_rhs,
    project_algebraic_constraints_3d,
)


@dataclass(frozen=True)
class CCZ4RHS3D:
    chi: Array
    h: Array
    trace_k: Array
    a: Array
    theta: Array
    conformal_gamma: Array
    lapse: Array
    shift: Array
    b: Array


def _state_add(state: BSSNState3D, rhs: CCZ4RHS3D, scale: float) -> BSSNState3D:
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


def _ccz4_ricci(
    state: BSSNState3D,
    inverse: Array,
    christoffel: Array,
) -> tuple[Array, Array, Array, Array]:
    d_chi = [_d1(state.chi, state, axis) for axis in range(3)]
    gradient_chi = np.stack(d_chi, axis=-1)
    hessian_chi = _hessian(state.chi, state.h, inverse, state)
    box_chi = np.einsum("...ij,...ij->...", inverse, hessian_chi)
    gradient_square = np.einsum("...i,...ij,...j->...", gradient_chi, inverse, gradient_chi)
    contracted = np.einsum("...ij,...kij->...k", inverse, christoffel)
    z_over_chi = 0.5 * (state.conformal_gamma - contracted)
    ricci_chi = 0.5 * (
        hessian_chi
        + state.h * box_chi[..., None, None]
        - (
            gradient_chi[..., :, None] * gradient_chi[..., None, :]
            + 3.0 * state.h * gradient_square[..., None, None]
        )
        / (2.0 * state.chi[..., None, None])
    )
    z_terms = np.zeros_like(state.h)
    for first in range(3):
        for second in range(3):
            for component in range(3):
                z_terms[..., first, second] += z_over_chi[..., component] * (
                    state.h[..., first, component] * gradient_chi[..., second]
                    + state.h[..., second, component] * gradient_chi[..., first]
                    - state.h[..., first, second] * gradient_chi[..., component]
                )
    conformal_ricci = _conformal_ricci_from_evolved_gamma(state, inverse, christoffel)
    physical_ricci = (
        ricci_chi + state.chi[..., None, None] * conformal_ricci + z_terms
    ) / state.chi[..., None, None]
    scalar = state.chi * np.einsum("...ij,...ij->...", inverse, physical_ricci)
    return physical_ricci, scalar, contracted, z_over_chi


def _conformal_ricci_from_evolved_gamma(
    state: BSSNState3D,
    inverse: Array,
    christoffel: Array,
) -> Array:
    from .bssn3d import _conformal_ricci

    return _conformal_ricci(state, inverse, christoffel)


def ccz4_rhs_3d(
    state: BSSNState3D,
    *,
    ccz4: CCZ4Config = CCZ4Config(),
    gauge: GaugeConfig = GaugeConfig(theta_coupling=2.0),
    sommerfeld_speed: float = 1.0,
    boundary_mode: str = "sommerfeld",
) -> CCZ4RHS3D:
    """Evaluate vacuum CCZ4 on a periodic/Sommerfeld, fully valid grid.

    ``boundary_mode='characteristic-proxy'`` selects the explicit K3
    speed-census/penalty shadow; it is not a production characteristic
    boundary.
    """

    if state.formulation != "ccz4":
        raise ValueError("ccz4_rhs_3d requires formulation='ccz4'")
    _require_evolution_domain(state)
    inverse = np.linalg.inv(state.h)
    christoffel = _christoffel(state.h, inverse, state)
    physical_ricci, ricci_scalar, contracted, z_over_chi = _ccz4_ricci(
        state, inverse, christoffel
    )
    d_chi = [_d1(state.chi, state, axis) for axis in range(3)]
    d_lapse = [_d1(state.lapse, state, axis) for axis in range(3)]
    d_trace_k = [_d1(state.trace_k, state, axis) for axis in range(3)]
    d_theta = [_d1(state.theta, state, axis) for axis in range(3)]
    d_gamma = [_d1(state.conformal_gamma, state, axis) for axis in range(3)]
    d_shift = [_d1(state.shift, state, axis) for axis in range(3)]
    d_a = [_d1(state.a, state, axis) for axis in range(3)]
    d_b = [_d1(state.b, state, axis) for axis in range(3)]
    d2_shift = _second_partials(state.shift, state)
    d2_lapse = _second_partials(state.lapse, state)
    div_shift = sum(d_shift[axis][..., axis] for axis in range(3))
    beta = state.shift
    gradient_chi = np.stack(d_chi, axis=-1)
    gradient_lapse = np.stack(d_lapse, axis=-1)

    conformal_lapse_hessian = _hessian(state.lapse, state.h, inverse, state)
    lapse_dot_chi = np.einsum("...i,...ij,...j->...", gradient_lapse, inverse, gradient_chi)
    covd2_lapse = state.chi[..., None, None] * conformal_lapse_hessian + 0.5 * (
        gradient_lapse[..., :, None] * gradient_chi[..., None, :]
        + gradient_chi[..., :, None] * gradient_lapse[..., None, :]
        - state.h * lapse_dot_chi[..., None, None]
    )

    a_up_one = np.einsum("...ik,...kj->...ij", inverse, state.a)
    a_upup = np.einsum("...ia,...ab->...ib", a_up_one, inverse)
    a_squared = np.einsum("...ij,...ij->...", state.a, a_upup)
    z = state.chi[..., None] * z_over_chi
    kappa1_lapse = np.full(state.grid.shape, ccz4.kappa1) if ccz4.covariant_z4 else state.lapse * ccz4.kappa1

    rhs_chi = (2.0 / 3.0) * state.chi * (state.lapse * state.trace_k - div_shift)
    rhs_chi += sum(beta[..., axis] * d_chi[axis] for axis in range(3))
    rhs_h = -2.0 * state.lapse[..., None, None] * state.a
    rhs_h += sum(beta[..., axis, None, None] * _d1(state.h, state, axis) for axis in range(3))
    for first in range(3):
        for second in range(3):
            lie = sum(
                state.h[..., component, first] * d_shift[second][..., component]
                + state.h[..., component, second] * d_shift[first][..., component]
                for component in range(3)
            )
            rhs_h[..., first, second] += lie - (2.0 / 3.0) * state.h[..., first, second] * div_shift

    source_a = -covd2_lapse + state.chi[..., None, None] * state.lapse[..., None, None] * physical_ricci
    source_a -= state.h * np.einsum("...ij,...ij->...", inverse, source_a)[..., None, None] / 3.0
    rhs_a = source_a + sum(beta[..., axis, None, None] * d_a[axis] for axis in range(3))
    rhs_a += state.a * (
        state.lapse[..., None, None] * (state.trace_k - 2.0 * state.theta)[..., None, None]
        - (2.0 / 3.0) * div_shift[..., None, None]
    )
    for first in range(3):
        for second in range(3):
            rhs_a[..., first, second] += sum(
                state.a[..., component, first] * d_shift[second][..., component]
                + state.a[..., component, second] * d_shift[first][..., component]
                for component in range(3)
            )
            rhs_a[..., first, second] -= 2.0 * state.lapse * sum(
                inverse[..., k, ell] * state.a[..., first, k] * state.a[..., ell, second]
                for k in range(3) for ell in range(3)
            )

    second_lapse_tensor = np.empty((*state.grid.shape, 3, 3), dtype=np.float64)
    for first in range(3):
        for second in range(3):
            second_lapse_tensor[..., first, second] = d2_lapse[first][second]
    trace_covd2_lapse = -1.5 * lapse_dot_chi - state.chi * np.einsum(
        "...i,...i->...", contracted, gradient_lapse
    )
    trace_covd2_lapse += np.einsum(
        "...ij,...ij->...", inverse,
        state.chi[..., None, None] * second_lapse_tensor
        + gradient_lapse[..., :, None] * gradient_chi[..., None, :],
    )
    rhs_trace_k = sum(beta[..., axis] * d_trace_k[axis] for axis in range(3)) - trace_covd2_lapse
    rhs_trace_k += state.lapse * (
        ricci_scalar + state.trace_k * (state.trace_k - 2.0 * state.theta)
    ) - 3.0 * kappa1_lapse * (1.0 + ccz4.kappa2) * state.theta
    rhs_theta = sum(beta[..., axis] * d_theta[axis] for axis in range(3))
    rhs_theta += 0.5 * state.lapse * (
        ricci_scalar - a_squared + (2.0 / 3.0) * state.trace_k**2
        - 2.0 * state.theta * state.trace_k
    ) - 0.5 * state.theta * kappa1_lapse * (4.0 + 2.0 * ccz4.kappa2)
    rhs_theta -= np.einsum("...i,...i->...", z, gradient_lapse)

    rhs_gamma = (2.0 / 3.0) * (
        div_shift[..., None] * (contracted + 2.0 * ccz4.kappa3 * z_over_chi)
        - 2.0 * state.lapse[..., None] * state.trace_k[..., None] * z_over_chi
    ) - 2.0 * kappa1_lapse[..., None] * z_over_chi
    for component in range(3):
        for direction in range(3):
            rhs_gamma[..., component] += (
                2.0 * inverse[..., component, direction] *
                (state.lapse * d_theta[direction] - state.theta * d_lapse[direction])
                - 2.0 * a_upup[..., component, direction] * d_lapse[direction]
                - state.lapse * (
                    (4.0 / 3.0) * inverse[..., component, direction] * d_trace_k[direction]
                    + 3.0 * a_upup[..., component, direction] * d_chi[direction] / state.chi
                )
                - (contracted[..., direction] + 2.0 * ccz4.kappa3 * z_over_chi[..., direction])
                * d_shift[direction][..., component]
            )
            for second in range(3):
                rhs_gamma[..., component] += (
                    2.0 * state.lapse * christoffel[..., component, direction, second]
                    * a_upup[..., direction, second]
                    + inverse[..., direction, second] * d2_shift[direction][second][..., component]
                    + (1.0 / 3.0) * inverse[..., component, direction]
                    * d2_shift[direction][second][..., second]
                )
        rhs_gamma[..., component] += sum(beta[..., axis] * d_gamma[axis][..., component] for axis in range(3))

    rhs_lapse = -gauge.lapse_coefficient * state.lapse * (
        state.trace_k - gauge.theta_coupling * state.theta
    )
    rhs_shift = gauge.shift_coefficient * state.b
    rhs_b = rhs_gamma - gauge.shift_damping * state.b
    if gauge.advective:
        rhs_lapse += sum(beta[..., axis] * d_lapse[axis] for axis in range(3))
        rhs_shift += sum(beta[..., axis, None] * d_shift[axis] for axis in range(3))
        rhs_b += sum(beta[..., axis, None] * (d_b[axis] - d_gamma[axis]) for axis in range(3))
    rhs = CCZ4RHS3D(
        chi=rhs_chi,
        h=rhs_h,
        trace_k=rhs_trace_k,
        a=rhs_a,
        theta=rhs_theta,
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


def advance_ccz4_rk4_3d(
    state: BSSNState3D,
    dt: float,
    *,
    steps: int = 1,
    ccz4: CCZ4Config = CCZ4Config(),
    gauge: GaugeConfig = GaugeConfig(theta_coupling=2.0),
    project_algebraic: bool = False,
    sommerfeld_speed: float = 1.0,
    boundary_mode: str = "sommerfeld",
) -> BSSNState3D:
    if not np.isfinite(dt) or dt <= 0.0 or not isinstance(steps, int) or steps < 1:
        raise ValueError("dt must be finite and positive and steps must be positive")
    working = state
    for _ in range(steps):
        k1 = ccz4_rhs_3d(
            working,
            ccz4=ccz4,
            gauge=gauge,
            sommerfeld_speed=sommerfeld_speed,
            boundary_mode=boundary_mode,
        )
        stage2 = _state_add(working, k1, 0.5 * dt)
        if project_algebraic:
            stage2 = project_algebraic_constraints_3d(stage2)
        k2 = ccz4_rhs_3d(
            stage2,
            ccz4=ccz4,
            gauge=gauge,
            sommerfeld_speed=sommerfeld_speed,
            boundary_mode=boundary_mode,
        )
        stage3 = _state_add(working, k2, 0.5 * dt)
        if project_algebraic:
            stage3 = project_algebraic_constraints_3d(stage3)
        k3 = ccz4_rhs_3d(
            stage3,
            ccz4=ccz4,
            gauge=gauge,
            sommerfeld_speed=sommerfeld_speed,
            boundary_mode=boundary_mode,
        )
        stage4 = _state_add(working, k3, dt)
        if project_algebraic:
            stage4 = project_algebraic_constraints_3d(stage4)
        k4 = ccz4_rhs_3d(
            stage4,
            ccz4=ccz4,
            gauge=gauge,
            sommerfeld_speed=sommerfeld_speed,
            boundary_mode=boundary_mode,
        )
        combined = CCZ4RHS3D(
            chi=k1.chi + 2.0 * k2.chi + 2.0 * k3.chi + k4.chi,
            h=k1.h + 2.0 * k2.h + 2.0 * k3.h + k4.h,
            trace_k=k1.trace_k + 2.0 * k2.trace_k + 2.0 * k3.trace_k + k4.trace_k,
            a=k1.a + 2.0 * k2.a + 2.0 * k3.a + k4.a,
            theta=k1.theta + 2.0 * k2.theta + 2.0 * k3.theta + k4.theta,
            conformal_gamma=k1.conformal_gamma + 2.0 * k2.conformal_gamma + 2.0 * k3.conformal_gamma + k4.conformal_gamma,
            lapse=k1.lapse + 2.0 * k2.lapse + 2.0 * k3.lapse + k4.lapse,
            shift=k1.shift + 2.0 * k2.shift + 2.0 * k3.shift + k4.shift,
            b=k1.b + 2.0 * k2.b + 2.0 * k3.b + k4.b,
        )
        working = _state_add(working, combined, dt / 6.0)
        if project_algebraic:
            working = project_algebraic_constraints_3d(working)
    return working
