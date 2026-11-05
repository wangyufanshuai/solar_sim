"""Unqualified exact case12 reduction/energy candidate; no evolution or I/O.

All construction uses rational equation coefficients, never a fitted spectrum.
The high-frequency energy is in derivative-weighted coordinates. Low frequency
uses the original physical polynomial, not a Laurent inverse at zero. Execution
requires a separately authorized owned control batch. See the paired derivation.
"""

from decimal import localcontext
from fractions import Fraction as F

import numpy as np

from scripts import nr_constraint_exact_coefficients as R
from scripts import nr_profile_exact_coefficients as Q


class ExactIdentityError(ValueError):
    """Preserve the complete failed coefficient relation, without repair."""

    def __init__(self, name, residual):
        super().__init__("exact identity failed: " + name)
        self.name, self.residual = name, residual


def coefficients(value):
    if not isinstance(value, dict) or not value or any(type(k) is not int for k in value):
        raise ValueError("nonempty integer-power coefficient dictionary required")
    result = {k: R.exact_array(a) for k, a in value.items()}
    if any(a.shape != next(iter(result.values())).shape for a in result.values()):
        raise ValueError("one coefficient shape required")
    return result


def product(left, right, *, guard=lambda: None):
    a, b = coefficients(left), coefficients(right)
    shape = (next(iter(a.values())).shape[0], next(iter(b.values())).shape[1])
    result = {}
    for i, x in a.items():
        for j, y in b.items():
            result.setdefault(i + j, R.zeros(*shape))
            result[i + j] += R.product(x, y, guard=guard)
    return result  # Keep even exactly zero coefficients for the audit.


def identity(name, actual, expected, *, sink=lambda name, values: None):
    a, b = coefficients(actual), coefficients(expected)
    shape = next(iter(a.values())).shape
    if shape != next(iter(b.values())).shape:
        raise ValueError("identity shapes differ")
    residual = {p: a.get(p, R.zeros(*shape)) - b.get(p, R.zeros(*shape)) for p in sorted(a.keys() | b.keys())}
    sink(name, residual)  # Persist before asserting, including the failed relation.
    if any(np.any(x) for x in residual.values()):
        raise ExactIdentityError(name, residual)
    return residual


def factors(background):
    """Wv, Wv^-1 at derivative z*v, without sqrt(v.v) in the coefficients."""
    if not isinstance(background, Q.Background):
        raise ValueError("exact Background required")
    v, r, u = background.ray, background.ray_squared, Q.inverse(background.metric)
    parallel = R.ode_projector(background)
    auxiliary = R.zeros(43, 43)
    for start, width in R.GROUPS:
        auxiliary[start:start + 3 * width, start:start + 3 * width] = R.eye(3 * width)
    high, low = parallel.copy(), R.zeros(43, 43)
    high[:4, :4], low[41, 41] = R.eye(4), F(1)
    common = auxiliary - parallel
    common[4:8, 4:8], common[42, 42] = R.eye(4), F(1)
    trace = R.zeros(43, 43)
    for k in range(3):
        for p, (i, j) in enumerate(Q.PAIRS):
            trace[41, 20 + 6 * k + p] = 2 * v[k] * u[i][j] * (1 if i == j else 2)
    return {-1: high, 0: common + trace, 1: r * low}, {-1: low / r, 0: common - trace / r, 1: high}


