"""Full Fourier constraint-envelope audit for the FO-CCZ4 shadow.

The existing principal-symbol closure is useful for high-frequency boundary
analysis, but it intentionally removes the zero-order source operator.  This
module keeps the complete cosine-probed Fourier generator and closes the
current first-order ordering/algebraic constraint map under that generator.
It is a finite-dimensional consistency audit only: the rows still need a
continuum subsidiary-equation derivation before they can support CPBC or live
evolution.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_constraint_closure_shadow import (
    _complete_invariant_rows,
    _rank,
)
from .fo_ccz4_principal_symbol import (
    FOCCZ4PrincipalSymbolRaw3D,
    linearized_fo_ccz4_principal_symbol_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config


@dataclass(frozen=True)
class FOCCZ4FullConstraintClosureShadow3D:
    """Deterministic closure report for the complete frozen Fourier generator."""

    points: int
    harmonic: int
    normal_axis: int
    effective_wave_number: float
    variable_count: int
    raw_constraint_count: int
    raw_constraint_rank: int
    completed_constraint_count: int
    completed_constraint_rank: int
    completion_iterations: int
    normalized_closure_residual_l_inf: float
    full_symbol_finite: bool
    deterministic: bool
    full_constraint_closure_validated: bool
    physical_subsidiary_equations_validated: bool
    cpbc_ready: bool
    constraint_rows_sha256: str
    full_symbol_sha256: str
    completed_rows_sha256: str
    method: str = "fo-ccz4-full-fourier-constraint-envelope-shadow-v1"


def _digest(prefix: bytes, matrix: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(prefix)
    digest.update(np.ascontiguousarray(matrix, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def linearized_fo_ccz4_full_constraint_closure_shadow_3d(
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
    max_iterations: int = 8,
) -> FOCCZ4FullConstraintClosureShadow3D:
    """Close the measured FO constraint rows under the full Fourier RHS."""

    if not math.isfinite(rank_tolerance) or rank_tolerance <= 0.0:
        raise ValueError("rank_tolerance must be finite and positive")
    if not math.isfinite(closure_tolerance) or closure_tolerance <= 0.0:
        raise ValueError("closure_tolerance must be finite and positive")
    if not isinstance(max_iterations, int) or max_iterations < 1:
        raise ValueError("max_iterations must be a positive integer")

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
    rows = np.asarray(raw.constraint_rows, dtype=np.complex128)
    full_symbol = np.asarray(raw.full_symbol, dtype=np.complex128)
    if rows.ndim != 2 or full_symbol.shape != (rows.shape[1], rows.shape[1]):
        raise ValueError("FO constraint rows and full symbol have incompatible shapes")
    finite = bool(np.all(np.isfinite(rows)) and np.all(np.isfinite(full_symbol)))
    completed, _, iterations, residual = _complete_invariant_rows(
        rows,
        full_symbol,
        rank_tolerance=rank_tolerance,
        closure_tolerance=closure_tolerance,
        max_iterations=max_iterations,
    )
    validated = bool(
        finite
        and math.isfinite(residual)
        and residual <= closure_tolerance
        and _rank(completed, rank_tolerance) == completed.shape[0]
    )
    return FOCCZ4FullConstraintClosureShadow3D(
        points=raw.report.points,
        harmonic=raw.report.harmonic,
        normal_axis=raw.report.normal_axis,
        effective_wave_number=raw.effective_wave_number,
        variable_count=int(full_symbol.shape[0]),
        raw_constraint_count=int(rows.shape[0]),
        raw_constraint_rank=_rank(rows, rank_tolerance),
        completed_constraint_count=int(completed.shape[0]),
        completed_constraint_rank=_rank(completed, rank_tolerance),
        completion_iterations=iterations,
        normalized_closure_residual_l_inf=float(residual),
        full_symbol_finite=finite,
        deterministic=True,
        full_constraint_closure_validated=validated,
        physical_subsidiary_equations_validated=False,
        cpbc_ready=False,
        constraint_rows_sha256=_digest(
            b"nr-k3-fo-ccz4-full-constraint-rows-v1\0", rows
        ),
        full_symbol_sha256=_digest(
            b"nr-k3-fo-ccz4-full-fourier-symbol-v1\0", full_symbol
        ),
        completed_rows_sha256=_digest(
            b"nr-k3-fo-ccz4-full-completed-rows-v1\0", completed
        ),
    )


__all__ = [
    "FOCCZ4FullConstraintClosureShadow3D",
    "linearized_fo_ccz4_full_constraint_closure_shadow_3d",
]
