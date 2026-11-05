"""Positive-symmetrizer audit for the reduced linearized Z4c subsidiary block.

The 10-state block in :mod:`fo_ccz4_subsidiary_shadow` is small enough to
carry an explicit energy estimate.  For the ordering
``(Theta, Z_n, H, M_n, Z_t1, Q_t1, M_t1, Z_t2, Q_t2, M_t2)`` the diagonal
weights ``(1, 1, 1, 4, 1, 1, 1, 1, 1, 1)`` make ``H A^n`` symmetric for any
positive lapse and constant normal shift.  This module verifies that fact
numerically and records the positive-definiteness margin.

It is deliberately a reduced-system shadow.  The source matrix, the
nonlinear FO-CCZ4 subsidiary equations, the 58-variable symmetrizer, and a
physical characteristic boundary energy estimate remain separate gates.
Consequently ``cpbc_ready`` is always false and no runtime writeback is
possible through this module.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math

import numpy as np

from .fo_ccz4_subsidiary_shadow import (
    SUBSIDIARY_STATE_ORDER,
    linearized_z4c_subsidiary_shadow_3d,
)


@dataclass(frozen=True)
class FOCCZ4SubsidiarySymmetrizerShadow3D:
    """Energy/symmetrizer audit for the 10-state frozen subsidiary system."""

    normal_axis: int
    lapse: float
    shift_normal: float
    state_order: tuple[str, ...]
    symmetrizer: np.ndarray
    weighted_principal_matrix: np.ndarray
    symmetrizer_min_eigenvalue: float
    symmetrizer_max_eigenvalue: float
    symmetrizer_condition_number: float
    weighted_principal_symmetry_residual_l_inf: float
    positive_definite: bool
    symmetrizer_validated: bool
    subsidiary_shadow_closed: bool
    cpbc_ready: bool
    deterministic: bool
    symmetrizer_sha256: str
    method: str = "z4c-linearized-subsidiary-diagonal-symmetrizer-v1"

    def __post_init__(self) -> None:
        count = len(SUBSIDIARY_STATE_ORDER)
        symmetrizer = np.asarray(self.symmetrizer, dtype=np.float64)
        weighted = np.asarray(self.weighted_principal_matrix, dtype=np.float64)
        expected = (count, count)
        if symmetrizer.shape != expected or weighted.shape != expected:
            raise ValueError("subsidiary symmetrizer matrices must be 10 by 10")
        if not np.all(np.isfinite(symmetrizer)) or not np.all(np.isfinite(weighted)):
            raise ValueError("subsidiary symmetrizer matrices must be finite")
        object.__setattr__(self, "symmetrizer", symmetrizer)
        object.__setattr__(self, "weighted_principal_matrix", weighted)
        if tuple(self.state_order) != SUBSIDIARY_STATE_ORDER:
            raise ValueError("state_order must use the canonical subsidiary ordering")


def _digest(symmetrizer: np.ndarray, weighted: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-z4c-linearized-subsidiary-symmetrizer-v1\0")
    digest.update(np.ascontiguousarray(symmetrizer, dtype=np.float64).tobytes())
    digest.update(np.ascontiguousarray(weighted, dtype=np.float64).tobytes())
    return digest.hexdigest()


def linearized_z4c_subsidiary_symmetrizer_shadow_3d(
    *,
    normal_axis: int = 0,
    lapse: float = 1.0,
    shift_normal: float = 0.0,
    closure_tolerance: float = 1.0e-10,
    symmetry_tolerance: float = 1.0e-12,
) -> FOCCZ4SubsidiarySymmetrizerShadow3D:
    """Construct and audit the explicit diagonal symmetrizer.

    The test is for the principal matrix only.  Constant shift contributes a
    scalar multiple of the identity and therefore does not spoil symmetry.
    Lower-order source growth and nonlinear boundary data are intentionally not
    folded into this result.
    """

    if not isinstance(normal_axis, int) or normal_axis not in (0, 1, 2):
        raise ValueError("normal_axis must be one of 0, 1, or 2")
    closure_tolerance = float(closure_tolerance)
    symmetry_tolerance = float(symmetry_tolerance)
    if not math.isfinite(closure_tolerance) or closure_tolerance <= 0.0:
        raise ValueError("closure_tolerance must be finite and positive")
    if not math.isfinite(symmetry_tolerance) or symmetry_tolerance <= 0.0:
        raise ValueError("symmetry_tolerance must be finite and positive")

    subsidiary = linearized_z4c_subsidiary_shadow_3d(
        normal_axis=normal_axis,
        lapse=lapse,
        shift_normal=shift_normal,
        closure_tolerance=closure_tolerance,
    )
    count = len(SUBSIDIARY_STATE_ORDER)
    weights = np.ones(count, dtype=np.float64)
    weights[SUBSIDIARY_STATE_ORDER.index("M_n")] = 4.0
    symmetrizer = np.diag(weights)
    weighted = symmetrizer @ subsidiary.principal_matrix
    symmetry_residual = float(
        np.linalg.norm(weighted - weighted.T, ord=np.inf)
        / max(1.0, float(np.linalg.norm(weighted, ord=np.inf)))
    )
    eigenvalues = np.linalg.eigvalsh(symmetrizer)
    minimum = float(np.min(eigenvalues))
    maximum = float(np.max(eigenvalues))
    condition = float(maximum / minimum)
    positive = bool(minimum > 0.0)
    validated = bool(
        positive
        and symmetry_residual <= symmetry_tolerance
        and subsidiary.principal_closed
    )
    return FOCCZ4SubsidiarySymmetrizerShadow3D(
        normal_axis=normal_axis,
        lapse=float(lapse),
        shift_normal=float(shift_normal),
        state_order=SUBSIDIARY_STATE_ORDER,
        symmetrizer=symmetrizer,
        weighted_principal_matrix=weighted,
        symmetrizer_min_eigenvalue=minimum,
        symmetrizer_max_eigenvalue=maximum,
        symmetrizer_condition_number=condition,
        weighted_principal_symmetry_residual_l_inf=symmetry_residual,
        positive_definite=positive,
        symmetrizer_validated=validated,
        subsidiary_shadow_closed=bool(subsidiary.principal_closed),
        cpbc_ready=False,
        deterministic=True,
        symmetrizer_sha256=_digest(symmetrizer, weighted),
    )


__all__ = [
    "FOCCZ4SubsidiarySymmetrizerShadow3D",
    "linearized_z4c_subsidiary_symmetrizer_shadow_3d",
]
