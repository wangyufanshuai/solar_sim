"""Linearized Hamiltonian/momentum principal rows for the FO-CCZ4 shadow.

The existing 72-row FO constraint map audits auxiliary definitions, curl/order
constraints, and algebraic conditions.  This module adds the four independent
vacuum Einstein-constraint principal rows needed by a boundary precondition:
the linearized Hamiltonian row and the three linearized momentum rows around
flat space.  They are written in the canonical 58-slot FO-CCZ4 ordering.

The ``K`` slot in the FO-CCZ4 state is the physical trace
``K = gamma^{ij} K_ij``.  The ``K+2 Theta`` combination belongs to the Z4c
variable ``K_hat = K-2 Theta``; it must not be reintroduced here when the
physical ``K`` slot is evolved.  This distinction is kept explicit because a
pure ``Theta`` perturbation with fixed physical ``K`` has zero ADM momentum.

This is a frozen-coefficient principal operator only.  It is not the full
nonlinear constraint-propagation system, a symmetrizer, or a CPBC closure.
"""

from __future__ import annotations

import math

import numpy as np

from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER


def _index(name: str) -> int:
    return FOCCZ4_VARIABLE_ORDER.index(name)


def _symmetric_name(prefix: str, first: int, second: int) -> str:
    low, high = sorted((first, second))
    return f"{prefix}{low}{high}"


def _derivative_symmetric_name(
    derivative_axis: int,
    first: int,
    second: int,
) -> str:
    low, high = sorted((first, second))
    return f"D{derivative_axis}{low}{high}"


def linearized_fo_ccz4_einstein_constraint_rows_3d(
    *,
    normal_axis: int = 0,
    effective_wave_number: float = 1.0,
) -> np.ndarray:
    """Return the frozen Fourier rows ``(H, M_0, M_1, M_2)``.

    The FO convention is ``D_kij = 1/2 d_k h_ij`` and
    ``P_k = d_k ln(phi)`` with ``chi = phi**2``.  For a wave along ``n``:

    ``H = d_n 2(D_{j n j} - D_{n j j} + 2 P_n)``;

    ``M_i = d_n(A_{i n} - 2/3 delta_{in} K)``.

    ``d_n`` is represented by ``1j * effective_wave_number``.  The returned
    rows therefore act on complex Fourier amplitudes in the same convention as
    ``linearized_fo_ccz4_principal_symbol_3d``.
    """

    if not isinstance(normal_axis, int) or normal_axis not in (0, 1, 2):
        raise ValueError("normal_axis must be one of 0, 1, or 2")
    effective_wave_number = float(effective_wave_number)
    if not math.isfinite(effective_wave_number) or effective_wave_number <= 0.0:
        raise ValueError("effective_wave_number must be finite and positive")

    rows = np.zeros((4, len(FOCCZ4_VARIABLE_ORDER)), dtype=np.complex128)
    derivative = 1j * effective_wave_number

    # Linearized scalar curvature of gamma_ij = h_ij / chi, with
    # d_n gamma_ij = 2 D_nij - 2 P_n delta_ij.
    for index in range(3):
        rows[0, _index(_derivative_symmetric_name(index, normal_axis, index))] += (
            2.0 * derivative
        )
        rows[0, _index(_derivative_symmetric_name(normal_axis, index, index))] -= (
            2.0 * derivative
        )
    rows[0, _index(f"P{normal_axis}")] += 4.0 * derivative

    # M_i = partial_j A_ij - 2/3 partial_i K.  The FO-CCZ4 K slot is
    # physical K; only a Z4c formulation evolving K_hat would substitute
    # K_hat + 2 Theta for this slot.
    trace_k_index = _index("K")
    for component in range(3):
        rows[component + 1, _index(_symmetric_name("A", component, normal_axis))] += derivative
        if component == normal_axis:
            rows[component + 1, trace_k_index] -= (2.0 / 3.0) * derivative
    return rows


__all__ = ["linearized_fo_ccz4_einstein_constraint_rows_3d"]
