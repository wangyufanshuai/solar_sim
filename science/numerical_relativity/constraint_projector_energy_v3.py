"""Case-0 shadow Hermite candidate, evaluated on each actual input matrix.

The independently audited equation coefficients are NOT substituted for matrix.
Analytical nodes are constructed from exact fractions; external gates retain
the original binary64 matrices, speeds, thresholds, ranks and state maps.
"""

from decimal import Decimal, localcontext
from fractions import Fraction

import numpy as np

METHOD = "nr-hermite-projector-energy-v3"
TOLERANCE = 2e-12


def require(condition, message):
    if not condition:
        raise ValueError(message)


def case0_squared():
    """Flat f=3, mu=1/5 branches, also checked against the exact annihilator."""
    f, mu = Fraction(3), Fraction(1, 5)
    return (mu / 4, mu / 2, Fraction(1), Fraction(2), f, 4 * f / 3)


def case0_nodes(*, precision=70):
    require(type(precision) is int and precision in (50, 70), "precision50/70")
    with localcontext() as ctx:
        ctx.prec = precision
        positive = tuple(
            (Decimal(s.numerator) / Decimal(s.denominator)).sqrt()
            for s in case0_squared()
        )
        return (
            tuple(x.copy_negate() for x in reversed(positive))
            + (Decimal(0),)
            + positive
        )


def real(value, shape):
    a = np.asarray(value)
    require(
        a.shape == shape and a.dtype.kind in "fiu" and np.isfinite(a).all(),
        "matching finite real array required",
    )
    return np.array(a, dtype=float, copy=True)


def hermite_projectors(matrix, pde, roots, *, precision=70, pulse=lambda: None):
    """Degree<=25 cardinal polynomials: H_i(a_j)=delta_ij, H_i'(a_j)=0.

    This is a different interpolation polynomial, not clipping, eigenvalue
    fitting, rank repair or a replacement of the data being tested. It need
    not be an exact spectral projector away from the prescribed spectrum.
    """
    require(type(precision) is int and precision in (50, 70), "precision50/70")
    raw = np.asarray(matrix)
    require(
        raw.ndim == 2 and raw.shape[0] == raw.shape[1] and len(raw) in (43, 47),
        "square43/47 block required",
    )
    k, p = real(raw, raw.shape), real(pde, raw.shape)
    require(
        isinstance(roots, tuple)
        and len(roots) == 13
        and all(isinstance(a, Decimal) and a.is_finite() for a in roots),
        "thirteen explicit finite Decimal nodes required",
    )
    require(
        roots[6] == 0
        and all(a == b.copy_negate() for a, b in zip(roots, reversed(roots))),
        "symmetric prescribed nodes required",
    )
    for actual, expected in ((p @ p, p), (k @ p, k), (p @ k, k)):
        require(
            np.linalg.norm(actual - expected, np.inf)
            <= TOLERANCE * max(1.0, float(np.linalg.norm(expected, np.inf))),
            "PDE complement compatibility required",
        )
    with localcontext() as ctx:
        ctx.prec = precision
        require(
            min(b - a for a, b in zip(roots[:-1], roots[1:]))
            > Decimal("1e-12") * max(Decimal(1), *(a.copy_abs() for a in roots)),
            "distinct increasing prescribed nodes required",
        )
        convert = np.vectorize(lambda v: Decimal.from_float(float(v)), otypes=[object])
        kd, pd = convert(k), convert(p)
        answer = []
        for i, a in enumerate(roots):
            pulse()
            lagrange, slope = pd.copy(), Decimal(0)
            for j, b in enumerate(roots):
                if i != j:
                    lagrange = lagrange @ ((kd - b * pd) / (a - b))
                    slope += Decimal(1) / (a - b)
            answer.append((pd - 2 * slope * (kd - a * pd)) @ (lagrange @ lagrange))
        result = np.asarray(answer, dtype=float)
    require(np.isfinite(result).all(), "finite Hermite projectors required")
    return result
