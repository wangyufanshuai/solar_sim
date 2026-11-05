"""Candidate exact full linear constraint transport on a fixed flat background.

The independent physical C(z) and source J supplement the previously checked
exact principal Kv. A degree-two subsidiary operator is derived by matching
ALL polynomial coefficients, not by fitting sampled frequencies/eigenvalues.
No production43 imports and no claimed nonlinear/zero-frequency inverse.
Execution/qualification requires its own authorized, owned control batch.
"""

from decimal import localcontext
from fractions import Fraction as F

import numpy as np

from scripts import nr_constraint_exact_coefficients as R
from scripts import nr_profile_exact_coefficients as Q


class PolynomialClosureError(ValueError):
    """Fail closed while retaining exact, explicitly unqualified diagnostics."""

    def __init__(self, evidence):
        super().__init__("full polynomial intertwining failed; no accepted degree2 subsidiary symbol")
        self.evidence = evidence


def source(background, *, guard=lambda: None):
    """Linearize the algebraic Eq12 sources at zero dynamical/auxiliary fields.

    Fixed profile: tau_inverse=1, kappa1=1/10, kappa2=0, eta=0, c=e=s=1,
    f=3 alpha chi. Only these existing choices are represented, not new knobs.
    """
    if not isinstance(background, Q.Background):
        raise ValueError("exact Background required")
    h, u, beta = background.metric, Q.inverse(background.metric), background.shift
    alpha, chi = background.alpha, background.chi
    answer = R.zeros(58, 58)
    for column in range(58):
        if column % 8 == 0:
            guard()
        q = [F(0)] * 58
        q[column] = F(1)
        pair = lambda i, j: Q.PAIR_INDEX[min(i, j), max(i, j)]
        b = lambda k, i: q[28 + 3 * k + i]
        d = lambda k, i, j: q[37 + 6 * k + pair(i, j)]
        trace = sum(u[i][j] * q[11 + pair(i, j)] for i in range(3) for j in range(3))
        determinant_variation = sum(u[i][j] * q[pair(i, j)] for i in range(3) for j in range(3))
        divergence = sum(b(k, k) for k in range(3))
        for index, (i, j) in enumerate(Q.PAIRS):
            answer[index, column] = (
                2 * sum(beta[k] * d(k, i, j) for k in range(3))
                + sum(h[k][i] * b(j, k) + h[k][j] * b(i, k) for k in range(3))
                - 2 * h[i][j] * divergence / 3
                - 2 * alpha * (q[11 + index] - h[i][j] * trace / 3)
                - h[i][j] * determinant_variation)
            answer[11 + index, column] = -h[i][j] * trace
        answer[6, column] = sum(beta[k] * q[25 + k] for k in range(3)) - 2 * q[17] + 4 * q[18]
        answer[10, column] = sum(beta[k] * q[55 + k] for k in range(3)) + (alpha * q[17] - divergence) / 3
        answer[17, column] = -3 * alpha * q[18] / 10
        answer[18, column] = -alpha * q[18] / 5
        connection_lower = [sum(u[j][ell] * (2 * d(j, i, ell) - d(i, j, ell))
                                for j in range(3) for ell in range(3)) for i in range(3)]
        for i in range(3):
            answer[7 + i, column] = sum(beta[k] * b(k, i) for k in range(3)) + 3 * alpha * chi * q[22 + i]
            contracted_connection = sum(u[i][j] * connection_lower[j] for j in range(3))
            answer[19 + i, column] = answer[22 + i, column] = -alpha * (q[19 + i] - contracted_connection) / 10
    return R.exact_array(answer)


def physical_coefficients(background, *, guard=lambda: None):
    """Physical constraint map C0+z*C1+z^2*C2 with spatial derivative z*v.

    Raw physical H/M/Z use true base-field derivatives. Definition defects,
    determinant and trace constraints remain independent, without projection.
    The real indeterminate z becomes i*rho/sqrt(v.v) only at comparison time.
    """
    if not isinstance(background, Q.Background):
        raise ValueError("exact Background required")
    h, u, v, chi = background.metric, Q.inverse(background.metric), background.ray, background.chi
    vu = [sum(u[i][j] * v[j] for j in range(3)) for i in range(3)]
    norm = sum(v[i] * vu[i] for i in range(3))
    c0, c1, c2 = (R.zeros(43, 58) for _ in range(3))
    for column in range(58):
        if column % 8 == 0:
            guard()
        q = [F(0)] * 58
        q[column] = F(1)
        pair = lambda i, j: Q.PAIR_INDEX[min(i, j), max(i, j)]
        dh = lambda i, j: q[pair(i, j)]
        a = lambda i, j: q[11 + pair(i, j)]
        det = sum(u[i][j] * dh(i, j) for i in range(3) for j in range(3))
        trace = sum(u[i][j] * a(i, j) for i in range(3) for j in range(3))
        c2[0, column] = chi * (sum(vu[i] * vu[j] * dh(i, j) for i in range(3) for j in range(3))
                                   - norm * det + 4 * norm * q[10])
        c0[4, column], c0[41, column], c0[42, column] = q[18], det, trace
        for i in range(3):
            c1[1 + i, column] = sum(vu[j] * a(j, i) for j in range(3)) - v[i] * (trace + 2 * q[17] / 3)
            c0[5 + i, column] = sum(h[i][j] * q[19 + j] for j in range(3)) / 2
            c1[5 + i, column] = -(sum(vu[j] * dh(i, j) for j in range(3)) - v[i] * det / 2) / 2
        for k in range(3):
            c0[8 + k, column], c1[8 + k, column] = q[25 + k], -v[k] * q[6]
            c0[38 + k, column], c1[38 + k, column] = q[55 + k], -v[k] * q[10]
            for i in range(3):
                c0[11 + 3 * k + i, column], c1[11 + 3 * k + i, column] = q[28 + 3 * k + i], -v[k] * q[7 + i]
            for index in range(6):
                c0[20 + 6 * k + index, column], c1[20 + 6 * k + index, column] = q[37 + 6 * k + index], -v[k] * q[index] / 2
    return tuple(R.exact_array(c) for c in (c0, c1, c2))


