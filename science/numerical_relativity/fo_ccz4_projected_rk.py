"""Default-off shadow RK policy, separate from the frozen nonlinear solver.

The old scalar map's identity describes its standalone component, not this
new adapter. Projection here changes the numerical method and physical fields.
No claim of order, tangency, Einstein-constraint preservation or live admission
is implied by successful completion of a step.
"""
from __future__ import annotations

import math

import numpy as np

from .fo_ccz4_algebraic_projection import (
    A_SLOTS, D_SLOTS, H_SLOTS, canonical, geometry, project_algebraic_slots,
    require, tensor,
)
from .fo_ccz4_sbp_nonlinear import NonlinearSBPCube
from .fo_ccz4_sbp_volume import FLAGS

POLICIES = ("none", "endpoint", "stages-and-endpoint")


def policy_check(policy):
    require(type(policy) is str and policy in POLICIES, "explicit supported RK policy required")


def step_check(step_index, dt):
    require(type(step_index) is int and step_index >= 0, "nonnegative integer step required")
    require(not isinstance(dt, (bool, str, complex)) and np.isscalar(dt)
            and math.isfinite(dt) and dt > 0., "positive finite dt required")


def array(value, shape=None):
    q = np.asarray(value)
    require(q.ndim >= 1 and q.size > 0 and q.dtype == np.float64 and np.all(np.isfinite(q))
            and (shape is None or q.shape == shape), "finite matching FP64 array required")
    return np.array(q, order="C", copy=True)


def frozen(value):
    q = array(value)
    q.flags.writeable = False
    return q


def emit(observer, event, stage, half_index, raw, effective=None, rhs=None, report=None):
    if observer is not None:
        # An observation cannot mutate the candidate or a caller-owned input.
        observer(event, stage, half_index, frozen(raw),
                 None if effective is None else frozen(effective),
                 None if rhs is None else frozen(rhs), report)


def rk4_policy_step(values, step_index, dt, evaluate, *, policy="none", projector=None, observer=None):
    """Classical RK4 arithmetic with explicitly located retractions.

    evaluate(q, half_index) returns (derivative, report). All four stage sums
    use the SAME original q, never a projected stage as a new integration base.
    For stages-and-endpoint, F(P(raw)) is evaluated, including stage 1. Only
    the final sum is retracted for endpoint. No adaptive retries are performed.
    This generic routine is also used by analytic controls, not a test replica.
    """
    policy_check(policy)
    step_check(step_index, dt)
    require(callable(evaluate) and (observer is None or callable(observer)), "callable RHS/observer required")
    require(policy == "none" or callable(projector), "explicit projector required when policy enabled")
    q = array(values)
    reports = []

    def stage(raw, index, half_index):
        raw = array(raw, q.shape)
        emit(observer, "stage-raw", index, half_index, raw)
        effective = array(projector(frozen(raw)), q.shape) if policy == "stages-and-endpoint" else raw.copy()
        emit(observer, "stage-input", index, half_index, raw, effective)
        rhs, report = evaluate(frozen(effective), half_index)
        rhs = array(rhs, q.shape)
        require(isinstance(report, dict), "RHS report must be a dictionary")
        emit(observer, "stage-rhs", index, half_index, raw, effective, rhs, report)
        reports.append(dict(stage=index, **report))
        return rhs

    k1 = stage(q, 1, 2*step_index)
    k2 = stage(q+.5*dt*k1, 2, 2*step_index+1)
    k3 = stage(q+.5*dt*k2, 3, 2*step_index+1)
    k4 = stage(q+dt*k3, 4, 2*step_index+2)
    raw = array(q+dt*(k1+2.*k2+2.*k3+k4)/6., q.shape)
    emit(observer, "endpoint-raw", 0, 2*step_index+2, raw)
    result = array(projector(frozen(raw)), q.shape) if policy != "none" else raw.copy()
    emit(observer, "endpoint", 0, 2*step_index+2, raw, result)
    return result, reports


