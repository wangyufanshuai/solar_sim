"""Common-position and boundary-location diagnostics for a longer NR window.

No equations or boundary prescriptions are modified by this audit. The two
boxes share exact nodes at the same spacing; no interpolation is permitted.
"""
from __future__ import annotations

import numpy as np

from .fo_ccz4_checkpoint import SYMMETRIC
from .fo_ccz4_exterior_audit import physical_fields, derivative, tensor, norms
from .fo_ccz4_schwarzschild import analytic_slots, analytic_ricci_and_kretschmann, halo_mask

TIMES = (.125, .25, .5, 1.)
CORE = (1.5, 1.75, 2., 2.25, 2.5)
LINE = (1.25, 1.5, 1.75, 2., 2.25, 2.5, 2.75)
PRIMARY = ("state", "H", "M", "ricci_error", "weyl_invariant_error")
METRICS = (*PRIMARY, "A", "B", "D", "P", "Ghat", "det_h", "trace_a", "Theta")


def indices(grid, values, axis=0):
    values = np.asarray(values, dtype=float)
    if not np.all(np.isfinite(values)):
        raise ValueError("finite diagnostic positions required")
    offsets = (values-grid.lower[axis])/grid.spacing[axis]
    chosen = np.rint(offsets).astype(int)
    if (np.any(chosen < 0) or np.any(chosen >= grid.shape[axis])
            or not np.allclose(offsets, chosen, rtol=0., atol=2.e-12)):
        raise ValueError("diagnostic positions must be exact in-domain nodes; interpolation forbidden")
    return chosen


def core_values(values, grid):
    return values[np.ix_(*(indices(grid, CORE, axis) for axis in range(3)))]


def audit_fields(data):
    if data.domain is None or data.domain.mass != 1.:
        raise ValueError("explicit mass-one Schwarzschild domain required")
    grid = data.domain.grid(data.header["points"], data.header["spatial_order"])
    q = np.asarray(data.slots)
    exact = analytic_slots(grid.shape[0], grid.spatial_order, data.domain)
    geometric = physical_fields(q, grid)
    ricci_exact, invariant_exact = analytic_ricci_and_kretschmann(grid, data.domain.mass)
    h, a = tensor(q, 0), tensor(q, 11)
    hi = np.linalg.inv(h)
    dh = [derivative(h, grid, k) for k in range(3)]
    contracted = np.zeros((*grid.shape, 3))
    for upper in range(3):
        for first in range(3):
            for second in range(3):
                contracted[..., upper] += .5*hi[..., first, second]*sum(hi[..., upper, ell]*(
                    dh[first][..., ell, second]+dh[second][..., ell, first]-dh[ell][..., first, second])
                    for ell in range(3))
    fields = {"state": np.moveaxis(q-exact, 0, -1), "H": geometric["H"], "M": geometric["M"],
              "ricci_error": geometric["ricci"]-ricci_exact,
              "weyl_invariant_error": geometric["vacuum_weyl_invariant"]-invariant_exact,
              "A": np.stack([q[25+i]-derivative(q[6], grid, i) for i in range(3)], axis=-1),
              "B": np.stack([q[28+3*k+i]-derivative(q[7+i], grid, k)
                             for k in range(3) for i in range(3)], axis=-1),
              "D": np.stack([q[37+6*k+v]-.5*dh[k][..., i, j]
                             for k in range(3) for v, (i, j) in enumerate(SYMMETRIC)], axis=-1),
              "P": np.stack([q[55+i]-derivative(q[10], grid, i) for i in range(3)], axis=-1),
              "Ghat": np.moveaxis(q[19:22], 0, -1)-contracted,
              "det_h": np.linalg.det(h)-1., "trace_a": np.einsum("...ij,...ij->...", hi, a), "Theta": q[18]}
    if set(fields) != set(METRICS) or not all(np.all(np.isfinite(v)) for v in fields.values()):
        raise ValueError("incomplete/nonfinite window diagnostics")
    return fields, grid


def diagnostics(data):
    fields, grid = audit_fields(data)
    line_i, center_j, center_k = indices(grid, LINE), indices(grid, (2.,), 1)[0], indices(grid, (2.,), 2)[0]
    profile = {}
    for key, value in fields.items():
        sampled = value[line_i, center_j, center_k].reshape((len(LINE), -1))
        profile[key] = np.sqrt(np.mean(sampled**2, axis=1)).tolist()
    mask = halo_mask(grid.shape)
    q = np.asarray(data.slots)
    alpha, chi = np.exp(q[6]), np.exp(2*q[10])
    return {"time": data.header["time"], "step": data.header["step"],
            "core": {k: norms(core_values(v, grid)) for k, v in fields.items()},
            "line_x": list(LINE), "line_yz": [2., 2.], "line_rms_by_component": profile,
            "all_active_state_error": norms(fields["state"][~mask]),
            "halo_error_linf": float(np.max(np.abs(fields["state"][mask]))),
            "alpha_range": [float(alpha.min()), float(alpha.max())],
            "chi_range": [float(chi.min()), float(chi.max())],
            "core_points": 125, "physical_validation": False}


def boundary_location_difference(base, expanded):
    if (base.header["time"] != expanded.header["time"] or base.header["dt"] != expanded.header["dt"]
            or base.header["spatial_order"] != expanded.header["spatial_order"]
            or base.tau_inverse != expanded.tau_inverse or base.profile != expanded.profile):
        raise ValueError("boundary comparison requires equal time, timestep, stencil, gauge and control")
    left, grid = audit_fields(base)
    right, other_grid = audit_fields(expanded)
    if grid.spacing != other_grid.spacing:
        raise ValueError("boundary comparison requires equal grid spacing")
    result = {}
    for name in METRICS:
        a, b = core_values(left[name], grid), core_values(right[name], other_grid)
        difference, baseline = norms(a-b)["l2"], norms(a)["l2"]
        result[name] = {"rms_difference": difference, "baseline_error": baseline,
                        "ratio_to_baseline": difference/max(baseline, 2.e-12),
                        "resolved_above_floor": difference > 2.e-12}
    return {"time": base.header["time"], "spacing": list(grid.spacing), "metrics": result,
            "physical_boundary_validated": False}


def timestep_difference(coarse, fine):
    if (coarse.domain != fine.domain or coarse.header["points"] != fine.header["points"]
            or coarse.header["spatial_order"] != fine.header["spatial_order"]
            or coarse.header["time"] != fine.header["time"] or coarse.header["dt"] != 2*fine.header["dt"]
            or coarse.profile != fine.profile or coarse.tau_inverse != fine.tau_inverse):
        raise ValueError("matched timestep pair required")
    fields, grid = audit_fields(coarse)
    other, _ = audit_fields(fine)
    result = {}
    for name in METRICS:
        a, b = core_values(fields[name], grid), core_values(other[name], grid)
        difference = norms(a-b)["l2"]
        baseline = norms(a)["l2"]
        fine_norm = norms(b)["l2"]
        ratio = difference/max(baseline, 2.e-12)
        result[name] = {"rms_difference": difference, "coarse_norm": baseline, "fine_norm": fine_norm,
                       "ratio": ratio, "passed": max(baseline, fine_norm) <= 2.e-12 or ratio <= .05}
    return {"time": coarse.header["time"], "metrics": result, "passed": all(r["passed"] for r in result.values())}
