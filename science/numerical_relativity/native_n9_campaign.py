"""Fixed N9 gauge-pulse entry contract, reusing the qualified native solver.

No new RHS, N13 result reuse, arbitrary continuation, or physical promotion.
Scientific invocation remains separate from the bounded implementation controls.
"""

from __future__ import annotations

import copy
import io
import json
from pathlib import Path

import numpy as np

from . import native_campaign as N
from . import native_continuation_campaign as F
from . import native_spatial_preflight as P
from .fo_ccz4_gauge_pulse import identity as pulse_identity, initial_slots

PREFLIGHT = N.EVIDENCE / "nr-k3-spatial-preflight-controls-v1-20261011"
PREFLIGHT_SHA = "73a63092f6531eaad4e80f13b02788037a9fe2be82a95e42fc6ba360962cde54"
STEPS = (14, 28, 56)
DENOMINATORS = (112, 224, 448)
END_TIME = 0.125
CAPS = dict(
    seconds=2400,
    output_bytes=832 * 1024**2,
    headroom=32 * 1024**2,
    c_reserve=3 * 1024**3,
    e_reserve=4 * 1024**3 + 32 * 1024**2,
)
ENTRY_SOURCES = (
    "science/numerical_relativity/native_n9_campaign.py",
    "science/numerical_relativity/EXPERIMENT-20261011-native-n9-entry.md",
    "scripts/run-nr-k3-native-n9-gauge-pulse.py",
    "scripts/audit-nr-k3-native-n9-gauge-pulse.py",
    "scripts/tests/test_nr_native_n9_campaign.py",
    "scripts/run-nr-k3-native-n9-entry-controls.py",
    "scripts/nr-native-n9-entry-tests.ini",
)
EXPECTED_TESTS = 61
FALSE_FLAGS = dict(
    physical_gate=False,
    live_admission=False,
    scientificPayloadWriteback=False,
    spatial_order_validated=False,
    constraint_convergence_validated=False,
    independent_einstein_rhs_validated=False,
    python_endpoint_parity=False,
    exact_scientific_replay=False,
    old_n13_result_regraded=False,
    arbitrary_parent_continuation_qualified=False,
)
FIXTURE_KIND = "registration-only-no-evolution"


def source_closure():
    path = PREFLIGHT / "qualification-gate.json"
    N.require(N.sha(path) == PREFLIGHT_SHA, "qualified preflight changed")
    gate = json.loads(path.read_text(encoding="utf-8"))
    N.require(
        gate["completed"] is gate["passed"] is True and not gate["errors"],
        "passed preflight required",
    )
    F.verify_inventory(PREFLIGHT, gate, path.name)
    for phase, count, module in (
        ("preflight", 70, "scripts.tests.test_nr_native_spatial_preflight"),
        ("alignment-regression", 71, "scripts.tests.test_nr_constraint_grid_alignment"),
        ("field-regression", 77, "scripts.tests.test_nr_constraint_field_comparison"),
    ):
        F.check_xml(PREFLIGHT / (phase + ".xml"), count, module)
    sources = gate["source_after"]
    N.require(
        len(sources) == 412 and sources == gate["source_before"],
        "qualified412 source set required",
    )
    for name, digest in sources.items():
        N.require(
            N.sha(N.contained(N.ROOT, name)) == digest,
            "qualified source changed: " + name,
        )
        N.require(
            N.sha(N.contained(PREFLIGHT / "source-snapshot", name)) == digest,
            "qualified snapshot changed",
        )
    N.require(not set(sources).intersection(ENTRY_SOURCES), "additive entry required")
    return N.merge_source_tables(
        sources, {name: N.sha(N.ROOT / name) for name in ENTRY_SOURCES}
    )


def registered_cases():
    return [
        dict(
            label=f"native-n9-gauge-pulse-{steps}",
            n=9,
            steps=steps,
            dt=1 / denominator,
            status="not-attempted",
            completed=False,
            accepted_steps=0,
            native_published_steps=0,
            segments=[],
            trajectory=[],
        )
        for steps, denominator in zip(STEPS, DENOMINATORS, strict=True)
    ]


