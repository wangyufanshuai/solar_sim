"""Policy placement, analytic order, fail-closed behavior and rate controls."""
import math

import numpy as np
import pytest

from .fo_ccz4_algebraic_projection import algebraic_fields, project_algebraic_slots
from .fo_ccz4_projected_rk import POLICIES, ProjectedShadowCube, algebraic_velocity, rk4_policy_step
from .fo_ccz4_sbp_nonlinear import NonlinearSBPCube
from .fo_ccz4_sbp_volume import FLAGS
from .nr3d import Grid3D
from .test_fo_ccz4_algebraic_projection import sample


def test_default_arithmetic_and_half_times_match_classical_rk4():
    q = np.array([.2, -.7])
    times = []
    def f(value, half):
        times.append(half)
        return value**2+half/128., {"half": half}
    dt = 1./64
    result, reports = rk4_policy_step(q, 2, dt, f)
    k1, _ = f(q, 4)
    k2, _ = f(q+.5*dt*k1, 5)
    k3, _ = f(q+.5*dt*k2, 5)
    k4, _ = f(q+dt*k3, 6)
    assert result.tobytes() == (q+dt*(k1+2.*k2+2.*k3+k4)/6.).tobytes()
    assert times[:4] == [4, 5, 5, 6]
    assert reports == [dict(stage=i+1, half=h) for i, h in enumerate(times[:4])]


@pytest.mark.parametrize("policy,count", zip(POLICIES, [0, 1, 5]))
def test_projection_placement_not_implicit_rebasing(policy, count):
    calls, observed, evaluated = [], [], []
    q = np.array([1., 0.])
    def projection(value):
        calls.append(value.copy())
        return value/np.linalg.norm(value)
    def rhs(value, half):
        evaluated.append(value.copy())
        return np.array([-value[1], value[0]]), {}
    def observer(event, stage, half, raw, effective, f, report):
        observed.append((event, stage, half))
        assert not raw.flags.writeable
        if effective is not None:
            assert not effective.flags.writeable
    out, _ = rk4_policy_step(q, 0, .2, rhs, policy=policy, projector=projection, observer=observer)
    assert len(calls) == count
    assert [s for event, s, _ in observed if event == "stage-rhs"] == [1, 2, 3, 4]
    assert np.array_equal(q, [1., 0.])
    if policy == "stages-and-endpoint":
        k = [np.array([-x[1], x[0]]) for x in evaluated]
        raw = q+.2*(k[0]+2*k[1]+2*k[2]+k[3])/6.
        np.testing.assert_array_equal(calls[-1], raw)
    if policy != "none":
        assert np.linalg.norm(out) == pytest.approx(1., abs=1.e-15)


@pytest.mark.parametrize("policy", POLICIES)
def test_no_mutable_inputs_passed_to_observer_rhs_or_projection(policy):
    def f(q, half):
        with pytest.raises(ValueError):
            q[0] = 99.
        return np.ones_like(q), {}
    def p(q):
        with pytest.raises(ValueError):
            q[0] = 99.
        return q.copy()
    q = np.array([1., 2.])
    before = q.tobytes()
    rk4_policy_step(q, 0, .01, f, policy=policy, projector=p)
    assert q.tobytes() == before


@pytest.mark.parametrize("bad", [True, None, "rk4", "stage", 1])
def test_invalid_policies_rejected(bad):
    with pytest.raises(ValueError, match="policy"):
        rk4_policy_step(np.ones(2), 0, .01, lambda q, h: (q, {}), policy=bad)


@pytest.mark.parametrize("bad", [0., -1., math.nan, math.inf, True, "0.1"])
def test_invalid_dt_rejected(bad):
    with pytest.raises(ValueError, match="dt"):
        rk4_policy_step(np.ones(2), 0, bad, lambda q, h: (q, {}))


@pytest.mark.parametrize("bad", [-1, True, .5])
def test_invalid_step_rejected(bad):
    with pytest.raises(ValueError, match="step"):
        rk4_policy_step(np.ones(2), bad, .01, lambda q, h: (q, {}))


@pytest.mark.parametrize("policy", POLICIES[1:])
def test_enabled_policy_requires_projector(policy):
    with pytest.raises(ValueError, match="projector"):
        rk4_policy_step(np.ones(2), 0, .01, lambda q, h: (q, {}), policy=policy)


@pytest.mark.parametrize("bad", [np.ones(3), np.array([np.nan, 1.]), np.ones(2, dtype=np.float32)])
def test_bad_rhs_rejected_before_a_second_stage(bad):
    calls = []
    def rhs(q, half):
        calls.append(half)
        return bad, {}
    with pytest.raises(ValueError, match="FP64"):
        rk4_policy_step(np.ones(2), 0, .01, rhs)
    assert calls == [0]


def test_raw_projection_failure_is_observed_and_never_retried():
    events = []
    def bad_projector(q):
        raise ValueError("declared projection failure")
    with pytest.raises(ValueError, match="declared"):
        rk4_policy_step(np.ones(2), 0, .01, lambda q, h: (q, {}), policy="stages-and-endpoint",
                        projector=bad_projector, observer=lambda event, *args: events.append(event))
    assert events == ["stage-raw"]


@pytest.mark.parametrize("seed", range(8))
def test_algebraic_velocity_matches_independent_centered_directional_difference(seed):
    q = project_algebraic_slots(sample((2,), seed), enabled=True)
    rhs = np.random.default_rng(seed+77).normal(0., .03, q.shape)
    rate = algebraic_velocity(q, rhs)
    eps = 1.e-4
    plus, minus = algebraic_fields(q+eps*rhs), algebraic_fields(q-eps*rhs)
    # d logdet = d det / det; q is normalized only for this independent check.
    for key, name in (("det_h", "logdet_rate"), ("trace_a", "trace_a_rate"), ("trace_D", "trace_D_rate")):
        np.testing.assert_allclose((plus[key]-minus[key])/(2*eps), rate[name], rtol=2.e-7, atol=2.e-10)


def test_default_cube_delegates_exact_old_step_and_keeps_flags(monkeypatch):
    grid = Grid3D((9,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
    calls = []
    q = np.zeros((58, 9, 9, 9))
    q[[0, 3, 5]] = 1.
    def old_step(self, values, index, dt, boundary):
        calls.append((values, index, dt, boundary(2*index)))
        return values.copy(), []
    monkeypatch.setattr(NonlinearSBPCube, "step", old_step)
    driver = ProjectedShadowCube(grid)
    out, _ = driver.step(q, 0, .01, lambda half: half)
    assert len(calls) == 1 and out.tobytes() == q.tobytes()
    assert driver.identity["default_policy"] == "none"
    assert all(driver.identity[k] is False for k in FLAGS)
    assert not driver.identity["temporal_order_validated"]
