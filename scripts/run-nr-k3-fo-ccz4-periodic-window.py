"""Frozen T=1 periodic CPU screening; never a physical/live promotion gate.

Wave and all-58-slot random noise are deliberately separate test families.
Noise is not constraint-satisfying initial data or a continuum convergence test.
"""
from __future__ import annotations

import argparse
import hashlib
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
    BSSNState3D, FOCCZ4State3D, GaugeConfig, Grid3D, advance_fo_ccz4_rk4_3d,
    constraint_report_3d, fo_ccz4_ordering_constraints_3d,
)
from science.numerical_relativity.fo_ccz4 import build_fo_ccz4_auxiliary_3d  # noqa: E402
from science.numerical_relativity.fo_ccz4_checkpoint import (  # noqa: E402
    FOCheckpoint, checkpoint_from_state, decode_checkpoint, state_slots,
)
from science.numerical_relativity.fo_ccz4_gauge_profile import FOCCZ4GaugeProfile  # noqa: E402
from science.numerical_relativity.manifest import validate_fo_ccz4_cpp_manifest  # noqa: E402
from science.numerical_relativity.plane_constraint_oracle import plane_diagonal_hamiltonian  # noqa: E402

PROFILE = FOCCZ4GaugeProfile()
GAUGE = GaugeConfig(shift_coefficient=1., shift_damping=0., theta_coupling=2.)
POINTS, STEPS, CHUNK, FINAL_TIME = (9, 13, 17), 256, 64, 1.
AMPLITUDE, SEED, FLOOR = 1.e-4, 20261007, 1.e-13
CONSTRAINTS = ("hamiltonian_l2", "momentum_l2", "conformal_gamma_l_inf", "theta_l_inf")
HARD_TIMEOUT, PROCESS_TIMEOUT = 1800., 180.
MAX_OUTPUT_BYTES, RESERVED_BYTES = 256*1024**2, 1024**3
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261007-periodic-window.md"
NATIVE = runpy.run_path(str(ROOT/"scripts/run-nr-k2-native-msvc.py"))
CASES = tuple((family, n, STEPS) for family in ("wave", "noise") for n in POINTS) + (
    ("wave", 17, 2*STEPS), ("minkowski", 5, STEPS),
)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_identity():
    rows = NATIVE["source_identity"]()
    rows[Path(__file__).relative_to(ROOT).as_posix()] = sha256(Path(__file__))
    return rows


def write_new_json(path, value):
    encoded = json.dumps(value, sort_keys=True, indent=2, allow_nan=False)+"\n"
    with path.open("x", encoding="utf-8") as stream:
        stream.write(encoded)


def require_bound_binary(binary, receipt):
    if (receipt.get("schema_version") != "nr-k2-fo-ccz4-profile-v2-ode-erratum"
            or receipt.get("passed") is not True or sha256(binary) != receipt.get("binary_sha256")):
        raise ValueError("requires the verified 0.2.0 native profile binary and receipt")
    files = receipt["source_identity_before"]
    if files != receipt["source_identity_after"]:
        raise ValueError("prior campaign source identity drift")
    native_files = {name: value for name, value in files.items()
                    if name.startswith("science/numerical_relativity/cpp/")}
    if not native_files or any(sha256(ROOT/name) != value for name, value in native_files.items()):
        raise ValueError("native source no longer matches verified binary")


def initial_checkpoint(family, points, steps):
    if family not in ("wave", "noise", "minkowski") or points < 5 or steps < 1:
        raise ValueError("invalid periodic fixture")
    grid = Grid3D((points,)*3, (0.,)*3, (1.,)*3, boundary="periodic", spatial_order=2)
    base = (BSSNState3D.gauge_wave(grid, amplitude=AMPLITUDE, wavelength=1.)
            if family == "wave" else BSSNState3D.minkowski(grid))
    checkpoint = checkpoint_from_state(FOCCZ4State3D.from_bssn_state(base), profile=PROFILE,
                                       dt=FINAL_TIME/steps, scenario=int(family == "wave"),
                                       amplitude=AMPLITUDE, wavelength=1.)
    if family == "noise":
        rng = np.random.Generator(np.random.PCG64(SEED))
        amplitude = 1.e-10*(9./points)**2
        # Perturb canonical independent slots, including auxiliaries and off-diagonals.
        slots = tuple(slot+rng.uniform(-amplitude, amplitude, size=slot.shape) for slot in checkpoint.slots)
        checkpoint = FOCheckpoint(checkpoint.header, slots, PROFILE)
    checkpoint.to_bytes()  # Validate without reconstructing the independent auxiliaries.
    return checkpoint


