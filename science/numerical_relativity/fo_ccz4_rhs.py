"""Research-only first-order-in-space CCZ4 RHS shadow.

The implementation follows the non-conservative 58-variable FO-CCZ4
ordering described by Dumbser et al.  It is intentionally separate from the
existing second-order ``ccz4_rhs_3d`` path.  The code uses the first-order
auxiliary fields ``A``, ``B``, ``D`` and ``P`` for the geometric terms and
implements the ordering-constraint terms that are required by the published
strong-hyperbolicity construction.  It is still a reference/shadow backend:
there is no production characteristic solver, symmetrizer, AMR interface, or
live-runtime writeback.

The repository stores ``chi = phi**2`` and therefore evolves ``ln(phi)`` via
``0.5*ln(chi)`` when converting to and from the existing 25-slot state.
"""

from __future__ import annotations

from dataclasses import dataclass, replace
import math
from typing import Callable, Literal

import numpy as np

from .bssn3d import _d1
from .ccz4_reference import GaugeConfig
from .fo_ccz4_constraint_control import (
    CONTROL_METADATA_KEY,
    constraint_control_identity,
    require_matching_constraint_control,
    validate_tau_inverse,
)
from .fo_ccz4_gauge_profile import (
    FOCCZ4GaugeProfile,
    PROFILE_METADATA_KEY,
    require_matching_gauge_profile,
)
from .fo_ccz4 import (
    FOCCZ4Auxiliary3D,
    _state_sha256,
    build_fo_ccz4_auxiliary_3d,
    fo_ccz4_ordering_constraints_3d,
)
from .nr3d import Array, BSSNState3D, Grid3D, outer_boundary_mask


FirstDerivative = Callable[[Array, BSSNState3D, int], Array]


@dataclass(frozen=True)
class FOCCZ4Config:
    """Parameters specific to the first-order CCZ4 reduction."""

    kappa1: float = 0.1
    kappa2: float = 0.0
    kappa3: float = 1.0
    cleaning_speed: float = 1.0
    ordering_mu: float = 1.0
    shift_strength: float = 1.0
    tau_inverse: float = 0.0
    k0: float = 0.0
    c: float = 1.0

    def __post_init__(self) -> None:
        validate_tau_inverse(self.tau_inverse)
        for name in (
            "kappa1",
            "kappa2",
            "kappa3",
            "cleaning_speed",
            "ordering_mu",
            "shift_strength",
            "tau_inverse",
            "k0",
            "c",
        ):
            value = float(getattr(self, name))
            if not math.isfinite(value):
                raise ValueError(f"{name} must be finite")
        if self.kappa1 < 0.0:
            raise ValueError("kappa1 must be non-negative")
        if self.kappa2 <= -1.0:
            raise ValueError("kappa2 must be greater than -1")
        if self.cleaning_speed <= 0.0:
            raise ValueError("cleaning_speed must be positive")
        if self.ordering_mu <= 0.0:
            raise ValueError("ordering_mu must be positive")
        if self.shift_strength not in (0.0, 1.0):
            raise ValueError("shift_strength must be 0 or 1")
        if self.tau_inverse < 0.0:
            raise ValueError("tau_inverse must be non-negative")
        if self.c < 0.0:
            raise ValueError("c must be non-negative")


@dataclass(frozen=True)
class FOCCZ4State3D:
    """A 58-field FO-CCZ4 state represented by a base state plus auxiliaries."""

    base: BSSNState3D
    auxiliary: FOCCZ4Auxiliary3D

    def __post_init__(self) -> None:
        if self.base.formulation != "ccz4":
            raise ValueError("FOCCZ4State3D requires a CCZ4 base state")
        if tuple(self.base.grid.shape) != self.auxiliary.lapse_gradient.shape[:3]:
            raise ValueError("FO-CCZ4 auxiliary fields do not match the base grid")
        if self.auxiliary.derivative_order != self.base.grid.spatial_order:
            raise ValueError("FO-CCZ4 derivative order does not match the base grid")

    @classmethod
    def from_bssn_state(cls, state: BSSNState3D) -> "FOCCZ4State3D":
        return cls(state, build_fo_ccz4_auxiliary_3d(state))

    @property
    def grid(self):
        return self.base.grid

    def to_bssn_state(self) -> BSSNState3D:
        return self.base


@dataclass(frozen=True)
class FOCCZ4RHS3D:
    """RHS for the 25 base fields plus the 33 FO auxiliary fields."""

    h: Array
    ln_lapse: Array
    shift: Array
    ln_phi: Array
    a: Array
    trace_k: Array
    theta: Array
    conformal_gamma: Array
    b: Array
    lapse_gradient: Array
    shift_gradient: Array
    metric_gradient: Array
    conformal_factor_gradient: Array

    def __post_init__(self) -> None:
        for name in (
            "h",
            "ln_lapse",
            "shift",
            "ln_phi",
            "a",
            "trace_k",
            "theta",
            "conformal_gamma",
            "b",
            "lapse_gradient",
            "shift_gradient",
            "metric_gradient",
            "conformal_factor_gradient",
        ):
            value = np.asarray(getattr(self, name), dtype=np.float64)
            if value.size == 0 or not np.all(np.isfinite(value)):
                raise ValueError(f"{name} RHS must be finite and non-empty")
            object.__setattr__(self, name, value)


@dataclass(frozen=True)
class FOCCZ4RobustStabilitySample3D:
    """One checkpoint from the seeded FO-CCZ4 robust-stability campaign.

    The campaign is deliberately a small-noise engineering diagnostic around
    Minkowski space.  It is not a strong-field, long-time, or physical
    black-hole validation result.
    """

    step: int
    time: float
    perturbation_l2: float
    growth_ratio: float
    hamiltonian_l2: float
    momentum_l2: float
    conformal_gamma_l_inf: float
    theta_l_inf: float
    ordering_curl_l_inf: float
    min_chi: float
    min_lapse: float
    constraint_norms_finite: bool
    finite_positive_state: bool
    auxiliary_sha256: str


@dataclass(frozen=True)
class FOCCZ4RobustStabilityReport3D:
    """Deterministic seeded robust-stability evidence for the FO shadow."""

    points: int
    spatial_order: int
    dt: float
    amplitude: float
    seed: int
    growth_limit: float
    checkpoints: tuple[int, ...]
    samples: tuple[FOCCZ4RobustStabilitySample3D, ...]
    method: str = "fo-ccz4-minkowski-small-noise-rk4-checkpoint-v1"

    @property
    def passed(self) -> bool:
        """Return the bounded engineering gate, never a physical-validity claim."""

        if not self.samples:
            return False
        return all(
            sample.finite_positive_state
            and sample.constraint_norms_finite
            and math.isfinite(sample.growth_ratio)
            and sample.growth_ratio <= self.growth_limit
            for sample in self.samples
        )


