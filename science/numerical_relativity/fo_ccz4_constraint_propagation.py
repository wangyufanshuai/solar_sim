"""Frozen FO-CCZ4 constraint-propagation closure audit.

For a first-order principal system ``q_t = A^n partial_n q`` and a candidate
constraint row operator ``C``, a closed frozen constraint subsystem would obey
``C A^n = B^n C`` for some constraint-space matrix ``B^n``.  This module solves
that row-space condition in least squares and records the normalized residual.
It is a diagnostic for selecting the eventual formulation-specific CPBC; it
does not manufacture a boundary condition when the candidate rows are not
closed and never writes to the runtime.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_analytic_symbol import analytic_fo_ccz4_principal_matrix_3d
from .fo_ccz4_einstein_constraints import (
    linearized_fo_ccz4_einstein_constraint_rows_3d,
)
from .fo_ccz4_principal_symbol import (
    FOCCZ4PrincipalSymbolRaw3D,
    linearized_fo_ccz4_principal_symbol_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config


@dataclass(frozen=True)
class FOCCZ4ConstraintPropagationAudit3D:
    points: int
    harmonic: int
    normal_axis: int
    variable_count: int
    constraint_count: int
    ordering_constraint_count: int
    einstein_constraint_count: int
    constraint_rank: int
    propagation_matrix_rank: int
    normalized_closure_residual_l_inf: float
    direct_symbol_crosscheck_error_l_inf: float
    constraint_operator_kind: str
    contains_hamiltonian_momentum_constraints: bool
    constraint_propagation_closed: bool
    deterministic: bool
    propagation_matrix_sha256: str
    method: str = "fo-ccz4-frozen-constraint-propagation-closure-v1"


def _digest_matrix(matrix: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-fo-ccz4-constraint-propagation-v1\0")
    digest.update(np.ascontiguousarray(matrix, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def _candidate_constraint_rows(
    raw: FOCCZ4PrincipalSymbolRaw3D,
) -> np.ndarray:
    einstein = linearized_fo_ccz4_einstein_constraint_rows_3d(
        normal_axis=raw.report.normal_axis,
        effective_wave_number=raw.effective_wave_number,
    )
    return np.vstack((np.asarray(raw.constraint_rows, dtype=np.complex128), einstein))


def linearized_fo_ccz4_constraint_propagation_audit_3d(
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
    closure_tolerance: float = 1.0e-8,
) -> FOCCZ4ConstraintPropagationAudit3D:
    """Audit whether the 73-row frozen candidate constraint operator closes."""

    if not math.isfinite(rank_tolerance) or rank_tolerance <= 0.0:
        raise ValueError("rank_tolerance must be finite and positive")
    if not math.isfinite(closure_tolerance) or closure_tolerance <= 0.0:
        raise ValueError("closure_tolerance must be finite and positive")
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
    direct = analytic_fo_ccz4_principal_matrix_3d(
        normal_axis=normal_axis,
        gauge=gauge,
        config=config,
    )
    principal = np.asarray(raw.symbol, dtype=np.complex128) / (
        1j * raw.effective_wave_number
    )
    direct_error = float(np.max(np.abs(principal - direct)))
    rows = _candidate_constraint_rows(raw)
    constraint_rank = int(np.linalg.matrix_rank(rows, tol=rank_tolerance))
    propagation_matrix = (rows @ principal) @ np.linalg.pinv(rows, rcond=rank_tolerance)
    closure_residual = float(
        np.linalg.norm(propagation_matrix @ rows - rows @ principal, ord=np.inf)
        / max(1.0, float(np.linalg.norm(rows @ principal, ord=np.inf)))
    )
    finite = all(math.isfinite(value) for value in (direct_error, closure_residual))
    closed = bool(
        finite
        and direct_error <= 1.0e-8
        and closure_residual <= closure_tolerance
    )
    return FOCCZ4ConstraintPropagationAudit3D(
        points=raw.report.points,
        harmonic=raw.report.harmonic,
        normal_axis=raw.report.normal_axis,
        variable_count=int(principal.shape[0]),
        constraint_count=int(rows.shape[0]),
        ordering_constraint_count=int(raw.constraint_rows.shape[0]),
        einstein_constraint_count=int(rows.shape[0] - raw.constraint_rows.shape[0]),
        constraint_rank=constraint_rank,
        propagation_matrix_rank=int(np.linalg.matrix_rank(propagation_matrix, tol=rank_tolerance)),
        normalized_closure_residual_l_inf=closure_residual,
        direct_symbol_crosscheck_error_l_inf=direct_error,
        constraint_operator_kind=(
            "ordering-definition-curl-plus-algebraic-plus-linearized-"
            "hamiltonian-momentum-principal"
        ),
        contains_hamiltonian_momentum_constraints=True,
        constraint_propagation_closed=closed,
        deterministic=True,
        propagation_matrix_sha256=_digest_matrix(propagation_matrix),
    )


__all__ = [
    "FOCCZ4ConstraintPropagationAudit3D",
    "linearized_fo_ccz4_constraint_propagation_audit_3d",
]
