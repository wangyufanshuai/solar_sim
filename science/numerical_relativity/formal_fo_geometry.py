"""Independent Taylor-jet realization of the published off-constraint profile.

The formal metric derivatives are 2D and symmetrized dD, not derivatives of
the sampled metric when its reduction constraints fail. Geometry is evaluated
by generic second-order metric-jet calculus; the remaining14 rate components
follow Dumbser et al. (2018), with kappa3=c=e=s=1. No production RHS imports.
This is neither a time integrator nor proof of Einstein/constraint convergence.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
import math

import numpy as np

from . import reduction_constraint_oracle as R

METHOD = "nr-formal-taylor-fo-profile-v1"
TOLERANCE = 2.0e-12


@dataclass(frozen=True)
class MetricGeometry:
    inverse: np.ndarray
    inverse_gradient: np.ndarray
    connection: np.ndarray
    connection_gradient: np.ndarray
    ricci: np.ndarray

    def __post_init__(self):
        for item in fields(self):
            value = getattr(self, item.name)
            if not np.all(np.isfinite(value)):
                raise ValueError("finite Taylor geometry required")
            object.__setattr__(self, item.name, R.frozen(value))


def metric_geometry(metric, first, second):
    """Generic Christoffel/Ricci calculus on a symmetric local metric 2-jet."""
    g, dg, ddg = [np.asarray(value) for value in (metric, first, second)]
    if (
        g.ndim < 2
        or g.shape[-2:] != (3, 3)
        or g.size == 0
        or dg.shape != (*g.shape[:-2], 3, 3, 3)
        or ddg.shape != (*g.shape[:-2], 3, 3, 3, 3)
        or any(
            v.dtype.kind not in "fiu" or not np.all(np.isfinite(v))
            for v in (g, dg, ddg)
        )
    ):
        raise ValueError("matching finite real metric jets required")
    if (
        any(
            not np.allclose(v, np.swapaxes(v, -1, -2), atol=1e-14, rtol=0.0)
            for v in (g, dg, ddg)
        )
        or not np.allclose(ddg, np.swapaxes(ddg, -4, -3), atol=1e-14, rtol=0.0)
        or np.any(np.linalg.eigvalsh(g) <= 0.0)
    ):
        raise ValueError(
            "SPD metric and commuting symmetric Taylor coefficients required"
        )
    inv = np.linalg.inv(g)
    dinv = -np.einsum("...im,...kmn,...nj->...kij", inv, dg, inv)
    lower = 0.5 * (
        np.einsum("...ilj->...lij", dg) + np.einsum("...jli->...lij", dg) - dg
    )
    dlower = 0.5 * (
        np.einsum("...silj->...slij", ddg) + np.einsum("...sjli->...slij", ddg) - ddg
    )
    connection = np.einsum("...kl,...lij->...kij", inv, lower)
    derivative = np.einsum("...skl,...lij->...skij", dinv, lower) + np.einsum(
        "...kl,...slij->...skij", inv, dlower
    )
    ricci = (
        np.einsum("...kkij->...ij", derivative)
        - np.einsum("...jkik->...ij", derivative)
        + np.einsum("...kkl,...lij->...ij", connection, connection)
        - np.einsum("...kjl,...lik->...ij", connection, connection)
    )
    return MetricGeometry(inv, dinv, connection, derivative, ricci)


@dataclass(frozen=True)
class ProfilePrediction:
    rhs: np.ndarray
    formal_metric: np.ndarray
    formal_metric_gradient: np.ndarray
    formal_metric_hessian: np.ndarray
    conformal_connection: np.ndarray
    physical_connection: np.ndarray
    formal_ricci: np.ndarray
    ricci_z: np.ndarray
    contracted_connection: np.ndarray
    contracted_connection_gradient: np.ndarray
    z_covector: np.ndarray
    covariant_z_gradient: np.ndarray
    lapse_hessian: np.ndarray
    trace_ordering_feedback: np.ndarray

    def __post_init__(self):
        for item in fields(self):
            value = getattr(self, item.name)
            if not np.all(np.isfinite(value)):
                raise ValueError("finite formal profile prediction required")
            object.__setattr__(self, item.name, R.frozen(value))


def evaluate(jet, *, tau_inverse=1.0, kappa1=0.1, kappa2=0.0):
    if not isinstance(jet, R.CanonicalJet):
        raise ValueError("validated canonical jet required")
    if (
        any(
            type(x) not in (int, float) or not math.isfinite(x)
            for x in (kappa1, kappa2)
        )
        or kappa1 < 0.0
        or kappa2 <= -1.0
    ):
        raise ValueError("finite kappa1>=0 and kappa2>-1 required")
    reduction = R.evaluate(jet, tau_inverse=tau_inverse)
    q, dq = jet.slots, jet.slot_gradients
    v = R.unpack(q)
    d = [R.unpack(row) for row in dq]
    h, a, A, B, D, P, beta = [v[key] for key in ("h", "a", "A", "B", "D", "P", "beta")]
    alpha, chi = np.exp(v["L"]), np.exp(2 * v["ell"])
    dh = 2 * D
    dD = np.stack([row["D"] for row in d], axis=-4)
    ddh = dD + np.swapaxes(dD, -4, -3)
    dP = np.stack([row["P"] for row in d], axis=-2)
    ddell = 0.5 * (dP + np.swapaxes(dP, -1, -2))
    g = h / chi[..., None, None]
    dg = (dh - 2 * P[..., :, None, None] * h[..., None, :, :]) / chi[
        ..., None, None, None
    ]
    ddg = (
        ddh
        - 2 * P[..., :, None, None, None] * dh[..., None, :, :, :]
        - 2 * P[..., None, :, None, None] * dh[..., :, None, :, :]
        + (4 * P[..., :, None] * P[..., None, :] - 2 * ddell)[..., None, None]
        * h[..., None, None, :, :]
    ) / chi[..., None, None, None, None]
    conformal = metric_geometry(h, dh, ddh)
    physical = metric_geometry(g, dg, ddg)
    hi = conformal.inverse
    contracted = np.einsum("...jl,...ijl->...i", hi, conformal.connection)
    dcontracted = np.einsum(
        "...sjl,...ijl->...si", conformal.inverse_gradient, conformal.connection
    ) + np.einsum("...jl,...sijl->...si", hi, conformal.connection_gradient)
    gammahat = np.moveaxis(q[19:22], 0, -1)
    dgammahat = np.moveaxis(dq[:, 19:22], (0, 1), (-2, -1))
    difference = gammahat - contracted
    z = 0.5 * np.einsum("...ij,...j->...i", h, difference)
    dz = 0.5 * np.einsum("...sij,...j->...si", dh, difference) + 0.5 * np.einsum(
        "...ij,...sj->...si", h, dgammahat - dcontracted
    )
    covdz = dz - np.einsum("...kij,...k->...ij", physical.connection, z)
    ricci_z = physical.ricci + covdz + np.swapaxes(covdz, -1, -2)
    dA = np.stack([row["A"] for row in d], axis=-2)
    hessalpha = alpha[..., None, None] * (
        A[..., :, None] * A[..., None, :]
        + 0.5 * (dA + np.swapaxes(dA, -1, -2))
        - np.einsum("...kij,...k->...ij", physical.connection, A)
    )
    scalar = chi * R.contract(hi, ricci_z)
    lapalpha = chi * R.contract(hi, hessalpha)
    raised = hi @ a @ hi
    tr = R.contract(hi, a)
    div = np.trace(B, axis1=-2, axis2=-1)
    da = np.stack([row["a"] for row in d], axis=-3)
    dk = np.array([row["K"] for row in d])
    dtheta = np.array([row["theta"] for row in d])
    inner = -hessalpha + alpha[..., None, None] * ricci_z
    adot = (
        chi[..., None, None] * (inner - h * R.contract(hi, inner)[..., None, None] / 3)
        + np.einsum("...s,...sij->...ij", beta, da)
        + np.einsum("...ki,...jk->...ij", a, B)
        + np.einsum("...kj,...ik->...ij", a, B)
        - (2 / 3) * a * div[..., None, None]
        + alpha[..., None, None] * a * (v["K"] - 2 * v["theta"])[..., None, None]
        - 2 * alpha[..., None, None] * (a @ hi @ a)
        - tau_inverse * h * tr[..., None, None]
    )
    Kdot = (
        np.einsum("...s,s...->...", beta, dk)
        - lapalpha
        + alpha * scalar
        + alpha * v["K"] * (v["K"] - 2 * v["theta"])
        - 3 * alpha * kappa1 * (1 + kappa2) * v["theta"]
    )
    zupper = np.einsum("...ij,...j->...i", physical.inverse, z)
    thetadot = (
        np.einsum("...s,s...->...", beta, dtheta)
        + 0.5 * alpha * (scalar + 2 * v["K"] ** 2 / 3 - R.contract(a, raised))
        - alpha * v["theta"] * v["K"]
        - alpha * np.sum(zupper * A, axis=-1)
        - alpha * kappa1 * (2 + kappa2) * v["theta"]
    )
    # The formal inverse-jet derivative gives the FO trace-gradient, not the
    # derivative of the true sampled trace off the definition surface.
    T = np.einsum("...sij,...ij->...s", conformal.inverse_gradient, a) + np.einsum(
        "...ij,...sij->...s", hi, da
    )
    feedback = 2 * alpha[..., None] * np.einsum("...ij,...j->...i", hi, T)
    dB = np.stack([row["B"] for row in d], axis=-3)
    symB = 0.5 * (dB + np.swapaxes(dB, -3, -2))
    advgamma = np.einsum("...s,...si->...i", beta, dgammahat)
    # At kappa3=1, all shift-stretch terms combine into GammaHat itself;
    # this avoids copying the production split into GammaTilde and Z terms.
    gammadot = (
        advgamma
        - (4 / 3) * alpha[..., None] * np.einsum("...ij,j...->...i", hi, dk)
        + 2 * alpha[..., None] * np.einsum("...ij,j...->...i", hi, dtheta)
        + feedback
        + np.einsum("...kl,...kli->...i", hi, symB)
        + np.einsum("...ik,...kll->...i", hi, symB) / 3
        + (2 / 3) * gammahat * div[..., None]
        - np.einsum("...k,...ki->...i", gammahat, B)
        + 2
        * alpha[..., None]
        * np.einsum("...ijk,...jk->...i", conformal.connection, raised)
        - 6 * alpha[..., None] * np.einsum("...ij,...j->...i", raised, P)
        - 2
        * alpha[..., None]
        * np.einsum(
            "...ij,...j->...i",
            hi,
            v["theta"][..., None] * A + ((2 / 3) * v["K"] + kappa1)[..., None] * z,
        )
        - 2 * alpha[..., None] * np.einsum("...ij,...j->...i", raised, A)
    )
    db = np.stack([row["b"] for row in d], axis=-2)
    bdot = gammadot - advgamma + np.einsum("...s,...si->...i", beta, db)
    middle = np.array(
        [
            *[adot[..., i, j] for i, j in R.PAIRS],
            Kdot,
            thetadot,
            *[gammadot[..., i] for i in range(3)],
            *[bdot[..., i] for i in range(3)],
        ]
    )
    rhs = np.concatenate((reduction.base_rates, middle, reduction.auxiliary_rates))
    return ProfilePrediction(
        rhs,
        g,
        dg,
        ddg,
        conformal.connection,
        physical.connection,
        physical.ricci,
        ricci_z,
        contracted,
        dcontracted,
        z,
        covdz,
        hessalpha,
        feedback,
    )
