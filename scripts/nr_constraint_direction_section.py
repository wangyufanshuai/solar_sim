"""Unexecuted direction-independent right-section candidate for Dhat.

Construct from constraint definitions, without pivoting, spectral fitting,
production symbols, R.leading or a supplied matrix to invert. The candidate
only uses r=v.v and g=v.h^-1.v as directional denominators. It does not prove
subsidiary closure, a uniform energy estimate or physical qualification.
"""

from fractions import Fraction as F

import numpy as np

from scripts import nr_constraint_exact_coefficients as R
from scripts import nr_profile_exact_coefficients as Q


def lift(background, constraints, *, guard=lambda: None):
    """Lift arbitrary43 rational constraints to one58-state representative."""
    if not isinstance(background, Q.Background):
        raise ValueError("exact Background required")
    c = tuple(constraints)
    if len(c) != 43 or any(type(x) is not F for x in c):
        raise ValueError("43 explicit Fraction constraint coordinates required")
    guard()
    h, u, v = background.metric, Q.inverse(background.metric), background.ray
    r = background.ray_squared
    w = tuple(sum(u[i][j] * v[j] for j in range(3)) for i in range(3))
    g = sum(v[i] * w[i] for i in range(3))
    if r <= 0 or g <= 0 or background.chi <= 0:
        raise ValueError("positive ray and metric contractions and chi required")
    q = [F(0)] * 58

    # c_aux = P_perp aux - v base (metric base carries the factor1/2).
    for start, width, base, auxiliary, factor in (
        (8, 1, 6, 25, F(1)), (11, 3, 7, 28, F(1)),
        (20, 6, 0, 37, F(2)), (38, 1, 10, 55, F(1)),
    ):
        for component in range(width):
            parallel = sum(v[k] * c[start + width * k + component] for k in range(3)) / r
            q[base + component] = -factor * parallel
            for k in range(3):
                q[auxiliary + width * k + component] = c[start + width * k + component] - v[k] * parallel

    # Compensated determinant:2 v^k u^ij D_kij =2 r tr_u(d).
    for k in range(3):
        for p, (i, j) in enumerate(Q.PAIRS):
            q[37 + 6 * k + p] += v[k] * c[41] * h[i][j] / (6 * r)

    pair = lambda i, j: Q.PAIR_INDEX[min(i, j), max(i, j)]
    d = lambda k, i, j: q[37 + 6 * k + pair(i, j)]
    base_hamiltonian = background.chi * (
        2 * sum(w[ell] * u[i][j] * (d(i, ell, j) - d(ell, i, j))
                for ell in range(3) for i in range(3) for j in range(3))
        + 4 * sum(w[k] * q[55 + k] for k in range(3)))
    longitudinal_p = (c[0] - base_hamiltonian) / (4 * background.chi * g)
    for k in range(3):
        q[55 + k] += v[k] * longitudinal_p

    # Choose K=-3 tau/2 so the v_i(tau+2K/3) momentum term vanishes.
    momentum, trace = c[1:4], c[42]
    contracted_momentum = sum(w[i] * momentum[i] for i in range(3))
    transverse_trace = (trace - contracted_momentum / g) / 2
    for p, (i, j) in enumerate(Q.PAIRS):
        q[11 + p] = ((v[i] * momentum[j] + v[j] * momentum[i]) / g
                     - contracted_momentum * v[i] * v[j] / g**2
                     + transverse_trace * (h[i][j] - v[i] * v[j] / g))
    q[17], q[18] = -3 * trace / 2, c[4]

    # Z_i=(h_ij Gamma^j - connection_i)/2; the driver b^i stays zero.
    connection = tuple(sum(u[j][ell] * (2 * d(j, i, ell) - d(i, j, ell))
                           for j in range(3) for ell in range(3)) for i in range(3))
    for i in range(3):
        q[19 + i] = sum(u[i][j] * (2 * c[5 + j] + connection[j]) for j in range(3))
    return np.asarray(q, dtype=object)


def section(background, *, guard=lambda: None):
    """Build S(v) columnwise. Qualification must independently check Dhat S=I."""
    result = R.zeros(58, 43)
    for column in range(43):
        c = [F(0)] * 43
        c[column] = F(1)
        result[:, column] = lift(background, c, guard=guard)
    return result


def case12_direction_bounds(background):
    """Analytic branch-denominator bounds, NOT a checked spectrum or energy."""
    reference = Q.case12()
    if (not isinstance(background, Q.Background)
            or any(getattr(background, name) != getattr(reference, name)
                   for name in ("alpha", "chi", "metric", "shift"))):
        raise ValueError("fixed case12 background required; only the ray may vary")
    h, u = background.metric, Q.inverse(background.metric)
    h_bound = max(sum(abs(x) for x in row) for row in h)
    u_bound = max(sum(abs(x) for x in row) for row in u)
    lower = 1 / h_bound
    a, c = background.alpha, background.chi
    branches = (a*a*c/20, a*a*c/10, a*a*c, 2*a*c, 3*a*c, 4*a*c)
    nodes = (F(0), *branches)
    gaps = tuple(nodes[i + 1] - nodes[i] for i in range(len(nodes) - 1))
    if lower <= 0 or any(gap <= 0 for gap in gaps):
        raise ValueError("positive ordered branch gaps required")
    return dict(metric_normal_lower=lower, metric_normal_upper=u_bound,
                metric_norm_upper=h_bound, branch_constants=branches,
                squared_speed_gap_lower=min(gaps) * lower,
                claimed_spectrum_validated=False, direction_uniform_energy_validated=False)
