"""One owned fixed-case12 full58 polynomial spectral candidate; no retries."""
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
import nr_owned_control as G
import nr_single_scan_control as C
import nr_polynomial_certificate_replay as V
import nr_integer_polynomial_replay as R

METHOD = "nr-case12-full58-spectral-controls-v1"
HELPER = "scripts/run-nr-k3-case12-polynomial-energy-v2.py"
HELPER_SHA = "e6fea2b590941bceb4a15e7ebf7af83288cde7d44eb505f59f9e5020e74c0600"
LEDGER = G.EVIDENCE / "nr-k3-case12-polynomial-energy-controls-v2-20261014"
LEDGER_GATE = "df247bc18a9366efa076382ad0ecf350e807277dd0fb6d59296a45a68ec07ee1"
LEDGER_WORKER = "69fde64c207c93010fa6d0e1818fe29847e15521810d7ac83b8acc1b9bb3ebbd"
PARENT = G.EVIDENCE / "nr-k3-case12-polynomial-closure-controls-v1-20261014"
PARENT_GATE = "3ac920ab18b8e647dbe85c5abec09319c9251ce7841c3da4873530041e12bcb1"
PARENT_WORKER = "c063637c0ac86336611dc08303d7b027de2cc0ea3fa37f8050b71981a192fca2"
PARENT_INPUTS = {
    "K.json": "e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283",
    "parent-inputs/domain.json": "a516ebf08161d8e333b336d2530610bd2a316f88b79e7fb437989867a0f88149",
    "parent-inputs/denominators.json": "2c0e61d17a87d2757f92375efe24ad978fb5899da27d3072645934b27529a31a",
    "source_bridge.json": "9f465ee64e0e34f19a8ffc50a158ef94beee28c137c513d695f8044d8b89eb02",
    "stats.json": "1d3455ed70c1810d262dfbc1906256845d1943cc66dc784938021ba90f7502c0",
    "independent-replay.json": "1dbb0840dda60ca0c7e9958807998031325421e60623ab1f66407d2fe625bde9",
}
EXTRA = (
    "scripts/nr_case12_full58_spectral.py",
    "scripts/tests/test_nr_case12_full58_spectral.py",
    "scripts/run-nr-k3-case12-full58-spectral.py",
    "science/numerical_relativity/DERIVATION-20261014-case12-full58-spectral.md",
    "science/numerical_relativity/EXPERIMENT-20261014-case12-full58-spectral.md",
    "science/numerical_relativity/RESULTS-20261014-case12-polynomial-energy-v2.md",
    "science/numerical_relativity/NOTE-20261014-case12-full58-spectral-next.md",
)
TEST_FILES = (EXTRA[1], "scripts/tests/test_nr_integer_polynomial_replay.py")
TEST_REGISTRATION = ((24, 65), (21, 73))
CONSTANTS = tuple(F(n, d) for n, d in (
    (2601, 100000), (2601, 50000), (2601, 5000),
    (153, 125), (459, 250), (306, 125),
))
MATRIX_CAPS = dict(Pi=0, K0=1, shift_residual=1, embedding_residual=1, Q=2,
                   **{f"Z{j}": 2 * j + 1 for j in range(1, 7)})
NEGATIVE_CAPS = dict(delta_Z6=13, mutant_Z6=13)
METADATA = ("source_bridge", "parent_provenance", "stats", "acceptance", "scalars",
            "nilpotent", "mutation")
ACCEPTANCE_KEYS = {"shift_identity", "embedding_identity", "annihilator_zero",
                   "nilpotent_detected", "mutation_rejected", "accepted"}
PRINCIPAL_SCOPE = "fixed-case12 full58 principal rational direction extension; geometric=False"
FALSE_FLAGS = (
    "physical_gate", "live_admission", "scientificPayloadWriteback",
    "direction_uniform_energy_validated", "uniform_strong_hyperbolicity_validated",
    "full58_principal_energy_validated", "nonlinear_stability_validated",
    "physical_boundary_validated", "constraint_convergence_validated",
    "constraint_damping_proved", "zero_frequency_full43_inverse_exists",
    "full_python_semantics_proved", "independent_external_review",
    "full_scientific_matrix_executed", "new_scientific_evolution", "gpu_executed",
    "historical_results_regraded", "eight_ray_rerun",
)


