"""Local variable-coefficient boundary audit for the FO-CCZ4 shadow.

The frozen characteristic SAT currently lives at the Minkowski principal
symbol.  A production boundary operator cannot reuse that matrix unchanged
when ``alpha``, ``beta^i`` or ``gamma_ij`` vary over the outer faces.  This
module therefore audits the local coefficients first:

* ``gamma_ij = chi**-1 h_ij`` must be symmetric positive definite;
* the physical, 1+log and Gamma-driver speed scales are evaluated at every
  oriented face sample;
* the intrinsic speed deviation from the flat reference is recorded;
* the complete coefficient census is hashed for deterministic replay.

The historical shift-speed formula below is NOT the Gamma-driver speed of
the implemented system: it wrongly includes alpha*sqrt(chi). It is retained
for provenance, not corrected in place into an unrelated spectrum contract.
Only metric positivity and finiteness of proxy values can pass here;
local_characteristic_speed_validated is always false. See the direct frozen
symbol and its published-family eigenspace audit for the replacement.

This is a coefficient census only.  It does not construct a local
eigenbasis, a variable-coefficient symmetrizer, a nonlinear CPBC, a physical
outer boundary, or a runtime writeback path.  Keeping those flags false is
intentional and prevents a scalar/frozen penalty from being promoted merely
because the local metric is well behaved.
"""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from typing import Literal

import numpy as np

from .ccz4_reference import GaugeConfig
from .nr3d import BSSNState3D


LocalBoundaryOrientation = Literal["left", "right"]


@dataclass(frozen=True)
class FOCCZ4VariableCoefficientBoundaryAudit3D:
    """Deterministic local coefficient and speed census on outer faces."""

    axes: tuple[int, ...]
    face_count: int
    boundary_cell_count: int
    min_conformal_metric_eigenvalue: float
    max_conformal_metric_eigenvalue: float
    min_physical_metric_eigenvalue: float
    max_physical_metric_eigenvalue: float
    max_conformal_metric_condition_number: float
    max_physical_metric_condition_number: float
    min_lapse: float
    max_lapse: float
    min_chi: float
    max_chi: float
    min_gamma_nn: float
    max_gamma_nn: float
    min_light_speed: float
    max_light_speed: float
    min_lapse_speed: float
    max_lapse_speed: float
    min_shift_speed: float
    max_shift_speed: float
    min_speed: float
    max_speed: float
    min_beta_n: float
    max_beta_n: float
    max_advection_speed: float
    max_metric_identity_deviation: float
    max_intrinsic_speed_relative_deviation: float
    coefficient_sha256: str
    deterministic: bool
    positive_definite_metric_validated: bool
    proxy_speed_coefficients_finite: bool
    local_characteristic_speed_validated: bool
    variable_coefficient_boundary_validated: bool
    nonlinear_cpbc_validated: bool
    physical_boundary_validated: bool
    runtime_writeback: bool
    method: str = "fo-ccz4-variable-coefficient-rejected-speed-proxy-v2"

    def __post_init__(self) -> None:
        if not self.axes or any(axis not in (0, 1, 2) for axis in self.axes):
            raise ValueError("axes must contain one or more Cartesian axes")
        if len(set(self.axes)) != len(self.axes):
            raise ValueError("axes must not repeat")
        if self.face_count <= 0 or self.boundary_cell_count <= 0:
            raise ValueError("boundary audit must contain at least one face")
        if not self.coefficient_sha256 or len(self.coefficient_sha256) != 64:
            raise ValueError("coefficient_sha256 must be a SHA-256 digest")


def _validate_inputs(
    state: BSSNState3D,
    axes: tuple[int, ...],
    tolerance: float,
) -> tuple[int, ...]:
    if state.grid.boundary != "sommerfeld":
        raise ValueError(
            "variable-coefficient boundary audit requires "
            "Grid3D(boundary='sommerfeld')"
        )
    if not np.all(state.valid_mask):
        raise ValueError("variable-coefficient boundary audit requires a fully valid state")
    if not axes or any(axis not in (0, 1, 2) for axis in axes):
        raise ValueError("axes must contain one or more values from 0, 1, or 2")
    if len(set(axes)) != len(axes):
        raise ValueError("axes must not repeat")
    if not math.isfinite(tolerance) or tolerance < 0.0:
        raise ValueError("tolerance must be finite and non-negative")
    return tuple(int(axis) for axis in axes)


