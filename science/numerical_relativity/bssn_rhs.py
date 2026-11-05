"""NR-K1b vacuum BSSN method-of-lines reference on a 1-D Cartesian reduction.

The state still carries full three-dimensional tensor components, but every
field is sampled on a line and therefore depends on ``x`` only.  This is a
deliberately small reference backend for equation and cross-language tests;
it is not a replacement for a 3-D production solver.

Implemented here:

* vacuum BSSNOK geometric right-hand sides for ``chi``, ``h_ij``, ``K``,
  ``A_ij`` and ``Gamma^i``;
* the already-audited 1+log/Gamma-driver gauge contract;
* fixed-step classical RK4 method-of-lines stepping;
* explicit refusal to evolve a CCZ4-labelled state until the CCZ4 damping and
  ``Theta`` terms are implemented rather than silently setting them to zero.

The formulas use geometric units (G = c = 1), covariant lower-index
``A_ij``, and the conformal convention ``gamma_ij = chi**(-1) h_ij``.
Matter source terms are zero.  Boundary handling is inherited from the
``Grid1D`` contract and is intentionally visible in every derivative call.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .ccz4_reference import (
    Array,
    CCZ4State1D,
    GaugeConfig,
    GaugeRHS1D,
    Grid1D,
    _christoffel_1d,
    _d1,
    _finite_array,
    _finite_scalar,
    gauge_rhs,
)


@dataclass(frozen=True)
class BSSNRHS1D:
    """One vacuum BSSN right-hand-side sample on the full state layout."""

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
            "chi",
            "h",
            "trace_k",
            "a",
            "theta",
            "conformal_gamma",
            "lapse",
            "shift",
            "b",
        ):
            _finite_array(getattr(self, name), name=name)


def _d2(values: Array, grid: Grid1D) -> Array:
    """Second derivative with the same explicit boundary policies as ``_d1``."""

    data = np.asarray(values, dtype=np.float64)
    if data.shape[0] != grid.points:
        raise ValueError("values do not match grid points")
    dx2 = grid.dx * grid.dx
    if grid.boundary.kind == "periodic":
        return (np.roll(data, -1, axis=0) - 2.0 * data + np.roll(data, 1, axis=0)) / dx2
    result = np.empty_like(data)
    result[1:-1] = (data[2:] - 2.0 * data[1:-1] + data[:-2]) / dx2
    if grid.boundary.kind == "reflective":
        result[0] = (data[1] - data[0]) * 2.0 / dx2
        result[-1] = (data[-2] - data[-1]) * 2.0 / dx2
    else:
        result[0] = (data[0] - 2.0 * data[1] + data[2]) / dx2
        result[-1] = (data[-1] - 2.0 * data[-2] + data[-3]) / dx2
    return result


def _covariant_hessian(
    scalar: Array,
    metric: Array,
    inverse_metric: Array,
    grid: Grid1D,
) -> Array:
    """Return ``D_i D_j scalar`` for fields depending on x only."""

    christoffel = _christoffel_1d(metric, inverse_metric, grid)
    first = _d1(scalar, grid)
    second = _d2(scalar, grid)
    result = np.zeros((grid.points, 3, 3), dtype=np.float64)
    for i in range(3):
        for j in range(3):
            result[:, i, j] = (second if i == 0 and j == 0 else 0.0) - (
                christoffel[:, 0, i, j] * first
            )
    return result


def _trace_free(tensor: Array, metric: Array, inverse_metric: Array) -> Array:
    trace = np.einsum("nij,nij->n", inverse_metric, tensor)
    return tensor - metric * (trace / 3.0)[:, None, None]


def _conformal_ricci_bssn(state: CCZ4State1D, h_inverse: Array) -> Array:
    """Construct ``R~_ij`` using the evolved BSSN ``Gamma^i`` variables.

    This is the contracted-Christoffel form used by mature CCZ4/BSSN codes.
    Reconstructing Ricci only from ``h_ij`` would hide Gamma-constraint
    violations and make a shadow run look healthier than its evolved state.
    """

    grid = state.grid
    n = grid.points
    d1_h = _d1(state.h, grid)
    d2_h = _d2(state.h, grid)
    d1_gamma = _d1(state.conformal_gamma, grid)
    chris = _christoffel_1d(state.h, h_inverse, grid)
    # GRTeclyn's Ricci expression uses a raised-third-index form of the
    # all-lower Christoffel tensor in its quadratic terms.  It is not the same
    # array as ``Gamma^i_jk`` with a simple permutation of indices.
    chris_lower = np.einsum("nal,nlbc->nabc", state.h, chris)
    chris_llu = np.einsum("nlm,njkm->nljk", h_inverse, chris_lower)
    ricci = np.zeros((n, 3, 3), dtype=np.float64)
    for i in range(3):
        for j in range(3):
            value = np.zeros(n, dtype=np.float64)
            for k in range(3):
                derivative_gamma_j = d1_gamma[:, k] if j == 0 else 0.0
                derivative_gamma_i = d1_gamma[:, k] if i == 0 else 0.0
                derivative_h = d1_h[:, i, j] if k == 0 else 0.0
                value += 0.5 * (
                    state.h[:, k, i] * derivative_gamma_j
                    + state.h[:, k, j] * derivative_gamma_i
                    + state.conformal_gamma[:, k] * derivative_h
                )
                for ell in range(3):
                    second_h = d2_h[:, i, j] if k == 0 and ell == 0 else 0.0
                    value += -0.5 * h_inverse[:, k, ell] * second_h
                    value += (
                        chris[:, k, ell, i] * chris_llu[:, ell, j, k]
                        + chris[:, k, ell, j] * chris_llu[:, ell, i, k]
                        + chris[:, k, i, ell] * chris_llu[:, ell, k, j]
                    )
            ricci[:, i, j] = value
    return ricci


def _physical_ricci(
    state: CCZ4State1D,
    h_inverse: Array,
) -> Array:
    """Construct the physical Ricci tensor from the conformal variables."""

    chi = state.chi
    d_chi = _d1(chi, state.grid)
    hessian_chi = _covariant_hessian(chi, state.h, h_inverse, state.grid)
    conformal_ricci = _conformal_ricci_bssn(state, h_inverse)
    grad_chi = np.zeros((state.grid.points, 3), dtype=np.float64)
    grad_chi[:, 0] = d_chi
    grad_sq = np.einsum("ni,nij,nj->n", grad_chi, h_inverse, grad_chi)
    laplace_chi = np.einsum("nij,nij->n", h_inverse, hessian_chi)
    correction = (
        (hessian_chi + state.h * laplace_chi[:, None, None]) / (2.0 * chi)[:, None, None]
        - (
            grad_chi[:, :, None] * grad_chi[:, None, :]
            + 3.0 * state.h * grad_sq[:, None, None]
        )
        / (4.0 * chi * chi)[:, None, None]
    )
    return conformal_ricci + correction


def _state_from_arrays(
    state: CCZ4State1D,
    *,
    chi: Array,
    h: Array,
    trace_k: Array,
    a: Array,
    theta: Array,
    conformal_gamma: Array,
    lapse: Array,
    shift: Array,
    b: Array,
) -> CCZ4State1D:
    return CCZ4State1D(
        grid=state.grid,
        chi=chi,
        h=h,
        trace_k=trace_k,
        a=a,
        theta=theta,
        conformal_gamma=conformal_gamma,
        lapse=lapse,
        shift=shift,
        b=b,
        formulation=state.formulation,
    )


def _state_add(state: CCZ4State1D, rhs: BSSNRHS1D, scale: float) -> CCZ4State1D:
    return _state_from_arrays(
        state,
        chi=state.chi + scale * rhs.chi,
        h=state.h + scale * rhs.h,
        trace_k=state.trace_k + scale * rhs.trace_k,
        a=state.a + scale * rhs.a,
        theta=state.theta + scale * rhs.theta,
        conformal_gamma=state.conformal_gamma + scale * rhs.conformal_gamma,
        lapse=state.lapse + scale * rhs.lapse,
        shift=state.shift + scale * rhs.shift,
        b=state.b + scale * rhs.b,
    )


def _state_rk4_update(
    state: CCZ4State1D,
    dt: float,
    k1: BSSNRHS1D,
    k2: BSSNRHS1D,
    k3: BSSNRHS1D,
    k4: BSSNRHS1D,
) -> CCZ4State1D:
    def combine(base: Array, first: Array, second: Array, third: Array, fourth: Array) -> Array:
        return base + (dt / 6.0) * (first + 2.0 * second + 2.0 * third + fourth)

    return _state_from_arrays(
        state,
        chi=combine(state.chi, k1.chi, k2.chi, k3.chi, k4.chi),
        h=combine(state.h, k1.h, k2.h, k3.h, k4.h),
        trace_k=combine(state.trace_k, k1.trace_k, k2.trace_k, k3.trace_k, k4.trace_k),
        a=combine(state.a, k1.a, k2.a, k3.a, k4.a),
        theta=combine(state.theta, k1.theta, k2.theta, k3.theta, k4.theta),
        conformal_gamma=combine(
            state.conformal_gamma,
            k1.conformal_gamma,
            k2.conformal_gamma,
            k3.conformal_gamma,
            k4.conformal_gamma,
        ),
        lapse=combine(state.lapse, k1.lapse, k2.lapse, k3.lapse, k4.lapse),
        shift=combine(state.shift, k1.shift, k2.shift, k3.shift, k4.shift),
        b=combine(state.b, k1.b, k2.b, k3.b, k4.b),
    )


def bssn_rhs_1d(
    state: CCZ4State1D,
    gauge: GaugeConfig = GaugeConfig(),
    *,
    allow_incomplete_ccz4: bool = False,
) -> BSSNRHS1D:
    """Evaluate the vacuum BSSNOK RHS on a full-tensor 1-D reduction.

    A ``ccz4`` state is rejected by default because this function does not yet
    evolve the CCZ4 ``Theta``/constraint-damping terms.  Passing
    ``allow_incomplete_ccz4=True`` is reserved for diagnostic experiments and
    makes the unsupported zero-Theta evolution explicit in the returned
    metadata; it is never a promotion gate.
    """

    if state.formulation != "bssnok" and not allow_incomplete_ccz4:
        raise ValueError(
            "bssn_rhs_1d implements BSSNOK only; CCZ4 Theta/damping terms are "
            "not yet implemented"
        )
    grid = state.grid
    n = grid.points
    h_inverse = np.linalg.inv(state.h)
    physical_metric = state.h / state.chi[:, None, None]
    physical_inverse = state.chi[:, None, None] * h_inverse
    conformal_christoffel = _christoffel_1d(state.h, h_inverse, grid)
    physical_ricci = _physical_ricci(state, h_inverse)
    lapse_hessian = _covariant_hessian(
        state.lapse,
        physical_metric,
        physical_inverse,
        grid,
    )
    lapse_laplacian = np.einsum("nij,nij->n", physical_inverse, lapse_hessian)

    d_chi = _d1(state.chi, grid)
    d_lapse = _d1(state.lapse, grid)
    d_shift = _d1(state.shift, grid)
    d2_shift = _d2(state.shift, grid)
    d_trace_k = _d1(state.trace_k, grid)
    d_gamma = _d1(state.conformal_gamma, grid)
    d_phi = -0.25 * d_chi / state.chi
    div_shift = d_shift[:, 0]
    beta_x = state.shift[:, 0]

    a_up_one = np.einsum("nik,nkj->nij", h_inverse, state.a)
    a_upup = np.einsum("nia,nab->nib", a_up_one, h_inverse)
    a_squared = np.einsum("nij,nij->n", state.a, a_upup)
    a_square_lower = np.einsum("nik,nkj->nij", state.a, a_up_one)

    # chi and conformal metric evolution.
    d_chi_rhs = (
        (2.0 / 3.0) * state.chi * (state.lapse * state.trace_k - div_shift)
        + beta_x * d_chi
    )
    d_h_rhs = -2.0 * state.lapse[:, None, None] * state.a
    d_h_rhs += beta_x[:, None, None] * _d1(state.h, grid)
    for i in range(3):
        for j in range(3):
            lie = np.zeros(n, dtype=np.float64)
            for k in range(3):
                lie += state.h[:, k, i] * (d_shift[:, k] if j == 0 else 0.0)
                lie += state.h[:, k, j] * (d_shift[:, k] if i == 0 else 0.0)
            d_h_rhs[:, i, j] += lie - (2.0 / 3.0) * state.h[:, i, j] * div_shift

    # Trace-K evolution, vacuum sources only.
    d_trace_k_rhs = (
        -lapse_laplacian
        + state.lapse * (a_squared + state.trace_k * state.trace_k / 3.0)
        + beta_x * d_trace_k
    )

    # Trace-free A_ij evolution.
    source_a = state.chi[:, None, None] * (
        -lapse_hessian + state.lapse[:, None, None] * physical_ricci
    )
    d_a_rhs = _trace_free(source_a, state.h, h_inverse)
    d_a_rhs += state.lapse[:, None, None] * (
        state.trace_k[:, None, None] * state.a - 2.0 * a_square_lower
    )
    d_a_rhs += beta_x[:, None, None] * _d1(state.a, grid)
    for i in range(3):
        for j in range(3):
            lie = np.zeros(n, dtype=np.float64)
            for k in range(3):
                lie += state.a[:, k, i] * (d_shift[:, k] if j == 0 else 0.0)
                lie += state.a[:, k, j] * (d_shift[:, k] if i == 0 else 0.0)
            d_a_rhs[:, i, j] += lie - (2.0 / 3.0) * state.a[:, i, j] * div_shift

    # BSSN conformal-connection evolution.  Only x derivatives are nonzero,
    # but h^ij and A^ij retain all tensor components.
    connection_a = np.einsum("nkij,nij->nk", conformal_christoffel, a_upup)
    connection_rhs = -2.0 * a_upup[:, :, 0] * d_lapse[:, None]
    connection_rhs += 2.0 * state.lapse[:, None] * (
        connection_a
        - (2.0 / 3.0) * h_inverse[:, :, 0] * d_trace_k[:, None]
        + 6.0 * a_upup[:, :, 0] * d_phi[:, None]
    )
    connection_rhs += beta_x[:, None] * d_gamma
    connection_rhs -= state.conformal_gamma[:, 0, None] * d_shift
    connection_rhs += (2.0 / 3.0) * state.conformal_gamma * div_shift[:, None]
    connection_rhs += h_inverse[:, 0, 0, None] * d2_shift
    connection_rhs += (1.0 / 3.0) * h_inverse[:, :, 0] * d2_shift[:, 0, None]

    gauge: GaugeRHS1D = gauge_rhs(
        state,
        gauge,
        geometric_gamma_rhs=connection_rhs,
    )
    return BSSNRHS1D(
        chi=d_chi_rhs,
        h=d_h_rhs,
        trace_k=d_trace_k_rhs,
        a=d_a_rhs,
        theta=np.zeros(n, dtype=np.float64),
        conformal_gamma=connection_rhs,
        lapse=gauge.lapse,
        shift=gauge.shift,
        b=gauge.b,
        geometric_gamma_rhs_supplied=gauge.geometric_gamma_rhs_supplied,
        theta_evolution_supported=False,
    )


def advance_bssn_rk4(
    state: CCZ4State1D,
    dt: float,
    *,
    steps: int = 1,
    gauge: GaugeConfig = GaugeConfig(),
    allow_incomplete_ccz4: bool = False,
) -> CCZ4State1D:
    """Advance BSSNOK with deterministic classical RK4 substeps."""

    step_dt = _finite_scalar(dt, name="dt")
    if step_dt <= 0.0:
        raise ValueError("dt must be strictly positive")
    if not isinstance(steps, int) or steps < 1:
        raise ValueError("steps must be a positive integer")
    working = state
    for _ in range(steps):
        k1 = bssn_rhs_1d(
            working,
            gauge,
            allow_incomplete_ccz4=allow_incomplete_ccz4,
        )
        k2 = bssn_rhs_1d(
            _state_add(working, k1, 0.5 * step_dt),
            gauge,
            allow_incomplete_ccz4=allow_incomplete_ccz4,
        )
        k3 = bssn_rhs_1d(
            _state_add(working, k2, 0.5 * step_dt),
            gauge,
            allow_incomplete_ccz4=allow_incomplete_ccz4,
        )
        k4 = bssn_rhs_1d(
            _state_add(working, k3, step_dt),
            gauge,
            allow_incomplete_ccz4=allow_incomplete_ccz4,
        )
        working = _state_rk4_update(working, step_dt, k1, k2, k3, k4)
    return working
