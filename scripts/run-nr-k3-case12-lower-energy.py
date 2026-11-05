"""One separately authorized case12 lower-energy audit; 64 MiB/600 s, no evolution."""

from __future__ import annotations

import argparse
from fractions import Fraction as F
import hashlib
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

METHOD = "nr-case12-lower-energy-controls-v1"
PARENT = G.EVIDENCE / "nr-k3-case12-full-symbol-controls-v1-20261013"
HERMITE = G.EVIDENCE / "nr-k3-case12-hermite-v3-controls-v1-20261013"
GATE_SHA = "e2d64d53023f1ca0f6a100333f6ebe9ff73de24de80bf420453c800e947be3a4"
WORKER_SHA = "393903039481482178fac4d57b5a85e6f0465c3f3fb92af631896f12309377e6"
HELPER_SHA = "ba49966e272cf1bded51e74dd32e880767d0f1f2e3678fcd31ff9919e4a01478"
GUARD_SHA = "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1"
TOLERANCE = 2e-12
FREQUENCIES = (F(0), F(1, 8), F(1, 4), F(1, 2), F(1), F(2), F(4), F(8))
EXTRA = (
    "scripts/nr_constraint_laurent_energy.py",
    "scripts/run-nr-k3-case12-lower-energy.py",
    "science/numerical_relativity/test_constraint_laurent_energy.py",
    "science/numerical_relativity/pytest-case12-lower-energy.ini",
    "science/numerical_relativity/DERIVATION-20261013-case12-lower-energy.md",
    "science/numerical_relativity/EXPERIMENT-20261013-case12-lower-energy.md",
    "science/numerical_relativity/RESULTS-20261013-case12-full-symbol.md",
)
FALSE_FLAGS = (
    "physical_gate", "live_admission", "scientificPayloadWriteback", "full_scientific_matrix_executed",
    "new_scientific_evolution", "nonlinear_subsidiary_system_validated", "uniform_strong_hyperbolicity_validated",
    "nonlinear_stability_validated", "constraint_convergence_validated", "physical_boundary_validated",
    "general_profile_qualified", "common_symmetrizer_validated", "gpu_executed", "historical_results_regraded",
    "acceptance_inputs_substituted", "zero_frequency_full43_inverse_exists", "hermite_projectors_recomputed",
    "constraint_damping_proved", "unweighted_l2_wellposedness_proved", "independent_external_review",
)


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def frozen_input_bytes(path, digest, budget, target, input_hashes):
    """Hash, archive and return ONE immutable read; do not reopen to parse it."""
    G.require(target not in input_hashes, "distinct frozen input target required")
    payload = path.read_bytes()
    G.require(hashlib.sha256(payload).hexdigest() == digest, "frozen input payload drift")
    budget.save("inputs/" + target, payload)
    input_hashes[target] = digest
    return payload


def helpers():
    path = ROOT / "scripts/run-nr-k3-case12-full-symbol.py"
    G.require(G.sha(path) == HELPER_SHA, "frozen parent infrastructure changed")
    spec = importlib.util.spec_from_file_location("nr_full_symbol_history_only", path)
    parent = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(parent)
    modules = parent.helpers()
    return parent, modules, modules[-1]


def sources(budget):
    G.require(G.sha(PARENT / "qualification-gate.json") == GATE_SHA
              and G.sha(PARENT / "worker-result.json") == WORKER_SHA, "full-symbol parent drift")
    gate, worker = G.read_terminal(PARENT / "qualification-gate.json"), read(PARENT / "worker-result.json")
    G.require(gate["passed"] is worker["passed"] is worker["case12_full_linear_symbol_checked"] is True
              and worker["original_threshold"] == TOLERANCE
              and worker["physical_gate"] is worker["live_admission"] is worker["scientificPayloadWriteback"] is False,
              "accepted local full-symbol parent required")
    table = worker["source_before"]
    G.require(len(table) == 544 and table == worker["source_after"] and not set(table).intersection(EXTRA),
              "544 frozen sources plus additive files required")
    for i, (name, digest) in enumerate(table.items()):
        if i % 32 == 0:
            budget.guard()
        G.require(G.sha(G.contained(ROOT, name)) == G.sha(G.contained(PARENT / "source-snapshot", name)) == digest,
                  "frozen source drift: " + name)
    return dict(table, **{name: G.sha(G.contained(ROOT, name)) for name in EXTRA})


