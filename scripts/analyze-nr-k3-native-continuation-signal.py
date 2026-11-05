"""Post-hoc saved-state signal analysis; never evolves or regrades a campaign.

The 14 common times are shown in full, including the narrow intermediate pass.
Only the qualified auditor's mathematical regional reduction is reused; its
fixed T=1/8 metadata is not copied onto earlier times. Component contributions
are descriptive squared-error shares, not new componentwise acceptance gates.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import runpy
import shutil
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from science.numerical_relativity import native_checkpoint as codec  # noqa: E402

EVIDENCE = ROOT / "tmp/nr-shadow-evidence"
PARENT = EVIDENCE / "nr-k3-native-gauge-pulse-v2-20261010"
CHILD = EVIDENCE / "nr-k3-native-gauge-continuation-v2-20261011"
AUDIT = EVIDENCE / "nr-k3-native-gauge-continuation-v2-audit-20261011.json"
PINS = {
    PARENT
    / "receipt.json": "6cc32e3c34d4a86ac6f1a6e75bf596e5ae1cb4c120dd95210f23df72d2359341",
    CHILD
    / "receipt.json": "a7a7c8b7ebdc9447c31d4d70875e8b42f50a2a02d8b769a85457dce05e143583",
    AUDIT: "60f60e1f989aabb2e987d44d74bf8a57bcf189b625ba9d66210ed2e3b8d1e40e",
}
CAP = 128 * 1024
require = codec.require


def sha(path):
    return codec.sha(path.read_bytes())


def disk_guard():
    require(shutil.disk_usage("C:/").free >= 3 * 1024**3, "original C reserve")
    require(
        shutil.disk_usage(ROOT).free >= 4 * 1024**3 + 32 * 1024**2 + CAP,
        "original E reserve plus bounded analysis output",
    )


def source_guard(sources):
    require(len(sources) == 396, "exact frozen campaign source count")
    for name, digest in sources.items():
        path = (ROOT / name).resolve()
        require(path.is_relative_to(ROOT), "contained source required")
        require(sha(path) == digest, "frozen source changed: " + name)


def point_map(parent, child):
    result = {}
    for directory, case in ((PARENT, parent), (CHILD, child)):
        for point in case["trajectory"]:
            if point.get("checkpoint"):
                require(point["point"] not in result, "duplicate absolute point")
                result[point["point"]] = (directory, point)
    return result


def decomposition(arrays, mask, weights):
    denominator = math.fsum(weights[mask].tolist())
    values = []
    for left, right in zip(arrays[:-1], arrays[1:], strict=True):
        values.append(
            np.array(
                [
                    math.fsum(
                        ((left[j] - right[j])[mask] ** 2 * weights[mask]).tolist()
                    )
                    / denominator
                    for j in range(58)
                ]
            )
        )
    total = math.fsum(values[1].tolist())
    require(total > 0 and math.isfinite(total), "positive finite difference energy")
    components = [
        dict(
            slot=int(j),
            variable=codec.FOCCZ4_VARIABLE_ORDER[j],
            coarse_component_rms=math.sqrt(values[0][j]),
            fine_component_rms=math.sqrt(values[1][j]),
            fine_squared_error_fraction=float(values[1][j] / total),
        )
        for j in np.argsort(values[1])[::-1]
    ]
    require(
        math.isclose(
            math.fsum(x["fine_squared_error_fraction"] for x in components),
            1.0,
            rel_tol=2e-15,
        ),
        "component shares must close",
    )
    return math.sqrt(total / 58), components


def analyze():
    for path, digest in PINS.items():
        require(sha(path) == digest, "pinned scientific evidence changed")
    parent, child, audit = (
        json.loads(path.read_text(encoding="utf-8")) for path in PINS
    )
    require(
        parent["completed"] and child["completed"] and audit["audit_completed"],
        "completed saved-data evidence required",
    )
    require(audit["receipt_sha256"] == PINS[CHILD / "receipt.json"], "audit link")
    sources = child["source_before"]
    source_guard(sources)
    require(sources == child["source_after"], "campaign source identity drift")
    observer_sha = sha(Path(__file__))
    auditor = runpy.run_path(
        str(ROOT / "scripts/audit-nr-k3-native-gauge-continuation.py")
    )
    binding = (CHILD / "binding.txt").read_bytes()
    require(
        sha(CHILD / "binding.txt") == child["artifact_hashes"]["binding.txt"],
        "bound checkpoint identity changed",
    )
    maps = [
        point_map(old, new)
        for old, new in zip(parent["cases"], child["cases"], strict=True)
    ]
    require(len(maps) == 3, "fixed three-case matrix")
    times, endpoints, inputs = [], {}, {}
    for coarse_step in range(1, 15):
        arrays, steps = [], []
        for factor, items in zip((1, 2, 4), maps, strict=True):
            directory, point = items[factor * coarse_step]
            path = (directory / point["checkpoint"]).resolve()
            require(path.is_relative_to(directory), "contained checkpoint required")
            raw = path.read_bytes()
            require(codec.sha(raw) == point["checkpoint_sha256"], "checkpoint changed")
            value = codec.decode(raw, binding, point["segment_plan_sha256"])
            require(
                value["state_sha256"] == point["state_sha256"]
                and value["step"] == factor * coarse_step
                and point["time"] == coarse_step * (1 / 112),
                "exact common physical time and accepted state required",
            )
            inputs[path.relative_to(ROOT).as_posix()] = value["checkpoint_sha256"]
            arrays.append(value["q"])
            steps.append(value["step"])
        screen = auditor["temporal"](arrays)
        times.append(
            dict(
                coarse_absolute_step=coarse_step,
                time=coarse_step * (1 / 112),
                absolute_steps=steps,
                regions=screen["regions"],
                exploratory_all_regions_status=screen["status"],
            )
        )
        if coarse_step in (7, 14):
            endpoints[coarse_step] = arrays
    require(
        times[-1]["regions"] == audit["independent_temporal_screen"]["regions"],
        "final-time reduction must reproduce the independent audit exactly",
    )
    w = np.ones(13)
    w[:4] = np.array([17, 59, 43, 49]) / 48
    w[-4:] = w[:4][::-1]
    w /= 6
    weights = w[:, None, None] * w[None, :, None] * w[None, None, :]
    indices = np.indices((13,) * 3)
    codimension = np.sum((indices == 0) | (indices == 12), axis=0)
    contributions = []
    for coarse_step, arrays in endpoints.items():
        for name, codim in (("faces", 1), ("edges", 2)):
            rms, components = decomposition(arrays, codimension == codim, weights)
            expected = times[coarse_step - 1]["regions"][name]["fine_error"]
            require(math.isclose(rms, expected, rel_tol=2e-15), "RMS decomposition")
            contributions.append(
                dict(
                    time=coarse_step * (1 / 112),
                    region=name,
                    fine_global_rms=expected,
                    components=components,
                )
            )
    source_guard(sources)
    require(sha(Path(__file__)) == observer_sha, "analysis source changed")
    for path, digest in PINS.items():
        require(sha(path) == digest, "pinned metadata changed during analysis")
    for name, digest in inputs.items():
        require(sha(ROOT / name) == digest, "input checkpoint changed during analysis")
    return dict(
        schema="nr-native-continuation-signal-analysis-v1",
        evidence_class="post-hoc descriptive saved-state analysis; not a new physical gate",
        analysis_source=Path(__file__).relative_to(ROOT).as_posix(),
        analysis_source_sha256=observer_sha,
        metadata_sha256={p.relative_to(ROOT).as_posix(): h for p, h in PINS.items()},
        checkpoint_sha256=inputs,
        frozen_source_count=len(sources),
        common_times=times,
        component_contributions=contributions,
        component_order_claim=False,
        new_evolution=False,
        rhs_recomputed=False,
        primary_result_regraded=False,
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    require(output.parent == EVIDENCE and not output.exists(), "fresh bounded output")
    disk_guard()
    started = time.monotonic()
    result = analyze()
    result["seconds"] = time.monotonic() - started
    require(result["seconds"] < 600, "bounded read-only analysis time")
    raw = (
        json.dumps(result, sort_keys=True, allow_nan=False, separators=(",", ":"))
        + "\n"
    ).encode()
    require(len(raw) <= CAP, "bounded analysis output")
    disk_guard()
    with output.open("xb") as stream:
        stream.write(raw)
    print(
        json.dumps(
            dict(
                output=str(output),
                bytes=len(raw),
                seconds=result["seconds"],
                checkpoint_count=len(result["checkpoint_sha256"]),
                common_time_count=len(result["common_times"]),
                new_evolution=False,
                primary_result_regraded=False,
            )
        )
    )


if __name__ == "__main__":
    main()