def bridge(background, *, guard=lambda: None):
    """Physical-to-formal H/Z correction from the definition defects themselves."""
    if not isinstance(background, Q.Background):
        raise ValueError("exact Background required")
    u, v, chi = Q.inverse(background.metric), background.ray, background.chi
    vu = [sum(u[i][j] * v[j] for j in range(3)) for i in range(3)]
    z0, z1 = R.zeros(43, 43), R.zeros(43, 43)
    for column in range(43):
        if column % 8 == 0:
            guard()
        q = [F(0)] * 43
        q[column] = F(1)
        pair = lambda i, j: Q.PAIR_INDEX[min(i, j), max(i, j)]
        d = lambda k, i, j: q[20 + 6 * k + pair(i, j)]
        for i in range(3):
            z0[5 + i, column] = -sum(u[j][ell] * (2 * d(j, i, ell) - d(i, j, ell))
                                      for j in range(3) for ell in range(3)) / 2
        z1[0, column] = chi * (
            2 * sum(vu[ell] * u[i][j] * (d(i, ell, j) - d(ell, i, j))
                    for ell in range(3) for i in range(3) for j in range(3))
            + 4 * sum(vu[k] * q[38 + k] for k in range(3)))
    return {0: R.eye(43) + z0, 1: z1}, {0: R.eye(43) - z0, 1: -z1}


def reduction(background, physical, subsidiary, main, *, guard=lambda: None, sink=lambda name, values: None):
    """Check both inverse directions and EVERY transformed coefficient exactly."""
    physical, subsidiary = coefficients(physical), coefficients(subsidiary)
    if set(physical) != {0, 1, 2} or set(subsidiary) != {0, 1, 2}:
        raise ValueError("complete degree-two physical/subsidiary polynomials required")
    if any(a.shape != (43, 58) for a in physical.values()) or any(a.shape != (43, 43) for a in subsidiary.values()):
        raise ValueError("physical43-by58 and subsidiary43 shapes required")
    mul = lambda a, b: product(a, b, guard=guard)
    check = lambda name, a, b: identity(name, a, b, sink=sink)
    w, wi = factors(background)
    u, ui = bridge(background, guard=guard)
    for name, a, b in (("weight-forward", w, wi), ("weight-reverse", wi, w),
                       ("bridge-forward", u, ui), ("bridge-reverse", ui, u)):
        check(name, mul(a, b), {0: R.eye(43)})
    t, ti = mul(w, u), mul(ui, wi)
    check("transform-forward", mul(t, ti), {0: R.eye(43)})
    check("transform-reverse", mul(ti, t), {0: R.eye(43)})
    rows, symbol = mul(t, physical), mul(mul(t, subsidiary), ti)
    sink("transformed-rows", rows)
    sink("transformed-symbol", symbol)
    check("rows-positive-powers", {p: a for p, a in rows.items() if p > 0}, {0: R.zeros(43, 58)})
    check("symbol-above-first-order", {p: a for p, a in symbol.items() if p > 1}, {0: R.zeros(43, 43)})
    leading = R.leading(background, guard=guard)
    principal, section, pivots = R.quotient(leading, main, guard=guard)
    check("leading-map", {0: rows[0]}, {0: leading})
    check("principal-quotient", {0: symbol[1]}, {0: principal})
    return dict(forward=t, inverse=ti, rows=rows, symbol=symbol, principal=principal,
                leading=leading, section=section, pivots=pivots)


