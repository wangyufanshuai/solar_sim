"""Exact polynomial order accounting; neither CPBC nor a hyperbolicity proof."""

from __future__ import annotations
import numpy as np
from . import constraint_symbol_bridge as B

METHOD = "nr-constraint-order-reduction-v1"
TOLERANCE = B.TOLERANCE
SCHEMES = ("hm-only", "algebraic-weighted")
POWERS = tuple(range(-2, 5))
SCALES = (0.5, 1.0, 2.0, 4.0, 8.0)


def direction(value):
    n = B.P.S.real(value, (3,))
    B.P.require(abs(np.linalg.norm(n) - 1) <= TOLERANCE, "unit direction required")
    return n


def orders(scheme):
    B.P.require(type(scheme) is str and scheme in SCHEMES, "registered order required")
    result = np.zeros(43, dtype=np.int64)
    result[:4] = 1
    if scheme == "algebraic-weighted":
        result[41:] = -1
    return result


def weights(rho, scheme):
    B.P.require(
        type(rho) in (int, float) and np.isfinite(rho) and 0.5 <= rho <= 8,
        "registered nonzero frequency range required",
    )
    return (1j * rho) ** (-orders(scheme))


def polynomial(cell, normal):
    """Coefficient extraction of a known quadratic in z=i*rho, not regression."""
    n = direction(normal)
    zero = B.linear_symbol(cell, np.zeros(3))
    plus, minus = B.linear_symbol(cell, n), B.linear_symbol(cell, -n)
    result = np.stack((zero, (plus - minus) / (2j), zero - (plus + minus) / 2))
    B.P.require(np.isfinite(result).all(), "finite polynomial required")
    return result


def grade(raw, scheme):
    a = np.asarray(raw)
    B.P.require(
        a.shape == (3, 43, 43) and a.dtype == np.complex128 and np.isfinite(a).all(),
        "complete finite complex128 polynomial required",
    )
    s = orders(scheme)
    result = np.zeros((len(POWERS), 43, 43), dtype=complex)
    for degree in range(3):
        exponent = degree + s[None, :] - s[:, None]
        for j, power in enumerate(POWERS):
            result[j] += np.where(exponent == power, a[degree], 0)
    return result


def evaluate(graded, rho):
    a = np.asarray(graded)
    B.P.require(
        a.shape == (len(POWERS), 43, 43)
        and a.dtype == np.complex128
        and np.isfinite(a).all(),
        "complete graded polynomial required",
    )
    weights(rho, "hm-only")
    return sum((1j * rho) ** power * a[j] for j, power in enumerate(POWERS))


def normalized(cell, normal, rho, scheme):
    n, w = direction(normal), weights(rho, scheme)
    return w[:, None] * B.linear_symbol(cell, rho * n) / w[None, :]


def jordan_rows(cell, normal, scheme):
    """Prespecified left rows; caller determines when beta.n is zero."""
    q, n = B.P.flat_cell(cell), direction(normal)
    orders(scheme)
    result = np.zeros((2, 43), dtype=complex)
    result[0, 8:11], result[1, 8:11] = n, -q[7:10]
    if scheme == "hm-only":
        result[1, 42] = -2
    return result