def perturbation_norm(slots):
    if len(slots) != 58:
        raise ValueError("perturbation norm requires all 58 independent slots")
    return float(np.sqrt(sum(np.mean((slot-(1. if i in (0, 3, 5) else 0.))**2)
                             for i, slot in enumerate(slots))))


def diagnostics(checkpoint, family):
    state = checkpoint.to_state()
    base, aux = state.base, state.auxiliary
    constraints = constraint_report_3d(base)
    ordering = fo_ccz4_ordering_constraints_3d(base, aux)
    reconstructed = build_fo_ccz4_auxiliary_3d(base)
    reduction = [float(np.max(abs(a-b))) for a, b in zip(aux.arrays(), reconstructed.arrays())]
    f, _ = PROFILE.coefficients(base.lapse, base.chi)
    inv = np.linalg.inv(base.h)
    speeds = abs(base.shift)+np.sqrt((4./3.)*f[..., None]*np.diagonal(inv, axis1=-2, axis2=-1))
    max_speeds = np.max(speeds, axis=(0, 1, 2))
    cfl = float(checkpoint.header["dt"]*np.sum(max_speeds/np.asarray(base.grid.spacing)))
    norms = dict(constraints.norms)
    return {
        "step": checkpoint.header["step"], "time": checkpoint.header["time"],
        "constraints": norms, "ordering_max_curl_l_inf": ordering.max_curl_l_inf,
        "ordering_max_algebraic_l_inf": ordering.max_algebraic_l_inf,
        "auxiliary_reduction_l_inf_by_slot": reduction,
        "max_auxiliary_reduction_l_inf": max(reduction),
        "min_lapse": float(np.min(base.lapse)), "max_lapse": float(np.max(base.lapse)),
        "min_chi": float(np.min(base.chi)),
        "min_metric_eigenvalue": float(np.min(np.linalg.eigvalsh(base.h))),
        "coordinate_speed_max_by_axis": max_speeds.tolist(), "sampled_cfl_sum": cfl,
        "perturbation_l2": perturbation_norm(checkpoint.slots),
        "finite_positive": bool(ordering.finite and all(np.isfinite(list(norms.values())))
                                and np.min(np.linalg.eigvalsh(base.h)) > 0.),
        "plane_oracle": plane_diagonal_hamiltonian(base).norms if family == "wave" else None,
        "rk_stage_cfl_monitored": False, "runtime_writeback": False,
    }


def constraint_orders(rows):
    if [row["points"] for row in rows] != list(POINTS) or any(
        row["family"] != "wave" or row["steps"] != STEPS or row["samples"][-1]["time"] != FINAL_TIME
        for row in rows
    ):
        raise ValueError("wave convergence requires all frozen grids at the same dt and final time")
    reports = {}
    for name in CONSTRAINTS:
        values = [row["samples"][-1]["constraints"][name] for row in rows]
        measured = all(np.isfinite(values)) and min(values) > FLOOR
        orders = [float(np.log(a/b)/np.log(nb/na)) for a, b, na, nb in
                  zip(values, values[1:], POINTS, POINTS[1:])] if measured else []
        reports[name] = {"values": values, "orders": orders, "measurable": bool(measured),
                         "order_gate": bool(measured and min(orders) >= 1.5)}
    return reports


def temporal_comparison(coarse, fine):
    if (coarse.profile != PROFILE or fine.profile != PROFILE
            or any(coarse.header[name] != fine.header[name]
                   for name in ("points", "scenario", "time", "amplitude", "wavelength"))):
        raise ValueError("temporal comparison metadata mismatch")
    if coarse.header["dt"] != 2*fine.header["dt"] or coarse.header["step"]*2 != fine.header["step"]:
        raise ValueError("temporal comparison requires dt halving and the same final time")
    reports = [constraint_report_3d(checkpoint.to_state().base) for checkpoint in (coarse, fine)]
    result = {}
    for name in ("hamiltonian", "momentum"):
        left, right = (getattr(report, name) for report in reports)
        reference = float(np.sqrt(np.mean(right**2)))
        delta = float(np.sqrt(np.mean((left-right)**2)))
        measurable = reference > FLOOR
        result[name] = {"reference_l2": reference, "field_difference_l2": delta,
                        "fraction": delta/reference if measurable else None,
                        "time_control_gate": bool(measurable and delta/reference <= .01)}
    return result


