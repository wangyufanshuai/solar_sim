"""Saved N9 stage/geometry/constraint audit, never an evolution or RHS replay."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import runpy
import sys

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity import native_campaign as N  # noqa: E402
from science.numerical_relativity import native_continuation_campaign as F  # noqa: E402
from science.numerical_relativity import native_n9_campaign as S  # noqa: E402

OLD = runpy.run_path(str(ROOT / "scripts/audit-nr-k3-native-gauge-pulse.py"))
require = N.require


def check_initial(initial, reference):
    """Independent factorized analytic N9 pulse, without production initial data."""
    require(
        all(
            q.shape == (58, 9, 9, 9) and q.dtype == np.float64 and np.isfinite(q).all()
            for q in (initial, reference)
        ),
        "finite N9 initial pair required",
    )
    keep = [k for k in range(58) if k not in (6, 25, 26, 27)]
    require(
        initial[keep].tobytes() == reference[keep].tobytes(),
        "physical initial slots changed",
    )
    xyz = np.meshgrid(*(np.linspace(1.0, 3.0, 9) for _ in range(3)), indexing="ij")
    radius = np.sqrt(sum(x * x for x in xyz))
    analytic = np.zeros_like(reference)
    analytic[[0, 3, 5]] = 1.0
    analytic[6] = np.log((2 * radius - 1) / (2 * radius + 1))
    analytic[10] = -2 * np.log(1 + 0.5 / radius)
    for k in range(3):
        analytic[25 + k] = 4 * xyz[k] / (radius * (4 * radius**2 - 1))
        analytic[55 + k] = xyz[k] / (radius**2 * (radius + 0.5))
    reference_error = float(np.max(abs(reference - analytic)))
    u = [(x - 2) / 0.75 for x in xyz]
    factors = [np.where(abs(v) < 1, (1 - v) ** 6 * (1 + v) ** 6, 0.0) for v in u]
    gradients = [
        np.where(
            abs(v) < 1,
            8 * ((1 - v) ** 6 * (1 + v) ** 5 - (1 - v) ** 5 * (1 + v) ** 6),
            0.0,
        )
        for v in u
    ]
    expected = reference.copy()
    expected[6] += 0.001 * factors[0] * factors[1] * factors[2]
    for k in range(3):
        expected[25 + k] += (
            0.001 * gradients[k] * factors[(k + 1) % 3] * factors[(k + 2) % 3]
        )
    initial_error = float(np.max(abs(initial - expected)))
    require(
        reference_error <= 2e-14 and initial_error <= 2e-14,
        "analytic initial pair differs",
    )
    require(float(np.max(abs(initial[6] - reference[6]))) > 0.00099, "missing pulse")
    boundary = np.logical_or.reduce([(x == 1) | (x == 3) for x in xyz])
    require(
        initial[:, boundary].tobytes() == reference[:, boundary].tobytes(),
        "initial boundary differs",
    )
    return dict(
        analytic_initial_max_difference=initial_error,
        analytic_reference_max_difference=reference_error,
        physical_initial_slots_byte_exact=True,
        initial_boundary_byte_exact=True,
        einstein_constraint_solve=False,
    )


def temporal(arrays):
    require(
        len(arrays) == 3
        and all(
            q.shape == (58, 9, 9, 9) and q.dtype == np.float64 and np.isfinite(q).all()
            for q in arrays
        ),
        "three finite N9 endpoints required",
    )
    w = np.ones(9)
    w[:4] = np.array([17.0, 59.0, 43.0, 49.0]) / 48
    w[-4:] = w[:4][::-1]
    w /= 4
    weights = w[:, None, None] * w[None, :, None] * w[None, None, :]
    indices = np.indices((9,) * 3)
    count = sum(((i == 0) | (i == 8)).astype(int) for i in indices)
    masks = dict(
        whole=np.ones((9,) * 3, bool),
        central_box=np.logical_and.reduce([(i >= 2) & (i <= 6) for i in indices]),
        faces=count == 1,
        edges=count == 2,
        corners=count == 3,
    )
    regions = {}
    for name, mask in masks.items():
        errors = []
        for a, b in zip(arrays[:-1], arrays[1:], strict=True):
            node = np.sum((a - b) ** 2, axis=0) / 58
            errors.append(
                math.sqrt(
                    math.fsum((node[mask] * weights[mask]).tolist())
                    / math.fsum(weights[mask].tolist())
                )
            )
        require(
            all(math.isfinite(v) for v in errors), "finite temporal errors required"
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
        time=0.125,
        steps=[14, 28, 56],
        policy="none",
        spatial_order_validated=False,
        analytic_evolution_reference=False,
        physical_gate=False,
    )


def check_ledger(directory, row):
    """Persisted journals and successful invocation terminals must agree too."""
    checked = 0
    for segment in row["segments"]:
        stem = Path(segment["plan"]).parent
        for offset, point in enumerate(segment["native_points"]):
            raw = N.contained(
                directory, str(stem / f"manifest-{offset}.json")
            ).read_bytes()
            terminal = json.loads(
                N.contained(
                    directory, str(stem / f"checkpoint-{offset}.terminal.json")
                ).read_text(encoding="utf-8")
            )
            require(
                terminal
                == dict(
                    returncode=0, stdout_bytes=len(raw), stdout_sha256=N.codec.sha(raw)
                ),
                "checkpoint terminal differs",
            )
            index = segment["start"] + offset
            path = (
                N.contained(directory, segment["plan"])
                if offset == 0
                else N.contained(
                    directory, str(stem / "checkpoints" / f"step-{index:016d}.nrck")
                )
            )
            expected = [
                str(N.CHECKPOINT_EXE),
                "--lapack",
                str(N.LIBRARY),
                "--threads",
                "2" if offset == 0 else "4",
                "--plan" if offset == 0 else "--restart",
                str(path),
                "--plan-sha",
                segment["plan_sha256"],
                "--output",
                str(N.contained(directory, str(stem / "checkpoints"))),
                "--advance",
                "1",
            ]
            attempt = json.loads(
                N.contained(
                    directory, str(stem / f"checkpoint-{offset}.attempt.json")
                ).read_text(encoding="utf-8")
            )
            require(
                attempt == dict(command=expected, status="attempted"),
                "checkpoint command differs",
            )
            require(point["point"] == index + 1, "checkpoint point differs")
            checked += 1
        if "trace" in segment:
            terminal = json.loads(
                N.contained(directory, str(stem / "trace.terminal.json")).read_text(
                    encoding="utf-8"
                )
            )
            require(
                terminal
                == dict(
                    returncode=0,
                    stdout_bytes=segment["trace_bytes"],
                    stdout_sha256=segment["trace_sha256"],
                ),
                "trace terminal differs",
            )
            expected = [
                str(N.RK_EXE),
                "--lapack",
                str(N.LIBRARY),
                "--mode",
                "trajectory",
                "--threads",
                "1",
            ]
            attempt = json.loads(
                N.contained(directory, str(stem / "trace.attempt.json")).read_text(
                    encoding="utf-8"
                )
            )
            require(
                attempt == dict(command=expected, status="attempted"),
                "trace command differs",
            )
            checked += 1
            raw = OLD["expand"](
                N.contained(directory, segment["trace"]).read_bytes(),
                segment["trace_bytes"],
            )
            meta = json.loads(raw.split(b"\n", 1)[0])
            for step in meta["trace"]:
                for stage in step["stages"]:
                    require(
                        [(f["axis"], f["side"]) for f in stage["faces"]]
                        == [(a, s) for a in range(3) for s in range(2)],
                        "six ordered stage faces required",
                    )
        for point in segment["points"]:
            journal = json.loads(
                N.contained(
                    directory, str(stem / f"point-{point['point']:04d}.json")
                ).read_text(encoding="utf-8")
            )
            require(journal == point, "persisted endpoint journal differs")
        if segment["status"] == "completed":
            journal = json.loads(
                N.contained(directory, str(stem / "segment-completed.json")).read_text(
                    encoding="utf-8"
                )
            )
            require(journal == segment, "persisted segment journal differs")
    return checked


def audit(path, *, allow_registration_fixture=False, guard=lambda: None):
    path = Path(path).resolve()
    directory = path.parent
    require(
        directory.is_relative_to(N.EVIDENCE) and path.name == "receipt.json",
        "local N9 receipt required",
    )
    data = json.loads(path.read_text(encoding="utf-8"))
    require(data.get("schema") == "nr-native-n9-gauge-pulse-v1", "N9 receipt required")
    fixture = data.get("fixture_kind") == S.FIXTURE_KIND
    require(
        data.get("fixture_kind") is None or fixture and allow_registration_fixture,
        "scientific audit rejects control fixture",
    )
    require(
        data.get("snapshot_completed") is True,
        "complete registration snapshot required",
    )
    for key in S.FALSE_FLAGS:
        require(data.get(key) is False, "unadmitted N9 scope required")
    F.verify_inventory(directory, data, path.name)
    guard()
    sources = S.source_closure()
    require(
        data.get("source_before") == data.get("source_after") == sources,
        "exact N9 source closure required",
    )
    for name, digest in sources.items():
        require(
            N.sha(N.contained(directory / "source-snapshot", name)) == digest,
            "saved source changed",
        )
    tests = (
        dict(mode="registration-fixture-not-qualified")
        if fixture
        else S.entry_qualification(
            N.contained(ROOT, data["entry_qualification"]["path"])
        )
    )
    require(data.get("entry_qualification") == tests, "entry test proof changed")
    expected_plan, binding, expected_initial, expected_reference = S.prepare(
        sources, tests
    )
    raw = N.contained(directory, data["global_plan"]).read_bytes()
    plan = json.loads(raw)
    require(
        data["global_plan"] == "global-plan.json"
        and N.json_bytes(plan) == N.json_bytes(expected_plan)
        and N.codec.sha(raw) == data["global_plan_sha256"],
        "fixed N9 global plan changed",
    )
    registered = json.loads(
        (directory / "registered-cases.json").read_text(encoding="utf-8")
    )
    require(
        N.json_bytes(registered) == N.json_bytes(S.registered_cases()),
        "original N9 registration changed",
    )
    require(
        data["native_identity"] == plan["native_identity"]
        and data["resource_caps"] == S.CAPS
        and data["worst_case_bytes"] == 663852768,
        "native/resource contract changed",
    )
    require(
        (directory / "binding.txt").read_bytes() == binding, "binding artifact changed"
    )
    initial, reference = (
        np.load(directory / (name + ".npy"), allow_pickle=False)
        for name in ("initial", "reference")
    )
    require(
        initial.tobytes() == expected_initial.tobytes()
        and reference.tobytes() == expected_reference.tobytes(),
        "frozen initial bytes differ",
    )
    initial_check = check_initial(initial, reference)
    S.validate_cases(data["cases"])
    require(
        N.json_bytes(data["counts"]) == N.json_bytes(S.counts(data["cases"])),
        "scientific counts changed",
    )
    if fixture:
        require(
            data["cases"] == registered
            and data["errors"] == ["explicit registration-only fixture"],
            "fixture contains evolution",
        )
    checked, finals, calls = [], [], 0
    for row in data["cases"]:
        guard()
        if row["status"] == "not-attempted" or not row["trajectory"]:
            require(
                row["accepted_steps"] == row["native_published_steps"] == 0
                and not row["segments"],
                "empty trajectory with published work",
            )
            checked.append(
                dict(accepted_steps=0, native_published_steps=0, rhs_stages_audited=0)
            )
            continue
        checked.append(
            OLD["audit_case"](
                directory, row, initial, reference, binding, data["global_plan_sha256"]
            )
        )
        calls += check_ledger(directory, row)
        if row["completed"]:
            point = row["trajectory"][-1]
            require(point["time"] == 0.125, "wrong scientific endpoint time")
            finals.append(
                N.codec.decode(
                    N.contained(directory, point["checkpoint"]).read_bytes(),
                    binding,
                    point["segment_plan_sha256"],
                )["q"]
            )
    completed = not data["errors"] and all(r["completed"] for r in data["cases"])
    require(data["completed"] is completed, "batch completion regraded")
    screen = temporal(finals) if len(finals) == 3 else None
    if screen is None:
        require(data["temporal_screen"] is None, "partial run cannot claim a screen")
    else:
        OLD["INITIAL"]["compare_screen"](data["temporal_screen"], screen)
    require(
        data["temporal_screen_passed"]
        is bool(completed and screen and screen["passed"]),
        "temporal screen regraded",
    )
    guard()
    return dict(
        schema="nr-native-n9-gauge-audit-v1",
        audit_completed=True,
        registration_fixture=fixture,
        receipt_sha256=N.sha(path),
        artifacts_checked=len(data["artifact_hashes"]),
        source_count=len(sources),
        cases=checked,
        initial_data=initial_check,
        independent_temporal_screen=screen,
        scientific_steps_audited=sum(c["accepted_steps"] for c in checked),
        native_steps_audited=sum(c["native_published_steps"] for c in checked),
        rhs_stages_audited=sum(c["rhs_stages_audited"] for c in checked),
        successful_native_calls_checked=calls,
        physical_experiment_completed=completed,
        entry_test_gate_revalidated=not fixture,
        rhs_recomputed=False,
        **S.FALSE_FLAGS,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    require(
        directory.parent == N.EVIDENCE and not directory.exists(),
        "fresh bounded audit directory required",
    )
    budget = N.Budget(directory, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    directory.mkdir()
    try:
        result = audit(args.receipt, guard=budget.guard)
    except Exception as error:
        budget.record(
            "failed-audit.json",
            dict(
                audit_completed=False,
                error=f"{type(error).__name__}: {error}",
                **S.FALSE_FLAGS,
            ),
            finalizing=True,
        )
        raise
    result["auditor_sha256"] = N.sha(Path(__file__))
    budget.record("audit.json", result)
    print(json.dumps(result), flush=True)


if __name__ == "__main__":
    main()
