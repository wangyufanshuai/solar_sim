"""Fixed N13 continuation envelope; the qualified component owns all evolution.

Parents remain external immutable dependencies. Neither their work nor the
component controls are counted as new scientific evolution in this batch.
"""

from __future__ import annotations

import io
import json
from pathlib import Path
import xml.etree.ElementTree as ET

import numpy as np

from . import native_campaign as N
from . import native_continuation as C
from .fo_ccz4_gauge_pulse import identity as pulse_identity

require = N.require
COMPONENT = N.EVIDENCE / "nr-k3-native-continuation-controls-v1-20261010"
COMPONENT_GATE_SHA = "01b6ce1863b556ad7fc084bcfad17943bf931117808cd5c4166484c24386f01d"
COMPONENT_RECEIPT_SHA = (
    "9b0f536263c464a7baad43861934b639be0731988bfffa6955287210b246254b"
)
COMPONENT_XML_SHA = "4701340176cec2430b57d69cdb81976a34eb7bddc44d2eb81af472c95d75b086"
STEPS = (7, 14, 28)
CAPS = dict(
    seconds=2400,
    output_bytes=832 * 1024**2,
    headroom=32 * 1024**2,
    c_reserve=3 * 1024**3,
    e_reserve=4 * 1024**3 + 32 * 1024**2,
)
ENTRY_SOURCES = (
    "science/numerical_relativity/native_continuation_campaign.py",
    "science/numerical_relativity/EXPERIMENT-20261010-native-gauge-continuation.md",
    "scripts/run-nr-k3-native-gauge-continuation.py",
    "scripts/audit-nr-k3-native-gauge-continuation.py",
    "scripts/tests/test_nr_native_continuation_campaign.py",
    "scripts/run-nr-k3-native-continuation-entry-controls.py",
    "scripts/nr-native-continuation-entry-tests.ini",
)
ENTRY_TEST_COUNT = 60
FALSE_FLAGS = {
    **C.FLAGS,
    "spatial_order_validated": False,
    "constraint_convergence_validated": False,
    "new_interval_python_parity": False,
    "old_failure_regraded": False,
    "exact_scientific_replay": False,
}


def verify_inventory(directory, data, excluded):
    files = {
        p.relative_to(directory).as_posix()
        for p in directory.rglob("*")
        if p.is_file() and p != directory / excluded
    }
    require(
        files == set(data["artifact_hashes"]),
        "complete exact evidence inventory required",
    )
    for name, digest in data["artifact_hashes"].items():
        require(
            N.sha(N.contained(directory, name)) == digest,
            "evidence artifact changed: " + name,
        )


def check_xml(path, count, module):
    cases = list(ET.parse(path).getroot().iter("testcase"))
    require(
        len(cases) == count and len({c.get("name") for c in cases}) == count,
        "complete unique test suite required",
    )
    require(
        {c.get("classname") for c in cases} == {module}
        and not any(x.tag in ("failure", "error", "skipped") for c in cases for x in c),
        "green zero-skip test suite required",
    )


def component_qualification():
    gate_path = COMPONENT / "qualification-gate.json"
    require(
        N.sha(gate_path) == COMPONENT_GATE_SHA
        and N.sha(COMPONENT / "control-receipt.json") == COMPONENT_RECEIPT_SHA
        and N.sha(COMPONENT / "tests.xml") == COMPONENT_XML_SHA,
        "pinned continuation component qualification changed",
    )
    gate = json.loads(gate_path.read_text(encoding="utf-8"))
    require(
        gate["completed"] is gate["passed"] is True
        and not gate["errors"]
        and gate["returncode"] == 0,
        "completed component controls required",
    )
    verify_inventory(COMPONENT, gate, "qualification-gate.json")
    check_xml(COMPONENT / "tests.xml", 52, "scripts.tests.test_nr_native_continuation")
    receipt = json.loads(
        (COMPONENT / "control-receipt.json").read_text(encoding="utf-8")
    )
    require(
        receipt["source_before"] == receipt["source_after"]
        and receipt["native_unchanged"] is True
        and receipt["parent_unchanged"] is True,
        "component identity incomplete",
    )
    for key in (
        "real_even_continuation",
        "real_odd_continuation",
        "real_failure_prefix",
    ):
        require(receipt.get(key) is True, "missing component control: " + key)
    for name, digest in receipt["source_after"].items():
        require(
            N.sha(N.contained(N.ROOT, name)) == digest,
            "qualified component source changed",
        )
    return dict(
        gate=gate_path.relative_to(N.ROOT).as_posix(),
        gate_sha256=COMPONENT_GATE_SHA,
        receipt_sha256=COMPONENT_RECEIPT_SHA,
        xml_sha256=COMPONENT_XML_SHA,
        tests=52,
        current_sources=len(receipt["source_after"]),
        **C.FLAGS,
    )


