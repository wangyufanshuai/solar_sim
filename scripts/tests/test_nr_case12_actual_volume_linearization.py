"""Owned small controls for actual RHS forward jets and reverse replay.

No test evaluates the complete volume RHS. The registered worker performs the
three complete production and three independent parameter cases exactly once.
"""

import ast
import copy
from fractions import Fraction as F
import hashlib
import importlib.util
import os
from pathlib import Path
import sys
from types import SimpleNamespace

import pytest

assert os.environ.get("NR_OWNED_CONTROL_RUN_ID"), (
    "owned actual-volume control run required"
)

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import nr_case12_actual_volume_jet as E  # noqa: E402
import nr_case12_actual_volume_replay as I  # noqa: E402
import nr_case12_actual_volume_linearization as M  # noqa: E402


class StopControl(RuntimeError):
    pass


def stop():
    raise StopControl("owned synthetic interruption")


def scalar(kind):
    return E.SparseJet if kind == "forward" else I.ReplayTape().scalar_type


def backend(kind, check=lambda: None):
    return (
        E.ExactArrayBackend(check=check)
        if kind == "forward"
        else I.make_backend(check=check)
    )


def blank_cases():
    return {
        case: {
            name: [[F(0) for _ in range(1 if name == "F0" else 58)] for _ in range(58)]
            for name in M.FIELDS
        }
        for case in M.CASE_NAMES
    }


