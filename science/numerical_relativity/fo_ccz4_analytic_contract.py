"""Small analytic contracts for the flat-background FO-CCZ4 reduction.

The published FO-CCZ4 ordering separates eleven kinematic variables from the
spatial PDE block.  On the flat background and with zero shift, the principal
part of those eleven rows and columns is zero, so the canonical unit vectors
form an eleven-dimensional zero-speed ODE basis.  This module records that
limited contract and checks it against the independently assembled 58-by-58
shadow symbol.

This is intentionally *not* a proof of the full 58-variable analytic
eigenstructure, a continuum symmetrizer, strong hyperbolicity, or CPBC.  It is
the first independently named sub-gate on the path to those proofs.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4 import FOCCZ4_ODE_VARIABLES, FOCCZ4_VARIABLE_ORDER
from .fo_ccz4_principal_symbol import (
    FOCCZ4PrincipalSymbolRaw3D,
    linearized_fo_ccz4_principal_symbol_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config


@dataclass(frozen=True)
class FOCCZ4ODEBlockAudit3D:
    """Audit result for the eleven flat-background ODE variables."""

    points: int
    harmonic: int
    normal_axis: int
    variable_names: tuple[str, ...]
    variable_count: int
    zero_speed_count: int
    canonical_basis_rank: int
    principal_row_residual_l_inf: float
    principal_column_residual_l_inf: float
    canonical_basis_residual_l_inf: float
    residual_tolerance: float
    variable_order_sha256: str
    symbol_sha256: str
    method: str = "flat-minkowski-fo-ccz4-ode-block-contract-v1"
    flat_ode_block_validated: bool = False
    analytic_full_eigenvectors_validated: bool = False
    strong_hyperbolicity_validated: bool = False
    constraint_preserving_validated: bool = False
    physical_boundary_validated: bool = False


def _digest_matrix(matrix: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(b"nr-k1-fo-ccz4-ode-block-symbol-v1\0")
    digest.update(np.ascontiguousarray(matrix, dtype=np.complex128).tobytes())
    return digest.hexdigest()


def _digest_variable_order() -> str:
    digest = hashlib.sha256()
    digest.update("\0".join(FOCCZ4_VARIABLE_ORDER).encode("ascii"))
    return digest.hexdigest()


def audit_fo_ccz4_ode_block_3d(
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
    residual_tolerance: float = 1.0e-10,
) -> FOCCZ4ODEBlockAudit3D:
    """Check the canonical zero-speed ODE block against the shadow symbol.

    The analytic part is the canonical unit basis and the flat-background
    statement that its principal speed is zero.  The numerical symbol check
    is an independent guard against a variable-order or Fourier-normalization
    regression; it deliberately does not promote the basis to a production
    characteristic solver.
    """

    if tuple(FOCCZ4_VARIABLE_ORDER[: len(FOCCZ4_ODE_VARIABLES)]) != tuple(
        FOCCZ4_ODE_VARIABLES
    ):
        raise AssertionError("FO-CCZ4 ODE/PDE variable split is not a prefix contract")
    if len(FOCCZ4_ODE_VARIABLES) != 11:
        raise AssertionError("FO-CCZ4 flat ODE block must contain eleven variables")
    if not math.isfinite(float(residual_tolerance)) or residual_tolerance <= 0.0:
        raise ValueError("residual_tolerance must be finite and positive")

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
        raise AssertionError("principal symbol audit did not return raw matrices")
    symbol = np.asarray(raw.symbol, dtype=np.complex128)
    block_size = len(FOCCZ4_ODE_VARIABLES)
    if symbol.shape != (len(FOCCZ4_VARIABLE_ORDER),) * 2:
        raise AssertionError("FO-CCZ4 principal symbol has an unexpected shape")
    canonical_basis = np.eye(symbol.shape[0], block_size, dtype=np.complex128)
    row_residual = float(np.max(np.abs(symbol[:block_size, :])))
    column_residual = float(np.max(np.abs(symbol[:, :block_size])))
    basis_residual = float(np.max(np.abs(symbol @ canonical_basis)))
    basis_rank = int(np.linalg.matrix_rank(canonical_basis))
    validated = bool(
        np.all(np.isfinite(symbol))
        and basis_rank == block_size
        and row_residual <= residual_tolerance
        and column_residual <= residual_tolerance
        and basis_residual <= residual_tolerance
    )
    return FOCCZ4ODEBlockAudit3D(
        points=raw.report.points,
        harmonic=raw.report.harmonic,
        normal_axis=raw.report.normal_axis,
        variable_names=tuple(FOCCZ4_ODE_VARIABLES),
        variable_count=len(FOCCZ4_VARIABLE_ORDER),
        zero_speed_count=block_size,
        canonical_basis_rank=basis_rank,
        principal_row_residual_l_inf=row_residual,
        principal_column_residual_l_inf=column_residual,
        canonical_basis_residual_l_inf=basis_residual,
        residual_tolerance=float(residual_tolerance),
        variable_order_sha256=_digest_variable_order(),
        symbol_sha256=_digest_matrix(symbol),
        flat_ode_block_validated=validated,
    )


__all__ = ["FOCCZ4ODEBlockAudit3D", "audit_fo_ccz4_ode_block_3d"]
