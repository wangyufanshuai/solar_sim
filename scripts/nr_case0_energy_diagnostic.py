"""Saved-input arithmetic diagnostics; never imported by a physics solver."""

from __future__ import annotations

from decimal import Decimal as D, localcontext

import numpy as np


TOLERANCE = 2e-12
ARITHMETIC_CONTROL = D("1e-50")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def exact(value):
    """Exact binary64 conversion; no decimal-string rounding of inputs."""
    return np.vectorize(lambda v: D.from_float(float(v)), otypes=[object])(value)


def identity(n):
    return exact(np.eye(n))


def infnorm(a):
    return max(sum(abs(v) for v in row) for row in a)


def relative(actual, expected):
    return infnorm(actual - expected) / max(D(1), infnorm(expected))


def stack_difference(a, b):
    return max(relative(x, y) for x, y in zip(a, b, strict=True))


def decimal_strings(a):
    return np.vectorize(str, otypes=[object])(a).tolist()


def symmetric_roots(positive):
    return np.array([-a for a in positive[::-1]] + [D(0)] + list(positive))


def paired(k, positive, *, style, squared=None):
    """Two evaluation orders of the frozen paired-projector polynomial."""
    require(style in ("expanded", "factored"), "registered evaluation order")
    squared = [a * a for a in positive] if squared is None else list(squared)
    p, square = identity(len(k)), k @ k
    result, zero = [None] * 13, p.copy()
    powers = [p]
    if style == "expanded":
        for _ in range(6):
            powers.append(square @ powers[-1])
    for i, a in enumerate(positive):
        if style == "expanded":
            coefficients, denominator = [D(0), D(1)], squared[i]
            for j, b2 in enumerate(squared):
                if i == j:
                    continue
                updated = [D(0)] * (len(coefficients) + 1)
                for degree, value in enumerate(coefficients):
                    updated[degree] -= b2 * value
                    updated[degree + 1] += value
                coefficients = updated
                denominator *= squared[i] - b2
            projection = sum(
                (c / denominator) * powers[j] for j, c in enumerate(coefficients)
            )
        else:
            projection = square / squared[i]
            for j, b2 in enumerate(squared):
                if j != i:
                    projection = projection @ ((square - b2 * p) / (squared[i] - b2))
        signed = (k @ projection) / a
        result[7 + i], result[5 - i] = (
            (projection + signed) / 2,
            (projection - signed) / 2,
        )
        zero -= projection
    result[6] = zero
    return np.array(result, dtype=object)


def lagrange(k, roots):
    """Direct degree-12 representation, not a fitted eigendecomposition."""
    p, result = identity(len(k)), []
    for i, a in enumerate(roots):
        projection = p.copy()
        for j, b in enumerate(roots):
            if j != i:
                projection = projection @ ((k - b * p) / (a - b))
        result.append(projection)
    return np.array(result, dtype=object)


def witness(actual, expected, projections, *, state_offset):
    residual = actual - expected
    rows = [sum(abs(x) for x in row) for row in residual]
    row = max(range(len(rows)), key=rows.__getitem__)
    col = max(range(len(rows)), key=lambda j: abs(residual[row, j]))
    return dict(
        projections=list(projections),
        matrix_row=row,
        matrix_col=col,
        full_state_row=row + state_offset,
        full_state_col=col + state_offset,
        relative=str(relative(actual, expected)),
        row_abs_sum=str(rows[row]),
        max_entry=str(residual[row, col]),
        reference_infinity_norm=str(infnorm(expected)),
    )


