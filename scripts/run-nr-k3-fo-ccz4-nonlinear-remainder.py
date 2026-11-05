"""Frozen full-cube CPU remainder campaign; no default/RHS/live changes."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import platform
import runpy
import shutil
import subprocess
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D, FOCCZ4State3D, Grid3D, advance_fo_ccz4_rk4_3d, constraint_report_3d,
)
from science.numerical_relativity.fo_ccz4_checkpoint import checkpoint_from_state, decode_checkpoint, state_slots  # noqa: E402
from science.numerical_relativity.fo_ccz4_linear_modes import GAUGE, PROFILE, connection_consistent_initial_checkpoint  # noqa: E402
from science.numerical_relativity.fo_ccz4_remainder import CASES, TIMES, assess_remainder, case_key  # noqa: E402
from science.numerical_relativity.manifest import validate_fo_ccz4_cpp_manifest  # noqa: E402
from science.numerical_relativity.plane_constraint_oracle import exact_plane_line, plane_diagonal_hamiltonian  # noqa: E402

MODAL = runpy.run_path(str(ROOT/"scripts/run-nr-k3-fo-ccz4-modal-initialization.py"))
WINDOW = MODAL["WINDOW"]
sha256, write_json = MODAL["sha256"], MODAL["write_json"]
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-nonlinear-remainder.md"
# Explicit experiment identity; not a floating 'latest' receipt.
ORIGIN_SHA = "1ff1383ba935ce15b368c19eb5615dd3cbd068478743ccb0fddda8abf07b4774"
HARD_TIMEOUT, PROCESS_TIMEOUT = 1800., 180.
OUTPUT_LIMIT, RESERVED_BYTES = 192*1024**2, 1024**3


def source_identity():
    rows = MODAL["source_identity"]()
    rows[Path(__file__).relative_to(ROOT).as_posix()] = sha256(Path(__file__))
    return rows


def validate_origin(path):
    if sha256(path) != ORIGIN_SHA:
        raise ValueError("origin receipt does not match the predeclared SHA-256")
    value = json.loads(path.read_text(encoding="utf-8"))
    if (value["schema_version"] != "nr-k3-modal-initialization-v1"
            or not all(value.get(key) is True for key in ("completed", "hypothesis_supported", "identity_unchanged", "all_baseline_artifacts_unchanged"))
            or value["identity_before"] != value["identity_after"]):
        raise ValueError("completed unchanged modal evidence required")
    for name, expected in value["identity_before"]["source"].items():
        if sha256(ROOT/name) != expected:
            raise ValueError(f"origin numerical source drift: {name}")
    for name, expected in value["artifact_hashes"].items():
        if sha256(path.parent/name) != expected:
            raise ValueError(f"origin artifact drift: {name}")
    binary = Path(value["binary"])
    if sha256(binary) != value["identity_before"]["binary_sha256"]:
        raise ValueError("native binary drift")
    return binary


def initial_checkpoint(n, amplitude, steps):
    grid = Grid3D((n,)*3, (0.,)*3, (1.,)*3, boundary="periodic", spatial_order=2)
    base = BSSNState3D.gauge_wave(grid, amplitude=amplitude, wavelength=1.)
    raw = checkpoint_from_state(FOCCZ4State3D.from_bssn_state(base), profile=PROFILE,
                                dt=1./steps, scenario=1, amplitude=amplitude, wavelength=1.)
    adjusted = connection_consistent_initial_checkpoint(raw)
    if raw.header != adjusted.header or any(a.tobytes() != b.tobytes() for i, (a, b) in enumerate(zip(raw.slots, adjusted.slots)) if i not in (19, 20, 21)):
        raise ValueError("initial connection control changed another slot/header")
    return adjusted


def sample(checkpoint):
    state = checkpoint.to_state()
    report = constraint_report_3d(state.base)
    h_fourier = plane_diagonal_hamiltonian(state.base).hamiltonian
    coeff = np.fft.fft(h_fourier)/len(h_fourier)
    planes = {"H_primary": exact_plane_line(report.hamiltonian).tolist(),
              "H_fourier": h_fourier.tolist(), "Theta": exact_plane_line(report.theta).tolist()}
    for axis, label in enumerate("xyz"):
        planes[f"M_{label}"] = exact_plane_line(report.momentum[..., axis]).tolist()
        planes[f"Gamma_{label}"] = exact_plane_line(report.conformal_gamma[..., axis]).tolist()
    return {**WINDOW["diagnostics"](checkpoint, "wave"), "planes": planes,
            "H_fourier_modes": [[float(c.real), float(c.imag)] for c in coeff[:3]]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--origin", type=Path, required=True)
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    origin, directory = args.origin.resolve(), args.output_directory.resolve()
    binary = validate_origin(origin)
    if directory.exists():
        raise SystemExit("choose a fresh output directory; nothing overwritten")
    if shutil.disk_usage(directory.parent).free < RESERVED_BYTES+OUTPUT_LIMIT:
        raise SystemExit("insufficient reserved disk capacity; nothing written")
    directory.mkdir()
    started = time.perf_counter()

    def identity():
        return {"source": source_identity(), "binary_sha256": sha256(binary),
                "origin_sha256": sha256(origin), "protocol_sha256": sha256(PROTOCOL)}

    before = identity()
    with (directory/"protocol.frozen.md").open("xb") as stream:
        stream.write(PROTOCOL.read_bytes())
    result = {"schema_version": "nr-k3-nonlinear-remainder-v1", "identity_before": before,
              "binary": str(binary), "origin": str(origin), "cases": [], "commands": [], "errors": [],
              "environment": {"python": sys.version, "numpy": np.__version__, "platform": platform.platform()},
              "completed": False, "bounded_remainder_gates_passed": False,
              **{key: False for key in ("physical_validation", "strong_hyperbolicity_validated", "cpbc",
                 "physical_boundary_validated", "black_hole_evolution_validated", "amr_validated", "cuda_validated",
                 "standard_awa_benchmark_passed", "long_time_stability_validated", "nonlinear_initialization_promoted",
                 "runtime_writeback", "scientificPayloadWriteback")}}
    write_json(directory/"frozen-input.json", {"identity": before, "cases": CASES, "times": TIMES,
               "hard_timeout_seconds": HARD_TIMEOUT, "output_limit_bytes": OUTPUT_LIMIT})

    def run_native(name, path, steps):
        remaining = HARD_TIMEOUT-(time.perf_counter()-started)
        reserve = 12*1024**2
        if remaining <= 0.:
            raise TimeoutError("predeclared 30-minute budget exhausted")
        if (shutil.disk_usage(directory).free < RESERVED_BYTES+reserve
                or sum(p.stat().st_size for p in directory.rglob("*") if p.is_file())+reserve > OUTPUT_LIMIT):
            raise OSError("predeclared disk budget exhausted")
        current = decode_checkpoint(path.read_bytes(), expected_profile=PROFILE)
        h = current.header
        output, manifest = directory/f"{name}.bin", directory/f"{name}.json"
        command = [str(binary), "--points", str(h["points"]), "--steps", str(steps), "--threads", "4",
                   "--dt", repr(h["dt"]), "--scenario", "gauge-wave", "--formulation", "ccz4", "--solver-mode", "fo-rhs-shadow",
                   "--amplitude", repr(h["amplitude"]), "--wavelength", "1", "--gauge-profile", "state-dependent-v1",
                   "--shift-scale", "3", "--ordering-scale", ".2", "--restart", str(path),
                   "--checkpoint", str(output), "--manifest", str(manifest)]
        print(json.dumps({"native": name, "target_step": h["step"]+steps}), flush=True)
        try:
            process = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, errors="replace", timeout=min(PROCESS_TIMEOUT, remaining))
        except subprocess.TimeoutExpired as exc:
            def message(value):
                return value.decode("utf-8", errors="replace") if isinstance(value, bytes) else (value or "")
            with (directory/f"{name}.log").open("x", encoding="utf-8") as stream:
                stream.write(message(exc.stdout)+"\n[timeout stderr]\n"+message(exc.stderr))
            result["commands"].append({"command": command, "timed_out": True})
            raise
        with (directory/f"{name}.log").open("x", encoding="utf-8") as stream:
            stream.write(process.stdout+"\n[stderr]\n"+process.stderr)
        result["commands"].append({"command": command, "returncode": process.returncode})
        if process.returncode:
            raise RuntimeError(f"{name}: exit {process.returncode}: {process.stderr.strip()}")
        checkpoint = decode_checkpoint(output.read_bytes(), expected_profile=PROFILE)
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        validate_fo_ccz4_cpp_manifest(payload, expected_solver_mode="fo-ccz4-rhs-shadow-rk4", expected_profile=PROFILE)
        target_step, target_time = h["step"]+steps, h["time"]+steps*h["dt"]
        if (checkpoint.header != {**h, "step": target_step, "time": target_time}
                or payload["diagnostics"]["step"] != target_step or payload["diagnostics"]["time"] != target_time
                or payload["grid"]["shape"] != [h["points"]]*3 or payload["kernel_version"] != "0.2.0"):
            raise ValueError("native output metadata differs from the requested state")
        return checkpoint, output

    try:
        for family, n, amplitude, steps in CASES:
            label = f"{family}-n{n}-a{amplitude}-s{steps}"
            initial = initial_checkpoint(n, amplitude, steps)
            path = directory/f"{label}-initial.bin"
            with path.open("xb") as stream:
                stream.write(initial.to_bytes())
            if family == "time":
                baseline = next(r for r in result["cases"] if case_key(r) == ("space", 13, amplitude, 512))
                old = decode_checkpoint(Path(baseline["initial_checkpoint"]).read_bytes(), expected_profile=PROFILE)
                if any(a.tobytes() != b.tobytes() for a, b in zip(initial.slots, old.slots)):
                    raise ValueError("time-step control has different initial fields")
                result["temporal_initial_slots_equal"] = True
            row = {"family": family, "points": n, "amplitude": amplitude, "steps": steps, "dt": 1./steps,
                   "initial_checkpoint": str(path), "other_55_initial_slots_byte_identical": True,
                   "samples": [sample(initial)]}
            result["cases"].append(row)  # Keep partially completed cases on failure.
            for target_time in TIMES[1:]:
                name = f"{label}-step{int(target_time*steps)}"
                checkpoint, path = run_native(name, path, steps//8)
                observation = {**sample(checkpoint), "checkpoint": str(path), "checkpoint_sha256": sha256(path)}
                row["samples"].append(observation)
                write_json(directory/f"{name}-diagnostics.json", observation)
            write_json(directory/f"{label}-row.json", row)
            print(json.dumps({"case_complete": label, "H_l2": row["samples"][-1]["constraints"]["hamiltonian_l2"]}), flush=True)
        state_path = Path(result["cases"][0]["samples"][-1]["checkpoint"])
        state = decode_checkpoint(state_path.read_bytes(), expected_profile=PROFILE)
        continued, _ = run_native("space-n9-python-continuation", state_path, 1)
        reference = advance_fo_ccz4_rk4_3d(state.to_state(), state.header["dt"], gauge=GAUGE, gauge_profile=PROFILE)
        error = max(float(np.max(abs(a-b))) for a, b in zip(state_slots(reference), continued.slots))
        result["python_continuation"] = {"max_absolute_error": error, "tolerance": 2.e-12, "passed": error <= 2.e-12}
        result["assessment"] = assess_remainder(result["cases"])
        result["completed"] = True
        result["bounded_remainder_gates_passed"] = bool(result["assessment"]["bounded_remainder_gates_passed"]
            and result["python_continuation"]["passed"] and result["temporal_initial_slots_equal"])
    except Exception as exc:
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    try:
        result["identity_after"] = identity()
        result["identity_unchanged"] = before == result["identity_after"]
        validate_origin(origin)
        result["origin_artifacts_unchanged"] = True
    except Exception as exc:
        result["identity_unchanged"] = False
        result["origin_artifacts_unchanged"] = False
        result["errors"].append({"type": type(exc).__name__, "message": str(exc)})
    result["bounded_remainder_gates_passed"] &= result["identity_unchanged"] and result["origin_artifacts_unchanged"]
    result["elapsed_seconds"] = time.perf_counter()-started
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    write_json(directory/"receipt.json", result)
    print(json.dumps({"receipt": str(directory/"receipt.json"), "completed": result["completed"],
                      "bounded_remainder_gates_passed": result["bounded_remainder_gates_passed"], "errors": result["errors"]}), flush=True)
    return 0 if result["completed"] and result["identity_unchanged"] and result["origin_artifacts_unchanged"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
