"""Independent direct-Lagrange shadow candidate; not a live solver dependency.

Starting with the PDE projector excludes the separate zero-speed ODE sector.
The prescribed nodes and unmodified matrices must still pass external gates.
"""

from decimal import Decimal, localcontext

import numpy as np

METHOD = "nr-direct-lagrange-projector-energy-v2"
TOLERANCE = 2e-12


def require(condition, message):
    if not condition:
        raise ValueError(message)


def real(a, shape):
    value = np.asarray(a)
    require(
        value.shape == shape and value.dtype.kind in "fiu" and np.isfinite(value).all(),
        "matching finite real array required",
    )
    return np.array(value, dtype=float, copy=True)


def polynomial_projectors(matrix, pde, roots, *, precision=70):
    raw = np.asarray(matrix)
    require(
        raw.ndim == 2 and raw.shape[0] == raw.shape[1] and len(raw) in (43, 47),
        "square43/47 block required",
    )
    k, p, nodes = real(raw, raw.shape), real(pde, raw.shape), real(roots, (13,))
    require(
        nodes[6] == 0
        and np.array_equal(nodes[:6], -nodes[:6:-1])
        and np.min(np.diff(nodes)) > 1e-12 * max(1.0, float(np.max(abs(nodes)))),
        "thirteen distinct symmetric prescribed nodes required",
    )
    require(
        type(precision) is int and precision in (50, 70),
        "registered precision50/70 required",
    )
    for actual, expected in ((p @ p, p), (k @ p, k), (p @ k, k)):
        require(
            np.linalg.norm(actual - expected, np.inf)
            <= TOLERANCE * max(1.0, float(np.linalg.norm(expected, np.inf))),
            "PDE complement compatibility required",
        )
    with localcontext() as ctx:
        ctx.prec = precision
        convert = np.vectorize(lambda v: Decimal.from_float(float(v)), otypes=[object])
        kd, pd, xd = convert(k), convert(p), convert(nodes)
        answer = []
        for i, a in enumerate(xd):
            projection = pd.copy()
            for j, b in enumerate(xd):
                if i != j:
                    projection = projection @ ((kd - b * pd) / (a - b))
            answer.append(projection)
        result = np.asarray(answer, dtype=float)
    require(np.isfinite(result).all(), "finite direct projectors required")
    return result
