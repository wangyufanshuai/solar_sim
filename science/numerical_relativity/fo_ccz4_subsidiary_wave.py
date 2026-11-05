"""First-order wave reduction of the linearized Z4c subsidiary system.

The frozen principal equations of the Z4/Z4c subsidiary system are wave
equations for the eight quantities
``(Theta, Z_i, H, M_i)``.  This module introduces, for each quantity ``u``,
the normal-time derivative ``P_u = partial_0 u`` and normal-space derivative
``Q_u = partial_n u``.  With constant lapse ``alpha`` and normal shift
``beta`` the normal system is

``u_t = beta u_n + P_u``
``P_u,t = beta P_u,n + alpha**2 Q_u,n``
``Q_u,t = beta Q_u,n + P_u,n``.

The principal eigenvalues of ``P_u +/- alpha Q_u`` are ``beta +/- alpha``;
their physical coordinate speeds are their negatives because ``q_t=A q_n``.
The eight ``u`` rows have eigenvalue ``beta`` and must be included in the
incoming census when the normal shift is nonzero.  The eight compatibility rows
``Q_u - partial_n u`` close exactly.  This is the mathematically closed
subsidiary wave contract needed by a later CPBC derivation; it is not yet a
projection of the repository's 58 FO-CCZ4 variables and never writes to the
runtime.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math

import numpy as np


SUBSIDIARY_WAVE_FIELDS: tuple[str, ...] = (
    "Theta",
    "Z_n",
    "Z_t1",
    "Z_t2",
    "H",
    "M_n",
    "M_t1",
    "M_t2",
)
SUBSIDIARY_WAVE_STATE_ORDER: tuple[str, ...] = tuple(
    f"{field}_{component}"
    for field in SUBSIDIARY_WAVE_FIELDS
    for component in ("u", "P", "Q")
)


@dataclass(frozen=True)
class FOCCZ4SubsidiaryWaveShadow3D:
    """Frozen 24-state Z4c subsidiary-wave audit."""

    normal_axis: int
    lapse: float
    shift_normal: float
    effective_wave_number: float
    state_order: tuple[str, ...]
    principal_matrix: np.ndarray
    source_matrix: np.ndarray
    characteristic_speeds: tuple[float, ...]
    positive_speed_count: int
    negative_speed_count: int
    zero_speed_count: int
    compatibility_constraint_count: int
    compatibility_constraint_rank: int
    compatibility_propagation_rank: int
    compatibility_closure_residual_l_inf: float
    right_incoming_count: int
    left_incoming_count: int
    right_incoming_characteristic_rows: tuple[str, ...]
    left_incoming_characteristic_rows: tuple[str, ...]
    subsidiary_wave_closed: bool
    projection_from_fo_ccz4_validated: bool
    cpbc_ready: bool
    deterministic: bool
    principal_matrix_sha256: str
    phase_speed_convention: str = "q_t=A*q_n+S*q; physical coordinate speed=-eigenvalue(A)"
    method: str = "z4c-linearized-subsidiary-wave-shadow-v2-face-orientation"

    def __post_init__(self) -> None:
        expected_shape = (len(SUBSIDIARY_WAVE_STATE_ORDER),) * 2
        matrix = np.asarray(self.principal_matrix, dtype=np.float64)
        source = np.asarray(self.source_matrix, dtype=np.float64)
        if matrix.shape != expected_shape or source.shape != expected_shape:
            raise ValueError("subsidiary-wave matrices must be 24 by 24")
        if not np.all(np.isfinite(matrix)) or not np.all(np.isfinite(source)):
            raise ValueError("subsidiary-wave matrices must be finite")
        object.__setattr__(self, "principal_matrix", matrix)
        object.__setattr__(self, "source_matrix", source)
        if tuple(self.state_order) != SUBSIDIARY_WAVE_STATE_ORDER:
            raise ValueError("state_order must use the canonical wave ordering")


def _matrix_digest(principal: np.ndarray, source: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k3-z4c-linearized-subsidiary-wave-shadow-v1\0")
    digest.update(np.ascontiguousarray(principal, dtype=np.float64).tobytes())
    digest.update(np.ascontiguousarray(source, dtype=np.float64).tobytes())
    return digest.hexdigest()


def _compatibility_rows(*, effective_wave_number: float) -> np.ndarray:
    rows = np.zeros(
        (len(SUBSIDIARY_WAVE_FIELDS), len(SUBSIDIARY_WAVE_STATE_ORDER)),
        dtype=np.complex128,
    )
    derivative = 1j * effective_wave_number
    for field_index, field in enumerate(SUBSIDIARY_WAVE_FIELDS):
        base = 3 * field_index
        rows[field_index, base] = -derivative
        rows[field_index, base + 2] = 1.0
    return rows


def _characteristic_rows(
    *,
    lapse: float,
) -> tuple[tuple[str, np.ndarray], ...]:
    rows: list[tuple[str, np.ndarray]] = []
    for field_index, field in enumerate(SUBSIDIARY_WAVE_FIELDS):
        base = 3 * field_index
        plus = np.zeros(len(SUBSIDIARY_WAVE_STATE_ORDER), dtype=np.float64)
        minus = plus.copy()
        plus[base + 1] = 1.0
        plus[base + 2] = lapse
        minus[base + 1] = 1.0
        minus[base + 2] = -lapse
        transported = np.zeros(len(SUBSIDIARY_WAVE_STATE_ORDER), dtype=np.float64)
        transported[base] = 1.0
        rows.append((f"{field}:P+alphaQ", plus))
        rows.append((f"{field}:P-alphaQ", minus))
        rows.append((f"{field}:u", transported))
    return tuple(rows)


def _left_characteristic_speed(row: np.ndarray, matrix: np.ndarray) -> float:
    """Recover a principal eigenvalue, whose physical speed has opposite sign."""

    action = row @ matrix
    support = np.flatnonzero(np.abs(row) > 1.0e-14)
    if support.size == 0:  # pragma: no cover - rows are constructed nonzero
        raise AssertionError("characteristic row has empty support")
    candidate = action[support] / row[support]
    if not np.allclose(candidate, candidate[0], rtol=0.0, atol=1.0e-12):
        raise AssertionError("constructed characteristic row is not a left eigen-row")
    return float(candidate[0])


def linearized_z4c_subsidiary_wave_shadow_3d(
    *,
    normal_axis: int = 0,
    lapse: float = 1.0,
    shift_normal: float = 0.0,
    effective_wave_number: float = 1.0,
    closure_tolerance: float = 1.0e-10,
) -> FOCCZ4SubsidiaryWaveShadow3D:
    """Build the closed frozen subsidiary wave system and boundary census."""

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

    count = len(SUBSIDIARY_WAVE_STATE_ORDER)
    principal = shift_normal * np.eye(count, dtype=np.float64)
    source = np.zeros((count, count), dtype=np.float64)
    for field_index in range(len(SUBSIDIARY_WAVE_FIELDS)):
        base = 3 * field_index
        # u_t = beta u_n + P; the P term is lower order in the normal symbol.
        source[base, base + 1] = 1.0
        # P_t = beta P_n + alpha^2 Q_n; Q_t = beta Q_n + P_n.
        principal[base + 1, base + 2] = lapse * lapse
        principal[base + 2, base + 1] = 1.0

    compatibility = _compatibility_rows(effective_wave_number=effective_wave_number)
    full_operator = 1j * effective_wave_number * principal.astype(np.complex128)
    full_operator += source.astype(np.complex128)
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
    positive = int(sum(value > 1.0e-12 for value in speed_values))
    negative = int(sum(value < -1.0e-12 for value in speed_values))
    zero = len(speed_values) - positive - negative
    characteristic_rows = _characteristic_rows(lapse=lapse)
    right_incoming = tuple(
        name
        for name, row in characteristic_rows
        if _left_characteristic_speed(row, principal) > 1.0e-12
    )
    left_incoming = tuple(
        name
        for name, row in characteristic_rows
        if _left_characteristic_speed(row, principal) < -1.0e-12
    )
    return FOCCZ4SubsidiaryWaveShadow3D(
        normal_axis=normal_axis,
        lapse=lapse,
        shift_normal=shift_normal,
        effective_wave_number=effective_wave_number,
        state_order=SUBSIDIARY_WAVE_STATE_ORDER,
        principal_matrix=principal,
        source_matrix=source,
        characteristic_speeds=speed_values,
        positive_speed_count=positive,
        negative_speed_count=negative,
        zero_speed_count=zero,
        compatibility_constraint_count=int(compatibility.shape[0]),
        compatibility_constraint_rank=int(np.linalg.matrix_rank(compatibility)),
        compatibility_propagation_rank=int(
            np.linalg.matrix_rank(compatibility_propagation)
        ),
        compatibility_closure_residual_l_inf=closure_residual,
        right_incoming_count=len(right_incoming),
        left_incoming_count=len(left_incoming),
        right_incoming_characteristic_rows=right_incoming,
        left_incoming_characteristic_rows=left_incoming,
        subsidiary_wave_closed=bool(closure_residual <= closure_tolerance),
        projection_from_fo_ccz4_validated=False,
        cpbc_ready=False,
        deterministic=True,
        principal_matrix_sha256=_matrix_digest(principal, source),
    )


__all__ = [
    "FOCCZ4SubsidiaryWaveShadow3D",
    "SUBSIDIARY_WAVE_FIELDS",
    "SUBSIDIARY_WAVE_STATE_ORDER",
    "linearized_z4c_subsidiary_wave_shadow_3d",
]
