"""One fresh eight-ray case12 batch using the qualified single-scan guard.

The scientific construction and original thresholds are inherited unchanged.
V1 remains a timeout; this is neither a resume nor an all-direction proof.
"""

from __future__ import annotations

import argparse
import ast
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
import nr_single_scan_control as C  # noqa: E402

METHOD = "nr-case12-direction-section-controls-v2"
PARENT = G.EVIDENCE / "nr-k3-case12-lower-energy-controls-v1-20261013"
GATE_SHA = "668ff3638c47d34f5331cbba3aeeb3c207d890236d9e189f0a792fb6c0fa886d"
WORKER_SHA = "01e6642c5f21c91b09880f172615f90c08bfb536d3dfe8bb99b2f2dd699c0bf4"
HELPER_SHA = "e7dcd1ebee57e322450a741b3e0608e945ae3db8ba076ac5eb8d762c4cf2e66e"
GUARD_SHA = "58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1"
TOLERANCE = 2e-12
RAYS = (
    (1, 2, -1),
    (1, 0, 0),
    (0, 1, 0),
    (0, 0, 1),
    (-1, -2, 1),
    (2, 4, -2),
    (1, 1, 1),
    (1, -1, 0),
)
QUALIFIED = G.EVIDENCE / "nr-k3-single-scan-controls-v1-20261014"
QUALIFIED_GATE_SHA = "376eaea8e34fe4b1c9adac48b1e620ae39afc6dadba919df8f65c886ad9c17f2"
QUALIFIED_WORKER_SHA = (
    "f9ca6f5f65e39575f83f5e6225c90a4797f10e7479a4c47f84f548d32d66e9f1"
)
PREVIOUS = G.EVIDENCE / "nr-k3-case12-direction-section-controls-v1-20261013"
PREVIOUS_GATE_SHA = "9e24c46e4aa5c57d1b1e308f5baded04b551ffe13b2b5021e618d5d2d24fce4d"
V1_SOURCE = "scripts/run-nr-k3-case12-direction-section.py"
V1_SOURCE_SHA = "ba961d797d11656c026f6e4412804d8731dcd7a0fcaaa51df055446049d18478"
EXTRA = (
    "scripts/run-nr-k3-case12-direction-section-v2.py",
    "science/numerical_relativity/EXPERIMENT-20261014-case12-direction-section-v2.md",
    "science/numerical_relativity/RESULTS-20261014-single-scan-controls.md",
)
FALSE_FLAGS = (
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
    "full_scientific_matrix_executed",
    "new_scientific_evolution",
    "nonlinear_stability_validated",
    "general_profile_qualified",
    "direction_uniform_energy_validated",
    "uniform_strong_hyperbolicity_validated",
    "all_direction_closure_validated",
    "all_direction_rank_machine_proof",
    "direction_uniform_lower_order_bound_validated",
    "physical_boundary_validated",
    "constraint_convergence_validated",
    "unweighted_l2_wellposedness_proved",
    "constraint_damping_proved",
    "independent_external_review",
    "gpu_executed",
    "historical_results_regraded",
    "acceptance_inputs_substituted",
    "zero_frequency_full43_inverse_exists",
)


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def pinned(path, expected_sha, *, terminal=False):
    raw = path.read_bytes()
    G.require(
        G.hashlib.sha256(raw).hexdigest() == expected_sha,
        "pinned input drift: " + path.name,
    )
    value = json.loads(raw)
    if terminal:
        digest = value.pop("terminal_sha256")
        G.require(
            digest == G.hashlib.sha256(G.encoded(value)).hexdigest(),
            "pinned terminal self-digest",
        )
    return value


def validate_guard_records(gate, worker):
    G.require(
        gate["schema"] == worker["schema"] == "nr-single-scan-controls-v1"
        and all(
            item[key] is True
            for item in (gate, worker)
            for key in (
                "passed",
                "completed",
                "single_scan_qualified",
                "optimization_implemented",
                "old_artifacts_unchanged",
            )
        )
        and not gate["errors"]
        and not worker["errors"],
        "qualified P0 guard required",
    )
    G.require(
        gate["guard_implementation"]
        == worker["guard_implementation"]
        == "nr_single_scan_control.SingleScanBudget"
        and gate["supervisor"]["cleanup_verified"] is True
        and gate["supervisor"]["active_after_cleanup"] == 0,
        "qualified candidate identity and cleanup required",
    )
    G.require(
        all(
            item[key] is False
            for item in (gate, worker)
            for key in (
                "physical_gate",
                "live_admission",
                "scientificPayloadWriteback",
                "eight_ray_rerun",
            )
        ),
        "P0 must remain control-only",
    )
    G.require(
        len(worker["source_before"]) == 570
        and gate["source_before"]
        == gate["source_after"]
        == worker["source_before"]
        == worker["source_after"],
        "570-source qualified guard closure required",
    )


