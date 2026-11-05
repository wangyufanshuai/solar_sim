"""Read-only log-determinant balance, never an evolution or projection rule."""
from __future__ import annotations

import numpy as np

TERMS = ("transport", "reduction_forcing", "chain_rule", "damping")
FIELDS = ("log_determinant", "rhs_trace", *TERMS, "predicted_rhs", "balance_residual")
NUMERICAL_FLOOR = 2.e-14


def require(condition, message):
    if not condition:
        raise ValueError(message)


def real(value, name):
    a = np.asarray(value)
    require(a.dtype.kind in "fiu" and a.size > 0 and np.all(np.isfinite(a)), name+" must be nonempty finite real")
    return np.asarray(a, dtype=np.float64)


def decompose(metric, auxiliary_d, shift, metric_rhs, derivative, tau_inverse):
    """D[...,k,i,j], beta[...,k]; derivative(values, axis) is read-only.

    ell_dot = beta.d(ell) + 2 beta.h^-1.C_D
              + beta.(h^-1.d(h)-d(ell)) - 3 tau_inverse (det(h)-1).
    """
    h, d, beta, rhs = (real(v, k) for v, k in zip(
        (metric, auxiliary_d, shift, metric_rhs), ("metric", "D", "shift", "metric RHS"), strict=True))
    require(h.ndim == 5 and h.shape[-2:] == (3, 3), "three spatial axes and symmetric metric indices required")
    shape = h.shape[:3]
    require(d.shape == (*shape, 3, 3, 3) and beta.shape == (*shape, 3) and rhs.shape == h.shape, "balance field layout mismatch")
    require(np.array_equal(h, np.swapaxes(h, -1, -2)) and np.all(np.linalg.eigvalsh(h) > 0.), "symmetric positive metric required")
    require(np.array_equal(d, np.swapaxes(d, -1, -2)) and np.array_equal(rhs, np.swapaxes(rhs, -1, -2)),
            "symmetric D and metric RHS required")
    require(type(tau_inverse) in (float, int) and np.isfinite(tau_inverse) and tau_inverse >= 0. and callable(derivative),
            "finite nonnegative damping and derivative callback required")
    determinant = np.linalg.det(h)
    require(np.all(np.isfinite(determinant)) and np.all(determinant > 0.), "finite positive determinant required")
    # This is the log of the computed FP64 determinant; no precision upgrade
    # or exact det(h)=1 assertion is made for near-roundoff static trajectories.
    ell = np.log(determinant)
    inverse = np.linalg.inv(h)
    dh, dell = [], []
    for axis in range(3):
        first, scalar = real(derivative(h, axis), "metric derivative"), real(derivative(ell, axis), "logdet derivative")
        require(first.shape == h.shape and scalar.shape == shape, "derivative layout mismatch")
        dh.append(first)
        dell.append(scalar)
    dh, dell = np.stack(dh, axis=-3), np.stack(dell, axis=-1)
    reduced = d-.5*dh
    trace_dh = np.einsum("...ij,...kij->...k", inverse, dh)
    forcing = 2.*np.einsum("...k,...ij,...kij->...", beta, inverse, reduced)
    transport = np.sum(beta*dell, axis=-1)
    chain = np.sum(beta*(trace_dh-dell), axis=-1)
    damping = -3.*tau_inverse*(determinant-1.)
    observed = np.einsum("...ij,...ij->...", inverse, rhs)
    predicted = transport+forcing+chain+damping
    result = dict(log_determinant=ell, rhs_trace=observed, transport=transport,
                  reduction_forcing=forcing, chain_rule=chain, damping=damping,
                  predicted_rhs=predicted, balance_residual=observed-predicted)
    require(all(np.all(np.isfinite(v)) for v in result.values()), "nonfinite determinant balance")
    return result


def integrate_trapezoid(times, values):
    t, v = real(times, "sample times"), real(values, "integrand samples")
    require(t.ndim == 1 and len(t) >= 2 and v.ndim >= 1 and v.shape[0] == len(t)
            and np.all(np.diff(t) > 0.), "ordered distinct times matching samples required")
    dt = np.diff(t).reshape((-1,)+(1,)*(v.ndim-1))
    result = np.sum(.5*dt*(v[:-1]+v[1:]), axis=0)
    require(np.all(np.isfinite(result)), "nonfinite time integral")
    return result


def signed_budget(observed, contributions, weights):
    """Signed projections onto observed change, not nonnegative percentages.

    A contribution may exceed one or be negative. Unresolved observed change
    cannot be used as a denominator. Reconstruction error is never hidden.
    """
    delta, w = real(observed, "observed change"), real(weights, "weights")
    require(delta.shape == w.shape and np.all(w > 0.) and contributions, "matching positive weights and contributions required")
    terms = {k: real(v, "contribution") for k, v in contributions.items()}
    require(all(v.shape == delta.shape for v in terms.values()), "contribution shape mismatch")
    total_w = np.sum(w)
    square = float(np.sum(w*delta**2)/total_w)
    observed_rms = float(np.sqrt(square))
    resolved = observed_rms > NUMERICAL_FLOOR
    reconstructed = sum(terms.values())
    residual = float(np.sqrt(np.sum(w*(delta-reconstructed)**2)/total_w))
    projections = {k: float(np.sum(w*delta*v)/total_w/square) for k, v in terms.items()} if resolved else None
    return dict(observed_rms=observed_rms, floor=NUMERICAL_FLOOR, resolved=resolved,
                reconstruction_residual_rms=residual, signed_projections=projections,
                projection_sum=sum(projections.values()) if resolved else None,
                interpretation="signed projection onto the measured change, not independent causal percentages")


def identity():
    return dict(method="fo-ccz4-logdet-balance-v1", logdet="log of computed FP64 determinant",
                time_quadrature="composite trapezoid on accepted states only",
                changes_evolution_rhs=False, projection_applied=False,
                physical_validation=False, runtime_writeback=False)
