"""Read only the three already-accepted T=1/8 endpoints; never evolve or regrade."""

from __future__ import annotations

import argparse
from fractions import Fraction
import json
from pathlib import Path
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity import constraint_field_comparison as C  # noqa: E402
from science.numerical_relativity import native_campaign as N  # noqa: E402
from science.numerical_relativity import native_checkpoint as codec  # noqa: E402
from science.numerical_relativity import native_continuation_campaign as F  # noqa: E402
from science.numerical_relativity.sbp_metric_geometry import constraints_from_slots  # noqa: E402

CHILD = N.EVIDENCE / "nr-k3-native-gauge-continuation-v2-20261011"
PINS = {
    "tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v2-20261011/receipt.json": "a7a7c8b7ebdc9447c31d4d70875e8b42f50a2a02d8b769a85457dce05e143583",
    "tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v2-audit-20261011.json": "60f60e1f989aabb2e987d44d74bf8a57bcf189b625ba9d66210ed2e3b8d1e40e",
    "tmp/nr-shadow-evidence/nr-k3-native-gauge-pulse-v2-20261010/receipt.json": "6cc32e3c34d4a86ac6f1a6e75bf596e5ae1cb4c120dd95210f23df72d2359341",
    "tmp/nr-shadow-evidence/nr-k3-native-gauge-pulse-v2-audit-20261010.json": "35cc5a9beb5aa2f219099339941c38f7f3ff26fb584694bd158f11eb21a07537",
}
EXTRA_SOURCES = (
    "science/numerical_relativity/constraint_field_comparison.py",
    "science/numerical_relativity/EXPERIMENT-20261011-constraint-field-controls.md",
    "scripts/tests/test_nr_constraint_field_comparison.py",
    "scripts/nr-constraint-field-tests.ini",
    "scripts/run-nr-k3-constraint-field-controls.py",
    "scripts/analyze-nr-k3-constraint-fields.py",
)
EXPECTED_TESTS = 77
TEST_MODULE = "scripts.tests.test_nr_constraint_field_comparison"


def check_hashes(table):
    for name, digest in table.items():
        N.require(
            N.sha(N.contained(ROOT, name)) == digest, "source/input changed: " + name
        )


def frozen_sources():
    check_hashes(PINS)
    child = json.loads((CHILD / "receipt.json").read_text(encoding="utf-8"))
    sources = child["source_before"]
    N.require(
        len(sources) == 396 and sources == child["source_after"],
        "frozen396 source identity required",
    )
    check_hashes(sources)
    return sources