def read(path):
    return json.loads(Path(path).read_bytes())


def helper():
    G.require(G.sha(ROOT / HELPER) == HELPER_SHA, "frozen integer energy helper")
    spec = importlib.util.spec_from_file_location("nr_full58_frozen_helper", ROOT / HELPER)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def qualified(directory, gate_sha, worker_sha):
    G.require(G.sha(directory / "qualification-gate.json") == gate_sha
              and G.sha(directory / "worker-result.json") == worker_sha,
              "unchanged qualified ancestor identity")
    gate = G.read_terminal(directory / "qualification-gate.json")
    G.require(gate["passed"] is gate["completed"] is True and not gate["errors"]
              and gate["supervisor"]["cleanup_verified"] is True,
              "complete cleaned ancestor required")
    return gate


def parent_gate():
    gate = qualified(PARENT, PARENT_GATE, PARENT_WORKER)
    G.require(all(gate["artifact_hashes"][name] == digest
                  for name, digest in PARENT_INPUTS.items()), "registered six parent files")
    return gate


def sources(budget):
    qualified(LEDGER, LEDGER_GATE, LEDGER_WORKER)
    table = helper().sources(budget)
    G.require(len(table) == 623 and table == G.inventory(LEDGER / "source-snapshot", "", budget),
              "all 623 prior sources remain unchanged")
    G.require(not set(table).intersection(EXTRA), "additive seven full58 sources")
    table.update({name: G.sha(G.contained(ROOT, name)) for name in EXTRA})
    G.require(len(table) == 630, "630 source closure")
    return table


def history(budget):
    gate = qualified(LEDGER, LEDGER_GATE, LEDGER_WORKER)
    table = helper().history(budget)
    observed = G.inventory(LEDGER, "", budget)
    expected = dict(gate["artifact_hashes"], **{"qualification-gate.json": LEDGER_GATE})
    G.require(observed == expected and len(observed) == 733, "complete energy-v2 ledger")
    table[LEDGER.name] = observed
    G.require(len(table) == 20 and sum(map(len, table.values())) == 14144,
              "twenty immutable historical trees")
    return table


def registered_tests():
    tests = {}
    for filename, (functions, instances) in zip(TEST_FILES, TEST_REGISTRATION, strict=True):
        tree = ast.parse((ROOT / filename).read_text(encoding="utf-8"))
        current = {}
        for node in tree.body:
            if not isinstance(node, ast.FunctionDef) or not node.name.startswith("test_"):
                continue
            count = 1
            for item in node.decorator_list:
                G.require(isinstance(item, ast.Call)
                          and ast.unparse(item.func) == "pytest.mark.parametrize"
                          and len(item.args) == 2 and isinstance(item.args[1], (ast.List, ast.Tuple))
                          and not item.keywords, "explicit test parameter registration")
                count *= len(item.args[1].elts)
            G.require(node.name not in current and node.name not in tests and count > 0,
                      "unique test names")
            current[node.name] = count
        G.require(len(current) == functions and sum(current.values()) == instances,
                  "registered full58 control count")
        tests.update(current)
    return tests


def test_evidence(path):
    root = ET.parse(path).getroot()
    cases = list(root.iter("testcase"))
    names = [[row.get("classname"), row.get("name")] for row in cases]
    expected = registered_tests()
    G.require(len(names) == len({tuple(row) for row in names})
              and dict(Counter(row.get("name", "").split("[", 1)[0] for row in cases)) == expected
              and not any(list(root.iter(tag)) for tag in ("error", "failure", "skipped")),
              "all registered controls without errors or skips")
    return dict(tests=len(cases), identities=names, registered=expected,
                failures=0, errors=0, skipped=0)


