"""One authorized case12 independent43 source audit, 64 MiB/600 s, no retry."""

from __future__ import annotations

import argparse
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

METHOD = "nr-case12-independent43-source-controls-v1"
PARENT = G.EVIDENCE / "nr-k3-case12-hermite-v3-controls-v1-20261013"
GATE_SHA = "6c346f14e33f1734b551a83d00e413a24e0092caff8cbcdbf4a8c8278d7c6759"
WORKER_SHA = "5dcc764b43621c2189bab0ea192f90c5dc142f0fe69cf31a0975cf0d3f1bb5da"
HELPER_SHA = "ce77175f9843be4e261527fe86173506fadf09e84cfff31db12312676e3795a3"
GUARD_SHA = "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1"
TOLERANCE = 2e-12
EXTRA = (
    "scripts/nr_constraint_exact_coefficients.py",
    "scripts/run-nr-k3-case12-constraint-source.py",
    "science/numerical_relativity/test_constraint_exact_source.py",
    "science/numerical_relativity/pytest-case12-constraint-source.ini",
    "science/numerical_relativity/DERIVATION-20261013-case12-constraint-source.md",
    "science/numerical_relativity/EXPERIMENT-20261013-case12-constraint-source.md",
    "science/numerical_relativity/RESULTS-20261013-case12-hermite-v3.md",
)
FALSE_FLAGS = (
    "fixed_projector_energy_validated", "original_candidate_passed", "historical_results_regraded",
    "physical_gate", "live_admission", "scientificPayloadWriteback", "full_scientific_matrix_executed",
    "new_scientific_evolution", "uniform_strong_hyperbolicity_validated", "common_symmetrizer_validated",
    "physical_boundary_validated", "nonlinear_stability_validated", "constraint_convergence_validated",
    "off_definition_fo_closure_validated", "general_profile_qualified", "nonlinear_subsidiary_system_validated",
    "hermite_projectors_recomputed", "acceptance_inputs_substituted", "gpu_executed",
)


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def helper():
    path = ROOT / "scripts/run-nr-k3-case12-hermite-v3.py"
    G.require(G.sha(path) == HELPER_SHA, "frozen case12 infrastructure changed")
    spec = importlib.util.spec_from_file_location("nr_case12_history_only", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sources(budget):
    G.require(G.sha(PARENT / "qualification-gate.json") == GATE_SHA
              and G.sha(PARENT / "worker-result.json") == WORKER_SHA, "case12 ancestor evidence changed")
    terminal, previous = G.read_terminal(PARENT / "qualification-gate.json"), read(PARENT / "worker-result.json")
    G.require(terminal["passed"] is previous["passed"] is previous["case12_v3_validated"] is True
              and previous["original_threshold"] == TOLERANCE
              and previous["physical_gate"] is previous["live_admission"] is previous["scientificPayloadWriteback"] is False,
              "bounded case12 parent success and original threshold required")
    table = previous["source_before"]
    G.require(len(table) == 530 and table == previous["source_after"] and not set(table).intersection(EXTRA),
              "530 frozen sources plus additive files required")
    for i, (name, digest) in enumerate(table.items()):
        if i % 32 == 0:
            budget.guard()
        G.require(G.sha(G.contained(ROOT, name)) == G.sha(G.contained(PARENT / "source-snapshot", name)) == digest,
                  "source or ancestor snapshot drift: " + name)
    return dict(table, **{name: G.sha(G.contained(ROOT, name)) for name in EXTRA})


def ancestors(parent, v3, old, budget):
    result = parent.ancestors(v3, old, budget)
    current = old.inventory(PARENT, budget)
    G.require(len(current) == 603, "case12 ancestor file set changed")
    G.require({name: digest for name, digest in current.items() if name != "qualification-gate.json"}
              == G.read_terminal(PARENT / "qualification-gate.json")["artifact_hashes"], "case12 ancestor inventory drift")
    result[PARENT.name] = current
    G.require(sum(map(len, result.values())) == 2874, "five frozen evidence directories required")
    return result


def worker(directory):
    token = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(token["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID") and token["passed"] is False,
              "owned Windows process required")
    G.require(directory.parent == G.EVIDENCE and directory.is_dir(), "prepared evidence child required")
    G.require(all(os.environ.get(k) == "1" for k in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")),
              "single-thread controls required")
    budget, started = G.Budget(directory), time.monotonic()
    result = dict(schema=METHOD, passed=False, completed=False, errors=[], phase="intake", stages=[],
                  case_indices=[12], integration_steps=0, native_calls=0, retries=0, original_threshold=TOLERANCE,
                  source_before={}, source_after={}, case12_independent43_source_checked=False,
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
        parent = helper()
        v3 = parent.helper()
        old = v3.ancestor_helper()
        table = sources(budget)
        result["source_before"] = table
        ancestry = ancestors(parent, v3, old, budget)
        budget.record("ancestry-before.json", ancestry)
        result["snapshot_bytes"] = old.save_snapshot(budget, table)
        stage("intake-verified", sources=len(table), ancestor_files=sum(map(len, ancestry.values())))

        # No numerical operation or test process runs outside this owned worker/job.
        import numpy as np
        from scripts import nr_constraint_exact_coefficients as R
        from scripts import nr_profile_exact_coefficients as Q

        result["environment"] = dict(python=sys.version, numpy=np.__version__, threads=1)
        stage("unit-controls-start")
        command = [sys.executable, "-B", "-m", "pytest", "-q", "--noconftest", "-p", "no:cacheprovider",
                   "-c", str(ROOT / "science/numerical_relativity/pytest-case12-constraint-source.ini"),
                   "--junitxml=" + str(directory / "unit-controls.xml"),
                   str(ROOT / "science/numerical_relativity/test_constraint_exact_source.py")]
        unit = subprocess.run(command, cwd=ROOT, env=dict(os.environ, PYTEST_ADDOPTS=""), check=False)
        budget.guard()
        G.require(unit.returncode == 0, "unit controls failed; no retry")
        suites = list(ET.parse(directory / "unit-controls.xml").getroot().iter("testsuite"))
        counts = {key: sum(int(s.get(key, "0")) for s in suites) for key in ("tests", "failures", "errors", "skipped")}
        G.require(counts == dict(tests=27, failures=0, errors=0, skipped=0), "all 27 registered unit controls required")
        result["unit_controls"] = counts
        stage("unit-controls-complete", **counts)

        stage("saved-input-intake")
        shapes = dict(principal=(43, 43), intrinsic=(43, 43), leading=(43, 58), ode=(43, 43),
                      main=(58, 58), main_intrinsic=(58, 58))
        arrays, input_hashes = {}, {}
        for name, shape in shapes.items():
            path = G.contained(PARENT / "inputs", f"case-12-{name}.npy")
            expected = ancestry[PARENT.name]["inputs/" + path.name]
            G.require(G.sha(path) == expected, "saved input identity mismatch")
            raw = path.read_bytes()
            budget.save("inputs/" + path.name, raw)
            G.require(G.sha(directory / "inputs" / path.name) == expected, "exact input copy required")
            array = np.load(path, allow_pickle=False)
            G.require(array.dtype == np.float64 and array.shape == shape and np.isfinite(array).all(),
                      "unaltered finite binary64 coefficient input required")
            array.setflags(write=False)
            arrays[name], input_hashes[path.name] = array, expected
        budget.record("input-hashes.json", input_hashes)

        stage("exact-leading-map-start")
        background = Q.case12()
        G.require(background.passport() == read(PARENT / "exact-design-passport.json"), "original rational design required")
        budget.record("exact-design-passport.json", background.passport())
        mapping, ode = R.leading(background, guard=budget.guard), R.ode_projector(background)
        budget.record("leading-rational-scaled.json", Q.encode(mapping))
        budget.record("ode-rational.json", Q.encode(ode))
        main = Q.matrix(background, guard=budget.guard)
        G.require(Q.encode(main) == read(PARENT / "principal-rational-ray-source.json")
                  and not np.any(main[:11]) and not np.any(main[:, :11]), "independent58 source drift or base block mismatch")
        stage("exact-principal-quotient-start")
        principal, section, pivots = R.quotient(mapping, main, guard=budget.guard)
        budget.record("principal43-rational-scaled.json", Q.encode(principal))
        budget.record("right-inverse-leftmost.json", dict(pivots=pivots, matrix=Q.encode(section)))
        alternate, other, other_pivots = R.quotient(mapping, main, reverse=True, guard=budget.guard)
        budget.record("right-inverse-rightmost.json", dict(pivots=other_pivots, matrix=Q.encode(other)))
        G.require(np.array_equal(principal, alternate) and not np.array_equal(section, other),
                  "distinct sections must give exactly the same unique quotient")
        intrinsic = R.intrinsic(principal, background)
        budget.record("intrinsic43-rational-scaled.json", Q.encode(intrinsic))
        o58 = R.zeros(58, 58)
        o58[:11, :11] = R.eye(11)
        residuals = {
            "right_inverse_left": R.product(mapping, section, guard=budget.guard) - R.eye(43),
            "right_inverse_right": R.product(mapping, other, guard=budget.guard) - R.eye(43),
            "all_state_columns": R.product(principal, mapping, guard=budget.guard) - R.product(mapping, main, guard=budget.guard),
            "ode_idempotence": R.product(ode, ode, guard=budget.guard) - ode,
            "ode_state_map": R.product(ode, mapping, guard=budget.guard) - R.product(mapping, o58, guard=budget.guard),
            "ode_left_zero": R.product(ode, principal, guard=budget.guard),
            "ode_right_zero": R.product(principal, ode, guard=budget.guard),
            "intrinsic_state_map": R.product(intrinsic, mapping, guard=budget.guard)
                                   - R.product(mapping, Q.intrinsic(main, background), guard=budget.guard),
        }
        for name, residual in residuals.items():
            budget.record("identities/" + name + ".json", Q.encode(residual))
        G.require(all(not np.any(x) for x in residuals.values()) and sum(ode.diagonal()) == 11,
                  "exact ODE separation and full principal closure required")
        annihilator = Q.annihilator(intrinsic, tuple(s * background.ray_squared for s in background.squared_speeds()),
                                   guard=budget.guard)
        budget.record("identities/intrinsic-annihilator.json", Q.encode(annihilator))
        G.require(not np.any(annihilator), "exact intrinsic43 annihilator failed")
        budget.record("exact-identities.json", dict(all_zero=True, leading_row_rank=43, ode_rank=11,
                      independent_right_inverses=2, distinct_sections=True, state_columns=58,
                      residuals=list(residuals), polynomial="K product_j(K^2 - ray_squared*s_j*I43)",
                      source_scope="principal quotient from physical leading map and independent58 reference; not nonlinear43 PDE"))
        result["exact_principal_closure"] = True
        stage("exact-principal-quotient-complete", leading_row_rank=43, ode_rank=11)

        stage("coefficient-comparisons-start")
        coefficients = dict(principal=(principal, "principal"), intrinsic=(intrinsic, "principal"),
                            leading=(mapping, "leading"), ode=(ode, "ode"),
                            main=(main, "main"), main_intrinsic=(Q.intrinsic(main, background), "main"))
        comparisons, mutations = {}, []
        result["coefficient_comparisons"] = comparisons
        result["coefficient_mutations"] = mutations
        for name, (source, kind) in coefficients.items():
            budget.guard()
            normalize = (lambda precision: Q.normalized(source, background, precision=precision)) if kind == "main" else (
                lambda precision: R.normalized(source, background, kind=kind, precision=precision))
            high, low = normalize(70), normalize(50)
            report = Q.compare(arrays[name], high)
            precision_equal = bool(np.array_equal(np.asarray(high, dtype=float), np.asarray(low, dtype=float)))
            report["precision50_70_rounded_equal"] = precision_equal
            budget.record("comparison-" + name + ".json", report)
            G.require(report["relative"] <= TOLERANCE and precision_equal, "coefficient/precision disagreement: " + name)
            comparisons[name] = {key: value for key, value in report.items() if key != "witnesses"}
            if kind != "main":
                changed = arrays[name].copy()
                changed[0, 0] += 1e-6
                mutation = Q.compare(changed, high)
                row = dict(name=name, row=0, column=0, added=1e-6, relative=mutation["relative"],
                           rejected=mutation["relative"] > TOLERANCE, input_substituted=False)
                mutations.append(row)
                G.require(row["rejected"], "end-to-end coefficient mutation was not rejected: " + name)
        budget.record("coefficient-mutation-controls.json", mutations)
        result.update(coefficient_comparisons=comparisons, coefficient_mutations=mutations,
                      actual_coefficients_checked=True, upstream58_source_matched=True)
        stage("coefficient-comparisons-complete", relative={key: value["relative"] for key, value in comparisons.items()})

        stage("exact-replay-start")
        mapping_again = R.leading(background, guard=budget.guard)
        replay, replay_section, replay_pivots = R.quotient(mapping_again, main, guard=budget.guard)
        G.require(np.array_equal(mapping, mapping_again) and np.array_equal(principal, replay)
                  and np.array_equal(section, replay_section) and pivots == replay_pivots, "deterministic exact replay mismatch")
        budget.record("exact-replay.json", dict(mapping=True, principal=True, right_inverse=True, pivots=True,
                      same_batch=True, reused_independent58_source=True, rebuilt_physical_map=True))
        result["exact_replay"] = True
        stage("exact-replay-complete")

        stage("final-integrity")
        G.require(old.inventory(directory / "inputs", budget) == input_hashes, "copied coefficient input drift")
        G.require(sources(budget) == table, "source drift")
        for i, (name, digest) in enumerate(table.items()):
            if i % 32 == 0:
                budget.guard()
            G.require(G.sha(G.contained(directory / "source-snapshot", name)) == digest, "source snapshot drift")
        after = ancestors(parent, v3, old, budget)
        budget.record("ancestry-after.json", after)
        G.require(after == ancestry, "historical artifacts changed")
        result.update(source_after=table, old_artifacts_unchanged=True, original_inputs_unchanged=True,
                      case12_independent43_source_checked=True, passed=True, completed=True)
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(passed=False, completed=False, case12_independent43_source_checked=False)
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(json.dumps({key: result[key] for key in ("passed", "case12_independent43_source_checked", "phase", "seconds", "errors")}), flush=True)
    return 0 if result["passed"] else 1


def finalizer(directory, budget):
    # Stdlib-only integrity checks. No numerical replay after job completion.
    result = read(directory / "worker-result.json")
    G.require(result["schema"] == METHOD and result["passed"] is result["completed"] is result["case12_independent43_source_checked"] is True
              and not result["errors"], "all independent43 source controls required")
    G.require(all(result[key] is False for key in FALSE_FLAGS), "no retrospective or global admission")
    G.require(result["case_indices"] == [12] and result["native_calls"] == result["integration_steps"] == result["retries"] == 0
              and result["original_threshold"] == TOLERANCE, "case12 only with unchanged limits")
    G.require(result["unit_controls"] == dict(tests=27, failures=0, errors=0, skipped=0), "27 complete controls required")
    G.require(all(result[key] is True for key in ("exact_principal_closure", "actual_coefficients_checked", "upstream58_source_matched",
                  "exact_replay", "old_artifacts_unchanged", "original_inputs_unchanged")), "missing source gate")
    G.require(set(result["coefficient_comparisons"]) == {"principal", "intrinsic", "leading", "ode", "main", "main_intrinsic"}
              and all(value["relative"] <= TOLERANCE and value["precision50_70_rounded_equal"]
                      and not value["coefficient_fitting"] and not value["input_substituted"]
                      for value in result["coefficient_comparisons"].values()), "coefficient/precision gates missing")
    G.require([row["name"] for row in result["coefficient_mutations"]] == ["principal", "intrinsic", "leading", "ode"]
              and all(row["rejected"] for row in result["coefficient_mutations"]), "negative controls missing")
    table = sources(budget)
    G.require(len(table) == 530 + len(EXTRA) and table == result["source_before"] == result["source_after"], "source identity drift")
    for i, (name, digest) in enumerate(table.items()):
        if i % 32 == 0:
            budget.guard()
        G.require(G.sha(G.contained(directory / "source-snapshot", name)) == digest, "final snapshot drift")
    parent = helper()
    v3 = parent.helper()
    old = v3.ancestor_helper()
    G.require(read(directory / "ancestry-before.json") == read(directory / "ancestry-after.json") == ancestors(parent, v3, old, budget),
              "final historical integrity required")
    G.require(old.inventory(directory / "inputs", budget) == read(directory / "input-hashes.json"), "final inputs drift")
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
