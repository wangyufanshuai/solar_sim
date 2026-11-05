"""Owned fixed-case12 uniform frequency growth; unexecuted candidate."""

from __future__ import annotations

import argparse
import ast
from collections import Counter
from fractions import Fraction as F
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
for folder in (ROOT, ROOT / "scripts"):
    if str(folder) not in sys.path:
        sys.path.insert(0, str(folder))
import nr_owned_control as G  # noqa: E402
import nr_single_scan_control as C  # noqa: E402
import nr_polynomial_certificate_replay as V  # noqa: E402

INTEGER_SOURCE = "scripts/nr_integer_polynomial_replay.py"
INTEGER_SHA = "5b4f8e7510cd32064cef2266d6d1d472bb1bde2f842f0836b37bcc0c74ddef7f"

METHOD = "nr-case12-uniform-frequency-growth-controls-v1"
HELPER = "scripts/run-nr-k3-case12-physical-frequency-reduction.py"
HELPER_SHA = "7c98a8929d07f6c5916e9369e60eef86d944a257f117ece7e7c7e9a1a64c4ae8"
PARENT = G.EVIDENCE / "nr-k3-case12-physical-frequency-reduction-controls-v1-20261015"
PARENT_GATE = "5817e42e5c38ff682146acf3ce8eb5afe439b5cfadddf0dc1e27f91c6ab2688d"
PARENT_WORKER = "c2739fbb4c40365cecb700c73522349bdcff0e116542b3d5ef2aa5280c3d9296"
EXTRA = (
    "scripts/nr_case12_uniform_frequency_growth.py",
    "scripts/tests/test_nr_case12_uniform_frequency_growth.py",
    "scripts/run-nr-k3-case12-uniform-frequency-growth.py",
    "science/numerical_relativity/DERIVATION-20261015-case12-uniform-frequency-growth.md",
    "science/numerical_relativity/EXPERIMENT-20261015-case12-uniform-frequency-growth.md",
    "science/numerical_relativity/RESULTS-20261015-case12-physical-frequency-reduction.md",
    "science/numerical_relativity/NOTE-20261015-case12-uniform-frequency-growth-next.md",
)
TEST_FILES = (EXTRA[1], "scripts/tests/test_nr_integer_polynomial_replay.py")
TEST_REGISTRATION = ((28, 87), (21, 73))
SCOPE = "fixed-case12 geometric=False constant-background full58 original-state uniform L2 growth and physical43 weighted frequency growth; no nonlinear RHS or boundary bridge"
FALSE_FLAGS = (
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
    "full_frequency_energy_validated",
    "local_differential_constraint_pde_derived",
    "constraint_damping_proved",
    "zero_frequency_full43_inverse_exists",
    "nonlinear_stability_validated",
    "physical_boundary_validated",
    "constraint_convergence_validated",
    "full_python_semantics_proved",
    "independent_external_review",
    "full_scientific_matrix_executed",
    "new_scientific_evolution",
    "gpu_executed",
    "historical_results_regraded",
    "eight_ray_rerun",
    "physical43_uniform_euclidean_growth_validated",
    "constraint_derivative_loss_absent_proved",
    "variable_background_energy_validated",
)


def qualified(directory, gate_sha, worker_sha):
    G.require(
        G.sha(directory / "qualification-gate.json") == gate_sha
        and G.sha(directory / "worker-result.json") == worker_sha,
        "unchanged qualified ancestor identity",
    )
    gate = G.read_terminal(directory / "qualification-gate.json")
    G.require(
        gate["passed"] is gate["completed"] is True
        and not gate["errors"]
        and gate["supervisor"]["cleanup_verified"] is True,
        "complete cleaned ancestor required",
    )
    return gate


def read(path):
    return json.loads(Path(path).read_bytes())


def helper():
    G.require(
        G.sha(ROOT / HELPER) == HELPER_SHA, "frozen physical closure-division runner"
    )
    spec = importlib.util.spec_from_file_location("nr_coordinate_parent", ROOT / HELPER)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def producer():
    import nr_case12_uniform_frequency_growth as module

    return module


def foundation():
    return helper().foundation()


def parent_gate():
    gate = qualified(PARENT, PARENT_GATE, PARENT_WORKER)
    G.require(
        gate["physical_frequency_reduction_validated"] is True
        and gate["physical_reduced_principal_bridge_validated"] is True,
        "complete parent local polynomial symbol qualification",
    )
    return gate


def sources(budget):
    parent_gate()
    table = helper().sources(budget)
    G.require(
        len(table) == 671
        and table == G.inventory(PARENT / "source-snapshot", "", budget),
        "all 671 parent sources unchanged",
    )
    G.require(
        not set(table).intersection(EXTRA),
        "seven additive physical-frequency-reduction sources",
    )
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 678, "678-source closure")
    return table


def history(budget):
    gate = parent_gate()
    table = helper().history(budget)
    expected = dict(gate["artifact_hashes"], **{"qualification-gate.json": PARENT_GATE})
    observed = G.inventory(PARENT, "", budget)
    G.require(
        observed == expected and len(observed) == 792,
        "complete physical division evidence",
    )
    table[PARENT.name] = observed
    G.require(
        len(table) == 27 and sum(map(len, table.values())) == 19556,
        "twenty-seven unchanged historical trees",
    )
    return table


