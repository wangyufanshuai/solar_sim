"""Rejected local-symbol scaling model, retained as a negative control.

This module is the first algebraic bridge from the metric-frame contract to a
pointwise FO-CCZ4 operator.  It performs the following *shadow* construction:

1. build a metric-orthonormal frame from ``gamma_ij`` and the boundary normal;
2. assemble the existing flat analytic symbol in that frame;
3. scale the symbol by local lapse and ``sqrt(gamma**nn)`` and add ``beta^n``;
4. transform all 58 tensor slots back through the general frame map.

This construction fails against the actual RHS even at CONSTANT coefficients:
the Gamma-driver blocks do not share the lapse/light-speed scaling, the 11
ODE rows must not receive spatial advection, and gamma alone loses the h/chi
split. Adding coefficient gradients cannot repair those errors. Its internal
similarity identity remains useful only as an algebraic negative control.
Use fo_ccz4_frozen_symbol for the implemented principal coefficients. Never
use this proxy to infer a characteristic boundary operator or physics gate.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_analytic_symbol import (
    analytic_fo_ccz4_principal_matrix_3d,
    fo_ccz4_frame_representation_3d,
)
from .fo_ccz4_local_frame_shadow import local_orthonormal_frame_from_metric_3d
from .fo_ccz4_rhs import FOCCZ4Config


@dataclass(frozen=True)
class FOCCZ4LocalPrincipalProxy3D:
    """Diagnostics for one locally transformed frozen principal operator."""

    variable_count: int
    lapse: float
    beta_n: float
    gamma_nn: float
    coordinate_normal_scale: float
    effective_lapse_coefficient: float
    frame_condition_number: float
    operator_similarity_residual_l_inf: float
    operator_imaginary_l_inf: float
    operator_eigenvalue_real_min: float
    operator_eigenvalue_real_max: float
    operator_sha256: str
    deterministic: bool
    local_similarity_validated: bool
    rhs_principal_consistency_validated: bool
    variable_coefficient_principal_proxy_validated: bool
    variable_coefficient_boundary_validated: bool
    nonlinear_cpbc_validated: bool
    physical_boundary_validated: bool
    runtime_writeback: bool
    method: str = "fo-ccz4-local-frozen-principal-proxy-v1"

    def __post_init__(self) -> None:
        if self.variable_count != 58:
            raise ValueError("FO-CCZ4 local proxy requires 58 variables")
        if not self.operator_sha256 or len(self.operator_sha256) != 64:
            raise ValueError("operator_sha256 must be a SHA-256 digest")


def linearized_fo_ccz4_local_principal_proxy_3d(
    metric: np.ndarray,
    lapse: float,
    shift: np.ndarray,
    normal_covector: np.ndarray,
    *,
    gauge: GaugeConfig = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    ),
    config: FOCCZ4Config = FOCCZ4Config(kappa1=0.0),
    tolerance: float = 1.0e-12,
) -> tuple[np.ndarray, FOCCZ4LocalPrincipalProxy3D]:
    """Reproduce the rejected local scaling model and its algebraic audit.

    The lapse scaling uses an effective flat-frame gauge coefficient
    ``f_eff=f/alpha`` before multiplying the complete principal matrix by
    ``alpha*sqrt(gamma**nn)``.  This reproduces the local proxy speed law
    ``c_lapse=sqrt(f*alpha)*sqrt(gamma**nn)`` while leaving the light and
    Gamma-driver families proportional to ``alpha*sqrt(gamma**nn)``.
    """

    tolerance = float(tolerance)
    if not math.isfinite(tolerance) or tolerance < 0.0:
        raise ValueError("tolerance must be finite and non-negative")
    alpha = float(lapse)
    if not math.isfinite(alpha) or alpha <= 0.0:
        raise ValueError("lapse must be finite and positive")
    shift_vector = np.asarray(shift, dtype=np.float64)
    normal = np.asarray(normal_covector, dtype=np.float64)
    if shift_vector.shape != (3,) or not np.all(np.isfinite(shift_vector)):
        raise ValueError("shift must contain three finite components")
    if normal.shape != (3,) or not np.all(np.isfinite(normal)):
        raise ValueError("normal_covector must contain three finite components")
    if float(np.linalg.norm(normal)) <= tolerance:
        raise ValueError("normal_covector must be non-zero")

    local_frame = local_orthonormal_frame_from_metric_3d(
        metric,
        normal,
        tolerance=tolerance,
    )
    metric_array = np.asarray(metric, dtype=np.float64)
    inverse_metric = np.linalg.inv(metric_array)
    gamma_nn = float(normal @ inverse_metric @ normal)
    if not math.isfinite(gamma_nn) or gamma_nn <= tolerance:
        raise ValueError("metric inverse must be positive along the normal")
    normal_scale = math.sqrt(gamma_nn)
    beta_n = float(shift_vector @ normal)
    if not math.isfinite(beta_n):
        raise ValueError("normal shift must be finite")
    effective_lapse_coefficient = float(gauge.lapse_coefficient / alpha)
    local_gauge = GaugeConfig(
        lapse_driver=gauge.lapse_driver,
        lapse_coefficient=effective_lapse_coefficient,
        shift_driver=gauge.shift_driver,
        shift_coefficient=gauge.shift_coefficient,
        shift_damping=gauge.shift_damping,
        theta_coupling=gauge.theta_coupling,
        advective=gauge.advective,
    )
    frame_symbol = analytic_fo_ccz4_principal_matrix_3d(
        normal_axis=0,
        gauge=local_gauge,
        config=config,
    )
    frame_operator = alpha * normal_scale * frame_symbol
    frame_operator = frame_operator + beta_n * np.eye(frame_symbol.shape[0], dtype=np.float64)
    representation = fo_ccz4_frame_representation_3d(local_frame)
    representation_inverse = np.linalg.inv(representation)
    operator = representation_inverse @ frame_operator @ representation
    similarity_residual = float(
        np.max(np.abs(representation @ operator - frame_operator @ representation))
    )
    eigenvalues = np.linalg.eigvals(operator)
    imaginary = float(np.max(np.abs(np.imag(eigenvalues))))
    real_eigenvalues = np.real(eigenvalues)
    if not np.all(np.isfinite(operator)) or not np.all(np.isfinite(eigenvalues)):
        raise ValueError("local principal proxy must be finite")
    digest = hashlib.sha256()
    digest.update(np.ascontiguousarray(operator, dtype=np.float64).tobytes())
    proxy = FOCCZ4LocalPrincipalProxy3D(
        variable_count=operator.shape[0],
        lapse=alpha,
        beta_n=beta_n,
        gamma_nn=gamma_nn,
        coordinate_normal_scale=normal_scale,
        effective_lapse_coefficient=effective_lapse_coefficient,
        frame_condition_number=float(np.linalg.cond(local_frame)),
        operator_similarity_residual_l_inf=similarity_residual,
        operator_imaginary_l_inf=imaginary,
        operator_eigenvalue_real_min=float(np.min(real_eigenvalues)),
        operator_eigenvalue_real_max=float(np.max(real_eigenvalues)),
        operator_sha256=digest.hexdigest(),
        deterministic=True,
        local_similarity_validated=bool(similarity_residual <= 1.0e-10),
        rhs_principal_consistency_validated=False,
        variable_coefficient_principal_proxy_validated=False,
        variable_coefficient_boundary_validated=False,
        nonlinear_cpbc_validated=False,
        physical_boundary_validated=False,
        runtime_writeback=False,
    )
    return operator, proxy


__all__ = [
    "FOCCZ4LocalPrincipalProxy3D",
    "linearized_fo_ccz4_local_principal_proxy_3d",
]
