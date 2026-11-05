"""Synthetic controls for saved-data budgets, not new Einstein evolution."""

import ast
from dataclasses import fields
from pathlib import Path
import zlib

import numpy as np
import pytest

from science.numerical_relativity import trajectory_reduction_balance as T
from science.numerical_relativity import discrete_reduction_balance as D
from scripts.tests import test_nr_discrete_reduction as C
from scripts.tests import test_nr_continuum_adm as H


@pytest.fixture(scope="module")
def fixture():
    grid = C.mesh(9)
    op, q = C.dense(grid), C.smooth(grid).slots
    reference = D.evaluate(q, op)
    rhs = np.concatenate(
        (reference.base_rates, np.zeros_like(q[11:25]), reference.auxiliary_rates)
    )
    rhs.setflags(write=False)
    return op, q, rhs


@pytest.mark.parametrize("face", range(6))
@pytest.mark.parametrize("family", tuple(D.FAMILIES))
def test_each_family_face_residual(fixture, face, family):
    op, q, rhs = fixture
    changed = rhs.copy()
    axis, side = divmod(face, 2)
    selection = [25 + D.FAMILIES[family].start, slice(None), slice(None), slice(None)]
    selection[axis + 1] = 0 if side == 0 else -1
    changed[tuple(selection)] += 1e-3
    result = T.stage(q, changed, op)
    H.close(result.boundary_residual, changed[25:] - rhs[25:])
    H.close(result.measured, result.continuum + result.chain + result.boundary_residual)


@pytest.mark.parametrize("touching", (1, 2, 3))
def test_face_edge_corner_additions_are_not_averaged(fixture, touching):
    op, q, rhs = fixture
    changed = rhs.copy()
    for axis in range(touching):
        selection = [25, slice(None), slice(None), slice(None)]
        selection[axis + 1] = 0
        changed[tuple(selection)] += 2e-3
    value = T.stage(q, changed, op)
    assert abs(value.boundary_residual[0, 0, 0, 0] - touching * 2e-3) < 2e-12


@pytest.mark.parametrize("family", (*D.FAMILIES, "ODE"))
def test_non_boundary_or_ode_residual_rejected(fixture, family):
    op, q, rhs = fixture
    changed = rhs.copy()
    if family == "ODE":
        changed[6, 0, 4, 4] += 1e-3
    else:
        changed[25 + D.FAMILIES[family].start, 4, 4, 4] += 1e-3
    with pytest.raises(ValueError):
        T.stage(q, changed, op)


def test_fourteen_other_channels_not_claimed_by_reduction_audit(fixture):
    op, q, rhs = fixture
    changed = rhs.copy()
    changed[11:25] += 0.1
    left, right = T.stage(q, rhs, op), T.stage(q, changed, op)
    for item in fields(left):
        assert np.array_equal(getattr(left, item.name), getattr(right, item.name))


@pytest.mark.parametrize("sign", (-1.0, 1.0))
def test_rk_weighted_linear_definition_identity(fixture, sign):
    op, q, rhs = fixture
    raws, stages = [], []
    for s in range(4):
        value = rhs.copy()
        value[25, 0, :, :] += sign * (s + 1) ** 2 * 1e-3
        raws.append(value)
        stages.append(T.stage(q, value, op))
    dt = 1 / 128
    endpoint = q + dt * (raws[0] + 2 * raws[1] + 2 * raws[2] + raws[3]) / 6
    parts, delta, errors = T.step_budget(q, endpoint, stages, dt, op)
    H.close(delta, sum(parts.values()))
    assert max(errors.values()) < 2e-12
    # Altering ordered RK weights must not be hidden by a norm comparison.
    with pytest.raises(ValueError):
        T.step_budget(q, endpoint, [stages[1], stages[0], stages[2], stages[3]], dt, op)


def test_corrupted_endpoint_budget_rejected(fixture):
    op, q, rhs = fixture
    stage = T.stage(q, rhs, op)
    endpoint = q + rhs / 128
    endpoint[25, 4, 4, 4] += 1e-3
    with pytest.raises(ValueError):
        T.step_budget(q, endpoint, [stage] * 4, 1 / 128, op)


