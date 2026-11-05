"""NR-K1 CCZ4/BSSN state, gauge, boundary, and constraint reference.

This module is the equation-contract layer for the future method-of-lines
solver.  It deliberately implements the parts that can be independently
checked now:

* the shared CCZ4/BSSN state layout;
* advective 1+log slicing and Gamma-driver gauge RHS terms;
* explicit 1-D boundary policies;
* algebraic, Hamiltonian, momentum, and conformal-connection constraints.

It does *not* claim to implement the complete CCZ4 geometric RHS yet.  The
``gauge_rhs`` function accepts the geometric ``dGamma_dt`` term as an input
so the later evolution module can be checked against this contract rather than
silently substituting a frozen-metric toy model.

The reference uses a Cartesian 1-D reduction: all fields depend on x only,
while tensors retain their full three-dimensional components.  Units are
geometric (G = c = 1), and vacuum matter sources are assumed unless a future
matter module extends the constraint evaluator.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Literal, Mapping

import numpy as np


Array = np.ndarray
BoundaryKind = Literal["periodic", "reflective", "sommerfeld"]
Formulation = Literal["ccz4", "bssnok"]


CCZ4_STATE_VARIABLES: tuple[str, ...] = (
    "chi",
    "h11",
    "h12",
    "h13",
    "h22",
    "h23",
    "h33",
    "K",
    "A11",
    "A12",
    "A13",
    "A22",
    "A23",
    "A33",
    "Theta",
    "Gamma1",
    "Gamma2",
    "Gamma3",
    "lapse",
    "shift1",
    "shift2",
    "shift3",
    "B1",
    "B2",
    "B3",
)


def _finite_scalar(value: float, *, name: str) -> float:
    result = float(value)
    if not math.isfinite(result):
        raise ValueError(f"{name} must be finite")
    return result


def _finite_array(value: Array, *, name: str) -> Array:
    result = np.asarray(value, dtype=np.float64)
    if result.size == 0 or not np.all(np.isfinite(result)):
        raise ValueError(f"{name} must be finite and non-empty")
    return result


@dataclass(frozen=True)
class BoundaryConfig1D:
    """Boundary policy for the 1-D reference reduction.

    ``periodic`` uses centered wrapped derivatives.  ``reflective`` mirrors
    even fields at the edge (tensor/vector parity is a later extension).
    ``sommerfeld`` uses a first-order outgoing one-sided edge derivative and
    records the asymptotic value; characteristic radiative ghost filling is a
    K1b task and is not silently implied by this label.
    """

    kind: BoundaryKind = "periodic"
    asymptotic_value: float = 0.0
    outgoing_speed: float = 1.0

    def __post_init__(self) -> None:
        if self.kind not in ("periodic", "reflective", "sommerfeld"):
            raise ValueError(f"unsupported boundary kind: {self.kind}")
        if not math.isfinite(self.asymptotic_value):
            raise ValueError("asymptotic_value must be finite")
        if not math.isfinite(self.outgoing_speed) or self.outgoing_speed <= 0.0:
            raise ValueError("outgoing_speed must be finite and positive")


@dataclass(frozen=True)
class Grid1D:
    """Uniform Cartesian 1-D grid for the reference equations."""

    points: int
    x_min: float
    x_max: float
    boundary: BoundaryConfig1D = BoundaryConfig1D()

    def __post_init__(self) -> None:
        if self.points < 5:
            raise ValueError("Grid1D requires at least five points")
        if not math.isfinite(self.x_min) or not math.isfinite(self.x_max):
            raise ValueError("grid bounds must be finite")
        if self.x_max <= self.x_min:
            raise ValueError("x_max must be greater than x_min")

    @property
    def dx(self) -> float:
        if self.boundary.kind == "periodic":
            return (self.x_max - self.x_min) / self.points
        return (self.x_max - self.x_min) / (self.points - 1)

    @property
    def x(self) -> Array:
        return np.linspace(
            self.x_min,
            self.x_max,
            self.points,
            endpoint=self.boundary.kind != "periodic",
            dtype=np.float64,
        )


@dataclass(frozen=True)
class GaugeConfig:
    """Advective 1+log and Gamma-driver gauge parameters.

    ``theta_coupling=2`` is the CCZ4 moving-puncture convention; BSSNOK has
    ``Theta=0`` and therefore reduces to the usual ``-2 alpha K`` lapse term.
    """

    lapse_driver: Literal["one-plus-log"] = "one-plus-log"
    lapse_coefficient: float = 2.0
    shift_driver: Literal["gamma-driver"] = "gamma-driver"
    shift_coefficient: float = 0.75
    shift_damping: float = 1.0
    theta_coupling: float = 2.0
    advective: bool = True

    def __post_init__(self) -> None:
        if self.lapse_driver != "one-plus-log":
            raise ValueError("NR-K1 only defines the 1+log lapse driver")
        if self.shift_driver != "gamma-driver":
            raise ValueError("NR-K1 only defines the Gamma-driver shift")
        if not math.isfinite(self.lapse_coefficient) or self.lapse_coefficient <= 0.0:
            raise ValueError("lapse_coefficient must be finite and positive")
        if not math.isfinite(self.shift_coefficient) or self.shift_coefficient <= 0.0:
            raise ValueError("shift_coefficient must be finite and positive")
        if not math.isfinite(self.shift_damping) or self.shift_damping < 0.0:
            raise ValueError("shift_damping must be finite and non-negative")
        if not math.isfinite(self.theta_coupling) or self.theta_coupling < 0.0:
            raise ValueError("theta_coupling must be finite and non-negative")


@dataclass
class CCZ4State1D:
    """Full CCZ4/BSSN state layout on a Cartesian 1-D reduction."""

    grid: Grid1D
    chi: Array
    h: Array
    trace_k: Array
    a: Array
    theta: Array
    conformal_gamma: Array
    lapse: Array
    shift: Array
    b: Array
    formulation: Formulation = "ccz4"

    def __post_init__(self) -> None:
        n = self.grid.points
        expected = {
            "chi": (n,),
            "h": (n, 3, 3),
            "trace_k": (n,),
            "a": (n, 3, 3),
            "theta": (n,),
            "conformal_gamma": (n, 3),
            "lapse": (n,),
            "shift": (n, 3),
            "b": (n, 3),
        }
        for name, shape in expected.items():
            value = _finite_array(getattr(self, name), name=name)
            if value.shape != shape:
                raise ValueError(f"{name} must have shape {shape}, received {value.shape}")
            setattr(self, name, value)
        if self.formulation not in ("ccz4", "bssnok"):
            raise ValueError(f"unsupported formulation: {self.formulation}")
        if np.any(self.chi <= 0.0):
            raise ValueError("chi must be strictly positive")
        if np.any(self.lapse <= 0.0):
            raise ValueError("lapse must be strictly positive")
        if not np.allclose(self.h, np.swapaxes(self.h, 1, 2), rtol=0.0, atol=1.0e-13):
            raise ValueError("conformal metric h must be symmetric")
        if not np.allclose(self.a, np.swapaxes(self.a, 1, 2), rtol=0.0, atol=1.0e-13):
            raise ValueError("conformal extrinsic curvature A must be symmetric")

    @classmethod
    def minkowski(
        cls,
        grid: Grid1D,
        *,
        formulation: Formulation = "ccz4",
    ) -> "CCZ4State1D":
        n = grid.points
        identity = np.broadcast_to(np.eye(3, dtype=np.float64), (n, 3, 3)).copy()
        zeros = np.zeros(n, dtype=np.float64)
        vectors = np.zeros((n, 3), dtype=np.float64)
        return cls(
            grid=grid,
            chi=np.ones(n, dtype=np.float64),
            h=identity,
            trace_k=zeros.copy(),
            a=np.zeros((n, 3, 3), dtype=np.float64),
            theta=zeros.copy(),
            conformal_gamma=vectors.copy(),
            lapse=np.ones(n, dtype=np.float64),
            shift=vectors.copy(),
            b=vectors.copy(),
            formulation=formulation,
        )

    @property
    def boundary_contract(self) -> str:
        return self.grid.boundary.kind

    @property
    def variable_names(self) -> tuple[str, ...]:
        return CCZ4_STATE_VARIABLES


@dataclass(frozen=True)
class GaugeRHS1D:
    """Gauge-only RHS terms with the geometric Gamma RHS supplied separately."""

    lapse: Array
    shift: Array
    b: Array
    geometric_gamma_rhs_supplied: bool


def _d1(values: Array, grid: Grid1D) -> Array:
    """First derivative along x with an explicit boundary policy."""

    data = np.asarray(values, dtype=np.float64)
    if data.shape[0] != grid.points:
        raise ValueError("values do not match grid points")
    dx = grid.dx
    if grid.boundary.kind == "periodic":
        return (np.roll(data, -1, axis=0) - np.roll(data, 1, axis=0)) / (2.0 * dx)
    if grid.boundary.kind == "reflective":
        padded = np.pad(data, ((1, 1),) + ((0, 0),) * (data.ndim - 1), mode="reflect")
        return (padded[2:] - padded[:-2]) / (2.0 * dx)

    result = np.empty_like(data)
    result[1:-1] = (data[2:] - data[:-2]) / (2.0 * dx)
    result[0] = (data[1] - data[0]) / dx
    result[-1] = (data[-1] - data[-2]) / dx
    return result


def gauge_rhs(
    state: CCZ4State1D,
    gauge: GaugeConfig = GaugeConfig(),
    *,
    geometric_gamma_rhs: Array | None = None,
) -> GaugeRHS1D:
    """Evaluate advective 1+log and Gamma-driver gauge equations.

    With ``beta^x`` denoting the first shift component, the implemented
    equations are:

        ``dt alpha = -mu_L alpha (K - theta_coupling Theta) + beta^x d_x alpha``

    ``dt beta^i = mu_S B^i + beta^x d_x beta^i``

    ``dt B^i = dt Gamma^i - eta B^i + beta^x d_x(B^i - Gamma^i)``.

    ``geometric_gamma_rhs`` is the complete coordinate-time Gamma RHS,
    including its advection.  Subtracting Gamma advection here implements
    the advective Gamma-driver instead of counting that transport twice.

    The geometric ``dt Gamma`` term is required for a coupled evolution.  A
    missing term is represented as zeros but marked in the result, so callers
    cannot mistake this gauge contract for a complete CCZ4 RHS.
    """

    n = state.grid.points
    if geometric_gamma_rhs is None:
        gamma_rhs = np.zeros((n, 3), dtype=np.float64)
        supplied = False
    else:
        gamma_rhs = _finite_array(geometric_gamma_rhs, name="geometric_gamma_rhs")
        if gamma_rhs.shape != (n, 3):
            raise ValueError(f"geometric_gamma_rhs must have shape {(n, 3)}")
        supplied = True

    advect_lapse = state.shift[:, 0] * _d1(state.lapse, state.grid) if gauge.advective else 0.0
    advect_shift = state.shift[:, 0, None] * _d1(state.shift, state.grid) if gauge.advective else 0.0
    advect_b = state.shift[:, 0, None] * _d1(state.b, state.grid) if gauge.advective else 0.0
    advect_gamma = state.shift[:, 0, None] * _d1(state.conformal_gamma, state.grid) if gauge.advective else 0.0

    return GaugeRHS1D(
        lapse=(
            -gauge.lapse_coefficient
            * state.lapse
            * (state.trace_k - gauge.theta_coupling * state.theta)
            + advect_lapse
        ),
        shift=gauge.shift_coefficient * state.b + advect_shift,
        b=gamma_rhs - gauge.shift_damping * state.b + advect_b - advect_gamma,
        geometric_gamma_rhs_supplied=supplied,
    )


@dataclass(frozen=True)
class ConstraintReport1D:
    """Pointwise vacuum constraints and their norm summary."""

    hamiltonian: Array
    momentum: Array
    det_h_minus_one: Array
    trace_a: Array
    conformal_gamma: Array
    theta: Array

    @property
    def norms(self) -> Mapping[str, float]:
        def linf(values: Array) -> float:
            return float(np.max(np.abs(values)))

        def l2(values: Array) -> float:
            return float(np.sqrt(np.mean(values * values)))

        return {
            "hamiltonian_l_inf": linf(self.hamiltonian),
            "hamiltonian_l2": l2(self.hamiltonian),
            "momentum_l_inf": linf(self.momentum),
            "momentum_l2": l2(self.momentum),
            "det_h_l_inf": linf(self.det_h_minus_one),
            "trace_a_l_inf": linf(self.trace_a),
            "conformal_gamma_l_inf": linf(self.conformal_gamma),
            "theta_l_inf": linf(self.theta),
        }


def _christoffel_1d(metric: Array, inverse_metric: Array, grid: Grid1D) -> Array:
    d_metric = _d1(metric, grid)
    gamma = np.zeros((grid.points, 3, 3, 3), dtype=np.float64)
    for k in range(3):
        for i in range(3):
            for j in range(3):
                value = np.zeros(grid.points, dtype=np.float64)
                for ell in range(3):
                    partial_i = d_metric[:, j, ell] if i == 0 else 0.0
                    partial_j = d_metric[:, i, ell] if j == 0 else 0.0
                    partial_ell = d_metric[:, i, j] if ell == 0 else 0.0
                    value += inverse_metric[:, k, ell] * (
                        partial_i + partial_j - partial_ell
                    )
                gamma[:, k, i, j] = 0.5 * value
    return gamma


def _ricci_scalar_1d(metric: Array, inverse_metric: Array, grid: Grid1D) -> Array:
    ricci = _ricci_tensor_1d(metric, inverse_metric, grid)
    return np.einsum("nij,nij->n", inverse_metric, ricci)


def _ricci_tensor_1d(metric: Array, inverse_metric: Array, grid: Grid1D) -> Array:
    """Return the 3-D Ricci tensor for fields depending on x only."""

    gamma = _christoffel_1d(metric, inverse_metric, grid)
    d_gamma = _d1(gamma, grid)
    ricci = np.zeros((grid.points, 3, 3), dtype=np.float64)
    for i in range(3):
        for j in range(3):
            first = d_gamma[:, 0, i, j]
            trace = np.sum(gamma[:, np.arange(3), i, np.arange(3)], axis=1)
            trace_derivative = _d1(trace, grid) if j == 0 else 0.0
            product_one = np.zeros(grid.points, dtype=np.float64)
            product_two = np.zeros(grid.points, dtype=np.float64)
            for k in range(3):
                for ell in range(3):
                    product_one += gamma[:, k, i, j] * gamma[:, ell, k, ell]
                    product_two += gamma[:, ell, i, k] * gamma[:, k, j, ell]
            ricci[:, i, j] = first - trace_derivative + product_one - product_two
    return ricci


def constraint_report(state: CCZ4State1D) -> ConstraintReport1D:
    """Evaluate vacuum BSSN/CCZ4 constraints on the 1-D reduction."""

    h_inverse = np.linalg.inv(state.h)
    det_h = np.linalg.det(state.h)
    physical_metric = state.h / state.chi[:, None, None]
    physical_inverse = state.chi[:, None, None] * h_inverse
    physical_k = (
        state.a + state.h * (state.trace_k / 3.0)[:, None, None]
    ) / state.chi[:, None, None]
    mixed_k = np.einsum("nij,njk->nik", physical_inverse, physical_k)
    k_squared = np.einsum(
        "nij,nkl,nik,njl->n",
        physical_k,
        physical_k,
        physical_inverse,
        physical_inverse,
    )
    scalar_curvature = _ricci_scalar_1d(physical_metric, physical_inverse, state.grid)
    hamiltonian = scalar_curvature + state.trace_k * state.trace_k - k_squared

    d_mixed_k = _d1(mixed_k, state.grid)
    d_trace_k = _d1(state.trace_k, state.grid)
    momentum = np.zeros((state.grid.points, 3), dtype=np.float64)
    christoffel = _christoffel_1d(physical_metric, physical_inverse, state.grid)
    for i in range(3):
        divergence = d_mixed_k[:, 0, i]
        for j in range(3):
            for ell in range(3):
                divergence += (
                    christoffel[:, j, j, ell] * mixed_k[:, ell, i]
                    - christoffel[:, ell, j, i] * mixed_k[:, j, ell]
                )
        momentum[:, i] = divergence - (d_trace_k if i == 0 else 0.0)

    d_h_inverse = _d1(h_inverse, state.grid)
    conformal_gamma_target = -d_h_inverse[:, :, 0]
    conformal_gamma = state.conformal_gamma - conformal_gamma_target
    trace_a = np.einsum("nij,nij->n", h_inverse, state.a)
    return ConstraintReport1D(
        hamiltonian=hamiltonian,
        momentum=momentum,
        det_h_minus_one=det_h - 1.0,
        trace_a=trace_a,
        conformal_gamma=conformal_gamma,
        theta=state.theta,
    )


def ccz4_conformal_momentum_constraint(state: CCZ4State1D) -> Array:
    """Return the formulation-specific CCZ4 conformal momentum row.

    ``constraint_report(state).momentum`` intentionally remains the physical
    ADM momentum constraint for cross-backend parity.  In this reference the
    ``trace_k`` slot is the physical ``K`` used by FO-CCZ4, so the conformal
    row is
    ``Dtilde_j Atilde^{ij} + 6 Atilde^{ij} partial_j phi
    - 2/3 gamma_tilde^{ij} partial_j K`` with ``chi = exp(-4 phi)``.

    Z4c evolves ``K_hat = K - 2 Theta`` and would write ``K_hat + 2 Theta``
    when reconstructing the physical trace.  That is a different state
    contract; adding ``2 Theta`` to this FO-CCZ4 physical-``K`` slot would
    double-count the Z4 variable.
    """

    h_inverse = np.linalg.inv(state.h)
    conformal_a = np.einsum("nik,njl,nkl->nij", h_inverse, h_inverse, state.a)
    d_a = _d1(conformal_a, state.grid)
    conformal_christoffel = _christoffel_1d(state.h, h_inverse, state.grid)
    result = np.zeros((state.grid.points, 3), dtype=np.float64)
    d_phi = -0.25 * _d1(state.chi, state.grid) / state.chi
    d_trace_k = _d1(state.trace_k, state.grid)
    for component in range(3):
        value = d_a[:, component, 0].copy()
        for index in range(3):
            value += (
                conformal_christoffel[:, component, 0, index]
                * conformal_a[:, index, 0]
                + conformal_christoffel[:, 0, 0, index]
                * conformal_a[:, component, index]
            )
        value += 6.0 * conformal_a[:, component, 0] * d_phi
        value -= (2.0 / 3.0) * h_inverse[:, component, 0] * d_trace_k
        result[:, component] = value
    return result


@dataclass(frozen=True)
class GaugeWaveConstraintSample:
    points: int
    spacing: float
    hamiltonian_l2: float
    momentum_l2: float


@dataclass(frozen=True)
class GaugeWaveConstraintConvergence:
    samples: tuple[GaugeWaveConstraintSample, ...]
    hamiltonian_orders: tuple[float, ...]
    momentum_orders: tuple[float, ...]
    amplitude: float
    roundoff_limited: bool

    @property
    def hamiltonian_order(self) -> float:
        return min(self.hamiltonian_orders, default=float("nan"))

    @property
    def momentum_order(self) -> float:
        return min(self.momentum_orders, default=float("nan"))

    @property
    def passed(self) -> bool:
        """Whether the exact-solution constraints remain numerically bounded.

        The one-dimensional gauge-wave reduction has an algebraic cancellation
        in the vacuum constraints.  Once the residual is at roundoff level,
        an observed refinement order is not a meaningful accuracy claim.  This
        gate therefore checks boundedness and exposes that limitation instead
        of manufacturing a convergence order from noise.
        """

        if not self.samples:
            return False
        maxima = [
            max(sample.hamiltonian_l2, sample.momentum_l2)
            for sample in self.samples
        ]
        return bool(np.all(np.isfinite(maxima)) and max(maxima) <= 1.0e-12)


def _observed_orders(values: tuple[float, ...]) -> tuple[float, ...]:
    result: list[float] = []
    for coarse, fine in zip(values, values[1:]):
        if coarse <= 0.0 or fine <= 0.0:
            result.append(float("inf"))
        else:
            result.append(float(math.log(coarse / fine, 2.0)))
    return tuple(result)


def gauge_wave_state(
    grid: Grid1D,
    *,
    time: float = 0.0,
    amplitude: float = 0.1,
) -> CCZ4State1D:
    """Return the exact one-dimensional vacuum gauge-wave state.

    The spacetime metric is ``ds^2 = -H dt^2 + H dx^2 + dy^2 + dz^2`` with
    ``H = 1 - A sin(2*pi*(x-t)/L)``.  It is a coordinate representation of
    flat spacetime, so the continuum vacuum constraints vanish while the
    finite-difference constraint norms provide a genuine convergence test.
    """

    if grid.boundary.kind != "periodic":
        raise ValueError("the exact gauge-wave oracle requires periodic boundaries")
    t = _finite_scalar(time, name="time")
    amp = _finite_scalar(amplitude, name="amplitude")
    if abs(amp) >= 1.0:
        raise ValueError("gauge-wave amplitude must satisfy |A| < 1")
    length = grid.x_max - grid.x_min
    wave_number = 2.0 * math.pi / length
    phase = wave_number * (grid.x - grid.x_min - t)
    metric_factor = 1.0 - amp * np.sin(phase)
    metric_factor_t = amp * wave_number * np.cos(phase)
    metric_factor_x = -amp * wave_number * np.cos(phase)
    lapse = np.sqrt(metric_factor)
    k_xx = -0.5 * metric_factor_t / lapse
    trace_k = k_xx / metric_factor
    chi = np.power(metric_factor, -1.0 / 3.0)

    h = np.zeros((grid.points, 3, 3), dtype=np.float64)
    h[:, 0, 0] = np.power(metric_factor, 2.0 / 3.0)
    h[:, 1, 1] = np.power(metric_factor, -1.0 / 3.0)
    h[:, 2, 2] = np.power(metric_factor, -1.0 / 3.0)

    physical_a = np.zeros_like(h)
    physical_a[:, 0, 0] = k_xx - metric_factor * trace_k / 3.0
    physical_a[:, 1, 1] = -trace_k / 3.0
    physical_a[:, 2, 2] = -trace_k / 3.0
    conformal_a = chi[:, None, None] * physical_a

    conformal_gamma = np.zeros((grid.points, 3), dtype=np.float64)
    # Gamma^x = -d_x h^{xx}; h^{xx} = H^(-2/3).
    conformal_gamma[:, 0] = (2.0 / 3.0) * np.power(metric_factor, -5.0 / 3.0) * metric_factor_x

    return CCZ4State1D(
        grid=grid,
        chi=chi,
        h=h,
        trace_k=trace_k,
        a=conformal_a,
        theta=np.zeros(grid.points, dtype=np.float64),
        conformal_gamma=conformal_gamma,
        lapse=lapse,
        shift=np.zeros((grid.points, 3), dtype=np.float64),
        b=np.zeros((grid.points, 3), dtype=np.float64),
        formulation="ccz4",
    )


def gauge_wave_constraint_convergence(
    *,
    amplitude: float = 0.1,
    grid_sizes: tuple[int, ...] = (32, 64, 128, 256),
    time: float = 0.13,
) -> GaugeWaveConstraintConvergence:
    """Measure a periodic exact-solution constraint consistency sweep.

    For this 1-D gauge-wave reduction the Hamiltonian and momentum constraints
    cancel algebraically, so the residual is normally roundoff limited.  The
    returned order tuples are empty in that regime; callers must use ``passed``
    as a boundedness gate and use a non-degenerate manufactured/evolution case
    for an actual truncation-order claim.
    """

    if len(grid_sizes) < 2 or any(n < 8 for n in grid_sizes):
        raise ValueError("at least two gauge-wave grids of eight or more points are required")
    if any(right <= left for left, right in zip(grid_sizes, grid_sizes[1:])):
        raise ValueError("grid_sizes must be strictly increasing")
    samples: list[GaugeWaveConstraintSample] = []
    for points in grid_sizes:
        grid = Grid1D(points, 0.0, 1.0, boundary=BoundaryConfig1D(kind="periodic"))
        report = constraint_report(gauge_wave_state(grid, time=time, amplitude=amplitude))
        samples.append(
            GaugeWaveConstraintSample(
                points=points,
                spacing=grid.dx,
                hamiltonian_l2=float(np.sqrt(np.mean(report.hamiltonian**2))),
                momentum_l2=float(np.sqrt(np.mean(report.momentum**2))),
            )
        )
    frozen = tuple(samples)
    hamiltonian_values = tuple(s.hamiltonian_l2 for s in frozen)
    momentum_values = tuple(s.momentum_l2 for s in frozen)
    roundoff_limited = bool(
        max((*hamiltonian_values, *momentum_values), default=0.0) <= 1.0e-12
    )
    return GaugeWaveConstraintConvergence(
        samples=frozen,
        hamiltonian_orders=()
        if roundoff_limited
        else _observed_orders(hamiltonian_values),
        momentum_orders=()
        if roundoff_limited
        else _observed_orders(momentum_values),
        amplitude=float(amplitude),
        roundoff_limited=roundoff_limited,
    )
