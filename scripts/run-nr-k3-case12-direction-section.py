"""Unexecuted candidate: ONE separately authorized case12 directional batch."""

from __future__ import annotations

import argparse
from dataclasses import replace
from fractions import Fraction as F
import importlib.util
import io
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

METHOD = "nr-case12-direction-section-controls-v1"
PARENT = G.EVIDENCE / "nr-k3-case12-lower-energy-controls-v1-20261013"
GATE_SHA = "668ff3638c47d34f5331cbba3aeeb3c207d890236d9e189f0a792fb6c0fa886d"
WORKER_SHA = "01e6642c5f21c91b09880f172615f90c08bfb536d3dfe8bb99b2f2dd699c0bf4"
HELPER_SHA = "e7dcd1ebee57e322450a741b3e0608e945ae3db8ba076ac5eb8d762c4cf2e66e"
GUARD_SHA = "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1"
TOLERANCE = 2e-12
RAYS = ((1, 2, -1), (1, 0, 0), (0, 1, 0), (0, 0, 1),
        (-1, -2, 1), (2, 4, -2), (1, 1, 1), (1, -1, 0))
EXTRA = (
    "scripts/nr_constraint_direction_section.py",
    "scripts/run-nr-k3-case12-direction-section.py",
    "science/numerical_relativity/test_constraint_direction_section.py",
    "science/numerical_relativity/pytest-case12-direction-section.ini",
    "science/numerical_relativity/DERIVATION-20261013-case12-direction-section.md",
    "science/numerical_relativity/EXPERIMENT-20261013-case12-direction-section.md",
    "science/numerical_relativity/RESULTS-20261013-case12-lower-energy.md",
)
FALSE_FLAGS = (
    "physical_gate", "live_admission", "scientificPayloadWriteback", "full_scientific_matrix_executed",
    "new_scientific_evolution", "nonlinear_stability_validated", "general_profile_qualified",
    "direction_uniform_energy_validated", "uniform_strong_hyperbolicity_validated",
    "all_direction_closure_validated", "all_direction_rank_machine_proof",
    "direction_uniform_lower_order_bound_validated", "physical_boundary_validated",
    "constraint_convergence_validated", "unweighted_l2_wellposedness_proved",
    "constraint_damping_proved", "independent_external_review", "gpu_executed",
    "historical_results_regraded", "acceptance_inputs_substituted", "zero_frequency_full43_inverse_exists",
)


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def helper():
    path = ROOT / "scripts/run-nr-k3-case12-lower-energy.py"
    G.require(G.sha(path) == HELPER_SHA, "immutable energy helper required")
    spec = importlib.util.spec_from_file_location("nr_direction_history_only", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sources(budget):
    G.require(G.sha(PARENT / "qualification-gate.json") == GATE_SHA
              and G.sha(PARENT / "worker-result.json") == WORKER_SHA, "parent receipt drift")
    gate, worker = G.read_terminal(PARENT / "qualification-gate.json"), read(PARENT / "worker-result.json")
    G.require(gate["passed"] is worker["passed"] is worker["case12_lower_energy_checked"] is True
              and worker["original_threshold"] == TOLERANCE, "passed fixed-ray parent required")
    G.require(all(gate[name] is worker[name] is False for name in ("physical_gate", "live_admission", "scientificPayloadWriteback")),
              "shadow-only parent required")
    table = worker["source_before"]
    G.require(len(table) == 551 and table == worker["source_after"] and not set(table).intersection(EXTRA),
              "551 frozen sources plus additive candidate required")
    for i, (name, digest) in enumerate(table.items()):
        if i % 32 == 0:
            budget.guard()
        G.require(G.sha(G.contained(ROOT, name)) == G.sha(G.contained(PARENT / "source-snapshot", name)) == digest,
                  "frozen source drift: " + name)
    return dict(table, **{name: G.sha(G.contained(ROOT, name)) for name in EXTRA})


def ancestry(parent, modules, budget):
    result = parent.ancestors(modules, budget)
    current = modules[-1].inventory(PARENT, budget)
    G.require(len(current) == 1035 and {k: v for k, v in current.items() if k != "qualification-gate.json"}
              == G.read_terminal(PARENT / "qualification-gate.json")["artifact_hashes"], "parent artifacts drift")
    result[PARENT.name] = current
    G.require(len(result) == 8 and sum(map(len, result.values())) == 5152, "eight historical directories required")
    return result


def worker(directory):
    prepared = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(prepared["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID") and prepared["passed"] is False,
              "owned worker token required")
    G.require(directory.parent == G.EVIDENCE and directory.is_dir(), "prepared contained directory required")
    G.require(all(os.environ.get(k) == "1" for k in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")),
              "single-thread required")
    budget, started = G.Budget(directory), time.monotonic()
    result = dict(schema=METHOD, passed=False, completed=False, phase="intake", errors=[], stages=[],
                  case_indices=[12], planned_rays=[list(v) for v in RAYS], rows=[], source_before={}, source_after={},
                  parent_gate_sha256=GATE_SHA, parent_worker_sha256=WORKER_SHA,
                  resource_caps=dict(seconds=600, output_bytes=G.CAP, headroom=G.HEADROOM,
                                     source_snapshot_bytes=8*1024**2, c_reserve=G.C_RESERVE, e_reserve=G.E_RESERVE),
                  case12_direction_section_checked=False, registered_ray_energy_checked=False,
                  original_threshold=TOLERANCE, integration_steps=0, native_calls=0, retries=0,
                  **{key: False for key in FALSE_FLAGS})
    budget.record("attempt.json", result)

    def stage(name, **fields):
        budget.guard()
        result["phase"] = name
        row = dict(stage=name, seconds=time.monotonic()-started, **fields)
        budget.record(f"stage-{len(result['stages']):02d}-{name}.json", row)
        result["stages"].append(row)
        print(json.dumps(row), flush=True)

    try:
        parent = helper()
        modules = parent.helpers()
        old = modules[-1]
        table, history = sources(budget), ancestry(parent, modules, budget)
        result["source_before"] = table
        budget.record("ancestry-before.json", history)
        result["snapshot_bytes"] = old.save_snapshot(budget, table)
        stage("intake-verified", sources=len(table), historical_files=sum(map(len, history.values())))

        import numpy as np
        from scripts import nr_constraint_direction_section as S
        from scripts import nr_constraint_exact_coefficients as R
        from scripts import nr_constraint_laurent_energy as E
        from scripts import nr_profile_exact_coefficients as Q

        result["environment"] = dict(python=sys.version, numpy=np.__version__, threads=1)
        stage("unit-controls-start")
        command = [sys.executable, "-B", "-m", "pytest", "-q", "--noconftest", "-p", "no:cacheprovider",
                   "-c", str(ROOT / "science/numerical_relativity/pytest-case12-direction-section.ini"),
                   "--junitxml=" + str(directory / "unit-controls.xml"),
                   str(ROOT / "science/numerical_relativity/test_constraint_direction_section.py")]
        run = subprocess.run(command, cwd=ROOT, env=dict(os.environ, PYTEST_ADDOPTS=""), check=False)
        budget.guard()
        G.require(run.returncode == 0, "unit failure; no retry")
        suites = list(ET.parse(directory / "unit-controls.xml").getroot().iter("testsuite"))
        counts = {k: sum(int(s.get(k, "0")) for s in suites) for k in ("tests", "errors", "failures", "skipped")}
        G.require(counts == dict(tests=16, errors=0, failures=0, skipped=0), "16 registered controls required")
        result["unit_controls"] = counts
        stage("unit-controls-complete", **counts)

        input_hashes = {}
        def frozen(name):
            return parent.frozen_input_bytes(G.contained(PARENT, name), history[PARENT.name][name],
                                             budget, name, input_hashes)
        def exact_input(name):
            return E.decode(json.loads(frozen(name).decode("utf-8")))
        original = Q.case12()
        G.require(json.loads(frozen("exact-design-passport.json").decode("utf-8")) == original.passport(),
                  "unchanged physical background required")
        original_d, original_a = exact_input("candidate/leading.json"), exact_input("candidate/principal.json")
        saved = {}
        for name in ("principal", "energy"):
            value = np.load(io.BytesIO(frozen("inputs/" + name + ".npy")), allow_pickle=False)
            G.require(value.dtype == np.float64 and value.shape == (43, 43) and np.isfinite(value).all(), "binary64 frozen matrix required")
            value.setflags(write=False)
            saved[name] = value
        budget.record("input-hashes.json", input_hashes)

        checks, negatives, comparisons = [], [], {}
        def sink(prefix):
            def save(name, terms):
                for power, matrix in terms.items():
                    value = Q.encode(matrix)
                    budget.record(f"{prefix}/{name}/power-{power}.json", value)
                    checks.append(dict(prefix=prefix, name=name, power=power, nonzero_entries=len(value["entries"])))
            return save
        def check(name, a, b, prefix):
            E.identity(name, {0: a}, {0: b}, sink=sink(prefix))
        def reject(name, a, b, prefix):
            try:
                check(name, a, b, prefix)
            except E.ExactIdentityError as error:
                count = sum(np.count_nonzero(x) for x in error.residual.values())
                G.require(count > 0, "nonzero negative witness required")
                negatives.append(dict(prefix=prefix, name=name, nonzero_entries=int(count), rejected=True))
            else:
                raise ValueError("end-to-end perturbation accepted: " + prefix)

        for index, ray in enumerate(RAYS):
            stage("ray-start", ray_index=index, ray=list(ray))
            b = replace(original, ray=tuple(map(F, ray)))
            prefix = f"ray-{index}"
            d, main, section = R.leading(b, guard=budget.guard), Q.matrix(b, guard=budget.guard), S.section(b, guard=budget.guard)
            for name, matrix in (("leading", d), ("main", main), ("section", section)):
                budget.record(prefix + "/" + name + ".json", Q.encode(matrix))
            budget.record(prefix + "/passport.json", b.passport())
            check("right-section", R.product(d, section, guard=budget.guard), R.eye(43), prefix)
            transport = R.product(d, main, guard=budget.guard)
            principal = R.product(transport, section, guard=budget.guard)
            budget.record(prefix + "/principal.json", Q.encode(principal))
            check("full-kernel-closure", R.product(principal, d, guard=budget.guard), transport, prefix)
            reverse, _, pivots = R.quotient(d, main, reverse=True, guard=budget.guard)
            check("independent-reverse-pivot-quotient", principal, reverse, prefix)
            ode = R.ode_projector(b)
            energy = E.paired_energy(R.intrinsic(principal, b), ode,
                                    tuple(b.ray_squared*x for x in b.squared_speeds()),
                                    tuple(1/b.ray_squared if i in R.SCALED_ROWS else F(1) for i in range(43)),
                                    guard=budget.guard, sink=sink(prefix + "/energy-checks"))
            check("principal-symmetrization", R.product(energy["energy"], principal, guard=budget.guard),
                  R.product(principal.T, energy["energy"], guard=budget.guard), prefix)
            ranks = [sum(a[i, i] for i in range(43)) for a in (ode, energy["zero"], *energy["pairs"])]
            G.require(ranks == [11, 12, 8, 4, 8, 0, 0, 0] and energy["denominator"] == 14
                      and energy["lower_scalar"] == min(F(1), 1/b.ray_squared)/14, "unchanged ranks and normalized floor required")
            bounds = S.case12_direction_bounds(b)
            G.require(bounds["metric_normal_lower"] == F(5, 6) and bounds["metric_normal_upper"] == F(964403, 781250)
                      and bounds["squared_speed_gap_lower"] == F(867, 40000), "registered analytical branch margins required")
            G.require(bounds["metric_normal_lower"] <= b.metric_normal_squared <= bounds["metric_normal_upper"], "ray outside analytic metric interval")
            for name, matrix in (("energy", energy["energy"]), ("metric", energy["metric"]),
                                 ("coercivity", energy["coercivity"]), ("ode", ode)):
                budget.record(prefix + "/" + name + ".json", Q.encode(matrix))

            if index == 0:
                check("frozen-leading", d, original_d, prefix)
                check("frozen-principal", principal, original_a, prefix)
                for name in ("principal", "energy"):
                    exact = principal if name == "principal" else energy["energy"]
                    convert = (lambda precision: R.normalized(exact, b, kind="principal", precision=precision)) if name == "principal" else (
                        lambda precision: E.normal_coordinates(exact, b, kind="energy", precision=precision))
                    high, low = convert(70), convert(50)
                    report = Q.compare(saved[name], high)
                    equal = bool(np.array_equal(np.asarray(high, dtype=float), np.asarray(low, dtype=float)))
                    report["precision50_70_rounded_equal"] = equal
                    budget.record("comparisons/" + name + ".json", report)
                    G.require(equal and report["relative"] <= TOLERANCE, "original threshold disagreement")
                    changed = saved[name].copy()
                    changed[0, 0] += 1e-6
                    mutation = Q.compare(changed, high)
                    budget.record("comparisons/" + name + "-mutated.json", mutation)
                    G.require(mutation["relative"] > TOLERANCE, "floating perturbation not rejected")
                    comparisons[name] = dict(relative=report["relative"], rounded_equal=equal,
                                             mutation_relative=mutation["relative"], mutation_rejected=True)

            changed_s = section.copy()
            changed_s[6, 8] += F(1, 1000000)
            budget.record(prefix + "/negative/section-input.json", Q.encode(changed_s))
            reject("right-section", R.product(d, changed_s, guard=budget.guard), R.eye(43), prefix + "/negative/section")
            changed_a = principal.copy()
            changed_a[0, 0] += F(1, 1000000)
            budget.record(prefix + "/negative/principal-input.json", Q.encode(changed_a))
            reject("full-kernel-closure", R.product(changed_a, d, guard=budget.guard), transport, prefix + "/negative/principal")
            check("section-exact-replay", S.section(b, guard=budget.guard), section, prefix)
            G.require(S.case12_direction_bounds(b) == bounds, "exact bound replay mismatch")
            record = dict(index=index, ray=list(ray), ranks=list(map(int, ranks)), section_checked=True, closure_checked=True,
                          reverse_quotient_checked=True, energy_checked=True, replay_checked=True,
                          raw_energy_floor=str(energy["lower_scalar"]), normalized_energy_floor="1/14",
                          ray_squared=str(b.ray_squared), metric_normal_squared=str(b.metric_normal_squared), reverse_pivots=pivots)
            budget.record(prefix + "/result.json", record)
            result["rows"].append(record)
            stage("ray-complete", ray_index=index)

        result["comparisons"], result["exact_mutations"] = comparisons, negatives
        budget.record("exact-checks.json", checks)
        budget.record("exact-mutations.json", negatives)
        bound_record = {k: list(map(str, v)) if isinstance(v, tuple) else v if isinstance(v, bool) else str(v) for k, v in bounds.items()}
        budget.record("direction-denominator-bounds.json", bound_record)
        result["denominator_bounds"] = bound_record
        stage("final-integrity")
        G.require(old.inventory(directory / "inputs", budget) == input_hashes and sources(budget) == table, "input/source drift")
        for i, (name, digest) in enumerate(table.items()):
            if i % 32 == 0:
                budget.guard()
            G.require(G.sha(G.contained(directory / "source-snapshot", name)) == digest, "snapshot drift")
        after = ancestry(parent, modules, budget)
        budget.record("ancestry-after.json", after)
        G.require(after == history, "historical artifact drift")
        result.update(passed=True, completed=True, source_after=table, old_artifacts_unchanged=True,
                      original_inputs_unchanged=True, case12_direction_section_checked=True, registered_ray_energy_checked=True)
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(passed=False, completed=False, case12_direction_section_checked=False, registered_ray_energy_checked=False)
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(json.dumps({key: result[key] for key in ("passed", "phase", "seconds", "errors")}), flush=True)
    return 0 if result["passed"] else 1


def finalizer(directory, budget):
    result = read(directory / "worker-result.json")
    G.require(result["schema"] == METHOD and result["passed"] is result["completed"] is True and not result["errors"], "completed bounded candidate required")
    G.require(all(result[key] is False for key in FALSE_FLAGS), "no global qualification or input substitution")
    G.require(result["case_indices"] == [12] and result["planned_rays"] == [list(v) for v in RAYS]
              and result["integration_steps"] == result["native_calls"] == result["retries"] == 0
              and result["original_threshold"] == TOLERANCE, "registered case12 scope required")
    G.require(result["unit_controls"] == dict(tests=16, errors=0, failures=0, skipped=0), "16 controls required")
    G.require(result["case12_direction_section_checked"] is result["registered_ray_energy_checked"] is True
              and result["old_artifacts_unchanged"] is result["original_inputs_unchanged"] is True, "missing local gates")
    G.require(len(result["rows"]) == 8 and all(row["index"] == i and row["ray"] == list(RAYS[i])
              and row["ranks"] == [11, 12, 8, 4, 8, 0, 0, 0] and row["normalized_energy_floor"] == "1/14"
              and all(row[k] is True for k in ("section_checked", "closure_checked", "reverse_quotient_checked", "energy_checked", "replay_checked"))
              for i, row in enumerate(result["rows"])), "all eight registered rays required")
    G.require(len(result["exact_mutations"]) == 16 and all(row["rejected"] and row["nonzero_entries"] > 0 for row in result["exact_mutations"]), "16 nonzero exact negative witnesses required")
    expected_negative = [(f"ray-{i}/negative/{kind}", name) for i in range(8)
                         for kind, name in (("section", "right-section"), ("principal", "full-kernel-closure"))]
    G.require([(row["prefix"], row["name"]) for row in result["exact_mutations"]] == expected_negative,
              "one distinct pair of end-to-end negative controls for every registered ray required")
    G.require(set(result["comparisons"]) == {"principal", "energy"} and all(
        row["relative"] <= TOLERANCE and row["rounded_equal"] and row["mutation_rejected"] and row["mutation_relative"] > TOLERANCE
        for row in result["comparisons"].values()), "saved binary64 inputs must agree without repair")
    G.require(result["denominator_bounds"] == read(directory / "direction-denominator-bounds.json")
              and result["denominator_bounds"]["squared_speed_gap_lower"] == "867/40000", "fixed analytical margin required")
    table = sources(budget)
    G.require(len(table) == 558 and table == result["source_before"] == result["source_after"], "frozen source closure required")
    for i, (name, digest) in enumerate(table.items()):
        if i % 32 == 0:
            budget.guard()
        G.require(G.sha(G.contained(directory / "source-snapshot", name)) == digest, "final snapshot drift")
    parent = helper()
    modules = parent.helpers()
    G.require(ancestry(parent, modules, budget) == read(directory / "ancestry-before.json") == read(directory / "ancestry-after.json"), "history drift")
    G.require(modules[-1].inventory(directory / "inputs", budget) == read(directory / "input-hashes.json"), "frozen input drift")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--guard-worker", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    directory = Path(os.path.abspath(args.output_directory))
    if args.guard_worker:
        return worker(directory)
    G.require(G.sha(ROOT / "scripts/nr_owned_control.py") == GUARD_SHA, "immutable supervisor required")
    result = G.supervise([sys.executable, "-B", str(Path(__file__).resolve()), "--guard-worker", "--output-directory", str(directory)],
                         directory, finalizer=finalizer)
    print(json.dumps({key: result[key] for key in ("passed", "completed", "errors")}), flush=True)
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