def metrics(k, projectors, roots, *, state_offset=11, pulse=lambda _: None):
    """All ordered products; normalization exactly matches the frozen gate."""
    zero, p = k * 0, identity(len(k))
    maxima = {name: D(0) for name in ("idempotency", "cross", "action")}
    witnesses = {}
    per_projection = []
    for i, e in enumerate(projectors):
        pulse(i)
        row = dict(index=i, root=str(roots[i]))
        for name, actual, expected in (
            ("idempotency", e @ e, e),
            ("action", k @ e, roots[i] * e),
        ):
            value = relative(actual, expected)
            row[name + "_relative"] = str(value)
            if name not in witnesses or value > maxima[name]:
                maxima[name] = value
                witnesses[name] = witness(
                    actual, expected, [i], state_offset=state_offset
                )
        row_cross = D(0)
        for j, f in enumerate(projectors):
            if i == j:
                continue
            actual = e @ f
            value = relative(actual, zero)
            row_cross = max(row_cross, value)
            if "cross" not in witnesses or value > maxima["cross"]:
                maxima["cross"] = value
                witnesses["cross"] = witness(
                    actual, zero, [i, j], state_offset=state_offset
                )
        row["cross_relative"] = str(row_cross)
        per_projection.append(row)
    values = {name + "_relative": value for name, value in maxima.items()}
    values["completeness_relative"] = relative(sum(projectors), p)
    values["reconstruction_relative"] = relative(
        sum(a * e for a, e in zip(roots, projectors, strict=True)), k
    )
    require(all(v.is_finite() for v in values.values()), "finite Decimal diagnostics")
    return dict(
        values={key: float(value) for key, value in values.items()},
        decimal_values={key: str(value) for key, value in values.items()},
        compared_to_original_threshold={
            key: value <= D("2e-12") for key, value in values.items()
        },
        witnesses=witnesses,
        per_projection=per_projection,
        ordered_cross_products=156,
    )


def annihilator(k, squared):
    square, p = k @ k, identity(len(k))
    value = k.copy()
    for b2 in squared:
        value = value @ (square - b2 * p)
    return value


def residual_identity(k, projectors, roots, *, kind, squared=None):
    """Check the exact polynomial residual identity at the working precision."""
    require(kind in ("paired", "lagrange"), "registered polynomial type")
    squared = [a * a for a in roots[7:]] if squared is None else squared
    m = annihilator(k, squared)
    km = k @ m
    rows, worst = [], D(0)
    for i, (a, e) in enumerate(zip(roots, projectors, strict=True)):
        derivative = D(1)
        for j, b in enumerate(roots):
            if j != i:
                derivative *= a - b
        expected = km / (a * derivative) if kind == "paired" and a else m / derivative
        actual = k @ e - a * e
        error = relative(actual, expected)
        worst = max(worst, error)
        rows.append(
            dict(
                index=i,
                root=str(a),
                inverse_derivative=str(D(1) / derivative),
                paired_multiplier=str(D(1) / (a * derivative)) if a else None,
                predicted_action_infinity_norm=str(infnorm(expected)),
                observed_action_infinity_norm=str(infnorm(actual)),
                identity_relative=str(error),
            )
        )
    require(worst <= ARITHMETIC_CONTROL, "polynomial residual identity failed")
    return m, dict(
        annihilator_infinity_norm=str(infnorm(m)),
        k_annihilator_infinity_norm=str(infnorm(km)),
        max_identity_relative=str(worst),
        diagnostic_identity_tolerance=str(ARITHMETIC_CONTROL),
        rows=rows,
    )


def synthetic_controls():
    """Known exact diagonal and nonnormal integer-similarity inputs."""
    with localcontext() as ctx:
        ctx.prec = 70
        roots = np.array([D(i) for i in range(-6, 7)], dtype=object)
        diagonal = np.diag(roots)
        p = identity(13)
        nilpotent = np.zeros((13, 13), dtype=int)
        nilpotent[np.arange(12), np.arange(1, 13)] = 1
        n = exact(nilpotent)
        s, inverse, power = p + n, p.copy(), p.copy()
        for degree in range(1, 13):
            power = power @ n
            inverse += (-1 if degree % 2 else 1) * power
        require(np.array_equal(s @ inverse, p), "exact similarity inverse")
        records = []
        for name, transform, undo in (
            ("diagonal", p, p),
            ("integer-similarity", s, inverse),
        ):
            k = transform @ diagonal @ undo
            expected = []
            for i in range(13):
                e = p * 0
                e[i, i] = D(1)
                expected.append(transform @ e @ undo)
            for style in ("expanded", "factored", "lagrange"):
                e = (
                    lagrange(k, roots)
                    if style == "lagrange"
                    else paired(k, roots[7:], style=style)
                )
                error = stack_difference(e, expected)
                require(
                    error <= ARITHMETIC_CONTROL, "known synthetic projectors failed"
                )
                _, residual = residual_identity(
                    k, e, roots, kind="lagrange" if style == "lagrange" else "paired"
                )
                records.append(
                    dict(
                        case=name,
                        style=style,
                        relative=str(error),
                        residual=residual,
                        passed=True,
                    )
                )
        return records
