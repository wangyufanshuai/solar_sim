"""Separate SBP D2(4,2) reference. Not connected to the Einstein evolution.

Mathematical coefficients cross-checked against MattssonNordstrom2004,
SummationByPartsOperators.jl, blob 793d768b0bb39df2339c63901a7eb300ddbbc779.
The norm is compatible with SBP42; boundary S differs from D1's first row.
No variable-coefficient, physical-boundary or nonlinear stability claim.

Coefficient-table attribution: Copyright (c) 2017-present Hendrik Ranocha
<mail@ranocha.de>, SummationByPartsOperators.jl (MIT License).
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .sbp_boundary_operator import SBP42

D2_LEFT_ROWS = (
    ((2, 1), (-5, 1), (4, 1), (-1, 1)),
    ((1, 1), (-2, 1), (1, 1)),
    ((-4, 43), (59, 43), (-110, 43), (59, 43), (-4, 43)),
    ((-1, 49), (0, 1), (59, 49), (-118, 49), (64, 49), (-4, 49)),
)
BOUNDARY_S = ((-11, 6), (3, 1), (-3, 2), (1, 3))


@dataclass(frozen=True)
class SBP42Second:
    """Constant-coefficient narrow D2; fourth interior, second boundary order."""

    points: int
    spacing: float

    def __post_init__(self):
        SBP42(self.points, self.spacing)

    @property
    def norm_weights(self):
        return SBP42(self.points, self.spacing).norm_weights

    @property
    def identity(self):
        return dict(method="diagonal-norm-sbp-d2-4-2-v1", points=self.points,
                    spacing=self.spacing, interior_order=4, boundary_order=2,
                    boundary_rows_per_face=4, boundary_S_order=3,
                    fully_compatible_S_equals_D1=False, evolution_connected=False,
                    physical_boundary_validated=False, runtime_writeback=False)

    def _field(self, field, axis):
        if np.iscomplexobj(field):
            raise ValueError("real D2 field required")
        q = np.asarray(field, dtype=np.float64)
        if (type(axis) is not int or not -q.ndim <= axis < q.ndim
                or q.shape[axis] != self.points or not np.all(np.isfinite(q)) or q.size == 0):
            raise ValueError("finite field with matching derivative axis required")
        return np.moveaxis(q, axis, 0)

    def second_derivative(self, field, axis=0):
        q = self._field(field, axis)
        result = np.empty_like(q)
        center = q[4:-4]
        result[4:-4] = (16.*((q[3:-5]-center)+(q[5:-3]-center))
                       -((q[2:-6]-center)+(q[6:-2]-center)))/12.
        for i, row in enumerate(D2_LEFT_ROWS):
            left, right = np.zeros_like(q[0]), np.zeros_like(q[0])
            for j, (num, den) in enumerate(row):
                left += (num/den)*(q[j]-q[i])
                right += (num/den)*(q[-1-j]-q[-1-i])
            result[i], result[-1-i] = left, right
        result /= self.spacing**2
        if not np.all(np.isfinite(result)):
            raise ValueError("nonfinite D2 result")
        return np.moveaxis(result, 0, axis)

    def boundary_derivative(self, field, side, axis=0):
        if type(side) is not int or side not in (0, 1):
            raise ValueError("boundary side must be 0 or 1")
        q = self._field(field, axis)
        result = np.zeros_like(q[0])
        for j, (num, den) in enumerate(BOUNDARY_S):
            result += (num/den)*(q[j]-q[0] if side == 0 else -(q[-1-j]-q[-1]))
        result /= self.spacing
        if not np.all(np.isfinite(result)):
            raise ValueError("nonfinite boundary derivative")
        return result

    def matrix(self):
        if self.points > 257:
            raise ValueError("dense diagnostic limited to 257 nodes")
        return self.second_derivative(np.eye(self.points), axis=0)
