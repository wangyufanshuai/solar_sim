"""Independent rational leading constraint map and its unique principal quotient.

No production 43-symbol/reduction, stored candidate, eigensolver, tolerance,
finite difference or fitted speed enters construction. The 58-equation source
is explicitly shared with the separately audited exact reference. This is a
constant-background principal-part check, not nonlinear subsidiary closure.
See DERIVATION-20261013-case12-constraint-source.md for coordinates and scope.
"""

from decimal import localcontext
from fractions import Fraction as F

import numpy as np

from scripts import nr_profile_exact_coefficients as Q

SCALED_ROWS = (0, 1, 2, 3, 41)
GROUPS = ((8, 1), (11, 3), (20, 6), (38, 1))


def exact_array(value):
    a = np.asarray(value, dtype=object)
    if a.ndim != 2 or min(a.shape) == 0 or any(type(x) is not F for x in a.flat):
        raise ValueError("nonempty two-dimensional Fraction array required")
    return a


def zeros(rows, columns):
    return np.full((rows, columns), F(0), dtype=object)


def eye(size):
    result = zeros(size, size)
    for i in range(size):
        result[i, i] = F(1)
    return result


def product(left, right, *, guard=lambda: None):
    """Exact sparse multiplication; zero terms omitted by equality, never size."""
    a, b = exact_array(left), exact_array(right)
    if a.shape[1] != b.shape[0]:
        raise ValueError("matching matrix dimensions required")
    rows = [[(j, x) for j, x in enumerate(row) if x] for row in b]
    result = zeros(a.shape[0], b.shape[1])
    for i, row in enumerate(a):
        if i % 8 == 0:
            guard()
        for k, x in enumerate(row):
            if x:
                for j, y in rows[k]:
                    result[i, j] += x * y
    return result


def right_inverse(mapping, *, reverse=False, guard=lambda: None):
    """Full-row-rank exact elimination with a registered deterministic pivot rule.

    Never returns a least-squares solution. Non-pivot variables are exactly zero;
    reversing the column order provides a distinct section of the same quotient.
    """
    a = exact_array(mapping).copy()
    m, n = a.shape
    if m > n or type(reverse) is not bool:
        raise ValueError("wide full-row-rank map and explicit boolean pivot order required")
    change, pivots = eye(m), []
    for column in (range(n - 1, -1, -1) if reverse else range(n)):
        row = len(pivots)
        if row == m:
            break
        pivot = next((k for k in range(row, m) if a[k, column]), None)
        if pivot is None:
            continue
        guard()
        if pivot != row:
            a[[row, pivot]], change[[row, pivot]] = a[[pivot, row]], change[[pivot, row]]
        scale = a[row, column]
        a[row] /= scale
        change[row] /= scale
        for k in range(m):
            if k != row and a[k, column]:
                factor = a[k, column]
                a[k] -= factor * a[row]
                change[k] -= factor * change[row]
        pivots.append(column)
    if len(pivots) != m:
        raise ValueError("constraint map is not full row rank")
    section = zeros(n, m)
    for row, column in enumerate(pivots):
        section[column] = change[row]
    if not np.array_equal(product(mapping, section, guard=guard), eye(m)):
        raise ValueError("exact right-inverse identity failed")
    return section, pivots


def quotient(mapping, main, *, reverse=False, guard=lambda: None):
    """Construct then verify closure on ALL state columns, including the kernel."""
    d, a = exact_array(mapping), exact_array(main)
    if a.shape != (d.shape[1], d.shape[1]):
        raise ValueError("square main operator matching the constraint map required")
    section, pivots = right_inverse(d, reverse=reverse, guard=guard)
    transport = product(d, a, guard=guard)
    candidate = product(transport, section, guard=guard)
    residual = product(candidate, d, guard=guard) - transport
    if np.any(residual):
        raise ValueError("constraint kernel is not invariant; no principal quotient")
    return candidate, section, pivots


