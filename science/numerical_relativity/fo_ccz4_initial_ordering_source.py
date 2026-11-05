"""Independent static Schwarzschild B-source oracle; never an evolution RHS.

The continuum curl of P=grad(log(phi)) is zero. Sampling analytic P before
differencing does not impose a discrete curl-free field. No production
derivative or initializer is used to predict the source here.
"""
from __future__ import annotations

from decimal import Decimal, localcontext
from itertools import product
import math

import numpy as np

CORE = (1.5, 1.75, 2., 2.25, 2.5)
LIMIT = 2.e-12
FD4_OFFSETS_WEIGHTS = ((-2, 1.), (-1, -8.), (1, 8.), (2, -1.))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def radial_fields(points, mass=1.):
    require(not np.iscomplexobj(points), "real coordinates required")
    x = np.asarray(points, dtype=float)
    require(x.ndim >= 1 and x.size > 0 and x.shape[-1] == 3 and np.all(np.isfinite(x))
            and math.isfinite(mass) and mass > 0., "finite Cartesian points and positive mass required")
    r = np.linalg.norm(x, axis=-1)
    require(np.all(r > mass / 2.), "stencil must remain outside the throat")
    a = mass / 2.
    f = 1. / (r*r*(r+a))
    # d_k P_i = M[delta_ki F + x_k x_i F'/r]; the Hessian is symmetric.
    df_over_r = -2. / (r**4*(r+a)) - 1. / (r**3*(r+a)**2)
    jacobian = mass * (f[..., None, None]*np.eye(3)
        + df_over_r[..., None, None]*x[..., :, None]*x[..., None, :])
    return {"lapse": (r-a)/(r+a), "chi": (r/(r+a))**4,
            "P": mass*f[..., None]*x, "dP": jacobian,
            "A": mass*x/(r**3*(1.-(a/r)**2))[..., None]}


def source_at_points(points, spacing, mass=1., ordering_scale=.2):
    require(math.isfinite(spacing) and spacing > 0.
            and math.isfinite(ordering_scale) and ordering_scale > 0., "positive finite coefficients required")
    x = np.asarray(points, dtype=float)
    fields = radial_fields(points, mass)
    derivatives = []
    # Direct weighted evaluations of analytic P, not the solver's paired stencil.
    for axis in range(3):
        value = np.zeros_like(x)
        for offset, weight in FD4_OFFSETS_WEIGHTS:
            shifted = x.copy()
            shifted[..., axis] += offset*spacing
            value += weight*radial_fields(shifted, mass)["P"]
        derivatives.append(value/(12.*spacing))
    dp = np.stack(derivatives, axis=-2)
    coefficient = ordering_scale*fields["lapse"]**2*fields["chi"]
    return coefficient[..., None, None]*(dp-np.swapaxes(dp, -1, -2))


def decimal_core_source(denominator, *, precision=60):
    """60-digit scalar oracle at exact core coordinates and h=1/denominator."""
    require(type(denominator) is int and denominator in (8, 12, 16), "declared spacing required")
    require(type(precision) is int and precision >= 40, "at least 40 decimal digits required")
    result = np.zeros((5, 5, 5, 3, 3))
    with localcontext() as ctx:
        ctx.prec = precision
        h, a = Decimal(1)/denominator, Decimal(".5")
        coords = tuple(Decimal(str(v)) for v in CORE)
        def p_component(x, component):
            radius = sum(v*v for v in x).sqrt()
            require(radius > a, "decimal stencil outside throat required")
            return x[component]/(radius*radius*(radius+a))
        def derivative(x, axis, component):
            total = Decimal(0)
            for offset, weight in ((-2, 1), (-1, -8), (1, 8), (2, -1)):
                y = list(x)
                y[axis] += offset*h
                total += weight*p_component(y, component)
            return total/(12*h)
        for ijk in product(range(5), repeat=3):
            x = tuple(coords[i] for i in ijk)
            radius = sum(v*v for v in x).sqrt()
            alpha, chi = (radius-a)/(radius+a), (radius/(radius+a))**4
            coefficient = Decimal(".2")*alpha*alpha*chi
            for k in range(3):
                for i in range(3):
                    result[(*ijk, k, i)] = float(coefficient*(derivative(x, k, i)-derivative(x, i, k)))
    return result


