"""General spatial Ricci/ADM diagnostic from metric jets, not an evolution RHS.

Pure Hessian derivatives use SBP D2(4,2); mixed derivatives use the tensor
product of D1(4,2) on two different axes. Inverse-metric derivatives use the
analytic chain rule. The old derivative-of-connection diagnostic is untouched.
The Ricci sign/index convention was checked against SpECTRE Ricci.hpp,
blob f18fe353dd3b50dc5a5e114630a8e3ee3f4e08e1; no external code is executed.
"""
from __future__ import annotations

import numpy as np

from .sbp_boundary_operator import SBP42
from .sbp_second_derivative import SBP42Second


def require(condition, message):
    if not condition:
        raise ValueError(message)


def real_array(value, label):
    require(not np.iscomplexobj(value), label+" must be real")
    result = np.asarray(value, dtype=np.float64)
    require(result.size > 0 and np.all(np.isfinite(result)), label+" must be finite and nonempty")
    return result


def symmetric(value, label):
    scale = max(1., float(np.max(np.abs(value))))
    require(float(np.max(np.abs(value-np.swapaxes(value, -1, -2)))) <= 64*np.finfo(float).eps*scale,
            label+" must be symmetric; no symmetrization is applied")


def physical_metric(metric):
    g = real_array(metric, "metric")
    require(g.ndim >= 2 and g.shape[-2:] == (3, 3), "metric must have trailing 3x3 indices")
    symmetric(g, "metric")
    eigenvalues = np.linalg.eigvalsh(g)
    require(np.all(eigenvalues > 0.) and np.all(eigenvalues[..., -1]/eigenvalues[..., 0] <= 1.e8),
            "positive, numerically conditioned spatial metric required")
    return g


def ricci_from_jets(metric, first, second):
    """first[...,a,i,j], second[...,a,b,i,j]; do not project/symmetrize fields."""
    g = physical_metric(metric)
    shape = g.shape[:-2]
    dg, ddg = real_array(first, "first jet"), real_array(second, "second jet")
    require(dg.shape == (*shape, 3, 3, 3) and ddg.shape == (*shape, 3, 3, 3, 3), "jet layout mismatch")
    symmetric(dg, "first metric jet")
    symmetric(ddg, "second metric jet")
    require(np.max(np.abs(ddg-np.swapaxes(ddg, -4, -3))) <= 64*np.finfo(float).eps*max(1., float(np.max(abs(ddg)))),
            "mixed Hessian indices must be symmetric")
    inverse = np.linalg.inv(g)
    dinverse = -np.einsum("...ip,...apq,...qj->...aij", inverse, dg, inverse)
    connection = np.empty((*shape, 3, 3, 3))
    dconnection = np.empty((*shape, 3, 3, 3, 3))
    for k in range(3):
        for i in range(3):
            for j in range(3):
                connection[..., k, i, j] = .5*sum(inverse[..., k, ell]*(dg[..., i, ell, j]
                    +dg[..., j, ell, i]-dg[..., ell, i, j]) for ell in range(3))
                for a in range(3):
                    dconnection[..., a, k, i, j] = .5*sum(
                        dinverse[..., a, k, ell]*(dg[..., i, ell, j]+dg[..., j, ell, i]-dg[..., ell, i, j])
                        +inverse[..., k, ell]*(ddg[..., a, i, ell, j]+ddg[..., a, j, ell, i]-ddg[..., a, ell, i, j])
                        for ell in range(3))
    ricci = np.empty_like(g)
    for i in range(3):
        for j in range(3):
            ricci[..., i, j] = sum(dconnection[..., k, k, i, j]-dconnection[..., j, k, i, k] for k in range(3))
            ricci[..., i, j] += sum(connection[..., k, i, j]*connection[..., ell, k, ell]
                -connection[..., ell, i, k]*connection[..., k, j, ell] for k in range(3) for ell in range(3))
    scalar = np.einsum("...ij,...ij->...", inverse, ricci)
    require(all(np.all(np.isfinite(a)) for a in (connection, ricci, scalar)), "nonfinite curvature")
    return dict(inverse=inverse, connection=connection, ricci=ricci, scalar=scalar,
                ricci_antisymmetry_max=float(np.max(abs(ricci-np.swapaxes(ricci, -1, -2)))))