def paired_energy(intrinsic, ode, squared, diagonal, *, guard=lambda: None, sink=lambda name, values: None):
    """Rational paired spectral projectors and a weighted Gram coercivity proof.

    E_s = product_{t!=s}(K^2-t P)/(s-t) on range(P), including t=0.
    E_+^T G E_+ + E_-^T G E_- = (E_s^T G E_s + (K E_s)^T G (K E_s)/s)/2.
    No square roots, eigenvectors, Decimal or tolerances enter this construction.
    """
    k, o = R.exact_array(intrinsic), R.exact_array(ode)
    n = len(k)
    if k.shape != (n, n) or o.shape != k.shape:
        raise ValueError("matching exact square intrinsic and ODE matrices required")
    squared, diagonal = tuple(map(Q.rational, squared)), tuple(map(Q.rational, diagonal))
    if not squared or len(set(squared)) != len(squared) or any(s <= 0 for s in squared):
        raise ValueError("distinct positive prescribed squared speeds required")
    if len(diagonal) != n or any(d <= 0 for d in diagonal):
        raise ValueError("positive exact diagonal Gram metric required")
    eye, zero = R.eye(n), R.zeros(n, n)
    p, g = eye - o, R.zeros(n, n)
    for i, d in enumerate(diagonal):
        g[i, i] = d
    mul = lambda a, b: R.product(a, b, guard=guard)
    check = lambda name, a, b: identity(name, {0: a}, {0: b}, sink=sink)
    gram = lambda a, b: mul(a.T, mul(g, b))
    check("ode-idempotence", mul(o, o), o)
    check("intrinsic-left-ode", mul(k, o), zero)
    check("intrinsic-right-ode", mul(o, k), zero)
    square, pairs = mul(k, k), []
    for s in squared:
        e = p.copy()
        for t in (F(0), *squared):
            if t != s:
                e = mul(e, (square - t * p) / (s - t))
        pairs.append(e)
    e0 = p - sum(pairs, zero.copy())
    components = (o, e0, *pairs)
    for i, e in enumerate(components):
        for j, f in enumerate(components):
            check(f"projector-{i}-{j}", mul(e, f), e if i == j else zero)
    check("zero-speed-action", mul(k, e0), zero)
    actions = []
    for i, (s, e) in enumerate(zip(squared, pairs, strict=True)):
        check(f"paired-speed-{i}", mul(square, e), s * e)
        actions.append(mul(k, e))
    weights = (F(1), F(1), *(F(1, 2) for _ in pairs))
    denominator = sum(1 / a for a in weights)  # 14 for the six registered pairs.
    energy = sum((a * gram(e, e) for a, e in zip(weights, components, strict=True)), zero.copy())
    coercivity = R.zeros(n, n)
    for a, e in zip(weights, components, strict=True):
        difference = e - eye / (denominator * a)
        coercivity += a * gram(difference, difference)
    for s, action in zip(squared, actions, strict=True):
        term = gram(action, action) / (2 * s)
        energy += term
        coercivity += term
    check("energy-symmetry", energy, energy.T)
    check("energy-intrinsic-symmetrization", mul(energy, k), mul(k.T, energy))
    check("energy-pde-symmetrization", mul(energy, p), mul(p.T, energy))
    check("energy-gram-coercivity", energy - g / denominator, coercivity)
    return dict(energy=energy, metric=g, zero=e0, pairs=tuple(pairs), actions=tuple(actions),
                coercivity=coercivity, denominator=denominator, lower_scalar=min(diagonal) / denominator,
                squared=squared)


def entry_bound(matrix):
    """Rational entry-l1 upper bound for the spectral norm, not an eigenvalue."""
    return sum((abs(x) for x in R.exact_array(matrix).flat), F(0))


def growth_bounds(physical_symbol, reduced_symbol, energy, lower_scalar, background, *, cutoff=F(1, 2)):
    """Conservative fixed-ray bounds; not damping, sharpness or general stability.

    Requires the caller's exact symmetry/coercivity and polynomial-closure gates.
    The caller must not qualify these numbers in isolation from those witnesses.
    """
    b, a = coefficients(physical_symbol), coefficients(reduced_symbol)
    lower_scalar, cutoff = Q.rational(lower_scalar), Q.rational(cutoff)
    if background != Q.case12() or cutoff != F(1, 2) or lower_scalar <= 0:
        raise ValueError("fixed case12 cutoff and proved positive energy lower bound required")
    if set(b) != {0, 1, 2} or 1 not in a or any(np.any(x) for p, x in a.items() if p > 1):
        raise ValueError("complete polynomial and exactly first-order reduced high part required")
    if any(x.shape != (43, 43) for x in (*b.values(), *a.values())) or R.exact_array(energy).shape != (43, 43):
        raise ValueError("full43 symbols and energy required")
    if not F(2) ** 2 <= background.ray_squared <= F(3) ** 2:
        raise ValueError("registered rational sqrt enclosure failed")
    low_terms = {p: entry_bound(x) * (cutoff / 2) ** p for p, x in b.items()}
    high_terms = {p: entry_bound(x) * (3 / cutoff) ** (-p) for p, x in a.items() if p <= 0}
    low = 2 * sum(low_terms.values(), F(0))
    high = 2 * entry_bound(energy) * sum(high_terms.values(), F(0)) / lower_scalar
    zero = 2 * entry_bound(b[0][4:, 4:])
    return dict(cutoff=cutoff, low=low, high=high, zero=zero, combined=max(low, high),
                low_terms=low_terms, high_terms=high_terms, sqrt_lower=F(2), sqrt_upper=F(3),
                energy_norm_upper=entry_bound(energy), energy_lower=lower_scalar)


