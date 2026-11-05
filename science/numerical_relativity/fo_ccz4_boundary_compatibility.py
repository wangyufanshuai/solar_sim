"""Analytic-input static lapse oracle; not a boundary condition or evolution RHS."""
from __future__ import annotations

from decimal import Decimal, localcontext
from itertools import product
import math

import numpy as np

from . import fo_ccz4_boundary_stage_channels as C

LIMIT, STATE_LIMIT = 2.e-12, 2.e-14
CORE = (1.5, 1.75, 2., 2.25, 2.5)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def radial(points, mass=1.):
    require(not np.iscomplexobj(points), "real coordinates required")
    x = np.asarray(points, dtype=float)
    require(x.ndim >= 1 and x.shape[-1] == 3 and x.size > 0
            and np.all(np.isfinite(x)) and math.isfinite(mass) and mass > 0.,
            "finite coordinates and positive mass required")
    r = np.sqrt(np.sum(x*x, axis=-1))
    a = mass/2.
    require(np.all(r > a), "stencil must stay outside the throat")
    alpha, chi = (r-a)/(r+a), (r/(r+a))**4
    A = mass*x/(r*(r*r-a*a))[..., None]
    P = mass*x/(r*r*(r+a))[..., None]
    div_A = -2.*mass*a*a/(r*(r*r-a*a)**2)
    return {"alpha": alpha, "chi": chi, "A": A, "P": P, "div_A": div_A}


def source_at_points(points, spacing, mass=1.):
    """Qdot=-Lap(alpha); direct weighted analytic samples, no native rates."""
    require(math.isfinite(spacing) and spacing > 0., "positive finite spacing required")
    f = radial(points, mass)
    x = np.asarray(points, dtype=float)
    divergence = np.zeros(x.shape[:-1])
    for axis in range(3):
        term = np.zeros_like(divergence)
        for offset, weight in ((-2, 1.), (-1, -8.), (1, 8.), (2, -1.)):
            y = x.copy()
            y[..., axis] += offset*spacing
            term += weight*radial(y, mass)["A"][..., axis]
        divergence += term/(12.*spacing)
    algebraic = np.sum(f["A"]*f["A"]-f["P"]*f["A"], axis=-1)
    discrete = -f["alpha"]*f["chi"]*(divergence+algebraic)
    continuum = -f["alpha"]*f["chi"]*(f["div_A"]+algebraic)
    require(np.all(np.isfinite(discrete)) and np.all(np.isfinite(continuum)), "nonfinite lapse source")
    return discrete, continuum


def decimal_core_source(denominator, precision=60):
    require(type(denominator) is int and denominator in (8, 12, 16), "declared spacing required")
    require(type(precision) is int and precision >= 40, "at least40 decimal digits required")
    result = np.zeros((5, 5, 5))
    with localcontext() as context:
        context.prec = precision
        h, a = Decimal(1)/denominator, Decimal(".5")
        coords = tuple(Decimal(str(v)) for v in CORE)
        def fields(x):
            r = sum(v*v for v in x).sqrt()
            alpha, chi = (r-a)/(r+a), (r/(r+a))**4
            A = [v/(r*(r*r-a*a)) for v in x]
            P = [v/(r*r*(r+a)) for v in x]
            return alpha, chi, A, P
        for ijk in product(range(5), repeat=3):
            x = tuple(coords[k] for k in ijk)
            alpha, chi, A, P = fields(x)
            div = Decimal(0)
            for axis in range(3):
                term = Decimal(0)
                for offset, weight in ((-2, 1), (-1, -8), (1, 8), (2, -1)):
                    y = list(x)
                    y[axis] += offset*h
                    term += weight*fields(y)[2][axis]
                div += term/(12*h)
            result[ijk] = float(-alpha*chi*(div+sum(v*v-p*v for v, p in zip(A, P, strict=True))))
    return result


def scalar_cube(value):
    require(not np.iscomplexobj(value), "real scalar cube required")
    q = np.asarray(value, dtype=float)
    require(q.ndim == 3 and len(set(q.shape)) == 1 and q.shape[0] >= 9
            and np.all(np.isfinite(q)), "finite cubic scalar with at least9 nodes required")
    return q


def gradient_active(value, spacing):
    q = scalar_cube(value)
    require(math.isfinite(spacing) and spacing > 0., "positive finite spacing required")
    n = len(q)
    derivatives = []
    for axis in range(3):
        out = np.zeros((n-4,)*3)
        for offset, weight in ((-2, 1.), (-1, -8.), (1, 8.), (2, -1.)):
            indices = [slice(2, n-2)]*3
            indices[axis] = slice(2+offset, n-2+offset)
            out += weight*q[tuple(indices)]
        derivatives.append(out/(12.*spacing))
    result = np.stack(derivatives)
    require(np.all(np.isfinite(result)), "nonfinite scalar derivative")
    return result


def stats(values):
    q = np.asarray(values, dtype=float)
    require(q.size > 0 and np.all(np.isfinite(q)), "finite nonempty statistic required")
    return {"rms": C.rms(q), "max_abs": float(np.max(abs(q))),
            "minimum": float(q.min()), "maximum": float(q.max())}


def q_rate(k1):
    q = C.fields(k1)
    return q[17]-2.*q[18]+q[11]+q[14]+q[16]


