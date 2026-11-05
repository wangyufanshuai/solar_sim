"""One separately authorized full linear case12 audit, 64 MiB/600 s, no evolution."""

from __future__ import annotations

import argparse
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

METHOD = "nr-case12-full-linear-symbol-controls-v1"
PARENT = G.EVIDENCE / "nr-k3-case12-constraint-source-controls-v1-20261013"
GATE_SHA = "9b7fb6fe8d55f49cebcaaadb05853e3b0cd3ab494932595a26cad73efeb92bb7"
WORKER_SHA = "e491a857e71da22da60950d13c6c3184bdbed0faab1275982b87849b300d73af"
HELPER_SHA = "f2d793b7081775e8b3448e02a5634f454105e2d9ec12035b67c2eef52a7984e3"
GUARD_SHA = "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1"
TOLERANCE = 2e-12
EXTRA = (
    "scripts/nr_constraint_full_symbol.py",
    "scripts/run-nr-k3-case12-full-symbol.py",
    "science/numerical_relativity/test_constraint_full_symbol.py",
    "science/numerical_relativity/pytest-case12-full-symbol.ini",
    "science/numerical_relativity/DERIVATION-20261013-case12-full-symbol.md",
    "science/numerical_relativity/EXPERIMENT-20261013-case12-full-symbol.md",
    "science/numerical_relativity/RESULTS-20261013-case12-constraint-source.md",
)
FALSE_FLAGS = (
    "physical_gate", "live_admission", "scientificPayloadWriteback", "full_scientific_matrix_executed",
    "new_scientific_evolution", "nonlinear_subsidiary_system_validated", "uniform_strong_hyperbolicity_validated",
    "nonlinear_stability_validated", "constraint_convergence_validated", "physical_boundary_validated",
    "general_profile_qualified", "common_symmetrizer_validated", "gpu_executed", "historical_results_regraded",
    "acceptance_inputs_substituted", "zero_frequency_full43_inverse_exists", "hermite_projectors_recomputed",
)


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def helpers():
    path = ROOT / "scripts/run-nr-k3-case12-constraint-source.py"
    G.require(G.sha(path) == HELPER_SHA, "frozen parent infrastructure changed")
    spec = importlib.util.spec_from_file_location("nr_independent43_history_only", path)
    parent = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(parent)
    prior = parent.helper()
    v3 = prior.helper()
    return parent, prior, v3, v3.ancestor_helper()


def sources(budget):
    G.require(G.sha(PARENT / "qualification-gate.json") == GATE_SHA
              and G.sha(PARENT / "worker-result.json") == WORKER_SHA, "independent43 evidence changed")
    gate, previous = G.read_terminal(PARENT / "qualification-gate.json"), read(PARENT / "worker-result.json")
    G.require(gate["passed"] is previous["passed"] is previous["case12_independent43_source_checked"] is True
              and previous["original_threshold"] == TOLERANCE
              and previous["physical_gate"] is previous["live_admission"] is previous["scientificPayloadWriteback"] is False,
              "local independent43 parent required")
    table = previous["source_before"]
    G.require(len(table) == 537 and table == previous["source_after"] and not set(table).intersection(EXTRA),
              "537 unchanged parent sources and additive files required")
    for i, (name, digest) in enumerate(table.items()):
        if i % 32 == 0:
            budget.guard()
        G.require(G.sha(G.contained(ROOT, name)) == G.sha(G.contained(PARENT / "source-snapshot", name)) == digest,
                  "parent source/snapshot drift: " + name)
    return dict(table, **{name: G.sha(G.contained(ROOT, name)) for name in EXTRA})


def ancestors(modules, budget):
    parent, prior, v3, old = modules
    result = parent.ancestors(prior, v3, old, budget)
    current = old.inventory(PARENT, budget)
    G.require(len(current) == 591 and {name: digest for name, digest in current.items() if name != "qualification-gate.json"}
              == G.read_terminal(PARENT / "qualification-gate.json")["artifact_hashes"], "parent artifact set drift")
    result[PARENT.name] = current
    G.require(sum(map(len, result.values())) == 3465, "six immutable historical directories required")
    return result


