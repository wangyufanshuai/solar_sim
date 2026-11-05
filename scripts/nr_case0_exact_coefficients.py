"""Independent rational flat-background principal coefficients, case 0 only.

No imports from the existing RHS, geometry, reduction or saved-array code.
The equations and scope are derived in DERIVATION-20261013-case0-exact.md.
"""

from fractions import Fraction as F
import math

import numpy as np

PAIRS = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))
PAIR_INDEX = {pair: i for i, pair in enumerate(PAIRS)}
SQUARED = (F(1, 20), F(1, 10), F(1), F(2), F(3), F(4))


def pair(i, j):
    return PAIR_INDEX[min(i, j), max(i, j)]


def principal_rates(q, *, geometric=False):
    """Apply the explicitly linearized RHS to one derivative-slot vector."""

    def d(axis, value):
        return value if axis == 0 else F(0)

    def a(i, j):
        return q[11 + pair(i, j)]

    def shift(k, i):
        return q[28 + 3 * k + i]

    def metric(k, i, j):
        return q[37 + 6 * k + pair(i, j)]

    def conformal_hessian(s, t, i, j):
        return d(s, metric(t, i, j)) + d(t, metric(s, i, j))

    def physical_hessian(s, t, i, j):
        return conformal_hessian(s, t, i, j) - int(i == j) * (
            d(s, q[55 + t]) + d(t, q[55 + s])
        )

    def contracted_derivative(s, i):
        return sum(
            conformal_hessian(s, j, i, j) - conformal_hessian(s, i, j, j) / 2
            for j in range(3)
        )

    def ricci_z(i, j):
        gamma = (d(i, q[19 + j]) + d(j, q[19 + i])) / 2
        if geometric:
            ricci = (
                sum(
                    physical_hessian(k, i, k, j)
                    + physical_hessian(k, j, k, i)
                    - physical_hessian(k, k, i, j)
                    - physical_hessian(i, j, k, k)
                    for k in range(3)
                )
                / 2
            )
            return (
                ricci
                + gamma
                - (contracted_derivative(i, j) + contracted_derivative(j, i)) / 2
            )
        return (
            -sum(d(k, metric(k, i, j)) for k in range(3))
            + (d(i, q[55 + j]) + d(j, q[55 + i])) / 2
            + int(i == j) * sum(d(k, q[55 + k]) for k in range(3))
            + gamma
        )

    x = [[ricci_z(i, j) for j in range(3)] for i in range(3)]
    y = [
        [x[i][j] - (d(i, q[25 + j]) + d(j, q[25 + i])) / 2 for j in range(3)]
        for i in range(3)
    ]
    trace_y = sum(y[i][i] for i in range(3))
    trace_a = sum(a(i, i) for i in range(3))
    out = [F(0)] * 58
    for index, (i, j) in enumerate(PAIRS):
        out[11 + index] = y[i][j] - int(i == j) * trace_y / 3
    out[17], out[18] = trace_y, sum(x[i][i] for i in range(3)) / 2
    for i in range(3):
        rate = (
            -F(4, 3) * d(i, q[17])
            + 2 * d(i, q[18])
            + 2 * d(i, trace_a)
            + sum(d(k, shift(k, i)) for k in range(3))
            + sum(d(i, shift(ell, ell)) + d(ell, shift(i, ell)) for ell in range(3)) / 6
        )
        out[19 + i] = out[22 + i] = rate
    for k in range(3):
        out[25 + k] = -2 * d(k, q[17]) + 4 * d(k, q[18]) - 2 * d(k, trace_a)
        divergence = sum(
            d(k, shift(ell, ell)) + d(ell, shift(k, ell)) for ell in range(3)
        )
        out[55 + k] = (d(k, q[17]) + d(k, trace_a)) / 3 - divergence / 6
        for i in range(3):
            curl = (
                d(k, q[55 + i])
                - d(i, q[55 + k])
                - sum(
                    d(k, metric(ell, i, ell)) - d(ell, metric(k, i, ell))
                    for ell in range(3)
                )
            )
            out[28 + 3 * k + i] = 3 * d(k, q[22 + i]) + curl / 5
        for index, (i, j) in enumerate(PAIRS):
            out[37 + 6 * k + index] = (
                (
                    d(k, shift(j, i))
                    + d(j, shift(k, i))
                    + d(k, shift(i, j))
                    + d(i, shift(k, j))
                )
                / 4
                - int(i == j) * divergence / 6
                - d(k, a(i, j))
                + int(i == j) * d(k, trace_a) / 3
            )
    return out


