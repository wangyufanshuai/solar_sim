"""NR-K1c vacuum CCZ4 right-hand side for the 1-D reference backend.

This module ports the 3+1 vacuum CCZ4 terms into the same full-tensor 1-D
reduction used by :mod:`ccz4_reference`.  It follows the variable ordering and
Ricci/Gamma construction used by GRTeclyn's CCZ4 implementation, while
keeping all derivatives explicit and testable in Python.

The implementation is a reference contract, not a 3-D production solver:
there is no AMR, mesh hierarchy, matter source, excision, or radiative outer
boundary.  The CCZ4 ``Theta`` and Z4 damping terms are present here; all
promotion fields remain blocked until the independent 3-D and cross-backend
gates are complete.
"""

from __future__ import annotations

from dataclasses import dataclass
import math

import numpy as np

from .bssn_rhs import (
    _d2,
    _state_add,
    _state_rk4_update,
    _conformal_ricci_bssn,
    _covariant_hessian,
)
from .ccz4_reference import (
    Array,
    BoundaryConfig1D,
    CCZ4State1D,
    GaugeConfig,
    Grid1D,
    _christoffel_1d,
    _d1,
    _finite_array,
    _finite_scalar,
    constraint_report,
    gauge_rhs,
)


@dataclass(frozen=True)
class CCZ4Config:
    """Constraint-damping parameters from the CCZ4 formulation."""

    kappa1: float = 0.1
    kappa2: float = 0.0
    kappa3: float = 1.0
    covariant_z4: bool = True

    def __post_init__(self) -> None:
        if not math.isfinite(self.kappa1) or self.kappa1 < 0.0:
            raise ValueError("kappa1 must be finite and non-negative")
        if not math.isfinite(self.kappa2) or self.kappa2 <= -1.0:
            raise ValueError("kappa2 must be finite and greater than -1")
        if not math.isfinite(self.kappa3):
            raise ValueError("kappa3 must be finite")


@dataclass(frozen=True)
class CCZ4RHS1D:
    chi: Array
    h: Array
    trace_k: Array
    a: Array
    theta: Array
    conformal_gamma: Array
    lapse: Array
    shift: Array
    b: Array
    geometric_gamma_rhs_supplied: bool
    theta_evolution_supported: bool

    def __post_init__(self) -> None:
        for name in (
            "chi", "h", "trace_k", "a", "theta", "conformal_gamma",
            "lapse", "shift", "b",
        ):
            _finite_array(getattr(self, name), name=name)


@dataclass(frozen=True)
class RobustStabilitySample:
    step: int
    time: float
    hamiltonian_l2: float
    momentum_l2: float
    theta_l_inf: float
    min_chi: float
    min_lapse: float


@dataclass(frozen=True)
class RobustStabilityReport:
    seed: int
    amplitude: float
    samples: tuple[RobustStabilitySample, ...]

    @property
    def passed(self) -> bool:
        if not self.samples:
            return False
        return all(
            math.isfinite(value)
            for sample in self.samples
            for value in (
                sample.hamiltonian_l2,
                sample.momentum_l2,
                sample.theta_l_inf,
                sample.min_chi,
                sample.min_lapse,
            )
        ) and all(sample.min_chi > 0.0 and sample.min_lapse > 0.0 for sample in self.samples)


def _contracted_christoffel(chris: Array, h_inverse: Array) -> Array:
    return np.einsum("nij,nkij->nk", h_inverse, chris)


def _ccz4_ricci(
    state: CCZ4State1D,
    h_inverse: Array,
    chris: Array,
) -> tuple[Array, float | Array]:
    """Return the CCZ4 Ricci tensor and scalar including Z4 terms."""

    chi = state.chi
    d_chi = _d1(chi, state.grid)
    grad_chi = np.zeros((state.grid.points, 3), dtype=np.float64)
    grad_chi[:, 0] = d_chi
    hessian_chi = _covariant_hessian(chi, state.h, h_inverse, state.grid)
    box_chi = np.einsum("nij,nij->n", h_inverse, hessian_chi)
    grad_sq = np.einsum("ni,nij,nj->n", grad_chi, h_inverse, grad_chi)
    conformal_chris = _contracted_christoffel(chris, h_inverse)
    z_over_chi = 0.5 * (state.conformal_gamma - conformal_chris)

    ricci_chi = 0.5 * (
        hessian_chi
        + state.h * box_chi[:, None, None]
        - (
            grad_chi[:, :, None] * grad_chi[:, None, :]
            + 3.0 * state.h * grad_sq[:, None, None]
        )
        / (2.0 * chi)[:, None, None]
    )
    z_terms = np.zeros_like(state.h)
    for i in range(3):
        for j in range(3):
            value = np.zeros(state.grid.points, dtype=np.float64)
            for k in range(3):
                value += z_over_chi[:, k] * (
                    state.h[:, i, k] * (d_chi if j == 0 else 0.0)
                    + state.h[:, j, k] * (d_chi if i == 0 else 0.0)
                    - state.h[:, i, j] * (d_chi if k == 0 else 0.0)
                )
            z_terms[:, i, j] = value

    conformal_ricci = _conformal_ricci_bssn(state, h_inverse)
    ricci = (ricci_chi + chi[:, None, None] * conformal_ricci + z_terms) / chi[:, None, None]
    scalar = chi * np.einsum("nij,nij->n", h_inverse, ricci)
    return ricci, scalar