def analyze(guard):
    started = time.monotonic()
    sources = frozen_sources()
    extra = {name: N.sha(ROOT / name) for name in EXTRA_SOURCES}
    N.require(
        not set(extra).intersection(sources),
        "additive tools must be outside frozen sources",
    )
    child, audit, parent, parent_audit = [
        json.loads((ROOT / name).read_text(encoding="utf-8")) for name in PINS
    ]
    N.require(
        child["completed"]
        and parent["completed"]
        and audit["audit_completed"]
        and parent_audit["audit_completed"]
        and not child["errors"],
        "completed accepted evidence required",
    )
    N.require(
        audit["receipt_sha256"] == PINS[next(iter(PINS))], "child audit binding changed"
    )
    N.require(len(child["cases"]) == 3, "exact registered three-case matrix required")
    used = dict(PINS)

    def artifact(name):
        path = N.contained(CHILD, name)
        N.require(
            name in child["artifact_hashes"]
            and N.sha(path) == child["artifact_hashes"][name],
            "bound artifact changed: " + name,
        )
        used[path.relative_to(ROOT).as_posix()] = child["artifact_hashes"][name]
        return path

    binding = artifact("binding.txt").read_bytes()
    plan = json.loads(artifact(child["global_plan"]).read_text(encoding="utf-8"))
    N.require(
        codec.sha(binding) == child["native_identity"]["binding_sha256"]
        and plan["initial_identity"]["mass"] == 1.0
        and plan["lower"] == [1.0] * 3
        and plan["upper"] == [3.0] * 3,
        "registered unit/domain binding required",
    )
    frames, endpoints = [], []
    for row, step, dt in zip(
        child["cases"],
        (14, 28, 56),
        (Fraction(1, 112), Fraction(1, 224), Fraction(1, 448)),
        strict=True,
    ):
        guard()
        point = row["trajectory"][-1]
        N.require(
            row["completed"]
            and row["end_step"] == point["point"] == step
            and point["time"] == row["end_time"] == 0.125
            and row["dt"] == float(dt)
            and step * dt == Fraction(1, 8),
            "fixed common-time accepted endpoint required",
        )
        path = artifact(point["checkpoint"])
        N.require(N.sha(path) == point["checkpoint_sha256"], "endpoint hash mismatch")
        value = codec.decode(path.read_bytes(), binding, point["segment_plan_sha256"])
        N.require(
            value["step"] == step
            and value["state_sha256"] == point["state_sha256"]
            and value["plan"]["dt"] == float(dt)
            and value["plan"]["shape"] == (13,) * 3
            and value["plan"]["lower"] == (1.0,) * 3
            and value["plan"]["upper"] == (3.0,) * 3,
            "decoded state/plan/grid identity mismatch",
        )
        frame = C.reconstruct(value["q"], time=step * dt)
        N.require(
            frame.state_sha256 == point["state_sha256"],
            "adapter changed state identity",
        )
        production = constraints_from_slots(value["q"], (1.0 / 6,) * 3)
        differences = {
            key: float(np.max(np.abs(frame.fields[key] - production[key])))
            for key in ("H_metric_hessian", "M_metric")
        }
        N.require(
            max(differences.values()) <= 2e-12, "full-field diagnostic parity failed"
        )
        norms, gaps = {}, {}
        for region, mask in C.region_masks(13).items():
            norms[region] = {
                name: C.weighted_rms(frame.fields[name], frame.weights, mask)
                for name in C.FIELDS
            }
            gaps[region] = {
                name: abs(norms[region][name] - point["measurements"][region][name])
                for name in C.FIELDS
            }
        N.require(
            max(v for d in gaps.values() for v in d.values()) <= 2e-12,
            "saved regional diagnostic parity failed",
        )
        N.require(
            codec.sha(value["q"].tobytes()) == value["state_sha256"],
            "checkpoint input mutated",
        )
        endpoints.append(
            dict(
                label=row["label"],
                absolute_step=step,
                dt=dict(numerator=dt.numerator, denominator=dt.denominator),
                checkpoint=path.relative_to(ROOT).as_posix(),
                checkpoint_sha256=point["checkpoint_sha256"],
                state_sha256=frame.state_sha256,
                measurements=norms,
                stored_norm_absolute_differences=gaps,
                production_field_linf_differences=differences,
            )
        )
        frames.append(frame)
    comparisons = [
        dict(pair=label, **C.compare_frames(frames[i], frames[j]))
        for i, j, label in (
            (0, 1, "coarse-medium"),
            (1, 2, "medium-fine"),
            (0, 2, "coarse-fine"),
        )
    ]
    guard()
    for table in (used, sources, extra):
        check_hashes(table)
    return dict(
        schema="nr-saved-endpoint-constraint-fields-v1",
        completed=True,
        errors=[],
        evidence_class="post-hoc same-grid saved-field diagnostics only",
        time=dict(numerator=1, denominator=8),
        endpoints=endpoints,
        comparisons=comparisons,
        inputs_sha256=used,
        frozen_source_count=len(sources),
        frozen_source_unchanged=True,
        adapter_sources=extra,
        adapter_sources_unchanged=True,
        independent_of_evolution_rhs=True,
        third_independent_einstein_implementation=False,
        diagnostic_comparison_absolute_tolerance=2e-12,
        primary_result_regraded=False,
        new_evolution=False,
        rhs_recomputed=False,
        constraint_convergence_validated=False,
        spatial_convergence_validated=False,
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
        seconds=time.monotonic() - started,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--control-directory", type=Path, required=True)
    args = parser.parse_args()
    directory = args.control_directory.resolve()
    N.require(
        directory.parent == N.EVIDENCE
        and directory.is_dir()
        and not (directory / "endpoint-field-report.json").exists(),
        "fresh bounded report required",
    )
    F.check_xml(directory / "tests.xml", EXPECTED_TESTS, TEST_MODULE)
    test_sha = N.sha(directory / "tests.xml")
    budget = N.Budget(directory, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    result = analyze(budget.guard)
    N.require(N.sha(directory / "tests.xml") == test_sha, "control XML changed")
    result["test_report_sha256"] = test_sha
    budget.record("endpoint-field-report.json", result)
    print(
        json.dumps(
            dict(
                completed=True,
                endpoints=len(result["endpoints"]),
                comparisons=len(result["comparisons"]),
                seconds=result["seconds"],
                new_evolution=False,
            )
        ),
        flush=True,
    )


if __name__ == "__main__":
    main()
