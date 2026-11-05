"""Analytic physical/formal Fourier bridge, not fitted constraint closure.

Constant flat seeds only. Full spatial symbol includes zeroth and second
derivative terms. No pseudoinverse, full-state RHS or numerical differentiation
is used to construct this operator.
"""

from __future__ import annotations
import numpy as np
from . import profile_constraint_closure as P

METHOD = "nr-physical-formal-constraint-symbol-v1"
TOLERANCE = 2e-12
PAIRS = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))
PAIR_INDEX = np.array(
    [[PAIRS.index(tuple(sorted((i, j)))) for j in range(3)] for i in range(3)]
)


def coefficients(cell, wave):
    q = P.flat_cell(cell)
    k = P.S.real(wave, (3,))
    P.require(np.max(abs(k)) <= 8, "bounded wave required")
    h = symmetric(q[:6])
    return h, np.linalg.inv(h), np.exp(q[6]), np.exp(2 * q[10]), q[7:10], k


def symmetric(values):
    return values[..., PAIR_INDEX]


def connection(h, D):
    low = np.einsum("...ilj->...lij", D) + np.einsum("...jli->...lij", D) - D
    return np.einsum("kl,...lij->...kij", np.linalg.inv(h), low)


def connection_gradient(h, second):
    low = 0.5 * (
        np.einsum("...silj->...slij", second)
        + np.einsum("...sjli->...slij", second)
        - second
    )
    return np.einsum("kl,...slij->...skij", np.linalg.inv(h), low)


def ricci(derivative):
    return np.einsum("...kkij->...ij", derivative) - np.einsum(
        "...jkik->...ij", derivative
    )


def physical_rows(cell, wave):
    h, hi, _, chi, _, k = coefficients(cell, wave)
    basis = np.eye(58, dtype=complex)
    dh, da = symmetric(basis[:, :6]), symmetric(basis[:, 11:17])
    kup, norm = hi @ k, k @ hi @ k
    metric = dh - 2 * basis[:, 10, None, None] * h
    H = chi * (
        -np.einsum("i,j,...ij->...", kup, kup, metric)
        + norm * np.einsum("ij,...ij->...", hi, metric)
    )
    trace = np.einsum("ij,...ij->...", hi, da)
    M = 1j * (
        np.einsum("j,...ji->...i", kup, da)
        - (trace + (2 / 3) * basis[:, 17])[:, None] * k
    )
    actual = connection(h, 0.5j * np.einsum("s,...ij->...sij", k, dh))
    Z = 0.5 * np.einsum(
        "ij,...j->...i", h, basis[:, 19:22] - np.einsum("jk,...ijk->...i", hi, actual)
    )
    definitions = basis[25:] - P.R.gradient_aux(
        1j * k[:, None, None] * basis[None, :11]
    )
    algebraic = np.array([np.einsum("ij,...ij->...", hi, dh), trace])
    return np.vstack((H, M.T, basis[18], Z.T, definitions, algebraic))


def split(values):
    return (
        values[:, 0],
        values[:, 1:4],
        values[:, 4],
        values[:, 5:8],
        values[:, 8:11],
        values[:, 11:20].reshape(-1, 3, 3),
        symmetric(values[:, 20:38].reshape(-1, 3, 6)),
        values[:, 38:41],
        values[:, 41],
        values[:, 42],
    )


def transformation(cell, wave):
    h, hi, _, chi, _, k = coefficients(cell, wave)
    _, _, _, _, _, _, D, pp, _, _ = split(np.eye(43, dtype=complex))
    conformal = connection(h, D)
    eye = np.eye(3)
    physical = (
        conformal
        - np.einsum("ki,...j->...kij", eye, pp)
        - np.einsum("kj,...i->...kij", eye, pp)
        + np.einsum("ij,kl,...l->...kij", h, hi, pp)
    )
    scalar = chi * np.einsum(
        "ij,...ij->...",
        hi,
        1j
        * (
            np.einsum("k,...kij->...ij", k, physical)
            - np.einsum("j,...kik->...ij", k, physical)
        ),
    )
    zd = -0.5 * np.einsum(
        "ij,...j->...i", h, np.einsum("jk,...ijk->...i", hi, conformal)
    )
    delta = np.zeros((43, 43), dtype=complex)
    delta[0], delta[5:8] = scalar, zd.T
    return np.eye(43) + delta, np.eye(43) - delta