def _sym_first(
    field: Array, state: BSSNState3D, derivative: FirstDerivative = _d1,
) -> Array:
    """Return symmetrized derivatives ``d_(i field_j)``."""

    result = np.empty((*state.grid.shape, 3, 3), dtype=np.float64)
    for first in range(3):
        for second in range(3):
            result[..., first, second] = 0.5 * (
                derivative(field[..., second], state, first)
                + derivative(field[..., first], state, second)
            )
    return result


def _sym_shift_gradient(
    field: Array, state: BSSNState3D, derivative: FirstDerivative = _d1,
) -> Array:
    """Return ``d_(k B_{j)}^i`` with B indexed as ``B_k^i``."""

    result = np.empty((*state.grid.shape, 3, 3, 3), dtype=np.float64)
    for derivative_component in range(3):
        for first in range(3):
            for second in range(3):
                result[..., derivative_component, first, second] = 0.5 * (
                    derivative(field[..., second, derivative_component], state, first)
                    + derivative(field[..., first, derivative_component], state, second)
                )
    return result


def _sym_metric_gradient(
    field: Array, state: BSSNState3D, derivative: FirstDerivative = _d1,
) -> Array:
    """Return ``d_(k D_{l)ij}`` with D indexed as ``D_kij``."""

    result = np.empty((*state.grid.shape, 3, 3, 3, 3), dtype=np.float64)
    for first in range(3):
        for second in range(3):
            for i in range(3):
                for j in range(3):
                    result[..., first, second, i, j] = 0.5 * (
                        derivative(field[..., second, i, j], state, first)
                        + derivative(field[..., first, i, j], state, second)
                    )
    return result


def _geometry(
    state: FOCCZ4State3D,
    first_derivative: FirstDerivative = _d1,
) -> tuple[Array, Array, Array, Array, Array, Array, Array, Array, Array, Array, Array]:
    """Build first-order Christoffel/Ricci/Z4 geometry from the 58 fields."""

    base = state.base
    aux = state.auxiliary
    h = base.h
    h_inverse = np.linalg.inv(h)
    d_metric = aux.metric_gradient
    d_upup = np.einsum("...ia,...jb,...kab->...kij", h_inverse, h_inverse, d_metric)
    conformal_christoffel = np.zeros((*base.grid.shape, 3, 3, 3), dtype=np.float64)
    for upper in range(3):
        for first in range(3):
            for second in range(3):
                conformal_christoffel[..., upper, first, second] = np.einsum(
                    "...l,...l->...",
                    h_inverse[..., upper, :],
                    d_metric[..., first, second, :]
                    + d_metric[..., second, first, :]
                    - d_metric[..., :, first, second],
                )
    physical_christoffel = conformal_christoffel.copy()
    for upper in range(3):
        for first in range(3):
            for second in range(3):
                physical_christoffel[..., upper, first, second] -= np.einsum(
                    "...l,...l->...",
                    h_inverse[..., upper, :],
                    h[..., second, :] * aux.conformal_factor_gradient[..., first, None]
                    + h[..., first, :] * aux.conformal_factor_gradient[..., second, None]
                    - h[..., first, second, None] * aux.conformal_factor_gradient,
                )

    d_sym_d = _sym_metric_gradient(aux.metric_gradient, base, first_derivative)
    d_conformal_christoffel = np.zeros(
        (*base.grid.shape, 3, 3, 3, 3), dtype=np.float64
    )
    for derivative in range(3):
        for upper in range(3):
            for first in range(3):
                for second in range(3):
                    algebraic = np.einsum(
                        "...l,...l->...",
                        d_upup[..., derivative, upper, :],
                        d_metric[..., first, second, :]
                        + d_metric[..., second, first, :]
                        - d_metric[..., :, first, second],
                    )
                    differential = np.einsum(
                        "...l,...l->...",
                        h_inverse[..., upper, :],
                        d_sym_d[..., derivative, first, :, second]
                        + d_sym_d[..., derivative, second, :, first]
                        - d_sym_d[..., derivative, :, first, second],
                    )
                    d_conformal_christoffel[..., derivative, upper, first, second] = (
                        -2.0 * algebraic + differential
                    )

    d_physical_christoffel = np.zeros_like(d_conformal_christoffel)
    p = aux.conformal_factor_gradient
    d_sym_p = _sym_first(p, base, first_derivative)
    for derivative in range(3):
        for upper in range(3):
            for first in range(3):
                for second in range(3):
                    first_term = np.zeros(base.grid.shape, dtype=np.float64)
                    for metric_index in range(3):
                        first_term -= 2.0 * d_upup[..., derivative, upper, metric_index] * (
                            d_metric[..., first, second, metric_index]
                            + d_metric[..., second, first, metric_index]
                            - d_metric[..., metric_index, first, second]
                        )
                    term = np.einsum(
                        "...l,...l->...",
                        d_upup[..., derivative, upper, :],
                        h[..., second, :] * p[..., first, None]
                        + h[..., first, :] * p[..., second, None]
                        - h[..., first, second, None] * p,
                    )
                    term = 2.0 * term
                    term -= np.einsum(
                        "...l,...l->...",
                        h_inverse[..., upper, :],
                        d_metric[..., derivative, second, :] * p[..., first, None]
                        + d_metric[..., derivative, first, :] * p[..., second, None]
                        - d_metric[..., derivative, first, second, None] * p,
                    ) * 2.0
                    term += np.einsum(
                        "...l,...l->...",
                        h_inverse[..., upper, :],
                        d_sym_d[..., derivative, first, :, second]
                        + d_sym_d[..., derivative, second, :, first]
                        - d_sym_d[..., derivative, :, first, second],
                    )
                    term -= np.einsum(
                        "...l,...l->...",
                        h_inverse[..., upper, :],
                        h[..., second, :] * d_sym_p[..., derivative, first, None]
                        + h[..., first, :] * d_sym_p[..., derivative, second, None]
                        - h[..., first, second, None] * d_sym_p[..., derivative, :],
                    )
                    d_physical_christoffel[..., derivative, upper, first, second] = (
                        first_term + term
                    )

    ricci = np.zeros((*base.grid.shape, 3, 3), dtype=np.float64)
    for first in range(3):
        for second in range(3):
            value = np.zeros(base.grid.shape, dtype=np.float64)
            for upper in range(3):
                value += (
                    d_physical_christoffel[..., upper, upper, first, second]
                    - d_physical_christoffel[..., second, upper, first, upper]
                )
                for ell in range(3):
                    value += (
                        physical_christoffel[..., ell, first, second]
                        * physical_christoffel[..., upper, ell, upper]
                        - physical_christoffel[..., ell, first, upper]
                        * physical_christoffel[..., upper, ell, second]
                    )
            ricci[..., first, second] = value

    tilde_gamma = np.einsum("...jl,...ijl->...i", h_inverse, conformal_christoffel)
    d_tilde_gamma = np.zeros((*base.grid.shape, 3, 3), dtype=np.float64)
    for derivative in range(3):
        for upper in range(3):
            value = np.zeros(base.grid.shape, dtype=np.float64)
            for first in range(3):
                for second in range(3):
                    value += (
                        -2.0
                        * d_upup[..., derivative, first, second]
                        * conformal_christoffel[..., upper, first, second]
                        + h_inverse[..., first, second]
                        * d_conformal_christoffel[
                            ..., derivative, upper, first, second
                        ]
                    )
            d_tilde_gamma[..., derivative, upper] = value

    gamma_difference = base.conformal_gamma - tilde_gamma
    z_lower = 0.5 * np.einsum("...ij,...j->...i", h, gamma_difference)
    phi_squared = base.chi
    z_upper = 0.5 * phi_squared[..., None] * gamma_difference
    d_gamma_hat = [first_derivative(base.conformal_gamma, base, axis) for axis in range(3)]
    covd_z = np.zeros((*base.grid.shape, 3, 3), dtype=np.float64)
    for first in range(3):
        for second in range(3):
            value = np.einsum(
                "...l,...l->...", aux.metric_gradient[..., first, second, :], gamma_difference
            )
            value += 0.5 * np.einsum(
                "...l,...l->...",
                h[..., second, :],
                d_gamma_hat[first] - d_tilde_gamma[..., first, :],
            )
            value -= np.einsum(
                "...l,...l->...",
                physical_christoffel[..., :, first, second],
                z_lower,
            )
            covd_z[..., first, second] = value
    ricci_z = ricci + covd_z + np.swapaxes(covd_z, -1, -2)
    ricci_z_scalar = phi_squared * np.einsum("...ij,...ij->...", h_inverse, ricci_z)
    return (
        h_inverse,
        conformal_christoffel,
        physical_christoffel,
        d_physical_christoffel,
        ricci,
        ricci_z,
        ricci_z_scalar,
        tilde_gamma,
        d_tilde_gamma,
        z_lower,
        z_upper,
    )


