"""Pointwise FO-CCZ4 principal matrices, assembled and checked against the RHS.

Convention: q_t = sum_i A^i(q) d_i q + S(q); this module returns A(n)=n_i A^i.
The normal is a coordinate covector and is NOT normalized. The physical metric
is h/chi: neither h nor chi may be reconstructed from that metric alone.

The assembly contracts the implemented first-order equations directly. It is
not a similarity/scaling of the flat symbol. All 11 kinematic rows are zero;
advection, lapse, shift and ordering coefficients retain their own factors.
The second implementation probes the actual grid RHS with independent slot
gradients. Agreement is a code-level principal-part check, not an independent
proof of the Einstein equations, hyperbolicity, CPBC or nonlinear stability.
"""

from __future__ import annotations

from dataclasses import replace
import math
from typing import Literal, Sequence

import numpy as np

from .ccz4_reference import GaugeConfig
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER, _state_sha256
from .fo_ccz4_principal_symbol import _mode_state, _rhs_components
from .fo_ccz4_rhs import FOCCZ4Config, FOCCZ4State3D, fo_ccz4_rhs_3d
from .nr3d import Grid3D


_COUNT = len(FOCCZ4_VARIABLE_ORDER)
_INDEX = {name: index for index, name in enumerate(FOCCZ4_VARIABLE_ORDER)}
_GAUGE = GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0)
_CONFIG = FOCCZ4Config(kappa1=0.0)


def _coefficients(conformal_metric, chi, lapse, shift, normal_covector):
    h = np.asarray(conformal_metric, dtype=np.float64)
    beta = np.asarray(shift, dtype=np.float64)
    n = np.asarray(normal_covector, dtype=np.float64)
    if h.shape != (3, 3) or not np.all(np.isfinite(h)):
        raise ValueError("conformal_metric must be a finite 3-by-3 matrix")
    if not np.allclose(h, h.T, rtol=0.0, atol=1.0e-13):
        raise ValueError("conformal_metric must be symmetric")
    h = 0.5 * (h + h.T)
    if np.linalg.eigvalsh(h)[0] <= 0.0:
        raise ValueError("conformal_metric must be positive definite")
    chi, alpha = float(chi), float(lapse)
    if not math.isfinite(chi) or chi <= 0.0:
        raise ValueError("chi must be finite and positive")
    if not math.isfinite(alpha) or alpha <= 0.0:
        raise ValueError("lapse must be finite and positive")
    if beta.shape != (3,) or not np.all(np.isfinite(beta)):
        raise ValueError("shift must contain three finite components")
    if n.shape != (3,) or not np.all(np.isfinite(n)) or not np.any(n):
        raise ValueError("normal_covector must be a finite non-zero three-vector")
    return h, chi, alpha, beta, n