def screening(rows):
    if {(row["family"], row["points"], row["steps"]) for row in rows} != set(CASES) or len(rows) != len(CASES):
        raise ValueError("all predeclared cases must complete exactly once")
    for row in rows:
        expected = list(range(0, row["steps"]+1, CHUNK))
        if ([s["step"] for s in row["samples"]] != expected
                or row["dt"] != FINAL_TIME/row["steps"]
                or any(s["time"] != s["step"]*row["dt"] for s in row["samples"])):
            raise ValueError("all frozen checkpoints must be present at the correct time")
    wave = [next(r for r in rows if (r["family"], r["points"], r["steps"]) == ("wave", n, STEPS)) for n in POINTS]
    noise = [next(r for r in rows if (r["family"], r["points"]) == ("noise", n)) for n in POINTS]
    growth = []
    for row in noise:
        samples = row["samples"]
        initial = samples[0]
        if initial["perturbation_l2"] <= 0. or initial["constraints"]["hamiltonian_l_inf"] <= 0.:
            raise ValueError("noise normalization is not measurable")
        state_growth = max(s["perturbation_l2"] for s in samples)/initial["perturbation_l2"]
        h_growth = max(s["constraints"]["hamiltonian_l_inf"] for s in samples)/initial["constraints"]["hamiltonian_l_inf"]
        growth.append({"points": row["points"], "state_growth": state_growth,
                       "hamiltonian_l_inf_growth": h_growth,
                       "bounded_growth_gate": bool(state_growth <= 100. and h_growth <= 100.)})
    ratio = growth[-1]["state_growth"]/growth[0]["state_growth"]
    wave_peak = max(s["constraints"][name] for r in wave for s in r["samples"] for name in CONSTRAINTS)
    samples = [sample for row in rows for sample in row["samples"]]
    return {"wave_orders": constraint_orders(wave), "wave_constraint_peak": wave_peak,
            "wave_absolute_gate": wave_peak <= 1.e-3, "noise": growth,
            "noise_fine_coarse_growth_ratio": ratio, "noise_resolution_gate": ratio <= 2.,
            "sampled_domain_gate": all(s["finite_positive"] for s in samples),
            "sampled_cfl_max": max(s["sampled_cfl_sum"] for s in samples),
            "sampled_cfl_gate": all(s["sampled_cfl_sum"] <= .45 for s in samples)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument("--binary-receipt", required=True, type=Path)
    parser.add_argument("--output-directory", required=True, type=Path)
    args = parser.parse_args()
    binary = args.binary.resolve()
    prior = json.loads(args.binary_receipt.read_text(encoding="utf-8"))
    require_bound_binary(binary, prior)
    directory = args.output_directory.resolve()
    if directory.exists():
        raise SystemExit("choose a fresh output directory; nothing overwritten")
    if shutil.disk_usage(directory.parent).free < RESERVED_BYTES+MAX_OUTPUT_BYTES:
        raise SystemExit("insufficient free disk for reserved capacity; no files written")
    directory.mkdir()
    before, started = source_identity(), time.perf_counter()
    identity = {"source": before, "binary_sha256": sha256(binary),
                "prior_receipt_sha256": sha256(args.binary_receipt), "protocol_sha256": sha256(PROTOCOL)}
    # Preserve the exact protocol bytes before its later result section is updated.
    with (directory/"protocol.frozen.md").open("xb") as stream:
        stream.write(PROTOCOL.read_bytes())
    result = {"schema_version": "nr-k3-native-periodic-window-v1", "identity_before": identity,
              "binary": str(binary), "profile": PROFILE.identity(), "cases": [], "errors": [], "commands": [],
              "method": {"grids": list(POINTS), "steps": STEPS, "final_time": FINAL_TIME, "chunk": CHUNK,
                         "amplitude": AMPLITUDE, "seed": SEED, "noise_amplitude_law": "1e-10*(9/N)^2",
                         "hard_timeout_seconds": HARD_TIMEOUT, "output_limit_bytes": MAX_OUTPUT_BYTES},
              "environment": {"python": sys.version, "numpy": np.__version__, "platform": platform.platform()},
              "completed": False, "bounded_screening_passed": False,
              "physical_validation": False, "strong_hyperbolicity_validated": False, "cpbc": False,
              "physical_boundary_validated": False, "amr_validated": False, "cuda_validated": False,
              "black_hole_evolution_validated": False, "standard_awa_benchmark_passed": False,
              "long_time_stability_validated": False, "runtime_writeback": False, "scientificPayloadWriteback": False}
    write_new_json(directory/"frozen-input.json", {"identity": identity, "method": result["method"], "cases": CASES})

    def capacity():
        remaining = HARD_TIMEOUT-(time.perf_counter()-started)
        if remaining <= 0.:
            raise TimeoutError("predeclared 30 minute campaign limit reached")
        inflight_reserve = 20*1024**2  # More than one largest-case output, diagnostics and final receipt.
        if (shutil.disk_usage(directory).free < RESERVED_BYTES+inflight_reserve
                or sum(p.stat().st_size for p in directory.rglob("*") if p.is_file())+inflight_reserve > MAX_OUTPUT_BYTES):
            raise OSError("predeclared disk budget reached; completed artifacts retained")
        return min(remaining, PROCESS_TIMEOUT)

    def run(name, initial, steps, threads):
        timeout = capacity()
        input_state = decode_checkpoint(initial.read_bytes(), expected_profile=PROFILE)
        h = input_state.header
        output, manifest = directory/f"{name}.bin", directory/f"{name}.json"
        command = [str(binary), "--points", str(h["points"]), "--steps", str(steps), "--threads", str(threads),
                   "--dt", repr(h["dt"]), "--scenario", "gauge-wave" if h["scenario"] else "minkowski",
                   "--formulation", "ccz4", "--solver-mode", "fo-rhs-shadow", "--amplitude", repr(h["amplitude"]),
                   "--wavelength", repr(h["wavelength"]), "--gauge-profile", "state-dependent-v1",
                   "--shift-scale", "3", "--ordering-scale", ".2", "--restart", str(initial),
                   "--checkpoint", str(output), "--manifest", str(manifest)]
        print(json.dumps({"start": name, "steps": steps, "threads": threads}), flush=True)
        try:
            process = subprocess.run(command, cwd=ROOT, timeout=timeout, capture_output=True, text=True, errors="replace")
        except subprocess.TimeoutExpired as exc:
            def as_text(value):
                return value.decode("utf-8", errors="replace") if isinstance(value, bytes) else (value or "")
            with (directory/f"{name}.log").open("x", encoding="utf-8") as log:
                log.write(as_text(exc.stdout)+"\n[timeout stderr]\n"+as_text(exc.stderr))
            result["commands"].append({"name": name, "command": command, "timeout_seconds": timeout,
                                       "returncode": None, "timed_out": True})
            raise
        with (directory/f"{name}.log").open("x", encoding="utf-8") as log:
            log.write(process.stdout+"\n[stderr]\n"+process.stderr)
        result["commands"].append({"name": name, "command": command, "returncode": process.returncode})
        if process.returncode:
            raise RuntimeError(f"{name}: exit {process.returncode}: {process.stderr.strip()}")
        checkpoint = decode_checkpoint(output.read_bytes(), expected_profile=PROFILE)
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        validate_fo_ccz4_cpp_manifest(payload, expected_solver_mode="fo-ccz4-rhs-shadow-rk4", expected_profile=PROFILE)
        target_step, target_time = h["step"]+steps, h["time"]+steps*h["dt"]
        if (checkpoint.header["step"] != target_step or checkpoint.header["time"] != target_time
                or payload["diagnostics"]["step"] != target_step or payload["diagnostics"]["time"] != target_time
                or payload["kernel_version"] != "0.2.0" or payload["grid"]["shape"] != [h["points"]]*3):
            raise ValueError("checkpoint/manifest result does not match requested evolution")
        return output, manifest, checkpoint

    try:
        for family, n, steps in CASES:
            capacity()
            label = f"{family}-n{n}-s{steps}"
            initial = initial_checkpoint(family, n, steps)
            initial_path = directory/f"{label}-initial.bin"
            with initial_path.open("xb") as stream:
                stream.write(initial.to_bytes())
            row = {"family": family, "points": n, "steps": steps, "dt": FINAL_TIME/steps,
                   "initial_checkpoint": str(initial_path), "samples": [diagnostics(initial, family)]}
            previous = initial_path
            try:
                for target in range(CHUNK, steps+1, CHUNK):
                    output, manifest, checkpoint = run(f"{label}-step{target}", previous, CHUNK, 4)
                    sample = diagnostics(checkpoint, family)
                    sample.update({"checkpoint": str(output), "checkpoint_sha256": sha256(output),
                                   "manifest": str(manifest), "manifest_sha256": sha256(manifest)})
                    row["samples"].append(sample)
                    write_new_json(directory/f"{label}-step{target}-diagnostics.json", sample)
                    print(json.dumps({"complete": label, "step": target, "time": sample["time"],
                                      "H_l2": sample["constraints"]["hamiltonian_l2"],
                                      "state_growth": sample["perturbation_l2"]/row["samples"][0]["perturbation_l2"]
                                          if row["samples"][0]["perturbation_l2"] else 0.}), flush=True)
                    previous = output
                result["cases"].append(row)
                write_new_json(directory/f"{label}-row.json", row)
            except (RuntimeError, ValueError) as exc:
                result["errors"].append({"case": label, "error": str(exc)})
                write_new_json(directory/f"{label}-failed-row.json", {"row": row, "error": str(exc)})
                # Continue independent, predeclared cases; never retry the failed case.
        result["screening"] = screening(result["cases"])
        lookup = {(r["family"], r["points"], r["steps"]): r for r in result["cases"]}
        def final(row):
            return decode_checkpoint(Path(row["samples"][-1]["checkpoint"]).read_bytes(), expected_profile=PROFILE)
        result["temporal_control"] = temporal_comparison(final(lookup["wave", 17, STEPS]), final(lookup["wave", 17, 2*STEPS]))
        flat = final(lookup["minkowski", 5, STEPS])
        result["minkowski_exact"] = perturbation_norm(flat.slots) == 0.
        noise = lookup["noise", 9, STEPS]
        split_paths = [Path(noise["samples"][-1][key]) for key in ("checkpoint", "manifest")]
        result["replays"] = []
        for threads in (4, 1):
            direct = run(f"noise-n9-direct-threads{threads}", Path(noise["initial_checkpoint"]), STEPS, threads)
            equal = [a.read_bytes() == b.read_bytes() for a, b in zip(split_paths, direct[:2])]
            result["replays"].append({"threads": threads, "checkpoint_equal": equal[0], "manifest_equal": equal[1]})
        _, _, continued = run("noise-n9-continuation", split_paths[0], 1, 4)
        python = advance_fo_ccz4_rk4_3d(final(noise).to_state(), FINAL_TIME/STEPS, gauge=GAUGE, gauge_profile=PROFILE)
        error = max(float(np.max(abs(a-b))) for a, b in zip(state_slots(python), continued.slots))
        result["python_continuation"] = {"max_absolute_error": error, "tolerance": 2.e-12, "passed": error <= 2.e-12}
        result["completed"] = not result["errors"]
        s = result["screening"]
        result["bounded_screening_passed"] = bool(result["completed"] and result["minkowski_exact"]
            and all(r["checkpoint_equal"] and r["manifest_equal"] for r in result["replays"])
            and result["python_continuation"]["passed"] and s["sampled_domain_gate"] and s["sampled_cfl_gate"]
            and s["wave_absolute_gate"] and s["noise_resolution_gate"]
            and all(r["bounded_growth_gate"] for r in s["noise"])
            and all(r["order_gate"] for r in s["wave_orders"].values())
            and all(r["time_control_gate"] for r in result["temporal_control"].values()))
    except Exception as exc:
        result["errors"].append({"campaign": type(exc).__name__, "error": str(exc)})
    result["identity_after"] = {"source": source_identity(), "binary_sha256": sha256(binary),
                                "prior_receipt_sha256": sha256(args.binary_receipt), "protocol_sha256": sha256(PROTOCOL)}
    result["identity_unchanged"] = result["identity_after"] == result["identity_before"]
    result["bounded_screening_passed"] &= result["identity_unchanged"]
    result["elapsed_seconds"] = time.perf_counter()-started
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p)
                                 for p in sorted(directory.rglob("*")) if p.is_file()}
    write_new_json(directory/"receipt.json", result)
    print(json.dumps({"receipt": str(directory/"receipt.json"), "completed": result["completed"],
                      "bounded_screening_passed": result["bounded_screening_passed"], "errors": result["errors"]}), flush=True)
    return 0 if result["completed"] and result["identity_unchanged"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
