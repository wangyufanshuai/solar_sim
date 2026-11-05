"""Frozen 58-variable FO-CCZ4 source-energy growth audit.

The principal-symbol campaign already separates the finite-difference Fourier
generator into ``symbol = i*k*A`` and ``full_symbol``.  Their difference is the
implemented frozen zero-order matrix ``S`` for that probe.  This module uses
the numerical candidate symmetrizer from :mod:`fo_ccz4_symmetrizer_shadow` to
measure the source logarithmic norm

``mu_S = lambda_max(H**(1/2) S H**(-1/2) + transpose)/2``.

When the candidate weighted principal matrix is Hermitian, the Fourier
principal part contributes no real energy growth.  Therefore the frozen
generator obeys the finite-time shadow bound ``E(t) <= E(0) exp(2*mu_S*t)``.
The audit is useful for sizing a later SBP-SAT/CPBC estimate, but it is not an
analytic or uniform symmetrizer theorem: the source matrix is a code-level
linearization at one flat parameter point, nonlinear coefficient variation is
not covered, and no boundary map or runtime writeback is enabled.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_principal_symbol import (
    FOCCZ4PrincipalSymbolRaw3D,
    linearized_fo_ccz4_principal_symbol_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config
from .fo_ccz4_symmetrizer_shadow import (
    linearized_fo_ccz4_numerical_symmetrizer_shadow_3d,
)


@dataclass(frozen=True)
class FOCCZ4SourceEnergyShadow3D:
    """Source-growth estimate for one frozen 58-variable normal direction."""

    points: int
    harmonic: int
    normal_axis: int
    effective_wave_number: float
    variable_count: int
    principal_matrix: np.ndarray
    source_matrix: np.ndarray
    full_generator: np.ndarray
    symmetrizer: np.ndarray
    weighted_principal_symmetry_residual_l_inf: float
    full_generator_decomposition_residual_l_inf: float
    source_matrix_norm_l_inf: float
    source_energy_log_norm: float
    source_energy_operator_min_eigenvalue: float
    source_energy_operator_max_eigenvalue: float
    numerical_symmetrizer_candidate_validated: bool
    source_energy_bound_validated: bool
    analytic_symmetrizer_validated: bool
    nonlinear_source_validated: bool
    cpbc_ready: bool
    runtime_writeback: bool
    deterministic: bool
    source_matrix_sha256: str
    method: str = "fo-ccz4-58-frozen-source-energy-shadow-v1"

    def __post_init__(self) -> None:
        count = int(self.variable_count)
        expected = (count, count)
        for name in (
            "principal_matrix",
            "source_matrix",
            "full_generator",
            "symmetrizer",
        ):
            value = np.asarray(getattr(self, name))
            if value.shape != expected:
                raise ValueError(f"{name} must have shape {expected}")
            if not np.all(np.isfinite(value)):
                raise ValueError(f"{name} must be finite")
            object.__setattr__(self, name, value)


def _digest(source: np.ndarray, symmetrizer: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-fo-ccz4-58-source-energy-shadow-v1\0")
    digest.update(np.ascontiguousarray(source, dtype=np.complex128).tobytes())
    digest.update(np.ascontiguousarray(symmetrizer, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def linearized_fo_ccz4_source_energy_shadow_3d(
    *,
    points: int = 8,
    harmonic: int = 1,
    normal_axis: int = 0,
    amplitude: float = 1.0e-7,
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    energy_tolerance: float = 1.0e-8,
) -> FOCCZ4SourceEnergyShadow3D:
    """Build the frozen source decomposition and its candidate energy bound."""

    energy_tolerance = float(energy_tolerance)
    if not math.isfinite(energy_tolerance) or energy_tolerance <= 0.0:
        raise ValueError("energy_tolerance must be finite and positive")
    raw = linearized_fo_ccz4_principal_symbol_3d(
        points=points,
        harmonic=harmonic,
        normal_axis=normal_axis,
        amplitude=amplitude,
        gauge=gauge,
        config=config,
        return_raw=True,
    )
    if not isinstance(raw, FOCCZ4PrincipalSymbolRaw3D):  # pragma: no cover
        raise AssertionError("principal-symbol raw audit did not return matrices")
    candidate = linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(
        points=points,
        harmonic=harmonic,
        normal_axis=normal_axis,
        gauge=gauge,
        config=config,
    )
    principal = np.asarray(raw.symbol, dtype=np.complex128) / (
        1j * raw.effective_wave_number
    )
    full_generator = np.asarray(raw.full_symbol, dtype=np.complex128)
    source = full_generator - np.asarray(raw.symbol, dtype=np.complex128)
    decomposition = 1j * raw.effective_wave_number * principal + source
    decomposition_residual = float(
        np.max(np.abs(decomposition - full_generator))
    )
    symmetrizer = np.asarray(candidate.symmetrizer, dtype=np.complex128)
    weighted_principal = symmetrizer @ principal
    weighted_residual = float(
        np.linalg.norm(
            weighted_principal - weighted_principal.conj().T,
            ord=np.inf,
        )
        / max(1.0, float(np.linalg.norm(weighted_principal, ord=np.inf)))
    )
    h_eigenvalues, h_vectors = np.linalg.eigh(symmetrizer)
    h_positive = bool(np.all(np.isfinite(h_eigenvalues)) and np.min(h_eigenvalues) > 0.0)
    if h_positive:
        h_half = h_vectors @ np.diag(np.sqrt(h_eigenvalues)) @ h_vectors.conj().T
        h_inv_half = h_vectors @ np.diag(1.0 / np.sqrt(h_eigenvalues)) @ h_vectors.conj().T
        transformed_source = h_half @ source @ h_inv_half
        source_energy_operator = 0.5 * (
            transformed_source + transformed_source.conj().T
        )
        source_energy_eigenvalues = np.linalg.eigvalsh(source_energy_operator)
        source_min = float(np.min(source_energy_eigenvalues))
        source_max = float(np.max(source_energy_eigenvalues))
    else:
        source_min = float("nan")
        source_max = float("nan")
    finite = all(
        math.isfinite(value)
        for value in (
            decomposition_residual,
            weighted_residual,
            source_min,
            source_max,
        )
    )
    source_bound_validated = bool(
        finite
        and h_positive
        and candidate.numerical_candidate_validated
        and decomposition_residual <= energy_tolerance
        and weighted_residual <= energy_tolerance
    )
    return FOCCZ4SourceEnergyShadow3D(
        points=points,
        harmonic=harmonic,
        normal_axis=normal_axis,
        effective_wave_number=float(raw.effective_wave_number),
        variable_count=int(principal.shape[0]),
        principal_matrix=principal,
        source_matrix=source,
        full_generator=full_generator,
        symmetrizer=symmetrizer,
        weighted_principal_symmetry_residual_l_inf=weighted_residual,
        full_generator_decomposition_residual_l_inf=decomposition_residual,
        source_matrix_norm_l_inf=float(np.linalg.norm(source, ord=np.inf)),
        source_energy_log_norm=source_max,
        source_energy_operator_min_eigenvalue=source_min,
        source_energy_operator_max_eigenvalue=source_max,
        numerical_symmetrizer_candidate_validated=(
            candidate.numerical_candidate_validated
        ),
        source_energy_bound_validated=source_bound_validated,
        analytic_symmetrizer_validated=False,
        nonlinear_source_validated=False,
        cpbc_ready=False,
        runtime_writeback=False,
        deterministic=True,
        source_matrix_sha256=_digest(source, symmetrizer),
    )


__all__ = [
    "FOCCZ4SourceEnergyShadow3D",
    "linearized_fo_ccz4_source_energy_shadow_3d",
]