def frozen_fo_ccz4_principal_matrix_3d(
    conformal_metric: np.ndarray,
    chi: float,
    lapse: float,
    shift: Sequence[float],
    normal_covector: Sequence[float],
    *,
    gauge: GaugeConfig = _GAUGE,
    config: FOCCZ4Config = _CONFIG,
    gauge_profile: FOCCZ4GaugeProfile | None = None,
) -> np.ndarray:
    """Assemble the 58-slot principal part at specified local coefficients.

    The retained spatial derivatives in this reduction have coefficients
    depending on h, chi, alpha and beta, not on curvature/auxiliary fields.
    Products of those latter fields and damping are zero-order source terms.
    No algebraic constraint projection or determinant rescaling is performed.
    """

    h, chi, alpha, beta, n = _coefficients(conformal_metric, chi, lapse, shift, normal_covector)
    if gauge_profile is not None:
        gauge_profile.validate_formulation(gauge, config)
        shift_f, ordering_mu = gauge_profile.coefficients(alpha, chi)
        gauge = replace(gauge, shift_coefficient=float(shift_f))
        config = replace(config, ordering_mu=float(ordering_mu))
    if not gauge.advective or gauge.theta_coupling != 2.0 * config.c:
        raise ValueError("FO-CCZ4 requires advective gauge with theta_coupling=2*c")
    inverse = np.linalg.inv(h)
    beta_n = float(beta @ n)
    s = config.shift_strength
    basis = np.eye(_COUNT)

    def unit(name):
        return basis[_INDEX[name]]

    a = np.asarray([[unit(f"A{min(i,j)}{max(i,j)}") for j in range(3)] for i in range(3)])
    avec = np.asarray([unit(f"A{i}") for i in range(3)])
    bgrad = np.asarray([[unit(f"B{k}{i}") for i in range(3)] for k in range(3)])
    d = np.asarray([
        [[unit(f"D{k}{min(i,j)}{max(i,j)}") for j in range(3)] for i in range(3)]
        for k in range(3)
    ])
    p = np.asarray([unit(f"P{i}") for i in range(3)])
    gamma = np.asarray([unit(f"GammaHat{i}") for i in range(3)])
    trace_a = np.einsum("ij,ijv->v", inverse, a)
    # Symmetrized derivatives, with the final dimension denoting slot rows.
    sym_d = 0.5 * (np.einsum("k,lijv->klijv", n, d) + np.einsum("l,kijv->klijv", n, d))
    sym_p = 0.5 * (np.einsum("i,jv->ijv", n, p) + np.einsum("j,iv->ijv", n, p))
    sym_b = 0.5 * (np.einsum("k,liv->iklv", n, bgrad) + np.einsum("l,kiv->iklv", n, bgrad))

    d_connection = np.zeros((3, 3, 3, 3, _COUNT))
    d_physical_connection = np.zeros_like(d_connection)
    for k in range(3):
        for u in range(3):
            for i in range(3):
                for j in range(3):
                    d_connection[k, u, i, j] = sum(
                        inverse[u, ell] * (sym_d[k, i, ell, j] + sym_d[k, j, ell, i] - sym_d[k, ell, i, j])
                        for ell in range(3)
                    )
                    d_physical_connection[k, u, i, j] = (
                        d_connection[k, u, i, j]
                        - float(u == j) * sym_p[k, i]
                        - float(u == i) * sym_p[k, j]
                        + h[i, j] * sum(inverse[u, ell] * sym_p[k, ell] for ell in range(3))
                    )
    d_tilde_gamma = np.einsum("ij,kuijv->kuv", inverse, d_connection)
    ricci_z = np.zeros((3, 3, _COUNT))
    for i in range(3):
        for j in range(3):
            ricci_z[i, j] = sum(
                d_physical_connection[u, u, i, j] - d_physical_connection[j, u, i, u]
                for u in range(3)
            )
            ricci_z[i, j] += 0.5 * sum(
                h[j, ell] * (n[i] * gamma[ell] - d_tilde_gamma[i, ell])
                + h[i, ell] * (n[j] * gamma[ell] - d_tilde_gamma[j, ell])
                for ell in range(3)
            )
    hessian = 0.5 * alpha * (np.einsum("i,jv->ijv", n, avec) + np.einsum("j,iv->ijv", n, avec))
    laplacian = chi * np.einsum("ij,ijv->v", inverse, hessian)
    scalar = chi * np.einsum("ij,ijv->v", inverse, ricci_z)
    matrix = np.zeros((_COUNT, _COUNT))
    for i in range(3):
        for j in range(i, 3):
            matrix[_INDEX[f"A{i}{j}"]] = (
                chi * (-hessian[i, j] + alpha * ricci_z[i, j])
                - h[i, j] / 3.0 * (-laplacian + alpha * scalar)
                + beta_n * a[i, j]
            )
    matrix[_INDEX["K"]] = -laplacian + alpha * scalar + beta_n * unit("K")
    matrix[_INDEX["Theta"]] = 0.5 * alpha * config.cleaning_speed**2 * scalar + beta_n * unit("Theta")
    raised_n = inverse @ n
    for i in range(3):
        gamma_nonadvective = (
            alpha * raised_n[i] * (-4.0 / 3.0 * unit("K") + 2.0 * unit("Theta"))
            + s * np.einsum("kl,klv->v", inverse, sym_b[i])
            + s / 3.0 * sum(inverse[i, k] * sym_b[ell, k, ell] for k in range(3) for ell in range(3))
            + 2.0 * s * alpha * raised_n[i] * trace_a
        )
        matrix[_INDEX[f"GammaHat{i}"]] = gamma_nonadvective + beta_n * gamma[i]
        matrix[_INDEX[f"b{i}"]] = s * (gamma_nonadvective + beta_n * unit(f"b{i}"))
    for k in range(3):
        matrix[_INDEX[f"A{k}"]] = (
            -gauge.lapse_coefficient * n[k] * (unit("K") - 2.0 * config.c * unit("Theta") + s * trace_a)
            + beta_n * avec[k]
        )
        for i in range(3):
            curl_p = sum(inverse[i, j] * (n[k] * p[j] - n[j] * p[k]) for j in range(3))
            curl_d = sum(
                inverse[i, j] * inverse[a_index, ell] * (n[k] * d[ell, j, a_index] - n[ell] * d[k, j, a_index])
                for j in range(3) for a_index in range(3) for ell in range(3)
            )
            matrix[_INDEX[f"B{k}{i}"]] = s * (
                gauge.shift_coefficient * n[k] * unit(f"b{i}")
                + alpha**2 * config.ordering_mu * (curl_p - curl_d)
                + beta_n * bgrad[k, i]
            )
        trace_b = sum(sym_b[ell, k, ell] for ell in range(3))
        for i in range(3):
            for j in range(i, 3):
                matrix[_INDEX[f"D{k}{i}{j}"]] = (
                    s * (0.5 * sum(h[ell, i] * sym_b[ell, k, j] + h[ell, j] * sym_b[ell, k, i] for ell in range(3)) - h[i, j] / 3.0 * trace_b)
                    + alpha * n[k] * (-a[i, j] + h[i, j] / 3.0 * trace_a)
                    + beta_n * d[k, i, j]
                )
        matrix[_INDEX[f"P{k}"]] = (
            alpha / 3.0 * n[k] * (unit("K") + s * trace_a)
            - s / 3.0 * trace_b + beta_n * p[k]
        )
    if not np.all(np.isfinite(matrix)):
        raise ValueError("frozen principal matrix must be finite")
    return matrix