def controls(budget):
    command = [sys.executable, "-B", "-m", "pytest", "-q", "-s", "--noconftest", "-c",
               str(ROOT / "science/numerical_relativity/pytest-single-scan-controls.ini"),
               "--rootdir", str(ROOT), "--junitxml", str(budget.directory / "unit-controls.xml"),
               *[str(ROOT / name) for name in TEST_FILES]]
    budget.record("unit-command.json", command)
    with (budget.directory / "unit-controls.log").open("xb") as stream:
        child = subprocess.Popen(command, cwd=ROOT, stdout=stream, stderr=subprocess.STDOUT,
                                 creationflags=subprocess.CREATE_NO_WINDOW,
                                 env=dict(os.environ, PYTEST_ADDOPTS="", PYTEST_PLUGINS="",
                                          PYTEST_DISABLE_PLUGIN_AUTOLOAD="1"))
        while child.poll() is None:
            budget.guard()
            time.sleep(0.05)
        budget.guard()
        G.require(child.returncode == 0, "full58 controls failed; no automatic retry")
    result = test_evidence(budget.directory / "unit-controls.xml")
    budget.record("unit-controls.json", result)
    return result


def replay_inputs():
    return ({"parent-inputs/" + name for name in PARENT_INPUTS}
            | {name + ".json" for name in {**MATRIX_CAPS, **NEGATIVE_CAPS}}
            | {name + ".json" for name in METADATA})


