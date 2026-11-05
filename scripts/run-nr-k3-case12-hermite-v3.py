"""One 64 MiB/600 s case12 generalisation batch; no evolution or retries."""

from __future__ import annotations

import argparse
from decimal import Decimal, localcontext
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

METHOD = "nr-case12-hermite-v3-controls-v1"
PARENT = G.EVIDENCE / "nr-k3-case0-hermite-v3-controls-v1-20261013"
GATE_SHA = "953928814933c509fccd89de56a154891967db26117c5f2396560ba14235bed6"
WORKER_SHA = "137289cecb6f1c9ac4a32bed0dcd170f3204352413974436a5185e567891bcbb"
HELPER_SHA = "b6a871c25e7c444b0b0eab3b2e4e1bb351d682d8403efacad969cf96e4e6cf7a"
GUARD_SHA = "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1"
EXTRA = (
    "scripts/nr_profile_exact_coefficients.py",
    "scripts/run-nr-k3-case12-hermite-v3.py",
    "science/numerical_relativity/profile_hermite_candidate.py",
    "science/numerical_relativity/test_profile_exact_source.py",
    "science/numerical_relativity/pytest-case12-source.ini",
    "science/numerical_relativity/DERIVATION-20261013-case12-profile.md",
    "science/numerical_relativity/EXPERIMENT-20261013-case12-hermite-v3.md",
    "science/numerical_relativity/AUDIT-20261013-v3-profile-node-extension.md",
    "science/numerical_relativity/GOAL-20261013-research-grade-dynamic-spacetime.md",
)
FALSE_FLAGS = (
    "fixed_projector_energy_validated", "original_candidate_passed", "case0_v2_validated",
    "physical_gate", "live_admission", "scientificPayloadWriteback", "historical_results_regraded",
    "full_scientific_matrix_executed", "new_scientific_evolution", "uniform_strong_hyperbolicity_validated",
    "common_symmetrizer_validated", "physical_boundary_validated", "nonlinear_stability_validated",
    "constraint_convergence_validated", "off_definition_fo_closure_validated", "general_profile_qualified",
)


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def helper():
    path = ROOT / "scripts/run-nr-k3-case0-hermite-v3.py"
    G.require(G.sha(path) == HELPER_SHA, "frozen v3 infrastructure changed")
    spec = importlib.util.spec_from_file_location("nr_case0_v3_history_only", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sources(budget):
    G.require(G.sha(PARENT / "qualification-gate.json") == GATE_SHA
              and G.sha(PARENT / "worker-result.json") == WORKER_SHA, "frozen case0 v3 evidence changed")
    gate, previous = G.read_terminal(PARENT / "qualification-gate.json"), read(PARENT / "worker-result.json")
    G.require(gate["passed"] is previous["passed"] is previous["case0_v3_validated"] is True
              and previous["physical_gate"] is previous["live_admission"] is previous["scientificPayloadWriteback"] is False,
              "bounded parent success only")
    table = previous["source_before"]
    G.require(len(table) == 521 and table == previous["source_after"] and not set(table).intersection(EXTRA),
              "521 unchanged parent sources plus additive files required")
    for i, (name, digest) in enumerate(table.items()):
        if i % 32 == 0:
            budget.guard()
        G.require(G.sha(G.contained(ROOT, name)) == G.sha(G.contained(PARENT / "source-snapshot", name)) == digest,
                  "parent source/snapshot drift: " + name)
    return dict(table, **{name: G.sha(G.contained(ROOT, name)) for name in EXTRA})


def ancestors(v3, old, budget):
    result = v3.ancestors(old, budget)
    current = old.inventory(PARENT, budget)
    G.require(len(current) == 590, "case0 v3 ancestor file set changed")
    G.require({k: v for k, v in current.items() if k != "qualification-gate.json"}
              == G.read_terminal(PARENT / "qualification-gate.json")["artifact_hashes"], "case0 v3 inventory drift")
    result[PARENT.name] = current
    return result


def worker(directory):
    token = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(token["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID") and token["passed"] is False,
              "owned Windows process required")
    G.require(directory.parent == G.EVIDENCE and directory.is_dir(), "prepared evidence child required")
    G.require(all(os.environ.get(k) == "1" for k in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")),
              "single-thread controls required")
    budget, started = G.Budget(directory), time.monotonic()
    v3 = helper()
    old = v3.ancestor_helper()
    result = dict(schema=METHOD, passed=False, completed=False, errors=[], stages=[], phase="intake",
                  source_before={}, source_after={}, case_indices=[12], integration_steps=0, native_calls=0, retries=0,
                  original_threshold=2e-12, rank_thresholds=[1e-9, 1e-10, 1e-11], case12_v3_validated=False,
                  parent_gate_sha256=GATE_SHA, parent_worker_sha256=WORKER_SHA,
                  resource_caps=dict(seconds=600, output_bytes=G.CAP, headroom=G.HEADROOM,
                                     source_snapshot_bytes=8 * 1024**2, c_reserve=G.C_RESERVE, e_reserve=G.E_RESERVE),
                  **{key: False for key in FALSE_FLAGS})
    budget.record("attempt.json", result)

    def stage(name, **fields):
        budget.guard()
        result["phase"] = name
        row = dict(stage=name, seconds=time.monotonic() - started, **fields)
        budget.record(f"stage-{len(result['stages']):02d}-{name}.json", row)
        result["stages"].append(row)
        print(json.dumps(row), flush=True)

    try:
        table = sources(budget)
        result["source_before"] = table
        ancestry = ancestors(v3, old, budget)
        budget.record("ancestry-before.json", ancestry)
        result["snapshot_bytes"] = old.save_snapshot(budget, table)
        stage("intake-verified", sources=len(table), ancestor_files=sum(map(len, ancestry.values())))

        # All test/numerical processes are descendants of the owned Windows job.
        import numpy as np
        import nr_profile_exact_coefficients as Q
        from science.numerical_relativity import constraint_energy_controls as C
        from science.numerical_relativity import constraint_projector_energy_v3 as V
        from science.numerical_relativity import profile_hermite_candidate as A

        result["environment"] = dict(python=sys.version, numpy=np.__version__, threads=1)
        G.require(C.TOLERANCE == V.TOLERANCE == 2e-12 and list(C.P.RANK_TOLERANCES) == result["rank_thresholds"],
                  "original thresholds changed")
        stage("source-unit-controls-start")
        command = [sys.executable, "-B", "-m", "pytest", "-q", "--noconftest", "-p", "no:cacheprovider",
                   "-c", str(ROOT / "science/numerical_relativity/pytest-case12-source.ini"),
                   "--junitxml=" + str(directory / "unit-controls.xml"),
                   str(ROOT / "science/numerical_relativity/test_profile_exact_source.py")]
        unit = subprocess.run(command, cwd=ROOT, env=dict(os.environ, PYTEST_ADDOPTS=""), check=False)
        budget.guard()
        G.require(unit.returncode == 0, "source/input unit controls failed; no retry")
        xml = ET.parse(directory / "unit-controls.xml").getroot()
        suites = list(xml.iter("testsuite"))
        counts = {key: sum(int(s.get(key, "0")) for s in suites) for key in ("tests", "failures", "errors", "skipped")}
        G.require(counts == dict(tests=26, failures=0, errors=0, skipped=0), "all 26 source/input controls required")
        result["unit_controls"] = counts
        stage("source-unit-controls-complete", **counts)

        def npy(name, array):
            buffer = io.BytesIO()
            np.save(buffer, array, allow_pickle=False)
            budget.save(name, buffer.getvalue())

        stage("original-case12-input-start")
        arrays = C.compare(12)
        baseline = {name: a.copy() for name, a in arrays.items()}
        for name, a in arrays.items():
            npy(f"inputs/case-12-{name}.npy", a)
        budget.record("original-v1-case12-metrics.json", C.metrics(arrays, 12))
        input_hashes = old.inventory(directory / "inputs", budget)
        budget.record("input-hashes.json", input_hashes)
        stage("original-case12-input-complete", arrays=len(arrays))

        stage("coefficient-source-start")
        background = Q.case12()
        budget.record("exact-design-passport.json", background.passport())
        exact = Q.matrix(background, guard=budget.guard)
        geometric = Q.matrix(background, geometric=True, guard=budget.guard)
        budget.record("principal-rational-ray-source.json", Q.encode(exact))
        budget.record("principal-rational-ray-geometric.json", Q.encode(geometric))
        G.require(np.array_equal(exact, geometric) and not np.any(exact[:11]) and not np.any(exact[:, :11]),
                  "independent curvature route or ODE coefficient mismatch")
        intrinsic = Q.intrinsic(exact, background)
        ray_squared = tuple(s * background.ray_squared for s in background.squared_speeds())
        annihilator = Q.annihilator(intrinsic[11:, 11:], ray_squared, guard=budget.guard)
        budget.record("exact-intrinsic-annihilator.json", Q.encode(annihilator))
        G.require(not np.any(annihilator), "exact source polynomial did not annihilate")
        comparisons = {}
        for name, reference in (("main", exact), ("main_intrinsic", intrinsic)):
            high = Q.normalized(reference, background)
            low = Q.normalized(reference, background, precision=50)
            report = Q.compare(arrays[name], high)
            budget.record(f"coefficient-{name}-comparison.json", report)
            G.require(report["relative"] <= C.TOLERANCE, "design/actual coefficient mismatch: " + name)
            G.require(np.array_equal(np.asarray(high, dtype=float), np.asarray(low, dtype=float)),
                      "coefficient50/70 rounding disagreement")
            comparisons[name] = {k: value for k, value in report.items() if k != "witnesses"}
        result.update(coefficients_checked=True, coefficient_comparisons=comparisons,
                      coefficient_scope="independent58/47 only; two curvature routes share other rates; frozen43 not rederived")
        stage("coefficient-source-complete", relative={k: r["relative"] for k, r in comparisons.items()})

        stage("analytical-nodes-start")
        rows = []
        for precision in (50, 70):
            with localcontext() as ctx:
                ctx.prec = precision
                roots = Q.nodes(background, precision=precision)
                error = max(abs(a * a - Q.decimal(s)) for a, s in zip(roots[7:], background.squared_speeds(), strict=True))
                limit = Decimal(10) ** (-precision + 4)
                differences = np.array([float(a) for a in roots]) - arrays["roots"]
                G.require(error <= limit and float(np.max(abs(differences))) <= C.TOLERANCE,
                          "analytical node source mismatch")
                rows.append(dict(precision=precision, roots=list(map(str, roots)), square_error=str(error),
                                 arithmetic_tolerance=str(limit), differences_from_input=differences.tolist(),
                                 bit_equal_to_input=bool(np.array_equal(np.array([float(a) for a in roots]), arrays["roots"]))))
        G.require(np.array_equal(np.array([float(a) for a in Q.nodes(background, precision=50)]),
                                 np.array([float(a) for a in Q.nodes(background, precision=70)])), "node50/70 rounding disagreement")
        budget.record("analytical-node-source.json", dict(rows=rows, acceptance_nodes_unchanged=True, fitted=False))
        budget.record("scalar-hermite-controls.json", v3.scalar_controls(Q.nodes(background)))
        result.update(analytical_nodes_checked=True, scalar_controls_passed=True)
        stage("analytical-nodes-complete")

        def candidate(precision=70):
            return A.candidate(arrays, Q.nodes(background, precision=precision), precision=precision, pulse=budget.guard)

        stage("candidate-case12-start")
        values = candidate()
        for name, value in values.items():
            npy(f"v3-case-12-{name}.npy", value)
        report = C.metrics(values, 12)
        budget.record("v3-case12-metrics.json", report)
        result["candidate_metrics"] = report
        try:
            C.require_gates(report)
        except ValueError as error:
            result["errors"].append("nominal case12: " + str(error))
            result["nominal_case12_gates_passed"] = False
        else:
            result["nominal_case12_gates_passed"] = True
        stage("candidate-case12-checked", passed=result["nominal_case12_gates_passed"], action=report["full_state"]["action_relative"])
        replay = candidate()
        G.require(all(np.array_equal(a, replay[name]) for name, a in values.items()) and C.metrics(replay, 12) == report,
                  "nominal exact replay mismatch")
        second = candidate(50)
        precision_errors = {name: max(C.S.relative(a, b) for a, b in zip(values[name], second[name], strict=True))
                            for name in ("projectors", "full_projectors")}
        G.require(all(error <= C.TOLERANCE for error in precision_errors.values()), "precision50/70 disagreement")
        budget.record("nominal-replay-precision.json", dict(arrays_exact=14, metrics_exact=True, precision_relative=precision_errors))
        result["case12_exact_replay"] = True
        stage("candidate-replay-complete")

        stage("end-to-end-perturbations-start")
        raw = arrays["main"][11:, 11:]
        step = np.where(raw != 0, abs(np.spacing(raw)), 0.0)
        beta_normal = float(arrays["cell"][7:10] @ arrays["normal"])
        sensitivity = []
        nominal = values["full_projectors"][:, 11:, 11:]
        for sign in (-1, 1):
            changed = raw + sign * step
            before = changed.copy()
            G.require(np.any(changed != raw) and np.all(changed[raw == 0] == 0), "original signed-spacing pattern required")
            e = A.shifted_projectors(changed, beta_normal, Q.nodes(background), pulse=budget.guard)
            metrics = C.projector_metrics(changed, np.zeros((47, 47)), e, arrays["speeds"])
            G.require(np.array_equal(changed, before), "changed matrix mutated")
            violations = [key for key, value in metrics.items() if key.endswith("_relative")
                          and (not np.isfinite(value) or value > C.TOLERANCE)]
            ranks = np.array(metrics["ranks"])
            if not (ranks.shape == (13, 3) and np.all(ranks == ranks[:, :1]) and np.all(ranks.sum(axis=0) == 47)):
                violations.append("stable_complete_ranks")
            npy(f"one-ulp-{sign}-matrix.npy", changed)
            npy(f"one-ulp-{sign}-projectors.npy", e)
            again = A.shifted_projectors(changed, beta_normal, Q.nodes(background), pulse=budget.guard)
            G.require(np.array_equal(e, again) and C.projector_metrics(changed, np.zeros((47, 47)), again, arrays["speeds"]) == metrics,
                      "perturbation exact replay mismatch")
            row = dict(sign=sign, metrics=metrics, violations=violations, passed=not violations, exact_replay=True,
                       rebuilt_from_changed_input=True, original_spacing_rule=True, physical_scenario=False,
                       output_entries_different_from_nominal=int(np.count_nonzero(e != nominal)),
                       max_output_difference_from_nominal=float(np.max(abs(e - nominal))))
            budget.record(f"one-ulp-{sign}-metrics.json", row)
            sensitivity.append(row)
            if violations:
                result["errors"].append(f"one-ULP sign{sign}: " + ", ".join(violations))
            stage("one-ulp-minus" if sign < 0 else "one-ulp-plus", passed=row["passed"], violations=violations)
        result["sensitivity"] = sensitivity
        result["case12_rounding_robustness"] = all(row["passed"] for row in sensitivity)
        budget.record("end-to-end-sensitivity.json", dict(rows=sensitivity, threshold=C.TOLERANCE, fixed_projectors_reused=False,
                      shift_removal="unchanged beta_n times I47 after perturbing original main47; no ODE shift"))

        stage("final-integrity")
        G.require(all(np.array_equal(a, baseline[name]) for name, a in arrays.items()), "original inputs mutated")
        G.require(old.inventory(directory / "inputs", budget) == input_hashes, "saved input drift")
        G.require(sources(budget) == table, "source drift")
        for i, (name, digest) in enumerate(table.items()):
            if i % 32 == 0:
                budget.guard()
            G.require(G.sha(G.contained(directory / "source-snapshot", name)) == digest, "snapshot drift")
        after = ancestors(v3, old, budget)
        budget.record("ancestry-after.json", after)
        G.require(after == ancestry, "historical artifact drift")
        result.update(source_after=table, old_artifacts_unchanged=True, original_inputs_unchanged=True,
                      case12_v3_validated=not result["errors"], passed=not result["errors"], completed=not result["errors"])
        stage("complete" if result["passed"] else "failed-gate", passed=result["passed"])
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(passed=False, completed=False, case12_v3_validated=False)
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(json.dumps({key: result[key] for key in ("passed", "case12_v3_validated", "phase", "seconds", "errors")}), flush=True)
    return 0 if result["passed"] else 1


def finalizer(directory, budget):
    budget.guard()
    result = read(directory / "worker-result.json")
    G.require(result["schema"] == METHOD and result["passed"] is result["completed"] is result["case12_v3_validated"] is True
              and not result["errors"], "all case12 candidate controls required")
    G.require(all(result[key] is False for key in FALSE_FLAGS), "no global or retrospective admission")
    G.require(result["case_indices"] == [12] and result["native_calls"] == result["integration_steps"] == result["retries"] == 0,
              "case12 only; no evolution or native calls")
    G.require(result["unit_controls"] == dict(tests=26, failures=0, errors=0, skipped=0), "26 controls required")
    G.require(all(result[key] is True for key in ("coefficients_checked", "analytical_nodes_checked", "scalar_controls_passed",
              "nominal_case12_gates_passed", "case12_exact_replay", "case12_rounding_robustness", "old_artifacts_unchanged",
              "original_inputs_unchanged")), "missing gates")
    G.require([row["sign"] for row in result["sensitivity"]] == [-1, 1] and all(row["passed"] and row["exact_replay"]
              and row["rebuilt_from_changed_input"] and row["original_spacing_rule"] and not row["violations"]
              for row in result["sensitivity"]), "end-to-end reconstructions required")
    table = sources(budget)
    G.require(len(table) == 521 + len(EXTRA) and table == result["source_before"] == result["source_after"], "source identity drift")
    for i, (name, digest) in enumerate(table.items()):
        if i % 32 == 0:
            budget.guard()
        G.require(G.sha(G.contained(directory / "source-snapshot", name)) == digest, "final snapshot drift")
    v3 = helper()
    old = v3.ancestor_helper()
    G.require(read(directory / "ancestry-before.json") == read(directory / "ancestry-after.json") == ancestors(v3, old, budget),
              "final history integrity required")
    G.require(old.inventory(directory / "inputs", budget) == read(directory / "input-hashes.json"), "final inputs changed")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--guard-worker", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    directory = Path(os.path.abspath(args.output_directory))
    if args.guard_worker:
        return worker(directory)
    G.require(G.sha(ROOT / "scripts/nr_owned_control.py") == GUARD_SHA, "frozen supervisor required")
    result = G.supervise([sys.executable, "-B", str(Path(__file__).resolve()), "--guard-worker", "--output-directory", str(directory)],
                         directory, finalizer=finalizer)
    print(json.dumps({key: result[key] for key in ("passed", "completed", "errors")}), flush=True)
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
