"""Frozen-coefficient incoming-constraint map for the FO-CCZ4 shadow.

This module turns the existing numerical characteristic audit into an explicit
linear map on the frozen flat-background system.  Given incoming characteristic
amplitudes ``a_in`` and a constraint operator ``C`` consisting of the existing
69 ordering/definition rows plus four independent linearized Hamiltonian and
momentum principal rows, the map checks ``C R_in a_in`` and reconstructs
``a_in`` with a Moore--Penrose pseudoinverse.  It is a boundary-design
prerequisite only: it does not choose physical/radiative incoming data, does
not provide a nonlinear boundary closure, and does not prove a continuum
energy estimate.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from typing import Literal

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


CPBCOrientation = Literal["right", "left"]


@dataclass(frozen=True)
class FOCCZ4FrozenCPBCMap3D:
    """Diagnostics for one frozen incoming-constraint map."""

    points: int
    harmonic: int
    normal_axis: int
    orientation: CPBCOrientation
    phase_speed_convention: str
    incoming_mode_semantics: str
    constraint_operator_kind: str
    contains_hamiltonian_momentum_constraints: bool
    einstein_constraint_row_count: int
    variable_count: int
    constraint_count: int
    incoming_mode_count: int
    outgoing_mode_count: int
    zero_mode_count: int
    characteristic_basis_rank: int
    characteristic_basis_condition_number: float
    incoming_constraint_rank: int
    incoming_constraint_condition_number: float
    incoming_constraint_map_residual_l_inf: float
    incoming_amplitude_reconstruction_residual_l_inf: float
    direct_symbol_crosscheck_error_l_inf: float
    incoming_basis_sha256: str
    incoming_constraint_map_sha256: str
    deterministic: bool
    frozen_incoming_constraint_map_validated: bool
    analytic_symmetrizer_validated: bool = False
    nonlinear_cpbc_validated: bool = False
    physical_boundary_validated: bool = False
    cpbc_ready: bool = False
    method: str = "fo-ccz4-frozen-incoming-constraint-map-v4"


def _digest_matrix(prefix: bytes, matrix: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(prefix)
    digest.update(np.ascontiguousarray(matrix).tobytes(order="C"))
    return digest.hexdigest()


def _incoming_mask(
    speeds: np.ndarray,
    orientation: CPBCOrientation,
    tolerance: float,
) -> np.ndarray:
    # The Fourier audit stores the principal matrix A from q_t = A q_x.  A
    # mode with eigenvalue a therefore has physical coordinate speed -a.  A
    # right face has outward normal +x, so modes with a>0 enter the domain;
    # a left face has outward normal -x, so modes with a<0 enter the domain.
    if orientation == "right":
        return speeds > tolerance
    if orientation == "left":
        return speeds < -tolerance
    raise ValueError("orientation must be 'right' or 'left'")


def _build_map(
    raw: FOCCZ4PrincipalSymbolRaw3D,
    *,
    orientation: CPBCOrientation,
    gauge: GaugeConfig,
    config: FOCCZ4Config,
    rank_tolerance: float,
    crosscheck_tolerance: float,
) -> FOCCZ4FrozenCPBCMap3D:
    symbol = np.asarray(raw.symbol, dtype=np.complex128)
    direct = analytic_fo_ccz4_principal_matrix_3d(
        normal_axis=raw.report.normal_axis,
        gauge=gauge,
        config=config,
    )
    principal_from_fourier = symbol / (1j * raw.effective_wave_number)
    direct_error = float(np.max(np.abs(principal_from_fourier - direct)))
    if not math.isfinite(direct_error) or direct_error > crosscheck_tolerance:
        raise ValueError(
            "direct FO-CCZ4 principal matrix does not match the raw Fourier symbol"
        )

    eigenvectors = np.asarray(raw.full_eigenvectors, dtype=np.complex128)
    eigenvalues = np.asarray(raw.full_eigenvalues, dtype=np.complex128)
    speeds = np.imag(eigenvalues) / raw.effective_wave_number
    incoming = _incoming_mask(speeds, orientation, rank_tolerance)
    incoming_basis = eigenvectors[:, incoming]
    ordering_constraint_rows = np.asarray(raw.constraint_rows, dtype=np.complex128)
    einstein_constraint_rows = linearized_fo_ccz4_einstein_constraint_rows_3d(
        normal_axis=raw.report.normal_axis,
        effective_wave_number=raw.effective_wave_number,
    )
    constraint_rows = np.vstack((ordering_constraint_rows, einstein_constraint_rows))
    constraint_incoming = constraint_rows @ incoming_basis
    singular_values = np.linalg.svd(constraint_incoming, compute_uv=False)
    scale = max(1.0, float(singular_values[0])) if singular_values.size else 1.0
    rank = int(np.count_nonzero(singular_values > rank_tolerance * scale))
    condition = (
        float(singular_values[0] / singular_values[rank - 1])
        if rank > 0
        else float("inf")
    )
    pseudoinverse = np.linalg.pinv(constraint_incoming, rcond=rank_tolerance)
    projection_residual = float(
        np.linalg.norm(
            constraint_incoming @ pseudoinverse @ constraint_incoming
            - constraint_incoming,
            ord=np.inf,
        )
    )
    probe = np.arange(1, incoming_basis.shape[1] + 1, dtype=np.float64) + 1j * np.arange(
        incoming_basis.shape[1], 0, -1, dtype=np.float64
    )
    target = constraint_incoming @ probe
    reconstructed = pseudoinverse @ target
    amplitude_residual = float(np.max(np.abs(reconstructed - probe)))
    basis_rank = int(np.linalg.matrix_rank(eigenvectors))
    finite = all(
        math.isfinite(value)
        for value in (
            condition,
            projection_residual,
            amplitude_residual,
            direct_error,
        )
    )
    validated = bool(
        finite
        and direct_error <= crosscheck_tolerance
        and basis_rank == eigenvectors.shape[0]
        and rank == incoming_basis.shape[1]
        and projection_residual <= 1.0e-8
        and amplitude_residual <= 1.0e-8
    )
    return FOCCZ4FrozenCPBCMap3D(
        points=raw.report.points,
        harmonic=raw.report.harmonic,
        normal_axis=raw.report.normal_axis,
        orientation=orientation,
        phase_speed_convention=(
            "raw FO-CCZ4 principal eigenvalue a in q_t=A^n*partial_n q; "
            "physical coordinate speed is -a"
        ),
        incoming_mode_semantics=(
            "incoming relative to the selected geometric face under the "
            "physical speed -a convention"
        ),
        constraint_operator_kind=(
            "ordering-definition-curl-plus-algebraic-plus-linearized-"
            "hamiltonian-momentum-principal"
        ),
        contains_hamiltonian_momentum_constraints=True,
        einstein_constraint_row_count=int(einstein_constraint_rows.shape[0]),
        variable_count=int(eigenvectors.shape[0]),
        constraint_count=int(constraint_rows.shape[0]),
        incoming_mode_count=int(np.count_nonzero(incoming)),
        outgoing_mode_count=int(
            np.count_nonzero(~incoming & (np.abs(speeds) > rank_tolerance))
        ),
        zero_mode_count=int(np.count_nonzero(np.abs(speeds) <= rank_tolerance)),
        characteristic_basis_rank=basis_rank,
        characteristic_basis_condition_number=float(np.linalg.cond(eigenvectors)),
        incoming_constraint_rank=rank,
        incoming_constraint_condition_number=condition,
        incoming_constraint_map_residual_l_inf=projection_residual,
        incoming_amplitude_reconstruction_residual_l_inf=amplitude_residual,
        direct_symbol_crosscheck_error_l_inf=direct_error,
        incoming_basis_sha256=_digest_matrix(
            b"nr-k3-fo-ccz4-frozen-cpbc-incoming-basis-v3\0", incoming_basis
        ),
        incoming_constraint_map_sha256=_digest_matrix(
            b"nr-k3-fo-ccz4-frozen-cpbc-map-v3\0", pseudoinverse
        ),
        deterministic=True,
        frozen_incoming_constraint_map_validated=validated,
        method="fo-ccz4-frozen-incoming-constraint-map-v4",
    )


def linearized_fo_ccz4_frozen_cpbc_map_3d(
    *,
    points: int = 8,
    harmonic: int = 1,
    normal_axis: int = 0,
    orientation: CPBCOrientation = "right",
    amplitude: float = 1.0e-7,
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    rank_tolerance: float = 1.0e-10,
    crosscheck_tolerance: float = 1.0e-8,
) -> FOCCZ4FrozenCPBCMap3D:
    """Construct a frozen incoming-constraint map for one boundary orientation."""

    if orientation not in ("right", "left"):
        raise ValueError("orientation must be 'right' or 'left'")
    if not math.isfinite(rank_tolerance) or rank_tolerance <= 0.0:
        raise ValueError("rank_tolerance must be finite and positive")
    if not math.isfinite(crosscheck_tolerance) or crosscheck_tolerance <= 0.0:
        raise ValueError("crosscheck_tolerance must be finite and positive")
    if config.shift_strength != 1.0:
        raise ValueError(
            "frozen FO-CCZ4 CPBC map currently requires shift_strength=1"
        )
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
    return _build_map(
        raw,
        orientation=orientation,
        gauge=gauge,
        config=config,
        rank_tolerance=rank_tolerance,
        crosscheck_tolerance=crosscheck_tolerance,
    )


__all__ = [
    "CPBCOrientation",
    "FOCCZ4FrozenCPBCMap3D",
    "linearized_fo_ccz4_frozen_cpbc_map_3d",
]