def leading(background, *, guard=lambda: None):
    """Return Dhat=S43 D0 B58 directly from physical constraint definitions.

    S43 multiplies H, M and compensated determinant by s=sqrt(v.v); B58
    multiplies the eleven base-state coordinates by s. Every output is rational.
    Auxiliary transverse defects are retained, with derivative index first.
    """
    if not isinstance(background, Q.Background):
        raise ValueError("exact reference Background required")
    h, u, v = background.metric, Q.inverse(background.metric), background.ray
    vu = [sum(u[i][j] * v[j] for j in range(3)) for i in range(3)]
    pt = [[F(i == j) - v[i] * v[j] / background.ray_squared for j in range(3)] for i in range(3)]

    def column(q):
        pair = lambda i, j: Q.PAIR_INDEX[min(i, j), max(i, j)]
        a = lambda i, j: q[11 + pair(i, j)]
        d = lambda k, i, j: q[37 + 6 * k + pair(i, j)]
        trace = sum(u[i][j] * a(i, j) for i in range(3) for j in range(3))
        out = [F(0)] * 43
        out[0] = background.chi * (
            2 * sum(vu[ell] * u[i][j] * (d(i, ell, j) - d(ell, i, j))
                    for ell in range(3) for i in range(3) for j in range(3))
            + 4 * sum(vu[k] * q[55 + k] for k in range(3)))
        for i in range(3):
            out[1 + i] = sum(vu[j] * a(j, i) for j in range(3)) - v[i] * (trace + 2 * q[17] / 3)
            connection = sum(u[j][ell] * (2 * d(j, i, ell) - d(i, j, ell))
                             for j in range(3) for ell in range(3))
            out[5 + i] = (sum(h[i][j] * q[19 + j] for j in range(3)) - connection) / 2
        out[4], out[42] = q[18], trace
        for k in range(3):
            out[8 + k] = sum(pt[k][ell] * q[25 + ell] for ell in range(3)) - v[k] * q[6]
            out[38 + k] = sum(pt[k][ell] * q[55 + ell] for ell in range(3)) - v[k] * q[10]
            for i in range(3):
                out[11 + 3 * k + i] = sum(pt[k][ell] * q[28 + 3 * ell + i] for ell in range(3)) - v[k] * q[7 + i]
            for index, (i, j) in enumerate(Q.PAIRS):
                out[20 + 6 * k + index] = sum(pt[k][ell] * d(ell, i, j) for ell in range(3)) - v[k] * q[index] / 2
        out[41] = 2 * sum(v[k] * u[i][j] * d(k, i, j) for k in range(3) for i in range(3) for j in range(3))
        return out

    result = zeros(43, 58)
    for j in range(58):
        if j % 8 == 0:
            guard()
        q = [F(0)] * 58
        q[j] = F(1)
        result[:, j] = column(q)
    return exact_array(result)


def ode_projector(background):
    result = zeros(43, 43)
    for start, width in GROUPS:
        for k in range(3):
            for ell in range(3):
                for j in range(width):
                    result[start + width * k + j, start + width * ell + j] = (
                        background.ray[k] * background.ray[ell] / background.ray_squared)
    return result


def intrinsic(principal, background):
    a = exact_array(principal)
    if a.shape != (43, 43):
        raise ValueError("complete43 principal source required")
    return a - background.shift_ray * (eye(43) - ode_projector(background))


def normalized(matrix, background, *, kind, precision=70):
    """Explicitly undo rational similarity/scaling without changing saved inputs."""
    Q.precision_check(precision)
    a = exact_array(matrix)
    if kind not in ("principal", "leading", "ode") or a.shape != (43, 58 if kind == "leading" else 43):
        raise ValueError("registered complete43 coefficient kind and shape required")
    with localcontext() as ctx:
        ctx.prec = precision
        r = Q.decimal(background.ray_squared)
        factors = {0: Q.decimal(F(1)), -1: 1 / r.sqrt(), -2: 1 / r}
        result = np.empty(a.shape, dtype=object)
        for i, row in enumerate(a):
            for j, x in enumerate(row):
                if kind == "principal":
                    exponent = int(j in SCALED_ROWS) - int(i in SCALED_ROWS) - 1
                elif kind == "leading":
                    exponent = -int(i in SCALED_ROWS) - int(j < 11)
                else:
                    exponent = 0
                result[i, j] = Q.decimal(x) * factors[exponent]
        return result