def canonical_equal(actual, expected):
    if type(actual) is not type(expected):
        return False
    if type(expected) is dict:
        return (
            all(type(k) in (str, int) for k in actual)
            and set(actual) == set(expected)
            and all(canonical_equal(actual[k], expected[k]) for k in expected)
        )
    if type(expected) in (list, tuple):
        return len(actual) == len(expected) and all(
            canonical_equal(a, b) for a, b in zip(actual, expected, strict=True)
        )
    return type(expected) in (str, int, bool, type(None), F) and actual == expected


def registered_tests():
    tests = {}
    for filename, (functions, instances) in zip(
        TEST_FILES, TEST_REGISTRATION, strict=True
    ):
        tree = ast.parse((ROOT / filename).read_text(encoding="utf-8"))
        current = {}
        for node in tree.body:
            if not isinstance(node, ast.FunctionDef) or not node.name.startswith(
                "test_"
            ):
                continue
            count = 1
            for item in node.decorator_list:
                G.require(
                    isinstance(item, ast.Call)
                    and ast.unparse(item.func) == "pytest.mark.parametrize"
                    and len(item.args) == 2
                    and isinstance(item.args[1], (ast.List, ast.Tuple))
                    and not item.keywords,
                    "explicit test parameter registration",
                )
                count *= len(item.args[1].elts)
            G.require(
                node.name not in current and node.name not in tests and count > 0,
                "unique test names",
            )
            current[node.name] = count
        G.require(
            len(current) == functions and sum(current.values()) == instances,
            "registered frequency reduction control count",
        )
        tests.update(current)
    return tests


def test_evidence(path):
    root = ET.parse(path).getroot()
    cases = list(root.iter("testcase"))
    names = [[row.get("classname"), row.get("name")] for row in cases]
    expected = registered_tests()
    G.require(
        len(names) == len({tuple(row) for row in names})
        and dict(Counter(row.get("name", "").split("[", 1)[0] for row in cases))
        == expected
        and not any(list(root.iter(tag)) for tag in ("error", "failure", "skipped")),
        "all registered controls without errors or skips",
    )
    return dict(
        tests=len(cases),
        identities=names,
        registered=expected,
        failures=0,
        errors=0,
        skipped=0,
    )


def controls(budget):
    command = [
        sys.executable,
        "-B",
        "-m",
        "pytest",
        "-q",
        "-s",
        "--noconftest",
        "-c",
        str(ROOT / "science/numerical_relativity/pytest-single-scan-controls.ini"),
        "--rootdir",
        str(ROOT),
        "--junitxml",
        str(budget.directory / "unit-controls.xml"),
        *[str(ROOT / name) for name in TEST_FILES],
    ]
    budget.record("unit-command.json", command)
    with (budget.directory / "unit-controls.log").open("xb") as stream:
        child = subprocess.Popen(
            command,
            cwd=ROOT,
            stdout=stream,
            stderr=subprocess.STDOUT,
            creationflags=subprocess.CREATE_NO_WINDOW,
            env=dict(
                os.environ,
                PYTEST_ADDOPTS="",
                PYTEST_PLUGINS="",
                PYTEST_DISABLE_PLUGIN_AUTOLOAD="1",
            ),
        )
        while child.poll() is None:
            budget.guard()
            time.sleep(0.05)
        budget.guard()
        G.require(
            child.returncode == 0,
            "uniform frequency growth controls failed; no automatic retry",
        )
    result = test_evidence(budget.directory / "unit-controls.xml")
    budget.record("unit-controls.json", result)
    return result


def input_records():
    module = producer()
    for name, hashes in module.PARENT_GATES.items():
        qualified(G.EVIDENCE / name, hashes["gate_sha256"], hashes["worker_sha256"])
    result = {}
    for name, item in module.PARENT_FILES.items():
        raw = G.contained(G.EVIDENCE / item["directory"], item["path"]).read_bytes()
        G.require(
            G.hashlib.sha256(raw).hexdigest() == item["sha256"],
            "fixed physical-frequency-reduction parent bytes",
        )
        result[name] = raw
    return result


def replay_inputs():
    module = producer()
    return {"parent-inputs/" + name for name in module.PARENT_FILES} | {
        name + ".json" for name in module.RECORD_ORDER
    }