def evaluate(value, background, rho, *, precision=70):
    """Registered Decimal real/imaginary comparison; NEVER Laurent evaluation at0."""
    Q.precision_check(precision)
    rho, terms = Q.rational(rho), coefficients(value)
    if rho < 0 or rho > 8 or (rho == 0 and min(terms) < 0):
        raise ValueError("bounded frequency; Laurent inverse not defined at zero")
    with localcontext() as ctx:
        ctx.prec = precision
        frequency = Q.decimal(rho) / Q.decimal(background.ray_squared).sqrt()
        shape = next(iter(terms.values())).shape
        real = np.full(shape, Q.decimal(F(0)), dtype=object)
        imaginary = real.copy()
        for p, a in terms.items():
            phase, magnitude = p % 4, frequency ** p if p else Q.decimal(F(1))
            destination = imaginary if phase % 2 else real
            factor = -magnitude if phase >= 2 else magnitude
            for index in np.ndindex(shape):
                destination[index] += factor * Q.decimal(a[index])
        return real, imaginary


def normal_coordinates(matrix, background, *, kind, precision=70):
    """Undo S43 for projectors, or pull back the energy by S43; no input repair."""
    Q.precision_check(precision)
    a = R.exact_array(matrix)
    if a.shape != (43, 43) or kind not in ("operator", "energy"):
        raise ValueError("full43 operator or energy conversion required")
    with localcontext() as ctx:
        ctx.prec = precision
        s = Q.decimal(background.ray_squared).sqrt()
        factors = {-1: 1 / s, 0: Q.decimal(F(1)), 1: s, 2: Q.decimal(background.ray_squared)}
        result = np.empty(a.shape, dtype=object)
        for i, j in np.ndindex(a.shape):
            degree = int(j in R.SCALED_ROWS) + (1 if kind == "energy" else -1) * int(i in R.SCALED_ROWS)
            result[i, j] = Q.decimal(a[i, j]) * factors[degree]
        return result


def decode(value):
    """Strict canonical sparse-rational reader; duplicated/zero entries fail."""
    if not isinstance(value, dict) or set(value) != {"shape", "representation", "entries"}:
        raise ValueError("exact matrix schema required")
    shape = value["shape"]
    if (value["representation"] != "sparse-exact-rational-zero-fill" or not isinstance(shape, list)
            or len(shape) != 2 or any(type(x) is not int or x <= 0 or x > 300 for x in shape)
            or not isinstance(value["entries"], list)):
        raise ValueError("bounded exact matrix shape and representation required")
    result, seen = R.zeros(*shape), set()
    for row in value["entries"]:
        if not isinstance(row, list) or len(row) != 4:
            raise ValueError("four-field sparse entry required")
        i, j, n, d = row
        if (type(i) is not int or type(j) is not int or not 0 <= i < shape[0] or not 0 <= j < shape[1]
                or (i, j) in seen or type(n) is not str or type(d) is not str):
            raise ValueError("unique bounded sparse coordinate and rational strings required")
        try:
            fraction = F(int(n), int(d))
        except (ValueError, ZeroDivisionError) as error:
            raise ValueError("valid rational required") from error
        if fraction == 0 or [str(fraction.numerator), str(fraction.denominator)] != [n, d]:
            raise ValueError("canonical nonzero rational required")
        result[i, j] = fraction
        seen.add((i, j))
    return result