def replay(directory, budget, stage):
    H = helper()
    hashes = {}

    def load(name):
        budget.guard()
        raw = G.contained(directory, name).read_bytes()
        hashes[name] = G.hashlib.sha256(raw).hexdigest()
        return json.loads(raw)

    parent = {name: load("parent-inputs/" + name) for name in PARENT_INPUTS}
    G.require(all(hashes["parent-inputs/" + name] == digest
                  for name, digest in PARENT_INPUTS.items()), "independent parent byte binding")
    domain = H.foundation().verify_domain(parent["parent-inputs/domain.json"],
                                         parent["parent-inputs/denominators.json"])
    domain.pop("delta")
    den = parent["parent-inputs/denominators.json"]
    r = V.decode_polynomial(den["r"], max_degree=2)
    g = V.decode_polynomial(den["g"], max_degree=2)
    b = {(1, 0, 0): F(3, 100), (0, 1, 0): F(-1, 25), (0, 0, 1): F(1, 20)}
    one, minus = {(0, 0, 0): F(1)}, {(0, 0, 0): F(-1)}
    G.require(len(CONSTANTS) == len(set(CONSTANTS)) == 6 and all(c > 0 for c in CONSTANTS),
              "six positive distinct exact branches")
    K = V.decode_matrix(parent["K.json"], shape=(58, 58), max_degree=1)
    G.require(all(sum(p) == 1 for row in K for cell in row for p in cell)
              and all(not K[i][j] for i in range(58) for j in range(58) if i < 11 or j < 11),
              "full58 homogeneous parent and both ODE block sides")
    G.require(H.matrix_stats(K, 1) == parent["stats.json"]["K"], "parent K full statistics")
    stored = {name: V.decode_matrix(load(name + ".json"), shape=(58, 58), max_degree=cap)
              for name, cap in {**MATRIX_CAPS, **NEGATIVE_CAPS}.items()}
    stats = load("stats.json")
    G.require(set(stats) == set(MATRIX_CAPS), "all eleven matrix statistics")
    for name, cap in {**MATRIX_CAPS, **NEGATIVE_CAPS}.items():
        G.require(all(sum(p) == cap for row in stored[name] for cell in row for p in cell),
                  "exact registered homogeneous degree: " + name)
        if name in MATRIX_CAPS:
            G.require(stats[name] == H.matrix_stats(stored[name], cap), "matrix stats: " + name)
    scalars = load("scalars.json")
    speeds = [{p: c * value for p, value in g.items()} for c in CONSTANTS]
    G.require(scalars == dict(r=V.encode_polynomial(r), g=V.encode_polynomial(g),
                             b=V.encode_polynomial(b),
                             squared_speeds=[V.encode_polynomial(s) for s in speeds]),
              "unnormalized squared speeds with no extra r squared")
    import nr_case12_full58_spectral as P
    G.require(load("source_bridge.json") == P.source_bridge_manifest()
              and load("parent_provenance.json") == P.parent_provenance_manifest(PARENT),
              "independent source AST and parent manifest binding")

    def multiply(a, bb):
        return H.independent_product(a, bb, guard=budget.guard, check=budget._check_deadline)

    def combine(terms):
        return H.combination(terms, budget)

    def save_check(name, value):
        G.require(value == stored[name], "independent full58 stage differs: " + name)
        stage("replay-" + name, terms=V.coefficient_count(value))
        return value

    pi = [[dict(one) if i == j and i >= 11 else {} for j in range(58)] for i in range(58)]
    save_check("Pi", pi)
    k0 = save_check("K0", combine(((one, K), ({p: -v for p, v in b.items()}, pi))))
    shift = save_check("shift_residual", combine(((one, K), (minus, k0),
                                                 ({p: -v for p, v in b.items()}, pi))))
    embed = save_check("embedding_residual", combine(((one, k0),
                                                      (minus, multiply(multiply(pi, k0), pi)))))
    q = save_check("Q", multiply(k0, k0))
    z = k0
    for j, speed in enumerate(speeds, 1):
        z = save_check(f"Z{j}", combine(((one, multiply(z, q)),
                                          ({p: -v for p, v in speed.items()}, z))))
    zero = lambda matrix: not any(cell for row in matrix for cell in row)

    n = [[{}, {(1, 0, 0): F(1)}], [{}, {}]]
    nq, nz = multiply(n, n), n
    nstages = {}
    for j, speed in enumerate(speeds, 1):
        nz = combine(((one, multiply(nz, nq)), ({p: -v for p, v in speed.items()}, nz)))
        nstages[f"Z{j}"] = V.encode_matrix(nz)
    scale = one
    for speed in speeds:
        scale = R.multiply_polynomials(scale, speed, check=budget._check_deadline)
    expected_n = [[{}, R.multiply_polynomials(scale, n[0][1], check=budget._check_deadline)], [{}, {}]]
    nilpotent = dict(schema="nr-case12-full58-spectral-nilpotent-v1",
                     constants=[str(c) for c in CONSTANTS], N=V.encode_matrix(n),
                     Q=V.encode_matrix(nq), stages=nstages,
                     expected_Z6=V.encode_matrix(expected_n),
                     nonzero_slots=sum(bool(cell) for row in nz for cell in row),
                     coefficients=V.coefficient_count(nz), square_zero=zero(nq),
                     expected_identity=nz == expected_n, zero_mode_rejected=not zero(nz))
    G.require(nilpotent == load("nilpotent.json"), "complete independent zero-Jordan witness")
    delta = [[{} for _ in range(58)] for _ in range(58)]
    delta[11][11] = {(13, 0, 0): F(1)}
    save_check("delta_Z6", delta)
    mutant = save_check("mutant_Z6", combine(((one, z), (one, delta))))
    mutation = dict(schema="nr-case12-full58-spectral-mutation-v1",
                    name="add-x13-to-Z6-11-11", entry=[11, 11],
                    nonzero_slots=sum(bool(cell) for row in mutant for cell in row),
                    coefficients=V.coefficient_count(mutant), rejected=not zero(mutant))
    G.require(mutation == load("mutation.json"), "actual Z6 certificate mutation witness")
    acceptance = dict(shift_identity=zero(shift), embedding_identity=zero(embed),
                      annihilator_zero=zero(z),
                      nilpotent_detected=nilpotent["square_zero"] and nilpotent["expected_identity"]
                      and nilpotent["zero_mode_rejected"], mutation_rejected=mutation["rejected"])
    acceptance["accepted"] = all(acceptance.values())
    G.require(acceptance == load("acceptance.json") and set(hashes) == replay_inputs(),
              "complete independent decisions and input manifest")
    return dict(schema="nr-case12-independent-full58-spectral-v1", passed=acceptance["accepted"],
                acceptance=acceptance, matrix_slots=37004, residual_slots=10092,
                annihilator_slots=3364, negative_matrix_slots=6728, fixed_domain=domain,
                nilpotent_nonzero_slots=nilpotent["nonzero_slots"],
                nilpotent_coefficients=nilpotent["coefficients"],
                mutation_nonzero_slots=mutation["nonzero_slots"],
                mutation_coefficients=mutation["coefficients"],
                parent_gate_sha256=PARENT_GATE, ledger_gate_sha256=LEDGER_GATE,
                input_hashes=hashes, independent_dimension=58,
                arithmetic_source=dict(path="scripts/nr_integer_polynomial_replay.py",
                                       sha256=G.sha(ROOT / "scripts/nr_integer_polynomial_replay.py")),
                library="stdlib exact integer convolution; direct full58 reconstruction")