def worker(directory):
    prepared = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(
        directory.parent == G.EVIDENCE
        and prepared["passed"] is False
        and prepared["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID"),
        "owned worker required",
    )
    G.require(
        all(
            os.environ.get(name) == "1"
            for name in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")
        ),
        "one numerical thread",
    )
    budget, started = C.SingleScanBudget(directory), time.monotonic()
    result = dict(
        schema=METHOD,
        passed=False,
        completed=False,
        errors=[],
        stages=[],
        phase="intake",
        case_indices=[12],
        scope=SCOPE,
        parent_gate_sha256=PARENT_GATE,
        full58_uniform_frequency_l2_growth_validated=False,
        physical43_weighted_frequency_growth_validated=False,
        integration_steps=0,
        native_calls=0,
        retries=0,
        original_threshold=2e-12,
        coefficient_acceptance="exact-rational-equality",
        required_zero_acceptance="exact-zero-only",
        **{name: False for name in FALSE_FLAGS},
    )
    budget.record("attempt.json", result)

    def stage(name, **fields):
        row = dict(stage=name, seconds=time.monotonic() - started, **fields)
        budget.record(f"stage-{len(result['stages']):02d}-{name}.json", row)
        result["phase"] = name
        result["stages"].append(row)
        print(json.dumps(row), flush=True)

    try:
        table, before = sources(budget), history(budget)
        result["source_before"] = table
        budget.record("history-before.json", before)
        result["snapshot_bytes"] = foundation().snapshot(budget, table)
        parent = input_records()
        for name, raw in parent.items():
            budget.save("parent-inputs/" + name, raw)
        stage(
            "intake-complete",
            sources=len(table),
            historical_files=sum(map(len, before.values())),
            parent_inputs=len(parent),
        )
        result["unit_controls"] = controls(budget)
        stage("unit-controls-complete", tests=result["unit_controls"]["tests"])
        module, saved = producer(), set()
        expected = set(module.RECORD_ORDER)

        def sink(name, record):
            G.require(
                name in expected and name not in saved,
                "unique registered uniform-frequency-growth evidence",
            )
            budget.record(name + ".json", record)
            saved.add(name)
            stage("certificate-" + name + "-saved")

        module.build_certificate(
            parent, guard=budget.guard, check=budget._check_deadline, sink=sink
        )
        G.require(
            saved == expected,
            "every registered uniform-frequency-growth certificate part saved",
        )
        stage("complete-candidate-evidence-saved", outputs=len(module.RECORD_ORDER))
        result["replay"] = replay(directory, budget, stage)
        budget.record("independent-replay.json", result["replay"])
        stage("independent-replay-complete", passed=result["replay"]["passed"])
        budget.record("dependencies.json", foundation().dependencies(budget))
        G.require(
            sources(budget)
            == table
            == G.inventory(directory / "source-snapshot", "", budget),
            "physical-frequency-reduction source snapshot drift",
        )
        after = history(budget)
        G.require(before == after, "historical evidence drift")
        budget.record("history-after.json", after)
        result.update(
            source_after=table, old_artifacts_unchanged=True, computation_completed=True
        )
        G.require(
            result["replay"]["passed"] is True,
            "uniform frequency growth failed; preserve all evidence",
        )
        result.update(
            passed=True,
            completed=True,
            full58_uniform_frequency_l2_growth_validated=True,
            physical43_weighted_frequency_growth_validated=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False,
            completed=False,
            full58_uniform_frequency_l2_growth_validated=False,
            physical43_weighted_frequency_growth_validated=False,
        )
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(
        json.dumps(
            {name: result[name] for name in ("passed", "phase", "seconds", "errors")}
        ),
        flush=True,
    )
    return 0 if result["passed"] else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--guard-worker", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    directory = Path(os.path.abspath(args.output_directory))
    if args.guard_worker:
        return worker(directory)
    G.require(
        G.sha(ROOT / "scripts/nr_owned_control.py")
        == "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1",
        "unchanged supervisor",
    )
    result = G.supervise(
        [
            sys.executable,
            "-B",
            str(Path(__file__).resolve()),
            "--guard-worker",
            "--output-directory",
            str(directory),
        ],
        directory,
        finalizer=finalizer,
        budget_factory=C.SingleScanBudget,
    )
    print(
        json.dumps({name: result[name] for name in ("passed", "completed", "errors")}),
        flush=True,
    )
    return 0 if result["passed"] else 1


TABLE_NAMES = (
    "norm_J58",
    "norm_Q0",
    "norm_Q1",
    "norm_Q2",
    "norm_Z_m2",
    "norm_Z_m1",
    "norm_Z_0",
    "norm_T_m1",
    "norm_T_0",
    "norm_T_1",
    "norm_T_2",
    "norm_Ti_m1",
    "norm_Ti_0",
    "norm_Ti_1",
    "norm_Ti_2",
)


def compare_bound(record, expected):
    G.require(canonical_equal(record, expected), "complete independent bound mismatch")
    return True


def independent_bound_table(
    record,
    *,
    shape,
    degree_cap,
    homogeneous_degree=None,
    guard=lambda: None,
    check=None,
):
    """Independently accumulate absolute rational coefficients in every slot."""
    G.require(
        callable(guard) and (check is None or callable(check)),
        "callable budget controls",
    )
    check = guard if check is None else check
    guard()
    G.require(
        type(degree_cap) is int
        and degree_cap >= 0
        and (
            homogeneous_degree is None
            or type(homogeneous_degree) is int
            and 0 <= homogeneous_degree <= degree_cap
        ),
        "strict homogeneous degree",
    )
    matrix = V.decode_matrix(record, shape=shape, max_degree=degree_cap)
    entries, total, coefficients, nonzero, highest = [], F(0), 0, 0, -1
    for i in range(shape[0]):
        check()
        for j in range(shape[1]):
            absolute = F(0)
            for powers, value in matrix[i][j].items():
                if coefficients % 128 == 0:
                    check()
                degree = sum(powers)
                G.require(
                    homogeneous_degree is None or degree == homogeneous_degree,
                    "complete coefficient homogeneity",
                )
                absolute += value if value >= 0 else -value
                highest = max(highest, degree)
                coefficients += 1
            nonzero += int(absolute != 0)
            total += absolute
            entries.append([i, j, str(absolute)])
    guard()
    return dict(
        schema="nr-case12-growth-coefficient-bound-v1",
        shape=list(shape),
        degree_cap=degree_cap,
        homogeneous_degree=homogeneous_degree,
        entries=entries,
        total=str(total),
        slots=len(entries),
        nonzero_slots=nonzero,
        coefficients=coefficients,
        max_degree=highest,
        all_zero=nonzero == 0,
    )