def polynomial_product(left, right, *, guard=lambda: None):
    if not left or not right:
        raise ValueError("nonempty coefficient sequences required")
    left, right = tuple(map(R.exact_array, left)), tuple(map(R.exact_array, right))
    if any(x.shape != left[0].shape for x in left) or any(x.shape != right[0].shape for x in right):
        raise ValueError("constant coefficient shapes required")
    result = [R.zeros(left[0].shape[0], right[0].shape[1]) for _ in range(len(left) + len(right) - 1)]
    for i, a in enumerate(left):
        for j, b in enumerate(right):
            result[i + j] += R.product(a, b, guard=guard)
    return tuple(result)


def coefficient_system(rows, generator, *, degree=2, guard=lambda: None):
    """Explicit convolution system for B(z) C(z) = C(z) L(z).

    The degree is fixed before qualification. Higher powers are not discarded:
    the RHS is zero-padded and every resulting coefficient must be verified.
    """
    if type(degree) is not int or degree != 2 or len(rows) != 3 or len(generator) != 2:
        raise ValueError("registered degree2 constraint map/subsidiary and degree1 generator required")
    c = tuple(map(R.exact_array, rows))
    g = tuple(map(R.exact_array, generator))
    m, n = c[0].shape
    if any(a.shape != (m, n) for a in c) or any(a.shape != (n, n) for a in g):
        raise ValueError("matching complete polynomial shapes required")
    operator = R.zeros(3 * m, 5 * n)
    target = R.zeros(m, 5 * n)
    for i in range(3):
        for j in range(3):
            operator[i * m:(i + 1) * m, (i + j) * n:(i + j + 1) * n] = c[j]
    for i, a in enumerate(polynomial_product(c, g, guard=guard)):
        target[:, i * n:(i + 1) * n] = a
    return operator, target


def derive(rows, generator, *, reverse=False, guard=lambda: None):
    operator, target = coefficient_system(rows, generator, guard=guard)
    section, pivots = R.right_inverse(operator, reverse=reverse, guard=guard)
    joined = R.product(target, section, guard=guard)
    residual = R.product(joined, operator, guard=guard) - target
    m = rows[0].shape[0]
    evidence = dict(coefficients=tuple(joined[:, i * m:(i + 1) * m].copy() for i in range(3)),
                    section=section, pivots=pivots, residual=residual,
                    operator=operator, target=target)
    if np.any(residual):
        raise PolynomialClosureError(evidence)
    return evidence


def zero_frequency(rows, subsidiary, source_matrix, *, guard=lambda: None):
    """Qualify only the physical39 image at zero; exhibit off-image ambiguity."""
    c0, b0, j = R.exact_array(rows[0]), R.exact_array(subsidiary[0]), R.exact_array(source_matrix)
    if c0.shape != (43, 58) or b0.shape != (43, 43) or j.shape != (58, 58) or np.any(c0[:4]):
        raise ValueError("physical43 zero map with four vanishing H/M rows required")
    reduced_map = c0[4:].copy()
    section, pivots = R.right_inverse(reduced_map, guard=guard)
    reduced = b0[4:, 4:].copy()
    residual = R.product(reduced, reduced_map, guard=guard) - R.product(reduced_map, j, guard=guard)
    if np.any(b0[:4, 4:]) or np.any(residual):
        raise ValueError("physical zero-frequency image is not invariant")
    ambiguity = R.zeros(43, 43)
    ambiguity[4, 0] = F(1)
    if np.any(R.product(ambiguity, c0, guard=guard)):
        raise ValueError("off-image ambiguity witness failed")
    return dict(rank=39, zero_rows=[0, 1, 2, 3], reduced_map=reduced_map,
                reduced_operator=reduced, section=section, pivots=pivots,
                residual=residual, off_image_ambiguity=ambiguity,
                full43_right_inverse_exists=False)


def frequency_value(coefficients, background, rho, *, precision=70):
    """Evaluate real/imaginary Decimal parts at z=i*rho/sqrt(v.v), including 0."""
    Q.precision_check(precision)
    rho = Q.rational(rho)
    if rho < 0 or rho > 8 or not coefficients or len(coefficients) > 3:
        raise ValueError("bounded nonnegative frequency and complete degree<=2 polynomial required")
    arrays = tuple(map(R.exact_array, coefficients))
    if any(a.shape != arrays[0].shape for a in arrays):
        raise ValueError("matching polynomial coefficient shapes required")
    with localcontext() as ctx:
        ctx.prec = precision
        r, frequency = Q.decimal(background.ray_squared), Q.decimal(rho)
        factors = (Q.decimal(F(1)), frequency / r.sqrt(), -(frequency * frequency) / r)
        real = np.full(arrays[0].shape, Q.decimal(F(0)), dtype=object)
        imaginary = real.copy()
        for power, a in enumerate(arrays):
            destination = imaginary if power == 1 else real
            for i, row in enumerate(a):
                for j, value in enumerate(row):
                    destination[i, j] += Q.decimal(value) * factors[power]
        return real, imaginary
