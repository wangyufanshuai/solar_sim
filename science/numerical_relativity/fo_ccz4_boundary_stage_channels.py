"""Restricted first-step boundary response, not an evolution/boundary operator.

Eq.(12) spatial terms at h=I, beta=D=0 predict the k2 difference when local
s2 values match. The custom gauge's global hyperbolicity is not established.
No production RHS, derivative or principal-symbol implementation is imported.
"""
from __future__ import annotations

import hashlib
import math

import numpy as np

LIMIT, STATE_LIMIT = 2.e-12, 2.e-14
PAIRS = tuple((i, j) for i in range(3) for j in range(i, 3))
CHANNELS = {"a": tuple(range(11, 17)), "K": (17,), "Theta": (18,), "B": tuple(range(28, 37))}
SOURCE_SLOTS = tuple(s for slots in CHANNELS.values() for s in slots)
OUTPUTS = {"GammaHat": tuple(range(19, 22)), "b": tuple(range(22, 25)),
           "A_aux": tuple(range(25, 28)), "D": tuple(range(37, 55)), "P": tuple(range(55, 58))}
OUTPUTS["other"] = tuple(s for s in range(58) if not any(s in v for v in OUTPUTS.values()))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def fields(value):
    require(not np.iscomplexobj(value), "real fields required")
    q = np.asarray(value, dtype=float)
    require(q.ndim == 4 and q.shape[0] == 58 and len(set(q.shape[1:])) == 1
            and q.shape[1] >= 9 and np.all(np.isfinite(q)), "58 finite cubic fields required")
    return q


def fd4_interior(value, spacing):
    """Direct four-point weighted derivative, output (axis,slot,n-4,n-4,n-4)."""
    q = fields(value)
    require(math.isfinite(spacing) and spacing > 0., "positive finite spacing required")
    n = q.shape[1]
    result = []
    for axis in range(3):
        derivative = np.zeros((58, n-4, n-4, n-4))
        for offset, weight in ((-2, 1.), (-1, -8.), (1, 8.), (2, -1.)):
            slices = [slice(2, n-2)]*3
            slices[axis] = slice(2+offset, n-2+offset)
            derivative += weight*q[(slice(None), *slices)]
        result.append(derivative/(12.*spacing))
    output = np.stack(result)
    require(np.all(np.isfinite(output)), "nonfinite derivative")
    return output


def reduced_response(gradient, lapse):
    """Spatial response of ONLY a,K,Theta,B perturbations at matching s2 nodes."""
    require(not np.iscomplexobj(gradient) and not np.iscomplexobj(lapse), "real response inputs required")
    g, alpha = np.asarray(gradient, dtype=float), np.asarray(lapse, dtype=float)
    require(g.ndim == 5 and g.shape[:2] == (3, 58) and g.shape[2:] == alpha.shape
            and alpha.size > 0 and np.all(np.isfinite(g)) and np.all(np.isfinite(alpha))
            and np.all((alpha > 0.) & (alpha < 2.)), "finite matching derivatives and 0<lapse<2 required")
    require(all(np.all(g[:, s] == 0.) for s in range(58) if s not in SOURCE_SLOTS),
            "reduction supports only a,K,Theta,B derivative channels")
    result = np.zeros((58, *alpha.shape))
    trace = g[:, 11]+g[:, 14]+g[:, 16]
    def bslot(k, i):
        return 28+3*k+i
    symdiv = np.stack([sum((g[k, bslot(j, j)]+g[j, bslot(k, j)])/2. for j in range(3))
                      for k in range(3)])
    for k in range(3):
        gamma = alpha*(-4./3.*g[k, 17]+2.*g[k, 18]+2.*trace[k])
        gamma += sum(g[j, bslot(j, k)] for j in range(3))+symdiv[k]/3.
        result[19+k] = gamma
        result[22+k] = gamma
        result[25+k] = -2.*g[k, 17]+4.*g[k, 18]-2.*trace[k]
        result[55+k] = alpha*(g[k, 17]+trace[k])/3.-symdiv[k]/3.
        for p, (i, j) in enumerate(PAIRS):
            value = -alpha*g[k, 11+p]
            value += (g[k, bslot(j, i)]+g[j, bslot(k, i)]
                      + g[k, bslot(i, j)]+g[i, bslot(k, j)])/4.
            if i == j:
                value += alpha*trace[k]/3.-symdiv[k]/3.
            result[37+6*k+p] = value
    require(np.all(np.isfinite(result)), "nonfinite response")
    return result