def independent_growth(totals, C58, C43, *, lower=F(1, 14), cutoff=F(1, 2)):
    """Re-evaluate the two different energy estimates using exact scalars."""
    G.require(
        type(totals) is dict
        and set(totals) == set(TABLE_NAMES)
        and all(type(x) is F and x >= 0 for x in totals.values()),
        "complete exact nonnegative norm totals",
    )
    G.require(
        type(C58) is type(C43) is type(lower) is type(cutoff) is F
        and lower == F(1, 14)
        and cutoff == F(1, 2)
        and C58 >= lower
        and C43 >= lower,
        "fixed positive energy bounds and cutoff",
    )
    j = totals["norm_J58"]
    r58 = F(2) * C58 * j / lower
    rzero = F(2) * j
    low = F(2) * (
        totals["norm_Q0"] + cutoff * totals["norm_Q1"] + cutoff**2 * totals["norm_Q2"]
    )
    high = (
        F(2)
        * C43
        / lower
        * (
            totals["norm_Z_0"]
            + totals["norm_Z_m1"] / cutoff
            + totals["norm_Z_m2"] / cutoff**2
        )
    )
    at = totals["norm_T_m1"] / cutoff + totals["norm_T_0"] + totals["norm_T_1"]
    ai = (
        totals["norm_Ti_m1"] / cutoff
        + totals["norm_Ti_0"]
        + totals["norm_Ti_1"]
        + totals["norm_Ti_2"]
    )
    G.require(at > 0 and ai > 0, "positive actual coordinate norm constants")
    elow, ehigh = lower / ai**2, C43 * at**2
    return dict(
        growth58=dict(
            schema="nr-case12-full58-frequency-growth-v1",
            lower=str(lower),
            upper=str(C58),
            upper_global=str(max(C58, F(1))),
            source_norm=str(j),
            high_rate=str(r58),
            zero_rate=str(rzero),
            rate=str(max(r58, rzero)),
        ),
        growth43=dict(
            schema="nr-case12-physical43-frequency-growth-v1",
            lower=str(lower),
            upper=str(C43),
            cutoff=str(cutoff),
            low_rate=str(low),
            high_rate=str(high),
            rate=str(max(low, high)),
        ),
        transform_bounds=dict(
            schema="nr-case12-transform-frequency-bounds-v1",
            cutoff=str(cutoff),
            T_constant=str(at),
            Ti_constant=str(ai),
            energy_lower_coefficient=str(elow),
            energy_upper_coefficient=str(ehigh),
            euclidean_flow_squared_prefactor=str(ehigh / elow),
            T_power=1,
            Ti_power=2,
            energy_lower_power=-4,
            energy_upper_power=2,
            euclidean_flow_squared_power=6,
            euclidean_flow_power=3,
            T2_zero=totals["norm_T_2"] == 0,
            plain_L2_uniform=False,
            no_derivative_loss=False,
        ),
    )


def strict_fraction(value):
    G.require(type(value) is str, "canonical rational string")
    try:
        result = F(value)
    except (ValueError, ZeroDivisionError):
        raise ValueError("canonical rational string") from None
    G.require(str(result) == value, "reduced canonical rational string")
    return result


def independent_energy_bounds(record58, record43):
    G.require(
        record58["schema"] == "nr-case12-full58-factorized-bound-v1"
        and canonical_equal(record58["shape"], [58, 58])
        and record58["accepted"] is True
        and record58["sphere"] == "r=1"
        and strict_fraction(record58["m"]) == F(5, 6)
        and strict_fraction(record58["lower"]) == F(1, 14),
        "qualified full58 energy domain and lower bound",
    )
    G.require(
        record43["schema"] == "nr-case12-energy-coefficient-bound-v1"
        and canonical_equal(record43["shape"], [43, 43])
        and record43["consistent_lower_upper"] is True
        and strict_fraction(record43["g_lower"]) == F(5, 6)
        and strict_fraction(record43["lower_energy"]) == F(1, 14),
        "qualified physical43 principal energy domain and lower bound",
    )
    c58, c43 = strict_fraction(record58["upper"]), strict_fraction(record43["upper"])
    G.require(c58 >= F(1, 14) and c43 >= F(1, 14), "consistent exact energy bounds")
    return c58, c43


def independent_reasoning_controls():
    h, j, state = F(1, 14), F(1), F(1)
    energy = state * h * state
    derivative = state * (h * j + j * h) * state
    bad_rate = F(2) * h * j
    residual = derivative - bad_rate * energy
    missing = dict(
        H=str(h),
        J=str(j),
        state=str(state),
        energy=str(energy),
        derivative=str(derivative),
        bad_rate=str(bad_rate),
        residual=str(residual),
        rejected=residual > 0,
    )
    rho = F(2)
    transform = [[rho, F(0)], [F(0), F(1) / rho]]
    inverse = [[F(1) / rho, F(0)], [F(0), rho]]
    vector = [F(0), F(1)]
    transformed = [sum((a * b for a, b in zip(row, vector)), F(0)) for row in transform]
    actual = sum((a * a for a in transformed), F(0))
    claim = sum((a * a for a in vector), F(0))
    difference = actual - claim
    pullback = dict(
        rho=str(rho),
        T=[[str(a) for a in row] for row in transform],
        Ti=[[str(a) for a in row] for row in inverse],
        state=list(map(str, vector)),
        energy=str(actual),
        claimed_lower=str(claim),
        residual=str(difference),
        rejected=difference < 0,
    )
    return dict(missing_inverse_lower=missing, false_euclidean_lower=pullback)