@pytest.mark.parametrize("dt", (True, 0.0, float("nan")))
def test_invalid_dt(fixture, dt):
    op, q, rhs = fixture
    with pytest.raises(ValueError):
        T.step_budget(q, q, [T.stage(q, rhs, op)] * 4, dt, op)


def test_missing_stage_rejected(fixture):
    op, q, rhs = fixture
    with pytest.raises(ValueError):
        T.step_budget(q, q, [T.stage(q, rhs, op)] * 3, 1 / 128, op)


@pytest.mark.parametrize("bad", ("nan", "complex", "shape"))
def test_invalid_saved_rhs(fixture, bad):
    op, q, rhs = fixture
    changed = rhs.copy()
    if bad == "nan":
        changed[12, 4, 4, 4] = float("nan")
    elif bad == "complex":
        changed = changed.astype(complex)
    else:
        changed = changed[:-1]
    with pytest.raises(ValueError):
        T.stage(q, changed, op)


def test_readonly_stage_arrays(fixture):
    op, q, rhs = fixture
    result = T.stage(q, rhs, op)
    for item in fields(result):
        value = getattr(result, item.name)
        assert not value.flags.writeable
        with pytest.raises(ValueError):
            value.flat[0] = 0


@pytest.mark.parametrize("family", (*D.FAMILIES, "D-offdiag"))
def test_tensor_multiplicity_and_region_normalization(fixture, family):
    op, _, _ = fixture
    value = np.zeros((33, *op.shape))
    expected = {name: 0.0 for name in D.FAMILIES}
    if family == "D-offdiag":
        value[13] = 1
        expected["D"] = np.sqrt(2 / 27)
    else:
        value[D.FAMILIES[family]] = 1
        expected[family] = 1
    for row in T.norms(value, op).values():
        for name in expected:
            assert abs(row[name] - expected[name]) <= 2e-12


@pytest.mark.parametrize(
    "bad", ("bool", "negative", "large", "truncated", "trailing", "overfull")
)
def test_bounded_trace_expansion_rejects_ambiguity(bad):
    raw = zlib.compress(b"hello")
    size = 5
    if bad in ("bool", "negative", "large"):
        size = {"bool": True, "negative": -1, "large": 2**30}[bad]
    elif bad == "truncated":
        raw = raw[:-1]
    elif bad == "trailing":
        raw += b"x"
    else:
        size = 4
    with pytest.raises(ValueError):
        T.expand(raw, size)


def test_exact_trace_expansion():
    assert T.expand(zlib.compress(b"hello"), 5) == b"hello"


def case(index):
    steps = (7, 14, 28)[index]
    return dict(
        label=f"native-gauge-continuation-13-{steps}",
        n=13,
        additional_steps=steps,
        start_step=steps,
        end_step=2 * steps,
        dt=1 / (16 * steps),
        resume_time=1 / 16,
        end_time=1 / 8,
        additional_accepted_steps=steps,
        additional_native_published_steps=steps,
        status="completed",
        completed=True,
        trajectory=[None] * (steps + 1),
        segments=[None] * ((steps + 1) // 2),
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
    )


@pytest.mark.parametrize("change", ("dt", "n", "status", "start_step", "completed"))
def test_changed_scientific_case_rejected(change):
    row = case(0)
    row[change] = {
        "dt": 1 / 128,
        "n": 9,
        "status": "running",
        "start_step": 0,
        "completed": 1,
    }[change]
    with pytest.raises(ValueError):
        T.case_contract(row, 0)


@pytest.mark.parametrize("index", range(3))
def test_exact_case_contract(index):
    T.case_contract(case(index), index)


def test_no_new_solver_or_subprocess_call():
    tree = ast.parse(Path(T.__file__).read_text(encoding="utf-8"))
    forbidden = {"invoke", "Popen", "step", "rhs"}
    assert not any(
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Attribute)
        and node.func.attr in forbidden
        for node in ast.walk(tree)
    )
