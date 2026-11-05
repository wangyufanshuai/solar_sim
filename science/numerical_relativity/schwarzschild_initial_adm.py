"""Independent continuum ADM oracle on the time-symmetric lapse-pulse slice.

This module imports no evolution, discretization, initial-data or tensor helper
from the solver. It is NOT an evolution backend. Units G=c=M=1, x in [1,3]^3,
gamma=psi**4 I, K_ij=0, beta=0, alpha=alpha_static exp(amplitude * bump).
The sign convention is d_t gamma_ij = -2 alpha K_ij + Lie_beta gamma_ij.
See EXPERIMENT-20261011-initial-adm.md for derivation and primary references.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
import math

import numpy as np

METHOD = "nr-schwarzschild-initial-continuum-adm-v1"
ABS_TOLERANCE = 2.0e-12
INITIAL_TOLERANCE = 2.0e-14


def _readonly(value):
    result = np.array(value, dtype=np.float64, copy=True)
    result.setflags(write=False)
    return result


def _coordinates(value):
    raw = np.asarray(value)
    if (
        raw.ndim < 1
        or raw.shape[-1] != 3
        or raw.size == 0
        or raw.dtype.kind not in "fiu"
        or not np.all(np.isfinite(raw))
        or np.any(raw < 1.0)
        or np.any(raw > 3.0)
    ):
        raise ValueError("finite real Cartesian points in [1,3]^3 required")
    return raw.astype(np.float64, copy=True)


def bump_jet(points):
    """Value, gradient and Hessian of the C5 compact polynomial bump.

    Derivatives have trailing Cartesian indices. At and beyond every support
    face, value and both derivative orders vanish without dividing by a factor.
    """
    xyz = _coordinates(points)
    u = (xyz - 2.0) / 0.75
    s = np.maximum(1.0 - u * u, 0.0)
    value = s**6
    first = -12.0 * u * s**5 / 0.75
    second = (-12.0 * s**5 + 120.0 * u**2 * s**4) / 0.75**2
    gradient = np.empty_like(xyz)
    hessian = np.empty((*xyz.shape[:-1], 3, 3))
    for i in range(3):
        others = [j for j in range(3) if j != i]
        factor = value[..., others[0]] * value[..., others[1]]
        gradient[..., i] = first[..., i] * factor
        hessian[..., i, i] = second[..., i] * factor
        for j in others:
            k = 3 - i - j
            hessian[..., i, j] = first[..., i] * first[..., j] * value[..., k]
    return tuple(_readonly(x) for x in (np.prod(value, axis=-1), gradient, hessian))


def _radial_hessian(radius, normal, first, second):
    nn = normal[..., :, None] * normal[..., None, :]
    return second[..., None, None] * nn + (first / radius)[..., None, None] * (
        np.eye(3) - nn
    )


@dataclass(frozen=True)
class InitialADM:
    """Read-only snapshots; construction occurs through ``initial_adm``."""

    coordinates: np.ndarray
    bump: np.ndarray
    bump_gradient: np.ndarray
    bump_hessian: np.ndarray
    psi: np.ndarray
    alpha: np.ndarray
    chi: np.ndarray
    ln_alpha: np.ndarray
    ln_phi: np.ndarray
    grad_ln_alpha: np.ndarray
    hess_ln_alpha: np.ndarray
    grad_ln_phi: np.ndarray
    hess_ln_phi: np.ndarray
    grad_alpha: np.ndarray
    hess_alpha: np.ndarray
    connection: np.ndarray
    ricci: np.ndarray
    physical_k_rate: np.ndarray
    direct_adm_k_rate: np.ndarray
    trace_k_rate: np.ndarray
    conformal_a_rate: np.ndarray

    def __post_init__(self):
        for item in fields(self):
            value = getattr(self, item.name)
            if not np.all(np.isfinite(value)):
                raise ValueError("finite continuum oracle required")
            object.__setattr__(self, item.name, _readonly(value))


def initial_adm(points, amplitude=0.001):
    """Evaluate the initial ADM rate with two algebraically distinct expressions.

    Direct: Kdot_ij = -D_i D_j alpha + alpha R_ij.
    Cancellation form: subtract the known static Schwarzschild identity first.
    Neither expression applies at positive time or to a general CCZ4 state.
    """
    if (
        type(amplitude) not in (int, float)
        or not math.isfinite(amplitude)
        or abs(amplitude) > 0.01
    ):
        raise ValueError("finite scalar pulse amplitude in [-.01,.01] required")
    xyz = _coordinates(points)
    r = np.sqrt(np.sum(xyz * xyz, axis=-1))
    n = xyz / r[..., None]
    eye = np.eye(3)
    psi = 1.0 + 0.5 / r
    alpha_static = (2.0 * r - 1.0) / (2.0 * r + 1.0)
    chi = psi**-4
    bump, db, ddb = bump_jet(xyz)
    alpha = alpha_static * np.exp(amplitude * bump)

    l0_first = 4.0 / (4.0 * r**2 - 1.0)
    l0_second = -32.0 * r / (4.0 * r**2 - 1.0) ** 2
    dl0 = l0_first[..., None] * n
    ddl0 = _radial_hessian(r, n, l0_first, l0_second)
    dl = dl0 + amplitude * db
    ddl = ddl0 + amplitude * ddb
    p_first = 1.0 / (r**2 * psi)
    p_second = -2.0 / (r**3 * psi) + 0.5 / (r**4 * psi**2)
    dp = p_first[..., None] * n
    ddp = _radial_hessian(r, n, p_first, p_second)
    dpsi = -xyz / (2.0 * r[..., None] ** 3)
    connection = (2.0 / psi)[..., None, None, None] * (
        np.einsum("kj,...i->...kij", eye, dpsi)
        + np.einsum("ki,...j->...kij", eye, dpsi)
        - np.einsum("ij,...k->...kij", eye, dpsi)
    )
    ricci = (1.0 / (r**3 * psi**2))[..., None, None] * (
        eye - 3.0 * n[..., :, None] * n[..., None, :]
    )
    d_alpha = alpha[..., None] * dl
    dd_alpha = alpha[..., None, None] * (ddl + dl[..., :, None] * dl[..., None, :])
    direct = -dd_alpha + np.einsum("...kij,...k->...ij", connection, d_alpha)
    direct += alpha[..., None, None] * ricci

    # Exact static cancellation preserves zero outside the compact support.
    cov_b = ddb - np.einsum("...kij,...k->...ij", connection, db)
    rate = -alpha[..., None, None] * (
        amplitude
        * (
            cov_b
            + dl0[..., :, None] * db[..., None, :]
            + db[..., :, None] * dl0[..., None, :]
        )
        + amplitude**2 * db[..., :, None] * db[..., None, :]
    )
    trace = chi * np.trace(rate, axis1=-2, axis2=-1)
    conformal = chi[..., None, None] * rate - trace[..., None, None] * eye / 3.0
    return InitialADM(
        xyz,
        bump,
        db,
        ddb,
        psi,
        alpha,
        chi,
        np.log(alpha_static) + amplitude * bump,
        -2.0 * np.log(psi),
        dl,
        ddl,
        dp,
        ddp,
        d_alpha,
        dd_alpha,
        connection,
        ricci,
        rate,
        direct,
        trace,
        conformal,
    )
