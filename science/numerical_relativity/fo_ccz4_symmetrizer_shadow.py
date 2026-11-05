"""Numerical candidate symmetrizer for the 58-variable FO-CCZ4 symbol.

For a frozen principal matrix ``A^n`` with a complete real-spectrum
eigenbasis ``V``, the standard construction
``H = V^{-dagger} V^{-1}`` is Hermitian positive definite and makes
``H A^n`` Hermitian.  This module performs that construction using the
independent principal-symbol audit's eigenbasis.

The result is intentionally labelled a *numerical candidate*.  It is not an
analytic symmetrizer, does not prove uniform bounds over the gauge/parameter
family, and does not provide a physical CPBC.  The matrix is retained only
for shadow diagnostics and never enters the runtime or release manifest.
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


@dataclass(frozen=True)
class FOCCZ4NumericalSymmetrizerShadow3D:
    """Numerical symmetrizer candidate for one frozen normal direction."""

    points: int
    harmonic: int
    normal_axis: int
    effective_wave_number: float
    variable_count: int
    principal_matrix: np.ndarray
    eigenvalues: np.ndarray
    eigenbasis: np.ndarray
    symmetrizer: np.ndarray
    weighted_principal_matrix: np.ndarray
    eigenbasis_rank: int
    eigenbasis_condition_number: float
    eigenbasis_residual_l_inf: float
    eigenvalues_imaginary_l_inf: float
    symmetrizer_min_eigenvalue: float
    symmetrizer_max_eigenvalue: float
    symmetrizer_condition_number: float
    symmetrizer_condition_number_limit: float
    symmetrizer_condition_bound_validated: bool
    weighted_principal_symmetry_residual_l_inf: float
    numerical_candidate_validated: bool
    analytic_symmetrizer_validated: bool
    parameter_sweep_validated: bool
    cpbc_ready: bool
    deterministic: bool
    symmetrizer_sha256: str
    method: str = "fo-ccz4-58-numerical-eigenbasis-symmetrizer-shadow-v1"

    def __post_init__(self) -> None:
        count = int(self.variable_count)
        expected = (count, count)
        for name in (
            "principal_matrix",
            "eigenvalues",
            "eigenbasis",
            "symmetrizer",
            "weighted_principal_matrix",
        ):
            value = np.asarray(getattr(self, name))
            if name == "eigenvalues":
                if value.shape != (count,):
                    raise ValueError("eigenvalues must have one entry per variable")
            elif value.shape != expected:
                raise ValueError(f"{name} must have shape {expected}")
            if not np.all(np.isfinite(value)):
                raise ValueError(f"{name} must be finite")
            object.__setattr__(self, name, value)


def _digest(
    principal: np.ndarray,
    eigenbasis: np.ndarray,
    symmetrizer: np.ndarray,
) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-fo-ccz4-58-numerical-symmetrizer-v1\0")
    for matrix in (principal, eigenbasis, symmetrizer):
        digest.update(np.ascontiguousarray(matrix, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(
    *,
    points: int = 8,
    harmonic: int = 1,
    normal_axis: int = 0,
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    rank_tolerance: float = 1.0e-10,
    eigenbasis_tolerance: float = 1.0e-8,
    symmetry_tolerance: float = 1.0e-8,
    condition_number_limit: float = 1.0e10,
) -> FOCCZ4NumericalSymmetrizerShadow3D:
    """Construct a numerical frozen-symbol symmetrizer candidate."""

    if not isinstance(points, int) or points < 8:
        raise ValueError("points must be an integer of at least eight")
    if not isinstance(harmonic, int) or harmonic < 1:
        raise ValueError("harmonic must be a positive integer")
    if not isinstance(normal_axis, int) or normal_axis not in (0, 1, 2):
        raise ValueError("normal_axis must be one of 0, 1, or 2")
    for value, name in (
        (rank_tolerance, "rank_tolerance"),
        (eigenbasis_tolerance, "eigenbasis_tolerance"),
        (symmetry_tolerance, "symmetry_tolerance"),
        (condition_number_limit, "condition_number_limit"),
    ):
        value = float(value)
        if not math.isfinite(value) or value <= 0.0:
            raise ValueError(f"{name} must be finite and positive")

    raw = linearized_fo_ccz4_principal_symbol_3d(
        points=points,
        harmonic=harmonic,
        normal_axis=normal_axis,
        gauge=gauge,
        config=config,
        return_raw=True,
    )
    if not isinstance(raw, FOCCZ4PrincipalSymbolRaw3D):  # pragma: no cover
        raise AssertionError("principal-symbol raw audit did not return matrices")
    wave_number = float(raw.effective_wave_number)
    if not math.isfinite(wave_number) or wave_number <= 0.0:
        raise ValueError("principal symbol effective wave number must be positive")

    principal = np.asarray(raw.symbol, dtype=np.complex128) / (1j * wave_number)
    eigenvalues = np.asarray(raw.full_eigenvalues, dtype=np.complex128) / (1j * wave_number)
    eigenbasis = np.asarray(raw.full_eigenvectors, dtype=np.complex128)
    variable_count = int(principal.shape[0])
    eigenbasis_rank = int(np.linalg.matrix_rank(eigenbasis, tol=rank_tolerance))
    eigenbasis_condition = float(np.linalg.cond(eigenbasis))
    basis_residual = principal @ eigenbasis - eigenbasis @ np.diag(eigenvalues)
    basis_residual_l_inf = float(np.max(np.abs(basis_residual)))
    eigenvalues_imag_l_inf = float(np.max(np.abs(np.imag(eigenvalues))))

    if eigenbasis_rank != variable_count:
        # Keep the report serializable and finite even when a future
        # parameter point becomes defective; the validation flag then fails
        # closed instead of manufacturing a symmetrizer from a pseudoinverse.
        symmetrizer = np.zeros((variable_count, variable_count), dtype=np.complex128)
        weighted = symmetrizer.copy()
        minimum = maximum = condition = residual = float("inf")
    else:
        inverse = np.linalg.inv(eigenbasis)
        symmetrizer = inverse.conj().T @ inverse
        weighted = symmetrizer @ principal
        symmetrizer_eigenvalues = np.linalg.eigvalsh(symmetrizer)
        minimum = float(np.min(symmetrizer_eigenvalues))
        maximum = float(np.max(symmetrizer_eigenvalues))
        condition = float(maximum / minimum)
        residual = float(
            np.linalg.norm(weighted - weighted.conj().T, ord=np.inf)
            / max(1.0, float(np.linalg.norm(weighted, ord=np.inf)))
        )
    positive = bool(math.isfinite(minimum) and minimum > 0.0)
    condition_bound_validated = bool(
        math.isfinite(condition)
        and condition > 0.0
        and condition <= float(condition_number_limit)
    )
    candidate_validated = bool(
        eigenbasis_rank == variable_count
        and math.isfinite(eigenbasis_condition)
        and basis_residual_l_inf <= eigenbasis_tolerance
        and eigenvalues_imag_l_inf <= eigenbasis_tolerance
        and positive
        and condition_bound_validated
        and residual <= symmetry_tolerance
    )
    return FOCCZ4NumericalSymmetrizerShadow3D(
        points=points,
        harmonic=harmonic,
        normal_axis=normal_axis,
        effective_wave_number=wave_number,
        variable_count=variable_count,
        principal_matrix=principal,
        eigenvalues=eigenvalues,
        eigenbasis=eigenbasis,
        symmetrizer=symmetrizer,
        weighted_principal_matrix=weighted,
        eigenbasis_rank=eigenbasis_rank,
        eigenbasis_condition_number=eigenbasis_condition,
        eigenbasis_residual_l_inf=basis_residual_l_inf,
        eigenvalues_imaginary_l_inf=eigenvalues_imag_l_inf,
        symmetrizer_min_eigenvalue=minimum,
        symmetrizer_max_eigenvalue=maximum,
        symmetrizer_condition_number=condition,
        symmetrizer_condition_number_limit=float(condition_number_limit),
        symmetrizer_condition_bound_validated=condition_bound_validated,
        weighted_principal_symmetry_residual_l_inf=residual,
        numerical_candidate_validated=candidate_validated,
        analytic_symmetrizer_validated=False,
        parameter_sweep_validated=False,
        cpbc_ready=False,
        deterministic=True,
        symmetrizer_sha256=_digest(principal, eigenbasis, symmetrizer),
    )


__all__ = [
    "FOCCZ4NumericalSymmetrizerShadow3D",
    "linearized_fo_ccz4_numerical_symmetrizer_shadow_3d",
]