def validate_cases(rows):
    """Terminal receipt state machine: completed prefix, at most one failure."""
    N.require(type(rows) is list and len(rows) == 3, "fixed three-case matrix required")
    stopped = False
    for row, expected in zip(rows, registered_cases(), strict=True):
        N.require(
            all(
                type(row.get(k)) is type(expected[k]) and row[k] == expected[k]
                for k in ("label", "n", "steps", "dt")
            ),
            "fixed N9 case changed",
        )
        N.require(type(row.get("completed")) is bool, "boolean completion required")
        N.require(
            all(
                type(row.get(k)) is int
                for k in ("accepted_steps", "native_published_steps")
            ),
            "integer prefix required",
        )
        N.require(
            0 <= row["accepted_steps"] <= row["native_published_steps"] <= row["steps"],
            "invalid accepted/native prefix",
        )
        status = row.get("status")
        if status == "not-attempted":
            N.require(row == expected, "unattempted case contains results")
            stopped = True
        elif status == "completed":
            N.require(
                not stopped
                and row["completed"]
                and row["accepted_steps"]
                == row["native_published_steps"]
                == row["steps"],
                "false completion or run after stop",
            )
        elif status == "batch-aborted":
            N.require(
                not stopped
                and not row["completed"]
                and type(row.get("failure")) is str
                and row["failure"],
                "one explicit failed prefix required",
            )
            stopped = True
        else:
            raise ValueError("terminal case status required")


def counts(rows):
    validate_cases(rows)
    return dict(
        planned_steps=98,
        planned_rk_stages=392,
        accepted_steps=sum(r["accepted_steps"] for r in rows),
        native_published_steps=sum(r["native_published_steps"] for r in rows),
        completed_cases=sum(r["completed"] for r in rows),
        inherited_scientific_steps=0,
    )


def entry_qualification(path):
    path = Path(path).resolve()
    N.require(
        path.name == "qualification-gate.json" and path.parent.parent == N.EVIDENCE,
        "local entry gate required",
    )
    gate = json.loads(path.read_text(encoding="utf-8"))
    N.require(
        gate.get("schema") == "nr-native-n9-entry-controls-v1"
        and gate.get("completed") is True
        and gate.get("passed") is True
        and gate.get("returncode") == 0
        and not gate.get("errors"),
        "passed N9 entry controls required",
    )
    N.require(
        gate.get("source_before") == gate.get("source_after") == source_closure(),
        "entry source closure mismatch",
    )
    N.require(
        gate.get("tests") == EXPECTED_TESTS
        and gate.get("preflight_gate_sha256") == PREFLIGHT_SHA,
        "complete qualified entry test count required",
    )
    N.require(
        gate.get("registration_fixture_audited") is True
        and gate.get("real_pulse_multisegment_audited") is True
        and gate.get("real_failure_prefix_audited") is True,
        "real entry controls required",
    )
    for flag in (*FALSE_FLAGS, "full_scientific_matrix_executed"):
        N.require(gate.get(flag) is False, "control evidence cannot promote physics")
    F.verify_inventory(path.parent, gate, path.name)
    F.check_xml(
        path.parent / "tests.xml",
        EXPECTED_TESTS,
        "scripts.tests.test_nr_native_n9_campaign",
    )
    N.require(
        N.sha(path.parent / "tests.xml") == gate["xml_sha256"], "entry XML changed"
    )
    for name, digest in gate["source_after"].items():
        N.require(
            N.sha(N.contained(path.parent / "source-snapshot", name)) == digest,
            "entry snapshot changed",
        )
    observed = json.loads(
        (path.parent / "control-observations.json").read_text(encoding="utf-8")
    )
    N.require(
        observed["registration_fixture_audited"] is True
        and observed["pulse_accepted_steps"] == 3
        and observed["pulse_rhs_stages_audited"] == 12
        and observed["failure_accepted_steps"] == 1
        and observed["failure_native_published_steps"] == 2
        and observed["full_scientific_matrix_executed"] is False,
        "control observations incomplete",
    )
    return dict(
        path=path.relative_to(N.ROOT).as_posix(),
        sha256=N.sha(path),
        tests=EXPECTED_TESTS,
        xml_sha256=gate["xml_sha256"],
        full_scientific_matrix_executed=False,
    )


