"""Exact constant-background FO-CCZ4 reference for the default gauge profile.

This module does not import a production RHS, geometry, symbol or reduction.
Only the 58/47 principal part is covered; the 43-constraint reduction is not.
The unnormalised rational ray keeps coefficient arithmetic exact. Conversion
to the registered Euclidean unit normal is explicit and uses Decimal.
"""

from dataclasses import dataclass
from decimal import Decimal, localcontext
from fractions import Fraction as F

import numpy as np

PAIRS = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))
PAIR_INDEX = {p: i for i, p in enumerate(PAIRS)}
BRANCHES = ("ordering-T", "ordering-L", "light", "lapse", "shift-T", "shift-L")


def rational(value):
    if type(value) not in (int, F):
        raise ValueError("explicit int/Fraction required; floats are not design data")
    return F(value)


def determinant(a):
    return (a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1])
            - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0])
            + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]))


def inverse(a):
    """Exact adjugate, independent of the solver's floating-point inverse."""
    det = determinant(a)
    if det == 0:
        raise ValueError("invertible metric required")
    answer = []
    for i in range(3):
        row = []
        for j in range(3):
            rows = [k for k in range(3) if k != j]
            cols = [k for k in range(3) if k != i]
            minor = a[rows[0]][cols[0]] * a[rows[1]][cols[1]] - a[rows[0]][cols[1]] * a[rows[1]][cols[0]]
            row.append((-1) ** (i + j) * minor / det)
        answer.append(tuple(row))
    return tuple(answer)


@dataclass(frozen=True)
class Background:
    alpha: F
    chi: F
    metric: tuple
    shift: tuple
    ray: tuple

    def __post_init__(self):
        alpha, chi = rational(self.alpha), rational(self.chi)
        if not F(0) < alpha < F(2) or chi <= 0:
            raise ValueError("default noncolliding profile requires 0<alpha<2, chi>0")
        if len(self.metric) != 3 or any(len(row) != 3 for row in self.metric):
            raise ValueError("3 by 3 metric required")
        h = tuple(tuple(rational(x) for x in row) for row in self.metric)
        if any(h[i][j] != h[j][i] for i in range(3) for j in range(3)):
            raise ValueError("symmetric metric required")
        if h[0][0] <= 0 or h[0][0] * h[1][1] - h[0][1] ** 2 <= 0 or determinant(h) != 1:
            raise ValueError("positive definite unit-determinant metric required")
        if len(self.shift) != 3 or len(self.ray) != 3:
            raise ValueError("three-component shift and ray required")
        shift, ray = tuple(map(rational, self.shift)), tuple(map(rational, self.ray))
        if not any(ray):
            raise ValueError("nonzero coordinate ray required")
        for key, value in dict(alpha=alpha, chi=chi, metric=h, shift=shift, ray=ray).items():
            object.__setattr__(self, key, value)

    @property
    def ray_squared(self):
        return sum(x * x for x in self.ray)

    @property
    def shift_ray(self):
        return sum(b * n for b, n in zip(self.shift, self.ray, strict=True))

    @property
    def metric_normal_squared(self):
        u = inverse(self.metric)
        return sum(self.ray[i] * u[i][j] * self.ray[j] for i in range(3) for j in range(3)) / self.ray_squared

    def squared_speeds(self):
        a, c, g = self.alpha, self.chi, self.metric_normal_squared
        f, mu = 3 * a * c, c / 5
        return (a * a * mu * g / 4, a * a * mu * g / 2,
                a * a * c * g, 2 * a * c * g, f * g, 4 * f * g / 3)

    def passport(self):
        return dict(alpha=str(self.alpha), chi=str(self.chi),
                    metric=[[str(x) for x in row] for row in self.metric],
                    inverse=[[str(x) for x in row] for row in inverse(self.metric)],
                    shift=list(map(str, self.shift)), ray=list(map(str, self.ray)),
                    ray_squared=str(self.ray_squared), shift_ray=str(self.shift_ray),
                    metric_normal_squared=str(self.metric_normal_squared),
                    f=str(3 * self.alpha * self.chi), mu=str(self.chi / 5),
                    squared_speeds=dict(zip(BRANCHES, map(str, self.squared_speeds()), strict=True)),
                    coordinate_normal="ray/sqrt(ray_squared)",
                    convention="q_t=A(n) partial_n(q)+S; physical speeds have opposite sign",
                    scope="constant background/default profile; not arbitrary gauge or curved evolution")