def _physical_lapse_hessian(
    state: CCZ4State1D,
    h_inverse: Array,
) -> tuple[Array, Array, Array, Array]:
    """Return physical Hessian, its trace, and first-gradient contractions."""

    grid = state.grid
    d_chi = _d1(state.chi, grid)
    d_lapse = _d1(state.lapse, grid)
    grad_chi = np.zeros((grid.points, 3), dtype=np.float64)
    grad_lapse = np.zeros((grid.points, 3), dtype=np.float64)
    grad_chi[:, 0] = d_chi
    grad_lapse[:, 0] = d_lapse
    dot = np.einsum("ni,nij,nj->n", grad_lapse, h_inverse, grad_chi)
    conformal_hessian = _covariant_hessian(state.lapse, state.h, h_inverse, grid)
    physical_hessian = state.chi[:, None, None] * conformal_hessian + 0.5 * (
        grad_lapse[:, :, None] * grad_chi[:, None, :]
        + grad_chi[:, :, None] * grad_lapse[:, None, :]
        - state.h * dot[:, None, None]
    )
    return physical_hessian, np.einsum("nij,nij->n", h_inverse, physical_hessian), dot, grad_lapse


def ccz4_rhs_1d(
    state: CCZ4State1D,
    *,
    ccz4: CCZ4Config = CCZ4Config(),
    gauge: GaugeConfig = GaugeConfig(theta_coupling=2.0),
) -> CCZ4RHS1D:
    """Evaluate the vacuum CCZ4 RHS on the full-tensor 1-D reduction."""

    if state.formulation != "ccz4":
        raise ValueError("ccz4_rhs_1d requires a state with formulation='ccz4'")
    grid = state.grid
    n = grid.points
    h_inverse = np.linalg.inv(state.h)
    chris = _christoffel_1d(state.h, h_inverse, grid)
    contracted_chris = _contracted_christoffel(chris, h_inverse)
    physical_ricci, ricci_scalar = _ccz4_ricci(state, h_inverse, chris)
    covd2_lapse, _, dlapse_dot_dchi, grad_lapse = _physical_lapse_hessian(state, h_inverse)

    d_chi = _d1(state.chi, grid)
    d_lapse = grad_lapse[:, 0]
    d_shift = _d1(state.shift, grid)
    d2_shift = _d2(state.shift, grid)
    d_trace_k = _d1(state.trace_k, grid)
    d_theta = _d1(state.theta, grid)
    d_gamma = _d1(state.conformal_gamma, grid)
    div_shift = d_shift[:, 0]
    beta_x = state.shift[:, 0]
    grad_chi = np.zeros((n, 3), dtype=np.float64)
    grad_chi[:, 0] = d_chi

    a_up_one = np.einsum("nik,nkj->nij", h_inverse, state.a)
    a_upup = np.einsum("nia,nab->nib", a_up_one, h_inverse)
    a_squared = np.einsum("nij,nij->n", state.a, a_upup)
    z_over_chi = 0.5 * (state.conformal_gamma - contracted_chris)
    z = state.chi[:, None] * z_over_chi
    kappa1_lapse = state.lapse * ccz4.kappa1
    if ccz4.covariant_z4:
        kappa1_lapse = np.full(n, ccz4.kappa1, dtype=np.float64)

    # chi and h_ij evolution.
    rhs_chi = (2.0 / 3.0) * state.chi * (state.lapse * state.trace_k - div_shift)
    rhs_chi += beta_x * d_chi
    rhs_h = -2.0 * state.lapse[:, None, None] * state.a
    rhs_h += beta_x[:, None, None] * _d1(state.h, grid)
    for i in range(3):
        for j in range(3):
            lie = np.zeros(n, dtype=np.float64)
            for k in range(3):
                lie += state.h[:, k, i] * (d_shift[:, k] if j == 0 else 0.0)
                lie += state.h[:, k, j] * (d_shift[:, k] if i == 0 else 0.0)
            rhs_h[:, i, j] += lie - (2.0 / 3.0) * state.h[:, i, j] * div_shift

    # A_ij evolution from the CCZ4 Ricci and gauge terms.
    adot_tf = -covd2_lapse + state.chi[:, None, None] * state.lapse[:, None, None] * physical_ricci
    adot_tf -= state.h * (
        np.einsum("nij,nij->n", h_inverse, adot_tf) / 3.0
    )[:, None, None]
    rhs_a = adot_tf + beta_x[:, None, None] * _d1(state.a, grid)
    rhs_a += state.a * (
        state.lapse * (state.trace_k - 2.0 * state.theta) - (2.0 / 3.0) * div_shift
    )[:, None, None]
    for i in range(3):
        for j in range(3):
            lie = np.zeros(n, dtype=np.float64)
            for k in range(3):
                lie += state.a[:, k, i] * (d_shift[:, k] if j == 0 else 0.0)
                lie += state.a[:, k, j] * (d_shift[:, k] if i == 0 else 0.0)
            rhs_a[:, i, j] += lie
            for k in range(3):
                for ell in range(3):
                    rhs_a[:, i, j] -= 2.0 * state.lapse * h_inverse[:, k, ell] * state.a[:, i, k] * state.a[:, ell, j]

    # K and Theta evolution.  Vacuum cosmological-constant/source terms are zero.
    trace_covd2_lapse = -1.5 * dlapse_dot_dchi - state.chi * np.einsum(
        "ni,ni->n", contracted_chris, grad_lapse
    )
    d2_lapse = _d2(state.lapse, grid)
    # In the Cartesian 1-D reduction only the x-x second derivative exists.
    # Do not broadcast the same d2_lapse sample onto the y-y/z-z entries:
    # doing so would inject three copies of the one-dimensional derivative
    # into the trace and would make a cross-backend comparison look like a
    # solver disagreement.
    lapse_second_tensor = np.zeros((n, 3, 3), dtype=np.float64)
    lapse_second_tensor[:, 0, 0] = state.chi * d2_lapse
    trace_covd2_lapse += np.einsum(
        "nij,nij->n",
        h_inverse,
        lapse_second_tensor + grad_lapse[:, :, None] * grad_chi[:, None, :],
    )
    rhs_k = beta_x * d_trace_k - trace_covd2_lapse
    rhs_k += state.lapse * (ricci_scalar + state.trace_k * (state.trace_k - 2.0 * state.theta))
    rhs_k -= 3.0 * kappa1_lapse * (1.0 + ccz4.kappa2) * state.theta

    z_dot_lapse = np.einsum("ni,ni->n", z, grad_lapse)
    rhs_theta = beta_x * d_theta
    rhs_theta += 0.5 * state.lapse * (
        ricci_scalar - a_squared + (2.0 / 3.0) * state.trace_k * state.trace_k
        - 2.0 * state.theta * state.trace_k
    )
    rhs_theta -= 0.5 * state.theta * kappa1_lapse * (4.0 + 2.0 * ccz4.kappa2)
    rhs_theta -= z_dot_lapse

    # Conformal Gamma^i evolution, including Z4 damping and shift second derivatives.
    rhs_gamma = np.zeros((n, 3), dtype=np.float64)
    for i in range(3):
        rhs_gamma[:, i] = (2.0 / 3.0) * (
            div_shift * (contracted_chris[:, i] + 2.0 * ccz4.kappa3 * z_over_chi[:, i])
            - 2.0 * state.lapse * state.trace_k * z_over_chi[:, i]
        ) - 2.0 * kappa1_lapse * z_over_chi[:, i]
        for j in range(3):
            d_theta_j = d_theta if j == 0 else 0.0
            d_k_j = d_trace_k if j == 0 else 0.0
            d_lapse_j = d_lapse if j == 0 else 0.0
            d_chi_j = d_chi if j == 0 else 0.0
            rhs_gamma[:, i] += (
                2.0 * h_inverse[:, i, j] * (state.lapse * d_theta_j - state.theta * d_lapse_j)
                - 2.0 * a_upup[:, i, j] * d_lapse_j
                - state.lapse * (
                    (4.0 / 3.0) * h_inverse[:, i, j] * d_k_j
                    + 3.0 * a_upup[:, i, j] * d_chi_j / state.chi
                )
                - (contracted_chris[:, j] + 2.0 * ccz4.kappa3 * z_over_chi[:, j])
                * (d_shift[:, i] if j == 0 else 0.0)
            )
            for k in range(3):
                d2_beta_i = d2_shift[:, i] if j == 0 and k == 0 else 0.0
                d2_beta_k = d2_shift[:, k] if j == 0 and k == 0 else 0.0
                rhs_gamma[:, i] += (
                    2.0 * state.lapse * chris[:, i, j, k] * a_upup[:, j, k]
                    + h_inverse[:, j, k] * d2_beta_i
                    + (1.0 / 3.0) * h_inverse[:, i, j] * d2_beta_k
                )
        rhs_gamma[:, i] += beta_x * d_gamma[:, i]

    gauge_result = gauge_rhs(state, gauge, geometric_gamma_rhs=rhs_gamma)
    return CCZ4RHS1D(
        chi=rhs_chi,
        h=rhs_h,
        trace_k=rhs_k,
        a=rhs_a,
        theta=rhs_theta,
        conformal_gamma=rhs_gamma,
        lapse=gauge_result.lapse,
        shift=gauge_result.shift,
        b=gauge_result.b,
        geometric_gamma_rhs_supplied=True,
        theta_evolution_supported=True,
    )