def independent_mutation_witness(
    Jrecord,
    T2record,
    baseline_J_table,
    baseline_T2_table,
    *,
    guard=lambda: None,
    check=lambda: None,
    sink=lambda name, record: None,
):
    guard()
    base_j = independent_bound_table(
        Jrecord,
        shape=(58, 58),
        degree_cap=0,
        homogeneous_degree=0,
        guard=guard,
        check=check,
    )
    base_t = independent_bound_table(
        T2record,
        shape=(43, 43),
        degree_cap=5,
        guard=guard,
        check=check,
    )
    compare_bound(baseline_J_table, base_j)
    compare_bound(baseline_T2_table, base_t)
    j = V.decode_matrix(Jrecord, shape=(58, 58), max_degree=0)
    t2 = V.decode_matrix(T2record, shape=(43, 43), max_degree=5)
    original_zero = not j[57][57]
    baseline_zero = base_t["all_zero"]
    j[57][57][(0, 0, 0)] = j[57][57].get((0, 0, 0), F(0)) + F(1)
    t2[0][0][(2, 0, 0)] = t2[0][0].get((2, 0, 0), F(0)) + F(1)
    if not j[57][57][(0, 0, 0)]:
        del j[57][57][(0, 0, 0)]
    if not t2[0][0][(2, 0, 0)]:
        del t2[0][0][(2, 0, 0)]
    mutant_j, mutant_t = V.encode_matrix(j), V.encode_matrix(t2)
    sink("mutant_J58", mutant_j)
    sink("mutant_T2", mutant_t)
    jt = independent_bound_table(
        mutant_j,
        shape=(58, 58),
        degree_cap=0,
        homogeneous_degree=0,
        guard=guard,
        check=check,
    )
    tt = independent_bound_table(
        mutant_t,
        shape=(43, 43),
        degree_cap=5,
        guard=guard,
        check=check,
    )
    sink("norm_mutant_J58", jt)
    sink("norm_mutant_T2", tt)
    delta, changed, total_delta = [], 0, F(0)
    for old, new in zip(base_j["entries"], jt["entries"], strict=True):
        check()
        difference = strict_fraction(new[2]) - strict_fraction(old[2])
        delta.append([old[0], old[1], str(difference)])
        changed += int(difference != 0)
        total_delta += difference
    j_rejected = original_zero and changed > 0 and total_delta > 0
    t_rejected = baseline_zero and tt["nonzero_slots"] > 0
    reasoning = independent_reasoning_controls()
    guard()
    return dict(
        schema="nr-case12-frequency-growth-mutations-v1",
        J=dict(
            name="add-one-to-J58-last-diagonal",
            entry=[57, 57],
            original_slot_zero=original_zero,
            delta_entries=delta,
            changed_slots=changed,
            total_delta=str(total_delta),
            rejected=j_rejected,
        ),
        T2=dict(
            name="add-x2-to-T2-00",
            entry=[0, 0],
            baseline_zero=baseline_zero,
            mutant_nonzero_slots=tt["nonzero_slots"],
            mutant_coefficients=tt["coefficients"],
            rejected=t_rejected,
        ),
        reasoning_controls=reasoning,
        accepted=j_rejected
        and t_rejected
        and all(v["rejected"] for v in reasoning.values()),
    )