def inspect_initial(q0, k1, xyz, spacing, core, decimal_source):
    q, k = C.fields(q0), C.fields(k1)
    require(q.shape == k.shape and np.shape(xyz) == (*q.shape[1:], 3), "matching grid fields required")
    nonzero = {0, 3, 5, 6, 10, 25, 26, 27, 55, 56, 57}
    require(all(np.all(q[s] == 1.) for s in (0, 3, 5))
            and all(np.all(q[s] == 0.) for s in range(58) if s not in nonzero),
            "static zero-shift conformally flat slice required")
    require(all(np.all(k[s] == 0.) for s in range(58) if s not in C.SOURCE_SLOTS),
            "unsupported initial source channel")
    f = radial(xyz)
    initial_error = max(float(np.max(abs(np.exp(q[6])-f["alpha"]))),
        float(np.max(abs(np.exp(2.*q[10])-f["chi"]))),
        float(np.max(abs(np.moveaxis(q[25:28], 0, -1)-f["A"]))),
        float(np.max(abs(np.moveaxis(q[55:58], 0, -1)-f["P"]))),)
    require(initial_error <= STATE_LIMIT, "analytic initial fields differ")
    raw, continuum = source_at_points(xyz, spacing)
    active = np.zeros(raw.shape, dtype=bool)
    active[2:-2, 2:-2, 2:-2] = True
    predicted, observed = np.where(active, raw, 0.), q_rate(k)
    dc = np.asarray(decimal_source)
    require(dc.shape == (5, 5, 5) and np.all(np.isfinite(dc)) and observed[core].shape == dc.shape,
            "complete finite125-node decimal core required")
    errors = {"native_Qdot": float(np.max(abs(observed-predicted))),
        "native_trace_adot": float(np.max(abs(k[11]+k[14]+k[16]))),
        "decimal_Qdot": float(np.max(abs(observed[core]-dc))),
        "double_decimal": float(np.max(abs(raw[core]-dc))),
        "continuum_Laplace": float(np.max(abs(continuum)))}
    require(np.all(observed[~active] == 0.), "fixed initial halo source must be zero")
    passed = all(v <= (STATE_LIMIT if name == "continuum_Laplace" else LIMIT) for name, v in errors.items())
    return {"initial_max_error": initial_error, "errors": errors, "source_prediction_passed": passed,
        "native_active_Qdot": stats(observed[active]), "unclamped_halo_oracle": stats(raw[~active]),
        "core_values": observed[core].ravel().tolist(), "decimal_core_values": dc.ravel().tolist(),
        "active_node_count": int(active.sum()), "core_node_count": 125,
        "physical_validation": False, "new_evolution_steps": 0}, raw, active


def inspect_pair(left, right, dt=1./256.):
    require(set(left) == set(right) == {"state", "raw_Qdot", "active_mask"}, "complete pair required")
    # Existing full58 matching-state reduction is a scope control, not the new oracle.
    prior = C.inspect_pair(left["state"], right["state"], dt=dt)
    a, b = scalar_cube(left["raw_Qdot"]), scalar_cube(right["raw_Qdot"])
    masks = [np.asarray(side["active_mask"]) for side in (left, right)]
    require(a.shape == b.shape == masks[0].shape == masks[1].shape
            and all(m.dtype == bool for m in masks), "matching boolean activity masks required")
    n = len(a)
    require(left["state"]["q0"].shape[1:] == a.shape, "state and oracle grid differ")
    mL, mR = masks
    h = 2./(n-1)
    delta = mL*a-mR*b
    shell = (mL.astype(float)-mR.astype(float))*b
    coordinate = mL*(a-b)
    prediction = -dt*gradient_active(delta, h)
    shell_prediction = -dt*gradient_active(shell, h)
    coordinate_prediction = -dt*gradient_active(coordinate, h)
    observed = (left["state"]["k2"]-right["state"]["k2"])[25:28, 2:-2, 2:-2, 2:-2]
    residual = observed-prediction
    outside = observed[:, 2:-2, 2:-2, 2:-2]
    values = {"observed": observed, "predicted": prediction, "residual": residual,
        "shell": shell_prediction, "coordinate": coordinate_prediction,
        "shell_only_residual": observed-shell_prediction,
        "additivity_error": prediction-shell_prediction-coordinate_prediction}
    indices = np.rint((np.asarray(CORE)-1.)/h).astype(int)-2
    core = np.ix_(np.arange(3), indices, indices, indices)
    result = {name: stats(v) for name, v in values.items()}
    result["signed_core"] = {name: v[core].reshape(3, 125).tolist() for name, v in values.items()}
    passed = prior["prediction_passed"] and result["residual"]["max_abs"] <= LIMIT
    passed &= result["additivity_error"]["max_abs"] <= LIMIT and float(np.max(abs(outside))) <= LIMIT
    result.update(prediction_passed=bool(passed), parent_reduction_passed=prior["prediction_passed"],
        source_shell_node_count=int(np.count_nonzero(mL != mR)),
        outside_two_active_layers=stats(outside), active_node_count=(n-4)**3, core_node_count=125,
        interpretation=("unresolved-at-floor" if result["observed"]["max_abs"] <= LIMIT else
            "fixed-layer-source-compatible" if passed and result["shell_only_residual"]["max_abs"] <= LIMIT else
            "unexplained"), physical_validation=False, new_evolution_steps=0)
    return result