def channel_responses(delta_k1, lapse, dt):
    q = fields(delta_k1)
    require(math.isfinite(dt) and dt > 0., "positive finite timestep required")
    g = fd4_interior(q, 2./(q.shape[1]-1))*(dt/2.)
    total = reduced_response(g, lapse)
    pieces = {}
    for name, slots in CHANNELS.items():
        part = np.zeros_like(g)
        part[:, slots] = g[:, slots]
        pieces[name] = reduced_response(part, lapse)
    require(np.max(abs(sum(pieces.values())-total)) <= LIMIT, "channel additivity failed")
    return total, pieces


def rms(value):
    a = np.asarray(value, dtype=float)
    require(a.size > 0 and np.all(np.isfinite(a)), "finite nonempty norm input required")
    maximum = float(np.max(abs(a)))
    return 0. if maximum == 0. else float(maximum*np.sqrt(np.mean((a/maximum)**2)))


def summary(value):
    q = np.asarray(value, dtype=float)
    require(q.ndim == 4 and q.shape[0] == 58 and q.size > 0 and np.all(np.isfinite(q)),
            "finite 58-slot summary required")
    return {"rms": rms(q), "max_abs": float(np.max(abs(q))),
        "by_output_family": {k: {"rms": rms(q[list(v)]), "max_abs": float(np.max(abs(q[list(v)])))}
                             for k, v in OUTPUTS.items()},
        "by_slot": [{"slot": s, "rms": rms(q[s]), "max_abs": float(np.max(abs(q[s]))),
                     "minimum": float(q[s].min()), "maximum": float(q[s].max())} for s in range(58)]}


def inspect_pair(left, right, *, dt=1./256.):
    """Each side maps q0,k1,s2,k2 to an unchanged exact crop of the original cube."""
    require(set(left) == set(right) == {"q0", "k1", "s2", "k2"}, "q0,k1,s2,k2 required")
    a, b = ({k: fields(v) for k, v in side.items()} for side in (left, right))
    shape, n = a["q0"].shape, a["q0"].shape[1]
    require(n in (17, 25, 33) and dt == 1./256. and all(v.shape == shape for side in (a, b) for v in side.values()),
            "declared N17/25/33 and dt=1/256 required")
    active = (slice(None), slice(2, -2), slice(2, -2), slice(2, -2))
    initial_nonzero = {0, 3, 5, 6, 10, 25, 26, 27, 55, 56, 57}
    stage_errors = []
    for side in (a, b):
        q = side["q0"]
        require(all(np.all(q[s] == 1.) for s in (0, 3, 5))
                and all(np.all(q[s] == 0.) for s in range(58) if s not in initial_nonzero),
                "static conformally flat initial state required")
        require(all(np.all(side["k1"][s] == 0.) for s in range(58) if s not in SOURCE_SLOTS),
                "initial rates outside supported channels")
        error = float(np.max(abs(side["s2"]-(q+.5*dt*side["k1"]))))
        require(error <= STATE_LIMIT, "s2 is not the first RK half-stage")
        stage_errors.append(error)
    initial_error = float(np.max(abs(a["q0"]-b["q0"])))
    local_error = float(np.max(abs((a["s2"]-b["s2"])[active])))
    delta_k1 = a["k1"]-b["k1"]
    active_rate_error = float(np.max(abs(delta_k1[active])))
    require(initial_error <= STATE_LIMIT and local_error <= STATE_LIMIT and active_rate_error <= LIMIT,
            "matching original active states/rates required")
    predicted, channels = channel_responses(delta_k1, np.exp(b["s2"][active][6]), dt)
    observed = (a["k2"]-b["k2"])[active]
    residual, b_residual = observed-predicted, observed-channels["B"]
    values = {"observed": observed, "predicted": predicted, "residual": residual,
              "B_only_residual": b_residual, **{f"source_{k}": v for k, v in channels.items()}}
    result = {name: summary(v) for name, v in values.items()}
    positions = np.rint((np.array([1.5, 1.75, 2., 2.25, 2.5])-1.)*(n-1)/2.).astype(int)-2
    core = np.ix_(np.arange(58), positions, positions, positions)
    result["signed_core"] = {name: {"values": v[core].reshape(58, 125).tolist(),
        "sha256": hashlib.sha256(np.ascontiguousarray(v[core], dtype="<f8").tobytes()).hexdigest()}
        for name, v in values.items()}
    result.update(initial_max_abs_difference=initial_error, s2_active_max_abs_difference=local_error,
        k1_active_max_abs_difference=active_rate_error, stage_identity_errors=stage_errors,
        active_node_count=(n-4)**3, core_node_count=125,
        prediction_passed=bool(np.max(abs(residual)) <= LIMIT),
        B_only_status=("unresolved" if np.max(abs(observed)) <= LIMIT else
                       "sufficient-at-floor" if np.max(abs(b_residual)) <= LIMIT else "insufficient"),
        scope="first-k2-shared-active-spatial-response", physical_validation=False,
        causal_speed_measured=False, new_evolution_steps=0)
    return result
