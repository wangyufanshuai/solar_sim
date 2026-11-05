"""Invertible full43 derivative-aware reduction; not a boundary/energy proof."""

from __future__ import annotations
import numpy as np
from . import constraint_order_reduction as R

B, P = R.B, R.B.P
METHOD = "nr-longitudinal-constraint-reduction-v1"
TOLERANCE = R.TOLERANCE
FORWARD_POWERS = tuple(range(-1, 2))
INVERSE_POWERS = tuple(range(-1, 3))
SYMBOL_POWERS = tuple(range(-2, 6))
ROW_POWERS = tuple(range(-1, 4))
GROUPS = ((8, 1), (11, 3), (20, 6), (38, 1))


def projectors(normal):
    n = R.direction(normal)
    longitudinal = np.zeros((43, 43), dtype=complex)
    auxiliary = np.zeros_like(longitudinal)
    for start, width in GROUPS:
        sl = slice(start, start + 3 * width)
        longitudinal[sl, sl] = np.kron(np.outer(n, n), np.eye(width))
        auxiliary[sl, sl] = np.eye(3 * width)
    return longitudinal, auxiliary - longitudinal


def trace_row(cell, normal):
    _, hi, _, _, _, n = B.coefficients(cell, R.direction(normal))
    row = np.zeros(43, dtype=complex)
    for axis in range(3):
        for pair, (i, j) in enumerate(B.PAIRS):
            row[20 + 6 * axis + pair] = 2 * n[axis] * hi[i, j] * (1 if i == j else 2)
    return row


def factor_coefficients(cell, normal):
    """W and its exact inverse, preserving the determinant compensation."""
    P.flat_cell(cell)
    parallel, transverse = projectors(normal)
    high, low = parallel.copy(), np.zeros((43, 43), dtype=complex)
    high[:4, :4] = np.eye(4)
    low[41, 41] = 1
    common = transverse.copy()
    common[4:8, 4:8], common[42, 42] = np.eye(4), 1
    forward, inverse = common.copy(), common.copy()
    forward[41], inverse[41] = trace_row(cell, normal), -trace_row(cell, normal)
    return {-1: high, 0: forward, 1: low}, {-1: low, 0: inverse, 1: high}


def product(left, right):
    result = {}
    for i, a in left.items():
        for j, b in right.items():
            value = a @ b
            result[i + j] = result.get(i + j, np.zeros_like(value)) + value
    return result


def evaluate(coefficients, rho):
    R.weights(rho, "hm-only")
    return sum((1j * rho) ** power * a for power, a in coefficients.items())


def pack(coefficients, powers, shape):
    P.require(
        set(coefficients).issubset(powers), "coefficient powers cannot be discarded"
    )
    return np.stack(
        [coefficients.get(p, np.zeros(shape, dtype=complex)) for p in powers]
    )


def unpack(values, powers, shape):
    a = np.asarray(values)
    P.require(
        a.shape == (len(powers), *shape)
        and a.dtype == np.complex128
        and np.isfinite(a).all(),
        "complete finite Laurent coefficients required",
    )
    return dict(zip(powers, a, strict=True))


def bridge_coefficients(cell, normal):
    n = R.direction(normal)
    zero, zero_inverse = B.transformation(cell, np.zeros(3))
    plus, _ = B.transformation(cell, n)
    minus, _ = B.transformation(cell, -n)
    linear = (plus - minus) / (2j)
    return {0: zero, 1: linear}, {0: zero_inverse, 1: -linear}


def coefficients(cell, normal):
    w, wi = factor_coefficients(cell, normal)
    t, ti = bridge_coefficients(cell, normal)
    forward, inverse = product(w, t), product(ti, wi)
    # The formal conversion only changes H/Z; W's positive power acts on d.
    # The unneeded power2 forward coefficient is structurally zero, checked,
    # not clipped by magnitude. Keep an exact-zero assertion before removal.
    P.require(np.count_nonzero(forward[2]) == 0, "unexpected forward degree2")
    del forward[2]
    raw = dict(enumerate(R.polynomial(cell, normal)))
    symbol = product(product(forward, raw), inverse)
    n = R.direction(normal)
    zero = B.physical_rows(cell, np.zeros(3))
    plus, minus = B.physical_rows(cell, n), B.physical_rows(cell, -n)
    rows = {0: zero, 1: (plus - minus) / (2j), 2: zero - (plus + minus) / 2}
    return dict(
        forward=pack(forward, FORWARD_POWERS, (43, 43)),
        inverse=pack(inverse, INVERSE_POWERS, (43, 43)),
        symbol=pack(symbol, SYMBOL_POWERS, (43, 43)),
        rows=pack(product(forward, rows), ROW_POWERS, (43, 58)),
    )


def direct(cell, normal, rho):
    """Pointwise formula for comparison with the Laurent construction."""
    n = R.direction(normal)
    R.weights(rho, "hm-only")
    z = 1j * rho
    parallel, transverse = projectors(n)
    w, wi = transverse + parallel / z, transverse + z * parallel
    w[:4, :4], wi[:4, :4] = np.eye(4) / z, z * np.eye(4)
    w[4:8, 4:8] = wi[4:8, 4:8] = np.eye(4)
    w[42, 42] = wi[42, 42] = 1
    row = trace_row(cell, n)
    w[41], wi[41] = row, -row
    w[41, 41], wi[41, 41] = z, 1 / z
    t, ti = B.transformation(cell, rho * n)
    return w @ t, ti @ wi


def curl_operator(normal):
    n = R.direction(normal)
    cross = np.array([[0, -n[2], n[1]], [n[2], 0, -n[0]], [-n[1], n[0], 0]])
    result = np.zeros((33, 43), dtype=complex)
    for start, width in GROUPS:
        result[start - 8 : start - 8 + 3 * width, start : start + 3 * width] = np.kron(
            cross, np.eye(width)
        )
    return result
