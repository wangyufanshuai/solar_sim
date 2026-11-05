"""Independent physical Z4 oracle with nonzero Theta/Z and consistent auxiliaries.

Uses Alic et al. (2012), physical equations (6)-(9), then differentiates the
conformal definitions. Covariant kappa3=1, c=e=s=1, advective 1+log and the
existing f=3 alpha chi, eta=0 gauge only. This is not a time integrator or a
reference for independently violated FO auxiliary/algebraic constraints.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
import math
import numpy as np

from .continuum_adm import (
    PAIRS,
    PhysicalJet,
    contraction,
    evaluate as adm_evaluate,
    physical_geometry,
    readonly,
)

METHOD = "nr-physical-nonzero-z4-continuum-jets-v1"
TOLERANCE = 2.0e-12


@dataclass(frozen=True)
class Z4Jet:
    theta: np.ndarray
    dtheta: np.ndarray
    z: np.ndarray
    dz: np.ndarray

    def __post_init__(self):
        shape = np.shape(self.theta)
        for item, tail in zip(fields(self), ((), (3,), (3,), (3, 3)), strict=True):
            value = np.asarray(getattr(self, item.name))
            if (
                value.shape != shape + tail
                or value.size == 0
                or value.dtype.kind not in "fiu"
                or not np.all(np.isfinite(value))
            ):
                raise ValueError("matching finite real Z4 jets required: " + item.name)
            object.__setattr__(self, item.name, readonly(value))


@dataclass(frozen=True)
class Z4Comparison:
    slots: np.ndarray
    slot_gradients: np.ndarray
    rhs: np.ndarray
    gamma_rate: np.ndarray
    extrinsic_rate: np.ndarray
    theta_rate: np.ndarray
    z_rate: np.ndarray
    geometric_gamma_rate: np.ndarray
    inverse_metric_z_rate: np.ndarray
    hamiltonian: np.ndarray
    momentum: np.ndarray

    def __post_init__(self):
        for item in fields(self):
            value = getattr(self, item.name)
            if not np.all(np.isfinite(value)):
                raise ValueError("finite Z4 oracle result required")
            object.__setattr__(self, item.name, readonly(value))


def evaluate(j, z4, *, kappa1=0.1, kappa2=0.0):
    if (
        not isinstance(j, PhysicalJet)
        or not isinstance(z4, Z4Jet)
        or j.alpha.shape != z4.theta.shape
    ):
        raise ValueError("matching validated physical and Z4 jets required")
    for value in (kappa1, kappa2):
        if type(value) not in (int, float) or not math.isfinite(value):
            raise ValueError("finite scalar damping parameters required")
    if kappa1 < 0.0 or kappa2 <= -1.0:
        raise ValueError("kappa1>=0 and kappa2>-1 required")
    base = adm_evaluate(j)
    inv, _, connection, _ = physical_geometry(j)
    alpha, theta, z = j.alpha, z4.theta, z4.z
    trace = base.slots[17]
    chi = np.exp(2.0 * base.slots[10])
    h, hi = chi[..., None, None] * j.gamma, inv / chi[..., None, None]
    p = np.moveaxis(base.slots[55:58], 0, -1)
    dh = chi[..., None, None, None] * (
        j.dgamma + 2.0 * p[..., :, None, None] * j.gamma[..., None, :, :]
    )
    dhi = np.stack([-hi @ dh[..., s, :, :] @ hi for s in range(3)], axis=-3)
    hdot = chi[..., None, None] * (
        base.gamma_rate + 2.0 * base.rhs[10][..., None, None] * j.gamma
    )
    hidot = -hi @ hdot @ hi
    covdz = z4.dz - np.einsum("...kij,...k->...ij", connection, z)
    divz = contraction(inv, covdz)
    zupper = np.einsum("...ij,...j->...i", inv, z)

    # Add the physical Z4 terms to the separately qualified physical ADM rate.
    delta_k = alpha[..., None, None] * (
        covdz
        + np.swapaxes(covdz, -1, -2)
        - 2.0 * theta[..., None, None] * j.extrinsic
        - (kappa1 * (1.0 + kappa2) * theta)[..., None, None] * j.gamma
    )
    delta_trace = contraction(inv, delta_k)
    theta_rate = (
        base.rhs[18]
        + np.einsum("...i,...i->...", j.beta, z4.dtheta)
        + alpha * (divz - theta * trace)
        - np.einsum("...i,...i->...", zupper, j.dalpha)
        - alpha * kappa1 * (2.0 + kappa2) * theta
    )
    # Lie derivative of a physical covector, not componentwise advection alone.
    z_rate = (
        np.einsum("...s,...si->...i", j.beta, z4.dz)
        + np.einsum("...s,...is->...i", z, j.dbeta)
        + alpha[..., None]
        * (
            base.momentum
            + z4.dtheta
            - 2.0 * np.einsum("...ij,...j->...i", j.extrinsic @ inv, z)
            - kappa1 * z
        )
        - theta[..., None] * j.dalpha
    )
    encoded_z = 2.0 * np.einsum("...ij,...j->...i", hi, z)
    dencoded_z = 2.0 * (
        np.einsum("...sij,...j->...si", dhi, z)
        + np.einsum("...ij,...sj->...si", hi, z4.dz)
    )
    inverse_metric_z_rate = 2.0 * np.einsum("...ij,...j->...i", hidot, z)
    gammahat_rate = (
        base.geometric_gamma_rate
        + inverse_metric_z_rate
        + 2.0 * np.einsum("...ij,...j->...i", hi, z_rate)
    )

    q, dq, rhs = base.slots.copy(), base.slot_gradients.copy(), base.rhs.copy()
    q[18] = theta
    q[19:22] += np.moveaxis(encoded_z, -1, 0)
    for s in range(3):
        dq[s, 18] = z4.dtheta[..., s]
        dq[s, 19:22] += np.moveaxis(dencoded_z[..., s, :], -1, 0)
    rhs[6] += 4.0 * theta
    rhs[25:28] += 4.0 * np.moveaxis(z4.dtheta, -1, 0)
    delta_a = chi[..., None, None] * delta_k - h * delta_trace[..., None, None] / 3.0
    for index, (i, ell) in enumerate(PAIRS):
        rhs[11 + index] += delta_a[..., i, ell]
    rhs[17] += delta_trace
    rhs[18] = theta_rate
    rhs[19:22] = np.moveaxis(gammahat_rate, -1, 0)
    rhs[22:25] += (
        rhs[19:22]
        - base.rhs[19:22]
        - np.moveaxis(np.einsum("...s,...si->...i", j.beta, dencoded_z), -1, 0)
    )
    return Z4Comparison(
        q,
        dq,
        rhs,
        base.gamma_rate,
        base.extrinsic_rate + delta_k,
        theta_rate,
        z_rate,
        base.geometric_gamma_rate,
        inverse_metric_z_rate,
        base.hamiltonian,
        base.momentum,
    )