def algebraic_velocity(values, rhs):
    """Exact directional derivative of log(det h), tr_h(a), tr_h(D_k).

    Uses the supplied complete volume+SAT RHS, not a reconstructed auxiliary
    RHS. Nonzero values mean the semi-discrete vector field is not tangent at
    this state. These are rates, NOT finite-step residuals or physical norms.
    """
    q, f = canonical(values), canonical(rhs)
    require(q.shape == f.shape, "matching state/RHS shapes required")
    g = geometry(q)
    inv, hdot = g["inverse"], tensor(f, H_SLOTS)
    inverse_dot = -inv@hdot@inv
    adot = tensor(f, A_SLOTS)
    ddot = np.stack([tensor(f, slots) for slots in D_SLOTS], axis=-3)
    result = dict(
        logdet_rate=np.einsum("...ij,...ij->...", inv, hdot),
        trace_a_rate=np.einsum("...ij,...ij->...", inv, adot)
                     +np.einsum("...ij,...ij->...", inverse_dot, g["a"]),
        trace_D_rate=np.einsum("...ij,...kij->...k", inv, ddot)
                     +np.einsum("...ij,...kij->...k", inverse_dot, g["d"]),
    )
    require(all(np.all(np.isfinite(v)) for v in result.values()), "nonfinite algebraic velocity")
    return result


class ProjectedShadowCube(NonlinearSBPCube):
    """Separate opt-in research adapter; default step delegates to old method."""

    def __init__(self, grid, *, policy="none", observer=None):
        super().__init__(grid)
        policy_check(policy)
        require(observer is None or callable(observer), "callable observer required")
        self.policy, self.observer = policy, observer
        self._stage = self._step = 0
        self._observing_step = False

    @property
    def identity(self):
        return dict(schema="nr-fo-projected-rk-shadow-v1", parent=super().identity,
                    policy=self.policy, default_policy="none", off_delegates_to_unchanged_step=True,
                    projection_location="before every RHS and final sum" if self.policy == "stages-and-endpoint"
                    else "final sum only" if self.policy == "endpoint" else "nowhere",
                    common_initial_data_required=True, old_failure_regraded=False,
                    projection_changes_physical_fields=self.policy != "none",
                    auxiliary_reconstruction=False, native_checkpoint_supported=False,
                    temporal_order_validated=False, nonlinear_stability_validated=False,
                    **{key: False for key in FLAGS})

    def rhs(self, values, data, dt):
        if self.policy != "none" or not self._observing_step:
            return super().rhs(values, data, dt)
        self._stage += 1
        half = 2*self._step+(0, 1, 1, 2)[self._stage-1]
        emit(self.observer, "stage-raw", self._stage, half, values)
        emit(self.observer, "stage-input", self._stage, half, values, values)
        rhs, report = super().rhs(values, data, dt)
        emit(self.observer, "stage-rhs", self._stage, half, values, values, rhs, report)
        return rhs, report

    def step(self, values, step_index, dt, boundary):
        step_check(step_index, dt)
        require(callable(boundary), "explicit boundary callback required")
        policy_check(self.policy)
        self._stage, self._step = 0, step_index
        if self.policy == "none":
            self._observing_step = True
            try:
                result, reports = super().step(values, step_index, dt, boundary)
            finally:
                self._observing_step = False
            emit(self.observer, "endpoint-raw", 0, 2*step_index+2, result)
            emit(self.observer, "endpoint", 0, 2*step_index+2, result, result)
            return result, reports
        q = self.field(values)
        result, reports = rk4_policy_step(
            q, step_index, dt, lambda value, half: self.rhs(value, boundary(half), dt),
            policy=self.policy, projector=lambda value: project_algebraic_slots(value, enabled=True),
            observer=self.observer,
        )
        self.state(result)  # Same state validity checks; no extra repair.
        return result, reports