@pytest.fixture(scope="module")
def runner():
    path = ROOT / "scripts/run-nr-k3-case12-actual-volume-linearization.py"
    spec = importlib.util.spec_from_file_location("owned_actual_volume_runner", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def wired_state():
    cache = {}

    def build(kind):
        if kind in cache:
            return cache[kind]
        b = backend(kind)
        ns, _ = E._compile(b, lambda: None)
        ns["_alpha_center"], ns["_chi_center"] = F(17, 20), F(18, 25)
        slots = b.empty((58, 1, 1, 1))
        values = [F(0)] * 58
        values[:6] = [F(2), F(1), F(0), F(3), F(0), F(4)]
        values[7:10] = [F(3, 100), F(-1, 25), F(1, 20)]
        for index in range(58):
            slots[index, 0, 0, 0] = b.scalar_type(values[index], {index: F(1)})
        state = ns["state_from_slots"](
            SimpleNamespace(shape=(1, 1, 1), spatial_order=4), slots
        )
        cache[kind] = b, ns, state, slots
        return cache[kind]

    return build


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_volume_hand_product_quotient_and_power(kind):
    c = scalar(kind)
    u, v = c(F(2), {3: F(1)}), c(F(3), {4: F(1)})
    actual = u * v + u / v - u**2
    assert actual.value == F(8, 3)
    assert dict(actual.coefficients) == {3: F(-2, 3), 4: F(16, 9)}
    assert u.value == 2 and dict(u.coefficients) == {3: F(1)}
    assert v.value == 3 and dict(v.coefficients) == {4: F(1)}


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_volume_chart_keeps_two_chi_derivative_and_profile_product(kind):
    b = backend(kind)
    c = b.scalar_type
    alpha = b.chart_exp(c.seed(6), F(17, 20)).item()
    chi = b.chart_exp(2 * c.seed(10), F(18, 25)).item()
    f, mu = 3 * alpha * chi, F(1, 5) * chi
    assert alpha.value == F(17, 20) and dict(alpha.coefficients) == {6: F(17, 20)}
    assert chi.value == F(18, 25) and dict(chi.coefficients) == {10: F(36, 25)}
    assert f.value == F(459, 250)
    assert dict(f.coefficients) == {6: F(459, 250), 10: F(459, 125)}
    assert mu.value == F(18, 125) and dict(mu.coefficients) == {10: F(36, 125)}


@pytest.mark.parametrize(
    "case", [(6, F(1), F(3, 20)), (10, F(2), F(14, 25)), (10, F(18, 25), F(-18, 25))]
)
def test_actual_volume_three_wrong_chart_rules_have_exact_nonzero_gaps(case):
    slot, wrong, expected_gap = case
    b = backend("forward")
    c = b.scalar_type
    center, factor = (F(17, 20), 1) if slot == 6 else (F(18, 25), 2)
    correct = b.chart_exp(factor * c.seed(slot), center).item()
    wrong_center, wrong_factor = (
        (F(1), factor) if wrong in (F(1), F(2)) else (center, 1)
    )
    incorrect = b.chart_exp(wrong_factor * c.seed(slot), wrong_center).item()
    assert incorrect.coefficients[slot] == wrong
    assert (
        incorrect.coefficients[slot] - correct.coefficients[slot] == expected_gap != 0
    )


@pytest.mark.parametrize(
    "mode", ["valid", "empty", "rejected", "gap", "wrong", "name", "slot"]
)
def test_actual_volume_chart_evidence_rejected_by_both_verifiers(mode, runner):
    b = backend("forward")
    c = b.scalar_type
    alpha = b.chart_exp(c.seed(6), F(17, 20)).item()
    chi = b.chart_exp(2 * c.seed(10), F(18, 25)).item()
    rows = []
    for name, slot, correct, wrong in (
        ("omit-alpha-center", 6, alpha, b.chart_exp(c.seed(6), F(1)).item()),
        ("omit-chi-center", 10, chi, b.chart_exp(2 * c.seed(10), F(1)).item()),
        ("omit-chi-factor-two", 10, chi, b.chart_exp(c.seed(10), F(18, 25)).item()),
    ):
        good, bad = correct.coefficients[slot], wrong.coefficients[slot]
        rows.append(
            dict(
                name=name,
                slot=slot,
                actual_correct_coefficient=str(good),
                actual_wrong_coefficient=str(bad),
                actual_gap=str(good - bad),
                rejected=good != bad,
            )
        )
    chart = dict(
        alpha=dict(
            value=str(alpha.value), coefficients=[[6, str(alpha.coefficients[6])]]
        ),
        chi=dict(value=str(chi.value), coefficients=[[10, str(chi.coefficients[10])]]),
        chain_rule_negative_controls=rows,
        chain_rule_controls_are_case12_rhs_counterexamples=False,
    )
    if mode == "empty":
        chart = {}
    elif mode == "rejected":
        rows[0]["rejected"] = False
    elif mode == "gap":
        rows[0]["actual_gap"] = "0"
    elif mode == "wrong":
        rows[0]["actual_wrong_coefficient"] = "2"
    elif mode == "name":
        rows[0]["name"] = "different-claim"
    elif mode == "slot":
        rows[0]["slot"] = 10
    assert M.chart_controls_accepted(chart) is (mode == "valid")
    assert runner.independent_chart_controls(chart) is (mode == "valid")


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_volume_actual_state_chart_symmetric_and_unsymmetric_packing(
    kind, wired_state
):
    b, ns, state, slots = wired_state(kind)
    base, aux = state.base, state.auxiliary
    assert dict(base.h[0, 0, 0, 0, 1].coefficients) == {1: F(1)}
    assert dict(base.h[0, 0, 0, 1, 0].coefficients) == {1: F(1)}
    assert dict(base.a[0, 0, 0, 0, 1].coefficients) == {12: F(1)}
    assert dict(aux.shift_gradient[0, 0, 0, 2, 1].coefficients) == {35: F(1)}
    assert dict(aux.shift_gradient[0, 0, 0, 1, 2].coefficients) == {33: F(1)}
    assert dict(aux.metric_gradient[0, 0, 0, 1, 0, 1].coefficients) == {44: F(1)}
    assert dict(aux.metric_gradient[0, 0, 0, 1, 1, 0].coefficients) == {44: F(1)}
    assert dict(base.lapse[0, 0, 0].coefficients) == {6: F(17, 20)}
    assert dict(base.chi[0, 0, 0].coefficients) == {10: F(36, 25)}
    rhs = ns["FOCCZ4RHS3D"](
        h=base.h,
        ln_lapse=slots[6],
        shift=base.shift,
        ln_phi=slots[10],
        a=base.a,
        trace_k=base.trace_k,
        theta=base.theta,
        conformal_gamma=base.conformal_gamma,
        b=base.b,
        lapse_gradient=aux.lapse_gradient,
        shift_gradient=aux.shift_gradient,
        metric_gradient=aux.metric_gradient,
        conformal_factor_gradient=aux.conformal_factor_gradient,
    )
    packed = ns["_rhs_components"](rhs)
    assert len(packed) == 58
    for index, value in enumerate(packed):
        assert value.dtype == object
        assert dict(value[0, 0, 0].coefficients) == {index: F(1)}
    f, mu = ns["PROFILE"].coefficients(base.lapse, base.chi)
    assert f[0, 0, 0].value == F(459, 250)
    assert dict(f[0, 0, 0].coefficients) == {6: F(459, 250), 10: F(459, 125)}
    assert dict(mu[0, 0, 0].coefficients) == {10: F(36, 125)}
    assert b.scalar_type is type(packed[57][0, 0, 0])


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_volume_three_original_symmetry_helpers_keep_axis_order(
    kind, wired_state
):
    b, ns, state, _ = wired_state(kind)
    aux = state.auxiliary
    first = ns["_sym_first"](aux.lapse_gradient, state.base, b.derivative)
    shift = ns["_sym_shift_gradient"](aux.shift_gradient, state.base, b.derivative)
    metric = ns["_sym_metric_gradient"](aux.metric_gradient, state.base, b.derivative)
    assert dict(first[0, 0, 0, 0, 1].coefficients) == {84: F(1, 2), 141: F(1, 2)}
    assert dict(shift[0, 0, 0, 2, 0, 1].coefficients) == {91: F(1, 2), 146: F(1, 2)}
    assert dict(metric[0, 0, 0, 0, 1, 0, 2].coefficients) == {
        103: F(1, 2),
        155: F(1, 2),
    }


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_volume_all_232_seed_labels_and_all_174_gradient_mappings(kind):
    c = scalar(kind)
    seen = set()
    for index in range(232):
        node = c.seed(index)
        assert node.value == 0 and dict(node.coefficients) == {index: F(1)}
        seen.update(node.coefficients)
    assert seen == set(range(232))
    gradient_labels = set()
    for index in range(58):
        for axis in range(3):
            value = c.seed(index).gradient(axis)
            expected = 58 + 58 * axis + index
            assert dict(value.coefficients) == {expected: F(1)}
            gradient_labels.update(value.coefficients)
    assert gradient_labels == set(range(58, 232))


@pytest.mark.parametrize(
    "case", [("forward", 0), ("forward", 2), ("reverse", 0), ("reverse", 2)]
)
def test_actual_volume_gradient_seed_indices_are_direction_specific(case):
    kind, axis = case
    c = scalar(kind)
    expression = c(F(9), {0: F(2), 57: F(-3)})
    actual = expression.gradient(axis)
    assert actual.value == 0
    assert dict(actual.coefficients) == {
        58 * (axis + 1): F(2),
        58 * (axis + 1) + 57: F(-3),
    }


@pytest.mark.parametrize(
    "case",
    [
        ("forward", "direct"),
        ("forward", "cancel"),
        ("forward", "zero"),
        ("reverse", "direct"),
        ("reverse", "cancel"),
        ("reverse", "zero"),
    ],
)
def test_actual_volume_second_gradient_refused_after_cancellation(case):
    kind, mode = case
    c = scalar(kind)
    first = c.seed(17).gradient(0)
    expression = (
        first if mode == "direct" else first - first if mode == "cancel" else 0 * first
    )
    assert expression.gradient_taint is True
    with pytest.raises(ValueError):
        expression.gradient(1)


@pytest.mark.parametrize(
    "case",
    [
        ("forward", -1),
        ("forward", 232),
        ("forward", True),
        ("reverse", -1),
        ("reverse", 232),
        ("reverse", True),
    ],
)
def test_actual_volume_seed_registry_rejects_outside_and_boolean(case):
    kind, index = case
    with pytest.raises(ValueError):
        scalar(kind).seed(index)


@pytest.mark.parametrize(
    "case", [("forward", 0.1), ("forward", True), ("reverse", 0.1), ("reverse", True)]
)
def test_actual_volume_float_and_boolean_scalars_refused(case):
    kind, value = case
    c = scalar(kind)
    with pytest.raises(ValueError):
        c(value)
    with pytest.raises((ValueError, TypeError)):
        c.seed(0) + value


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_volume_inverse_and_determinant_offdiagonal_derivative(kind):
    b = backend(kind)
    c = b.scalar_type
    u = c.seed(3)
    h = b.asarray([[2, 1 + u, 0], [1 + u, 3, 0], [0, 0, 4]])
    det = b.determinant(h).item()
    inverse = b.inverse(h)
    assert det.value == 20 and dict(det.coefficients) == {3: F(-8)}
    expected_value = [
        [F(3, 5), F(-1, 5), F(0)],
        [F(-1, 5), F(2, 5), F(0)],
        [F(0), F(0), F(1, 4)],
    ]
    expected_derivative = [
        [F(6, 25), F(-7, 25), F(0)],
        [F(-7, 25), F(4, 25), F(0)],
        [F(0), F(0), F(0)],
    ]
    for i in range(3):
        for j in range(3):
            assert inverse[i, j].value == expected_value[i][j]
            assert inverse[i, j].coefficients.get(3, F(0)) == expected_derivative[i][j]


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_volume_singular_inverse_and_float_cast_refused(kind):
    b = backend(kind)
    with pytest.raises(ValueError):
        b.inverse(b.asarray([[1, 0, 0], [0, 0, 0], [0, 0, 1]]))
    with pytest.raises((ValueError, TypeError)):
        float(b.scalar_type.seed(0))


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_volume_sliced_views_keep_seed_identity_in_contraction(kind):
    b = backend(kind)
    c = b.scalar_type
    array = b.asarray([[c.seed(2), c.seed(17)], [c.seed(31), c.seed(57)]])
    selected = array[:, 1]
    derivatives = b.asarray([value.gradient(2) for value in selected])
    result = b.einsum("i,i->", derivatives, b.asarray([2, -3])).item()
    assert result.value == 0
    assert dict(result.coefficients) == {191: F(2), 231: F(-3)}
    assert dict(array[0, 1].coefficients) == {17: F(1)}
    assert dict(array[1, 1].coefficients) == {57: F(1)}


def test_actual_volume_reverse_graph_not_forward_map_and_cut_edge_detected(runner):
    tape = I.ReplayTape()
    c = tape.scalar_type
    state = c(F(3), {12: F(1)})
    output = 2 * state**2
    assert output._coefficients is None
    expected = M.encode_matrix([[F(12)]])
    assert runner.canonical_equal(
        M.encode_matrix([[output.coefficients[12]]]), expected
    )
    broken = 2 * state**2
    broken.parents = ()  # controlled graph fault, not a claimed legitimate execution
    assert not runner.canonical_equal(
        M.encode_matrix([[broken.coefficients.get(12, F(0))]]), expected
    )


def test_actual_volume_reverse_cross_tape_and_readonly_coefficients():
    a, b = I.ReplayTape().scalar_type, I.ReplayTape().scalar_type
    with pytest.raises(ValueError):
        a.seed(0) + b.seed(0)
    value = a.seed(1)
    with pytest.raises(TypeError):
        value.coefficients[1] = F(2)


def test_actual_volume_reverse_deadline_during_accumulation_propagates():
    state = {"armed": False, "calls": 0}

    def check():
        if state["armed"]:
            state["calls"] += 1
            if state["calls"] == 2:
                stop()

    tape = I.ReplayTape(check)
    expression = tape.scalar_type.seed(0)
    for _ in range(300):
        expression = expression + 1
    state["armed"] = True
    with pytest.raises(StopControl):
        _ = expression.coefficients
    assert expression._coefficients is None
    assert state["calls"] == 2


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_volume_allclose_checks_derivatives_and_empty_never_means_zero(kind):
    b = backend(kind)
    c = b.scalar_type
    array = b.asarray([[c(1), c.seed(1)], [c.seed(2), c(1)]])
    assert b.allclose(array, array.copy(), rtol=F(0), atol=F(0))
    assert not b.allclose(array, array.T, rtol=F(0), atol=F(0))
    unwritten = b.empty((2, 2))
    unwritten[0, 0] = F(0)
    with pytest.raises(ValueError):
        b.asarray(unwritten)
    with pytest.raises(ValueError):
        b.isfinite(unwritten)


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_volume_einsum_repeated_labels_ellipsis_and_broadcast(kind):
    b = backend(kind)
    c = b.scalar_type
    left = b.asarray([[1 + c.seed(0), 2], [3, 4]])
    trace = b.scalar(b.einsum("ii->", left).item())
    assert trace.value == 5 and dict(trace.coefficients) == {0: F(1)}
    answer = b.einsum("...i,...i->...", left, b.asarray([[5, 6]]))
    first, second = (b.scalar(value) for value in answer)
    assert first.value == 17 and dict(first.coefficients) == {0: F(5)}
    assert second.value == 39 and not second.coefficients
    with pytest.raises(ValueError):
        b.einsum("ii->", b.zeros((2, 3)))


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_volume_scalar_array_dispatch_keeps_both_operand_orders(kind):
    b = backend(kind)
    factor = 2 + b.scalar_type.seed(0)
    array = b.asarray([3, 4])
    for answer in (factor * array, array * factor):
        assert [node.value for node in answer] == [F(6), F(8)]
        assert [dict(node.coefficients) for node in answer] == [{0: F(3)}, {0: F(4)}]


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_volume_pure_constant_inverse_stays_exact(kind):
    b = backend(kind)
    inverse = b.inverse(b.asarray([[2, 1, 0], [1, 3, 0], [0, 0, 4]]))
    assert b.scalar(inverse[0, 1]).value == F(-1, 5)
    assert b.scalar(inverse[2, 2]).value == F(1, 4)
    assert all(
        type(b.scalar(value).value) is F and not b.scalar(value).coefficients
        for value in inverse.flat
    )


@pytest.mark.parametrize("value", [0.5, True, "2/4", "-0", "01", "1.0", "1/0"])
def test_actual_volume_rational_codec_requires_canonical_strings(value):
    with pytest.raises(ValueError):
        M.rational(value)


@pytest.mark.parametrize(
    "mode",
    ["missing", "duplicate", "float_index", "bool_shape", "float_value", "extra"],
)
def test_actual_volume_matrix_codec_requires_all_slots_and_types(mode):
    record = M.encode_matrix([[F(0), F(2, 3)], [F(-5), F(0)]])
    if mode == "missing":
        record["entries"].pop()
    elif mode == "duplicate":
        record["entries"][3] = copy.deepcopy(record["entries"][0])
    elif mode == "float_index":
        record["entries"][0][0] = 0.0
    elif mode == "bool_shape":
        record["shape"][0] = True
    elif mode == "float_value":
        record["entries"][0][2] = 0.0
    else:
        record["extra"] = False
    with pytest.raises(ValueError):
        M.decode_matrix(record, (2, 2))


def test_actual_volume_matrix_zero_slots_preserved_and_independent_corruption(runner):
    expected = M.encode_matrix([[F(0), F(1, 7)], [F(0), F(0)]])
    assert expected["entries"] == [[0, 0, "0"], [0, 1, "1/7"], [1, 0, "0"], [1, 1, "0"]]
    assert M.decode_matrix(expected, (2, 2)) == [[F(0), F(1, 7)], [F(0), F(0)]]
    changed = copy.deepcopy(expected)
    changed["entries"][2][2] = "1"
    assert not runner.canonical_equal(expected, changed)
    changed = copy.deepcopy(expected)
    changed["entries"][0][0] = False
    assert not runner.canonical_equal(expected, changed)


@pytest.mark.parametrize("case", ["kappa1_mutant", "ordering_mutant"])
def test_actual_volume_parameter_mutation_requires_changed_and_nonzero_same_slot(case):
    cases = blank_cases()
    field, residual = ("J", "RJ") if case == "kappa1_mutant" else ("Ax", "Rx")
    cases["baseline"][field][0][0] = F(3)
    cases["baseline"][residual][0][0] = F(3)
    cases["baseline"][field][1][1] = F(2)
    cases["baseline"][residual][1][1] = F(2)
    cases[case] = copy.deepcopy(cases["baseline"])
    cases[case][field][0][0] = F(0)
    cases[case][residual][0][0] = F(0)
    row = M.mutation_evidence(cases)["controls"][case]
    assert row["parameter_caused_registered_change"] is True
    assert row["actual_bridge_differences"][residual]["nonzero_slots"] == 1
    assert row["causal_changed_residual_slots"][field] == 0
    assert row["stale_original_symbol_rejected"] is row["accepted"] is False
    cases[case][field][0][0] = F(1)
    cases[case][residual][0][0] = F(1)
    row = M.mutation_evidence(cases)["controls"][case]
    assert row["causal_changed_residual_slots"][field] == 1 and row["accepted"] is True


def test_actual_volume_failure_preserves_all_three_cases_and_complete_outputs(
    monkeypatch,
):
    cases = blank_cases()
    cases["baseline"]["J"][57][57] = F(7)
    cases["kappa1_mutant"]["J"][0][0] = F(1)
    cases["ordering_mutant"]["Ax"][0][1] = F(2)
    calls, saved = [], {}
    monkeypatch.setattr(
        M, "parent_provenance_manifest", lambda raw: {"controlled": True}
    )
    monkeypatch.setattr(
        M,
        "oracle_matrices",
        lambda raw, check: {
            key: cases["baseline"]["Ay"] for key in ("J", "Ax", "Ay", "Az")
        },
    )
    monkeypatch.setattr(E, "source_manifest", lambda: {"controlled": True})

    def evaluate(**kwargs):
        case = M.CASE_NAMES[len(calls)]
        calls.append((kwargs["kappa1"], kwargs["ordering_scale"]))
        return dict(
            cases[case], parameters={"controlled": case}, chart={}, operations={}
        )

    monkeypatch.setattr(E, "evaluate_case", evaluate)
    result = M.build_certificate(
        {}, sink=lambda name, record: saved.setdefault(name, record)
    )
    assert calls == [(F(1, 10), F(1, 5)), (F(1, 5), F(1, 5)), (F(1, 10), F(2, 5))]
    assert tuple(saved) == M.RECORD_ORDER
    assert len(saved) == 36
    assert result["algebraic_jacobian_bridge"] is result["accepted"] is False
    assert saved["baseline__RJ"]["entries"][-1] == [57, 57, "7"]
    assert sum(len(saved[name]["entries"]) for name in M.MATRIX_NAMES) == 80910


def test_actual_volume_sink_failure_stops_before_later_parameter_cases(monkeypatch):
    cases = blank_cases()
    calls, seen = [], []
    monkeypatch.setattr(M, "parent_provenance_manifest", lambda raw: {})
    monkeypatch.setattr(
        M,
        "oracle_matrices",
        lambda raw, check: {
            key: cases["baseline"][key] for key in ("J", "Ax", "Ay", "Az")
        },
    )

    def evaluate(**kwargs):
        calls.append(kwargs)
        return dict(cases["baseline"], parameters={}, chart={}, operations={})

    def sink(name, record):
        seen.append(name)
        stop()

    monkeypatch.setattr(E, "evaluate_case", evaluate)
    with pytest.raises(StopControl):
        M.build_certificate({}, sink=sink)
    assert len(calls) == 1 and seen == ["baseline__F0"]


def test_actual_volume_budget_failure_before_actual_rhs(monkeypatch):
    monkeypatch.setattr(M, "parent_provenance_manifest", lambda raw: {})
    monkeypatch.setattr(M, "oracle_matrices", lambda raw, check: {})
    monkeypatch.setattr(
        E,
        "evaluate_case",
        lambda **kwargs: pytest.fail("RHS must not run after guard failure"),
    )
    with pytest.raises(StopControl):
        M.build_certificate({}, guard=stop, sink=lambda name, record: None)


def test_actual_volume_parent_bytes_rejected_before_scientific_backend(monkeypatch):
    raw = {name: b"{}" for name in M.PARENT_FILES}
    monkeypatch.setattr(
        E,
        "evaluate_case",
        lambda **kwargs: pytest.fail("invalid parent must not execute RHS"),
    )
    with pytest.raises(ValueError):
        M.build_certificate(raw, sink=lambda name, record: None)
    raw.pop(next(iter(raw)))
    with pytest.raises(ValueError):
        M.parent_provenance_manifest(raw)


@pytest.mark.parametrize(
    "name",
    [
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_sbp_volume.py",
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "science/numerical_relativity/fo_ccz4_gauge_profile.py",
    ],
)
def test_actual_volume_source_byte_and_ast_drift_refused(name):
    raw = (ROOT / name).read_bytes()
    assert isinstance(E.verify_source(raw, name), ast.Module)
    with pytest.raises(ValueError):
        E.verify_source(raw + b"\n# controlled source drift\n", name)
    changed = raw.replace(b"def ", b"def controlled_changed_", 1)
    assert changed != raw
    with pytest.raises(ValueError):
        E.verify_source(changed, name)
    with pytest.raises(ValueError):
        E.verify_source(raw, "unregistered.py")


def test_actual_volume_source_manifest_binds_original_ast_without_rhs_execution(
    monkeypatch,
):
    monkeypatch.setattr(
        E,
        "_compile",
        lambda *args: pytest.fail(
            "manifest may not compile or run scientific definitions"
        ),
    )
    manifest = E.source_manifest()
    assert manifest["seed_count"] == 232
    assert (
        manifest["physical_projection"] is manifest["auxiliary_reconstruction"] is False
    )
    assert manifest["adaptation_counts"]["centered-first-order-exponential-chart"] == 2
    names = {row["name"] for row in manifest["bindings"] if row["compiled"]}
    assert {
        "_fo_ccz4_volume_rhs_3d",
        "_geometry",
        "_sym_first",
        "_sym_shift_gradient",
        "_sym_metric_gradient",
        "state_from_slots",
        "_rhs_components",
        "_finite_array",
    } <= names
    source = "science/numerical_relativity/fo_ccz4_rhs.py"
    tree = ast.parse((ROOT / source).read_text(encoding="utf-8"))
    original = next(
        node
        for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name == "_fo_ccz4_volume_rhs_3d"
    )
    row = next(
        row
        for row in manifest["bindings"]
        if row["source"] == source and row["name"] == original.name
    )
    assert row["original_ast"] == ast.dump(original, include_attributes=False)


def test_actual_volume_parent_manifest_is_pure_supplied_bytes(monkeypatch):
    directory = ROOT / "tmp/nr-shadow-evidence" / M.PARENT_DIRECTORY
    raw = {
        name: (directory / path).read_bytes()
        for name, (path, _) in M.PARENT_FILES.items()
    }
    monkeypatch.setattr(
        Path,
        "read_bytes",
        lambda path: pytest.fail(
            "supplied-parent verifier may not reread external files"
        ),
    )
    manifest = M.parent_provenance_manifest(raw)
    assert manifest["parent_matrices_rebuilt"] is False
    assert set(manifest["input_hashes"]) == set(M.PARENT_FILES)
    name = "J58.json"
    raw[name] += b"\n"
    with pytest.raises(ValueError):
        M.parent_provenance_manifest(raw)


def test_actual_volume_registration_and_domain_do_not_claim_discrete_solver():
    domain = M.domain_metadata()
    assert len(M.MATRIX_NAMES) == 27 and len(M.RECORD_ORDER) == 36
    assert len(set(M.RECORD_ORDER)) == 36 and len(M.PARENT_FILES) == 9
    assert domain["total_seed_variables"] == 232
    assert domain["all_off_constraint_directions"] is True
    assert domain["all_three_case_slots"] == 80910
    for name in (
        "auxiliary_fields_reconstructed",
        "algebraic_constraints_projected",
        "actual_binary64_rhs_executed",
        "full_python_semantics_proved",
        "variable_background_energy_validated",
        "actual_constraint_diagnostic_bridge_proved",
        "physical_gate",
        "scientificPayloadWriteback",
    ):
        assert domain[name] is False


def test_actual_volume_replay_manifest_has_explicit_common_trusted_base(monkeypatch):
    monkeypatch.setattr(
        E,
        "evaluate_with_backend",
        lambda *args, **kwargs: pytest.fail("manifest must not evaluate science"),
    )
    manifest = I.replay_manifest()
    assert manifest["sparse_forward_coefficients_reused"] is False
    assert manifest["saved_jacobians_used_to_generate_replay"] is False
    assert manifest["independent_physical_source"] is False
    assert len(manifest["shared_trusted_base"]) == 3
    for name, digest in manifest["source_hashes"].items():
        assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest
    tree = ast.parse(
        (ROOT / "scripts/nr_case12_actual_volume_replay.py").read_text(encoding="utf-8")
    )
    assert not any(
        isinstance(node, ast.ImportFrom)
        and node.module == "nr_case12_actual_volume_jet"
        for node in tree.body
    )