def source_closure():
    require(
        N.sha(COMPONENT / "control-receipt.json") == COMPONENT_RECEIPT_SHA,
        "component receipt drift",
    )
    inherited = json.loads(
        (COMPONENT / "control-receipt.json").read_text(encoding="utf-8")
    )["source_after"]
    result = N.merge_source_tables(
        inherited, {name: N.sha(N.ROOT / name) for name in ENTRY_SOURCES}
    )
    for name, digest in result.items():
        require(N.sha(N.contained(N.ROOT, name)) == digest, "source closure drift")
    require(
        sum(N.contained(N.ROOT, name).stat().st_size for name in result) <= 4 * 1024**2,
        "source snapshot exceeds reserved bound",
    )
    return result


def entry_qualification(path):
    path = Path(path).resolve()
    require(
        path.name == "qualification-gate.json" and path.parent.parent == N.EVIDENCE,
        "local full-entry test gate required",
    )
    data = json.loads(path.read_text(encoding="utf-8"))
    require(
        data.get("schema") == "nr-native-continuation-entry-controls-v1"
        and data.get("passed") is True
        and data.get("completed") is True
        and data.get("returncode") == 0
        and not data.get("errors"),
        "passed full-entry tests required",
    )
    require(
        data.get("source_before") == data.get("source_after") == source_closure(),
        "exact entry test source closure required",
    )
    require(
        data.get("component_gate_sha256") == COMPONENT_GATE_SHA
        and data.get("tests") == ENTRY_TEST_COUNT,
        "entry tests need qualified component and complete count",
    )
    require(
        data.get("registration_fixture_audited") is True,
        "whole registration fixture audit required",
    )
    for key in (*C.FLAGS, "new_scientific_evolution"):
        require(data.get(key) is False, "entry controls cannot claim new physics")
    verify_inventory(path.parent, data, path.name)
    require(
        N.sha(path.parent / "tests.xml") == data["xml_sha256"], "entry XML hash changed"
    )
    check_xml(
        path.parent / "tests.xml",
        ENTRY_TEST_COUNT,
        "scripts.tests.test_nr_native_continuation_campaign",
    )
    for name, digest in data["source_after"].items():
        require(
            N.sha(N.contained(path.parent / "source-snapshot", name)) == digest,
            "entry source snapshot changed",
        )
    return dict(
        gate=path.relative_to(N.ROOT).as_posix(),
        gate_sha256=N.sha(path),
        xml_sha256=data["xml_sha256"],
        tests=ENTRY_TEST_COUNT,
    )


def registration():
    rows = [
        C.registered_case(
            f"native-gauge-continuation-13-{steps}",
            C.anchor_link("gauge-pulse-v2", f"native-gauge-pulse-13-{steps}", steps),
            steps,
        )
        for steps in STEPS
    ]
    require(
        all(r["resume_time"] == 1 / 16 and r["end_time"] == 1 / 8 for r in rows),
        "fixed common absolute times required",
    )
    return rows


def dependencies():
    parent = json.loads(
        (C.SCIENTIFIC_DIRECTORY / "receipt.json").read_text(encoding="utf-8")
    )
    paths = [
        C.SCIENTIFIC_DIRECTORY / name
        for name in (
            "receipt.json",
            "global-plan.json",
            "registered-cases.json",
            "binding.txt",
        )
    ]
    paths += [C.SCIENTIFIC_AUDIT]
    paths += [N.ROOT / row["parent"]["checkpoint"] for row in registration()]
    result = {}
    for path in paths:
        digest = N.sha(path)
        if path == C.SCIENTIFIC_DIRECTORY / "receipt.json":
            require(digest == C.SCIENTIFIC_SHA, "parent receipt drift")
        elif path == C.SCIENTIFIC_AUDIT:
            require(digest == C.SCIENTIFIC_AUDIT_SHA, "parent audit drift")
        else:
            require(
                digest
                == parent["artifact_hashes"][
                    path.relative_to(C.SCIENTIFIC_DIRECTORY).as_posix()
                ],
                "parent dependency drift",
            )
        result[path.relative_to(N.ROOT).as_posix()] = digest
    require(
        sum(N.contained(N.ROOT, name).stat().st_size for name in result)
        <= C.PARENT_ALLOWANCE,
        "parent metadata/checkpoint snapshot exceeds reserved allowance",
    )
    return result


