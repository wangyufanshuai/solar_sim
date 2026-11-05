"""Independent, pointwise SAT action for the frozen experimental FO profile.

The principal matrix comes from the qualified Taylor-jet equation reference.
Newton interpolation of abs(lambda) uses Decimal arithmetic, not production
SVD/eigenvectors. This is a diagnostic, not a new boundary or an energy theorem.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, localcontext
import math

import numpy as np

from . import formal_fo_geometry as G
from . import reduction_constraint_oracle as R

METHOD = "nr-independent-polynomial-sat-v1"
TOLERANCE = 2e-12


def require(ok, message):
    if not ok:
        raise ValueError(message)


def real(value, shape):
    q = np.asarray(value)
    require(
        q.shape == shape and q.dtype.kind in "fiu" and np.isfinite(q).all(),
        "matching finite real input required",
    )
    return np.asarray(q, dtype=float)


def coefficients(cell, axis):
    q = real(cell, (58,))
    require(type(axis) is int and axis in (0, 1, 2), "Cartesian axis required")
    R.CanonicalJet(q, np.zeros((3, 58)))
    h = R.sym(q, 0)
    require(
        abs(np.linalg.det(h) - 1) <= 1e-10,
        "unmodified unit determinant coefficient required",
    )
    alpha, chi = math.exp(q[6]), math.exp(2 * q[10])
    hn = float(np.linalg.inv(h)[axis, axis])
    # Published families with the original f=3*alpha*chi, mu=0.2*chi profile.
    magnitudes = (
        alpha * math.sqrt(chi * hn),
        math.sqrt(2 * alpha * chi * hn),
        math.sqrt(4 * alpha * chi * hn),
        alpha * math.sqrt(0.1 * chi * hn),
        math.sqrt(3 * alpha * chi * hn),
        alpha * math.sqrt(0.05 * chi * hn),
    )
    roots = np.array(sorted((0.0, *magnitudes, *(-x for x in magnitudes))))
    require(
        np.isfinite(roots).all()
        and np.min(np.diff(roots)) > 1e-12 * max(1.0, np.max(abs(roots))),
        "distinct resolved intrinsic families required",
    )
    return q, roots, float(q[7 + axis])


def principal(cell, axis):
    q, _, _ = coefficients(cell, axis)
    # The FO principal coefficients depend on the eleven kinematic values only.
    # Probe every derivative slot, including all eleven nominal ODE columns.
    seed = np.zeros(58)
    seed[:11] = q[:11]
    values = np.repeat(seed[:, None], 59, axis=1)
    gradients = np.zeros((3, 58, 59))
    gradients[axis, :, 1:] = np.eye(58)
    rates = G.evaluate(R.CanonicalJet(values, gradients)).rhs
    result = rates[:, 1:] - rates[:, 0, None]
    require(
        np.max(abs(result[:11])) <= TOLERANCE
        and np.max(abs(result[:, :11])) <= TOLERANCE,
        "reference ODE/PDE decoupling failed",
    )
    return R.frozen(result)


def interpolated_absolute(centered, roots, advection, vectors, *, precision=50):
    """Polynomial matrix action, exact Decimal conversion of FP64 inputs.

    Repeated eigenvalues share one interpolation node; no eigenvectors are
    constructed. Callers supply distinct real roots of a diagonalizable matrix.
    This routine alone cannot establish that assumption for an arbitrary matrix.
    """
    matrix = np.asarray(centered)
    require(
        matrix.ndim == 2
        and matrix.shape[0] == matrix.shape[1]
        and 1 <= len(matrix) <= 58,
        "bounded square matrix required",
    )
    matrix = real(matrix, matrix.shape)
    nodes = np.asarray(roots)
    require(nodes.ndim == 1 and 1 <= len(nodes) <= 58, "bounded root sequence required")
    nodes = real(nodes, nodes.shape)
    require(np.all(np.diff(nodes) > 0), "strictly ordered distinct roots required")
    require(
        type(advection) in (float, int) and math.isfinite(advection),
        "finite advection required",
    )
    require(
        type(precision) is int and precision in (50, 70),
        "registered Decimal precision50/70 required",
    )
    v = np.asarray(vectors)
    require(
        v.ndim in (1, 2)
        and v.shape[0] == len(matrix)
        and (v.ndim == 1 or 1 <= v.shape[1] <= 58),
        "bounded matching vectors required",
    )
    v = real(v, v.shape)
    with localcontext() as context:
        context.prec = precision
        convert = np.vectorize(lambda x: Decimal.from_float(float(x)), otypes=[object])
        a, b = convert(matrix), convert(v)
        x = [Decimal.from_float(float(value)) for value in nodes]
        shift = Decimal.from_float(float(advection))
        divided = [abs(value + shift) for value in x]
        for order in range(1, len(x)):
            for k in range(len(x) - 1, order - 1, -1):
                divided[k] = (divided[k] - divided[k - 1]) / (x[k] - x[k - order])
        result = divided[-1] * b
        for k in range(len(x) - 2, -1, -1):
            result = a @ result - x[k] * result + divided[k] * b
        answer = np.asarray(result, dtype=float)
    require(np.isfinite(answer).all(), "finite polynomial action required")
    return R.frozen(answer)


@dataclass(frozen=True)
class SpectralSAT:
    matrix: np.ndarray
    roots: np.ndarray
    advection: float

    def __post_init__(self):
        object.__setattr__(self, "matrix", R.frozen(real(self.matrix, (58, 58))))
        object.__setattr__(self, "roots", R.frozen(real(self.roots, (13,))))
        require(
            np.all(np.diff(self.roots) > 0)
            and type(self.advection) is float
            and math.isfinite(self.advection),
            "resolved fixed-profile spectrum required",
        )
        require(
            np.max(abs(self.matrix[:11])) <= TOLERANCE
            and np.max(abs(self.matrix[:, :11])) <= TOLERANCE,
            "eleven decoupled ODE slots required",
        )

    @classmethod
    def from_cell(cls, cell, axis):
        _, roots, advection = coefficients(cell, axis)
        return cls(principal(cell, axis), roots, advection)

    def absolute(self, vectors, *, precision=50):
        raw = np.asarray(vectors)
        require(
            raw.ndim in (1, 2) and raw.shape[0] == 58, "canonical58 vectors required"
        )
        raw = real(raw, raw.shape)
        out = np.zeros_like(raw)
        centered = self.matrix[11:, 11:] - self.advection * np.eye(47)
        out[11:] = interpolated_absolute(
            centered, self.roots, self.advection, raw[11:], precision=precision
        )
        return R.frozen(out)

    def penalty(self, jump, side, weight, *, precision=50):
        raw = real(jump, (58,))
        require(type(side) is int and side in (0, 1), "face side required")
        require(
            type(weight) in (int, float) and math.isfinite(weight) and weight > 0,
            "positive finite face norm weight required",
        )
        absolute = self.absolute(raw, precision=precision)
        transport = self.matrix @ raw
        # q_t=A q_x: left selects negative roots, right selects positive roots.
        out = ((transport - absolute) if side == 0 else (-transport - absolute)) / (
            2 * weight
        )
        require(np.max(abs(out[:11])) <= TOLERANCE, "penalty entered ODE block")
        return R.frozen(out)


def assemble(point, shape, cell, targets, spacing, *, factory=SpectralSAT.from_cell):
    """Sum all incident Cartesian faces; no averaging at edges or corners."""
    require(
        type(shape) is tuple
        and len(shape) == 3
        and all(type(n) is int and 9 <= n <= 17 for n in shape),
        "registered cube shape required",
    )
    require(
        type(point) is tuple
        and len(point) == 3
        and all(
            type(i) is int and 0 <= i < n for i, n in zip(point, shape, strict=True)
        ),
        "grid point required",
    )
    require(
        type(spacing) is tuple
        and len(spacing) == 3
        and all(
            type(x) in (int, float) and math.isfinite(x) and x > 0 for x in spacing
        ),
        "positive three-axis spacing required",
    )
    q = real(cell, (58,))
    require(
        isinstance(targets, (tuple, list)) and len(targets) == 6,
        "six canonical targets required",
    )
    rows = [real(value, (58,)) for value in targets]
    total = np.zeros(58)
    contributions = []
    for axis in range(3):
        for side in range(2):
            if point[axis] != (0 if side == 0 else shape[axis] - 1):
                continue
            weight = float(spacing[axis]) * 17 / 48
            split = factory(q, axis)
            value = split.penalty(q - rows[2 * axis + side], side, weight)
            total += value
            contributions.append((axis, side, value))
    return R.frozen(total), contributions
