"""58-variable FO-CCZ4 frozen-coefficient principal-symbol audit.

This module linearizes the research-only first-order-in-space CCZ4 shadow
around Minkowski space with an independent perturbation for every canonical
variable.  It is deliberately a diagnostic, not a characteristic boundary
solver: the eigenvectors are computed for an audit receipt but are never
exported as production boundary data.  In particular, a finite spectrum or a
full-rank eigenvector matrix does not by itself establish a symmetrizer,
constraint-preserving boundary condition, or physical validity.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
import numpy as np

from .bssn3d import _d1
from .ccz4_reference import GaugeConfig
from .fo_ccz4 import (
    FOCCZ4_BASE_VARIABLES,
    FOCCZ4_VARIABLE_ORDER,
    FOCCZ4Auxiliary3D,
    _state_sha256,
)
from .fo_ccz4_rhs import FOCCZ4Config, FOCCZ4State3D, fo_ccz4_rhs_3d
from .nr3d import Array, BSSNState3D, Grid3D


@dataclass(frozen=True)
class FOCCZ4PrincipalSymbolReport3D:
    """Auditable spectrum and constraint-map summary for one Fourier mode."""

    points: int
    harmonic: int
    normal_axis: int
    amplitude: float
    wave_number: float
    effective_wave_number: float
    variable_count: int
    ode_variable_count: int
    pde_variable_count: int
    lapse_coefficient: float
    shift_coefficient: float
    shift_damping: float
    cleaning_speed: float
    ordering_mu: float
    c: float
    phase_speeds: tuple[float, ...]
    max_abs_phase_speed: float
    max_real_eigenvalue_abs: float
    eigenvector_rank: int
    eigenvector_condition_number: float
    split_basis_residual_l_inf: float
    ode_principal_row_residual_l_inf: float
    ode_principal_column_residual_l_inf: float
    full_symbol_eigenvector_rank: int
    full_symbol_nullity: int
    full_symbol_zero_eigenvalue_count: int
    full_symbol_defect: int
    full_symbol_nonzero_speed_defect: int
    full_symbol_eigenvector_residual_l_inf: float
    full_symbol_diagonalizable: bool
    full_symbol_condition_number: float
    full_symbol_inverse_residual_l_inf: float
    full_symbol_incoming_mode_count: int
    full_symbol_outgoing_mode_count: int
    full_symbol_zero_speed_mode_count: int
    constraint_count: int
    constraint_map_rank: int
    constraint_mode_response: tuple[float, ...]
    constraint_mode_count: int
    incoming_constraint_mode_count: int
    outgoing_constraint_mode_count: int
    max_constraint_response: float
    constraint_response_threshold: float
    expected_speed_errors: dict[str, float]
    published_speed_family_contract: tuple["FOCCZ4PublishedSpeedFamily", ...]
    published_gamma_driver_non_degenerate: bool
    published_speed_census_error: float
    variable_order_sha256: str
    symbol_sha256: str
    eigenvector_sha256: str
    constraint_map_sha256: str
    method: str
    eigenvectors_available: bool
    strong_hyperbolicity_validated: bool
    constraint_preserving_validated: bool
    physical_boundary_validated: bool


@dataclass(frozen=True)
class FOCCZ4PublishedSpeedFamily:
    """One branch of the published flat-background characteristic census.

    ``multiplicity`` is the number of modes for one sign when ``signed`` is
    true, and the total number of modes when ``signed`` is false.  The
    contract is intentionally a speed *census*, not an eigenvector proof:
    the gamma-driver appendix gives the latter as long expressions that still
    need an independent symbolic implementation before boundary use.
    """

    name: str
    phase_speed_formula: str
    phase_speed: float
    multiplicity: int
    signed: bool
    source: str


@dataclass(frozen=True)
class FOCCZ4PrincipalSymbolRaw3D:
    """Internal matrices retained for downstream shadow boundary audits.

    The raw matrices are deliberately opt-in and never enter the release
    manifest.  They let a separate CPBC diagnostic consume the exact symbol
    and characteristic basis that produced the public report, avoiding a
    second finite-difference implementation with a potentially different
    normalization.
    """

    report: FOCCZ4PrincipalSymbolReport3D
    symbol: np.ndarray
    full_symbol: np.ndarray
    constraint_rows: np.ndarray
    full_eigenvalues: np.ndarray
    full_eigenvectors: np.ndarray
    effective_wave_number: float


_BASE_SYMMETRIC_LAYOUT: tuple[tuple[str, tuple[int, int]], ...] = (
    *(('h', (i, j)) for i in range(3) for j in range(i, 3)),
    *(('a', (i, j)) for i in range(3) for j in range(i, 3)),
)


def _set_symmetric_mode(field: Array, component: tuple[int, int], mode: Array) -> None:
    first, second = component
    field[..., first, second] += mode
    if first != second:
        field[..., second, first] += mode


def _mode_state(
    grid: Grid3D,
    slot: int,
    mode: Array,
) -> FOCCZ4State3D:
    """Build a state with exactly one independent canonical slot perturbed."""

    base = BSSNState3D.minkowski(grid, formulation="ccz4")
    lapse_gradient = np.zeros((*grid.shape, 3), dtype=np.float64)
    shift_gradient = np.zeros((*grid.shape, 3, 3), dtype=np.float64)
    metric_gradient = np.zeros((*grid.shape, 3, 3, 3), dtype=np.float64)
    conformal_factor_gradient = np.zeros((*grid.shape, 3), dtype=np.float64)
    if slot < len(FOCCZ4_BASE_VARIABLES):
        if slot < 6:
            _set_symmetric_mode(base.h, _BASE_SYMMETRIC_LAYOUT[slot][1], mode)
        elif slot == 6:
            base.lapse[...] = np.exp(mode)
        elif 7 <= slot <= 9:
            base.shift[..., slot - 7] += mode
        elif slot == 10:
            base.chi[...] = np.exp(2.0 * mode)
        elif 11 <= slot <= 16:
            _set_symmetric_mode(base.a, _BASE_SYMMETRIC_LAYOUT[slot - 5][1], mode)
        elif slot == 17:
            base.trace_k += mode
        elif slot == 18:
            base.theta += mode
        elif 19 <= slot <= 21:
            base.conformal_gamma[..., slot - 19] += mode
        elif 22 <= slot <= 24:
            base.b[..., slot - 22] += mode
        else:  # pragma: no cover - protected by the canonical layout
            raise AssertionError(f"unsupported FO base slot {slot}")
    else:
        auxiliary_slot = slot - len(FOCCZ4_BASE_VARIABLES)
        if auxiliary_slot < 3:
            lapse_gradient[..., auxiliary_slot] += mode
        elif auxiliary_slot < 12:
            local = auxiliary_slot - 3
            derivative, component = divmod(local, 3)
            shift_gradient[..., derivative, component] += mode
        elif auxiliary_slot < 30:
            local = auxiliary_slot - 12
            derivative, symmetric = divmod(local, 6)
            component = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))[symmetric]
            _set_symmetric_mode(metric_gradient[..., derivative, :, :], component, mode)
        elif auxiliary_slot < 33:
            conformal_factor_gradient[..., auxiliary_slot - 30] += mode
        else:  # pragma: no cover - protected by the canonical layout
            raise AssertionError(f"unsupported FO auxiliary slot {slot}")
    auxiliary = FOCCZ4Auxiliary3D(
        lapse_gradient=lapse_gradient,
        shift_gradient=shift_gradient,
        metric_gradient=metric_gradient,
        conformal_factor_gradient=conformal_factor_gradient,
        derivative_order=grid.spatial_order,
        source_state_sha256=_state_sha256(base),
    )
    return FOCCZ4State3D(base=base, auxiliary=auxiliary)


def _rhs_components(rhs) -> tuple[Array, ...]:
    """Flatten the FO RHS into the exact 58-variable contract order."""

    components: list[Array] = []
    components.extend(rhs.h[..., i, j] for i in range(3) for j in range(i, 3))
    components.append(rhs.ln_lapse)
    components.extend(rhs.shift[..., i] for i in range(3))
    components.append(rhs.ln_phi)
    components.extend(rhs.a[..., i, j] for i in range(3) for j in range(i, 3))
    components.append(rhs.trace_k)
    components.append(rhs.theta)
    components.extend(rhs.conformal_gamma[..., i] for i in range(3))
    components.extend(rhs.b[..., i] for i in range(3))
    components.extend(
        (
            *[rhs.lapse_gradient[..., i] for i in range(3)],
            *[
                rhs.shift_gradient[..., k, i]
                for k in range(3)
                for i in range(3)
            ],
            *[
                rhs.metric_gradient[..., k, i, j]
                for k in range(3)
                for i in range(3)
                for j in range(i, 3)
            ],
            *[rhs.conformal_factor_gradient[..., i] for i in range(3)],
        )
    )
    if len(components) != len(FOCCZ4_VARIABLE_ORDER):
        raise AssertionError(f"FO RHS flattened to {len(components)} rather than 58 rows")
    return tuple(components)


def _constraint_components(state: FOCCZ4State3D) -> tuple[Array, ...]:
    """Return definition, curl, and algebraic constraints as scalar arrays."""

    base = state.base
    aux = state.auxiliary
    constraints: list[Array] = []
    ln_lapse = np.log(base.lapse)
    ln_chi = np.log(base.chi)
    d_ln_lapse = [_d1(ln_lapse, base, axis) for axis in range(3)]
    d_ln_chi = [_d1(ln_chi, base, axis) for axis in range(3)]
    d_shift = [_d1(base.shift, base, axis) for axis in range(3)]
    d_metric = [_d1(base.h, base, axis) for axis in range(3)]
    constraints.extend(
        aux.lapse_gradient[..., axis] - d_ln_lapse[axis] for axis in range(3)
    )
    constraints.extend(
        aux.shift_gradient[..., derivative, component] - d_shift[derivative][..., component]
        for derivative in range(3)
        for component in range(3)
    )
    constraints.extend(
        aux.metric_gradient[..., derivative, i, j]
        - 0.5 * d_metric[derivative][..., i, j]
        for derivative in range(3)
        for i in range(3)
        for j in range(i, 3)
    )
    constraints.extend(
        aux.conformal_factor_gradient[..., axis] - 0.5 * d_ln_chi[axis]
        for axis in range(3)
    )
    # Differential ordering/curl constraints.  There is one row for every
    # antisymmetric derivative pair of each 1-form/vector/tensor family.
    for first in range(3):
        for second in range(first + 1, 3):
            constraints.append(
                _d1(aux.lapse_gradient[..., second], base, first)
                - _d1(aux.lapse_gradient[..., first], base, second)
            )
    for component in range(3):
        for first in range(3):
            for second in range(first + 1, 3):
                constraints.append(
                    _d1(aux.shift_gradient[..., second, component], base, first)
                    - _d1(aux.shift_gradient[..., first, component], base, second)
                )
    for i in range(3):
        for j in range(i, 3):
            for first in range(3):
                for second in range(first + 1, 3):
                    constraints.append(
                        _d1(aux.metric_gradient[..., second, i, j], base, first)
                        - _d1(aux.metric_gradient[..., first, i, j], base, second)
                    )
    for first in range(3):
        for second in range(first + 1, 3):
            constraints.append(
                _d1(aux.conformal_factor_gradient[..., second], base, first)
                - _d1(aux.conformal_factor_gradient[..., first], base, second)
            )
    constraints.append(np.linalg.det(base.h) - 1.0)
    constraints.append(np.einsum("...ij,...ij->...", np.linalg.inv(base.h), base.a))
    # ``conformal_gamma`` is the evolved contracted conformal connection, not
    # an algebraic constraint that vanishes on a valid solution.  On the
    # constraint manifold it equals the contracted Christoffel expression
    # (plus the Z4 contribution); treating the raw Gamma variable itself as a
    # zero row falsely rejects valid gauge-wave/curvilinear data.  The
    # formulation-specific Z4 reconstruction is audited separately by the
    # projection modules.
    constraints.append(base.theta)
    return tuple(constraints)


def _project(values: tuple[Array, ...], factor: Array) -> np.ndarray:
    return np.asarray([np.mean(value * factor) for value in values], dtype=np.complex128)


def _digest_matrix(prefix: bytes, matrix: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(prefix)
    digest.update(np.ascontiguousarray(matrix).tobytes(order="C"))
    return digest.hexdigest()


def published_fo_ccz4_speed_family_contract(
    gauge: GaugeConfig,
    config: FOCCZ4Config,
) -> tuple[FOCCZ4PublishedSpeedFamily, ...]:
    """Return the Appendix-A Minkowski FO-CCZ4 characteristic contract.

    The contract is for the flat background with zero shift, standard
    ``e=c=1``, 1+log slicing, and Gamma-driver shift.  The two zero-speed
    entries distinguish the eleven kinematic ODE variables from the fifteen
    reduced-system advection modes.  Signed families list the multiplicity
    for each of the ``+`` and ``-`` branches.  This keeps the published
    parameterization auditable without pretending that numerical eigenvectors
    are the analytic Appendix-A eigenvectors.
    """

    # This is a comparison against the Appendix-A census, not a generic
    # dispersion-relation calculator.  Refuse to silently apply the published
    # multiset to a different cleaning/coupling convention; callers that tune
    # those parameters must provide a separately derived target set.
    if not math.isclose(config.cleaning_speed, 1.0, rel_tol=0.0, abs_tol=1.0e-12):
        raise ValueError(
            "published FO-CCZ4 speed census requires cleaning_speed=1"
        )
    if not math.isclose(config.c, 1.0, rel_tol=0.0, abs_tol=1.0e-12):
        raise ValueError("published FO-CCZ4 speed census requires c=1")

    source = "FO-CCZ4 Appendix A (A6-A10), flat alpha=phi=gamma11=1, beta1=0"
    return (
        FOCCZ4PublishedSpeedFamily(
            name="ode-kinematic",
            phase_speed_formula="-beta^1",
            phase_speed=0.0,
            multiplicity=11,
            signed=False,
            source="FO-CCZ4 Appendix A: V unit-vector ODE block",
        ),
        FOCCZ4PublishedSpeedFamily(
            name="reduced-advection",
            phase_speed_formula="-beta^1",
            phase_speed=0.0,
            multiplicity=15,
            signed=False,
            source="FO-CCZ4 Appendix A (A6)",
        ),
        FOCCZ4PublishedSpeedFamily(
            name="light-cleaning",
            phase_speed_formula="+-sqrt(e)",
            phase_speed=float(config.cleaning_speed),
            multiplicity=6,
            signed=True,
            source=source,
        ),
        FOCCZ4PublishedSpeedFamily(
            name="one-plus-log",
            phase_speed_formula="+-sqrt(g(alpha))",
            phase_speed=float(math.sqrt(gauge.lapse_coefficient)),
            multiplicity=1,
            signed=True,
            source=source,
        ),
        FOCCZ4PublishedSpeedFamily(
            name="gamma-driver-longitudinal",
            phase_speed_formula="+-sqrt(4*f/3)",
            phase_speed=float(math.sqrt(4.0 * gauge.shift_coefficient / 3.0)),
            multiplicity=1,
            signed=True,
            source=source,
        ),
        FOCCZ4PublishedSpeedFamily(
            name="ordering-longitudinal",
            phase_speed_formula="+-sqrt(mu/2)",
            phase_speed=float(math.sqrt(config.ordering_mu / 2.0)),
            multiplicity=2,
            signed=True,
            source=source,
        ),
        FOCCZ4PublishedSpeedFamily(
            name="gamma-driver-transverse",
            phase_speed_formula="+-sqrt(f)",
            phase_speed=float(math.sqrt(gauge.shift_coefficient)),
            multiplicity=2,
            signed=True,
            source=source,
        ),
        FOCCZ4PublishedSpeedFamily(
            name="ordering-transverse",
            phase_speed_formula="+-sqrt(mu)/2",
            phase_speed=float(0.5 * math.sqrt(config.ordering_mu)),
            multiplicity=4,
            signed=True,
            source=source,
        ),
    )


def _published_phase_speed_targets(
    gauge: GaugeConfig,
    config: FOCCZ4Config,
) -> np.ndarray:
    """Expand the named Appendix-A family contract to a sorted-speed target."""

    speeds: list[float] = []
    for family in published_fo_ccz4_speed_family_contract(gauge, config):
        if family.signed:
            speeds.extend([-family.phase_speed] * family.multiplicity)
            speeds.extend([family.phase_speed] * family.multiplicity)
        else:
            speeds.extend([family.phase_speed] * family.multiplicity)
    return np.asarray(speeds, dtype=np.float64)


def linearized_fo_ccz4_principal_symbol_3d(
    *,
    points: int = 8,
    harmonic: int = 1,
    normal_axis: int = 0,
    amplitude: float = 1.0e-7,
    # The published gamma-driver eigenbasis is degenerate at f=3/4 for the
    # Minkowski background.  Keep the legacy f=3/4 runtime untouched, but use
    # the non-degenerate f=1 shadow setting for the default NR audit.
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    return_raw: bool = False,
) -> FOCCZ4PrincipalSymbolReport3D | FOCCZ4PrincipalSymbolRaw3D:
    """Build the 58x58 frozen-coefficient Fourier symbol of the FO shadow.

    ``return_raw`` is reserved for independent shadow audits.  It exposes the
    exact matrix/eigenbasis used to form the report, but does not change the
    release-facing report or promote characteristic data to runtime use.
    """

    if not isinstance(points, int) or points < 8:
        raise ValueError("points must be an integer of at least eight")
    if not isinstance(harmonic, int) or harmonic < 1 or harmonic >= points // 2:
        raise ValueError("harmonic must lie between one and the Nyquist limit")
    if not isinstance(normal_axis, int) or normal_axis not in (0, 1, 2):
        raise ValueError("normal_axis must be one of 0, 1, or 2")
    amplitude = float(amplitude)
    if not math.isfinite(amplitude) or amplitude <= 0.0:
        raise ValueError("amplitude must be finite and positive")
    shape = [5, 5, 5]
    shape[normal_axis] = points
    grid = Grid3D(
        tuple(shape),
        (0.0, 0.0, 0.0),
        (2.0 * np.pi, 2.0 * np.pi, 2.0 * np.pi),
        boundary="periodic",
        spatial_order=2,
    )
    coordinate = grid.coordinates[normal_axis]
    spacing = grid.spacing[normal_axis]
    wave_number = float(harmonic)
    effective_wave_number = float(np.sin(wave_number * spacing) / spacing)
    if effective_wave_number <= 0.0:
        raise ValueError("harmonic is too close to the Nyquist limit")
    mode = np.cos(wave_number * coordinate)
    fourier_factor = np.exp(-1j * wave_number * coordinate)
    variable_count = len(FOCCZ4_VARIABLE_ORDER)
    wave_symbol = np.zeros((variable_count, variable_count), dtype=np.complex128)
    zero_order_symbol = np.zeros((variable_count, variable_count), dtype=np.complex128)
    constraint_rows: np.ndarray | None = None
    constant_mode = np.ones_like(mode)
    for slot in range(variable_count):
        plus = _mode_state(grid, slot, amplitude * mode)
        minus = _mode_state(grid, slot, -amplitude * mode)
        plus_rhs = _project(
            _rhs_components(fo_ccz4_rhs_3d(plus, gauge=gauge, config=config)),
            fourier_factor,
        )
        minus_rhs = _project(
            _rhs_components(fo_ccz4_rhs_3d(minus, gauge=gauge, config=config)),
            fourier_factor,
        )
        wave_symbol[:, slot] = (plus_rhs - minus_rhs) / amplitude
        constant_plus = _mode_state(grid, slot, amplitude * constant_mode)
        constant_minus = _mode_state(grid, slot, -amplitude * constant_mode)
        constant_plus_rhs = _project(
            _rhs_components(fo_ccz4_rhs_3d(constant_plus, gauge=gauge, config=config)),
            constant_mode,
        )
        constant_minus_rhs = _project(
            _rhs_components(fo_ccz4_rhs_3d(constant_minus, gauge=gauge, config=config)),
            constant_mode,
        )
        zero_order_symbol[:, slot] = (constant_plus_rhs - constant_minus_rhs) / amplitude
        plus_constraints = _project(_constraint_components(plus), fourier_factor)
        minus_constraints = _project(_constraint_components(minus), fourier_factor)
        column = (plus_constraints - minus_constraints) / amplitude
        if constraint_rows is None:
            constraint_rows = np.zeros((len(column), variable_count), dtype=np.complex128)
        constraint_rows[:, slot] = column
    if constraint_rows is None:  # pragma: no cover - variable_count is fixed at 58
        raise AssertionError("FO constraint map was not constructed")
    # The plus/minus finite difference already supplies the factor of two for
    # the real cosine probe: its positive Fourier coefficient is 1/2, so
    # (RHS(+a cos)-RHS(-a cos))/a projects to the full i*k coefficient.  A
    # constant probe has coefficient one, so the same difference is 2*C and
    # must be halved before removing the algebraic (zero-order) operator.
    # Keeping these two normalizations distinct is essential; multiplying the
    # wave projection by two manufactures a spurious characteristic spectrum.
    symbol = wave_symbol - 0.5 * zero_order_symbol
    ode_principal_row_residual_l_inf = float(np.max(np.abs(symbol[:11, :])))
    ode_principal_column_residual_l_inf = float(np.max(np.abs(symbol[:, :11])))

    # The FO contract retains an 11/47 bookkeeping split for language-neutral
    # storage and for comparison with the published reduction.  Keep that
    # split basis as a *diagnostic* only; the full-symbol audit below checks
    # whether those hand-selected zero-speed rows are actually eigenvectors of
    # the implemented coupled matrix.
    pde_symbol = symbol[11:, 11:]
    raw_pde_eigenvalues, raw_pde_eigenvectors = np.linalg.eig(pde_symbol)
    _, singular_values, null_vectors = np.linalg.svd(pde_symbol, full_matrices=True)
    matrix_scale = max(1.0, float(singular_values[0]))
    zero_tolerance = 1.0e-10 * matrix_scale
    zero_eigenvalue = np.abs(raw_pde_eigenvalues) <= zero_tolerance
    null_basis = null_vectors.conj().T[:, singular_values <= zero_tolerance]
    nonzero_eigenvalues = raw_pde_eigenvalues[~zero_eigenvalue]
    nonzero_eigenvectors = raw_pde_eigenvectors[:, ~zero_eigenvalue]
    pde_eigenvalues = np.concatenate(
        (np.zeros(null_basis.shape[1], dtype=np.complex128), nonzero_eigenvalues)
    )
    pde_eigenvectors = np.column_stack((null_basis, nonzero_eigenvectors))
    eigenvalues = np.concatenate((np.zeros(11, dtype=np.complex128), pde_eigenvalues))
    eigenvectors = np.zeros((variable_count, variable_count), dtype=np.complex128)
    eigenvectors[:11, :11] = np.eye(11, dtype=np.complex128)
    eigenvectors[11:, 11:] = pde_eigenvectors
    order = np.argsort(np.imag(eigenvalues) / effective_wave_number)
    eigenvalues = eigenvalues[order]
    eigenvectors = eigenvectors[:, order]
    split_basis_residual = symbol @ eigenvectors - eigenvectors @ np.diag(eigenvalues)
    split_basis_residual_l_inf = float(np.max(np.abs(split_basis_residual)))

    # Independent full-matrix defect audit.  A repeated zero eigenvalue is
    # diagonalizable only when its geometric multiplicity (the SVD nullity)
    # equals its algebraic multiplicity.  This diagnostic intentionally does
    # not promote the system or export its vectors as boundary data.
    raw_full_eigenvalues, raw_full_eigenvectors = np.linalg.eig(symbol)
    _, full_singular_values, full_null_vectors = np.linalg.svd(symbol, full_matrices=True)
    full_scale = max(1.0, float(full_singular_values[0]))
    full_zero_tolerance = 1.0e-10 * full_scale
    full_zero_eigenvalue = np.abs(raw_full_eigenvalues) <= full_zero_tolerance
    full_null_basis = full_null_vectors.conj().T[
        :, full_singular_values <= full_zero_tolerance
    ]
    full_nonzero_eigenvalues = raw_full_eigenvalues[~full_zero_eigenvalue]
    full_nonzero_eigenvectors = raw_full_eigenvectors[:, ~full_zero_eigenvalue]
    full_eigenvalues = np.concatenate(
        (
            np.zeros(full_null_basis.shape[1], dtype=np.complex128),
            full_nonzero_eigenvalues,
        )
    )
    full_eigenvectors = np.column_stack((full_null_basis, full_nonzero_eigenvectors))
    full_order = np.argsort(np.imag(full_eigenvalues) / effective_wave_number)
    full_eigenvalues = full_eigenvalues[full_order]
    full_eigenvectors = full_eigenvectors[:, full_order]
    full_residual = symbol @ full_eigenvectors - full_eigenvectors @ np.diag(full_eigenvalues)
    full_symbol_eigenvector_rank = int(np.linalg.matrix_rank(full_eigenvectors))
    full_symbol_nullity = int(full_null_basis.shape[1])
    full_symbol_zero_eigenvalue_count = int(np.count_nonzero(full_zero_eigenvalue))
    full_symbol_defect = max(0, full_symbol_zero_eigenvalue_count - full_symbol_nullity)
    full_symbol_eigenvector_residual_l_inf = float(np.max(np.abs(full_residual)))
    full_symbol_diagonalizable = bool(
        full_symbol_eigenvector_rank == variable_count and full_symbol_defect == 0
    )
    if full_symbol_eigenvector_rank == variable_count:
        full_symbol_condition_number = float(np.linalg.cond(full_eigenvectors))
        full_inverse = np.linalg.inv(full_eigenvectors)
        full_symbol_inverse_residual_l_inf = float(
            np.max(
                np.abs(
                    full_inverse @ full_eigenvectors
                    - np.eye(variable_count, dtype=np.complex128)
                )
            )
        )
    else:
        full_symbol_condition_number = float("inf")
        full_symbol_inverse_residual_l_inf = float("inf")
    phase_speeds = np.imag(eigenvalues) / effective_wave_number
    full_phase_speeds = np.imag(full_eigenvalues) / effective_wave_number
    full_speed_threshold = 1.0e-10
    full_symbol_incoming_mode_count = int(
        np.count_nonzero(full_phase_speeds < -full_speed_threshold)
    )
    full_symbol_outgoing_mode_count = int(
        np.count_nonzero(full_phase_speeds > full_speed_threshold)
    )
    full_symbol_zero_speed_mode_count = int(
        np.count_nonzero(np.abs(full_phase_speeds) <= full_speed_threshold)
    )
    constraint_response = np.linalg.norm(constraint_rows @ eigenvectors, axis=0)
    threshold = 1.0e-8
    response_modes = constraint_response > threshold
    expected = {
        "light": 1.0,
        "one-plus-log": math.sqrt(gauge.lapse_coefficient),
        "gamma-driver": math.sqrt(gauge.shift_coefficient),
    }
    speed_errors = {
        name: float(np.min(np.abs(np.abs(phase_speeds) - target)))
        for name, target in expected.items()
    }
    published_family_contract = published_fo_ccz4_speed_family_contract(gauge, config)
    published_targets = _published_phase_speed_targets(gauge, config)
    if published_targets.shape != phase_speeds.shape:
        raise AssertionError("published FO-CCZ4 speed census has the wrong size")
    published_speed_census_error = float(
        np.max(np.abs(np.sort(phase_speeds) - np.sort(published_targets)))
    )
    # A repeated nonzero root can be defective even when the zero-speed SVD
    # audit above is clean.  Use the published speed census to group exact
    # roots, then measure each eigenspace with an independent SVD.  This is
    # intentionally a numerical defect diagnostic, not an eigenvector proof.
    nonzero_speed_defect = 0
    repeated_speed_tolerance = 1.0e-8
    for speed in np.unique(np.round(published_targets, decimals=12)):
        algebraic_multiplicity = int(
            np.count_nonzero(
                np.isclose(
                    published_targets,
                    speed,
                    rtol=0.0,
                    atol=repeated_speed_tolerance,
                )
            )
        )
        if algebraic_multiplicity <= 1 or abs(float(speed)) <= repeated_speed_tolerance:
            continue
        _, singular_values, _ = np.linalg.svd(
            symbol / (1j * effective_wave_number)
            - float(speed) * np.eye(variable_count, dtype=np.complex128),
            full_matrices=False,
        )
        scale = max(1.0, float(singular_values[0]))
        geometric_multiplicity = int(
            np.count_nonzero(singular_values <= repeated_speed_tolerance * scale)
        )
        nonzero_speed_defect += max(
            0,
            algebraic_multiplicity - geometric_multiplicity,
        )
    full_symbol_diagonalizable = bool(
        full_symbol_eigenvector_rank == variable_count
        and full_symbol_defect == 0
        and nonzero_speed_defect == 0
    )
    variable_digest = hashlib.sha256(
        "\0".join(FOCCZ4_VARIABLE_ORDER).encode("ascii")
    ).hexdigest()
    report = FOCCZ4PrincipalSymbolReport3D(
        points=points,
        harmonic=harmonic,
        normal_axis=normal_axis,
        amplitude=amplitude,
        wave_number=wave_number,
        effective_wave_number=effective_wave_number,
        variable_count=variable_count,
        ode_variable_count=11,
        pde_variable_count=47,
        lapse_coefficient=float(gauge.lapse_coefficient),
        shift_coefficient=float(gauge.shift_coefficient),
        shift_damping=float(gauge.shift_damping),
        cleaning_speed=float(config.cleaning_speed),
        ordering_mu=float(config.ordering_mu),
        c=float(config.c),
        phase_speeds=tuple(float(value) for value in phase_speeds),
        max_abs_phase_speed=float(np.max(np.abs(phase_speeds))),
        max_real_eigenvalue_abs=float(np.max(np.abs(np.real(eigenvalues)))),
        eigenvector_rank=int(np.linalg.matrix_rank(eigenvectors)),
        eigenvector_condition_number=float(np.linalg.cond(eigenvectors)),
        split_basis_residual_l_inf=split_basis_residual_l_inf,
        ode_principal_row_residual_l_inf=ode_principal_row_residual_l_inf,
        ode_principal_column_residual_l_inf=ode_principal_column_residual_l_inf,
        full_symbol_eigenvector_rank=full_symbol_eigenvector_rank,
        full_symbol_nullity=full_symbol_nullity,
        full_symbol_zero_eigenvalue_count=full_symbol_zero_eigenvalue_count,
        full_symbol_defect=full_symbol_defect,
        full_symbol_nonzero_speed_defect=nonzero_speed_defect,
        full_symbol_eigenvector_residual_l_inf=full_symbol_eigenvector_residual_l_inf,
        full_symbol_diagonalizable=full_symbol_diagonalizable,
        full_symbol_condition_number=full_symbol_condition_number,
        full_symbol_inverse_residual_l_inf=full_symbol_inverse_residual_l_inf,
        full_symbol_incoming_mode_count=full_symbol_incoming_mode_count,
        full_symbol_outgoing_mode_count=full_symbol_outgoing_mode_count,
        full_symbol_zero_speed_mode_count=full_symbol_zero_speed_mode_count,
        constraint_count=int(constraint_rows.shape[0]),
        constraint_map_rank=int(np.linalg.matrix_rank(constraint_rows)),
        constraint_mode_response=tuple(float(value) for value in constraint_response),
        constraint_mode_count=int(np.count_nonzero(response_modes)),
        incoming_constraint_mode_count=int(
            np.count_nonzero(response_modes & (phase_speeds < -threshold))
        ),
        outgoing_constraint_mode_count=int(
            np.count_nonzero(response_modes & (phase_speeds > threshold))
        ),
        max_constraint_response=float(np.max(constraint_response)),
        constraint_response_threshold=threshold,
        expected_speed_errors=speed_errors,
        published_speed_family_contract=published_family_contract,
        published_gamma_driver_non_degenerate=not math.isclose(
            gauge.shift_coefficient,
            0.75,
            rel_tol=0.0,
            abs_tol=1.0e-12,
        ),
        published_speed_census_error=published_speed_census_error,
        variable_order_sha256=variable_digest,
        symbol_sha256=_digest_matrix(b"nr-k3-fo-ccz4-58-symbol-v2\0", symbol),
        eigenvector_sha256=_digest_matrix(
            b"nr-k3-fo-ccz4-58-eigenvectors-v2\0", eigenvectors
        ),
        constraint_map_sha256=_digest_matrix(
            b"nr-k3-fo-ccz4-58-constraint-map-v2\0", constraint_rows
        ),
        method="independent-58-slot-split-and-full-principal-fourier-audit-v9-no-raw-gamma-zero-rows",
        eigenvectors_available=False,
        strong_hyperbolicity_validated=False,
        constraint_preserving_validated=False,
        physical_boundary_validated=False,
    )
    if return_raw:
        return FOCCZ4PrincipalSymbolRaw3D(
            report=report,
            symbol=symbol,
            full_symbol=wave_symbol,
            constraint_rows=constraint_rows,
            full_eigenvalues=full_eigenvalues,
            full_eigenvectors=full_eigenvectors,
            effective_wave_number=effective_wave_number,
        )
    return report


__all__ = [
    "FOCCZ4PublishedSpeedFamily",
    "FOCCZ4PrincipalSymbolReport3D",
    "FOCCZ4PrincipalSymbolRaw3D",
    "linearized_fo_ccz4_principal_symbol_3d",
    "published_fo_ccz4_speed_family_contract",
]