def advance_ccz4_rk4(
    state: CCZ4State1D,
    dt: float,
    *,
    steps: int = 1,
    ccz4: CCZ4Config = CCZ4Config(),
    gauge: GaugeConfig = GaugeConfig(theta_coupling=2.0),
) -> CCZ4State1D:
    """Advance CCZ4 with deterministic classical RK4 substeps."""

    step_dt = _finite_scalar(dt, name="dt")
    if step_dt <= 0.0:
        raise ValueError("dt must be strictly positive")
    if not isinstance(steps, int) or steps < 1:
        raise ValueError("steps must be a positive integer")
    working = state
    for _ in range(steps):
        k1 = ccz4_rhs_1d(working, ccz4=ccz4, gauge=gauge)
        k2 = ccz4_rhs_1d(_state_add(working, k1, 0.5 * step_dt), ccz4=ccz4, gauge=gauge)
        k3 = ccz4_rhs_1d(_state_add(working, k2, 0.5 * step_dt), ccz4=ccz4, gauge=gauge)
        k4 = ccz4_rhs_1d(_state_add(working, k3, step_dt), ccz4=ccz4, gauge=gauge)
        working = _state_rk4_update(working, step_dt, k1, k2, k3, k4)
    return working


def robust_stability_campaign(
    *,
    points: int = 33,
    dt: float = 1.0e-4,
    checkpoints: tuple[int, ...] = (1, 5, 10, 20, 40),
    amplitude: float = 1.0e-6,
    seed: int = 42,
) -> RobustStabilityReport:
    """Run a deterministic small-noise robust-stability sweep.

    This is an engineering stability gate for the reference implementation,
    not evidence of physical validity or long-time binary-black-hole accuracy.
    The perturbation is seeded and the checkpoints are cumulative, so the
    resulting report can be replayed exactly on the same NumPy/toolchain.
    """

    if points < 9 or dt <= 0.0 or amplitude <= 0.0:
        raise ValueError("points >= 9, dt > 0, and amplitude > 0 are required")
    if not checkpoints or any(step < 1 for step in checkpoints):
        raise ValueError("checkpoints must contain positive step counts")
    if any(right <= left for left, right in zip(checkpoints, checkpoints[1:])):
        raise ValueError("checkpoints must be strictly increasing")
    rng = np.random.default_rng(seed)
    grid = Grid1D(points, 0.0, 1.0, boundary=BoundaryConfig1D(kind="periodic"))
    state = CCZ4State1D.minkowski(grid, formulation="ccz4")
    state.chi += amplitude * rng.normal(size=points)
    state.lapse += amplitude * rng.normal(size=points)
    state.trace_k[:] = amplitude * rng.normal(size=points)
    state.theta[:] = 0.1 * amplitude * rng.normal(size=points)
    for diagonal in range(3):
        state.h[:, diagonal, diagonal] += amplitude * rng.normal(size=points)
    state.conformal_gamma[:] = amplitude * rng.normal(size=(points, 3))

    samples: list[RobustStabilitySample] = []
    completed = 0
    working = state
    for target in checkpoints:
        working = advance_ccz4_rk4(working, dt, steps=target - completed)
        completed = target
        report = constraint_report(working)
        samples.append(
            RobustStabilitySample(
                step=target,
                time=target * dt,
                hamiltonian_l2=report.norms["hamiltonian_l2"],
                momentum_l2=report.norms["momentum_l2"],
                theta_l_inf=float(np.max(np.abs(working.theta))),
                min_chi=float(np.min(working.chi)),
                min_lapse=float(np.min(working.lapse)),
            )
        )
    return RobustStabilityReport(seed=seed, amplitude=amplitude, samples=tuple(samples))