def independent_parent_conditions(records, *, guard, check):
    """Decode full accepted inputs; inherit products without recomputing them."""
    zero_names = []
    caps = (2, 4, 5, 6, 7, 8, 9, 10, 10)
    for power, cap in zip(range(-2, 7), caps, strict=True):
        guard()
        suffix = "m" + str(-power) if power < 0 else str(power)
        name = "Z__p_" + suffix + ".json"
        matrix = V.decode_matrix(records[name], shape=(43, 43), max_degree=cap)
        if power > 1:
            V.zero_check(matrix, (43, 43))
            zero_names.append(name)
    leading = V.decode_matrix(
        records["leading_residual.json"], shape=(43, 43), max_degree=6
    )
    V.zero_check(leading, (43, 43))
    zero_names.append("leading_residual.json")
    constant_inputs = {
        "C0.json": (43, 58),
        "D39.json": (39, 58),
        "S39.json": (58, 39),
        "B39.json": (39, 39),
        "off_image_ambiguity.json": (43, 43),
    }
    constant_maps = {}
    for name, shape in constant_inputs.items():
        check()
        constant_maps[name] = V.decode_matrix(records[name], shape=shape, max_degree=0)
    G.require(
        constant_maps["C0.json"][4:] == constant_maps["D39.json"]
        and not any(poly for row in constant_maps["C0.json"][:4] for poly in row)
        and any(
            poly for row in constant_maps["off_image_ambiguity.json"] for poly in row
        ),
        "actual zero-image map and nonunique off-image extension",
    )
    zero_shapes = {
        "zero_top_residual.json": (4, 58),
        "zero_map_residual.json": (39, 58),
        "zero_section_residual.json": (39, 39),
        "zero_transport_residual.json": (39, 58),
        "zero_ambiguity_residual.json": (43, 58),
    }
    for name, shape in zero_shapes.items():
        check()
        V.zero_check(V.decode_matrix(records[name], shape=shape, max_degree=0), shape)
    expected_zero = dict(
        schema="nr-case12-physical-zero-image-v1",
        accepted=True,
        ambiguity_is_E40=True,
        ambiguity_nonzero_slots=1,
        direction_independent_source_and_map=True,
        full43_right_inverse_exists=False,
        invariant_image_verified=True,
        laurent_evaluated_at_zero=False,
        reachable_rank=39,
        right_section_verified=True,
        zero_rows=[0, 1, 2, 3],
    )
    G.require(
        canonical_equal(records["zero_frequency.json"], expected_zero),
        "qualified zero image",
    )
    k58 = V.decode_matrix(records["K58.json"], shape=(58, 58), max_degree=1)
    for i, row in enumerate(k58):
        check()
        for j, poly in enumerate(row):
            G.require(all(sum(p) == 1 for p in poly), "complete K58 linear homogeneity")
            G.require((i >= 11 and j >= 11) or not poly, "complete K58 zero base block")
    G.require(
        records["energy58_replay.json"]["passed"] is True
        and all(
            x is True for x in records["energy58_replay.json"]["acceptance"].values()
        )
        and records["energy43_replay.json"]["passed"] is True
        and all(
            x is True for x in records["energy43_replay.json"]["acceptance"].values()
        ),
        "complete accepted principal energy proofs",
    )
    c58, c43 = independent_energy_bounds(
        records["energy58_bounds.json"], records["energy43_bounds.json"]
    )
    G.require(
        records["energy58_replay.json"]["uniform_lower"] == "1/14"
        and records["energy43_replay.json"]["uniform_lower"] == "1/14"
        and records["energy58_replay.json"]["uniform_upper"] == str(c58)
        and records["energy43_replay.json"]["uniform_upper"] == str(c43),
        "actual energy constants belong to accepted replays",
    )
    guard()
    return dict(
        reduction_matrices=10,
        reduction_matrix_slots=18490,
        reduction_zero_matrices=len(zero_names),
        reduction_zero_slots=11094,
        zero_image_matrices=len(zero_shapes),
        zero_image_residual_slots=sum(a * b for a, b in zero_shapes.values()),
        zero_frequency_rank=39,
    )


TABLE_INPUT_SPECS = {
    "norm_J58": ("J58.json", 58, 58, 0, 0),
    "norm_Q0": ("Q0.json", 43, 43, 0, 0),
    "norm_Q1": ("Q1.json", 43, 43, 1, 1),
    "norm_Q2": ("Q2.json", 43, 43, 2, 2),
    "norm_Z_m2": ("Z__p_m2.json", 43, 43, 2, None),
    "norm_Z_m1": ("Z__p_m1.json", 43, 43, 4, None),
    "norm_Z_0": ("Z__p_0.json", 43, 43, 5, None),
    "norm_T_m1": ("rT__p_m1.json", 43, 43, 2, None),
    "norm_T_0": ("rT__p_0.json", 43, 43, 3, None),
    "norm_T_1": ("rT__p_1.json", 43, 43, 4, None),
    "norm_T_2": ("rT__p_2.json", 43, 43, 5, None),
    "norm_Ti_m1": ("rTi__p_m1.json", 43, 43, 0, None),
    "norm_Ti_0": ("rTi__p_0.json", 43, 43, 2, None),
    "norm_Ti_1": ("rTi__p_1.json", 43, 43, 3, None),
    "norm_Ti_2": ("rTi__p_2.json", 43, 43, 3, None),
}