def worker(directory):
    token = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(token["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID") and token["passed"] is False,
              "owned process required")
    G.require(directory.parent == G.EVIDENCE and directory.is_dir(), "prepared evidence child required")
    G.require(all(os.environ.get(k) == "1" for k in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")),
              "single-thread controls required")
    budget, started = G.Budget(directory), time.monotonic()
    result = dict(schema=METHOD, passed=False, completed=False, phase="intake", errors=[], stages=[],
                  case_indices=[12], frequencies=[0, .5, 1, 2, 4, 8], integration_steps=0, native_calls=0, retries=0,
                  original_threshold=TOLERANCE, source_before={}, source_after={},
                  case12_full_linear_symbol_checked=False, parent_gate_sha256=GATE_SHA, parent_worker_sha256=WORKER_SHA,
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
        modules = helpers()
        parent, _, _, old = modules
        table = sources(budget)
        result["source_before"] = table
        ancestry = ancestors(modules, budget)
        budget.record("ancestry-before.json", ancestry)
        result["snapshot_bytes"] = old.save_snapshot(budget, table)
        stage("intake-verified", sources=len(table), ancestor_files=sum(map(len, ancestry.values())))

        import numpy as np
        from scripts import nr_constraint_full_symbol as A
        from scripts import nr_constraint_exact_coefficients as R
        from scripts import nr_profile_exact_coefficients as Q
        from science.numerical_relativity import constraint_symbol_bridge as B

        G.require(B.TOLERANCE == B.P.TOLERANCE == TOLERANCE, "original floating threshold changed")
        result["environment"] = dict(python=sys.version, numpy=np.__version__, threads=1)
        stage("unit-controls-start")
        command = [sys.executable, "-B", "-m", "pytest", "-q", "--noconftest", "-p", "no:cacheprovider",
                   "-c", str(ROOT / "science/numerical_relativity/pytest-case12-full-symbol.ini"),
                   "--junitxml=" + str(directory / "unit-controls.xml"),
                   str(ROOT / "science/numerical_relativity/test_constraint_full_symbol.py")]
        completed = subprocess.run(command, cwd=ROOT, env=dict(os.environ, PYTEST_ADDOPTS=""), check=False)
        budget.guard()
        G.require(completed.returncode == 0, "unit failure; no retry")
        suites = list(ET.parse(directory / "unit-controls.xml").getroot().iter("testsuite"))
        counts = {key: sum(int(s.get(key, "0")) for s in suites) for key in ("tests", "failures", "errors", "skipped")}
        G.require(counts == dict(tests=22, failures=0, errors=0, skipped=0), "22 complete registered controls required")
        result["unit_controls"] = counts
        stage("unit-controls-complete", **counts)

        def npy(name, value):
            stream = io.BytesIO()
            np.save(stream, value, allow_pickle=False)
            budget.save(name, stream.getvalue())

        arrays, input_hashes = {}, {}
        for name, shape, ancestor in (("cell", (58,), parent.PARENT), ("normal", (3,), parent.PARENT),
                                      ("main", (58, 58), PARENT)):
            path = G.contained(ancestor / "inputs", f"case-12-{name}.npy")
            digest = ancestry[ancestor.name]["inputs/" + path.name]
            G.require(G.sha(path) == digest, "unchanged case12 input required")
            budget.save("inputs/" + path.name, path.read_bytes())
            value = np.load(path, allow_pickle=False)
            G.require(value.dtype == np.float64 and value.shape == shape and np.isfinite(value).all(), "finite binary64 input required")
            value.setflags(write=False)
            arrays[name], input_hashes[path.name] = value, digest
        budget.record("input-hashes.json", input_hashes)
        background = Q.case12()
        G.require(background.passport() == read(PARENT / "exact-design-passport.json"), "original exact design required")
        budget.record("exact-design-passport.json", background.passport())

        stage("independent-source-and-physical-map")
        source = A.source(background, guard=budget.guard)
        main = Q.matrix(background, guard=budget.guard)
        G.require(Q.encode(main) == read(parent.PARENT / "principal-rational-ray-source.json"), "frozen exact58 principal changed")
        rows = A.physical_coefficients(background, guard=budget.guard)
        budget.record("source58-rational.json", Q.encode(source))
        for i, coefficient in enumerate(rows):
            budget.record(f"physical43-coefficient-{i}.json", Q.encode(coefficient))
        actual_source = B.P.source_matrix(arrays["cell"]).copy()
        npy("actual-source58.npy", actual_source)
        source_real, source_imag = A.frequency_value((source,), background, F(0))
        G.require(not np.any(source_imag), "algebraic source is real")
        source_report = Q.compare(actual_source, source_real)
        budget.record("source58-comparison.json", source_report)
        G.require(source_report["relative"] <= TOLERANCE, "independent source coefficient mismatch")
        result["source58_relative"] = source_report["relative"]

        def derive_registered(label, physical_coefficients, source_coefficients, *, reverse=False):
            G.require(label in ("leftmost", "rightmost", "replay"), "registered derivation only")
            try:
                return A.derive(physical_coefficients, source_coefficients, reverse=reverse, guard=budget.guard)
            except A.PolynomialClosureError as error:
                # Keep the failed exact relation, not just its exception message.
                # Saving diagnostics remains subject to the SAME budget/deadline.
                evidence = error.evidence
                prefix = "polynomial-failure/" + label + "/"
                failure = dict(derivation=label, error=str(error), qualified=False,
                               artifact_root=prefix, diagnostics_complete=False)
                result["polynomial_failure"] = failure
                budget.record(prefix + "failure.json", failure)
                for name in ("operator", "target", "residual", "section"):
                    budget.record(prefix + name + ".json", Q.encode(evidence[name]))
                for index, coefficient in enumerate(evidence["coefficients"]):
                    budget.record(prefix + f"unqualified-coefficient-{index}.json", Q.encode(coefficient))
                budget.record(prefix + "pivots.json", evidence["pivots"])
                failure["diagnostics_complete"] = True
                budget.record(prefix + "complete.json", failure)
                raise

        stage("exact-polynomial-derivation-start")
        derived = derive_registered("leftmost", rows, (source, main))
        subsidiary = derived["coefficients"]
        budget.record("coefficient-system.json", Q.encode(derived["operator"]))
        budget.record("coefficient-target.json", Q.encode(derived["target"]))
        budget.record("coefficient-residual.json", Q.encode(derived["residual"]))
        budget.record("section-leftmost.json", dict(pivots=derived["pivots"], matrix=Q.encode(derived["section"])))
        for i, coefficient in enumerate(subsidiary):
            budget.record(f"subsidiary43-coefficient-{i}.json", Q.encode(coefficient))
        alternative = derive_registered("rightmost", rows, (source, main), reverse=True)
        budget.record("section-rightmost.json", dict(pivots=alternative["pivots"], matrix=Q.encode(alternative["section"])))
        G.require(len(derived["pivots"]) == len(alternative["pivots"]) == 129
                  and derived["operator"].shape == (129, 290) and derived["residual"].shape == (43, 290)
                  and not np.array_equal(derived["section"], alternative["section"])
                  and all(np.array_equal(a, b) for a, b in zip(subsidiary, alternative["coefficients"], strict=True)),
                  "full coefficient rank129 and section-independent polynomial required")
        result["exact_polynomial_closure"] = True
        stage("exact-polynomial-derivation-complete", coefficient_rank=129, coefficient_powers=list(range(5)))

        stage("zero-frequency-physical-image")
        zero = A.zero_frequency(rows, subsidiary, source, guard=budget.guard)
        for name in ("reduced_map", "reduced_operator", "section", "residual", "off_image_ambiguity"):
            budget.record("zero-frequency/" + name + ".json", Q.encode(zero[name]))
        budget.record("zero-frequency/summary.json", {k: v for k, v in zero.items() if not isinstance(v, np.ndarray)})
        G.require(zero["rank"] == 39 and zero["full43_right_inverse_exists"] is False, "no fictitious rank43 at zero")
        result["zero_frequency_reachable_rank"] = zero["rank"]
        result["zero_frequency_image_checked"] = True

        stage("registered-frequency-comparisons")
        reports, mutations = [], []
        result["frequency_reports"], result["coefficient_mutations"] = reports, mutations
        for index, rho in enumerate((F(0), F(1, 2), F(1), F(2), F(4), F(8))):
            budget.guard()
            wave = float(rho) * arrays["normal"]
            physical = B.physical_rows(arrays["cell"], wave)
            symbol = B.linear_symbol(arrays["cell"], wave)
            generator = actual_source + 1j * float(rho) * arrays["main"]
            row_report = dict(rho=float(rho), comparisons={})
            for name, actual, coefficients in (("physical", physical, rows), ("subsidiary", symbol, subsidiary),
                                                ("generator", generator, (source, main))):
                npy(f"frequency-{index}-{name}.npy", actual)
                high = A.frequency_value(coefficients, background, rho, precision=70)
                low = A.frequency_value(coefficients, background, rho, precision=50)
                for part, observed, hi, lo in zip(("real", "imag"), (actual.real, actual.imag), high, low, strict=True):
                    report = Q.compare(observed, hi)
                    equal = bool(np.array_equal(np.asarray(hi, dtype=float), np.asarray(lo, dtype=float)))
                    report["precision50_70_rounded_equal"] = equal
                    budget.record(f"frequency-{index}-{name}-{part}-comparison.json", report)
                    row_report["comparisons"][name + "_" + part] = {k: v for k, v in report.items() if k != "witnesses"}
                    G.require(equal and report["relative"] <= TOLERANCE, "full coefficient disagreement at " + str(rho) + "/" + name + "/" + part)
                changed = actual.real.copy()
                changed[0, 0] += 1e-6
                mutation = Q.compare(changed, high[0])
                G.require(mutation["relative"] > TOLERANCE, "mutated comparator input not rejected")
                mutations.append(dict(rho=float(rho), name=name, added=1e-6, row=0, column=0,
                                      relative=mutation["relative"], rejected=True))
            expected, observed = physical @ generator, symbol @ physical
            relative = float(np.linalg.norm(observed - expected, np.inf) / max(1., float(np.linalg.norm(expected, np.inf))))
            row_report["actual_intertwining_relative"] = relative
            reports.append(row_report)
            budget.record(f"frequency-{index}-summary.json", row_report)
            G.require(np.isfinite(relative) and relative <= TOLERANCE, "actual input full-state intertwining failed")
        budget.record("coefficient-mutations.json", mutations)
        result["actual_full_symbol_checked"] = True
        stage("registered-frequency-comparisons-complete", max_actual_intertwining=max(r["actual_intertwining_relative"] for r in reports))

        stage("deterministic-replay")
        replay_source = A.source(background, guard=budget.guard)
        replay_rows = A.physical_coefficients(background, guard=budget.guard)
        replay = derive_registered("replay", replay_rows, (replay_source, main))
        G.require(np.array_equal(source, replay_source) and all(np.array_equal(a, b) for a, b in zip(rows, replay_rows, strict=True))
                  and all(np.array_equal(a, b) for a, b in zip(subsidiary, replay["coefficients"], strict=True))
                  and np.array_equal(derived["section"], replay["section"]) and derived["pivots"] == replay["pivots"],
                  "exact same-batch replay failed")
        budget.record("exact-replay.json", dict(source58=True, physical_map=True, subsidiary_coefficients=True,
                      section=True, pivots=True, independent_principal58_shared=True))
        result["exact_replay"] = True

        stage("final-integrity")
        G.require(old.inventory(directory / "inputs", budget) == input_hashes and sources(budget) == table, "input/source drift")
        for i, (name, digest) in enumerate(table.items()):
            if i % 32 == 0:
                budget.guard()
            G.require(G.sha(G.contained(directory / "source-snapshot", name)) == digest, "source snapshot drift")
        after = ancestors(modules, budget)
        budget.record("ancestry-after.json", after)
        G.require(after == ancestry, "historical artifacts changed")
        result.update(source_after=table, old_artifacts_unchanged=True, original_inputs_unchanged=True,
                      passed=True, completed=True, case12_full_linear_symbol_checked=True)
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(passed=False, completed=False, case12_full_linear_symbol_checked=False)
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(json.dumps({key: result[key] for key in ("passed", "case12_full_linear_symbol_checked", "phase", "seconds", "errors")}), flush=True)
    return 0 if result["passed"] else 1


def finalizer(directory, budget):
    result = read(directory / "worker-result.json")
    G.require(result["schema"] == METHOD and result["passed"] is result["completed"] is result["case12_full_linear_symbol_checked"] is True
              and not result["errors"], "complete full-symbol controls required")
    G.require(all(result[key] is False for key in FALSE_FLAGS), "no global or zero-rank inflation")
    G.require(result["case_indices"] == [12] and result["frequencies"] == [0, .5, 1, 2, 4, 8]
              and result["native_calls"] == result["integration_steps"] == result["retries"] == 0
              and result["original_threshold"] == TOLERANCE, "registered case12 scope only")
    G.require(result["unit_controls"] == dict(tests=22, failures=0, errors=0, skipped=0), "22 controls required")
    G.require(all(result[key] is True for key in ("exact_polynomial_closure", "zero_frequency_image_checked", "actual_full_symbol_checked",
                  "exact_replay", "old_artifacts_unchanged", "original_inputs_unchanged"))
              and result["zero_frequency_reachable_rank"] == 39 and result["source58_relative"] <= TOLERANCE, "missing equation-source gates")
    reports = result["frequency_reports"]
    G.require([row["rho"] for row in reports] == result["frequencies"] and all(
        row["actual_intertwining_relative"] <= TOLERANCE and len(row["comparisons"]) == 6 and all(
            value["relative"] <= TOLERANCE and value["precision50_70_rounded_equal"]
            and not value["coefficient_fitting"] and not value["input_substituted"]
            for value in row["comparisons"].values()) for row in reports), "frequency gates incomplete")
    G.require(len(result["coefficient_mutations"]) == 18 and all(row["rejected"] for row in result["coefficient_mutations"]), "negative controls incomplete")
    table = sources(budget)
    G.require(len(table) == 537 + len(EXTRA) and table == result["source_before"] == result["source_after"], "source identity drift")
    for i, (name, digest) in enumerate(table.items()):
        if i % 32 == 0:
            budget.guard()
        G.require(G.sha(G.contained(directory / "source-snapshot", name)) == digest, "final snapshot drift")
    modules = helpers()
    G.require(read(directory / "ancestry-before.json") == read(directory / "ancestry-after.json") == ancestors(modules, budget),
              "history integrity drift")
    G.require(modules[-1].inventory(directory / "inputs", budget) == read(directory / "input-hashes.json"), "final input drift")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--guard-worker", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    directory = Path(os.path.abspath(args.output_directory))
    if args.guard_worker:
        return worker(directory)
    G.require(G.sha(ROOT / "scripts/nr_owned_control.py") == GUARD_SHA, "frozen resource supervisor required")
    result = G.supervise([sys.executable, "-B", str(Path(__file__).resolve()), "--guard-worker", "--output-directory", str(directory)],
                         directory, finalizer=finalizer)
    print(json.dumps({key: result[key] for key in ("passed", "completed", "errors")}), flush=True)
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