def grid_operators(shape, spacing):
    require(len(shape) == 3 and isinstance(spacing, (tuple, list)) and len(spacing) == 3,
            "three spatial axes and spacings required")
    first = tuple(SBP42(n, h) for n, h in zip(shape, spacing, strict=True))
    second = tuple(SBP42Second(n, h) for n, h in zip(shape, spacing, strict=True))
    return first, second


def metric_jets(metric, spacing):
    g = physical_metric(metric)
    first, second = grid_operators(g.shape[:-2], spacing)
    dg = np.stack([op.derivative(g, axis=a) for a, op in enumerate(first)], axis=-3)
    ddg = np.empty((*g.shape[:-2], 3, 3, 3, 3))
    for a in range(3):
        ddg[..., a, a, :, :] = second[a].second_derivative(g, axis=a)
        for b in range(a+1, 3):
            # Canonical tensor-product mixed derivative; no same-axis D1(D1).
            value = first[a].derivative(dg[..., b, :, :], axis=a)
            ddg[..., a, b, :, :] = value
            ddg[..., b, a, :, :] = value
    return dg, ddg


def metric_constraints(metric, extrinsic, spacing):
    g = physical_metric(metric)
    k = real_array(extrinsic, "extrinsic curvature")
    require(k.shape == g.shape, "extrinsic layout mismatch")
    symmetric(k, "extrinsic curvature")
    first, _second = grid_operators(g.shape[:-2], spacing)
    dg, ddg = metric_jets(g, spacing)
    geometry = ricci_from_jets(g, dg, ddg)
    inverse, connection = geometry["inverse"], geometry["connection"]
    mixed = np.einsum("...jk,...ki->...ji", inverse, k)
    trace = np.trace(mixed, axis1=-2, axis2=-1)
    hamiltonian = geometry["scalar"]+trace**2-np.einsum("...ij,...ji->...", mixed, mixed)
    dmixed = [op.derivative(mixed, axis=a) for a, op in enumerate(first)]
    momentum = np.empty((*g.shape[:-2], 3))
    for i in range(3):
        momentum[..., i] = sum(dmixed[j][..., j, i] for j in range(3))-first[i].derivative(trace, axis=i)
        momentum[..., i] += sum(connection[..., j, j, ell]*mixed[..., ell, i]
            -connection[..., ell, j, i]*mixed[..., j, ell] for j in range(3) for ell in range(3))
    require(np.all(np.isfinite(hamiltonian)) and np.all(np.isfinite(momentum)), "nonfinite ADM constraints")
    return dict(Ricci=geometry["ricci"], R_scalar=geometry["scalar"], H_metric_hessian=hamiltonian,
                M_metric=momentum, physical_trace_K=trace,
                ricci_antisymmetry_max=geometry["ricci_antisymmetry_max"])


def constraints_from_slots(values, spacing):
    """Decode canonical58 slots including the full physical extrinsic trace."""
    q = real_array(values, "canonical state")
    require(q.ndim == 4 and q.shape[0] == 58, "canonical (58,nx,ny,nz) layout required")
    shape = q.shape[1:]
    h, a = np.zeros((*shape, 3, 3)), np.zeros((*shape, 3, 3))
    for slot, (i, j) in enumerate((i, j) for i in range(3) for j in range(i, 3)):
        h[..., i, j] = h[..., j, i] = q[slot]
        a[..., i, j] = a[..., j, i] = q[11+slot]
    with np.errstate(over="raise", under="raise", invalid="raise"):
        chi = np.exp(2.*q[10])
    require(np.all(chi > 0.), "positive conformal factor required")
    metric = h/chi[..., None, None]
    extrinsic = (a+h*(q[17]/3.)[..., None, None])/chi[..., None, None]
    return metric_constraints(metric, extrinsic, spacing)


def identity():
    return dict(method="metric-hessian-sbp42-diagnostic-v1", pure_second="sbp-d2-4-2",
                mixed_second="tensor-product-d1-4-2-on-distinct-axes",
                inverse_derivative="analytic-chain-rule", old_H_replaced=False,
                evolution_connected=False, physical_validation=False, runtime_writeback=False)