def ancestors(modules, budget):
    parent, chain, old = modules
    result = parent.ancestors(chain, budget)
    current = old.inventory(PARENT, budget)
    G.require(len(current) == 652 and {k: v for k, v in current.items() if k != "qualification-gate.json"}
              == G.read_terminal(PARENT / "qualification-gate.json")["artifact_hashes"], "full parent artifact set drift")
    result[PARENT.name] = current
    G.require(sum(map(len, result.values())) == 4117, "seven immutable historical directories required")
    return result


def worker(directory):
    token = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(token["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID") and token["passed"] is False,
              "owned worker required")
    G.require(directory.parent == G.EVIDENCE and directory.is_dir(), "prepared evidence child required")
    G.require(all(os.environ.get(k) == "1" for k in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")),
              "single-thread controls required")
    budget, started = G.Budget(directory), time.monotonic()
    result = dict(schema=METHOD, passed=False, completed=False, phase="intake", errors=[], stages=[],
                  case_indices=[12], frequencies=list(map(float, FREQUENCIES)), integration_steps=0, native_calls=0,
                  retries=0, original_threshold=TOLERANCE, source_before={}, source_after={},
                  case12_lower_energy_checked=False, parent_gate_sha256=GATE_SHA, parent_worker_sha256=WORKER_SHA,
                  resource_caps=dict(seconds=600, output_bytes=G.CAP, headroom=G.HEADROOM,
                                     source_snapshot_bytes=8 * 1024**2, c_reserve=G.C_RESERVE, e_reserve=G.E_RESERVE),
                  **{name: False for name in FALSE_FLAGS})
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
        old = modules[-1]
        table, ancestry = sources(budget), ancestors(modules, budget)
        result["source_before"] = table
        budget.record("ancestry-before.json", ancestry)
        result["snapshot_bytes"] = old.save_snapshot(budget, table)
        stage("intake-verified", sources=len(table), ancestor_files=sum(map(len, ancestry.values())))

        import numpy as np
        from scripts import nr_constraint_exact_coefficients as R
        from scripts import nr_constraint_full_symbol as A
        from scripts import nr_constraint_laurent_energy as E
        from scripts import nr_profile_exact_coefficients as Q
        from science.numerical_relativity import constraint_symbol_bridge as B
        from science.numerical_relativity import longitudinal_constraint_reduction as L

        G.require(B.TOLERANCE == L.TOLERANCE == TOLERANCE, "original threshold drift")
        result["environment"] = dict(python=sys.version, numpy=np.__version__, threads=1)
        stage("unit-controls-start")
        command = [sys.executable, "-B", "-m", "pytest", "-q", "--noconftest", "-p", "no:cacheprovider",
                   "-c", str(ROOT / "science/numerical_relativity/pytest-case12-lower-energy.ini"),
                   "--junitxml=" + str(directory / "unit-controls.xml"),
                   str(ROOT / "science/numerical_relativity/test_constraint_laurent_energy.py")]
        completed = subprocess.run(command, cwd=ROOT, env=dict(os.environ, PYTEST_ADDOPTS=""), check=False)
        budget.guard()
        G.require(completed.returncode == 0, "unit failure; no retry")
        suites = list(ET.parse(directory / "unit-controls.xml").getroot().iter("testsuite"))
        counts = {key: sum(int(s.get(key, "0")) for s in suites) for key in ("tests", "failures", "errors", "skipped")}
        G.require(counts == dict(tests=26, failures=0, errors=0, skipped=0), "26 registered controls required")
        result["unit_controls"] = counts
        stage("unit-controls-complete", **counts)

        input_hashes = {}

        def frozen(ancestor, name, target):
            path = G.contained(ancestor, name)
            digest = ancestry[ancestor.name][name]
            return frozen_input_bytes(path, digest, budget, target, input_hashes)

        def array(ancestor, name, target, shape):
            value = np.load(io.BytesIO(frozen(ancestor, name, target)), allow_pickle=False)
            G.require(value.dtype == np.float64 and value.shape == shape and np.isfinite(value).all(), "finite binary64 input required")
            value.setflags(write=False)
            return value

        def exact(ancestor, name, target):
            return E.decode(json.loads(frozen(ancestor, name, target).decode("utf-8")))

        def npy(name, value):
            stream = io.BytesIO()
            np.save(stream, value, allow_pickle=False)
            budget.save(name, stream.getvalue())

        cell = array(PARENT, "inputs/case-12-cell.npy", "cell.npy", (58,))
        normal = array(PARENT, "inputs/case-12-normal.npy", "normal.npy", (3,))
        saved = {name: array(HERMITE, f"v3-case-12-{name}.npy", name + ".npy", shape)
                 for name, shape in (("energy", (43, 43)), ("projectors", (13, 43, 43)),
                                     ("principal", (43, 43)), ("ode", (43, 43)))}
        b = Q.case12()
        passport = json.loads(frozen(PARENT, "exact-design-passport.json", "design-passport.json").decode("utf-8"))
        G.require(b.passport() == passport, "unchanged exact profile required")
        budget.record("exact-design-passport.json", b.passport())
        physical = {i: exact(PARENT, f"physical43-coefficient-{i}.json", f"physical-{i}.json") for i in range(3)}
        subsidiary = {i: exact(PARENT, f"subsidiary43-coefficient-{i}.json", f"subsidiary-{i}.json") for i in range(3)}
        source = exact(PARENT, "source58-rational.json", "source.json")
        main = exact(HERMITE, "principal-rational-ray-source.json", "main.json")
        budget.record("input-hashes.json", input_hashes)
        G.require(np.array_equal(source, A.source(b, guard=budget.guard))
                  and np.array_equal(main, Q.matrix(b, guard=budget.guard))
                  and all(np.array_equal(a, c) for a, c in zip(physical.values(), A.physical_coefficients(b, guard=budget.guard), strict=True)),
                  "frozen exact equations differ from their independent source")

        check_rows = []

        def sink(prefix):
            def write(name, values):
                nonzero = 0
                for power, matrix in values.items():
                    encoded = Q.encode(matrix)
                    nonzero += len(encoded["entries"])
                    budget.record(f"{prefix}/{name}/power-{power}.json", encoded)
                check_rows.append(dict(prefix=prefix, name=name, powers=sorted(values), nonzero_entries=nonzero))
            return write

        checked = sink("exact")
        stage("exact-full-reduction-start")
        E.identity("full-polynomial-intertwining", E.product(physical, {0: source, 1: main}, guard=budget.guard),
                   E.product(subsidiary, physical, guard=budget.guard), sink=checked)
        reduced = E.reduction(b, physical, subsidiary, main, guard=budget.guard, sink=checked)
        for name in ("forward", "inverse", "rows", "symbol"):
            sink("candidate")("reduction-" + name, reduced[name])
        budget.record("candidate/principal.json", Q.encode(reduced["principal"]))
        budget.record("candidate/leading.json", Q.encode(reduced["leading"]))
        budget.record("candidate/principal-section.json", dict(matrix=Q.encode(reduced["section"]), pivots=reduced["pivots"]))
        result["exact_reduction_checked"] = True
        stage("exact-full-reduction-complete", nonzero_powers=[p for p, a in reduced["symbol"].items() if np.any(a)])

        stage("exact-rational-energy-start")
        intrinsic, ode = R.intrinsic(reduced["principal"], b), R.ode_projector(b)
        diagonal = tuple(F(1, 1) / b.ray_squared if i in R.SCALED_ROWS else F(1) for i in range(43))
        squared = tuple(b.ray_squared * s for s in b.squared_speeds())
        energy = E.paired_energy(intrinsic, ode, squared, diagonal, guard=budget.guard, sink=checked)
        E.identity("full-principal-symmetrization", {0: R.product(energy["energy"], reduced["principal"], guard=budget.guard)},
                   {0: R.product(reduced["principal"].T, energy["energy"], guard=budget.guard)}, sink=checked)
        ranks = [sum(matrix[i, i] for i in range(43)) for matrix in (ode, energy["zero"], *energy["pairs"])]
        G.require(ranks == [11, 12, 8, 4, 8, 0, 0, 0] and energy["denominator"] == 14
                  and energy["lower_scalar"] == F(1, 84), "registered exact ranks and original normalized energy floor required")
        for name in ("energy", "metric", "zero", "coercivity"):
            budget.record("candidate/" + name + ".json", Q.encode(energy[name]))
        for i, (pair, action) in enumerate(zip(energy["pairs"], energy["actions"], strict=True)):
            budget.record(f"candidate/pair-{i}.json", Q.encode(pair))
            budget.record(f"candidate/action-{i}.json", Q.encode(action))
        result["exact_energy_checked"] = True
        result["exact_ranks"] = list(map(int, ranks))
        stage("exact-rational-energy-complete", ranks=result["exact_ranks"])

        zero = A.zero_frequency(tuple(physical.values()), tuple(subsidiary.values()), source, guard=budget.guard)
        G.require(zero["rank"] == 39 and zero["full43_right_inverse_exists"] is False, "zero physical39 only")
        for name in ("reduced_map", "reduced_operator", "section", "residual"):
            budget.record("zero-frequency/" + name + ".json", Q.encode(zero[name]))
        bounds = E.growth_bounds(subsidiary, reduced["symbol"], energy["energy"], energy["lower_scalar"], b)
        bound_record = {k: {str(p): str(x) for p, x in v.items()} if isinstance(v, dict) else str(v) for k, v in bounds.items()}
        budget.record("growth-bounds.json", dict(exact=bound_record, fixed_ray_only=True, weighted_norm=True,
                      damping_proved=False, zero_reachable_rank=39, all_frequency_support="exact algebra plus analytic norm bounds; not sampled fitting"))
        result["growth_bounds"] = bound_record
        result["zero_frequency_reachable_rank"] = 39
        result["fixed_ray_growth_bound_checked"] = True

        comparisons, mutations = {}, []

        def compare(name, actual, high, low, *, perturb=True):
            report = Q.compare(actual, high)
            equal = bool(np.array_equal(np.asarray(high, dtype=float), np.asarray(low, dtype=float)))
            report["precision50_70_rounded_equal"] = equal
            budget.record("comparisons/" + name + ".json", report)
            comparisons[name] = {k: v for k, v in report.items() if k != "witnesses"}
            G.require(equal and report["relative"] <= TOLERANCE, "unchanged-threshold coefficient mismatch: " + name)
            if perturb:
                changed = actual.copy()
                changed[0, 0] += 1e-6
                difference = Q.compare(changed, high)
                G.require(difference["relative"] > TOLERANCE, "coefficient mutation not rejected: " + name)
                mutations.append(dict(name=name, added=1e-6, coordinate=[0, 0], relative=difference["relative"], rejected=True))

        stage("saved-energy-and-projector-comparisons")
        candidates = [("energy", saved["energy"], energy["energy"], "energy"),
                      ("zero", saved["projectors"][6], energy["zero"], "operator"),
                      ("ode", saved["ode"], ode, "operator")]
        for i, pair in enumerate(energy["pairs"]):
            candidates.append((f"pair-{i}", saved["projectors"][7 + i] + saved["projectors"][5 - i], pair, "operator"))
        for name, actual, ideal, kind in candidates:
            compare(name, actual, E.normal_coordinates(ideal, b, kind=kind, precision=70),
                    E.normal_coordinates(ideal, b, kind=kind, precision=50))
        compare("principal", saved["principal"], R.normalized(reduced["principal"], b, kind="principal", precision=70),
                R.normalized(reduced["principal"], b, kind="principal", precision=50))

        stage("registered-frequency-comparisons")
        point_reports = []
        for index, rho in enumerate(FREQUENCIES):
            actual_b = B.linear_symbol(cell, float(rho) * normal)
            actuals = [("physical-symbol", actual_b, subsidiary)]
            if rho >= F(1, 2):
                # Independent floating pointwise formula; not evaluation of E's coefficients.
                parallel, transverse = L.projectors(normal)
                s, r = np.sqrt(6.), 6.
                z = 1j * float(rho) / s
                w, wi = transverse + parallel / z, transverse + z * parallel
                w[:4, :4], wi[:4, :4] = np.eye(4) / z, z * np.eye(4)
                w[4:8, 4:8] = wi[4:8, 4:8] = np.eye(4)
                w[42, 42] = wi[42, 42] = 1
                w[41], wi[41] = s * L.trace_row(cell, normal), -s * L.trace_row(cell, normal) / r
                w[41, 41], wi[41, 41] = r * z, 1 / (r * z)
                u, ui = B.transformation(cell, float(rho) * normal)
                t, ti = w @ u, ui @ wi
                actuals.extend((("forward", t, reduced["forward"]), ("inverse", ti, reduced["inverse"]),
                                ("reduced", t @ actual_b @ ti, reduced["symbol"]),
                                ("rows", t @ B.physical_rows(cell, float(rho) * normal), reduced["rows"])))
            for name, actual, ideal in actuals:
                npy(f"frequency-{index}-{name}.npy", actual)
                high, low = E.evaluate(ideal, b, rho, precision=70), E.evaluate(ideal, b, rho, precision=50)
                for part, observed, hi, lo in zip(("real", "imag"), (actual.real, actual.imag), high, low, strict=True):
                    compare(f"frequency-{index}-{name}-{part}", observed, hi, lo, perturb=part == "real")
            point_reports.append(dict(rho=float(rho), laurent_evaluated=bool(rho >= F(1, 2)), arrays=len(actuals)))
        result["comparisons"], result["coefficient_mutations"] = comparisons, mutations
        result["frequency_reports"] = point_reports
        G.require(len(comparisons) == 66 and len(mutations) == 38, "registered comparison and mutation coverage required")
        budget.record("coefficient-mutations.json", mutations)
        result["actual_inputs_compared"] = True

        stage("end-to-end-exact-perturbations")
        negative = []

        def reject(name, operation):
            try:
                operation()
            except E.ExactIdentityError as error:
                nonzero = sum(np.count_nonzero(a) for a in error.residual.values())
                G.require(nonzero > 0, "negative control must expose a nonzero exact relation")
                sink("negative/" + name)(error.name, error.residual)
                negative.append(dict(name=name, rejected=True, failure_identity=error.name, nonzero_entries=int(nonzero)))
            else:
                raise ValueError("end-to-end exact mutation accepted: " + name)

        changed_b = {p: a.copy() for p, a in subsidiary.items()}
        changed_b[0][4, 4] += F(1, 1000000)
        budget.record("negative/source-mutated.json", Q.encode(changed_b[0]))
        reject("source", lambda: E.identity("full-polynomial-intertwining", E.product(changed_b, physical, guard=budget.guard),
               E.product(physical, {0: source, 1: main}, guard=budget.guard)))
        changed_k = intrinsic.copy()
        changed_k[4, 4] += F(1, 1000000)
        budget.record("negative/principal-mutated.json", Q.encode(changed_k))
        reject("principal", lambda: E.paired_energy(changed_k, ode, squared, diagonal, guard=budget.guard,
                                                    sink=sink("negative/principal-construction")))
        changed_h = energy["energy"].copy()
        changed_h[4, 4] += F(1, 1000000)
        budget.record("negative/energy-mutated.json", Q.encode(changed_h))
        reject("energy", lambda: E.identity("symmetrization", {0: R.product(changed_h, intrinsic, guard=budget.guard)},
                                             {0: R.product(intrinsic.T, changed_h, guard=budget.guard)}))
        budget.record("end-to-end-perturbations.json", negative)
        result["end_to_end_mutations"] = negative

        stage("deterministic-replay")
        replay_reduction = E.reduction(b, physical, subsidiary, main, guard=budget.guard, sink=sink("replay"))
        replay_energy = E.paired_energy(R.intrinsic(replay_reduction["principal"], b), ode, squared, diagonal,
                                        guard=budget.guard, sink=sink("replay"))
        G.require(all(set(reduced[name]) == set(replay_reduction[name]) and all(
            np.array_equal(a, replay_reduction[name][p]) for p, a in reduced[name].items())
            for name in ("forward", "inverse", "rows", "symbol")), "complete Laurent replay required")
        G.require(all(np.array_equal(energy[name], replay_energy[name]) for name in ("energy", "metric", "zero", "coercivity"))
                  and all(np.array_equal(a, c) for a, c in zip(energy["pairs"], replay_energy["pairs"], strict=True))
                  and bounds == E.growth_bounds(subsidiary, replay_reduction["symbol"], replay_energy["energy"], replay_energy["lower_scalar"], b),
                  "exact energy and bound replay required")
        budget.record("exact-checks.json", check_rows)
        result["exact_replay"] = True

        stage("final-integrity")
        G.require(old.inventory(directory / "inputs", budget) == input_hashes and sources(budget) == table, "input/source drift")
        for i, (name, digest) in enumerate(table.items()):
            if i % 32 == 0:
                budget.guard()
            G.require(G.sha(G.contained(directory / "source-snapshot", name)) == digest, "snapshot drift")
        after = ancestors(modules, budget)
        budget.record("ancestry-after.json", after)
        G.require(after == ancestry, "history drift")
        result.update(source_after=table, old_artifacts_unchanged=True, original_inputs_unchanged=True,
                      passed=True, completed=True, case12_lower_energy_checked=True)
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(passed=False, completed=False, case12_lower_energy_checked=False)
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(json.dumps({key: result[key] for key in ("passed", "case12_lower_energy_checked", "phase", "seconds", "errors")}), flush=True)
    return 0 if result["passed"] else 1


def finalizer(directory, budget):
    result = read(directory / "worker-result.json")
    G.require(result["schema"] == METHOD and result["passed"] is result["completed"] is result["case12_lower_energy_checked"] is True
              and not result["errors"], "completed local energy controls required")
    G.require(all(result[key] is False for key in FALSE_FLAGS), "no global qualification or silent input repair")
    G.require(result["case_indices"] == [12] and result["frequencies"] == list(map(float, FREQUENCIES))
              and result["native_calls"] == result["integration_steps"] == result["retries"] == 0
              and result["original_threshold"] == TOLERANCE, "case12 bounded scope only")
    G.require(result["unit_controls"] == dict(tests=26, failures=0, errors=0, skipped=0), "26 controls required")
    G.require(all(result[name] is True for name in ("exact_reduction_checked", "exact_energy_checked", "fixed_ray_growth_bound_checked",
              "actual_inputs_compared", "exact_replay", "old_artifacts_unchanged", "original_inputs_unchanged")), "missing local gates")
    G.require(result["zero_frequency_reachable_rank"] == 39 and result["exact_ranks"] == [11, 12, 8, 4, 8, 0, 0, 0], "rank inflation")
    G.require(len(result["comparisons"]) == 66 and all(v["relative"] <= TOLERANCE and v["precision50_70_rounded_equal"]
              and not v["coefficient_fitting"] and not v["input_substituted"] for v in result["comparisons"].values()), "comparisons incomplete")
    G.require(len(result["coefficient_mutations"]) == 38 and all(v["rejected"] for v in result["coefficient_mutations"])
              and [v["name"] for v in result["end_to_end_mutations"]] == ["source", "principal", "energy"]
              and all(v["rejected"] and v["nonzero_entries"] > 0 for v in result["end_to_end_mutations"]), "mutation controls incomplete")
    G.require(result["growth_bounds"] == read(directory / "growth-bounds.json")["exact"]
              and result["growth_bounds"]["cutoff"] == "1/2" and result["growth_bounds"]["energy_lower"] == "1/84", "bound contract drift")
    table = sources(budget)
    G.require(len(table) == 544 + len(EXTRA) and table == result["source_before"] == result["source_after"], "source identity drift")
    for i, (name, digest) in enumerate(table.items()):
        if i % 32 == 0:
            budget.guard()
        G.require(G.sha(G.contained(directory / "source-snapshot", name)) == digest, "final snapshot drift")
    modules = helpers()
    G.require(read(directory / "ancestry-before.json") == read(directory / "ancestry-after.json") == ancestors(modules, budget), "history drift")
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
