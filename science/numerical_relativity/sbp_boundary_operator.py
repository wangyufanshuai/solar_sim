"""SBP(4,2) spatial reference and scalar SAT control, not an Einstein boundary.

Interior order4; four boundary rows per face have order2. Mathematical tables
cross-checked against MattssonNordstrom2004 first_derivative_coefficients in
https://github.com/ranocha/SummationByPartsOperators.jl
(blob793d768b0bb39df2339c63901a7eb300ddbbc779). No external code is executed.
The scalar SAT proves only a semidiscrete constant-coefficient energy identity.
"""
from __future__ import annotations

from dataclasses import dataclass
import math

import numpy as np

# Numerator/denominator pairs also permit exact rational coefficient audits.
LEFT_ROWS = (
    ((-24, 17), (59, 34), (-4, 17), (-3, 34)),
    ((-1, 2), (0, 1), (1, 2)),
    ((4, 43), (-59, 86), (0, 1), (59, 86), (-4, 43)),
    ((3, 98), (0, 1), (-59, 98), (0, 1), (32, 49), (-4, 49)),
)
NORM_EDGE = ((17, 48), (59, 48), (43, 48), (49, 48))


@dataclass(frozen=True)
class SBP42:
    """Ghost-free node-aligned first derivative with a positive diagonal norm."""

    points: int
    spacing: float

    def __post_init__(self):
        if type(self.points) is not int or self.points < 9:
            raise ValueError("at least9 integer nodes required")
        if isinstance(self.spacing, (bool, complex)) or not math.isfinite(self.spacing) or self.spacing <= 0.:
            raise ValueError("positive finite spacing required")

    @property
    def identity(self):
        return {"method": "diagonal-norm-sbp-4-2-v1", "points": self.points, "spacing": self.spacing,
            "interior_order": 4, "boundary_order": 2, "boundary_rows_per_face": 4,
            "physical_boundary_validated": False, "runtime_writeback": False}

    @property
    def norm_weights(self):
        weights = np.ones(self.points)*self.spacing
        edge = np.array([p/q for p, q in NORM_EDGE])*self.spacing
        weights[:4], weights[-4:] = edge, edge[::-1]
        weights.flags.writeable = False
        return weights

    def _field(self, field, axis):
        if np.iscomplexobj(field):
            raise ValueError("real SBP field required")
        q = np.asarray(field, dtype=float)
        if (type(axis) is not int or not -q.ndim <= axis < q.ndim
                or q.shape[axis] != self.points or q.size == 0 or not np.all(np.isfinite(q))):
            raise ValueError("finite field with matching axis length required")
        return q

    def derivative(self, field, axis=0):
        """Apply compact rows along any axis, including packed58-field arrays."""
        q = np.moveaxis(self._field(field, axis), axis, 0)
        out = np.empty_like(q)
        # Pairing preserves constant data exactly without clipping derivatives.
        out[4:-4] = (q[2:-6]-q[6:-2]+8.*(q[5:-3]-q[3:-5]))/12.
        for i, row in enumerate(LEFT_ROWS):
            left, right = np.zeros_like(q[0]), np.zeros_like(q[0])
            for j, (p, denominator) in enumerate(row):
                weight = p/denominator
                left += weight*(q[j]-q[i])
                right -= weight*(q[-1-j]-q[-1-i])
            out[i], out[-1-i] = left, right
        out /= self.spacing
        if not np.all(np.isfinite(out)):
            raise ValueError("nonfinite SBP derivative")
        return np.moveaxis(out, 0, axis)

    def matrix(self):
        """Small-grid diagnostic only; evolution should use the compact apply."""
        if self.points > 257:
            raise ValueError("dense diagnostic limited to257 nodes")
        return self.derivative(np.eye(self.points), axis=0)

    def scalar_advection_rhs(self, field, speed, *, left_data=0., right_data=0.):
        """u_t=-c*D*u plus upwind incoming SAT; no full-FO coupling implied."""
        q = self._field(field, 0)
        if q.ndim != 1:
            raise ValueError("scalar SAT control requires a1D field")
        if any(isinstance(v, (bool, complex)) or not math.isfinite(v) for v in (speed, left_data, right_data)):
            raise ValueError("finite real constant speed and incoming data required")
        result = -speed*self.derivative(q)
        if speed > 0.:
            result[0] -= speed*(q[0]-left_data)/self.norm_weights[0]
        elif speed < 0.:
            result[-1] += speed*(q[-1]-right_data)/self.norm_weights[-1]
        if not np.all(np.isfinite(result)):
            raise ValueError("nonfinite scalar SAT RHS")
        return result