def prepare(sources, tests):
    N.require(
        len(sources) == 419 and sources == source_closure(),
        "exact N9 source closure required",
    )
    identity, binding, _ = N.native_identity()
    initial, reference = initial_slots(9)
    checks = [P.case_report(P.Case(9, d)) for d in DENOMINATORS]
    N.require(
        all(r["initial_cfl_accepted"] for r in checks), "initial CFL preflight failed"
    )
    N.require(
        all(
            r["initial_sha256"] == N.codec.sha(initial.tobytes())
            and r["reference_sha256"] == N.codec.sha(reference.tobytes())
            for r in checks
        ),
        "initial preflight binding changed",
    )
    bound = P.storage_bound(9, STEPS)
    N.require(
        bound == 663852768 and bound <= N.OUTPUT_CAP,
        "original N9 resource bound changed",
    )
    plan = dict(
        schema="nr-native-n9-gauge-plan-v1",
        n=9,
        origin_time=0.0,
        end_time=END_TIME,
        lower=[1.0] * 3,
        upper=[3.0] * 3,
        case_matrix=registered_cases(),
        segment_steps=2,
        initial_identity=pulse_identity(),
        initial_state_sha256=N.codec.sha(initial.tobytes()),
        reference_state_sha256=N.codec.sha(reference.tobytes()),
        initial_cfl_checks=checks,
        source_sha256=N.codec.sha(N.json_bytes(sources)),
        native_identity=identity,
        entry_qualification=tests,
        preflight_gate_sha256=PREFLIGHT_SHA,
        resource_caps=CAPS,
        worst_case_bytes=bound,
        state_error_interpretation="departure from static background, not exact positive-time error",
        **FALSE_FLAGS,
    )
    return plan, binding, initial, reference


def save_registration(budget, plan, binding, initial, reference, sources):
    budget.record("global-plan.json", plan)
    budget.record("registered-cases.json", plan["case_matrix"])
    budget.save("binding.txt", binding)
    for name, value in (("initial", initial), ("reference", reference)):
        buffer = io.BytesIO()
        np.save(buffer, value, allow_pickle=False)
        budget.save(name + ".npy", buffer.getvalue())
    N.save_source_snapshot(budget, sources)


def new_receipt(plan, sources, *, fixture=False):
    return dict(
        schema="nr-native-n9-gauge-pulse-v1",
        completed=False,
        errors=[],
        fixture_kind=FIXTURE_KIND if fixture else None,
        source_before=sources,
        source_after={},
        cases=copy.deepcopy(plan["case_matrix"]),
        entry_qualification=plan["entry_qualification"],
        native_identity=plan["native_identity"],
        resource_caps=CAPS,
        worst_case_bytes=plan["worst_case_bytes"],
        snapshot_completed=False,
        global_plan="global-plan.json",
        global_plan_sha256=N.codec.sha(N.json_bytes(plan)),
        temporal_screen=None,
        temporal_screen_passed=False,
        counts=counts(plan["case_matrix"]),
        **FALSE_FLAGS,
    )


def evolve_cases(budget, result, mesh, initial, reference, binding, measure):
    N.require(
        result["fixture_kind"] is None and result["snapshot_completed"] is True,
        "scientific registration required",
    )
    N.require(
        result["cases"] == registered_cases(), "fresh exact case registration required"
    )
    ends = []
    for row in result["cases"]:
        try:
            budget.guard()
            ends.append(
                N.run_case(
                    budget,
                    row,
                    mesh,
                    initial,
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
    return ends


def temporal_screen(arrays, driver, refinement):
    N.require(
        len(arrays) == 3
        and all(
            q.shape == (58, 9, 9, 9) and q.dtype == np.float64 and np.isfinite(q).all()
            for q in arrays
        ),
        "three finite full N9 endpoints required",
    )
    N.require(driver.volume.grid.shape == (9,) * 3, "fixed N9 norm grid required")
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
        time=END_TIME,
        steps=list(STEPS),
        policy="none",
        spatial_order_validated=False,
        analytic_evolution_reference=False,
        physical_gate=False,
    )
