"""Owned small controls for 580-seed actual constraint diagnostics.

The complete diagnostic and its two real source variants execute only in the
registered worker, once per implementation. Tests use scalar, packing and
certificate counterexamples and do not call a complete scientific candidate.
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

assert os.environ.get("NR_OWNED_CONTROL_RUN_ID"), "owned actual-constraint run required"
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import nr_case12_actual_constraint_jet as E  # noqa: E402
import nr_case12_actual_constraint_replay as I  # noqa: E402
import nr_case12_actual_constraint_diagnostic as M  # noqa: E402


class StopControl(RuntimeError):
    pass


def stop():
    raise StopControl("controlled owned interruption")


def scalar(kind):
    return E.SparseJet if kind == "forward" else I.ReplayTape().scalar_type


def backend(kind):
    return E.ConstraintArrayBackend() if kind == "forward" else I.make_backend()


def zero_matrix(rows=43, columns=580):
    return [[F(0) for _ in range(columns)] for _ in range(rows)]


def blank_cases():
    return {
        case: dict(F0=zero_matrix(43, 1), C=zero_matrix(), R=zero_matrix())
        for case in M.CASE_NAMES
    }


@pytest.fixture(scope="module")
def runner():
    path = ROOT / "scripts/run-nr-k3-case12-actual-constraint-diagnostic.py"
    spec = importlib.util.spec_from_file_location(
        "owned_actual_constraint_runner", path
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_constraint_all580_seeds_and_symmetric_second_derivative_map(kind):
    c = scalar(kind)
    for index in range(580):
        node = c.seed(index)
        assert node.value == 0 and dict(node.coefficients) == {index: F(1)}
        assert node.spatial_order == (0 if index < 58 else 1 if index < 232 else 2)
    pairs = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))
    observed = set()
    for slot in range(58):
        for first in range(3):
            first_derivative = c.seed(slot).gradient(first)
            assert dict(first_derivative.coefficients) == {58 + 58 * first + slot: F(1)}
            for second in range(3):
                pair = (min(first, second), max(first, second))
                index = 232 + 58 * pairs.index(pair) + slot
                second_derivative = first_derivative.gradient(second)
                assert second_derivative.spatial_order == 2
                assert dict(second_derivative.coefficients) == {index: F(1)}
                observed.add(index)
    assert observed == set(range(232, 580))


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_constraint_mixed_hessian_two_orders_add_without_half_factor(kind):
    c = scalar(kind)
    q = c.seed(57)
    xy = q.gradient(0).gradient(1)
    yx = q.gradient(1).gradient(0)
    assert dict(xy.coefficients) == dict(yx.coefficients) == {347: F(1)}
    assert dict((xy + yx).coefficients) == {347: F(2)}
    assert dict(q.gradient(2).gradient(2).coefficients) == {579: F(1)}


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_constraint_first_variation_commutes_with_two_spatial_derivatives(kind):
    c = scalar(kind)
    q = c(F(2), {3: F(1)})
    direct = (q * q).gradient(0).gradient(1)
    product_rule = 2 * (q.gradient(0) * q.gradient(1) + q * q.gradient(0).gradient(1))
    assert direct.value == product_rule.value == 0
    assert dict(direct.coefficients) == dict(product_rule.coefficients) == {293: F(4)}
    squared_gradient = q.gradient(0) * q.gradient(1)
    assert not squared_gradient.coefficients and squared_gradient.value == 0
    reciprocal = (1 / q).gradient(2).gradient(2)
    assert dict(reciprocal.coefficients) == {525: F(-1, 4)}


@pytest.mark.parametrize(
    "case",
    [
        ("forward", "direct"),
        ("forward", "cancel"),
        ("forward", "zero"),
        ("forward", "zero_polynomial"),
        ("reverse", "direct"),
        ("reverse", "cancel"),
        ("reverse", "zero"),
        ("reverse", "zero_polynomial"),
    ],
)
def test_actual_constraint_third_derivative_refused_after_structural_cancellation(case):
    kind, mode = case
    c = scalar(kind)
    second = c.seed(4).gradient(0).gradient(1)
    if mode == "cancel":
        second = second - second
    elif mode == "zero":
        second = 0 * second
    elif mode == "zero_polynomial":
        second = (c.seed(4) * c.seed(4)).gradient(0).gradient(1)
        assert not second.coefficients
    assert second.spatial_order == 2
    with pytest.raises(ValueError):
        second.gradient(2)


@pytest.mark.parametrize(
    "case",
    [
        ("forward", -1),
        ("forward", 580),
        ("forward", True),
        ("reverse", -1),
        ("reverse", 580),
        ("reverse", True),
    ],
)
def test_actual_constraint_unregistered_seed_refused(case):
    kind, index = case
    with pytest.raises(ValueError):
        scalar(kind).seed(index)


@pytest.mark.parametrize(
    "case", [("forward", 0.5), ("forward", True), ("reverse", 0.5), ("reverse", True)]
)
def test_actual_constraint_inexact_scalar_and_coefficient_refused(case):
    kind, value = case
    c = scalar(kind)
    with pytest.raises(ValueError):
        c(value)
    with pytest.raises(ValueError):
        c(F(0), {0: value})
    with pytest.raises((ValueError, TypeError)):
        c.seed(0) + value


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_constraint_second_derivative_of_offdiagonal_inverse_and_det(kind):
    b = backend(kind)
    c = b.scalar_type
    q = c.seed(1)
    matrix = b.asarray([[2, 1 + q, 0], [1 + q, 3, 0], [0, 0, 4]])
    determinant = b.scalar(b.determinant(matrix).item())
    inverse = b.inverse(matrix)
    assert determinant.value == F(20)
    assert dict(determinant.gradient(0).gradient(2).coefficients) == {349: F(-8)}
    assert dict(inverse[0, 1].gradient(0).gradient(2).coefficients) == {349: F(-7, 25)}
    assert dict(inverse[0, 0].gradient(0).gradient(2).coefficients) == {349: F(6, 25)}


def test_actual_constraint_reverse_graph_cut_and_deadline_are_detectable():
    control = {"armed": False, "calls": 0}

    def check():
        if control["armed"]:
            control["calls"] += 1
            if control["calls"] == 2:
                stop()

    tape = I.ReplayTape(check)
    c = tape.scalar_type
    q = c(F(2), {579: F(1)})
    good = q**2
    bad = q**2
    bad.parents = ()
    assert good.coefficients.get(579) == F(4)
    assert bad.coefficients.get(579, F(0)) != F(4)
    expression = c.seed(0)
    for _ in range(300):
        expression = expression + 1
    control["armed"] = True
    with pytest.raises(StopControl):
        _ = expression.coefficients
    assert expression._coefficients is None and control["calls"] == 2


def test_actual_constraint_oracle_all_polynomial_groups_without_sampling(
    monkeypatch, runner
):
    matrices = [[[{} for _ in range(58)] for _ in range(43)] for _ in range(3)]
    matrices[0][0][0] = {(0, 0, 0): F(2)}
    matrices[1][1][2] = {(0, 1, 0): F(-3)}
    matrices[2][2][57] = {(1, 1, 0): F(5), (0, 0, 2): F(7)}
    monkeypatch.setattr(M, "parent_provenance_manifest", lambda raw: {})
    monkeypatch.setattr(
        M.POLY, "decode_matrix", lambda value, **kwargs: matrices[value]
    )
    result = M.oracle_matrix({"C0.json": b"0", "C1.json": b"1", "C2.json": b"2"})
    nonzero = {
        (i, j): value
        for i, row in enumerate(result)
        for j, value in enumerate(row)
        if value
    }
    assert nonzero == {(0, 0): F(2), (1, 118): F(-3), (2, 347): F(5), (2, 579): F(7)}
    assert (
        runner.independent_oracle(
            {"C0.json": b"0", "C1.json": b"1", "C2.json": b"2"}, lambda: None
        )
        == result
    )
    matrices[2][2][57][(0, 1, 0)] = F(1)
    with pytest.raises(ValueError):
        M.oracle_matrix({"C0.json": b"0", "C1.json": b"1", "C2.json": b"2"})
    with pytest.raises(ValueError):
        runner.independent_oracle(
            {"C0.json": b"0", "C1.json": b"1", "C2.json": b"2"}, lambda: None
        )


def test_actual_constraint_driver49_maps_to40_and_preserves_nine_lower_slots(runner):
    raw = [SimpleNamespace(value=F(i), coefficients={i: F(i + 1)}) for i in range(49)]
    for block in range(3):
        for i, j in ((0, 1), (0, 2), (1, 2)):
            raw[17 + 9 * block + 3 * j + i] = raw[17 + 9 * block + 3 * i + j]
    physical = list(range(5)) + list(range(8, 43))
    selected = [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        21,
        22,
        25,
        26,
        27,
        28,
        30,
        31,
        34,
        35,
        36,
        37,
        39,
        40,
        43,
        44,
        45,
        46,
        47,
        48,
    ]
    baseline = dict(F0=zero_matrix(43, 1), C=zero_matrix())
    for target, source in zip(physical, selected, strict=True):
        baseline["F0"][target][0] = raw[source].value
        for index, coefficient in raw[source].coefficients.items():
            baseline["C"][target][index] = coefficient
    result = M.driver_matrices(raw, baseline)
    assert runner.independent_driver(raw, baseline, lambda: None) == result
    assert M.matrix_stats(result["driverAgreement"])["all_zero"] is True
    assert M.matrix_stats(result["driverSymmetry"])["all_zero"] is True
    assert len(result["driverC"]) == 49 and all(
        len(row) == 580 for row in result["driverC"]
    )
    old = raw[42]
    raw[42] = SimpleNamespace(
        value=old.value + 7, coefficients={**old.coefficients, 579: F(9)}
    )
    changed = M.driver_matrices(raw, baseline)
    assert runner.independent_driver(raw, baseline, lambda: None) == changed
    assert M.matrix_stats(changed["driverAgreement"])["all_zero"] is True
    assert changed["driverSymmetry"][-1][0] == -7
    assert changed["driverSymmetry"][-1][-1] == -9
    assert M.matrix_stats(changed["driverSymmetry"])["nonzero_slots"] == 2


@pytest.mark.parametrize("case", ["momentum_trace_mutant", "connection_target_mutant"])
def test_actual_constraint_mutation_requires_same_slot_causality_and_target_rows(case):
    cases = blank_cases()
    row = 1 if case == "momentum_trace_mutant" else 5
    cases["baseline"]["C"][row][0] = F(2)
    cases[case]["C"][row][1] = F(1)
    cases[case]["R"][row][0] = F(0)
    cases[case]["R"][row][2] = F(7)
    evidence = M.mutation_report(cases)["controls"][case]
    assert (
        evidence["changed_slots"] == 2
        and evidence["causal_changed_residual_slots"] == 0
    )
    assert evidence["accepted"] is False
    cases[case]["R"][row][1] = F(1)
    assert M.mutation_report(cases)["controls"][case]["accepted"] is True
    cases[case]["C"][42][579] = F(1)
    evidence = M.mutation_report(cases)["controls"][case]
    assert (
        evidence["changed_outside_target_rows"] == 1 and evidence["accepted"] is False
    )


@pytest.mark.parametrize(
    "mode", ["missing", "duplicate", "float", "bool_index", "noncanonical", "extra"]
)
def test_actual_constraint_complete_matrix_codec_rejects_slot_and_type_drift(mode):
    record = M.encode_matrix([[F(0), F(2, 3)], [F(-1), F(0)]])
    if mode == "missing":
        record["entries"].pop()
    elif mode == "duplicate":
        record["entries"][-1] = copy.deepcopy(record["entries"][0])
    elif mode == "float":
        record["entries"][0][2] = 0.0
    elif mode == "bool_index":
        record["entries"][0][0] = False
    elif mode == "noncanonical":
        record["entries"][1][2] = "4/6"
    else:
        record["extra"] = True
    with pytest.raises(ValueError):
        M.decode_matrix(record, (2, 2))


def test_actual_constraint_complete_failure_saved_before_rejection(monkeypatch):
    calls, saved = [], {}
    monkeypatch.setattr(M, "parent_provenance_manifest", lambda raw: {})
    monkeypatch.setattr(M, "oracle_matrix", lambda raw, check: zero_matrix())
    monkeypatch.setattr(E, "source_manifest", lambda: {"controlled": True})

    def evaluate(**kwargs):
        calls.append(kwargs["case"])
        rows = [SimpleNamespace(value=F(0), coefficients={}) for _ in range(43)]
        rows[42] = SimpleNamespace(value=F(1), coefficients={579: F(7)})
        driver = (
            [SimpleNamespace(value=F(0), coefficients={}) for _ in range(49)]
            if kwargs["case"] == "baseline"
            else None
        )
        return dict(rows=rows, raw_driver=driver, execution={"case": kwargs["case"]})

    monkeypatch.setattr(E, "evaluate_case", evaluate)
    acceptance = M.build_certificate(
        {}, sink=lambda name, record: saved.setdefault(name, record)
    )
    assert calls == list(M.CASE_NAMES)
    assert tuple(saved) == M.RECORD_ORDER and len(saved) == 22
    assert (
        acceptance["baseline_equilibrium"]
        is acceptance["complete_physical43_bridge"]
        is acceptance["accepted"]
        is False
    )
    assert saved["baseline__R"]["entries"][-1] == [42, 579, "7"]
    assert sum(len(saved[name]["entries"]) for name in M.MATRIX_NAMES) == 206707


def test_actual_constraint_sink_and_budget_abort_before_later_cases(monkeypatch):
    calls, saved = [], []
    monkeypatch.setattr(M, "parent_provenance_manifest", lambda raw: {})
    monkeypatch.setattr(M, "oracle_matrix", lambda raw, check: zero_matrix())

    def evaluate(**kwargs):
        calls.append(kwargs["case"])
        return dict(
            rows=[SimpleNamespace(value=F(0), coefficients={}) for _ in range(43)],
            raw_driver=None,
            execution={},
        )

    def sink(name, record):
        saved.append(name)
        stop()

    monkeypatch.setattr(E, "evaluate_case", evaluate)
    with pytest.raises(StopControl):
        M.build_certificate({}, sink=sink)
    assert calls == ["baseline"] and saved == ["baseline__F0"]
    calls.clear()
    with pytest.raises(StopControl):
        M.build_certificate({}, guard=stop, sink=lambda *args: None)
    assert calls == []


def test_actual_constraint_parent_bytes_checked_before_scientific_evaluation(
    monkeypatch,
):
    monkeypatch.setattr(
        E,
        "evaluate_case",
        lambda **kwargs: pytest.fail("invalid parent must fail before diagnostics"),
    )
    with pytest.raises(ValueError):
        M.build_certificate(
            {name: b"{}" for name in M.PARENT_FILES}, sink=lambda *args: None
        )


def test_actual_constraint_domain_and_full_output_registration():
    domain = M.domain_metadata()
    assert domain["seeds"] == 580
    assert domain["independent_symmetric_hessians"] == 348
    assert (
        domain["hessian_seeds_are_actual_derivatives_not_taylor_coefficients"] is True
    )
    assert domain["mixed_polynomial_coefficient_divided_by_two"] is False
    assert (
        domain["perturbation_amplitude_order"] == 1
        and domain["max_spatial_derivative_order"] == 2
    )
    assert (
        len(M.MATRIX_NAMES) == 13
        and len(M.RECORD_ORDER) == len(set(M.RECORD_ORDER)) == 22
    )
    assert len(M.PARENT_FILES) == 13
    assert all(domain[key] is False for key in M.FALSE_FLAGS)
    assert domain["binary64_or_discrete_diagnostics_qualified"] is False


def assignment(function, name):
    found = [
        node
        for node in ast.walk(function)
        if isinstance(node, ast.Assign)
        and len(node.targets) == 1
        and isinstance(node.targets[0], ast.Name)
        and node.targets[0].id == name
    ]
    assert len(found) == 1
    return found[0]


def expression(node, namespace):
    tree = ast.fix_missing_locations(ast.Expression(copy.deepcopy(node)))
    return eval(
        compile(tree, "<owned-actual-source-small-expression>", "eval"), namespace
    )


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_constraint_original_matmul_stack_slice_and_empty_routing(kind):
    b = backend(kind)
    c = b.scalar_type
    q = c.seed(2)
    left = b.asarray([[1 + q, 2], [0, 3]])
    right = b.asarray([[4, 0], [5, 6]])
    product = left @ right
    assert [[b.scalar(x).value for x in row] for row in product] == [[14, 12], [15, 18]]
    assert dict(b.scalar(product[0, 0]).coefficients) == {2: F(4)}
    assert not b.scalar(product[0, 1]).coefficients
    packed = b.stack([product[:, 1], product[:, 0]], axis=-1)
    assert packed.shape == (2, 2) and packed.dtype == object
    differentiated = b.spatial_derivative(packed[:, 1], 2)
    assert dict(differentiated[0].coefficients) == {176: F(4)}
    assert not differentiated[1].coefficients
    with pytest.raises(ValueError):
        b.spatial_derivative(b.empty((1,)), 0)


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_constraint_actual_log_adapter_preserves_alpha_chi_chain(kind):
    b = backend(kind)
    c = b.scalar_type
    ns, _, _ = E._compile(b, lambda: None)
    alpha0, chi0 = F(17, 20), F(18, 25)
    ns.update(_alpha_center=alpha0, _chi_center=chi0)
    alpha = b.chart_exp(b.asarray(c.seed(6)), alpha0)
    chi = b.chart_exp(b.asarray(2 * c.seed(10)), chi0)
    ns["b"] = SimpleNamespace(lapse=alpha, chi=chi)
    nodes, _, _ = E._program()
    driver = next(
        node
        for node in nodes
        if isinstance(node, ast.FunctionDef) and node.name == "metric_constraints"
    )
    calls = [
        node
        for node in ast.walk(driver)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == "_chart_log"
    ]
    assert len(calls) == 2
    outputs = {ast.unparse(node.args[0]): expression(node, ns).item() for node in calls}
    assert dict(outputs["b.lapse"].gradient(0).coefficients) == {64: F(1)}
    assert dict((outputs["b.chi"] / 2).gradient(1).gradient(2).coefficients) == {
        474: F(1)
    }
    # These are small wrong chart maps, not claims about visibility in the full
    # constant-background diagnostic Jacobian.
    assert dict((alpha.item() - alpha0).gradient(0).coefficients) == {64: alpha0}
    assert (alpha.item() - alpha0).gradient(0).coefficients != outputs[
        "b.lapse"
    ].gradient(0).coefficients
    assert (chi.item() / 2).gradient(0).coefficients != (outputs["b.chi"] / 2).gradient(
        0
    ).coefficients
    assert (
        outputs["b.chi"].gradient(0).coefficients
        != (outputs["b.chi"] / 2).gradient(0).coefficients
    )
    with pytest.raises(ValueError):
        b.chart_log(alpha, F(1))
    with pytest.raises(ValueError):
        b.chart_log(b.asarray(c(alpha0, {58: F(1)})), alpha0)


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_constraint_actual_trace_assignment_mutation_has_real_offconstraint_gap(
    kind,
):
    b = backend(kind)
    c = b.scalar_type
    ns, _, _ = E._compile(b, lambda: None)
    _, variants, _ = E._program()
    baseline, mutant = variants["baseline"], variants["momentum_trace_mutant"]
    mixed = b.asarray([[c(F(2), {11: F(1)}), 0, 0], [0, 0, 0], [0, 0, 0]]).reshape(
        (1, 1, 1, 3, 3)
    )
    q = [b.zeros((1, 1, 1)) for _ in range(58)]
    ns.update(
        mixed=mixed,
        q=q,
        order=4,
        gi=b.asarray([[1, 0, 0], [0, 1, 0], [0, 0, 1]]).reshape((1, 1, 1, 3, 3)),
        ricci=b.zeros((1, 1, 1, 3, 3)),
    )
    good = expression(assignment(baseline, "actual_trace").value, ns)
    bad = expression(assignment(mutant, "actual_trace").value, ns)
    assert b.scalar(good.item()).value == 2 and b.scalar(bad.item()).value == 0
    assert dict(b.spatial_derivative(good, 0).item().coefficients) == {69: F(1)}
    assert not b.spatial_derivative(bad, 0).item().coefficients
    hamiltonian = assignment(baseline, "hamiltonian").value
    assert ast.dump(hamiltonian) == ast.dump(assignment(mutant, "hamiltonian").value)
    ns["actual_trace"] = good
    original_h = expression(hamiltonian, ns).item()
    ns["actual_trace"] = bad
    changed_h = expression(hamiltonian, ns).item()
    assert original_h.value == 0 and not original_h.coefficients
    assert changed_h.value == -4 and dict(changed_h.coefficients) == {11: F(-4)}
    # The global assignment really also changes nonlinear H. Only the full
    # case12 first-variation target-row gate can establish its registered scope.


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_constraint_contracted_christoffel_differs_from_inverse_divergence(kind):
    b = backend(kind)
    c = b.scalar_type
    ns, _, _ = E._compile(b, lambda: None)
    _, variants, _ = E._program()
    h = b.asarray([[1 + c.seed(0), 0, 0], [0, 1, 0], [0, 0, 1]]).reshape(
        (1, 1, 1, 3, 3)
    )
    ns.update(h=h, hi=b.inverse(h), order=4)
    good = expression(assignment(variants["baseline"], "metric_gamma").value, ns)
    bad = expression(
        assignment(variants["connection_target_mutant"], "metric_gamma").value, ns
    )
    assert dict(good[0, 0, 0, 0].coefficients) == {58: F(1, 2)}
    assert dict(bad[0, 0, 0, 0].coefficients) == {58: F(1)}
    z_good = -b.einsum("...ij,...j->...i", h, good) / 2
    z_bad = -b.einsum("...ij,...j->...i", h, bad) / 2
    assert dict((z_bad - z_good)[0, 0, 0, 0].coefficients) == {58: F(-1, 4)}


@pytest.mark.parametrize("kind", ["forward", "reverse"])
def test_actual_constraint_actual_lower_Z_wrapper_keeps_current_metric_variation(kind):
    b = backend(kind)
    c = b.scalar_type
    tree = ast.parse(
        (ROOT / "scripts/nr_case12_actual_constraint_jet.py").read_text(
            encoding="utf-8"
        )
    )
    function = next(
        n
        for n in tree.body
        if isinstance(n, ast.FunctionDef) and n.name == "evaluate_with_backend"
    )
    node = assignment(function, "z").value
    h = b.asarray([[2 + c.seed(0), 1 + c.seed(1), 0], [1 + c.seed(1), 3, 0], [0, 0, 4]])
    fields = {"Ghat": b.asarray([3 + c.seed(19), 5 + c.seed(20), 0])}
    result = expression(node, {"backend": b, "h": h, "fields": fields})
    assert result[0].value == F(11, 2)
    assert dict(result[0].coefficients) == {
        0: F(3, 2),
        1: F(5, 2),
        19: F(1),
        20: F(1, 2),
    }
    wrong = (
        b.einsum(
            "...ij,...j->...i",
            b.asarray([[2, 1, 0], [1, 3, 0], [0, 0, 4]]),
            fields["Ghat"],
        )
        / 2
    )
    assert dict((result - wrong)[0].coefficients) == {0: F(3, 2), 1: F(5, 2)}


@pytest.mark.parametrize("text", [".5", ".25", "1.e-3", "2.50", "5.e-11"])
def test_actual_constraint_leading_dot_decimal_adapter_uses_source_lexeme(text):
    source = "def small():\n    return " + text + "\n"
    adapter = E._DiagnosticAdapt("<controlled>", "small", source)
    adapted = ast.fix_missing_locations(adapter.visit(ast.parse(source).body[0]))
    assert not any(
        isinstance(n, ast.Constant) and type(n.value) is float
        for n in ast.walk(adapted)
    )
    call = adapted.body[0].value
    assert (
        isinstance(call, ast.Call)
        and call.func.id == "F"
        and call.args[0].value == text
    )
    ns = {"F": F}
    exec(
        compile(
            ast.Module(body=[adapted], type_ignores=[]),
            "<owned-decimal-control>",
            "exec",
        ),
        ns,
    )
    assert ns["small"]() == F(text)


@pytest.mark.parametrize(
    "case",
    [
        ("constraint_fields", "np.exp(q[10])"),
        ("metric_constraints", "np.log(b.trace_k)"),
    ],
)
def test_actual_constraint_unregistered_chart_AST_refused(case):
    name, value = case
    source = "def " + name + "():\n    return " + value + "\n"
    adapter = E._DiagnosticAdapt("<controlled>", name, source)
    with pytest.raises(ValueError):
        adapter.visit(ast.parse(source).body[0])


def test_actual_constraint_source_variants_are_exact_single_assignment_changes():
    _, variants, manifest = E._program()
    baseline = variants["baseline"]
    for case, target in (
        ("momentum_trace_mutant", "actual_trace"),
        ("connection_target_mutant", "metric_gamma"),
    ):
        altered = copy.deepcopy(variants[case])
        assignment(altered, target).value = copy.deepcopy(
            assignment(baseline, target).value
        )
        assert ast.dump(altered, include_attributes=False) == ast.dump(
            baseline, include_attributes=False
        )
        rows = manifest["variants"][case]["mutations"]
        assert len(rows) == 1 and rows[0]["target"] == target
    assert (
        ast.unparse(assignment(variants["momentum_trace_mutant"], "actual_trace").value)
        == "q[17]"
    )
    with pytest.raises(ValueError):
        E._variant(baseline, "unregistered")
    duplicated = copy.deepcopy(baseline)
    duplicated.body.append(copy.deepcopy(assignment(baseline, "actual_trace")))
    with pytest.raises(ValueError):
        E._variant(duplicated, "momentum_trace_mutant")


@pytest.mark.parametrize(
    "source_name",
    [
        "science/numerical_relativity/fo_ccz4_relaxation_convergence.py",
        "science/numerical_relativity/fo_ccz4_checkpoint.py",
        "science/numerical_relativity/fo_ccz4_sbp_nonlinear.py",
    ],
)
def test_actual_constraint_source_byte_and_AST_drift_refused(source_name):
    raw = (ROOT / source_name).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == E.SOURCE_HASHES[source_name]
    assert isinstance(E.verify_source(raw, source_name), ast.Module)
    with pytest.raises(ValueError):
        E.verify_source(raw + b"\n# controlled drift\n", source_name)
    with pytest.raises(ValueError):
        E.verify_source(raw.replace(b"def ", b"def changed_", 1), source_name)
    with pytest.raises(ValueError):
        E.verify_source(raw, "unregistered.py")


def test_actual_constraint_manifests_do_not_construct_scientific_backend(monkeypatch):
    monkeypatch.setattr(
        E,
        "ConstraintArrayBackend",
        lambda *a, **k: pytest.fail("manifest must stay metadata-only"),
    )
    monkeypatch.setattr(
        E, "_compile", lambda *a, **k: pytest.fail("manifest must not execute source")
    )
    manifest = E.source_manifest()
    assert manifest["seed_count"] == 580 and manifest["binary64_execution"] is False
    assert manifest["adaptation_counts"]["centered-log-under-spatial-derivative"] == 2
    independent = I.replay_manifest()
    assert (
        independent["seed_count"] == 580
        and independent["structural_third_derivative_refused"] is True
    )
    assert independent["sparse_forward_coefficients_reused"] is False
    assert independent["saved_constraint_coefficients_used_to_generate_replay"] is False
    assert (
        independent["source_executed_by_manifest"] is False
        and independent["independent_physical_source"] is False
    )
    for name, digest in independent["source_hashes"].items():
        assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest


def test_actual_constraint_parent_manifest_uses_supplied_bytes_and_rejects_drift(
    monkeypatch,
):
    raw = {
        name: (ROOT / "tmp/nr-shadow-evidence" / directory / path).read_bytes()
        for name, (directory, path, _) in M.PARENT_FILES.items()
    }
    monkeypatch.setattr(
        Path, "read_bytes", lambda *a: pytest.fail("manifest must use supplied bytes")
    )
    record = M.parent_provenance_manifest(raw)
    assert set(record["input_hashes"]) == set(raw) and len(raw) == 13
    name = "C2.json"
    with pytest.raises(ValueError):
        M.parent_provenance_manifest({**raw, name: raw[name] + b" "})
    with pytest.raises(ValueError):
        M.parent_provenance_manifest({k: v for k, v in raw.items() if k != name})
    with pytest.raises(ValueError):
        M.parent_provenance_manifest({**raw, name: bytearray(raw[name])})


def test_actual_constraint_independent_extraction_and_full_slot_comparison(runner):
    scalar_rows = [SimpleNamespace(value=F(3), coefficients={0: F(2), 579: F(-7)})]
    f0, coefficients = runner.independent_rows(scalar_rows, 1, lambda: None)
    assert f0 == [[F(3)]] and len(coefficients[0]) == 580
    assert coefficients[0][0] == 2 and coefficients[0][-1] == -7
    good = M.encode_matrix(coefficients)
    changed = copy.deepcopy(good)
    changed["entries"][-1][2] = "0"
    assert not runner.canonical_equal(good, changed)
    changed = copy.deepcopy(good)
    changed["entries"][0][0] = False
    assert not runner.canonical_equal(good, changed)
    with pytest.raises(ValueError):
        runner.independent_rows(
            [SimpleNamespace(value=F(0), coefficients={580: F(1)})], 1, lambda: None
        )
    with pytest.raises(StopControl):
        runner.independent_rows(scalar_rows, 1, stop)