def _face_index(shape: tuple[int, int, int], axis: int, side: int):
    fixed = 0 if side < 0 else shape[axis] - 1
    for index in np.ndindex(shape):
        if index[axis] == fixed:
            yield index


def audit_fo_ccz4_variable_coefficient_boundary_3d(
    state: BSSNState3D,
    *,
    axes: tuple[int, ...] = (0, 1, 2),
    gauge: GaugeConfig = GaugeConfig(),
    tolerance: float = 1.0e-12,
) -> FOCCZ4VariableCoefficientBoundaryAudit3D:
    """Audit local metric and gauge coefficients on selected outer faces.

    The returned speed families use the same coordinate convention as the
    existing proxy census: ``beta^n +/- c`` with
    ``c_light = alpha*sqrt(gamma**nn)``,
    ``c_lapse = sqrt(f*alpha)*sqrt(gamma**nn)`` and
    ``c_shift = sqrt(mu)*alpha*sqrt(gamma**nn)``.  Only the coefficient
    census is validated; the frozen SAT matrix is not modified by this call.
    """

    tolerance = float(tolerance)
    axes = _validate_inputs(state, axes, tolerance)
    conformal_eigenvalues: list[float] = []
    physical_eigenvalues: list[float] = []
    conformal_conditions: list[float] = []
    physical_conditions: list[float] = []
    lapses: list[float] = []
    chis: list[float] = []
    gamma_nns: list[float] = []
    light_speeds: list[float] = []
    lapse_speeds: list[float] = []
    shift_speeds: list[float] = []
    all_speeds: list[float] = []
    beta_normals: list[float] = []
    metric_deviations: list[float] = []
    speed_deviations: list[float] = []
    boundary_cells: set[tuple[int, int, int]] = set()
    digest = hashlib.sha256()

    flat_reference = np.asarray(
        (1.0, math.sqrt(gauge.lapse_coefficient), math.sqrt(gauge.shift_coefficient)),
        dtype=np.float64,
    )
    shape = state.grid.shape
    for axis in axes:
        for side in (-1, 1):
            normal = np.zeros(3, dtype=np.float64)
            normal[axis] = float(side)
            _orientation: LocalBoundaryOrientation = "left" if side < 0 else "right"
            del _orientation  # The signed normal is the serialized convention.
            for index in _face_index(shape, axis, side):
                boundary_cells.add(index)
                raw_conformal_metric = np.asarray(state.h[index], dtype=np.float64)
                if not np.allclose(
                    raw_conformal_metric,
                    raw_conformal_metric.T,
                    rtol=0.0,
                    atol=1.0e-13,
                ):
                    raise ValueError("boundary conformal metric must be symmetric")
                conformal_metric = raw_conformal_metric
                conformal_metric = 0.5 * (conformal_metric + conformal_metric.T)
                conformal_spectrum = np.linalg.eigvalsh(conformal_metric)
                if (
                    not np.all(np.isfinite(conformal_spectrum))
                    or float(conformal_spectrum[0]) <= tolerance
                ):
                    raise ValueError(
                        "boundary conformal metric must be symmetric positive definite"
                    )
                chi = float(state.chi[index])
                alpha = float(state.lapse[index])
                if not math.isfinite(chi) or chi <= 0.0:
                    raise ValueError("boundary chi must be finite and positive")
                if not math.isfinite(alpha) or alpha <= 0.0:
                    raise ValueError("boundary lapse must be finite and positive")
                try:
                    conformal_inverse = np.linalg.inv(conformal_metric)
                except np.linalg.LinAlgError as exc:  # pragma: no cover - SPD guard
                    raise ValueError("boundary conformal metric must be invertible") from exc
                physical_metric = conformal_metric / chi
                physical_spectrum = conformal_spectrum / chi
                gamma_nn = float(chi * (normal @ conformal_inverse @ normal))
                beta_n = float(np.dot(state.shift[index], normal))
                if not math.isfinite(gamma_nn) or gamma_nn <= tolerance:
                    raise ValueError("boundary inverse metric must be positive along normal")
                if not math.isfinite(beta_n):
                    raise ValueError("boundary normal shift must be finite")
                root_gamma = math.sqrt(gamma_nn)
                speeds_intrinsic = np.asarray(
                    (
                        alpha * root_gamma,
                        math.sqrt(gauge.lapse_coefficient * alpha) * root_gamma,
                        math.sqrt(gauge.shift_coefficient) * alpha * root_gamma,
                    ),
                    dtype=np.float64,
                )
                if not np.all(np.isfinite(speeds_intrinsic)):
                    raise ValueError("local characteristic speed coefficients must be finite")
                speeds = np.asarray(
                    tuple(value for value in speeds_intrinsic for value in (beta_n - value, beta_n + value)),
                    dtype=np.float64,
                )
                if not np.all(np.isfinite(speeds)):
                    raise ValueError("local characteristic speeds must be finite")
                conformal_eigenvalues.extend(float(value) for value in conformal_spectrum)
                physical_eigenvalues.extend(float(value) for value in physical_spectrum)
                conformal_conditions.append(float(conformal_spectrum[-1] / conformal_spectrum[0]))
                physical_conditions.append(float(physical_spectrum[-1] / physical_spectrum[0]))
                lapses.append(alpha)
                chis.append(chi)
                gamma_nns.append(gamma_nn)
                light_speeds.append(float(speeds_intrinsic[0]))
                lapse_speeds.append(float(speeds_intrinsic[1]))
                shift_speeds.append(float(speeds_intrinsic[2]))
                all_speeds.extend(float(value) for value in speeds)
                beta_normals.append(beta_n)
                metric_deviations.append(float(np.max(np.abs(physical_metric - np.eye(3)))))
                speed_deviations.extend(
                    float(abs(actual - reference) / reference)
                    for actual, reference in zip(speeds_intrinsic, flat_reference)
                )
                digest.update(
                    np.asarray(
                        (
                            *index,
                            axis,
                            side,
                            chi,
                            alpha,
                            gamma_nn,
                            beta_n,
                            *raw_conformal_metric.reshape(-1),
                            *np.asarray(state.shift[index], dtype=np.float64),
                            *speeds_intrinsic,
                        ),
                        dtype="<f8",
                    ).tobytes()
                )

    if not all_speeds:
        raise ValueError("selected axes produced no boundary faces")
    metric_ok = bool(
        np.all(np.isfinite(conformal_eigenvalues))
        and np.all(np.isfinite(physical_eigenvalues))
        and min(conformal_eigenvalues) > tolerance
        and min(physical_eigenvalues) > tolerance
    )
    speed_ok = bool(np.all(np.isfinite(all_speeds)))
    return FOCCZ4VariableCoefficientBoundaryAudit3D(
        axes=axes,
        face_count=len(all_speeds) // 6,
        boundary_cell_count=len(boundary_cells),
        min_conformal_metric_eigenvalue=float(min(conformal_eigenvalues)),
        max_conformal_metric_eigenvalue=float(max(conformal_eigenvalues)),
        min_physical_metric_eigenvalue=float(min(physical_eigenvalues)),
        max_physical_metric_eigenvalue=float(max(physical_eigenvalues)),
        max_conformal_metric_condition_number=float(max(conformal_conditions)),
        max_physical_metric_condition_number=float(max(physical_conditions)),
        min_lapse=float(min(lapses)),
        max_lapse=float(max(lapses)),
        min_chi=float(min(chis)),
        max_chi=float(max(chis)),
        min_gamma_nn=float(min(gamma_nns)),
        max_gamma_nn=float(max(gamma_nns)),
        min_light_speed=float(min(light_speeds)),
        max_light_speed=float(max(light_speeds)),
        min_lapse_speed=float(min(lapse_speeds)),
        max_lapse_speed=float(max(lapse_speeds)),
        min_shift_speed=float(min(shift_speeds)),
        max_shift_speed=float(max(shift_speeds)),
        min_speed=float(min(all_speeds)),
        max_speed=float(max(all_speeds)),
        min_beta_n=float(min(beta_normals)),
        max_beta_n=float(max(beta_normals)),
        max_advection_speed=float(max(abs(value) for value in beta_normals)),
        max_metric_identity_deviation=float(max(metric_deviations)),
        max_intrinsic_speed_relative_deviation=float(max(speed_deviations)),
        coefficient_sha256=digest.hexdigest(),
        deterministic=True,
        positive_definite_metric_validated=metric_ok,
        proxy_speed_coefficients_finite=speed_ok,
        local_characteristic_speed_validated=False,
        variable_coefficient_boundary_validated=False,
        nonlinear_cpbc_validated=False,
        physical_boundary_validated=False,
        runtime_writeback=False,
    )


__all__ = [
    "FOCCZ4VariableCoefficientBoundaryAudit3D",
    "audit_fo_ccz4_variable_coefficient_boundary_3d",
]