def worker(directory):
    prepared = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(directory.parent == G.EVIDENCE and prepared["passed"] is False
              and prepared["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID"),
              "owned worker required")
    G.require(all(os.environ.get(name) == "1" for name in
                  ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")),
              "single numerical thread")
    budget, started = C.SingleScanBudget(directory), time.monotonic()
    result = dict(schema=METHOD, passed=False, completed=False, errors=[], stages=[], phase="intake",
                  case_indices=[12], principal_scope=PRINCIPAL_SCOPE,
                  full58_principal_spectral_validated=False, pointwise_real_semisimplicity_validated=False,
                  parent_gate_sha256=PARENT_GATE, ledger_gate_sha256=LEDGER_GATE,
                  integration_steps=0, native_calls=0, retries=0, original_threshold=2e-12,
                  coefficient_acceptance="exact-zero-only", **{name: False for name in FALSE_FLAGS})
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
        result["snapshot_bytes"] = helper().foundation().snapshot(budget, table)
        parent_gate()
        for name, digest in PARENT_INPUTS.items():
            raw = (PARENT / name).read_bytes()
            G.require(G.hashlib.sha256(raw).hexdigest() == digest, "parent input identity")
            budget.save("parent-inputs/" + name, raw)
        stage("intake-complete", sources=len(table), historical_files=sum(map(len, before.values())))
        result["unit_controls"] = controls(budget)
        stage("unit-controls-complete", tests=result["unit_controls"]["tests"])
        import nr_case12_full58_spectral as P
        import nr_case12_polynomial_section as S

        def sink(name, matrix):
            G.require(name in {**MATRIX_CAPS, **NEGATIVE_CAPS}, "registered full58 matrix")
            record = S.encode_matrix(matrix, guard=budget.guard)
            budget.record(name + ".json", record)
            raw = json.dumps(record, separators=(",", ":"), ensure_ascii=False).encode()
            stage("matrix-" + name + "-saved", bytes=len(raw),
                  terms=sum(len(row[2]) for row in record["entries"]),
                  degree_max=max((sum(term[:3]) for row in record["entries"] for term in row[2]), default=-1),
                  coefficient_decimal_chars=sum(len(t[3]) + len(t[4]) for row in record["entries"] for t in row[2]))

        stage("full58-construction-start")
        certificate = P.build_certificate(PARENT, guard=budget.guard, sink=sink)
        for name in METADATA:
            budget.record(name + ".json", certificate[name])
        stage("complete-candidate-evidence-saved", acceptance=certificate["acceptance"])
        result["replay"] = replay(directory, budget, stage)
        budget.record("independent-replay.json", result["replay"])
        stage("independent-replay-complete", passed=result["replay"]["passed"])
        budget.record("dependencies.json", helper().foundation().dependencies(budget))
        G.require(sources(budget) == table == G.inventory(directory / "source-snapshot", "", budget),
                  "source snapshot drift")
        after = history(budget)
        G.require(before == after, "historical evidence drift")
        budget.record("history-after.json", after)
        result.update(source_after=table, old_artifacts_unchanged=True, computation_completed=True)
        G.require(result["replay"]["passed"] is True, "full58 candidate failed; residuals preserved")
        result.update(passed=True, completed=True, full58_principal_spectral_validated=True,
                      pointwise_real_semisimplicity_validated=True)
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(passed=False, completed=False, full58_principal_spectral_validated=False,
                      pointwise_real_semisimplicity_validated=False)
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(json.dumps({name: result[name] for name in ("passed", "phase", "seconds", "errors")}), flush=True)
    return 0 if result["passed"] else 1


def finalizer(directory, budget):
    """Saved JSON, source AST and hashes only; no new scientific arithmetic."""
    result = read(directory / "worker-result.json")
    G.require(result["schema"] == METHOD and result["passed"] is result["completed"]
              is result["full58_principal_spectral_validated"]
              is result["pointwise_real_semisimplicity_validated"] is True and not result["errors"],
              "complete full58 spectral candidate")
    G.require(all(result[name] is False for name in FALSE_FLAGS)
              and result["case_indices"] == [12] and result["principal_scope"] == PRINCIPAL_SCOPE
              and result["integration_steps"] == result["native_calls"] == result["retries"] == 0
              and result["original_threshold"] == 2e-12
              and result["coefficient_acceptance"] == "exact-zero-only"
              and result["parent_gate_sha256"] == PARENT_GATE
              and result["ledger_gate_sha256"] == LEDGER_GATE, "fixed full58 scope")
    G.require(test_evidence(directory / "unit-controls.xml") == result["unit_controls"]
              == read(directory / "unit-controls.json"), "saved controls")
    report = read(directory / "independent-replay.json")
    G.require(report == result["replay"] and report["passed"] is True
              and report["schema"] == "nr-case12-independent-full58-spectral-v1"
              and report["matrix_slots"] == 37004 and report["residual_slots"] == 10092
              and report["annihilator_slots"] == 3364 and report["negative_matrix_slots"] == 6728
              and report["independent_dimension"] == 58
              and report["parent_gate_sha256"] == PARENT_GATE
              and report["ledger_gate_sha256"] == LEDGER_GATE
              and report["nilpotent_nonzero_slots"] > 0 and report["nilpotent_coefficients"] > 0
              and report["mutation_nonzero_slots"] > 0 and report["mutation_coefficients"] > 0
              and set(report["acceptance"]) == ACCEPTANCE_KEYS
              and all(v is True for v in report["acceptance"].values())
              and report["acceptance"] == read(directory / "acceptance.json")
              and report["arithmetic_source"] == dict(
                  path="scripts/nr_integer_polynomial_replay.py",
                  sha256=G.sha(ROOT / "scripts/nr_integer_polynomial_replay.py"))
              and report["library"]
              == "stdlib exact integer convolution; direct full58 reconstruction"
              and set(report["input_hashes"]) == replay_inputs(), "complete owned replay")
    for name, digest in report["input_hashes"].items():
        budget.guard()
        G.require(G.sha(G.contained(directory, name)) == digest, "replayed bytes changed")
    import nr_case12_full58_spectral as P
    G.require(P.source_bridge_manifest() == read(directory / "source_bridge.json")
              and P.parent_provenance_manifest(PARENT) == read(directory / "parent_provenance.json"),
              "final pure source AST and parent byte binding")
    dependency = read(directory / "dependencies.json")
    G.require(dependency["versions"]["sympy"] == "1.13.3"
              and dependency["versions"]["numpy"] == "2.2.6", "registered runtime")
    for index, (name, digest) in enumerate(dependency["loaded_runtime_file_hashes"].items()):
        if index % 32 == 0:
            budget.guard()
        G.require(G.sha(name) == digest, "runtime source changed")
    table = sources(budget)
    G.require(table == result["source_before"] == result["source_after"]
              == G.inventory(directory / "source-snapshot", "", budget), "final source closure")
    G.require(history(budget) == read(directory / "history-before.json")
              == read(directory / "history-after.json"), "final historical closure")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--guard-worker", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    directory = Path(os.path.abspath(args.output_directory))
    if args.guard_worker:
        return worker(directory)
    G.require(G.sha(ROOT / "scripts/nr_owned_control.py")
              == "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1",
              "frozen supervisor")
    result = G.supervise([sys.executable, "-B", str(Path(__file__).resolve()), "--guard-worker",
                          "--output-directory", str(directory)], directory,
                         finalizer=finalizer, budget_factory=C.SingleScanBudget)
    print(json.dumps({name: result[name] for name in ("passed", "completed", "errors")}), flush=True)
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