def linear_symbol(cell, wave):
    """Explicit linear subsidiary equations in physical constraint coordinates."""
    h, hi, alpha, chi, beta, k = coefficients(cell, wave)
    H, M, theta, Z, rA, rB, rD, rP, d, c = split(np.eye(43, dtype=complex))
    kup, norm, adv = hi @ k, k @ hi @ k, 1j * (beta @ k)
    drD = 1j * np.einsum("s,...tij->...stij", k, rD)
    yh = drD + drD.swapaxes(-4, -3)
    drP = 1j * np.einsum("s,...t->...st", k, rP)
    yg = yh - np.einsum("...st,ij->...stij", drP + drP.swapaxes(-2, -1), h)
    formal_dconn = connection_gradient(h, yh)
    dz = -0.5 * np.einsum(
        "ij,...j->...i", h, np.einsum("jk,...ijk->...i", hi, connection(h, rD))
    )
    ddz = -0.5 * np.einsum(
        "ij,...sj->...si", h, np.einsum("jk,...sijk->...si", hi, formal_dconn)
    )
    rz = ricci(connection_gradient(h, yg)) + ddz + ddz.swapaxes(-2, -1)
    v = (
        2 * np.einsum("s,...sij->...ij", beta, rD - np.einsum("...s,ij->...sij", rP, h))
        + np.einsum("ki,...jk->...ij", h, rB)
        + np.einsum("kj,...ik->...ij", h, rB)
        + ((2 / 3) * alpha * c - d)[:, None, None] * h
    )
    hessian = (
        0.5j
        * alpha
        * (np.einsum("i,...j->...ij", k, rA) + np.einsum("j,...i->...ij", k, rA))
    )
    w = -hessian + alpha * rz - c[:, None, None] * h / chi
    hrate = (
        adv * H
        - 2j * alpha * chi * np.einsum("i,...i->...", kup, M)
        + chi
        * (
            -np.einsum("i,j,...ij->...", kup, kup, v)
            + norm * np.einsum("ij,...ij->...", hi, v)
        )
    )
    mrate = (
        adv * M
        - 0.5j * alpha * H[:, None] * k
        + alpha * chi * (-norm * Z + np.einsum("j,...j->...", kup, Z)[:, None] * k)
        + 0.2j * alpha * theta[:, None] * k
        + 1j
        * chi
        * (
            np.einsum("l,...li->...i", kup, w)
            - np.einsum("lm,...lm->...", hi, w)[:, None] * k
        )
    )
    theta_rate = (
        adv * theta
        + alpha * (0.5 * H + 1j * chi * np.einsum("i,...i->...", kup, Z))
        - 0.2 * alpha * theta
        + 0.5 * alpha * chi * np.einsum("ij,...ij->...", hi, rz)
    )
    drB = 1j * np.einsum("s,...ti->...sti", k, rB)
    symB = 0.5 * (drB + drB.swapaxes(-3, -2))
    gamma = (
        (10 / 3) * alpha * 1j * c[:, None] * kup
        + np.einsum("kl,...kli->...i", hi, symB)
        + np.einsum("ik,...kll->...i", hi, symB) / 3
        - 0.2 * alpha * np.einsum("ij,...j->...i", hi, dz)
    )
    delta_h = (
        2 * np.einsum("s,...sij->...ij", beta, rD)
        + np.einsum("ki,...jk->...ij", h, rB)
        + np.einsum("kj,...ik->...ij", h, rB)
        - ((2 / 3) * np.trace(rB, axis1=-2, axis2=-1) + d)[:, None, None] * h
    )
    contracted = np.einsum(
        "jk,...ijk->...i",
        hi,
        connection(h, 0.5j * np.einsum("s,...ij->...sij", k, delta_h)),
    )
    zrate = (
        adv * Z
        + alpha * M
        + 1j * alpha * theta[:, None] * k
        - 0.1 * alpha * Z
        + 0.5 * np.einsum("ij,...j->...i", h, gamma - contracted)
    )

    def curl(field, i, j):
        return 1j * (k[i] * field[:, j] - k[j] * field[:, i])

    ar, br, dr, pr = [], [], [], []
    for axis in range(3):
        cb = sum(curl(rB, axis, idx)[:, idx] for idx in range(3))
        ar.append(
            sum(beta[idx] * curl(rA, idx, axis) for idx in range(3)) - 2j * k[axis] * c
        )
        pr.append(
            sum(beta[idx] * curl(rP, idx, axis) for idx in range(3))
            + 1j * alpha * k[axis] * c / 3
            + cb / 6
        )
        ordering = np.stack(
            [
                curl(rP, axis, m)
                - sum(
                    np.einsum("n,...n->...", hi[:, idx], curl(rD, axis, idx)[:, m])
                    for idx in range(3)
                )
                for m in range(3)
            ],
            axis=-1,
        )
        br.append(
            sum(beta[idx] * curl(rB, idx, axis) for idx in range(3))
            + 0.2 * alpha * alpha * chi * np.einsum("ij,...j->...i", hi, ordering)
        )
        matrix = np.stack(
            [
                np.stack(
                    [
                        0.25
                        * (
                            np.einsum("l,...l->...", h[:, i], curl(rB, axis, j))
                            + np.einsum("l,...l->...", h[:, j], curl(rB, axis, i))
                        )
                        for j in range(3)
                    ],
                    axis=-1,
                )
                for i in range(3)
            ],
            axis=-2,
        )
        dr.append(
            sum(beta[idx] * curl(rD, idx, axis) for idx in range(3))
            + (0.5j * k[axis] * d + cb / 6)[:, None, None] * h
            - matrix
        )
    drate = (
        adv * d
        + 2 * np.einsum("k,...k->...", beta, np.einsum("ij,...kij->...k", hi, rD))
        - 3 * d
    )
    crate = (adv - 3) * c
    output = np.column_stack(
        (
            hrate,
            mrate,
            theta_rate,
            zrate,
            *ar,
            *[br[a][:, i] for a in range(3) for i in range(3)],
            *[dr[a][:, i, j] for a in range(3) for i, j in PAIRS],
            *pr,
            drate,
            crate,
        )
    )
    P.require(
        output.shape == (43, 43) and np.isfinite(output).all(),
        "finite43 symbol required",
    )
    return output.T.copy()