def case12():
    lower = ((F(1), F(0), F(0)), (F(3, 25), F(1), F(0)), (F(-2, 25), F(3, 50), F(1)))
    h = tuple(tuple(sum(lower[i][k] * lower[j][k] for k in range(3)) for j in range(3)) for i in range(3))
    return Background(F(17, 20), F(18, 25), h, (F(3, 100), F(-1, 25), F(1, 20)), (F(1), F(2), F(-1)))


def decimal(value):
    return Decimal(value.numerator) / Decimal(value.denominator)


def precision_check(precision):
    if type(precision) is not int or precision not in (50, 70):
        raise ValueError("precision50/70 required")


def nodes(background, *, precision=70):
    precision_check(precision)
    with localcontext() as ctx:
        ctx.prec = precision
        positive = tuple(decimal(s).sqrt() for s in background.squared_speeds())
        return tuple(x.copy_negate() for x in reversed(positive)) + (Decimal(0),) + positive


def normalized(matrix, background, *, precision=70):
    """Return Decimal coefficients of the ideal design, never substitute inputs."""
    precision_check(precision)
    with localcontext() as ctx:
        ctx.prec = precision
        scale = decimal(background.ray_squared).sqrt()
        return np.array([[decimal(x) / scale for x in row] for row in matrix], dtype=object)


def principal_rates(q, background, *, geometric=False):
    if len(q) != 58 or any(type(x) is not F for x in q):
        raise ValueError("58 explicit Fraction derivative slots required")
    h, u, v = background.metric, inverse(background.metric), background.ray
    alpha, chi, beta = background.alpha, background.chi, background.shift_ray

    def pair(i, j):
        return PAIR_INDEX[min(i, j), max(i, j)]

    def a(i, j):
        return q[11 + pair(i, j)]

    def b(k, i):
        return q[28 + 3 * k + i]

    def d(k, i, j):
        return q[37 + 6 * k + pair(i, j)]

    def hb(s, t, i, j):
        return v[s] * d(t, i, j) + v[t] * d(s, i, j)

    def hg(s, t, i, j):
        return hb(s, t, i, j) - h[i][j] * (v[s] * q[55 + t] + v[t] * q[55 + s])

    def contracted(s, i):
        return sum(u[j][ell] * (hb(s, j, i, ell) - hb(s, i, j, ell) / 2) for j in range(3) for ell in range(3))

    def rz(i, j):
        gamma = sum(h[j][ell] * v[i] * q[19 + ell] + h[i][ell] * v[j] * q[19 + ell] for ell in range(3)) / 2
        if geometric:
            ricci = sum(u[k][ell] * (hg(k, i, ell, j) + hg(k, j, ell, i) - hg(k, ell, i, j) - hg(i, j, k, ell))
                        for k in range(3) for ell in range(3)) / 2
            return ricci + gamma - (contracted(i, j) + contracted(j, i)) / 2
        return (-sum(u[k][ell] * v[k] * d(ell, i, j) for k in range(3) for ell in range(3))
                + (v[i] * q[55 + j] + v[j] * q[55 + i]) / 2
                + h[i][j] * sum(u[k][ell] * v[k] * q[55 + ell] for k in range(3) for ell in range(3)) + gamma)

    x = [[rz(i, j) for j in range(3)] for i in range(3)]
    y = [[x[i][j] - (v[i] * q[25 + j] + v[j] * q[25 + i]) / 2 for j in range(3)] for i in range(3)]
    trace_y = sum(u[i][j] * y[i][j] for i in range(3) for j in range(3))
    trace_a = sum(u[i][j] * a(i, j) for i in range(3) for j in range(3))

    def sb(k, ell, i):
        return (v[k] * b(ell, i) + v[ell] * b(k, i)) / 2

    trace_b = [sum(sb(k, ell, ell) for ell in range(3)) for k in range(3)]
    out = [F(0)] * 58
    for index, (i, j) in enumerate(PAIRS):
        out[11 + index] = alpha * chi * (y[i][j] - h[i][j] * trace_y / 3)
    out[17] = alpha * chi * trace_y
    out[18] = alpha * chi * sum(u[i][j] * x[i][j] for i in range(3) for j in range(3)) / 2
    for i in range(3):
        rate = (alpha * sum(u[i][k] * v[k] for k in range(3)) * (-F(4, 3) * q[17] + 2 * q[18] + 2 * trace_a)
                + sum(u[k][ell] * sb(k, ell, i) for k in range(3) for ell in range(3))
                + sum(u[i][k] * trace_b[k] for k in range(3)) / 3)
        out[19 + i] = out[22 + i] = rate
    for k in range(3):
        out[25 + k] = -2 * v[k] * (q[17] - 2 * q[18] + trace_a)
        out[55 + k] = alpha * v[k] * (q[17] + trace_a) / 3 - trace_b[k] / 3
        for i in range(3):
            curl = sum(u[i][j] * (v[k] * q[55 + j] - v[j] * q[55 + k]
                       - sum(u[a_index][ell] * (v[k] * d(ell, j, a_index) - v[ell] * d(k, j, a_index))
                             for a_index in range(3) for ell in range(3))) for j in range(3))
            out[28 + 3 * k + i] = 3 * alpha * chi * v[k] * q[22 + i] + alpha ** 2 * chi * curl / 5
        for index, (i, j) in enumerate(PAIRS):
            out[37 + 6 * k + index] = (sum(h[ell][i] * sb(k, j, ell) + h[ell][j] * sb(k, i, ell) for ell in range(3)) / 2
                - h[i][j] * trace_b[k] / 3 + alpha * v[k] * (-a(i, j) + h[i][j] * trace_a / 3))
    for i in range(11, 58):
        out[i] += beta * q[i]
    return out


