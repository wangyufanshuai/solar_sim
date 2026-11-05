"""Small real tensor Taylor algebra; known spatial order is never promoted.

Coefficients are derivatives divided by multi-index factorials, not sampled
finite differences. Only three spatial dimensions and degree <=3 are supported.
This diagnostic utility is not a discretization, time integrator or solver.
"""

from __future__ import annotations

from dataclasses import dataclass
from itertools import product
import math

import numpy as np

INDICES = tuple(
    sorted(
        (v for v in product(range(4), repeat=3) if sum(v) <= 3),
        key=lambda v: (sum(v), v),
    )
)
LOOKUP = {v: i for i, v in enumerate(INDICES)}
COUNTS = (1, 4, 10, 20)
PAIRS = tuple(
    tuple(
        (LOOKUP[a], LOOKUP[tuple(m - n for m, n in zip(v, a, strict=True))])
        for a in INDICES
        if all(n <= m for m, n in zip(v, a, strict=True))
    )
    for v in INDICES
)


@dataclass(frozen=True)
class Jet:
    c: np.ndarray
    order: int = 3

    def __post_init__(self):
        raw = np.asarray(self.c)
        if (
            type(self.order) is not int
            or not 0 <= self.order <= 3
            or raw.ndim < 1
            or raw.shape[0] != COUNTS[self.order]
            or not raw.size
            or raw.dtype.kind not in "fiu"
            or not np.isfinite(raw).all()
        ):
            raise ValueError("finite real coefficients of declared order required")
        a = np.array(raw, dtype=np.float64, copy=True)
        a.setflags(write=False)
        object.__setattr__(self, "c", a)

    @property
    def value(self):
        return self.c[0]

    @property
    def shape(self):
        return self.c.shape[1:]

    @staticmethod
    def constant(value, order=3):
        raw = np.asarray(value)
        if raw.dtype.kind not in "fiu" or type(order) is not int or not 0 <= order <= 3:
            raise ValueError("real constant and order0..3 required")
        c = np.zeros((COUNTS[order],) + raw.shape)
        c[0] = raw
        return Jet(c, order)

    @staticmethod
    def coordinate(value, axis):
        if type(axis) is not int or axis not in (0, 1, 2):
            raise ValueError("spatial axis0..2 required")
        c = Jet.constant(value).c.copy()
        index = tuple(int(i == axis) for i in range(3))
        c[LOOKUP[index]] = 1.0
        return Jet(c)

    def trim(self, order):
        if type(order) is not int or not 0 <= order <= self.order:
            raise ValueError("cannot invent missing spatial derivatives")
        return Jet(self.c[: COUNTS[order]], order)

    def __getitem__(self, key):
        if not isinstance(key, tuple):
            key = (key,)
        return Jet(self.c[(slice(None),) + key], self.order)

    def __neg__(self):
        return Jet(-self.c, self.order)

    def __add__(self, other):
        other = other if isinstance(other, Jet) else Jet.constant(other, self.order)
        if self.shape != other.shape:
            raise ValueError("addition requires matching tensor shapes")
        order = min(self.order, other.order)
        return Jet(self.c[: COUNTS[order]] + other.c[: COUNTS[order]], order)

    __radd__ = __add__

    def __sub__(self, other):
        return self + (-other)

    def __rsub__(self, other):
        return -self + other

    def __mul__(self, other):
        other = other if isinstance(other, Jet) else Jet.constant(other, self.order)
        if self.shape and other.shape and self.shape != other.shape:
            raise ValueError("scalar multiplication or equal shapes required")
        return _bilinear(lambda a, b: a * b, self, other)

    __rmul__ = __mul__

    def power(self, exponent):
        if (
            self.shape
            or type(exponent) not in (int, float)
            or not math.isfinite(exponent)
            or self.value <= 0.0
        ):
            raise ValueError("positive scalar base and finite real exponent required")
        x = (self - float(self.value)) * (1.0 / float(self.value))
        out, term, coefficient = (
            Jet.constant(1.0, self.order),
            Jet.constant(1.0, self.order),
            1.0,
        )
        for n in range(1, self.order + 1):
            term = term * x
            coefficient *= (exponent - n + 1) / n
            out = out + coefficient * term
        return float(self.value) ** exponent * out

    def gradient(self):
        if self.order == 0:
            raise ValueError("cannot invent missing spatial derivatives")
        out = np.empty((COUNTS[self.order - 1], 3) + self.shape)
        for n, v in enumerate(INDICES[: COUNTS[self.order - 1]]):
            for axis in range(3):
                parent = tuple(v[i] + int(i == axis) for i in range(3))
                out[n, axis] = (v[axis] + 1) * self.c[LOOKUP[parent]]
        return Jet(out, self.order - 1)

    def derivative(self, count):
        if type(count) is not int or not 0 <= count <= self.order:
            raise ValueError("known derivative order required")
        current = self
        for _ in range(count):
            current = current.gradient()
        return current.value

    def inverse(self):
        if len(self.shape) != 2 or self.shape[0] != self.shape[1]:
            raise ValueError("square matrix Taylor series required")
        result = np.zeros_like(self.c)
        result[0] = np.linalg.inv(self.value)
        for n in range(1, len(result)):
            remainder = sum(self.c[a] @ result[b] for a, b in PAIRS[n] if a != 0)
            result[n] = -result[0] @ remainder
        return Jet(result, self.order)


def _bilinear(operation, a, b):
    order = min(a.order, b.order)
    result = [
        sum(operation(a.c[i], b.c[j]) for i, j in PAIRS[n])
        for n in range(COUNTS[order])
    ]
    return Jet(np.array(result), order)


def einsum(spec, a, b=None):
    if b is None:
        return Jet(np.array([np.einsum(spec, c) for c in a.c]), a.order)
    return _bilinear(lambda x, y: np.einsum(spec, x, y), a, b)


def stack(jets):
    jets = tuple(jets)
    if not jets or not all(isinstance(j, Jet) for j in jets):
        raise ValueError("nonempty collection of Taylor jets required")
    order = min(j.order for j in jets)
    return Jet(np.stack([j.c[: COUNTS[order]] for j in jets], axis=1), order)
