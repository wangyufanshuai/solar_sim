"""All33 semidiscrete reduction balances, including nonlinear chain defects.

Diagnostic only: no RHS modification, time step, SAT, or projection. Dense
SBP(4,2) matrices are assembled from mathematical coefficient tables without
importing the production stencil. The continuum oracle supplies J(F_base)Dq;
it must never be substituted for D(F_base) in a discrete constraint rate.
"""

from __future__ import annotations

from dataclasses import dataclass, field, fields
from fractions import Fraction
import math

import numpy as np

from . import reduction_constraint_oracle as R

METHOD = "nr-discrete-reduction-balance-v1"
TOLERANCE = 2e-12
FAMILIES = {"A": slice(0, 3), "B": slice(3, 12), "D": slice(12, 30), "P": slice(30, 33)}


def rational_operator(points):
    """Unscaled D,H tables; exact rational arithmetic, not a fitted stencil."""
    if type(points) is not int or not 9 <= points <= 65:
        raise ValueError("diagnostic requires9..65 integer nodes")
    left = (
        ("-24/17", "59/34", "-4/17", "-3/34"),
        ("-1/2", "0", "1/2"),
        ("4/43", "-59/86", "0", "59/86", "-4/43"),
        ("3/98", "0", "-59/98", "0", "32/49", "-4/49"),
    )
    matrix = np.full((points, points), Fraction(0), dtype=object)
    for i, row in enumerate(left):
        for j, coefficient in enumerate(row):
            matrix[i, j] = Fraction(coefficient)
            matrix[points - 1 - i, points - 1 - j] = -Fraction(coefficient)
    for i in range(4, points - 4):
        for shift, coefficient in (
            (-2, "1/12"),
            (-1, "-2/3"),
            (1, "2/3"),
            (2, "-1/12"),
        ):
            matrix[i, i + shift] = Fraction(coefficient)
    weights = np.full(points, Fraction(1), dtype=object)
    for i, coefficient in enumerate(("17/48", "59/48", "43/48", "49/48")):
        weights[i] = weights[-1 - i] = Fraction(coefficient)
    matrix.setflags(write=False)
    weights.setflags(write=False)
    return matrix, weights


@dataclass(frozen=True)
class DenseSBP:
    shape: tuple[int, int, int]
    spacing: tuple[float, float, float]
    matrices: tuple = field(init=False, repr=False)

    def __post_init__(self):
        if (
            type(self.shape) is not tuple
            or len(self.shape) != 3
            or type(self.spacing) is not tuple
            or len(self.spacing) != 3
            or any(type(n) is not int or not 9 <= n <= 65 for n in self.shape)
            or any(
                type(x) not in (int, float) or not math.isfinite(x) or x <= 0
                for x in self.spacing
            )
        ):
            raise ValueError(
                "three matching diagnostic axes and positive finite spacing required"
            )
        object.__setattr__(
            self,
            "matrices",
            tuple(
                R.frozen(np.array(rational_operator(n)[0], dtype=float) / dx)
                for n, dx in zip(self.shape, self.spacing, strict=True)
            ),
        )

    def validate(self, value, channels=None):
        q = np.asarray(value)
        if (
            q.dtype.kind not in "fiu"
            or q.ndim != 4
            or q.shape[1:] != self.shape
            or q.shape[0] == 0
            or (channels is not None and q.shape[0] != channels)
            or not np.all(np.isfinite(q))
        ):
            raise ValueError(
                "finite real channel-first field on the matching grid required"
            )
        return q

    def derivative(self, value, axis):
        q = self.validate(value)
        if type(axis) is not int or axis not in (0, 1, 2):
            raise ValueError("spatial axis0/1/2 required")
        moved = np.moveaxis(q, axis + 1, 0)
        result = np.tensordot(self.matrices[axis], moved, axes=(1, 0))
        return np.moveaxis(result, 0, axis + 1)

    def gradient(self, value):
        return np.array([self.derivative(value, axis) for axis in range(3)])

    def definition_defects(self, value):
        q = self.validate(value, 58)
        return q[25:] - R.gradient_aux(self.gradient(q[:11]))

    def measured_rates(self, rhs):
        """Same linear definition map applied to actual time derivatives."""
        return self.definition_defects(rhs)


@dataclass(frozen=True)
class DiscretePrediction:
    gradients: np.ndarray
    base_rates: np.ndarray
    auxiliary_rates: np.ndarray
    defects: np.ndarray
    continuum_balance: np.ndarray
    chain_defect: np.ndarray
    predicted_rates: np.ndarray

    def __post_init__(self):
        for item in fields(self):
            value = getattr(self, item.name)
            if not np.all(np.isfinite(value)):
                raise ValueError("finite discrete prediction required")
            object.__setattr__(self, item.name, R.frozen(value))


def evaluate(slots, operator, *, tau_inverse=1.0):
    if not isinstance(operator, DenseSBP):
        raise ValueError("explicit independent dense SBP operator required")
    q = operator.validate(slots, 58)
    dq = operator.gradient(q)
    reference = R.evaluate(R.CanonicalJet(q, dq), tau_inverse=tau_inverse)
    # C_D = map[J(F_base)Dq - D(F_base)]. Keeping it explicitly separates
    # continuum reduction forcing from the finite-difference chain defect.
    chain = R.gradient_aux(
        reference.base_gradients - operator.gradient(reference.base_rates)
    )
    return DiscretePrediction(
        dq,
        reference.base_rates,
        reference.auxiliary_rates,
        reference.defects,
        reference.defect_rates,
        chain,
        reference.defect_rates + chain,
    )


def family_peaks(values, *, center=False):
    q = np.asarray(values)
    if q.ndim != 4 or q.shape[0] != 33 or not np.all(np.isfinite(q)):
        raise ValueError("finite33-channel field required")
    if center:
        q = q[:, *(n // 2 for n in q.shape[1:])]
    return {name: float(np.max(abs(q[part]))) for name, part in FAMILIES.items()}


def orders(coarse, fine, ratio=2.0, floor=2e-13):
    """A below-floor comparison is unresolved, never an infinite success order."""
    if any(
        type(x) not in (int, float) or not math.isfinite(x)
        for x in (coarse, fine, ratio, floor)
    ):
        raise ValueError("finite refinement scalars required")
    if min(coarse, fine) < 0 or ratio <= 1 or floor <= 0:
        raise ValueError("nonnegative errors, ratio>1 and positive floor required")
    return (
        None
        if min(coarse, fine) <= floor
        else math.log(coarse / fine) / math.log(ratio)
    )
