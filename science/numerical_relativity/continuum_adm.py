"""Independent physical-metric ADM/Z4 jet oracle, restricted to Theta=Z_i=0.

No solver, conformal-curvature or finite-difference helpers are imported. Input
spatial jets are supplied by the caller, not inferred from neighboring samples.
Constraint violations H/M may be nonzero: their instantaneous Z4 feedback is
included. No trajectory, independent auxiliary violations or nonzero Z4 state
is supported. Gauge is the existing experimental f=3 alpha chi, eta=0 profile.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
import numpy as np

METHOD = "nr-physical-adm-zero-z4-continuum-jets-v1"
TOLERANCE = 2.0e-12
PAIRS = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))


def readonly(value):
    result = np.array(value, dtype=np.float64, copy=True)
    result.setflags(write=False)
    return result


@dataclass(frozen=True)
class PhysicalJet:
    """Trailing indices: spatial derivatives first, then tensor components."""

    gamma: np.ndarray
    dgamma: np.ndarray
    ddgamma: np.ndarray
    extrinsic: np.ndarray
    dextrinsic: np.ndarray
    alpha: np.ndarray
    dalpha: np.ndarray
    ddalpha: np.ndarray
    beta: np.ndarray
    dbeta: np.ndarray
    ddbeta: np.ndarray
    driver: np.ndarray
    ddriver: np.ndarray

    def __post_init__(self):
        shape = np.shape(self.alpha)
        tails = (
            (3, 3),
            (3, 3, 3),
            (3, 3, 3, 3),
            (3, 3),
            (3, 3, 3),
            (),
            (3,),
            (3, 3),
            (3,),
            (3, 3),
            (3, 3, 3),
            (3,),
            (3, 3),
        )
        for item, tail in zip(fields(self), tails, strict=True):
            value = np.asarray(getattr(self, item.name))
            if (
                value.shape != shape + tail
                or value.size == 0
                or value.dtype.kind not in "fiu"
                or not np.all(np.isfinite(value))
            ):
                raise ValueError(
                    "matching finite real physical jets required: " + item.name
                )
            object.__setattr__(self, item.name, readonly(value))
        for name in (
            "gamma",
            "dgamma",
            "ddgamma",
            "extrinsic",
            "dextrinsic",
            "ddalpha",
        ):
            value = getattr(self, name)
            if not np.allclose(
                value, np.swapaxes(value, -1, -2), atol=1.0e-14, rtol=0.0
            ):
                raise ValueError("symmetric physical tensor/jet required: " + name)
        if not np.allclose(
            self.ddgamma, np.swapaxes(self.ddgamma, -4, -3), atol=1.0e-14, rtol=0.0
        ):
            raise ValueError("commuting metric partial derivatives required")
        if not np.allclose(
            self.ddbeta, np.swapaxes(self.ddbeta, -3, -2), atol=1.0e-14, rtol=0.0
        ):
            raise ValueError("commuting shift partial derivatives required")
        if (
            np.any(np.linalg.eigvalsh(self.gamma) <= 0.0)
            or np.any(self.alpha <= 0.0)
            or np.any(self.alpha >= 2.0)
        ):
            raise ValueError("SPD physical metric and 0<alpha<2 required; no clipping")


def contraction(a, b):
    return np.einsum("...ij,...ij->...", a, b)


def inverse_jets(metric, first, second):
    inverse = np.linalg.inv(metric)
    d = np.stack([-inverse @ first[..., s, :, :] @ inverse for s in range(3)], axis=-3)
    dd = np.empty_like(second)
    for s in range(3):
        for t in range(3):
            gs, gt = first[..., s, :, :], first[..., t, :, :]
            dd[..., s, t, :, :] = (
                inverse @ gs @ inverse @ gt @ inverse
                + inverse @ gt @ inverse @ gs @ inverse
                - inverse @ second[..., s, t, :, :] @ inverse
            )
    return inverse, d, dd


def physical_geometry(jet):
    """Christoffels and Ricci from physical gamma and its second derivatives."""
    g, dg, ddg = jet.gamma, jet.dgamma, jet.ddgamma
    inv, dinv, _ = inverse_jets(g, dg, ddg)
    christoffel = np.empty_like(dg)
    dchristoffel = np.empty_like(ddg)
    for k in range(3):
        for i in range(3):
            for j in range(3):
                christoffel[..., k, i, j] = 0.0
                for s in range(3):
                    dchristoffel[..., s, k, i, j] = 0.0
                for ell in range(3):
                    term = dg[..., i, ell, j] + dg[..., j, ell, i] - dg[..., ell, i, j]
                    christoffel[..., k, i, j] += 0.5 * inv[..., k, ell] * term
                    for s in range(3):
                        dterm = (
                            ddg[..., s, i, ell, j]
                            + ddg[..., s, j, ell, i]
                            - ddg[..., s, ell, i, j]
                        )
                        dchristoffel[..., s, k, i, j] += 0.5 * (
                            dinv[..., s, k, ell] * term + inv[..., k, ell] * dterm
                        )
    ricci = np.zeros_like(g)
    for i in range(3):
        for j in range(3):
            for k in range(3):
                ricci[..., i, j] += (
                    dchristoffel[..., k, k, i, j] - dchristoffel[..., j, k, i, k]
                )
                for ell in range(3):
                    ricci[..., i, j] += (
                        christoffel[..., k, k, ell] * christoffel[..., ell, i, j]
                        - christoffel[..., k, j, ell] * christoffel[..., ell, i, k]
                    )
    return inv, dinv, christoffel, ricci


def lie_covariant(tensor, gradient, beta, dbeta):
    return (
        np.einsum("...s,...sij->...ij", beta, gradient)
        + np.einsum("...kj,...ik->...ij", tensor, dbeta)
        + np.einsum("...ik,...jk->...ij", tensor, dbeta)
    )


def _pack(v):
    # Explicit canonical order, independent of the solver's flattening helper.
    return np.stack(
        [
            *[v["h"][..., i, j] for i, j in PAIRS],
            v["ln_alpha"],
            *[v["beta"][..., i] for i in range(3)],
            v["ln_phi"],
            *[v["a"][..., i, j] for i, j in PAIRS],
            v["K"],
            v["Theta"],
            *[v["Gamma"][..., i] for i in range(3)],
            *[v["b"][..., i] for i in range(3)],
            *[v["A"][..., i] for i in range(3)],
            *[v["B"][..., i, j] for i in range(3) for j in range(3)],
            *[v["D"][..., s, i, j] for s in range(3) for i, j in PAIRS],
            *[v["P"][..., i] for i in range(3)],
        ]
    )


@dataclass(frozen=True)
class ADMComparison:
    slots: np.ndarray
    slot_gradients: np.ndarray
    rhs: np.ndarray
    gamma_rate: np.ndarray
    extrinsic_rate: np.ndarray
    ricci: np.ndarray
    hamiltonian: np.ndarray
    momentum: np.ndarray
    geometric_gamma_rate: np.ndarray
    momentum_gamma_feedback: np.ndarray
    shift_coefficient_gradient_term: np.ndarray

    def __post_init__(self):
        for item in fields(self):
            value = getattr(self, item.name)
            if not np.all(np.isfinite(value)):
                raise ValueError("finite oracle result required")
            object.__setattr__(self, item.name, readonly(value))


def evaluate(j):
    """Physical ADM equations followed by differentiating the conformal map.

    With zero Z/Theta, their rates are alpha M_i and alpha H/2. We form
    GammaHat_dot by differentiating its DEFINITION, not the production expanded
    Gamma equation. Auxiliary rates are spatial derivatives of base gauge/metric
    rates on the auxiliary-definition surface. Violations of this surface are
    intentionally unsupported and no ordering-constraint theorem is implied.
    """
    if not isinstance(j, PhysicalJet):
        raise ValueError("validated PhysicalJet required")
    g, dg, ddg = j.gamma, j.dgamma, j.ddgamma
    k, dk, alpha, beta = j.extrinsic, j.dextrinsic, j.alpha, j.beta
    inv, dinv, connection, ricci = physical_geometry(j)
    trace = contraction(inv, k)
    dtrace = np.stack(
        [
            contraction(dinv[..., s, :, :], k) + contraction(inv, dk[..., s, :, :])
            for s in range(3)
        ],
        axis=-1,
    )
    mixed = inv @ k
    dmixed = np.stack(
        [dinv[..., s, :, :] @ k + inv @ dk[..., s, :, :] for s in range(3)], axis=-3
    )
    scalar = contraction(inv, ricci)
    hamiltonian = scalar + trace**2 - np.trace(mixed @ mixed, axis1=-2, axis2=-1)
    momentum = -dtrace.copy()
    for i in range(3):
        for s in range(3):
            momentum[..., i] += dmixed[..., s, s, i]
            for t in range(3):
                momentum[..., i] += (
                    connection[..., s, s, t] * mixed[..., t, i]
                    - connection[..., t, s, i] * mixed[..., s, t]
                )
    cov_hess = j.ddalpha - np.einsum("...kij,...k->...ij", connection, j.dalpha)
    gdot = -2.0 * alpha[..., None, None] * k + lie_covariant(g, dg, beta, j.dbeta)
    kdot = (
        -cov_hess
        + alpha[..., None, None]
        * (ricci + trace[..., None, None] * k - 2.0 * k @ inv @ k)
        + lie_covariant(k, dk, beta, j.dbeta)
    )
    invdot = -inv @ gdot @ inv
    tracedot = contraction(invdot, k) + contraction(inv, kdot)
    dgdot = np.empty_like(dg)
    for s in range(3):
        dgdot[..., s, :, :] = (
            -2.0 * j.dalpha[..., s, None, None] * k
            - 2.0 * alpha[..., None, None] * dk[..., s, :, :]
            + lie_covariant(dg[..., s, :, :], ddg[..., s, :, :, :], beta, j.dbeta)
            + lie_covariant(g, dg, j.dbeta[..., s, :], j.ddbeta[..., s, :, :])
        )

    ell = -np.log(np.linalg.det(g)) / 6.0
    dell = np.stack(
        [-contraction(inv, dg[..., s, :, :]) / 6.0 for s in range(3)], axis=-1
    )
    ddell = np.empty((*alpha.shape, 3, 3))
    for s in range(3):
        for t in range(3):
            ddell[..., s, t] = (
                -(
                    contraction(dinv[..., s, :, :], dg[..., t, :, :])
                    + contraction(inv, ddg[..., s, t, :, :])
                )
                / 6.0
            )
    chi = np.exp(2.0 * ell)
    dchi = 2.0 * chi[..., None] * dell
    ddchi = chi[..., None, None] * (
        2.0 * ddell + 4.0 * dell[..., :, None] * dell[..., None, :]
    )
    h = chi[..., None, None] * g
    dh = chi[..., None, None, None] * dg + dchi[..., :, None, None] * g[..., None, :, :]
    ddh = np.empty_like(ddg)
    for s in range(3):
        for t in range(3):
            ddh[..., s, t, :, :] = (
                chi[..., None, None] * ddg[..., s, t, :, :]
                + ddchi[..., s, t, None, None] * g
                + dchi[..., s, None, None] * dg[..., t, :, :]
                + dchi[..., t, None, None] * dg[..., s, :, :]
            )
    hi, dhi, ddhi = inverse_jets(h, dh, ddh)
    gamma = -np.einsum("...jij->...i", dhi)
    dgamma = -np.einsum("...sjij->...si", ddhi)
    a = chi[..., None, None] * k - h * trace[..., None, None] / 3.0
    da = np.empty_like(dg)
    for s in range(3):
        da[..., s, :, :] = (
            dchi[..., s, None, None] * k
            + chi[..., None, None] * dk[..., s, :, :]
            - (
                dh[..., s, :, :] * trace[..., None, None]
                + h * dtrace[..., s, None, None]
            )
            / 3.0
        )

    elldot = -contraction(inv, gdot) / 6.0
    delldot = np.stack(
        [
            -(
                contraction(dinv[..., s, :, :], gdot)
                + contraction(inv, dgdot[..., s, :, :])
            )
            / 6.0
            for s in range(3)
        ],
        axis=-1,
    )
    chidot = 2.0 * chi * elldot
    dchidot = 2.0 * (dchi * elldot[..., None] + chi[..., None] * delldot)
    hdot = chi[..., None, None] * gdot + chidot[..., None, None] * g
    dhdot = np.empty_like(dg)
    dhidot = np.empty_like(dg)
    for s in range(3):
        dhdot[..., s, :, :] = (
            dchi[..., s, None, None] * gdot
            + chi[..., None, None] * dgdot[..., s, :, :]
            + dchidot[..., s, None, None] * g
            + chidot[..., None, None] * dg[..., s, :, :]
        )
        dhidot[..., s, :, :] = -(
            dhi[..., s, :, :] @ hdot @ hi
            + hi @ dhdot[..., s, :, :] @ hi
            + hi @ hdot @ dhi[..., s, :, :]
        )
    geometric_gamma_rate = -np.einsum("...jij->...i", dhidot)
    feedback = 2.0 * alpha[..., None] * np.einsum("...ij,...j->...i", hi, momentum)
    gammadot = geometric_gamma_rate + feedback
    adot = (
        chidot[..., None, None] * k
        + chi[..., None, None] * kdot
        - (hdot * trace[..., None, None] + h * tracedot[..., None, None]) / 3.0
    )

    logalpha_gradient = j.dalpha / alpha[..., None]
    logalpha_hessian = (
        j.ddalpha / alpha[..., None, None]
        - logalpha_gradient[..., :, None] * logalpha_gradient[..., None, :]
    )
    logalpha_rate = np.einsum("...i,...i->...", beta, logalpha_gradient) - 2.0 * trace
    lapse_gradient_rate = (
        np.einsum("...si,...i->...s", j.dbeta, logalpha_gradient)
        + np.einsum("...i,...si->...s", beta, logalpha_hessian)
        - 2.0 * dtrace
    )
    f = 3.0 * alpha * chi
    df = 3.0 * (j.dalpha * chi[..., None] + alpha[..., None] * dchi)
    coefficient_gradient_term = df[..., :, None] * j.driver[..., None, :]
    betadot = np.einsum("...s,...si->...i", beta, j.dbeta) + f[..., None] * j.driver
    dbetadot = (
        np.einsum("...sk,...ki->...si", j.dbeta, j.dbeta)
        + np.einsum("...k,...ski->...si", beta, j.ddbeta)
        + coefficient_gradient_term
        + f[..., None, None] * j.ddriver
    )
    bdot = (
        gammadot
        - np.einsum("...s,...si->...i", beta, dgamma)
        + np.einsum("...s,...si->...i", beta, j.ddriver)
    )
    zeros = np.zeros_like(alpha)
    value = dict(
        h=h,
        ln_alpha=np.log(alpha),
        beta=beta,
        ln_phi=ell,
        a=a,
        K=trace,
        Theta=zeros,
        Gamma=gamma,
        b=j.driver,
        A=logalpha_gradient,
        B=j.dbeta,
        D=0.5 * dh,
        P=dell,
    )
    gradient = []
    for s in range(3):
        gradient.append(
            _pack(
                dict(
                    h=dh[..., s, :, :],
                    ln_alpha=logalpha_gradient[..., s],
                    beta=j.dbeta[..., s, :],
                    ln_phi=dell[..., s],
                    a=da[..., s, :, :],
                    K=dtrace[..., s],
                    Theta=zeros,
                    Gamma=dgamma[..., s, :],
                    b=j.ddriver[..., s, :],
                    A=logalpha_hessian[..., s, :],
                    B=j.ddbeta[..., s, :, :],
                    D=0.5 * ddh[..., s, :, :, :],
                    P=ddell[..., s, :],
                )
            )
        )
    rates = dict(
        h=hdot,
        ln_alpha=logalpha_rate,
        beta=betadot,
        ln_phi=elldot,
        a=adot,
        K=tracedot,
        Theta=0.5 * alpha * hamiltonian,
        Gamma=gammadot,
        b=bdot,
        A=lapse_gradient_rate,
        B=dbetadot,
        D=0.5 * dhdot,
        P=delldot,
    )
    return ADMComparison(
        _pack(value),
        np.stack(gradient),
        _pack(rates),
        gdot,
        kdot,
        ricci,
        hamiltonian,
        momentum,
        geometric_gamma_rate,
        feedback,
        coefficient_gradient_term,
    )