def qualified_guard():
    gate = pinned(
        QUALIFIED / "qualification-gate.json", QUALIFIED_GATE_SHA, terminal=True
    )
    worker = pinned(QUALIFIED / "worker-result.json", QUALIFIED_WORKER_SHA)
    validate_guard_records(gate, worker)
    previous = pinned(
        PREVIOUS / "qualification-gate.json", PREVIOUS_GATE_SHA, terminal=True
    )
    G.require(
        previous["passed"] is previous["completed"] is False
        and previous["errors"] == ["ResourceLimit: registered control deadline reached"]
        and previous["supervisor"]["cleanup_verified"] is True,
        "v1 timeout must remain failed",
    )
    return gate, worker


def helper():
    path = ROOT / "scripts/run-nr-k3-case12-lower-energy.py"
    G.require(G.sha(path) == HELPER_SHA, "immutable energy helper required")
    spec = importlib.util.spec_from_file_location("nr_direction_history_only", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sources(budget):
    gate = pinned(PARENT / "qualification-gate.json", GATE_SHA, terminal=True)
    worker = pinned(PARENT / "worker-result.json", WORKER_SHA)
    G.require(
        gate["passed"]
        is worker["passed"]
        is worker["case12_lower_energy_checked"]
        is True
        and worker["original_threshold"] == TOLERANCE,
        "passed fixed-ray parent required",
    )
    G.require(
        all(
            gate[name] is worker[name] is False
            for name in (
                "physical_gate",
                "live_admission",
                "scientificPayloadWriteback",
            )
        ),
        "shadow-only parent required",
    )
    _, control = qualified_guard()
    table = dict(control["source_before"])
    G.require(
        len(worker["source_before"]) == 551
        and worker["source_before"] == worker["source_after"]
        and all(
            table.get(name) == digest
            for name, digest in worker["source_before"].items()
        ),
        "unchanged scientific-parent subset required",
    )
    G.require(
        table[V1_SOURCE] == V1_SOURCE_SHA
        and table["scripts/nr_owned_control.py"] == GUARD_SHA,
        "frozen v1 and supervisor identity required",
    )
    G.require(not set(table).intersection(EXTRA), "new v2 files must be additive")
    for i, (name, digest) in enumerate(table.items()):
        if i % 32 == 0:
            budget.guard()
        G.require(
            G.sha(G.contained(ROOT, name))
            == G.sha(G.contained(QUALIFIED / "source-snapshot", name))
            == digest,
            "frozen source drift: " + name,
        )
    return dict(table, **{name: G.sha(G.contained(ROOT, name)) for name in EXTRA})


def ancestry(parent, modules, budget):
    # Use the completed P0's hash-bound history, including the unregraded v1.
    gate, _ = qualified_guard()
    expected = pinned(
        QUALIFIED / "history-before.json",
        gate["artifact_hashes"]["history-before.json"],
    )
    G.require(
        expected
        == pinned(
            QUALIFIED / "history-after.json",
            gate["artifact_hashes"]["history-after.json"],
        )
        and len(expected) == 10
        and sum(map(len, expected.values())) == 6858,
        "qualified ten-directory history required",
    )
    result = {}
    for name, hashes in expected.items():
        current = G.inventory(G.contained(G.EVIDENCE, name), "", budget)
        G.require(current == hashes, "historical artifact drift: " + name)
        result[name] = current
    current = G.inventory(QUALIFIED, "", budget)
    G.require(
        len(current) == 729
        and {k: v for k, v in current.items() if k != "qualification-gate.json"}
        == gate["artifact_hashes"],
        "P0 artifacts drift",
    )
    result[QUALIFIED.name] = current
    G.require(
        len(result) == 11 and sum(map(len, result.values())) == 7587,
        "eleven historical directories required",
    )
    return result


def unit_evidence(path):
    test_source = (
        ROOT / "science/numerical_relativity/test_constraint_direction_section.py"
    )
    expected = [
        node.name
        for node in ast.parse(test_source.read_text(encoding="utf-8")).body
        if isinstance(node, ast.FunctionDef) and node.name.startswith("test_")
    ]
    G.require(
        len(expected) == len(set(expected)) == 16,
        "sixteen fixed test functions required",
    )
    xml = ET.parse(path).getroot()
    rows = list(xml.iter("testcase"))
    names = [row.get("name") for row in rows]
    G.require(
        len(names) == len(set(names)) == 16
        and set(names) == set(expected)
        and not any(list(xml.iter(tag)) for tag in ("failure", "error", "skipped")),
        "all exact sixteen registered tests must pass",
    )
    return dict(tests=16, errors=0, failures=0, skipped=0)


def validate_completion_records(rows, mutations):
    G.require(
        len(rows) == 8
        and all(
            row["index"] == i
            and row["ray"] == list(RAYS[i])
            and row["ranks"] == [11, 12, 8, 4, 8, 0, 0, 0]
            and row["normalized_energy_floor"] == "1/14"
            and all(
                row[k] is True
                for k in (
                    "section_checked",
                    "closure_checked",
                    "reverse_quotient_checked",
                    "energy_checked",
                    "replay_checked",
                )
            )
            for i, row in enumerate(rows)
        ),
        "all eight registered rays required",
    )
    G.require(
        len(mutations) == 16
        and all(
            set(row) == {"prefix", "name", "nonzero_entries", "rejected"}
            and row["rejected"] is True
            and type(row["nonzero_entries"]) is int
            and row["nonzero_entries"] > 0
            for row in mutations
        ),
        "16 nonzero exact negative witnesses required",
    )
    expected = [
        (f"ray-{i}/negative/{kind}", name)
        for i in range(8)
        for kind, name in (
            ("section", "right-section"),
            ("principal", "full-kernel-closure"),
        )
    ]
    G.require(
        [(row["prefix"], row["name"]) for row in mutations] == expected,
        "one distinct pair of end-to-end negative controls for every registered ray required",
    )


ENTRY_NEGATIVES = (
    "p0-failed",
    "p0-unqualified",
    "p0-source-drift",
    "ray-missing",
    "ray-duplicate",
    "negative-missing",
    "negative-duplicate",
)


def entry_controls(budget):
    gate, control = qualified_guard()
    rows = [
        dict(
            index=i,
            ray=list(ray),
            ranks=[11, 12, 8, 4, 8, 0, 0, 0],
            normalized_energy_floor="1/14",
            **{
                key: True
                for key in (
                    "section_checked",
                    "closure_checked",
                    "reverse_quotient_checked",
                    "energy_checked",
                    "replay_checked",
                )
            },
        )
        for i, ray in enumerate(RAYS)
    ]
    negatives = [
        dict(
            prefix=f"ray-{i}/negative/{kind}",
            name=name,
            nonzero_entries=1,
            rejected=True,
        )
        for i in range(8)
        for kind, name in (
            ("section", "right-section"),
            ("principal", "full-kernel-closure"),
        )
    ]
    validate_guard_records(gate, control)
    validate_completion_records(rows, negatives)
    changed_sources = dict(control["source_after"])
    changed_sources[V1_SOURCE] = "0" * 64
    attempts = (
        lambda: validate_guard_records(dict(gate, passed=False), control),
        lambda: validate_guard_records(
            gate, dict(control, single_scan_qualified=False)
        ),
        lambda: validate_guard_records(
            gate, dict(control, source_after=changed_sources)
        ),
        lambda: validate_completion_records(rows[:-1], negatives),
        lambda: validate_completion_records(rows[:-1] + [rows[0]], negatives),
        lambda: validate_completion_records(rows, negatives[:-1]),
        lambda: validate_completion_records(rows, negatives[:-1] + [negatives[0]]),
    )
    witnesses = []
    for name, operation in zip(ENTRY_NEGATIVES, attempts, strict=True):
        budget.guard()
        try:
            operation()
        except ValueError as error:
            witnesses.append(dict(name=name, rejected=True, error=str(error)))
        else:
            raise ValueError("entry negative accepted: " + name)
    result = dict(
        schema="nr-direction-v2-entry-controls-v1",
        passed=True,
        tests=8,
        positive_controls=1,
        negative_controls=7,
        witnesses=witnesses,
        synthetic_contract_fixtures=True,
        mathematical_cases_executed=0,
    )
    budget.record("entry-controls.json", result)
    return result


def sparse_evidence(path, shape, expected_sha=None):
    value = pinned(path, expected_sha) if expected_sha is not None else read(path)
    G.require(
        set(value) == {"shape", "representation", "entries"}
        and value["shape"] == shape
        and value["representation"] == "sparse-exact-rational-zero-fill"
        and type(value["entries"]) is list,
        "saved rational matrix schema",
    )
    coordinates = set()
    for entry in value["entries"]:
        G.require(isinstance(entry, list) and len(entry) == 4, "rational entry schema")
        i, j, numerator, denominator = entry
        G.require(
            type(i) is int
            and type(j) is int
            and 0 <= i < shape[0]
            and 0 <= j < shape[1]
            and (i, j) not in coordinates,
            "unique contained rational coordinates",
        )
        G.require(
            type(numerator) is str
            and type(denominator) is str
            and str(int(numerator)) == numerator
            and int(numerator) != 0
            and str(int(denominator)) == denominator
            and int(denominator) > 0,
            "canonical integer strings for nonzero rational entry",
        )
        coordinates.add((i, j))
    return len(coordinates)


def saved_mathematical_evidence(directory, result, budget):
    G.require(
        read(directory / "exact-mutations.json") == result["exact_mutations"],
        "saved mutation reports differ",
    )
    checks = read(directory / "exact-checks.json")
    expected_negative = {
        row["prefix"] + "/" + row["name"] + "/power-0.json": row["nonzero_entries"]
        for row in result["exact_mutations"]
    }
    observed_paths = set()
    for index, row in enumerate(checks):
        if index % 32 == 0:
            budget.guard()
        G.require(
            set(row) == {"prefix", "name", "power", "nonzero_entries"}
            and type(row["power"]) is int
            and row["power"] == 0,
            "exact check index schema",
        )
        name = row["prefix"] + "/" + row["name"] + "/power-0.json"
        G.require(name not in observed_paths, "duplicate exact check index")
        observed_paths.add(name)
        shape = [43, 43]
        if row["name"] == "full-kernel-closure":
            shape = [43, 58]
        elif row["name"] == "frozen-leading":
            shape = [43, 58]
        elif row["name"] == "section-exact-replay":
            shape = [58, 43]
        count = sparse_evidence(G.contained(directory, name), shape)
        G.require(
            type(row["nonzero_entries"]) is int
            and row["nonzero_entries"] == count
            and count == expected_negative.get(name, 0),
            "saved exact residual mismatch",
        )
    G.require(
        set(expected_negative).issubset(observed_paths),
        "missing exact negative residual",
    )
    expected_paths = set(expected_negative)
    expected_certificates = {
        f"ray-{i}/{name}.json"
        for i in range(8)
        for name in (
            "zero",
            *(f"pair-{p}" for p in range(6)),
            *(f"action-{p}" for p in range(6)),
        )
    }
    G.require(
        set(result["certificate_hashes"]) == expected_certificates,
        "all104 projector/action certificates required",
    )
    common = (
        "right-section",
        "full-kernel-closure",
        "independent-reverse-pivot-quotient",
        "principal-symmetrization",
        "section-exact-replay",
    )
    energy_names = (
        "ode-idempotence",
        "intrinsic-left-ode",
        "intrinsic-right-ode",
        "zero-speed-action",
        "energy-symmetry",
        "energy-intrinsic-symmetrization",
        "energy-pde-symmetrization",
        "energy-gram-coercivity",
    )
    for index, row in enumerate(result["rows"]):
        budget.guard()
        prefix = f"ray-{index}"
        G.require(
            read(directory / prefix / "result.json") == row,
            "saved per-ray completion differs",
        )
        expected_paths.update(f"{prefix}/{name}/power-0.json" for name in common)
        expected_paths.update(
            f"{prefix}/energy-checks/{name}/power-0.json" for name in energy_names
        )
        expected_paths.update(
            f"{prefix}/energy-checks/projector-{i}-{j}/power-0.json"
            for i in range(8)
            for j in range(8)
        )
        expected_paths.update(
            f"{prefix}/energy-checks/paired-speed-{i}/power-0.json" for i in range(6)
        )
        for name, shape in (
            ("leading", [43, 58]),
            ("main", [58, 58]),
            ("section", [58, 43]),
            ("principal", [43, 43]),
            ("energy", [43, 43]),
            ("metric", [43, 43]),
            ("coercivity", [43, 43]),
            ("ode", [43, 43]),
        ):
            sparse_evidence(directory / prefix / (name + ".json"), shape)
        for name in (
            "zero",
            *(f"pair-{p}" for p in range(6)),
            *(f"action-{p}" for p in range(6)),
        ):
            relative = prefix + "/" + name + ".json"
            sparse_evidence(
                directory / relative, [43, 43], result["certificate_hashes"][relative]
            )
    expected_paths.update(
        f"ray-0/{name}/power-0.json" for name in ("frozen-leading", "frozen-principal")
    )
    G.require(
        observed_paths == expected_paths, "complete exact certificate index required"
    )
    for name, row in result["comparisons"].items():
        original = read(directory / "comparisons" / (name + ".json"))
        mutation = read(directory / "comparisons" / (name + "-mutated.json"))
        G.require(
            original["relative"] == row["relative"]
            and original["precision50_70_rounded_equal"] is row["rounded_equal"] is True
            and mutation["relative"] == row["mutation_relative"],
            "saved floating comparison differs",
        )


def worker(directory):
    prepared = G.read_terminal(directory / "qualification-gate.json.prepared.json")
    G.require(
        prepared["run_id"] == os.environ.get("NR_OWNED_CONTROL_RUN_ID")
        and prepared["passed"] is False,
        "owned worker token required",
    )
    G.require(
        directory.parent == G.EVIDENCE and directory.is_dir(),
        "prepared contained directory required",
    )
    G.require(
        all(
            os.environ.get(k) == "1"
            for k in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS", "MKL_NUM_THREADS")
        ),
        "single-thread required",
    )
    budget, started = C.SingleScanBudget(directory), time.monotonic()
    result = dict(
        schema=METHOD,
        passed=False,
        completed=False,
        phase="intake",
        errors=[],
        stages=[],
        case_indices=[12],
        planned_rays=[list(v) for v in RAYS],
        rows=[],
        source_before={},
        source_after={},
        certificate_hashes={},
        parent_gate_sha256=GATE_SHA,
        parent_worker_sha256=WORKER_SHA,
        guard_qualification_sha256=QUALIFIED_GATE_SHA,
        guard_worker_sha256=QUALIFIED_WORKER_SHA,
        previous_timeout_sha256=PREVIOUS_GATE_SHA,
        guard_implementation="nr_single_scan_control.SingleScanBudget",
        resource_caps=dict(
            seconds=600,
            output_bytes=G.CAP,
            headroom=G.HEADROOM,
            source_snapshot_bytes=8 * 1024**2,
            c_reserve=G.C_RESERVE,
            e_reserve=G.E_RESERVE,
        ),
        case12_direction_section_checked=False,
        registered_ray_energy_checked=False,
        original_threshold=TOLERANCE,
        integration_steps=0,
        native_calls=0,
        retries=0,
        **{key: False for key in FALSE_FLAGS},
    )
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
        modules = parent.helpers()
        old = modules[-1]
        table, history = sources(budget), ancestry(parent, modules, budget)
        result["source_before"] = table
        budget.record("ancestry-before.json", history)
        result["snapshot_bytes"] = old.save_snapshot(budget, table)
        stage(
            "intake-verified",
            sources=len(table),
            historical_files=sum(map(len, history.values())),
        )
        result["entry_controls"] = entry_controls(budget)
        stage("entry-controls-complete", tests=8, negative_controls=7)

        import numpy as np
        from scripts import nr_constraint_direction_section as S
        from scripts import nr_constraint_exact_coefficients as R
        from scripts import nr_constraint_laurent_energy as E
        from scripts import nr_profile_exact_coefficients as Q

        result["environment"] = dict(
            python=sys.version, numpy=np.__version__, threads=1
        )
        stage("unit-controls-start")
        command = [
            sys.executable,
            "-B",
            "-m",
            "pytest",
            "-q",
            "-s",
            "--noconftest",
            "-p",
            "no:cacheprovider",
            "-c",
            str(
                ROOT
                / "science/numerical_relativity/pytest-case12-direction-section.ini"
            ),
            "--junitxml=" + str(directory / "unit-controls.xml"),
            str(
                ROOT
                / "science/numerical_relativity/test_constraint_direction_section.py"
            ),
        ]
        budget.record("unit-command.json", command)
        run = subprocess.run(
            command,
            cwd=ROOT,
            env=dict(
                os.environ,
                PYTEST_ADDOPTS="",
                PYTEST_PLUGINS="",
                PYTEST_DISABLE_PLUGIN_AUTOLOAD="1",
            ),
            check=False,
        )
        budget.guard()
        G.require(run.returncode == 0, "unit failure; no retry")
        counts = unit_evidence(directory / "unit-controls.xml")
        result["unit_controls"] = counts
        stage("unit-controls-complete", **counts)

        input_hashes = {}

        def frozen(name):
            return parent.frozen_input_bytes(
                G.contained(PARENT, name),
                history[PARENT.name][name],
                budget,
                name,
                input_hashes,
            )

        def exact_input(name):
            return E.decode(json.loads(frozen(name).decode("utf-8")))

        original = Q.case12()
        G.require(
            json.loads(frozen("exact-design-passport.json").decode("utf-8"))
            == original.passport(),
            "unchanged physical background required",
        )
        original_d, original_a = (
            exact_input("candidate/leading.json"),
            exact_input("candidate/principal.json"),
        )
        saved = {}
        for name in ("principal", "energy"):
            value = np.load(
                io.BytesIO(frozen("inputs/" + name + ".npy")), allow_pickle=False
            )
            G.require(
                value.dtype == np.float64
                and value.shape == (43, 43)
                and np.isfinite(value).all(),
                "binary64 frozen matrix required",
            )
            value.setflags(write=False)
            saved[name] = value
        budget.record("input-hashes.json", input_hashes)

        checks, negatives, comparisons = [], [], {}

        def certificate(name, matrix):
            raw = G.encoded(Q.encode(matrix))
            budget.save(name, raw)
            result["certificate_hashes"][name] = G.hashlib.sha256(raw).hexdigest()

        def sink(prefix):
            def save(name, terms):
                for power, matrix in terms.items():
                    value = Q.encode(matrix)
                    budget.record(f"{prefix}/{name}/power-{power}.json", value)
                    checks.append(
                        dict(
                            prefix=prefix,
                            name=name,
                            power=power,
                            nonzero_entries=len(value["entries"]),
                        )
                    )

            return save

        def check(name, a, b, prefix):
            E.identity(name, {0: a}, {0: b}, sink=sink(prefix))

        def reject(name, a, b, prefix):
            try:
                check(name, a, b, prefix)
            except E.ExactIdentityError as error:
                count = sum(np.count_nonzero(x) for x in error.residual.values())
                G.require(count > 0, "nonzero negative witness required")
                negatives.append(
                    dict(
                        prefix=prefix,
                        name=name,
                        nonzero_entries=int(count),
                        rejected=True,
                    )
                )
            else:
                raise ValueError("end-to-end perturbation accepted: " + prefix)

        for index, ray in enumerate(RAYS):
            stage("ray-start", ray_index=index, ray=list(ray))
            b = replace(original, ray=tuple(map(F, ray)))
            prefix = f"ray-{index}"
            d, main, section = (
                R.leading(b, guard=budget.guard),
                Q.matrix(b, guard=budget.guard),
                S.section(b, guard=budget.guard),
            )
            for name, matrix in (("leading", d), ("main", main), ("section", section)):
                budget.record(prefix + "/" + name + ".json", Q.encode(matrix))
            budget.record(prefix + "/passport.json", b.passport())
            check(
                "right-section",
                R.product(d, section, guard=budget.guard),
                R.eye(43),
                prefix,
            )
            transport = R.product(d, main, guard=budget.guard)
            principal = R.product(transport, section, guard=budget.guard)
            budget.record(prefix + "/principal.json", Q.encode(principal))
            check(
                "full-kernel-closure",
                R.product(principal, d, guard=budget.guard),
                transport,
                prefix,
            )
            reverse, _, pivots = R.quotient(d, main, reverse=True, guard=budget.guard)
            check("independent-reverse-pivot-quotient", principal, reverse, prefix)
            ode = R.ode_projector(b)
            energy = E.paired_energy(
                R.intrinsic(principal, b),
                ode,
                tuple(b.ray_squared * x for x in b.squared_speeds()),
                tuple(
                    1 / b.ray_squared if i in R.SCALED_ROWS else F(1) for i in range(43)
                ),
                guard=budget.guard,
                sink=sink(prefix + "/energy-checks"),
            )
            check(
                "principal-symmetrization",
                R.product(energy["energy"], principal, guard=budget.guard),
                R.product(principal.T, energy["energy"], guard=budget.guard),
                prefix,
            )
            ranks = [
                sum(a[i, i] for i in range(43))
                for a in (ode, energy["zero"], *energy["pairs"])
            ]
            G.require(
                ranks == [11, 12, 8, 4, 8, 0, 0, 0]
                and energy["denominator"] == 14
                and energy["lower_scalar"] == min(F(1), 1 / b.ray_squared) / 14,
                "unchanged ranks and normalized floor required",
            )
            bounds = S.case12_direction_bounds(b)
            G.require(
                bounds["metric_normal_lower"] == F(5, 6)
                and bounds["metric_normal_upper"] == F(964403, 781250)
                and bounds["squared_speed_gap_lower"] == F(867, 40000),
                "registered analytical branch margins required",
            )
            G.require(
                bounds["metric_normal_lower"]
                <= b.metric_normal_squared
                <= bounds["metric_normal_upper"],
                "ray outside analytic metric interval",
            )
            for name, matrix in (
                ("energy", energy["energy"]),
                ("metric", energy["metric"]),
                ("coercivity", energy["coercivity"]),
                ("ode", ode),
            ):
                budget.record(prefix + "/" + name + ".json", Q.encode(matrix))
            # Retain the already-computed projectors/actions for saved-data audit.
            certificate(prefix + "/zero.json", energy["zero"])
            for pair, (projector, action) in enumerate(
                zip(energy["pairs"], energy["actions"], strict=True)
            ):
                certificate(prefix + f"/pair-{pair}.json", projector)
                certificate(prefix + f"/action-{pair}.json", action)

            if index == 0:
                check("frozen-leading", d, original_d, prefix)
                check("frozen-principal", principal, original_a, prefix)
                for name in ("principal", "energy"):
                    exact = principal if name == "principal" else energy["energy"]
                    convert = (
                        (
                            lambda precision: R.normalized(
                                exact, b, kind="principal", precision=precision
                            )
                        )
                        if name == "principal"
                        else (
                            lambda precision: E.normal_coordinates(
                                exact, b, kind="energy", precision=precision
                            )
                        )
                    )
                    high, low = convert(70), convert(50)
                    report = Q.compare(saved[name], high)
                    equal = bool(
                        np.array_equal(
                            np.asarray(high, dtype=float), np.asarray(low, dtype=float)
                        )
                    )
                    report["precision50_70_rounded_equal"] = equal
                    budget.record("comparisons/" + name + ".json", report)
                    G.require(
                        equal and report["relative"] <= TOLERANCE,
                        "original threshold disagreement",
                    )
                    changed = saved[name].copy()
                    changed[0, 0] += 1e-6
                    mutation = Q.compare(changed, high)
                    budget.record("comparisons/" + name + "-mutated.json", mutation)
                    G.require(
                        mutation["relative"] > TOLERANCE,
                        "floating perturbation not rejected",
                    )
                    comparisons[name] = dict(
                        relative=report["relative"],
                        rounded_equal=equal,
                        mutation_relative=mutation["relative"],
                        mutation_rejected=True,
                    )

            changed_s = section.copy()
            changed_s[6, 8] += F(1, 1000000)
            budget.record(prefix + "/negative/section-input.json", Q.encode(changed_s))
            reject(
                "right-section",
                R.product(d, changed_s, guard=budget.guard),
                R.eye(43),
                prefix + "/negative/section",
            )
            changed_a = principal.copy()
            changed_a[0, 0] += F(1, 1000000)
            budget.record(
                prefix + "/negative/principal-input.json", Q.encode(changed_a)
            )
            reject(
                "full-kernel-closure",
                R.product(changed_a, d, guard=budget.guard),
                transport,
                prefix + "/negative/principal",
            )
            check(
                "section-exact-replay",
                S.section(b, guard=budget.guard),
                section,
                prefix,
            )
            G.require(
                S.case12_direction_bounds(b) == bounds, "exact bound replay mismatch"
            )
            record = dict(
                index=index,
                ray=list(ray),
                ranks=list(map(int, ranks)),
                section_checked=True,
                closure_checked=True,
                reverse_quotient_checked=True,
                energy_checked=True,
                replay_checked=True,
                raw_energy_floor=str(energy["lower_scalar"]),
                normalized_energy_floor="1/14",
                ray_squared=str(b.ray_squared),
                metric_normal_squared=str(b.metric_normal_squared),
                reverse_pivots=pivots,
            )
            budget.record(prefix + "/result.json", record)
            result["rows"].append(record)
            stage("ray-complete", ray_index=index)

        result["comparisons"], result["exact_mutations"] = comparisons, negatives
        budget.record("exact-checks.json", checks)
        budget.record("exact-mutations.json", negatives)
        bound_record = {
            k: list(map(str, v))
            if isinstance(v, tuple)
            else v
            if isinstance(v, bool)
            else str(v)
            for k, v in bounds.items()
        }
        budget.record("direction-denominator-bounds.json", bound_record)
        result["denominator_bounds"] = bound_record
        stage("final-integrity")
        G.require(
            old.inventory(directory / "inputs", budget) == input_hashes
            and sources(budget) == table,
            "input/source drift",
        )
        for i, (name, digest) in enumerate(table.items()):
            if i % 32 == 0:
                budget.guard()
            G.require(
                G.sha(G.contained(directory / "source-snapshot", name)) == digest,
                "snapshot drift",
            )
        after = ancestry(parent, modules, budget)
        budget.record("ancestry-after.json", after)
        G.require(after == history, "historical artifact drift")
        result.update(
            passed=True,
            completed=True,
            source_after=table,
            old_artifacts_unchanged=True,
            original_inputs_unchanged=True,
            case12_direction_section_checked=True,
            registered_ray_energy_checked=True,
        )
        stage("complete", passed=True)
    except BaseException as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
        result.update(
            passed=False,
            completed=False,
            case12_direction_section_checked=False,
            registered_ray_energy_checked=False,
        )
    result["seconds"] = time.monotonic() - started
    budget.record("worker-result.json", result)
    print(
        json.dumps(
            {key: result[key] for key in ("passed", "phase", "seconds", "errors")}
        ),
        flush=True,
    )
    return 0 if result["passed"] else 1


def finalizer(directory, budget):
    result = read(directory / "worker-result.json")
    G.require(
        result["schema"] == METHOD
        and result["passed"] is result["completed"] is True
        and not result["errors"],
        "completed bounded candidate required",
    )
    G.require(
        all(result[key] is False for key in FALSE_FLAGS),
        "no global qualification or input substitution",
    )
    G.require(
        result["case_indices"] == [12]
        and result["planned_rays"] == [list(v) for v in RAYS]
        and result["integration_steps"]
        == result["native_calls"]
        == result["retries"]
        == 0
        and result["original_threshold"] == TOLERANCE,
        "registered case12 scope required",
    )
    G.require(
        result["unit_controls"] == dict(tests=16, errors=0, failures=0, skipped=0),
        "16 controls required",
    )
    G.require(
        result["unit_controls"] == unit_evidence(directory / "unit-controls.xml"),
        "saved test identity mismatch",
    )
    G.require(
        result["guard_qualification_sha256"] == QUALIFIED_GATE_SHA
        and result["guard_worker_sha256"] == QUALIFIED_WORKER_SHA
        and result["previous_timeout_sha256"] == PREVIOUS_GATE_SHA
        and result["guard_implementation"] == "nr_single_scan_control.SingleScanBudget",
        "qualified guard bindings required",
    )
    controls = read(directory / "entry-controls.json")
    G.require(
        controls == result["entry_controls"]
        and controls["schema"] == "nr-direction-v2-entry-controls-v1"
        and controls["passed"] is controls["synthetic_contract_fixtures"] is True
        and controls["tests"] == 8
        and controls["positive_controls"] == 1
        and controls["negative_controls"] == 7
        and controls["mathematical_cases_executed"] == 0
        and [row["name"] for row in controls["witnesses"]] == list(ENTRY_NEGATIVES)
        and all(
            row["rejected"] is True and row["error"] for row in controls["witnesses"]
        ),
        "entry-control evidence mismatch",
    )
    G.require(
        result["case12_direction_section_checked"]
        is result["registered_ray_energy_checked"]
        is True
        and result["old_artifacts_unchanged"]
        is result["original_inputs_unchanged"]
        is True,
        "missing local gates",
    )
    validate_completion_records(result["rows"], result["exact_mutations"])
    G.require(
        set(result["comparisons"]) == {"principal", "energy"}
        and all(
            row["relative"] <= TOLERANCE
            and row["rounded_equal"]
            and row["mutation_rejected"]
            and row["mutation_relative"] > TOLERANCE
            for row in result["comparisons"].values()
        ),
        "saved binary64 inputs must agree without repair",
    )
    saved_mathematical_evidence(directory, result, budget)
    G.require(
        result["denominator_bounds"]
        == read(directory / "direction-denominator-bounds.json")
        and result["denominator_bounds"]["squared_speed_gap_lower"] == "867/40000",
        "fixed analytical margin required",
    )
    table = sources(budget)
    G.require(
        len(table) == 573
        and table == result["source_before"] == result["source_after"],
        "frozen source closure required",
    )
    for i, (name, digest) in enumerate(table.items()):
        if i % 32 == 0:
            budget.guard()
        G.require(
            G.sha(G.contained(directory / "source-snapshot", name)) == digest,
            "final snapshot drift",
        )
    parent = helper()
    modules = parent.helpers()
    G.require(
        ancestry(parent, modules, budget)
        == read(directory / "ancestry-before.json")
        == read(directory / "ancestry-after.json"),
        "history drift",
    )
    G.require(
        modules[-1].inventory(directory / "inputs", budget)
        == read(directory / "input-hashes.json"),
        "frozen input drift",
    )
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--guard-worker", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    directory = Path(os.path.abspath(args.output_directory))
    if args.guard_worker:
        return worker(directory)
    G.require(
        G.sha(ROOT / "scripts/nr_owned_control.py") == GUARD_SHA,
        "immutable supervisor required",
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
        json.dumps({key: result[key] for key in ("passed", "completed", "errors")}),
        flush=True,
    )
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