def probe_frozen_fo_ccz4_rhs_matrix_3d(
    conformal_metric: np.ndarray,
    chi: float,
    lapse: float,
    shift: Sequence[float],
    normal_covector: Sequence[float],
    *,
    gauge: GaugeConfig = _GAUGE,
    config: FOCCZ4Config = _CONFIG,
    amplitude: float = 1.0e-5,
    profile: Literal["affine", "sine"] = "affine",
    gauge_profile: FOCCZ4GaugeProfile | None = None,
) -> np.ndarray:
    """Extract A(n) from actual RHS values at the center of a small grid.

    q_j = q0_j +/- eps*f, where f(0)=0 and the centered stencil gives d_i f=n_i.
    Thus both signs share exactly the same local coefficients and zero-order
    sources at the sampled point; division by 2*eps isolates A(n)'s jth column.
    Auxiliaries are independent slots, NOT recomputed from the base fields.
    Periodic wrapping is never reached by the sampled first-order stencil.
    The normalized sine profile is a second independent stencil probe.
    """

    h, chi, alpha, beta, n = _coefficients(conformal_metric, chi, lapse, shift, normal_covector)
    amplitude = float(amplitude)
    if not math.isfinite(amplitude) or amplitude <= 0.0:
        raise ValueError("amplitude must be finite and positive")
    if profile not in ("affine", "sine"):
        raise ValueError("profile must be 'affine' or 'sine'")
    grid = Grid3D((5, 5, 5), (-2.0, -2.0, -2.0), (3.0, 3.0, 3.0), boundary="periodic")
    coordinates = grid.coordinates
    if profile == "affine":
        ramp = sum(n[i] * coordinates[i] for i in range(3))
    else:
        frequency = np.pi / 3.0
        ramp = sum(n[i] * np.sin(frequency * coordinates[i]) / np.sin(frequency) for i in range(3))
    if 2.0 * amplitude * float(np.max(np.abs(ramp))) >= float(np.linalg.eigvalsh(h)[0]):
        raise ValueError("amplitude too large for positive-definite metric probes")
    center = (2, 2, 2)
    matrix = np.zeros((_COUNT, _COUNT))
    for slot in range(_COUNT):
        values = []
        for sign in (1.0, -1.0):
            state = _mode_state(grid, slot, sign * amplitude * ramp)
            # h and chi are independently frozen; replacing h with gamma and
            # forcing chi=1 would change the conformal/gauge coefficients.
            state.base.h += h - np.eye(3)
            state.base.chi *= chi
            state.base.lapse *= alpha
            state.base.shift += beta
            state = FOCCZ4State3D(
                state.base,
                replace(state.auxiliary, source_state_sha256=_state_sha256(state.base)),
            )
            rhs = fo_ccz4_rhs_3d(state, gauge=gauge, config=config, gauge_profile=gauge_profile)
            values.append(np.asarray([component[center] for component in _rhs_components(rhs)]))
        matrix[:, slot] = (values[0] - values[1]) / (2.0 * amplitude)
    if not np.all(np.isfinite(matrix)):
        raise ValueError("RHS principal probe must be finite")
    return matrix