def replay(directory, budget, stage):
    module, hashes = producer(), {}

    def load(name):
        budget.guard()
        raw = G.contained(directory, name).read_bytes()
        hashes[name] = G.hashlib.sha256(raw).hexdigest()
        return json.loads(raw)

    records = {name: load("parent-inputs/" + name) for name in module.PARENT_FILES}
    parent_raw = {
        name: (directory / "parent-inputs" / name).read_bytes() for name in records
    }
    provenance = module.parent_provenance_manifest(parent_raw)
    bridge = module.source_bridge_manifest()
    conditions = independent_parent_conditions(
        records, guard=budget.guard, check=budget._check_deadline
    )
    c58, c43 = independent_energy_bounds(
        records["energy58_bounds.json"], records["energy43_bounds.json"]
    )
    G.require(
        canonical_equal(
            module.TABLE_SPECS, {k: tuple(v[1:]) for k, v in TABLE_INPUT_SPECS.items()}
        )
        and canonical_equal(
            module.TABLE_INPUTS, {k: v[0] for k, v in TABLE_INPUT_SPECS.items()}
        ),
        "independent complete coefficient bound registration",
    )
    compared, tables = set(), {}

    def compare(name, expected):
        G.require(
            name in module.RECORD_ORDER and name not in compared,
            "unique independent output",
        )
        compare_bound(load(name + ".json"), expected)
        compared.add(name)
        stage("replay-" + name, passed=True)

    for name, (source, rows, columns, degree, hom) in TABLE_INPUT_SPECS.items():
        table = independent_bound_table(
            records[source],
            shape=(rows, columns),
            degree_cap=degree,
            homogeneous_degree=hom,
            guard=budget.guard,
            check=budget._check_deadline,
        )
        tables[name] = table
        compare(name, table)
    totals = {k: strict_fraction(v["total"]) for k, v in tables.items()}
    growth = independent_growth(totals, c58, c43)
    for name, record in growth.items():
        compare(name, record)
    mutations = independent_mutation_witness(
        records["J58.json"],
        records["rT__p_2.json"],
        tables["norm_J58"],
        tables["norm_T_2"],
        guard=budget.guard,
        check=budget._check_deadline,
        sink=compare,
    )
    compare("mutations", mutations)
    acceptance = dict(
        parent_principal_energies=True,
        coefficient_tables=True,
        zero_T2=tables["norm_T_2"]["all_zero"],
        complete_reduction_residuals=True,
        zero_frequency_image=True,
        full58_growth_bound=True,
        physical43_weighted_growth_bound=tables["norm_T_2"]["all_zero"],
        mutations_rejected=mutations["J"]["rejected"] and mutations["T2"]["rejected"],
        reasoning_controls_rejected=all(
            v["rejected"] for v in mutations["reasoning_controls"].values()
        ),
    )
    acceptance["accepted"] = all(v is True for v in acceptance.values())
    compare("acceptance", acceptance)
    stats = dict(
        main_tables=15,
        main_table_slots=sum(t["slots"] for t in tables.values()),
        negative_tables=2,
        negative_table_slots=5213,
        mutation_matrices=2,
        mutation_matrix_slots=5213,
        outputs=28,
        parent_files=72,
        matrix_products=0,
    )
    compare("stats", stats)
    domain = independent_domain_metadata()
    compare("domain", domain)
    compare("source_bridge", bridge)
    compare("parent_provenance", provenance)
    G.require(
        compared == set(module.RECORD_ORDER)
        and len(compared) == 28
        and set(hashes) == replay_inputs()
        and len(hashes) == 100,
        "all registered growth outputs and parsed inputs independently consumed",
    )
    return dict(
        schema="nr-case12-independent-uniform-frequency-growth-v1",
        passed=acceptance["accepted"],
        scope=SCOPE,
        parent_gate_sha256=PARENT_GATE,
        input_hashes=hashes,
        library="stdlib Fraction coefficient accumulation",
        arithmetic_source=dict(
            path="scripts/nr_polynomial_certificate_replay.py",
            sha256="36ff79bc1f3971f390b779c9898f769ce7c74b99bc469b42f3923fbe1984fae5",
        ),
        stats=stats,
        acceptance=acceptance,
        growth=growth,
        mutations=mutations,
        domain=domain,
        inherited_input_checks=conditions,
        actual_norm_stats={
            k: {a: b for a, b in t.items() if a != "entries"} for k, t in tables.items()
        },
        zero_frequency_reachable_rank=39,
        laurent_transforms_evaluated_at_zero=False,
        zero_frequency_full43_inverse_exists=False,
        new_matrix_products=0,
        principal_energy_matrices_rebuilt=False,
        nonlinear_rhs_bridge_executed=False,
        physical43_uniform_euclidean_growth_validated=False,
        constraint_derivative_loss_absent_proved=False,
        lower_order_energy_executed=True,
    )