def core_indices(grid):
    vectors = []
    for axis in range(3):
        positions = (np.asarray(CORE)-grid.lower[axis])/grid.spacing[axis]
        indices = np.rint(positions).astype(int)
        require(np.max(abs(positions-indices)) <= 2.e-12
                and np.all(indices >= 2) and np.all(indices < grid.shape[axis]-2), "exact active core nodes required")
        vectors.append(indices)
    return np.ix_(*vectors)


def inspect_initial(data, native_rhs, decimal_source):
    """Check all nine B slots on the entire cube and on the fixed core."""
    q, rhs = np.asarray(data.slots), np.asarray(native_rhs)
    require(q.shape == rhs.shape and q.ndim == 4 and q.shape[0] == 58
            and np.all(np.isfinite(q)) and np.all(np.isfinite(rhs)), "58 finite state/RHS arrays required")
    require(data.domain is not None and data.domain.mass == 1.
            and data.header["time"] == 0. and data.header["step"] == 0
            and data.header["spatial_order"] == 4 and data.header["solver_mode"] == 1,
            "static initial FD4 dynamic checkpoint required")
    require(data.profile is not None and data.profile.shift_scale == 3.
            and data.profile.ordering_scale == .2 and data.tau_inverse == 1., "frozen gauge/control required")
    expected_nonzero = {0, 3, 5, 6, 10, 25, 26, 27, 55, 56, 57}
    require(all(np.all(q[i] == 0.) for i in range(58) if i not in expected_nonzero)
            and all(np.all(q[i] == 1.) for i in (0, 3, 5)), "static conformally flat zero-shift initial data required")
    grid = data.domain.grid(data.header["points"], 4)
    require(q.shape[1:] == grid.shape, "matching cubic grid required")
    xyz = np.stack(grid.coordinates, axis=-1)
    analytic = radial_fields(xyz)
    initial_errors = {"lapse": float(np.max(abs(np.exp(q[6])-analytic["lapse"]))),
        "chi": float(np.max(abs(np.exp(2*q[10])-analytic["chi"]))),
        "P": float(np.max(abs(np.moveaxis(q[55:58], 0, -1)-analytic["P"]))),
        "A": float(np.max(abs(np.moveaxis(q[25:28], 0, -1)-analytic["A"])))}
    require(max(initial_errors.values()) <= 2.e-14, "independent analytic initial check failed")
    predicted = np.zeros((*grid.shape, 3, 3))
    interior = (slice(2, -2),)*3
    predicted[interior] = source_at_points(xyz[interior], grid.spacing[0])
    observed = np.moveaxis(rhs[28:37], 0, -1).reshape((*grid.shape, 3, 3))
    core = core_indices(grid)
    dc = np.asarray(decimal_source)
    require(dc.shape == (5, 5, 5, 3, 3) and np.all(np.isfinite(dc)), "complete finite decimal core required")
    errors = {"full_B_source": float(np.max(abs(observed-predicted))),
        "decimal_B_source": float(np.max(abs(observed[core]-dc))),
        "prediction_decimal": float(np.max(abs(predicted[core]-dc))),
        "antisymmetry": float(np.max(abs(observed+np.swapaxes(observed, -1, -2)))),
        "continuum_curl": float(np.max(abs(analytic["dP"]-np.swapaxes(analytic["dP"], -1, -2))))}
    rows = []
    for k, i in product(range(3), repeat=2):
        actual, oracle = observed[core][..., k, i], dc[..., k, i]
        rows.append({"slot": 28+3*k+i, "k": k, "i": i,
            "rms": float(np.sqrt(np.mean(actual**2))), "decimal_rms": float(np.sqrt(np.mean(oracle**2))),
            "max_abs_error": float(np.max(abs(observed[..., k, i]-predicted[..., k, i]))),
            "core_values": actual.ravel().tolist(), "decimal_core_values": oracle.ravel().tolist()})
    halo = np.ones(grid.shape, dtype=bool)
    halo[interior] = False
    exact_controls = {"diagonal_zero": bool(np.all(np.diagonal(observed, axis1=-2, axis2=-1) == 0.)),
        "halo_zero": bool(np.all(observed[halo] == 0.)), "decimal_antisymmetric": bool(np.all(dc == -np.swapaxes(dc, -1, -2)))}
    return {"initial_errors": initial_errors, "source_errors": errors, "exact_controls": exact_controls,
        "slots": rows, "core_rms": float(np.sqrt(np.mean(observed[core]**2))),
        "source_contract_passed": all(v <= LIMIT for v in errors.values()) and all(exact_controls.values()),
        "core_node_count": 125, "evolution_steps": 0, "physical_validation": False}