def matrix(background, *, geometric=False, guard=lambda: None):
    columns = []
    for column in range(58):
        guard()
        q = [F(0)] * 58
        q[column] = F(1)
        columns.append(principal_rates(q, background, geometric=geometric))
    return np.array(columns, dtype=object).T


def intrinsic(matrix, background):
    result = matrix.copy()
    for i in range(11, 58):
        result[i, i] -= background.shift_ray
    return result


def annihilator(matrix, squared, *, guard=lambda: None):
    """Exact square-free polynomial witness, not a floating eigensolver."""
    def sparse(a):
        return [{j: x for j, x in enumerate(row) if x} for row in a]

    def product(a, b):
        answer = []
        for row in a:
            values = {}
            for k, x in row.items():
                for j, y in b[k].items():
                    values[j] = values.get(j, F(0)) + x * y
            answer.append({j: x for j, x in values.items() if x})
        return answer

    k = sparse(matrix)
    square, value = product(k, k), k
    for s in squared:
        guard()
        factor = [dict(row) for row in square]
        for i, row in enumerate(factor):
            row[i] = row.get(i, F(0)) - s
        value = product(value, factor)
    out = np.full(matrix.shape, F(0), dtype=object)
    for i, row in enumerate(value):
        for j, x in row.items():
            out[i, j] = x
    return out


def encode(matrix):
    return dict(shape=list(matrix.shape), representation="sparse-exact-rational-zero-fill",
                entries=[[i, j, str(x.numerator), str(x.denominator)]
                         for i, row in enumerate(matrix) for j, x in enumerate(row) if x])


def compare(saved, reference):
    """70-digit entry witnesses and max-row-sum error; keep ideal/input distinct."""
    if saved.shape != reference.shape or not np.isfinite(saved).all():
        raise ValueError("finite matching coefficient arrays required")
    with localcontext() as ctx:
        ctx.prec = 70
        actual = np.array([[Decimal.from_float(float(x)) for x in row] for row in saved], dtype=object)
        differences = actual - reference
        norm = lambda a: max(sum(abs(x) for x in row) for row in a)
        relative = norm(differences) / max(Decimal(1), norm(reference))
        witnesses = [dict(row=i, column=j, actual_binary64_exact=str(actual[i, j]),
                          design_decimal=str(reference[i, j]), difference=str(x))
                     for i, row in enumerate(differences) for j, x in enumerate(row) if x]
        rounded = np.asarray(reference, dtype=float)
        return dict(entries_compared=int(saved.size), relative=float(relative),
                    decimal_relative=str(relative), max_absolute=float(max(abs(x) for x in differences.flat)),
                    unequal_to_rounded_design=int(np.count_nonzero(saved != rounded)),
                    witnesses=witnesses, input_substituted=False, coefficient_fitting=False)