def prepare(sources, component, tests):
    rows = registration()
    identity, binding, _ = N.native_identity()
    parent = json.loads(
        (C.SCIENTIFIC_DIRECTORY / "receipt.json").read_text(encoding="utf-8")
    )
    arrays = []
    for name in ("initial.npy", "reference.npy"):
        path = C.SCIENTIFIC_DIRECTORY / name
        require(
            N.sha(path) == parent["artifact_hashes"][name],
            "parent common state changed",
        )
        arrays.append(np.load(path, allow_pickle=False))
    initial, reference = arrays
    links = dependencies()
    plan = dict(
        schema="nr-native-gauge-continuation-plan-v1",
        n=13,
        lower=[1.0] * 3,
        upper=[3.0] * 3,
        origin_time=0.0,
        resume_time=1 / 16,
        end_time=1 / 8,
        segment_steps=2,
        case_matrix=rows,
        parent_dependencies=links,
        parent_receipt_sha256=C.SCIENTIFIC_SHA,
        parent_audit_sha256=C.SCIENTIFIC_AUDIT_SHA,
        parent_self_contained=False,
        original_initial_state_sha256=N.codec.sha(initial.tobytes()),
        reference_state_sha256=N.codec.sha(reference.tobytes()),
        initial_identity=pulse_identity(),
        native_identity=identity,
        source_sha256=N.codec.sha(N.json_bytes(sources)),
        component_qualification=component,
        entry_qualification=tests,
        resource_caps=CAPS,
        worst_case_bytes=C.prospective_bytes(),
        **FALSE_FLAGS,
    )
    return plan, binding, initial, reference


def save_registration(budget, plan, binding, initial, reference, sources):
    require(
        plan["worst_case_bytes"] <= N.OUTPUT_CAP and plan["resource_caps"] == CAPS,
        "complete prospective original budget required",
    )
    raw = N.json_bytes(plan)
    require(len(raw) <= 1024**2, "bounded global registration required")
    budget.save("global-plan.json", raw)
    budget.save("binding.txt", binding)
    budget.record("registered-cases.json", plan["case_matrix"])
    for name, value in (("initial.npy", initial), ("reference.npy", reference)):
        buffer = io.BytesIO()
        np.save(buffer, value, allow_pickle=False)
        budget.save(name, buffer.getvalue())
    N.save_source_snapshot(budget, sources)
    payloads = {
        name: N.contained(N.ROOT, name).read_bytes()
        for name in plan["parent_dependencies"]
    }
    require(
        sum(map(len, payloads.values())) <= C.PARENT_ALLOWANCE,
        "bounded parent snapshot required",
    )
    for name, data in payloads.items():
        require(
            N.codec.sha(data) == plan["parent_dependencies"][name],
            "parent changed before snapshot",
        )
        budget.save("parent-snapshot/" + name, data)
    return N.codec.sha(raw)


def counts(rows):
    new_accepted = sum(row["additional_accepted_steps"] for row in rows)
    new_published = sum(row["additional_native_published_steps"] for row in rows)
    return dict(
        inherited_accepted_steps=49,
        additional_accepted_steps=new_accepted,
        additional_native_published_steps=new_published,
        combined_accepted_steps=49 + new_accepted,
        planned_additional_steps=49,
        planned_additional_rhs_stages=196,
    )


def temporal_screen(arrays, rows, driver, refinement):
    require(
        len(arrays) == len(rows) == 3
        and all(q.shape == (58, 13, 13, 13) and np.isfinite(q).all() for q in arrays),
        "three finite complete N13 endpoints required",
    )
    for row, steps in zip(rows, STEPS, strict=True):
        require(
            row["completed"] is True
            and row["additional_accepted_steps"] == steps
            and row["total_accepted_step"] == 2 * steps
            and row["dt"] == 1 / (16 * steps)
            and row["trajectory"][-1]["point"] == 2 * steps
            and row["trajectory"][-1]["time"] == 1 / 8,
            "three accepted common absolute end times required",
        )
    weights, masks = refinement["weights_and_regions"](driver)
    regions = {}
    for name in ("whole", "central_box", "faces", "edges", "corners"):
        errors = [
            refinement["weighted_rms"](np.moveaxis(a - b, 0, -1), weights, masks[name])
            for a, b in zip(arrays[:-1], arrays[1:], strict=True)
        ]
        regions[name] = dict(
            **refinement["order_record"](*errors, 2.0, 3.5, 4.5),
            minimum_difference_over_floor=min(errors) / 2e-13,
        )
    status = (
        "failed"
        if any(r["status"] == "failed" for r in regions.values())
        else "passed"
        if all(r["passed"] for r in regions.values())
        else "unresolved"
    )
    return dict(
        regions=regions,
        status=status,
        passed=status == "passed",
        floor=2e-13,
        minimum_order=3.5,
        maximum_order=4.5,
        origin_time=0.0,
        resume_time=1 / 16,
        time=1 / 8,
        additional_steps=[7, 14, 28],
        absolute_steps=[14, 28, 56],
        policy="none",
        analytic_evolution_reference=False,
        **FALSE_FLAGS,
    )


def evolve_cases(budget, result, reference, binding, measure):
    """A single failure stops the batch; no reset, retry or synthetic endpoint."""
    ends = []
    for row in result["cases"]:
        try:
            ends.append(
                C.run_case(
                    budget,
                    row,
                    reference,
                    binding,
                    result["global_plan_sha256"],
                    measure,
                )
            )
        except Exception as error:
            row.update(
                status="batch-aborted",
                completed=False,
                failure=f"{type(error).__name__}: {error}",
            )
            raise
        finally:
            result["counts"] = counts(result["cases"])
    return ends
