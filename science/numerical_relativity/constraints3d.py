"""Metric-based vacuum constraints, separate from the evolved-Gamma RHS."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

import numpy as np

from .bssn3d import _christoffel, _d1
from .nr3d import Array, BSSNState3D


@dataclass(frozen=True)
class ConstraintReport3D:
    hamiltonian: Array
    momentum: Array
    det_h_minus_one: Array
    trace_a: Array
    conformal_gamma: Array
    theta: Array
    valid_mask: Array

    @property
    def norms(self) -> Mapping[str, float]:
        def selected(values: Array) -> Array:
            return values[self.valid_mask]

        def linf(values: Array) -> float:
            return float(np.max(np.abs(selected(values))))

        def l2(values: Array) -> float:
            chosen = selected(values)
            return float(np.sqrt(np.mean(chosen * chosen)))

        return {
            "hamiltonian_l_inf": linf(self.hamiltonian),
            "hamiltonian_l2": l2(self.hamiltonian),
            "momentum_l_inf": linf(self.momentum),
            "momentum_l2": l2(self.momentum),
            "det_h_l_inf": linf(self.det_h_minus_one),
            "trace_a_l_inf": linf(self.trace_a),
            "conformal_gamma_l_inf": linf(self.conformal_gamma),
            "theta_l_inf": linf(self.theta),
        }


def _direct_ricci(metric: Array, inverse: Array, state: BSSNState3D) -> Array:
    christoffel = _christoffel(metric, inverse, state)
    d_christoffel = [_d1(christoffel, state, axis) for axis in range(3)]
    result = np.zeros((*state.grid.shape, 3, 3), dtype=np.float64)
    for first in range(3):
        for second in range(3):
            value = np.zeros(state.grid.shape, dtype=np.float64)
            for derivative_axis in range(3):
                value += d_christoffel[derivative_axis][..., derivative_axis, first, second]
                value -= d_christoffel[second][..., derivative_axis, first, derivative_axis]
                for ell in range(3):
                    value += (
                        christoffel[..., derivative_axis, first, second]
                        * christoffel[..., ell, derivative_axis, ell]
                        - christoffel[..., ell, first, derivative_axis]
                        * christoffel[..., derivative_axis, second, ell]
                    )
            result[..., first, second] = value
    return result


def constraint_report_3d(state: BSSNState3D) -> ConstraintReport3D:
    """Evaluate vacuum BSSN/CCZ4 constraints on valid cells.

    Periodic grids use wrapped centered stencils.  Non-periodic grids use
    second-order one-sided edge stencils and discard one stencil layer around
    excision/outer boundaries from the reported norms; the raw arrays remain
    available for diagnostics.
    """

    if state.grid.boundary not in ("periodic", "excision", "sommerfeld"):
        raise ValueError(f"unsupported constraint boundary: {state.grid.boundary}")
    valid_mask = state.valid_mask.copy()
    if state.grid.boundary != "periodic":
        for axis in range(3):
            lower = np.zeros_like(valid_mask)
            upper = np.zeros_like(valid_mask)
            lower_index = [slice(None)] * 3
            upper_index = [slice(None)] * 3
            lower_index[axis] = slice(1, None)
            upper_index[axis] = slice(None, -1)
            lower[tuple(lower_index)] = valid_mask[tuple(upper_index)]
            upper[tuple(upper_index)] = valid_mask[tuple(lower_index)]
            valid_mask &= lower & upper
    if not np.any(valid_mask):
        raise ValueError("no valid interior cells remain for constraint norms")
    inverse = np.linalg.inv(state.h)
    physical_metric = state.h / state.chi[..., None, None]
    physical_inverse = state.chi[..., None, None] * inverse
    physical_k = (
        state.a + state.h * state.trace_k[..., None, None] / 3.0
    ) / state.chi[..., None, None]
    mixed_k = np.einsum("...ij,...jk->...ik", physical_inverse, physical_k)
    k_squared = np.einsum(
        "...ij,...kl,...ik,...jl->...",
        physical_k,
        physical_k,
        physical_inverse,
        physical_inverse,
    )
    scalar_curvature = np.einsum(
        "...ij,...ij->...", physical_inverse, _direct_ricci(physical_metric, physical_inverse, state)
    )
    hamiltonian = scalar_curvature + state.trace_k**2 - k_squared

    d_mixed = [_d1(mixed_k, state, axis) for axis in range(3)]
    d_trace_k = [_d1(state.trace_k, state, axis) for axis in range(3)]
    christoffel = _christoffel(physical_metric, physical_inverse, state)
    momentum = np.zeros((*state.grid.shape, 3), dtype=np.float64)
    for component in range(3):
        divergence = d_mixed[0][..., 0, component]
        for axis in range(1, 3):
            divergence += d_mixed[axis][..., axis, component]
        for j in range(3):
            for ell in range(3):
                divergence += (
                    christoffel[..., j, j, ell] * mixed_k[..., ell, component]
                    - christoffel[..., ell, j, component] * mixed_k[..., j, ell]
                )
        momentum[..., component] = divergence - d_trace_k[component]

    d_inverse = [_d1(inverse, state, axis) for axis in range(3)]
    conformal_gamma_target = -sum(
        d_inverse[axis][..., :, axis] for axis in range(3)
    )
    conformal_gamma = state.conformal_gamma - conformal_gamma_target
    trace_a = np.einsum("...ij,...ij->...", inverse, state.a)
    det_h = np.linalg.det(state.h)
    return ConstraintReport3D(
        hamiltonian=hamiltonian,
        momentum=momentum,
        det_h_minus_one=det_h - 1.0,
        trace_a=trace_a,
        conformal_gamma=conformal_gamma,
        theta=state.theta,
        valid_mask=valid_mask,
    )


def ccz4_conformal_momentum_constraint_3d(state: BSSNState3D) -> Array:
    """Return the formulation-specific CCZ4 conformal momentum row.

    This is distinct from :attr:`ConstraintReport3D.momentum`, which remains
    the physical ADM momentum constraint used by the existing Python/C++
    manifest contract.  The FO-CCZ4 conformal row is

    ``Dtilde_j Atilde^{ij} + 6 Atilde^{ij} partial_j phi
    - 2/3 gamma_tilde^{ij} partial_j K``

    with ``chi = exp(-4 phi)``.  It is an auxiliary formulation diagnostic,
    not a claim that the full nonlinear FO-CCZ4 subsidiary system is closed.
    The ``K`` slot is the physical trace.  A Z4c state that evolves
    ``K_hat = K - 2 Theta`` would reconstruct ``K`` as ``K_hat + 2 Theta``
    before applying this row; that conversion is intentionally not implicit.
    """

    if state.grid.boundary not in ("periodic", "excision", "sommerfeld"):
        raise ValueError(f"unsupported constraint boundary: {state.grid.boundary}")
    h_inverse = np.linalg.inv(state.h)
    conformal_a = np.einsum(
        "...ik,...jl,...kl->...ij", h_inverse, h_inverse, state.a
    )
    d_a = [_d1(conformal_a, state, axis) for axis in range(3)]
    conformal_christoffel = _christoffel(state.h, h_inverse, state)
    divergence = np.zeros((*state.grid.shape, 3), dtype=np.float64)
    for component in range(3):
        value = sum(d_a[axis][..., component, axis] for axis in range(3))
        for derivative_axis in range(3):
            for index in range(3):
                value += (
                    conformal_christoffel[..., component, derivative_axis, index]
                    * conformal_a[..., index, derivative_axis]
                    + conformal_christoffel[..., derivative_axis, derivative_axis, index]
                    * conformal_a[..., component, index]
                )
        divergence[..., component] = value

    d_chi = [_d1(state.chi, state, axis) for axis in range(3)]
    d_phi = [-0.25 * value / state.chi for value in d_chi]
    d_trace_k = [_d1(state.trace_k, state, axis) for axis in range(3)]
    result = divergence.copy()
    for component in range(3):
        for axis in range(3):
            result[..., component] += 6.0 * conformal_a[..., component, axis] * d_phi[axis]
            result[..., component] -= (2.0 / 3.0) * h_inverse[..., component, axis] * d_trace_k[axis]
    return result
