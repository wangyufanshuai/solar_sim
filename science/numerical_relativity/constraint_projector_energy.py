"""Prescribed-node spectral projectors; no fitted eigenbasis or boundary claim."""

from __future__ import annotations
from decimal import Decimal, localcontext
from functools import lru_cache
import math
import numpy as np
from . import longitudinal_constraint_reduction as L

P = L.P
METHOD = "nr-constraint-projector-energy-v1"
TOLERANCE = L.TOLERANCE


def real_exact(value):
    a = np.asarray(value)
    P.require(np.isfinite(a).all() and np.count_nonzero(a.imag) == 0, "exactly real finite coefficients required, no clipping")
    return np.array(a.real, dtype=float, copy=True)


def nodes(cell, normal):
    _, hi, alpha, chi, _, n = L.B.coefficients(cell, L.R.direction(normal))
    g = float(n @ hi @ n)
    magnitudes = (alpha * math.sqrt(chi * g), math.sqrt(2 * alpha * chi * g), math.sqrt(4 * alpha * chi * g), alpha * math.sqrt(.1 * chi * g), math.sqrt(3 * alpha * chi * g), alpha * math.sqrt(.05 * chi * g))
    result = np.array(sorted((0., *magnitudes, *(-x for x in magnitudes))))
    validate_nodes(result)
    return result


def validate_nodes(value):
    x = P.S.real(value, (13,))
    P.require(x[6] == 0 and np.array_equal(x[:6], -x[:6:-1]) and np.min(np.diff(x)) > 1e-12 * max(1., float(np.max(abs(x)))), "thirteen distinct symmetric prescribed nodes required")
    return x


def principal(cell, normal):
    a = L.coefficients(cell, normal)["symbol"][L.SYMBOL_POWERS.index(1)]
    return real_exact(a)


def polynomial_projectors(matrix, pde, roots, *, precision=50):
    """Paired Lagrange polynomials evaluated in Decimal, with no eigensolver."""
    raw = np.asarray(matrix)
    P.require(raw.ndim == 2 and raw.shape[0] == raw.shape[1] and raw.shape[0] in (43, 47), "registered square43/47 principal block required")
    raw = P.S.real(raw, raw.shape)
    projector = P.S.real(pde, raw.shape)
    x = validate_nodes(roots)
    P.require(type(precision) is int and precision in (50, 70), "registered precision50/70 required")
    with localcontext() as context:
        context.prec = precision
        convert = np.vectorize(lambda v: Decimal.from_float(float(v)), otypes=[object])
        k, p = convert(raw), convert(projector)
        square = k @ k
        powers = [p]
        for _ in range(6):
            powers.append(square @ powers[-1])
        positive = [Decimal.from_float(float(v)) for v in x[7:]]
        squared = [v * v for v in positive]
        answer = [None] * 13
        zero = p.copy()
        for index, a in enumerate(positive):
            coefficients = [Decimal(0), Decimal(1)]
            denominator = squared[index]
            for j, b2 in enumerate(squared):
                if j == index:
                    continue
                updated = [Decimal(0)] * (len(coefficients) + 1)
                for degree, value in enumerate(coefficients):
                    updated[degree] -= b2 * value
                    updated[degree + 1] += value
                coefficients = updated
                denominator *= squared[index] - b2
            paired = sum((coefficient / denominator) * powers[j] for j, coefficient in enumerate(coefficients))
            signed = (k @ paired) / a
            answer[7 + index], answer[5 - index] = (paired + signed) / 2, (paired - signed) / 2
            zero -= paired
        answer[6] = zero
        result = np.asarray(answer, dtype=float)
    P.require(np.isfinite(result).all(), "finite polynomial projectors required")
    return result


def energy(ode, projectors):
    o = P.S.real(ode, (43, 43))
    e = P.S.real(projectors, (13, 43, 43))
    return o.T @ o + np.einsum("aki,akj->ij", e, e)


@lru_cache(maxsize=27)
def intrinsic_data(zero_cell, direction):
    q, n = np.array(zero_cell), np.array(direction)
    P.require(not np.any(q[7:10]), "canonical zero shift required")
    ode = real_exact(L.projectors(n)[0])
    matrix = principal(q, n)
    roots = nodes(q, n)
    projections = polynomial_projectors(matrix, np.eye(43) - ode, roots)
    result = (matrix, ode, roots, projections, energy(ode, projections))
    for a in result:
        a.setflags(write=False)
    return result


def canonical(cell, normal):
    q, n = P.flat_cell(cell).copy(), L.R.direction(normal)
    q[7:10] = 0
    return intrinsic_data(tuple(q), tuple(n))