def finalizer(directory, budget):
    """After worker exit, inspect only saved JSON/XML, AST and byte hashes."""
    result = read(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["phase"] == "complete"
        and result["passed"] is result["completed"] is True
        and result["errors"] == []
        and result["full58_uniform_frequency_l2_growth_validated"] is True
        and result["physical43_weighted_frequency_growth_validated"] is True,
        "complete qualified uniform growth worker",
    )
    G.require(
        all(result[k] is False for k in FALSE_FLAGS)
        and result["scope"] == SCOPE
        and result["case_indices"] == [12]
        and result["parent_gate_sha256"] == PARENT_GATE
        and result["original_threshold"] == 2e-12
        and result["coefficient_acceptance"] == "exact-rational-equality"
        and result["required_zero_acceptance"] == "exact-zero-only"
        and result["integration_steps"]
        == result["native_calls"]
        == result["retries"]
        == 0,
        "unchanged scientific and resource boundary",
    )
    G.require(
        test_evidence(directory / "unit-controls.xml")
        == result["unit_controls"]
        == read(directory / "unit-controls.json"),
        "complete registered controls with exact XML identities",
    )
    report = read(directory / "independent-replay.json")
    expected_stats = dict(
        main_tables=15,
        main_table_slots=29250,
        negative_tables=2,
        negative_table_slots=5213,
        mutation_matrices=2,
        mutation_matrix_slots=5213,
        outputs=28,
        parent_files=72,
        matrix_products=0,
    )
    G.require(
        canonical_equal(report, result["replay"])
        and report["schema"] == "nr-case12-independent-uniform-frequency-growth-v1"
        and report["passed"] is True
        and report["scope"] == SCOPE
        and report["parent_gate_sha256"] == PARENT_GATE
        and canonical_equal(report["stats"], expected_stats)
        and canonical_equal(read(directory / "stats.json"), expected_stats)
        and canonical_equal(report["acceptance"], read(directory / "acceptance.json"))
        and all(x is True for x in report["acceptance"].values())
        and len(report["input_hashes"]) == 100
        and set(report["input_hashes"]) == replay_inputs(),
        "complete independent quantitative growth evidence",
    )
    for name, value in report["growth"].items():
        G.require(
            canonical_equal(value, read(directory / (name + ".json"))),
            "saved exact growth constants",
        )
    G.require(
        set(report["growth"]) == {"growth58", "growth43", "transform_bounds"}
        and canonical_equal(report["mutations"], read(directory / "mutations.json"))
        and report["mutations"]["accepted"] is True
        and canonical_equal(report["domain"], read(directory / "domain.json"))
        and canonical_equal(report["domain"], independent_domain_metadata())
        and report["zero_frequency_reachable_rank"] == 39
        and report["laurent_transforms_evaluated_at_zero"] is False
        and report["zero_frequency_full43_inverse_exists"] is False
        and report["principal_energy_matrices_rebuilt"] is False
        and report["nonlinear_rhs_bridge_executed"] is False
        and report["physical43_uniform_euclidean_growth_validated"] is False
        and report["constraint_derivative_loss_absent_proved"] is False
        and report["new_matrix_products"] == 0
        and report["lower_order_energy_executed"] is True
        and set(report["actual_norm_stats"]) == set(TABLE_NAMES)
        and report["arithmetic_source"]
        == dict(
            path="scripts/nr_polynomial_certificate_replay.py",
            sha256=G.sha(ROOT / "scripts/nr_polynomial_certificate_replay.py"),
        )
        and report["library"] == "stdlib Fraction coefficient accumulation",
        "honest weighted and constant-background scope",
    )
    for name, digest in report["input_hashes"].items():
        budget.guard()
        G.require(
            G.sha(G.contained(directory, name)) == digest, "replayed input byte drift"
        )
    for name, stats in report["actual_norm_stats"].items():
        saved = read(directory / (name + ".json"))
        G.require(
            canonical_equal(stats, {k: v for k, v in saved.items() if k != "entries"}),
            "saved coefficient norm metadata",
        )
    module = producer()
    G.require(
        canonical_equal(module.domain_metadata(), report["domain"]),
        "production and independent scope",
    )
    G.require(
        canonical_equal(
            module.source_bridge_manifest(), read(directory / "source_bridge.json")
        ),
        "original source AST and normalization bindings",
    )
    parent = input_records()
    G.require(
        all(
            (directory / "parent-inputs" / n).read_bytes() == raw
            for n, raw in parent.items()
        )
        and canonical_equal(
            module.parent_provenance_manifest(parent),
            read(directory / "parent_provenance.json"),
        ),
        "complete archived and accepted parent inputs",
    )
    dependency = read(directory / "dependencies.json")
    G.require(
        dependency["versions"]["sympy"] == "1.13.3"
        and dependency["versions"]["numpy"] == "2.2.6",
        "registered dependency versions",
    )
    for index, (name, digest) in enumerate(
        dependency["loaded_runtime_file_hashes"].items()
    ):
        if index % 32 == 0:
            budget.guard()
        G.require(G.sha(name) == digest, "recorded runtime file drift")
    table = sources(budget)
    G.require(
        table
        == result["source_before"]
        == result["source_after"]
        == G.inventory(directory / "source-snapshot", "", budget),
        "full source snapshot closure",
    )
    G.require(
        history(budget)
        == read(directory / "history-before.json")
        == read(directory / "history-after.json"),
        "all historical evidence unchanged",
    )
    return result


def independent_domain_metadata():
    return dict(
        schema="nr-case12-uniform-frequency-growth-domain-v1",
        fixed_case=12,
        geometric=False,
        background="constant",
        direction="real unit n; n.n=1",
        radial_frequency="rho>=0",
        cutoff="1/2",
        low_interval="0<=rho<1/2",
        high_interval="rho>=1/2",
        fourier_indeterminate="zeta=i*rho; r=1",
        conjugate_transpose=True,
        frequency_fixed_in_time=True,
        cutoff_multiplier_continuity_required=False,
        full58_operator="J58+i*rho*K58(n)",
        full58_state_similarity=False,
        original_shift_retained=True,
        J58_direction_independent=True,
        full58_nonzero_energy="y*H58(n)y",
        full58_zero_energy="y*y",
        full58_global_upper="max(C58,1)",
        physical43_low_energy="c*c",
        physical43_high_energy="(T*c)*H43(n)*(T*c)",
        physical43_reduced_principal="Khat43=Ab/r; r=1",
        complete_Z_powers=[-2, -1, 0, 1, 2, 3, 4, 5, 6],
        complete_T_powers=[-1, 0, 1, 2],
        complete_Ti_powers=[-1, 0, 1, 2],
        T2_required_zero=True,
        zero_frequency_reachable_rank=39,
        zero_frequency_full43_inverse_exists=False,
        laurent_evaluated_at_zero=False,
        physical43_uniform_euclidean_growth_validated=False,
        constraint_derivative_loss_absent_proved=False,
        euclidean_three_derivative_reserve_is_optimal=False,
        variable_background_energy_validated=False,
        actual_nonlinear_rhs_bridge_proved=False,
        boundary_well_posedness_proved=False,
        coefficient_bounds_are_sharp=False,
        stable_timestep_proved=False,
    )


if __name__ == "__main__":
    raise SystemExit(main())