def _apply_sommerfeld_proxy_rhs_fo_3d(
    state: FOCCZ4State3D,
    rhs: FOCCZ4RHS3D,
    *,
    wave_speed: float = 1.0,
    center: tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> FOCCZ4RHS3D:
    """Replace outer-face RHS values with a scalar FO field proxy.

    Every base and auxiliary field is driven toward its Minkowski reference
    with ``-v (n^i d_i u + (u-u_inf)/r)``.  This is intentionally a boundary
    *proxy*: it does not use the characteristic eigenbasis, constraint map, or
    radiative Weyl data, and therefore cannot close the CPBC gate.
    """

    base = state.base
    if base.grid.boundary != "sommerfeld":
        raise ValueError("FO Sommerfeld proxy requires Grid3D(boundary='sommerfeld')")
    if not np.all(base.valid_mask):
        raise ValueError("FO Sommerfeld proxy requires a fully valid state")
    speed = float(wave_speed)
    if not math.isfinite(speed) or speed <= 0.0:
        raise ValueError("wave_speed must be finite and positive")
    if len(center) != 3 or not all(math.isfinite(float(value)) for value in center):
        raise ValueError("center must contain three finite coordinates")

    mask = outer_boundary_mask(base.grid)
    coordinates = base.grid.coordinates
    offset = np.stack(
        [axis - float(origin) for axis, origin in zip(coordinates, center)],
        axis=-1,
    )
    radius = np.linalg.norm(offset, axis=-1)
    radial_unit = np.zeros_like(offset)
    nonzero = radius > 0.0
    radial_unit[nonzero] = offset[nonzero] / radius[nonzero, None]
    radius_safe = np.maximum(radius, min(base.grid.spacing))

    fields: dict[str, Array] = {
        "h": base.h,
        "ln_lapse": np.log(base.lapse),
        "shift": base.shift,
        "ln_phi": 0.5 * np.log(base.chi),
        "a": base.a,
        "trace_k": base.trace_k,
        "theta": base.theta,
        "conformal_gamma": base.conformal_gamma,
        "b": base.b,
        "lapse_gradient": state.auxiliary.lapse_gradient,
        "shift_gradient": state.auxiliary.shift_gradient,
        "metric_gradient": state.auxiliary.metric_gradient,
        "conformal_factor_gradient": state.auxiliary.conformal_factor_gradient,
    }
    references: dict[str, Array] = {
        "h": np.broadcast_to(np.eye(3, dtype=np.float64), base.h.shape).copy(),
        "ln_lapse": np.zeros_like(base.lapse),
        "shift": np.zeros_like(base.shift),
        "ln_phi": np.zeros_like(base.chi),
        "a": np.zeros_like(base.a),
        "trace_k": np.zeros_like(base.trace_k),
        "theta": np.zeros_like(base.theta),
        "conformal_gamma": np.zeros_like(base.conformal_gamma),
        "b": np.zeros_like(base.b),
        "lapse_gradient": np.zeros_like(state.auxiliary.lapse_gradient),
        "shift_gradient": np.zeros_like(state.auxiliary.shift_gradient),
        "metric_gradient": np.zeros_like(state.auxiliary.metric_gradient),
        "conformal_factor_gradient": np.zeros_like(
            state.auxiliary.conformal_factor_gradient
        ),
    }
    updated: dict[str, Array] = {}
    for name, field in fields.items():
        gradients = [_d1(field, base, axis) for axis in range(3)]
        field_tail = (None,) * (field.ndim - 3)
        radial_derivative = sum(
            radial_unit[..., axis][(...,) + field_tail] * gradients[axis]
            for axis in range(3)
        )
        radius_scale = radius_safe[(...,) + field_tail]
        boundary_rhs = -speed * (
            radial_derivative + (field - references[name]) / radius_scale
        )
        replaced = np.asarray(getattr(rhs, name), dtype=np.float64).copy()
        replaced[mask] = boundary_rhs[mask]
        updated[name] = replaced
    return FOCCZ4RHS3D(**updated)


def fo_ccz4_rhs_3d(
    state: FOCCZ4State3D,
    *,
    gauge: GaugeConfig = GaugeConfig(theta_coupling=2.0),
    config: FOCCZ4Config = FOCCZ4Config(),
    boundary_mode: Literal["periodic", "sommerfeld-proxy", "schwarzschild-dirichlet"] = "periodic",
    gauge_profile: FOCCZ4GaugeProfile | None = None,
) -> FOCCZ4RHS3D:
    """Evaluate the first-order-in-space FO-CCZ4 shadow RHS.

    The default :class:`GaugeConfig` retains the legacy ``f=3/4`` value for
    cross-check compatibility.  The FO principal-symbol audit uses the
    flat-point choice ``f=1``, which also has nonflat degeneracies and must not
    be treated as a universal repair. ``gauge_profile`` opts into a separate
    experimental field-dependent family, overriding only constant f and mu.
    No profile is enabled by default, and none has earned live promotion.
    ``boundary_mode='sommerfeld-proxy'`` is available only on a Sommerfeld
    grid and applies the explicit scalar proxy; it is not a characteristic
    Einstein boundary.
    """

    if boundary_mode not in ("periodic", "sommerfeld-proxy", "schwarzschild-dirichlet"):
        raise ValueError("unsupported FO-CCZ4 boundary mode")
    base = state.base
    require_matching_gauge_profile(base.metadata, gauge_profile)
    require_matching_constraint_control(base.metadata, config.tau_inverse)
    if gauge_profile is not None:
        gauge_profile.validate_formulation(gauge, config)
        gauge_profile.coefficients(base.lapse, base.chi)
    if not np.all(base.valid_mask):
        raise ValueError("FO-CCZ4 RHS requires a fully valid state")
    if base.grid.boundary == "periodic" and boundary_mode != "periodic":
        raise ValueError("periodic FO-CCZ4 grids require boundary_mode='periodic'")
    if base.grid.boundary == "sommerfeld" and boundary_mode != "sommerfeld-proxy":
        raise ValueError(
            "Sommerfeld FO-CCZ4 grids require boundary_mode='sommerfeld-proxy'"
        )
    if (boundary_mode == "schwarzschild-dirichlet") != (base.grid.boundary == "schwarzschild-dirichlet"):
        raise ValueError("Schwarzschild boundary mode/grid mismatch")
    if base.grid.boundary not in ("periodic", "sommerfeld", "schwarzschild-dirichlet"):
        raise ValueError("FO-CCZ4 RHS requires periodic or Sommerfeld boundaries")
    if boundary_mode == "schwarzschild-dirichlet":
        from .fo_ccz4_checkpoint import state_slots
        from .fo_ccz4_schwarzschild import domain_from_state, require_analytic_halo
        require_analytic_halo(state_slots(state), domain_from_state(base), base.grid.spatial_order)
    if not gauge.advective or gauge.theta_coupling != 2.0 * config.c:
        raise ValueError("FO-CCZ4 requires advective gauge with theta_coupling=2*c")
    rhs = _fo_ccz4_volume_rhs_3d(
        state, gauge=gauge, config=config, gauge_profile=gauge_profile,
    )
    if boundary_mode == "sommerfeld-proxy":
        return _apply_sommerfeld_proxy_rhs_fo_3d(state, rhs)
    if boundary_mode == "schwarzschild-dirichlet":
        from .fo_ccz4_schwarzschild import halo_mask
        mask = halo_mask(base.grid.shape)
        for name in rhs.__dataclass_fields__:
            getattr(rhs, name)[mask] = 0.
    return rhs


def _fo_ccz4_volume_rhs_3d(
    state: FOCCZ4State3D,
    *,
    gauge: GaugeConfig = GaugeConfig(theta_coupling=2.0),
    config: FOCCZ4Config = FOCCZ4Config(),
    gauge_profile: FOCCZ4GaugeProfile | None = None,
    first_derivative: FirstDerivative = _d1,
) -> FOCCZ4RHS3D:
    """Shared nonlinear volume equations; deliberately applies NO boundary data.

    The legacy wrapper owns its boundary validation and enforcement. The SBP
    volume wrapper owns its explicit grid/operator identity. Supplying a spatial
    derivative does not create an IBVP or authorize using the legacy RK driver.
    Derivative callbacks are local arguments, never process-global monkeypatches.
    """
    base, aux = state.base, state.auxiliary
    require_matching_gauge_profile(base.metadata, gauge_profile)
    require_matching_constraint_control(base.metadata, config.tau_inverse)
    if not np.all(base.valid_mask):
        raise ValueError("FO-CCZ4 volume RHS requires a fully valid state")
    if not gauge.advective or gauge.theta_coupling != 2.0 * config.c:
        raise ValueError("FO-CCZ4 requires advective gauge with theta_coupling=2*c")
    shift_f, ordering_mu = gauge.shift_coefficient, config.ordering_mu
    if gauge_profile is not None:
        gauge_profile.validate_formulation(gauge, config)
        shift_f, ordering_mu = gauge_profile.coefficients(base.lapse, base.chi)
    h_inverse, conformal_christoffel, physical_christoffel, _, ricci, ricci_z, scalar, tilde_gamma, _, z_lower, z_upper = _geometry(state, first_derivative)
    alpha = base.lapse
    phi_squared = base.chi
    beta = base.shift
    trace_a = np.einsum("...ij,...ij->...", h_inverse, base.a)
    a_upup = np.einsum("...ia,...jb,...ab->...ij", h_inverse, h_inverse, base.a)
    d_a = [first_derivative(base.a, base, axis) for axis in range(3)]
    d_k = [first_derivative(base.trace_k, base, axis) for axis in range(3)]
    d_theta = [first_derivative(base.theta, base, axis) for axis in range(3)]
    d_gamma = [first_derivative(base.conformal_gamma, base, axis) for axis in range(3)]
    d_b = [first_derivative(base.b, base, axis) for axis in range(3)]
    d_shift = aux.shift_gradient
    div_beta = np.trace(d_shift, axis1=-2, axis2=-1)
    d_sym_a = _sym_first(aux.lapse_gradient, base, first_derivative)
    hess_lapse = np.empty((*base.grid.shape, 3, 3), dtype=np.float64)
    for first in range(3):
        for second in range(3):
            hess_lapse[..., first, second] = alpha * (
                aux.lapse_gradient[..., first] * aux.lapse_gradient[..., second]
                - np.einsum(
                    "...k,...k->...",
                    physical_christoffel[..., :, first, second],
                    aux.lapse_gradient,
                )
                + d_sym_a[..., first, second]
            )
    lap_hess = phi_squared * np.einsum("...ij,...ij->...", h_inverse, hess_lapse)
    d_beta_sym = _sym_shift_gradient(aux.shift_gradient, base, first_derivative)
    d_metric_trace_a = np.empty((*base.grid.shape, 3), dtype=np.float64)
    for derivative in range(3):
        d_metric_trace_a[..., derivative] = np.einsum(
            "...ij,...ij->...", h_inverse, d_a[derivative]
        )
    d_upup = np.einsum(
        "...ia,...jb,...kab->...kij",
        h_inverse,
        h_inverse,
        aux.metric_gradient,
    )
    d_a_contract = np.einsum("...kij,...ij->...k", d_upup, base.a)
    h_rhs = np.zeros_like(base.h)
    for first in range(3):
        for second in range(3):
            value = 2.0 * sum(
                beta[..., axis] * aux.metric_gradient[..., axis, first, second]
                for axis in range(3)
            )
            value += sum(
                base.h[..., component, first] * d_shift[..., second, component]
                + base.h[..., component, second] * d_shift[..., first, component]
                for component in range(3)
            )
            value -= (2.0 / 3.0) * base.h[..., first, second] * div_beta
            value -= 2.0 * alpha * (
                base.a[..., first, second]
                - (1.0 / 3.0) * base.h[..., first, second] * trace_a
            )
            value -= config.tau_inverse * (np.linalg.det(base.h) - 1.0) * base.h[
                ..., first, second
            ]
            h_rhs[..., first, second] = value

    ln_lapse_rhs = sum(beta[..., axis] * aux.lapse_gradient[..., axis] for axis in range(3))
    ln_lapse_rhs -= gauge.lapse_coefficient * (
        base.trace_k - config.k0 - 2.0 * config.c * base.theta
    )
    shift_rhs = config.shift_strength * (
        sum(beta[..., axis, None] * d_shift[..., axis, :] for axis in range(3))
        + (gauge.shift_coefficient * base.b if gauge_profile is None else shift_f[..., None] * base.b)
    )
    ln_phi_rhs = sum(beta[..., axis] * aux.conformal_factor_gradient[..., axis] for axis in range(3))
    ln_phi_rhs += (alpha * base.trace_k - div_beta) / 3.0

    c = config.c
    g_times_alpha = gauge.lapse_coefficient
    a_rhs = np.zeros_like(base.a)
    for first in range(3):
        for second in range(3):
            source = phi_squared * (
                -hess_lapse[..., first, second]
                + alpha * ricci_z[..., first, second]
            )
            trace_source = -lap_hess + alpha * scalar
            value = source - (base.h[..., first, second] / 3.0) * trace_source
            value += sum(
                base.a[..., component, first] * d_shift[..., second, component]
                + base.a[..., component, second] * d_shift[..., first, component]
                for component in range(3)
            )
            value -= (2.0 / 3.0) * base.a[..., first, second] * div_beta
            value += alpha * base.a[..., first, second] * (
                base.trace_k - 2.0 * c * base.theta
            )
            value -= 2.0 * alpha * np.einsum(
                "...l,...l->...",
                base.a[..., first, :],
                np.einsum("...lm,...m->...l", h_inverse, base.a[..., :, second]),
            )
            value -= config.tau_inverse * base.h[..., first, second] * trace_a
            value += sum(beta[..., axis] * d_a[axis][..., first, second] for axis in range(3))
            a_rhs[..., first, second] = value

    k_rhs = sum(beta[..., axis] * d_k[axis] for axis in range(3)) - lap_hess
    k_rhs += alpha * scalar + alpha * base.trace_k * (
        base.trace_k - 2.0 * c * base.theta
    )
    k_rhs -= 3.0 * alpha * config.kappa1 * (1.0 + config.kappa2) * base.theta
    theta_rhs = sum(beta[..., axis] * d_theta[axis] for axis in range(3))
    theta_rhs += 0.5 * alpha * config.cleaning_speed**2 * scalar
    theta_rhs += 0.5 * alpha * config.cleaning_speed**2 * (
        -np.einsum("...ij,...ij->...", base.a, a_upup)
        + (2.0 / 3.0) * base.trace_k**2
    )
    theta_rhs -= alpha * c * base.theta * base.trace_k
    theta_rhs -= alpha * np.einsum("...i,...i->...", z_upper, aux.lapse_gradient)
    theta_rhs -= alpha * config.kappa1 * (2.0 + config.kappa2) * base.theta

    gamma_rhs = np.zeros_like(base.conformal_gamma)
    gamma_nonadvective = np.zeros_like(base.conformal_gamma)
    for component in range(3):
        value = sum(beta[..., axis] * d_gamma[axis][..., component] for axis in range(3))
        value -= (4.0 / 3.0) * alpha * sum(
            h_inverse[..., component, axis] * d_k[axis] for axis in range(3)
        )
        value += 2.0 * alpha * sum(
            h_inverse[..., component, axis] * d_theta[axis] for axis in range(3)
        )
        value += config.shift_strength * sum(
            h_inverse[..., first, second] * d_beta_sym[..., component, first, second]
            for first in range(3)
            for second in range(3)
        )
        value += config.shift_strength * (1.0 / 3.0) * sum(
            h_inverse[..., component, first] * d_beta_sym[..., second, first, second]
            for first in range(3)
            for second in range(3)
        )
        value += config.shift_strength * 2.0 * alpha * sum(
            h_inverse[..., component, axis] * d_metric_trace_a[..., axis]
            for axis in range(3)
        )
        value += (2.0 / 3.0) * tilde_gamma[..., component] * div_beta
        value -= sum(tilde_gamma[..., axis] * d_shift[..., axis, component] for axis in range(3))
        value += 2.0 * alpha * (
            sum(
                conformal_christoffel[..., component, first, second]
                * a_upup[..., first, second]
                for first in range(3)
                for second in range(3)
            )
            - 3.0 * sum(a_upup[..., component, axis] * aux.conformal_factor_gradient[..., axis] for axis in range(3))
        )
        value -= 2.0 * alpha * sum(
            h_inverse[..., axis, component]
            * (
                base.theta * aux.lapse_gradient[..., axis]
                + (2.0 / 3.0) * base.trace_k * z_lower[..., axis]
            )
            for axis in range(3)
        )
        value -= 2.0 * sum(a_upup[..., component, axis] * alpha * aux.lapse_gradient[..., axis] for axis in range(3))
        value -= 4.0 * config.shift_strength * alpha * sum(
            h_inverse[..., component, axis] * d_a_contract[..., axis] for axis in range(3)
        )
        value += 2.0 * config.kappa3 * (
            (2.0 / 3.0) * sum(h_inverse[..., component, axis] * z_lower[..., axis] for axis in range(3)) * div_beta
            - sum(
                h_inverse[..., j, k] * z_lower[..., j] * d_shift[..., k, component]
                for j in range(3) for k in range(3)
            )
        )
        value -= 2.0 * alpha * config.kappa1 * sum(
            h_inverse[..., component, axis] * z_lower[..., axis] for axis in range(3)
        )
        gamma_rhs[..., component] = value
        gamma_nonadvective[..., component] = value - sum(
            beta[..., axis] * d_gamma[axis][..., component] for axis in range(3)
        )

    # Auxiliary PDEs.  The expressions deliberately retain the ordering
    # constraint terms rather than silently replacing them with a derivative
    # of the second-order RHS.
    aux_a_rhs = np.zeros_like(aux.lapse_gradient)
    d_a_aux = [first_derivative(aux.lapse_gradient, base, axis) for axis in range(3)]
    d_theta_aux = d_theta
    for derivative in range(3):
        value = sum(beta[..., axis] * d_a_aux[axis][..., derivative] for axis in range(3))
        value -= g_times_alpha * (
            d_k[derivative] - 2.0 * c * d_theta_aux[derivative]
        )
        value -= config.shift_strength * g_times_alpha * d_metric_trace_a[..., derivative]
        value += 2.0 * config.shift_strength * g_times_alpha * d_a_contract[..., derivative]
        value += sum(
            aux.shift_gradient[..., derivative, axis] * aux.lapse_gradient[..., axis]
            for axis in range(3)
        )
        aux_a_rhs[..., derivative] = value

    aux_b_rhs = np.zeros_like(aux.shift_gradient)
    d_b_aux = [first_derivative(aux.shift_gradient, base, axis) for axis in range(3)]
    d_p_aux = [first_derivative(aux.conformal_factor_gradient, base, axis) for axis in range(3)]
    d_d_aux = [first_derivative(aux.metric_gradient, base, axis) for axis in range(3)]
    for derivative in range(3):
        for component in range(3):
            value = config.shift_strength * sum(
                beta[..., axis] * d_b_aux[axis][..., derivative, component]
                for axis in range(3)
            )
            value += config.shift_strength * shift_f * d_b[derivative][..., component]
            if gauge_profile is not None:
                # Product rule for partial_k(f b^i). A=partial ln(alpha),
                # P=partial ln(phi)=0.5*partial ln(chi); this is a SOURCE term.
                value += config.shift_strength * shift_f * (
                    aux.lapse_gradient[..., derivative]
                    + 2.0 * aux.conformal_factor_gradient[..., derivative]
                ) * base.b[..., component]
            curl_p = np.zeros(base.grid.shape, dtype=np.float64)
            curl_d = np.zeros(base.grid.shape, dtype=np.float64)
            for metric_index in range(3):
                curl_p += h_inverse[..., component, metric_index] * (
                    d_p_aux[derivative][..., metric_index]
                    - d_p_aux[metric_index][..., derivative]
                )
                d_term = np.zeros(base.grid.shape, dtype=np.float64)
                for upper_index in range(3):
                    for derivative_index in range(3):
                        d_term += h_inverse[..., upper_index, derivative_index] * (
                            d_d_aux[derivative][
                                ..., derivative_index, metric_index, upper_index
                            ]
                            - d_d_aux[derivative_index][
                                ..., derivative, metric_index, upper_index
                            ]
                        )
                curl_d += h_inverse[..., component, metric_index] * d_term
            # Eq. (12k) places ``-s*(f*d_k b + alpha**2*mu*curl_P -
            # alpha**2*mu*curl_D)`` on the left-hand side.  Moving the
            # non-conservative product to the RHS therefore gives the
            # published ``alpha**2*mu*(curl_P - curl_D)`` ordering term.
            value += config.shift_strength * alpha**2 * ordering_mu * (curl_p - curl_d)
            value += config.shift_strength * sum(
                aux.shift_gradient[..., derivative, axis] * aux.shift_gradient[..., axis, component]
                for axis in range(3)
            )
            aux_b_rhs[..., derivative, component] = value

    aux_d_rhs = np.zeros_like(aux.metric_gradient)
    for derivative in range(3):
        for first in range(3):
            for second in range(3):
                value = sum(
                    beta[..., axis] * d_d_aux[axis][..., derivative, first, second]
                    for axis in range(3)
                )
                value += config.shift_strength * sum(
                    0.5 * (
                        base.h[..., component, first] * d_beta_sym[..., component, derivative, second]
                        + base.h[..., component, second] * d_beta_sym[..., component, derivative, first]
                    )
                    for component in range(3)
                )
                value -= config.shift_strength * (1.0 / 3.0) * base.h[..., first, second] * sum(
                    d_beta_sym[..., axis, derivative, axis] for axis in range(3)
                )
                value -= alpha * d_a[derivative][..., first, second]
                value += (alpha / 3.0) * base.h[..., first, second] * d_metric_trace_a[..., derivative]
                value += sum(
                    aux.shift_gradient[..., derivative, axis] * aux.metric_gradient[..., axis, first, second]
                    + aux.shift_gradient[..., second, axis] * aux.metric_gradient[..., derivative, axis, first]
                    + aux.shift_gradient[..., first, axis] * aux.metric_gradient[..., derivative, axis, second]
                    for axis in range(3)
                )
                value -= (2.0 / 3.0) * div_beta * aux.metric_gradient[..., derivative, first, second]
                value -= (2.0 / 3.0) * alpha * base.h[..., first, second] * d_a_contract[..., derivative]
                value -= alpha * aux.lapse_gradient[..., derivative] * (
                    base.a[..., first, second] - (1.0 / 3.0) * base.h[..., first, second] * trace_a
                )
                aux_d_rhs[..., derivative, first, second] = value

    aux_p_rhs = np.zeros_like(aux.conformal_factor_gradient)
    for derivative in range(3):
        value = sum(beta[..., axis] * d_p_aux[axis][..., derivative] for axis in range(3))
        value += (alpha / 3.0) * d_k[derivative]
        value -= (config.shift_strength / 3.0) * sum(
            d_beta_sym[..., axis, derivative, axis] for axis in range(3)
        )
        value += (config.shift_strength * alpha / 3.0) * d_metric_trace_a[..., derivative]
        value += (alpha / 3.0) * aux.lapse_gradient[..., derivative] * base.trace_k
        value += sum(aux.shift_gradient[..., derivative, axis] * aux.conformal_factor_gradient[..., axis] for axis in range(3))
        value -= config.shift_strength * (2.0 * alpha / 3.0) * d_a_contract[..., derivative]
        aux_p_rhs[..., derivative] = value

    b_rhs = config.shift_strength * (
        gamma_nonadvective - gauge.shift_damping * base.b
        + sum(beta[..., axis, None] * d_b[axis] for axis in range(3))
    )
    rhs = FOCCZ4RHS3D(
        h=h_rhs,
        ln_lapse=ln_lapse_rhs,
        shift=shift_rhs,
        ln_phi=ln_phi_rhs,
        a=a_rhs,
        trace_k=k_rhs,
        theta=theta_rhs,
        conformal_gamma=gamma_rhs,
        b=b_rhs,
        lapse_gradient=aux_a_rhs,
        shift_gradient=aux_b_rhs,
        metric_gradient=aux_d_rhs,
        conformal_factor_gradient=aux_p_rhs,
    )
    return rhs


def _state_add(state: FOCCZ4State3D, rhs: FOCCZ4RHS3D, scale: float) -> FOCCZ4State3D:
    base = state.base
    new_base = BSSNState3D(
        grid=base.grid,
        chi=base.chi * np.exp(2.0 * scale * rhs.ln_phi),
        h=base.h + scale * rhs.h,
        trace_k=base.trace_k + scale * rhs.trace_k,
        a=base.a + scale * rhs.a,
        theta=base.theta + scale * rhs.theta,
        conformal_gamma=base.conformal_gamma + scale * rhs.conformal_gamma,
        lapse=base.lapse * np.exp(scale * rhs.ln_lapse),
        shift=base.shift + scale * rhs.shift,
        b=base.b + scale * rhs.b,
        valid_mask=base.valid_mask.copy(),
        formulation="ccz4",
        metadata=dict(base.metadata),
    )
    auxiliary = FOCCZ4Auxiliary3D(
        lapse_gradient=state.auxiliary.lapse_gradient + scale * rhs.lapse_gradient,
        shift_gradient=state.auxiliary.shift_gradient + scale * rhs.shift_gradient,
        metric_gradient=state.auxiliary.metric_gradient + scale * rhs.metric_gradient,
        conformal_factor_gradient=state.auxiliary.conformal_factor_gradient
        + scale * rhs.conformal_factor_gradient,
        derivative_order=state.auxiliary.derivative_order,
        source_state_sha256=_state_sha256(new_base),
    )
    return FOCCZ4State3D(new_base, auxiliary)


def _state_rk4_update(
    state: FOCCZ4State3D,
    dt: float,
    k1: FOCCZ4RHS3D,
    k2: FOCCZ4RHS3D,
    k3: FOCCZ4RHS3D,
    k4: FOCCZ4RHS3D,
) -> FOCCZ4State3D:
    def combine(base: Array, first: Array, second: Array, third: Array, fourth: Array) -> Array:
        return base + (dt / 6.0) * (first + 2.0 * second + 2.0 * third + fourth)

    base = state.base
    new_base = BSSNState3D(
        grid=base.grid,
        chi=base.chi * np.exp(
            2.0 * (dt / 6.0) * (k1.ln_phi + 2.0 * k2.ln_phi + 2.0 * k3.ln_phi + k4.ln_phi)
        ),
        h=combine(base.h, k1.h, k2.h, k3.h, k4.h),
        trace_k=combine(base.trace_k, k1.trace_k, k2.trace_k, k3.trace_k, k4.trace_k),
        a=combine(base.a, k1.a, k2.a, k3.a, k4.a),
        theta=combine(base.theta, k1.theta, k2.theta, k3.theta, k4.theta),
        conformal_gamma=combine(
            base.conformal_gamma,
            k1.conformal_gamma,
            k2.conformal_gamma,
            k3.conformal_gamma,
            k4.conformal_gamma,
        ),
        lapse=base.lapse
        * np.exp(
            (dt / 6.0)
            * (k1.ln_lapse + 2.0 * k2.ln_lapse + 2.0 * k3.ln_lapse + k4.ln_lapse)
        ),
        shift=combine(base.shift, k1.shift, k2.shift, k3.shift, k4.shift),
        b=combine(base.b, k1.b, k2.b, k3.b, k4.b),
        valid_mask=base.valid_mask.copy(),
        formulation="ccz4",
        metadata=dict(base.metadata),
    )
    auxiliary = FOCCZ4Auxiliary3D(
        lapse_gradient=combine(
            state.auxiliary.lapse_gradient,
            k1.lapse_gradient,
            k2.lapse_gradient,
            k3.lapse_gradient,
            k4.lapse_gradient,
        ),
        shift_gradient=combine(
            state.auxiliary.shift_gradient,
            k1.shift_gradient,
            k2.shift_gradient,
            k3.shift_gradient,
            k4.shift_gradient,
        ),
        metric_gradient=combine(
            state.auxiliary.metric_gradient,
            k1.metric_gradient,
            k2.metric_gradient,
            k3.metric_gradient,
            k4.metric_gradient,
        ),
        conformal_factor_gradient=combine(
            state.auxiliary.conformal_factor_gradient,
            k1.conformal_factor_gradient,
            k2.conformal_factor_gradient,
            k3.conformal_factor_gradient,
            k4.conformal_factor_gradient,
        ),
        derivative_order=state.auxiliary.derivative_order,
        source_state_sha256=_state_sha256(new_base),
    )
    return FOCCZ4State3D(new_base, auxiliary)


def advance_fo_ccz4_rk4_3d(
    state: FOCCZ4State3D,
    dt: float,
    *,
    steps: int = 1,
    gauge: GaugeConfig = GaugeConfig(theta_coupling=2.0),
    config: FOCCZ4Config = FOCCZ4Config(),
    boundary_mode: Literal["periodic", "sommerfeld-proxy", "schwarzschild-dirichlet"] = "periodic",
    gauge_profile: FOCCZ4GaugeProfile | None = None,
) -> FOCCZ4State3D:
    """Advance the FO-CCZ4 shadow with deterministic classical RK4."""

    if not math.isfinite(float(dt)) or dt <= 0.0:
        raise ValueError("dt must be finite and positive")
    if not isinstance(steps, int) or steps < 1:
        raise ValueError("steps must be a positive integer")
    require_matching_gauge_profile(state.base.metadata, gauge_profile)
    require_matching_constraint_control(state.base.metadata, config.tau_inverse)
    working = state
    if gauge_profile is not None:
        tagged_base = replace(state.base, metadata={
            **state.base.metadata, PROFILE_METADATA_KEY: gauge_profile.identity(),
        })
        working = FOCCZ4State3D(tagged_base, replace(
            state.auxiliary, source_state_sha256=_state_sha256(tagged_base),
        ))
    if config.tau_inverse > 0.:
        tagged_base = replace(working.base, metadata={
            **working.base.metadata,
            CONTROL_METADATA_KEY: constraint_control_identity(config.tau_inverse),
        })
        working = FOCCZ4State3D(tagged_base, replace(
            working.auxiliary, source_state_sha256=_state_sha256(tagged_base),
        ))
    for _ in range(steps):
        k1 = fo_ccz4_rhs_3d(
            working, gauge=gauge, config=config, boundary_mode=boundary_mode, gauge_profile=gauge_profile
        )
        k2 = fo_ccz4_rhs_3d(
            _state_add(working, k1, 0.5 * dt),
            gauge=gauge,
            config=config,
            boundary_mode=boundary_mode,
            gauge_profile=gauge_profile,
        )
        k3 = fo_ccz4_rhs_3d(
            _state_add(working, k2, 0.5 * dt),
            gauge=gauge,
            config=config,
            boundary_mode=boundary_mode,
            gauge_profile=gauge_profile,
        )
        k4 = fo_ccz4_rhs_3d(
            _state_add(working, k3, dt),
            gauge=gauge,
            config=config,
            boundary_mode=boundary_mode,
            gauge_profile=gauge_profile,
        )
        working = _state_rk4_update(working, dt, k1, k2, k3, k4)
    return working


def _fo_ccz4_perturbation_l2(state: FOCCZ4State3D) -> float:
    """Measure the base-state distance from Minkowski in a fixed contract."""

    identity = np.eye(3, dtype=np.float64)
    values = (
        state.base.chi - 1.0,
        state.base.h - identity,
        state.base.trace_k,
        state.base.a,
        state.base.theta,
        state.base.conformal_gamma,
        state.base.lapse - 1.0,
        state.base.shift,
        state.base.b,
    )
    return float(np.sqrt(sum(np.mean(value * value) for value in values)))


def fo_ccz4_robust_stability_campaign_3d(
    *,
    points: int = 9,
    dt: float = 1.0e-3,
    checkpoints: tuple[int, ...] = (1, 3, 6, 10),
    amplitude: float = 1.0e-6,
    seed: int = 42,
    spatial_order: int = 2,
    growth_limit: float = 10.0,
    gauge: GaugeConfig = GaugeConfig(theta_coupling=2.0),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
) -> FOCCZ4RobustStabilityReport3D:
    """Run a deterministic small-noise FO-CCZ4 robustness campaign.

    The seeded perturbation is applied to a periodic Minkowski state and
    advanced cumulatively with the same classical RK4 path used by K1.  The
    result records positivity, finite-state, constraint, ordering, and
    perturbation-growth diagnostics at fixed checkpoints.  Passing this gate
    is engineering evidence only; it does not establish strong
    hyperbolicity, a physical boundary, long-time stability, or black-hole
    accuracy.
    """

    if not isinstance(points, int) or points < 7:
        raise ValueError("points must be an integer of at least seven")
    if not math.isfinite(float(dt)) or dt <= 0.0:
        raise ValueError("dt must be finite and positive")
    if not checkpoints or any(not isinstance(step, int) or step < 1 for step in checkpoints):
        raise ValueError("checkpoints must contain positive integer steps")
    if any(right <= left for left, right in zip(checkpoints, checkpoints[1:])):
        raise ValueError("checkpoints must be strictly increasing")
    if not math.isfinite(float(amplitude)) or amplitude <= 0.0 or amplitude >= 0.25:
        raise ValueError("amplitude must be finite, positive, and below 0.25")
    if not isinstance(seed, int):
        raise ValueError("seed must be an integer")
    if spatial_order not in (2, 4):
        raise ValueError("spatial_order must be 2 or 4")
    if not math.isfinite(float(growth_limit)) or growth_limit <= 0.0:
        raise ValueError("growth_limit must be finite and positive")

    # Import locally to keep this RHS module independent from the package's
    # public re-export order and to avoid introducing an import cycle.
    from .constraints3d import constraint_report_3d

    grid = Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
        spatial_order=spatial_order,
    )
    state = BSSNState3D.minkowski(grid, formulation="ccz4")
    rng = np.random.default_rng(seed)
    state.chi += amplitude * rng.normal(size=grid.shape)
    state.lapse += amplitude * rng.normal(size=grid.shape)
    state.trace_k += amplitude * rng.normal(size=grid.shape)
    state.theta += 0.1 * amplitude * rng.normal(size=grid.shape)
    state.conformal_gamma += amplitude * rng.normal(size=(*grid.shape, 3))
    state.shift += amplitude * rng.normal(size=(*grid.shape, 3))
    state.b += amplitude * rng.normal(size=(*grid.shape, 3))
    for diagonal in range(3):
        state.h[..., diagonal, diagonal] += amplitude * rng.normal(size=grid.shape)

    working = FOCCZ4State3D.from_bssn_state(state)
    initial_norm = _fo_ccz4_perturbation_l2(working)
    if not math.isfinite(initial_norm) or initial_norm <= 0.0:
        raise AssertionError("seeded perturbation must have a positive finite norm")
    samples: list[FOCCZ4RobustStabilitySample3D] = []
    completed = 0
    for target in checkpoints:
        working = advance_fo_ccz4_rk4_3d(
            working,
            dt,
            steps=target - completed,
            gauge=gauge,
            config=config,
            boundary_mode="periodic",
        )
        completed = target
        constraint = constraint_report_3d(working.base)
        ordering = fo_ccz4_ordering_constraints_3d(working.base, working.auxiliary)
        constraint_norms = tuple(float(value) for value in constraint.norms.values())
        constraint_norms_finite = all(math.isfinite(value) for value in constraint_norms)
        determinant = np.linalg.det(working.base.h)
        finite_positive = bool(
            np.all(np.isfinite(working.base.chi))
            and np.all(np.isfinite(working.base.lapse))
            and np.all(np.isfinite(working.base.h))
            and np.all(np.isfinite(working.base.a))
            and np.all(np.isfinite(working.base.trace_k))
            and np.all(np.isfinite(working.base.theta))
            and np.all(np.isfinite(determinant))
            and np.all(working.base.chi > 0.0)
            and np.all(working.base.lapse > 0.0)
            and np.all(determinant > 0.0)
            and ordering.finite
            and constraint_norms_finite
        )
        perturbation_norm = _fo_ccz4_perturbation_l2(working)
        samples.append(
            FOCCZ4RobustStabilitySample3D(
                step=target,
                time=float(target * dt),
                perturbation_l2=perturbation_norm,
                growth_ratio=float(perturbation_norm / initial_norm),
                hamiltonian_l2=float(constraint.norms["hamiltonian_l2"]),
                momentum_l2=float(constraint.norms["momentum_l2"]),
                conformal_gamma_l_inf=float(
                    constraint.norms["conformal_gamma_l_inf"]
                ),
                theta_l_inf=float(constraint.norms["theta_l_inf"]),
                ordering_curl_l_inf=float(ordering.max_curl_l_inf),
                min_chi=float(np.min(working.base.chi)),
                min_lapse=float(np.min(working.base.lapse)),
                constraint_norms_finite=constraint_norms_finite,
                finite_positive_state=finite_positive,
                auxiliary_sha256=ordering.auxiliary_sha256,
            )
        )
    return FOCCZ4RobustStabilityReport3D(
        points=points,
        spatial_order=spatial_order,
        dt=float(dt),
        amplitude=float(amplitude),
        seed=seed,
        growth_limit=float(growth_limit),
        checkpoints=tuple(checkpoints),
        samples=tuple(samples),
    )


__all__ = [
    "FOCCZ4Config",
    "FOCCZ4State3D",
    "FOCCZ4RHS3D",
    "FOCCZ4RobustStabilitySample3D",
    "FOCCZ4RobustStabilityReport3D",
    "fo_ccz4_rhs_3d",
    "advance_fo_ccz4_rk4_3d",
    "fo_ccz4_robust_stability_campaign_3d",
]
