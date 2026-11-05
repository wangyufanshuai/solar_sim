"""Linearized Z4c subsidiary-system contract for the FO-CCZ4 shadow.

The 76-row operator in :mod:`fo_ccz4_constraint_propagation` is a useful
measurement map, but it is not itself a closed constraint evolution system.
This module records the smaller frozen-coefficient subsidiary system that
follows from the linearized Z4c equations around flat space with constant
lapse and normal shift.  It is deliberately a *derivation fixture*, not a
replacement for the 58-variable FO-CCZ4 PDE.

For a normal direction ``n`` the longitudinal principal equations are

``Theta_t = beta_n Theta_n + alpha (Z_n,n + H/2)``
``Z_n,t   = beta_n Z_n,n   + alpha (Theta_n + M_n)``
``H_t     = beta_n H_n     - 2 alpha M_n,n``
``M_n,t   = beta_n M_n,n   - alpha H_n/2``.

The transverse momentum equation contains ``partial_n^2 Z_A``.  Introducing
``Q_A = partial_n Z_A`` gives the first-order normal subsystem
``Z_A,t = beta_n Z_A,n + alpha M_A``,
``Q_A,t = beta_n Q_A,n + alpha M_A,n``, and
``M_A,t = beta_n M_A,n + alpha Q_A,n``.
The compatibility rows ``Q_A - partial_n Z_A`` close exactly; the two zero
speed fields are the ordering/compatibility sector.  This is the structure
needed before deriving formulation-specific CPBCs.

The projection from the current 58 FO-CCZ4 slots to ``Z_i`` and this
subsidiary state has not yet been derived or validated.  Consequently this
contract never enables runtime writeback, incoming boundary penalties, or
promotion of the FO-CCZ4 solver.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math

import numpy as np


SUBSIDIARY_STATE_ORDER: tuple[str, ...] = (
    "Theta",
    "Z_n",
    "H",
    "M_n",
    "Z_t1",
    "Q_t1",
    "M_t1",
    "Z_t2",
    "Q_t2",
    "M_t2",
)


@dataclass(frozen=True)
class FOCCZ4SubsidiaryShadow3D:
    """Frozen normal-direction Z4c subsidiary-system audit."""

    normal_axis: int
    lapse: float
    shift_normal: float
    effective_wave_number: float
    state_order: tuple[str, ...]
    principal_matrix: np.ndarray
    source_matrix: np.ndarray
    characteristic_speeds: tuple[float, ...]
    compatibility_constraint_count: int
    compatibility_constraint_rank: int
    compatibility_propagation_rank: int
    compatibility_closure_residual_l_inf: float
    principal_closed: bool
    projection_from_fo_ccz4_validated: bool
    cpbc_ready: bool
    deterministic: bool
    principal_matrix_sha256: str
    method: str = "z4c-linearized-subsidiary-shadow-v1"

    def __post_init__(self) -> None:
        matrix = np.asarray(self.principal_matrix, dtype=np.float64)
        source = np.asarray(self.source_matrix, dtype=np.float64)
        expected = (len(SUBSIDIARY_STATE_ORDER),) * 2
        if matrix.shape != expected or source.shape != expected:
            raise ValueError("subsidiary matrices must be 10 by 10")
        if not np.all(np.isfinite(matrix)) or not np.all(np.isfinite(source)):
            raise ValueError("subsidiary matrices must be finite")
        object.__setattr__(self, "principal_matrix", matrix)
        object.__setattr__(self, "source_matrix", source)
        if tuple(self.state_order) != SUBSIDIARY_STATE_ORDER:
            raise ValueError("state_order must use the canonical subsidiary ordering")


def _matrix_digest(principal: np.ndarray, source: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-z4c-linearized-subsidiary-shadow-v1\0")
    digest.update(np.ascontiguousarray(principal, dtype=np.float64).tobytes())
    digest.update(np.ascontiguousarray(source, dtype=np.float64).tobytes())
    return digest.hexdigest()


def _compatibility_rows(
    *,
    effective_wave_number: float,
    normal_shift: float,
) -> np.ndarray:
    """Return Fourier rows for ``Q_A - d_n Z_A``.

    The shift argument is retained in the signature to make the coordinate
    advection convention explicit.  It does not change the row operator.
    """

    del normal_shift
    rows = np.zeros((2, len(SUBSIDIARY_STATE_ORDER)), dtype=np.complex128)
    derivative = 1j * effective_wave_number
    rows[0, SUBSIDIARY_STATE_ORDER.index("Z_t1")] = -derivative
    rows[0, SUBSIDIARY_STATE_ORDER.index("Q_t1")] = 1.0
    rows[1, SUBSIDIARY_STATE_ORDER.index("Z_t2")] = -derivative
    rows[1, SUBSIDIARY_STATE_ORDER.index("Q_t2")] = 1.0
    return rows


def linearized_z4c_subsidiary_shadow_3d(
    *,
    normal_axis: int = 0,
    lapse: float = 1.0,
    shift_normal: float = 0.0,
    effective_wave_number: float = 1.0,
    closure_tolerance: float = 1.0e-10,
) -> FOCCZ4SubsidiaryShadow3D:
    """Build and audit the flat-background Z4c subsidiary normal block.

    ``principal_matrix`` follows ``q_t = A^n partial_n q + S q``.  Therefore
    its coordinate characteristic speeds are the eigenvalues of ``A^n``;
    physical propagation relative to the normal is obtained by subtracting
    the normal shift and dividing by the lapse when those quantities are
    non-unit.  The report is a mathematical closure contract only.
    """

    if not isinstance(normal_axis, int) or normal_axis not in (0, 1, 2):
        raise ValueError("normal_axis must be one of 0, 1, or 2")
    lapse = float(lapse)
    shift_normal = float(shift_normal)
    effective_wave_number = float(effective_wave_number)
    closure_tolerance = float(closure_tolerance)
    if not math.isfinite(lapse) or lapse <= 0.0:
        raise ValueError("lapse must be finite and positive")
    if not math.isfinite(shift_normal):
        raise ValueError("shift_normal must be finite")
    if not math.isfinite(effective_wave_number) or effective_wave_number <= 0.0:
        raise ValueError("effective_wave_number must be finite and positive")
    if not math.isfinite(closure_tolerance) or closure_tolerance <= 0.0:
        raise ValueError("closure_tolerance must be finite and positive")

    # The frozen flat background is isotropic; retain the axis in the report
    # so receipts can be compared with the three FO-CCZ4 normal directions.
    count = len(SUBSIDIARY_STATE_ORDER)
    principal = shift_normal * np.eye(count, dtype=np.float64)
    source = np.zeros((count, count), dtype=np.float64)
    index = {name: position for position, name in enumerate(SUBSIDIARY_STATE_ORDER)}

    # Longitudinal (Theta, Z_n) gauge/constraint pair.
    principal[index["Theta"], index["Z_n"]] = lapse
    principal[index["Z_n"], index["Theta"]] = lapse
    source[index["Theta"], index["H"]] = 0.5 * lapse
    source[index["Z_n"], index["M_n"]] = lapse

    # Longitudinal (H, M_n) Einstein-constraint pair.
    principal[index["H"], index["M_n"]] = -2.0 * lapse
    principal[index["M_n"], index["H"]] = -0.5 * lapse

    # Two transverse first-order reductions of the Z_A wave equations.
    for z_name, q_name, m_name in (
        ("Z_t1", "Q_t1", "M_t1"),
        ("Z_t2", "Q_t2", "M_t2"),
    ):
        source[index[z_name], index[m_name]] = lapse
        principal[index[q_name], index[m_name]] = lapse
        principal[index[m_name], index[q_name]] = lapse

    compatibility = _compatibility_rows(
        effective_wave_number=effective_wave_number,
        normal_shift=shift_normal,
    )
    # The compatibility rows are transported with the normal shift.  The
    # lower-order source in ``Z_A,t = alpha M_A`` must be retained here:
    # differentiating that source is part of the first-order reduction.  Solving
    # for B in C (i*k*A + S) = B C provides a non-tautological closure check.
    principal_complex = np.asarray(principal, dtype=np.complex128)
    source_complex = np.asarray(source, dtype=np.complex128)
    full_operator = 1j * effective_wave_number * principal_complex + source_complex
    propagated = compatibility @ full_operator
    compatibility_propagation = propagated @ np.linalg.pinv(compatibility)
    closure_residual = float(
        np.linalg.norm(
            compatibility_propagation @ compatibility - propagated,
            ord=np.inf,
        )
        / max(1.0, float(np.linalg.norm(propagated, ord=np.inf)))
    )
    speeds = np.linalg.eigvals(principal)
    speed_values = tuple(sorted(float(value.real) for value in speeds))
    return FOCCZ4SubsidiaryShadow3D(
        normal_axis=int(normal_axis),
        lapse=lapse,
        shift_normal=shift_normal,
        effective_wave_number=effective_wave_number,
        state_order=SUBSIDIARY_STATE_ORDER,
        principal_matrix=principal,
        source_matrix=source,
        characteristic_speeds=speed_values,
        compatibility_constraint_count=int(compatibility.shape[0]),
        compatibility_constraint_rank=int(np.linalg.matrix_rank(compatibility)),
        compatibility_propagation_rank=int(
            np.linalg.matrix_rank(compatibility_propagation)
        ),
        compatibility_closure_residual_l_inf=closure_residual,
        principal_closed=bool(closure_residual <= closure_tolerance),
        projection_from_fo_ccz4_validated=False,
        cpbc_ready=False,
        deterministic=True,
        principal_matrix_sha256=_matrix_digest(principal, source),
    )


__all__ = [
    "FOCCZ4SubsidiaryShadow3D",
    "SUBSIDIARY_STATE_ORDER",
    "linearized_z4c_subsidiary_shadow_3d",
]
