"""No-fit retrospective modal prediction plus prospective native initial-data controls."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import runpy
import shutil
import subprocess
import sys
import time

import numpy as np
import scipy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import BSSNState3D, FOCCZ4State3D, Grid3D  # noqa: E402
from science.numerical_relativity.fo_ccz4_checkpoint import checkpoint_from_state, decode_checkpoint  # noqa: E402
from science.numerical_relativity.fo_ccz4_linear_modes import (  # noqa: E402
    PROFILE, centered_wave_number, connection_consistent_initial_checkpoint,
    evolve_mode, linear_gauge_wave_mode, linear_hamiltonian_mode,
)
from science.numerical_relativity.manifest import validate_fo_ccz4_cpp_manifest  # noqa: E402
from science.numerical_relativity.plane_constraint_oracle import exact_plane_line, plane_diagonal_hamiltonian  # noqa: E402

WINDOW_PATH = ROOT/"scripts/run-nr-k3-fo-ccz4-periodic-window.py"
WINDOW = runpy.run_path(str(WINDOW_PATH))
sha256, write_json = WINDOW["sha256"], WINDOW["write_new_json"]
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-modal-initialization.md"
DT, T, FLOOR = 1./256, .75, 1.e-12
NEW_CASES = (("amplitude", 13, 5.e-5), ("amplitude", 13, 2.5e-5),
             ("gamma", 9, 1.e-4), ("gamma", 13, 1.e-4), ("gamma", 17, 1.e-4))


def source_identity():
    rows = WINDOW["source_identity"]()
    rows[Path(__file__).relative_to(ROOT).as_posix()] = sha256(Path(__file__))
    return rows


def pair(value):
    return [float(np.real(value)), float(np.imag(value))]


def relative_error(prediction, observation):
    scale = float(np.linalg.norm(observation))
    if not np.isfinite(scale) or scale <= FLOOR:
        return None
    return float(np.linalg.norm(np.asarray(prediction)-observation)/scale)


def first_mode(checkpoint):
    n = checkpoint.header["points"]
    # Strictly reject non-plane data; never silently average a 3-D field.
    return np.array([np.fft.fft(exact_plane_line(slot))[1]/n for slot in checkpoint.slots])


def observable(checkpoint):
    h = plane_diagonal_hamiltonian(checkpoint.to_state().base).hamiltonian
    coeff = np.fft.fft(h)/len(h)
    return {"mode1": pair(coeff[1]), "mode2": pair(coeff[2]),
            "hamiltonian_l2": float(np.sqrt(np.mean(h*h)))}


def predict(checkpoint):
    h = checkpoint.header
    kd = centered_wave_number(h["points"])
    q0 = linear_gauge_wave_mode(h["amplitude"], kd)
    rk = evolve_mode(q0, kd, h["time"], dt=h["dt"])
    continuous_time = evolve_mode(q0, kd, h["time"])
    actual = first_mode(checkpoint)
    obs = observable(checkpoint)
    h_actual = complex(*obs["mode1"])
    h_pred = linear_hamiltonian_mode(rk)
    state_error = relative_error(rk, actual)
    h_error = relative_error(h_pred, h_actual)
    return {"points": h["points"], "time": h["time"], "amplitude": h["amplitude"],
            "modified_wave_number": kd, "observed": obs,
            "predicted_H_mode1": pair(h_pred),
            "semidiscrete_H_mode1": pair(linear_hamiltonian_mode(continuous_time)),
            "all_slots_relative_error": state_error, "H_mode1_relative_error": h_error,
            "prediction_gate": bool(state_error is not None and state_error <= .001
                                    and h_error is not None and h_error <= .01),
            "predicted_all_slots_mode1": [pair(v) for v in rk],
            "observed_all_slots_mode1": [pair(v) for v in actual]}


def validate_baseline(path):
    receipt = json.loads(path.read_text(encoding="utf-8"))
    if (receipt.get("schema_version") != "nr-k3-native-periodic-window-v1"
            or receipt.get("completed") is not True or receipt.get("identity_unchanged") is not True):
        raise ValueError("requires completed unchanged periodic-window receipt")
    for name, expected in receipt["identity_before"]["source"].items():
        if sha256(ROOT/name) != expected:
            raise ValueError(f"baseline numerical source drift: {name}")
    for name, expected in receipt["artifact_hashes"].items():
        if sha256(path.parent/name) != expected:
            raise ValueError(f"baseline artifact drift: {name}")
    return receipt


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", required=True, type=Path)
    parser.add_argument("--output-directory", required=True, type=Path)
    args = parser.parse_args()
    baseline_path = args.baseline.resolve()
    baseline = validate_baseline(baseline_path)
    binary = Path(baseline["binary"])
    if sha256(binary) != baseline["identity_before"]["binary_sha256"]:
        raise SystemExit("binary drift")
    directory = args.output_directory.resolve()
    if directory.exists():
        raise SystemExit("output exists; choose a fresh directory")
    if shutil.disk_usage(directory.parent).free < 1152*1024**2:
        raise SystemExit("insufficient disk reserve")
    directory.mkdir()
    identity = {"source": source_identity(), "binary_sha256": sha256(binary),
                "baseline_sha256": sha256(baseline_path), "protocol_sha256": sha256(PROTOCOL)}
    with (directory/"protocol.frozen.md").open("xb") as stream:
        stream.write(PROTOCOL.read_bytes())
    started = time.perf_counter()
    result = {"schema_version": "nr-k3-modal-initialization-v1", "identity_before": identity,
              "baseline": str(baseline_path), "binary": str(binary), "scipy_version": scipy.__version__,
              "numpy_version": np.__version__, "predictions": [], "linear_controls": [], "native_controls": [],
              "commands": [], "completed": False, "hypothesis_supported": False, "error": None,
              "nonlinear_initialization_promoted": False, "physical_validation": False,
              "strong_hyperbolicity_validated": False, "cpbc": False, "runtime_writeback": False,
              "scientificPayloadWriteback": False}
    write_json(directory/"frozen-input.json", {"identity": identity, "new_cases": NEW_CASES,
               "time": T, "dt": DT, "retrospective_times": [.25, .5, .75, 1.]})
    try:
        for n in (9, 13, 17):
            for step in (64, 128, 192, 256):
                path = baseline_path.parent/f"wave-n{n}-s256-step{step}.bin"
                checkpoint = decode_checkpoint(path.read_bytes(), expected_profile=PROFILE)
                row = {**predict(checkpoint), "checkpoint": str(path), "checkpoint_sha256": sha256(path)}
                result["predictions"].append(row)
                print(json.dumps({"prediction": n, "T": row["time"], "H_error": row["H_mode1_relative_error"],
                                  "state_error": row["all_slots_relative_error"]}), flush=True)
            for name, kd in (("continuum", 2.*np.pi), ("consistent-discrete-Gamma", centered_wave_number(n))):
                q0 = linear_gauge_wave_mode(1.e-4, kd, gamma_k=kd)
                maximum = max(abs(linear_hamiltonian_mode(evolve_mode(q0, kd, t))) for t in (.25, .5, .75, 1.))
                result["linear_controls"].append({"name": name, "points_label": n, "max_H_mode": float(maximum),
                                                   "passed": bool(maximum <= FLOOR)})
        write_json(directory/"retrospective-predictions.json", result["predictions"])
        for family, n, amplitude in NEW_CASES:
            label = f"{family}-n{n}-a{amplitude}"
            if family == "gamma":
                old_path = baseline_path.parent/f"wave-n{n}-s256-initial.bin"
                original = decode_checkpoint(old_path.read_bytes(), expected_profile=PROFILE)
                initial = connection_consistent_initial_checkpoint(original)
                unchanged = all(np.array_equal(a, b) for i, (a, b) in enumerate(zip(original.slots, initial.slots))
                                if i not in (19, 20, 21))
                if not unchanged:
                    raise ValueError("Gamma control modified a non-Gamma slot")
            else:
                base = BSSNState3D.gauge_wave(Grid3D((n,)*3, (0.,)*3, (1.,)*3, boundary="periodic"), amplitude=amplitude)
                initial = checkpoint_from_state(FOCCZ4State3D.from_bssn_state(base), profile=PROFILE, dt=DT,
                                                 scenario=1, amplitude=amplitude, wavelength=1.)
                unchanged = None
            path = directory/f"{label}-initial.bin"
            with path.open("xb") as stream:
                stream.write(initial.to_bytes())
            row = {"family": family, "points": n, "amplitude": amplitude, "initial_checkpoint": str(path),
                   "all_55_other_slots_unchanged": unchanged, "samples": [WINDOW["diagnostics"](initial, "wave")]}
            for step in (64, 128, 192):
                remaining = 1800.-(time.perf_counter()-started)
                if remaining <= 0.:
                    raise TimeoutError("30 minute budget exhausted")
                if (shutil.disk_usage(directory).free < 1040*1024**2
                        or sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) > 112*1024**2):
                    raise OSError("disk budget exhausted")
                output, manifest = directory/f"{label}-step{step}.bin", directory/f"{label}-step{step}.json"
                command = [str(binary), "--points", str(n), "--steps", "64", "--threads", "4", "--dt", repr(DT),
                           "--scenario", "gauge-wave", "--formulation", "ccz4", "--solver-mode", "fo-rhs-shadow",
                           "--amplitude", repr(amplitude), "--wavelength", "1", "--gauge-profile", "state-dependent-v1",
                           "--shift-scale", "3", "--ordering-scale", ".2", "--restart", str(path),
                           "--checkpoint", str(output), "--manifest", str(manifest)]
                print(json.dumps({"native": label, "target_step": step}), flush=True)
                try:
                    process = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, errors="replace", timeout=min(180., remaining))
                except subprocess.TimeoutExpired as exc:
                    def as_text(value):
                        return value.decode("utf-8", errors="replace") if isinstance(value, bytes) else (value or "")
                    with (directory/f"{label}-step{step}.log").open("x", encoding="utf-8") as stream:
                        stream.write(as_text(exc.stdout)+"\n[timeout stderr]\n"+as_text(exc.stderr))
                    result["commands"].append({"command": command, "timed_out": True})
                    raise
                with (directory/f"{label}-step{step}.log").open("x", encoding="utf-8") as stream:
                    stream.write(process.stdout+"\n[stderr]\n"+process.stderr)
                result["commands"].append({"command": command, "returncode": process.returncode})
                if process.returncode:
                    raise RuntimeError(process.stderr.strip())
                checkpoint = decode_checkpoint(output.read_bytes(), expected_profile=PROFILE)
                payload = json.loads(manifest.read_text(encoding="utf-8"))
                validate_fo_ccz4_cpp_manifest(payload, expected_solver_mode="fo-ccz4-rhs-shadow-rk4", expected_profile=PROFILE)
                if (checkpoint.header["step"] != step or checkpoint.header["time"] != step*DT
                        or payload["diagnostics"]["step"] != step or payload["diagnostics"]["time"] != step*DT):
                    raise ValueError("native result time/step mismatch")
                sample = {**WINDOW["diagnostics"](checkpoint, "wave"), "observed": observable(checkpoint),
                          "checkpoint": str(output), "checkpoint_sha256": sha256(output)}
                row["samples"].append(sample)
                write_json(directory/f"{label}-step{step}-diagnostics.json", sample)
                path = output
            old = next(r for r in result["predictions"] if r["points"] == n and r["time"] == T)
            old_mode = complex(*old["observed"]["mode1"])
            new_mode = complex(*row["samples"][-1]["observed"]["mode1"])
            if family == "amplitude":
                error = relative_error(new_mode/amplitude, old_mode/1.e-4)
                row["normalized_amplitude_change"] = error
                row["control_gate"] = error is not None and error <= .01
            else:
                ratio = abs(new_mode)/abs(old_mode) if abs(old_mode) > FLOOR else None
                row["H_mode1_remaining_fraction"] = ratio
                row["control_gate"] = ratio is not None and ratio <= .01 and unchanged
            result["native_controls"].append(row)
            write_json(directory/f"{label}-row.json", row)
            print(json.dumps({"control_complete": label, "gate": row["control_gate"],
                              "H_mode": pair(new_mode), "ratio": row.get("H_mode1_remaining_fraction")}), flush=True)
        result["completed"] = True
        result["hypothesis_supported"] = bool(all(r["prediction_gate"] for r in result["predictions"])
            and all(r["passed"] for r in result["linear_controls"])
            and all(r["control_gate"] for r in result["native_controls"]))
    except Exception as exc:
        result["error"] = {"type": type(exc).__name__, "message": str(exc)}
    result["identity_after"] = {"source": source_identity(), "binary_sha256": sha256(binary),
                                "baseline_sha256": sha256(baseline_path), "protocol_sha256": sha256(PROTOCOL)}
    result["identity_unchanged"] = identity == result["identity_after"]
    result["hypothesis_supported"] &= result["identity_unchanged"]
    try:
        validate_baseline(baseline_path)
        result["all_baseline_artifacts_unchanged"] = True
    except ValueError as exc:
        result["all_baseline_artifacts_unchanged"] = False
        result["error"] = {"type": "BaselineDrift", "message": str(exc)}
        result["hypothesis_supported"] = False
    result["elapsed_seconds"] = time.perf_counter()-started
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    write_json(directory/"receipt.json", result)
    print(json.dumps({"receipt": str(directory/"receipt.json"), "completed": result["completed"],
                      "hypothesis_supported": result["hypothesis_supported"], "error": result["error"]}), flush=True)
    return 0 if result["completed"] and result["identity_unchanged"] and result["all_baseline_artifacts_unchanged"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
