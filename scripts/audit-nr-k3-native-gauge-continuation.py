"""Whole fixed-continuation saved-evidence audit; no new numerical evolution."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import runpy
import shutil
import sys
import xml.etree.ElementTree as ET

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity import native_checkpoint as codec  # noqa: E402

B = runpy.run_path(str(ROOT / "scripts/audit-nr-k3-native-continuation.py"))
A = B["A"]
require, sha, path_in = codec.require, A["sha"], A["path_in"]
EVIDENCE = ROOT / "tmp/nr-shadow-evidence"
PARENT = EVIDENCE / "nr-k3-native-gauge-pulse-v2-20261010"
PARENT_SHA = "6cc32e3c34d4a86ac6f1a6e75bf596e5ae1cb4c120dd95210f23df72d2359341"
PARENT_AUDIT = EVIDENCE / "nr-k3-native-gauge-pulse-v2-audit-20261010.json"
PARENT_AUDIT_SHA = "35cc5a9beb5aa2f219099339941c38f7f3ff26fb584694bd158f11eb21a07537"
COMPONENT = EVIDENCE / "nr-k3-native-continuation-controls-v1-20261010"
COMPONENT_GATE_SHA = "01b6ce1863b556ad7fc084bcfad17943bf931117808cd5c4166484c24386f01d"
COMPONENT_RECEIPT_SHA = (
    "9b0f536263c464a7baad43861934b639be0731988bfffa6955287210b246254b"
)
COMPONENT_XML_SHA = "4701340176cec2430b57d69cdb81976a34eb7bddc44d2eb81af472c95d75b086"
CAPS = dict(
    seconds=2400,
    output_bytes=832 * 1024**2,
    headroom=32 * 1024**2,
    c_reserve=3 * 1024**3,
    e_reserve=4 * 1024**3 + 32 * 1024**2,
)
FALSE = (
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
    "spatial_order_validated",
    "constraint_convergence_validated",
    "new_interval_python_parity",
    "old_failure_regraded",
    "exact_scientific_replay",
)
EXTRA = (
    "science/numerical_relativity/native_continuation_campaign.py",
    "science/numerical_relativity/EXPERIMENT-20261010-native-gauge-continuation.md",
    "scripts/run-nr-k3-native-gauge-continuation.py",
    "scripts/audit-nr-k3-native-gauge-continuation.py",
    "scripts/tests/test_nr_native_continuation_campaign.py",
    "scripts/run-nr-k3-native-continuation-entry-controls.py",
    "scripts/nr-native-continuation-entry-tests.ini",
)


def inventory(directory, table, exclude):
    files = {
        p.relative_to(directory).as_posix()
        for p in directory.rglob("*")
        if p.is_file() and p != exclude
    }
    require(files == set(table), "complete audit inventory required")
    for name, digest in table.items():
        require(
            sha(path_in(directory, name)) == digest,
            "audit artifact hash changed: " + name,
        )
    return len(files)


def source_table():
    require(
        sha(COMPONENT / "control-receipt.json") == COMPONENT_RECEIPT_SHA,
        "component receipt changed",
    )
    inherited = json.loads(
        (COMPONENT / "control-receipt.json").read_text(encoding="utf-8")
    )["source_after"]
    result = dict(inherited)
    for name in EXTRA:
        require(name not in result, "new source overlaps frozen parent")
        result[name] = sha(ROOT / name)
    return dict(sorted(result.items()))


def expected_registration(parent):
    rows = []
    for steps, old in zip((7, 14, 28), parent["cases"], strict=True):
        require(
            old["steps"] == old["accepted_steps"] == steps
            and old["dt"] == 1 / (16 * steps),
            "fixed parent time matrix required",
        )
        point = old["trajectory"][-1]
        link = dict(
            schema="nr-native-parent-anchor-v1",
            kind="gauge-pulse-v2",
            receipt=(PARENT / "receipt.json").relative_to(ROOT).as_posix(),
            receipt_sha256=PARENT_SHA,
            case=f"native-gauge-pulse-13-{steps}",
            n=13,
            point=steps,
            time=1 / 16,
            dt=1 / (16 * steps),
            checkpoint=(PARENT / point["checkpoint"]).relative_to(ROOT).as_posix(),
            checkpoint_sha256=point["checkpoint_sha256"],
            state_sha256=point["state_sha256"],
            plan_sha256=point["segment_plan_sha256"],
            method=codec.METHOD,
            physical_gate=False,
            live_admission=False,
            scientificPayloadWriteback=False,
        )
        rows.append(
            dict(
                label=f"native-gauge-continuation-13-{steps}",
                n=13,
                dt=1 / (16 * steps),
                start_step=steps,
                additional_steps=steps,
                end_step=2 * steps,
                origin_time=0.0,
                resume_time=1 / 16,
                end_time=1 / 8,
                parent=link,
                completed=False,
                status="not-attempted",
                additional_accepted_steps=0,
                additional_native_published_steps=0,
                total_accepted_step=steps,
                total_native_published_step=steps,
                segments=[],
                trajectory=[],
                physical_gate=False,
                live_admission=False,
                scientificPayloadWriteback=False,
            )
        )
    return rows


def validate_registration(data, plan, registered, parent):
    for obj in (data, plan):
        require(
            all(obj.get(key) is False for key in FALSE),
            "unadmitted scientific scope required",
        )
        require(
            obj.get("resource_caps") == CAPS
            and obj.get("worst_case_bytes") == 848056576,
            "original fixed resource contract required",
        )
        require(
            obj.get("parent_self_contained") is False,
            "external parent dependencies must remain explicit",
        )
    require(
        plan.get("schema") == "nr-native-gauge-continuation-plan-v1"
        and (
            plan.get("n"),
            plan.get("lower"),
            plan.get("upper"),
            plan.get("origin_time"),
            plan.get("resume_time"),
            plan.get("end_time"),
            plan.get("segment_steps"),
        )
        == (13, [1.0] * 3, [3.0] * 3, 0.0, 1 / 16, 1 / 8, 2),
        "fixed absolute scientific interval required",
    )
    expected = expected_registration(parent)
    require(
        registered == plan.get("case_matrix") == expected,
        "three exact preregistered absolute-time cases required",
    )
    require(
        plan.get("parent_receipt_sha256") == PARENT_SHA
        and plan.get("parent_audit_sha256") == PARENT_AUDIT_SHA,
        "fixed completed parent evidence required",
    )
    require(
        plan.get("initial_identity") == A["INITIAL"]["INITIAL_IDENTITY"],
        "original physical initial identity required",
    )
    require(len(data["cases"]) == 3, "three case records required")
    for row, spec in zip(data["cases"], expected, strict=True):
        for key in (
            "label",
            "n",
            "dt",
            "start_step",
            "additional_steps",
            "end_step",
            "origin_time",
            "resume_time",
            "end_time",
            "parent",
        ):
            require(
                row.get(key) == spec[key], "continuation case matrix altered: " + key
            )
    return expected


def temporal(arrays):
    require(
        len(arrays) == 3
        and all(q.shape == (58, 13, 13, 13) and np.isfinite(q).all() for q in arrays),
        "three finite final N13 states required",
    )
    w = np.ones(13)
    w[:4] = np.array([17.0, 59.0, 43.0, 49.0]) / 48
    w[-4:] = w[:4][::-1]
    w /= 6
    weights = w[:, None, None] * w[None, :, None] * w[None, None, :]
    indices = np.indices((13,) * 3)
    edges = np.sum((indices == 0) | (indices == 12), axis=0)
    masks = dict(
        whole=np.ones((13,) * 3, bool),
        central_box=np.all((indices >= 3) & (indices <= 9), axis=0),
        faces=edges == 1,
        edges=edges == 2,
        corners=edges == 3,
    )
    regions = {}
    for name, mask in masks.items():
        errors = []
        for left, right in zip(arrays[:-1], arrays[1:], strict=True):
            node = np.sum((left - right) ** 2, axis=0) / 58
            errors.append(
                math.sqrt(
                    math.fsum((node[mask] * weights[mask]).tolist())
                    / math.fsum(weights[mask].tolist())
                )
            )
        resolved = min(errors) > 2e-13
        order = math.log2(errors[0] / errors[1]) if resolved else None
        passed = bool(resolved and errors[0] > errors[1] and 3.5 <= order <= 4.5)
        regions[name] = dict(
            coarse_error=errors[0],
            fine_error=errors[1],
            refinement_ratio=2.0,
            floor=2e-13,
            observed_order=order,
            resolved=resolved,
            passed=passed,
            status="passed" if passed else "failed" if resolved else "unresolved",
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
        **dict.fromkeys(FALSE, False),
    )


def audit_test_gate(proof, expected_sources):
    gate_path = path_in(ROOT, proof["gate"])
    require(
        gate_path.parent.parent == EVIDENCE and sha(gate_path) == proof["gate_sha256"],
        "bound entry qualification required",
    )
    gate = json.loads(gate_path.read_text(encoding="utf-8"))
    require(
        gate["schema"] == "nr-native-continuation-entry-controls-v1"
        and gate["passed"] is gate["completed"] is True
        and gate["returncode"] == 0
        and not gate["errors"]
        and gate["registration_fixture_audited"] is True,
        "passed complete entry qualification required",
    )
    require(
        gate["source_before"] == gate["source_after"] == expected_sources
        and gate["component_gate_sha256"] == COMPONENT_GATE_SHA,
        "exact entry test source set required",
    )
    inventory(gate_path.parent, gate["artifact_hashes"], gate_path)
    xml = gate_path.parent / "tests.xml"
    require(
        sha(xml) == gate["xml_sha256"] == proof["xml_sha256"],
        "test XML identity changed",
    )
    cases = list(ET.parse(xml).getroot().iter("testcase"))
    require(
        len(cases)
        == len({c.get("name") for c in cases})
        == gate["tests"]
        == proof["tests"]
        == 60
        and {c.get("classname") for c in cases}
        == {"scripts.tests.test_nr_native_continuation_campaign"}
        and not any(x.tag in ("failure", "error", "skipped") for c in cases for x in c),
        "complete zero-skip entry tests required",
    )
    for key in (
        "physical_gate",
        "live_admission",
        "scientificPayloadWriteback",
        "new_scientific_evolution",
    ):
        require(gate.get(key) is False, "test evidence cannot claim physics")


def audit(path, *, allow_registration_fixture=False):
    path = Path(path).resolve()
    directory = path.parent
    data = json.loads(path.read_text(encoding="utf-8"))
    require(
        data["schema"] == "nr-native-gauge-continuation-v1"
        and data["source_before"] == data["source_after"],
        "source-frozen continuation receipt required",
    )
    artifact_count = inventory(directory, data["artifact_hashes"], path)
    sources = source_table()
    require(
        data["source_after"] == sources,
        "complete unique continuation source closure required",
    )
    for name, digest in sources.items():
        require(
            sha(path_in(ROOT, name)) == digest
            and sha(path_in(directory / "source-snapshot", name)) == digest,
            "current/saved source drift",
        )
    require(
        sha(PARENT / "receipt.json") == PARENT_SHA
        and sha(PARENT_AUDIT) == PARENT_AUDIT_SHA,
        "pinned parent evidence changed",
    )
    parent = json.loads((PARENT / "receipt.json").read_text(encoding="utf-8"))
    require(
        parent["completed"] is True and not parent["errors"],
        "fully completed parent required",
    )
    parent_artifacts = inventory(
        PARENT, parent["artifact_hashes"], PARENT / "receipt.json"
    )
    expected_parent_check = dict(
        kind="gauge-pulse-v2",
        receipt_sha256=PARENT_SHA,
        artifacts_checked=parent_artifacts,
        inherited_tests=208,
        inherited_source_count=len(parent["source_after"]),
        native_identity=parent["native_identity"],
        cases=[r["label"] for r in parent["cases"]],
        new_evolution=False,
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
    )
    require(
        data.get("parent_check") == expected_parent_check,
        "whole-parent preflight claim changed",
    )
    raw = path_in(directory, data["global_plan"]).read_bytes()
    require(
        codec.sha(raw) == data["global_plan_sha256"],
        "global continuation plan SHA changed",
    )
    plan = json.loads(raw)
    registered = json.loads(
        (directory / "registered-cases.json").read_text(encoding="utf-8")
    )
    expected = validate_registration(data, plan, registered, parent)
    source_raw = (
        json.dumps(
            sources,
            sort_keys=True,
            ensure_ascii=True,
            allow_nan=False,
            separators=(",", ":"),
        )
        + "\n"
    ).encode()
    require(
        plan["source_sha256"] == hashlib.sha256(source_raw).hexdigest(),
        "global source binding changed",
    )
    dependency_paths = [
        PARENT / n
        for n in (
            "receipt.json",
            "global-plan.json",
            "registered-cases.json",
            "binding.txt",
        )
    ]
    dependency_paths += [PARENT_AUDIT] + [
        ROOT / row["parent"]["checkpoint"] for row in expected
    ]
    dependencies = {p.relative_to(ROOT).as_posix(): sha(p) for p in dependency_paths}
    require(
        data["parent_dependencies"] == plan["parent_dependencies"] == dependencies,
        "complete parent dependency links required",
    )
    for name, digest in dependencies.items():
        require(
            sha(path_in(directory / "parent-snapshot", name)) == digest,
            "parent snapshot differs from external dependency",
        )
    require(
        sha(COMPONENT / "qualification-gate.json") == COMPONENT_GATE_SHA
        and sha(COMPONENT / "tests.xml") == COMPONENT_XML_SHA,
        "component qualification changed",
    )
    component_gate = json.loads(
        (COMPONENT / "qualification-gate.json").read_text(encoding="utf-8")
    )
    inventory(
        COMPONENT,
        component_gate["artifact_hashes"],
        COMPONENT / "qualification-gate.json",
    )
    component_proof = dict(
        gate=(COMPONENT / "qualification-gate.json").relative_to(ROOT).as_posix(),
        gate_sha256=COMPONENT_GATE_SHA,
        receipt_sha256=COMPONENT_RECEIPT_SHA,
        xml_sha256=COMPONENT_XML_SHA,
        tests=52,
        current_sources=389,
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
    )
    require(
        plan["component_qualification"]
        == data["component_qualification"]
        == component_proof,
        "component proof mismatch",
    )
    fixture = data.get("fixture_kind")
    if fixture is not None:
        require(
            allow_registration_fixture
            and fixture == "registration-only-no-evolution"
            and data["entry_qualification"]
            == plan["entry_qualification"]
            == {"mode": "registration-fixture-not-qualified"},
            "registration fixture is not a qualified scientific run",
        )
        require(
            data["cases"] == expected
            and data["completed"] is False
            and data["errors"] == ["explicit registration-only fixture"],
            "fixture cannot contain evolution or completion",
        )
    else:
        require(
            plan["entry_qualification"] == data["entry_qualification"],
            "entry qualification link changed",
        )
        audit_test_gate(data["entry_qualification"], sources)
    require(
        data.get("snapshot_completed") is True,
        "full registration snapshot required for audit",
    )
    require(
        data["native_identity"] == plan["native_identity"] == parent["native_identity"],
        "qualified native identity mismatch",
    )
    identity = data["native_identity"]
    binary_paths = {
        ROOT
        / "tmp/nr-native-checkpoint-build-v2-20261010/Release/nr-checkpoint-component.exe": identity[
            "checkpoint_executable_sha256"
        ],
        ROOT
        / "tmp/nr-native-rk4-build-v1-20261010/Release/nr-rk4-component.exe": identity[
            "trace_executable_sha256"
        ],
        ROOT
        / "tmp/nr-native-checkpoint-build-v2-20261010/source-identity.txt": identity[
            "compiled_source_sha256"
        ],
    }
    binary_paths.update(
        {Path(name): digest for name, digest in identity["runtimes"].items()}
    )
    require(
        all(sha(p) == digest for p, digest in binary_paths.items()),
        "current native executable/runtime changed",
    )
    binding = (PARENT / "binding.txt").read_bytes()
    require(
        (directory / "binding.txt").read_bytes() == binding,
        "inherited native binding changed",
    )
    initial, reference = (
        np.load(directory / name, allow_pickle=False)
        for name in ("initial.npy", "reference.npy")
    )
    require(
        codec.sha(initial.tobytes()) == plan["original_initial_state_sha256"]
        and codec.sha(reference.tobytes()) == plan["reference_state_sha256"],
        "common initial/reference SHA changed",
    )
    initial_check = A["INITIAL"]["check_initial"](
        initial, reference, initial - reference
    )
    checked, finals = [], []
    for row, spec in zip(data["cases"], expected, strict=True):
        B["audit_anchor"](row["parent"], binding, reference)
        if row["status"] == "not-attempted":
            require(row == spec, "unattempted row contains scientific results")
            checked.append(
                dict(
                    additional_accepted_steps=0,
                    additional_native_published_steps=0,
                    rhs_stages_audited=0,
                )
            )
            continue
        checked.append(
            B["audit_case"](
                directory, row, reference, binding, data["global_plan_sha256"]
            )
        )
        if row["completed"]:
            point = row["trajectory"][-1]
            require(
                point["time"] == 1 / 8 and point["point"] == spec["end_step"],
                "final absolute time differs",
            )
            finals.append(
                codec.decode(
                    path_in(directory, point["checkpoint"]).read_bytes(),
                    binding,
                    point["segment_plan_sha256"],
                )["q"]
            )
    accepted = sum(r["additional_accepted_steps"] for r in checked)
    published = sum(r["additional_native_published_steps"] for r in checked)
    require(
        data["counts"]
        == dict(
            inherited_accepted_steps=49,
            additional_accepted_steps=accepted,
            additional_native_published_steps=published,
            combined_accepted_steps=49 + accepted,
            planned_additional_steps=49,
            planned_additional_rhs_stages=196,
        ),
        "inherited and additional counts conflated",
    )
    complete = all(r["completed"] for r in data["cases"]) and not data["errors"]
    require(data["completed"] is complete, "false batch completion")
    screen = (
        temporal(finals)
        if len(finals) == 3 and data["temporal_screen"] is not None
        else None
    )
    if screen is not None:
        A["INITIAL"]["compare_screen"](data["temporal_screen"], screen)
    else:
        require(
            data["temporal_screen"] is None,
            "partial continuation cannot establish time order",
        )
        require(not complete, "a completed full matrix must include temporal analysis")
    require(
        data["temporal_screen_passed"]
        is bool(complete and screen and screen["passed"]),
        "false temporal admission",
    )
    return dict(
        schema="nr-native-gauge-continuation-audit-v1",
        audit_completed=True,
        receipt_sha256=sha(path),
        artifact_count=artifact_count,
        parent_artifacts_checked=parent_artifacts,
        source_count=len(sources),
        physical_experiment_completed=complete,
        registration_fixture=bool(fixture),
        entry_test_gate_revalidated=not bool(fixture),
        cases=checked,
        initial_data=initial_check,
        independent_temporal_screen=screen,
        additional_scientific_steps=accepted,
        additional_native_steps=published,
        additional_rhs_stages_audited=sum(r["rhs_stages_audited"] for r in checked),
        rhs_recomputed=False,
        **dict.fromkeys(FALSE, False),
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    receipt, output = args.receipt.resolve(), args.output.resolve()
    require(
        receipt.parent.parent == EVIDENCE
        and output.parent == EVIDENCE
        and not output.exists(),
        "fresh bounded audit destination required",
    )
    require(
        shutil.disk_usage("C:/").free >= CAPS["c_reserve"]
        and shutil.disk_usage(ROOT).free >= CAPS["e_reserve"] + 1024**2,
        "unchanged disk floors required",
    )
    result = audit(receipt)
    result["auditor_sha256"] = sha(Path(__file__))
    with output.open("x", encoding="utf-8") as stream:
        json.dump(result, stream, sort_keys=True, indent=2, allow_nan=False)
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