def matrix(*, geometric=False, guard=lambda: None):
    columns = []
    for j in range(58):
        guard()
        q = [F(0)] * 58
        q[j] = F(1)
        columns.append(principal_rates(q, geometric=geometric))
    return np.array(columns, dtype=object).T


def sparse(a):
    return [{j: v for j, v in enumerate(row) if v != 0} for row in a]


def multiply(a, b):
    out = []
    for row in a:
        current = {}
        for k, av in row.items():
            for j, bv in b[k].items():
                current[j] = current.get(j, F(0)) + av * bv
        # Remove exact rational zeros only, never magnitude-based clipping.
        out.append({j: v for j, v in current.items() if v != 0})
    return out


def annihilator(a, *, guard=lambda: None):
    k = sparse(a)
    square = multiply(k, k)
    value = k
    for s in SQUARED:
        guard()
        factor = [dict(row) for row in square]
        for i, row in enumerate(factor):
            row[i] = row.get(i, F(0)) - s
        value = multiply(value, factor)
    out = np.full(a.shape, F(0), dtype=object)
    for i, row in enumerate(value):
        for j, v in row.items():
            out[i, j] = v
    return out


def infnorm(a):
    return max(sum(abs(v) for v in row) for row in a)


def saved_exact(a):
    return np.vectorize(lambda v: F.from_float(float(v)), otypes=[object])(a)


def encode(a):
    return dict(
        shape=list(a.shape),
        representation="sparse-exact-rational-zero-fill",
        entries=[
            [i, j, str(v.numerator), str(v.denominator)]
            for i, row in enumerate(a)
            for j, v in enumerate(row)
            if v != 0
        ],
    )


def equation(row):
    for end, name in (
        (11, "12a-d: zero principal"),
        (17, "12e"),
        (18, "12f"),
        (19, "12g"),
        (22, "12h"),
        (25, "12i"),
        (28, "12j"),
        (37, "12k"),
        (55, "12l"),
        (58, "12m"),
    ):
        if row < end:
            return name
    raise ValueError("state index")


def compare(saved, reference):
    rational = saved_exact(saved)
    rounded = np.asarray(reference, dtype=float)
    rows = []
    max_ulp, zero_error = F(0), F(0)
    for i in range(58):
        for j in range(58):
            difference = rational[i, j] - reference[i, j]
            if difference == 0:
                continue
            nearest_difference = rational[i, j] - F.from_float(float(rounded[i, j]))
            ulp = None
            if reference[i, j] != 0:
                ulp = abs(nearest_difference) / F.from_float(
                    math.ulp(float(rounded[i, j]))
                )
                max_ulp = max(max_ulp, ulp)
            else:
                zero_error = max(zero_error, abs(difference))
            rows.append(
                dict(
                    row=i,
                    column=j,
                    equation=equation(i),
                    reference=str(reference[i, j]),
                    saved_exact=str(rational[i, j]),
                    difference=str(difference),
                    nearest_float=float(rounded[i, j]),
                    ulps_from_nearest=str(ulp) if ulp is not None else None,
                )
            )
    return dict(
        entries_compared=58 * 58,
        nonzero_exact_differences=len(rows),
        unequal_to_correctly_rounded_entries=int(np.count_nonzero(saved != rounded)),
        max_ulps_from_nearest_nonzero=str(max_ulp),
        max_exact_zero_entry_error=str(zero_error),
        absolute_infinity_error=str(infnorm(rational - reference)),
        relative=float(infnorm(rational - reference) / max(F(1), infnorm(reference))),
        witnesses=rows,
    ), rational
