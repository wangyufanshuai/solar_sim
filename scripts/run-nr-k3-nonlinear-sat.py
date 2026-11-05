"""First actual nonlinear stage-local SAT window, not physical admission."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import platform
import shutil
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube  # noqa: E402
from science.numerical_relativity.fo_ccz4_sbp_volume import FLAGS  # noqa: E402
from science.numerical_relativity.fo_ccz4_schwarzschild import SchwarzschildDomain, analytic_slots  # noqa: E402
from science.numerical_relativity.nr3d import Grid3D  # noqa: E402

EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
PARENT = EVIDENCE/"nr-k3-sbp-volume-v2-20261008/receipt.json"
PARENT_SHA = "4bf230893494e98eeea5f60d6405ee90c1d4dd90e579b3ad0676d6c2c32039b5"
CLOSURE = EVIDENCE/"nr-k3-sbp-volume-audit-v1-20261008.json"
CLOSURE_SHA = "cd40eb247972a021a7e48bda4b5f7debe36b009584bc2b37d5539670e283a446"
NATIVE = Path("C:/Users/86137/NRShadowEvidence/nr-k3-schwarzschild-domain-v1-20261007/native-build/Release/nr-k2-fo-ccz4-shadow.exe")
NATIVE_SHA = "fc7ffb4eb3b40fbe8547c7178eb3f274f5ccbc6f6fa5d5f1decd1e2f1f761cbc"
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261008-nonlinear-sat.md"
EXTRA = (PROTOCOL, "science/numerical_relativity/fo_ccz4_sbp_nonlinear.py",
         "science/numerical_relativity/test_fo_ccz4_sbp_nonlinear.py",
         "scripts/run-nr-k3-nonlinear-sat.py", "scripts/tests/test_nr_nonlinear_sat.py")
C_RESERVE, E_RESERVE, OUTPUT_CAP = 3*1024**3, 4*1024**3+32*1024**2, 32*1024**2
CASE_MATRIX = (("static", 1./1024, 4, 0), ("half-step", 1./2048, 8, 0),
               ("split-first", 1./1024, 2, 0), ("split-second", 1./1024, 2, 2),
               ("disturbed", 1./1024, 4, 0))
DIAGNOSTICS = frozenset(("H_metric", "M_metric", "det_h", "trace_a", "Theta", "C_A", "C_B", "C_D", "C_P"))


def require(value, message):
    if not value:
        raise ValueError(message)


def sha(path):
    with Path(path).open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def source_path(name):
    path = (ROOT/name).resolve()
    require(path.is_relative_to(ROOT) and path.is_file(), "bounded source required: "+name)
    return path


def source_identity():
    require(sha(PARENT) == PARENT_SHA and sha(CLOSURE) == CLOSURE_SHA, "closed parent identity changed")
    require(sha(NATIVE) == NATIVE_SHA, "native rollback changed")
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    closure = json.loads(CLOSURE.read_text(encoding="utf-8"))
    require(parent["completed"] and parent["volume_gate_passed"] and closure["audit_completed"]
            and closure["separate_process_exact_replay"], "closed independent volume gate required")
    require(all(parent[k] is False and closure[k] is False for k in FLAGS), "admission flag changed")
    inherited = {**parent["source_after"], **closure["auditor_sources"]}
    for name, digest in inherited.items():
        require(sha(source_path(name)) == digest, "inherited source drift: "+name)
    for name, digest in parent["artifact_hashes"].items():
        path = (PARENT.parent/name).resolve()
        require(path.is_relative_to(PARENT.parent) and sha(path) == digest, "retained volume artifact drift")
    return {name: sha(source_path(name)) for name in sorted(set(inherited) | set(EXTRA))}


def initial_data():
    mesh = Grid3D((9,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
    q = np.array(analytic_slots(9, 4, SchwarzschildDomain()), dtype=np.float64)
    return NonlinearSBPCube(mesh), q


def disturbance(grid):
    x, y, z = grid.coordinates
    return np.array([(np.sin(x+2*y+3*z+.17*slot)+.5*np.cos(2*x-y+z-.3*.17*slot)
                      +.25*np.sin(x-3*y+2*z+.7*.17*slot))/1.75 for slot in range(58)])


def rms(values):
    return float(np.sqrt(np.mean(np.asarray(values)**2)))


def save_array(directory, name, values):
    with (directory/name).open("xb") as handle:
        np.save(handle, values, allow_pickle=False)


def fresh_output(path):
    path = path.resolve()
    require(path.parent == EVIDENCE.resolve() and not path.exists(), "fresh direct evidence directory required")
    return path


def guard(directory, started):
    require(time.perf_counter()-started <= 1200., "1200s nonlinear campaign cap reached")
    require(shutil.disk_usage("C:/").free >= C_RESERVE and shutil.disk_usage(ROOT).free >= E_RESERVE,
            "C/E storage reserve reached")
    size = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
    require(size < OUTPUT_CAP-4*1024**2, "32MiB output cap reached")


def case(driver, initial, reference, dt, steps, label, directory, started, *, records, start_index=0):
    # Register before any fallible work so a failed case cannot disappear from
    # the campaign receipt. A partial step is never counted as an accepted one.
    row = {"label": label, "dt": dt, "steps": steps, "start_index": start_index,
           "step_records": [], "completed": False, "phase": "preflight"}
    records.append(row)
    before = None
    try:
        guard(directory, started)
        before = initial.tobytes()
        q = np.ascontiguousarray(initial).copy()
        targets = driver.boundary_targets(reference)
        row["phase"] = "initial-diagnostics"
        row["initial_diagnostics"] = driver.diagnostics(q)
        require(valid_diagnostics(row["initial_diagnostics"]), "invalid initial diagnostics")
        for offset in range(steps):
            row["phase"] = "step"
            index = start_index+offset
            row["attempted_step"] = index
            guard(directory, started)
            q, stages = driver.step(q, index, dt, lambda _half: targets)
            row["step_records"].append({"step": index, "stages": stages})
            require(valid_stage_sequence(stages), "invalid RK stage record")
            row["last_completed_step"] = index
            guard(directory, started)
            print(json.dumps({"case": label, "step": index+1, "max_sat": max(r["sat_max_abs"] for r in stages),
                              "max_basis_condition": max(r["max_basis_condition"] for r in stages)}), flush=True)
        row["phase"] = "final-diagnostics"
        row.update(final_diagnostics=driver.diagnostics(q), input_unchanged=before == initial.tobytes(),
                   departure_rms=rms(q-reference))
        require(valid_diagnostics(row["final_diagnostics"]), "invalid final diagnostics")
        require(row["input_unchanged"] and math_finite_nonnegative(row["departure_rms"])
                and row["departure_rms"] < 1.e-2, "input mutation or bounded-window departure exceeded")
        row["phase"] = "save-final-array"
        guard(directory, started)
        name = label+"-final.npy"
        save_array(directory, name, q)
        row["final_array"] = name
        guard(directory, started)
        row.update(completed=True, phase="completed")
    except Exception as error:
        row.update(completed=False, failure=f"{type(error).__name__}: {error}")
        raise
    finally:
        if before is not None:
            row["input_unchanged"] = before == initial.tobytes()
    return row, q


def valid_diagnostics(values):
    return (isinstance(values, dict) and DIAGNOSTICS <= values.keys()
            and all(math_finite_nonnegative(value) for value in values.values()))


def valid_stage(stage):
    """Check the existing stage contract; missing/nonfinite data is not a pass."""
    scalar_keys = ("cfl", "max_basis_condition", "max_characteristic_residual",
                   "min_lapse", "min_chi", "sat_max_abs", "det_h_max_error")
    if not isinstance(stage, dict) or not all(math_finite_nonnegative(stage.get(key)) for key in scalar_keys):
        return False
    if not (0. < stage["cfl"] <= .25*(1.+1.e-14) and 0. < stage["max_basis_condition"] <= 1.e6
            and stage["max_characteristic_residual"] <= 2.e-11 and stage["min_lapse"] > 0. and stage["min_chi"] > 0.):
        return False
    faces = stage.get("faces")
    if not isinstance(faces, list) or len(faces) != 6:
        return False
    for face, expected in zip(faces, ((axis, side) for axis in range(3) for side in range(2)), strict=True):
        if (not isinstance(face, dict) or type(face.get("axis")) is not int or type(face.get("side")) is not int
                or (face["axis"], face["side"]) != expected or not math_finite_nonnegative(face.get("sat_max_abs"))):
            return False
    digest = stage.get("coefficients_sha256")
    return (type(stage.get("basis_builds")) is int and stage["basis_builds"] > 0
            and isinstance(digest, str) and len(digest) == 64 and all(c in "0123456789abcdef" for c in digest)
            and stage["sat_max_abs"] == max(face["sat_max_abs"] for face in faces))


def valid_stage_sequence(stages):
    return (isinstance(stages, list) and len(stages) == 4
            and all(valid_stage(stage) and type(stage.get("stage")) is int and stage["stage"] == index
                    for index, stage in enumerate(stages, 1)))


def evaluate(cases, timestep_ratio, restart_equal, minkowski_error):
    require([r["label"] for r in cases] == [entry[0] for entry in CASE_MATRIX],
            "complete nonlinear case matrix required")
    for row, (_label, dt, steps, start) in zip(cases, CASE_MATRIX, strict=True):
        require(row.get("dt") == dt and type(row.get("steps")) is int and row["steps"] == steps
                and type(row.get("start_index")) is int and row["start_index"] == start,
                "frozen timestep/step-count/restart-index required")
        require(all(type(step.get("step")) is int for step in row["step_records"])
                and [step["step"] for step in row["step_records"]] == list(range(start, start+steps)),
                "all80 RK stages require ordered unique step records")
    complete = all(r["completed"] is True and r["input_unchanged"] is True and "failure" not in r
                   and math_finite_nonnegative(r["departure_rms"]) and r["departure_rms"] < 1.e-2
                   and valid_diagnostics(r.get("initial_diagnostics")) and valid_diagnostics(r.get("final_diagnostics"))
                   for r in cases)
    rows = [stage for row in cases for step in row["step_records"] for stage in step["stages"]]
    require(len(rows) == 80, "all80 RK stages required")
    stages_ok = all(valid_stage_sequence(step["stages"]) for row in cases for step in row["step_records"])
    disturbed = [stage for step in cases[-1]["step_records"] for stage in step["stages"]]
    active_sat = stages_ok and max(r["sat_max_abs"] for r in disturbed) > 2.e-12
    updated = stages_ok and len({r["coefficients_sha256"] for r in disturbed}) > 1
    return dict(passed=bool(complete and stages_ok and active_sat and updated and restart_equal is True
                           and math_finite_nonnegative(timestep_ratio) and timestep_ratio <= 1.e-4
                           and math_finite_nonnegative(minkowski_error) and minkowski_error <= 2.e-14),
                stages_checked=len(rows), stage_records_valid=stages_ok,
                active_disturbance_sat=active_sat, stage_coefficients_updated=updated,
                restart_byte_equal=restart_equal is True, timestep_relative_rms=timestep_ratio, minkowski_max_error=minkowski_error,
                interpretation="bounded engineering coupling screen; not convergence/stability/physical boundary")


def math_finite_nonnegative(value):
    return (isinstance(value, (int, float, np.integer, np.floating)) and not isinstance(value, (bool, np.bool_))
            and bool(np.isfinite(value) and value >= 0.))


def receipt_payload(result):
    """Retain invalid values explicitly while making a failed receipt writable."""
    invalid = []

    def encode(value, path):
        if isinstance(value, dict):
            return {key: encode(item, f"{path}.{key}") for key, item in value.items()}
        if isinstance(value, (list, tuple)):
            return [encode(item, f"{path}[{index}]") for index, item in enumerate(value)]
        if isinstance(value, np.generic):
            value = value.item()
        if isinstance(value, float) and not np.isfinite(value):
            invalid.append(path)
            return {"invalid_nonfinite": repr(value)}
        return value

    encoded = encode(result, "$")
    if invalid:
        encoded.update(completed=False, coupling_screen_passed=False, nonfinite_record_paths=invalid)
        encoded.setdefault("errors", []).append("nonfinite recorded values retained as explicit invalid markers")
    return encoded


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    directory = fresh_output(args.output_directory)
    started = time.perf_counter()
    guard(directory, started)
    before = source_identity()
    directory.mkdir()
    result = dict(schema="nr-nonlinear-sbp-sat-campaign-v1", completed=False, coupling_screen_passed=False,
                  scope="actual nonlinear stage-local SAT/RK4; analytic incoming targets; no physical IBVP admission",
                  parent_sha256=PARENT_SHA, closure_sha256=CLOSURE_SHA, native_sha256=NATIVE_SHA,
                  protocol_sha256=sha(ROOT/PROTOCOL), source_before=before,
                  python=sys.version, numpy=np.__version__, platform=platform.platform(), cases=[], errors=[],
                  resource_caps={"seconds": 1200, "output_bytes": OUTPUT_CAP, "c_reserve": C_RESERVE, "e_reserve": E_RESERVE},
                  **{key: False for key in FLAGS})
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source_path(name), target)
            require(sha(target) == digest, "source snapshot mismatch")
        guard(directory, started)
        driver, q = initial_data()
        result["operator_identity"] = driver.identity
        result["parameters"] = {"gauge": vars(driver.gauge), "config": vars(driver.config), "profile": driver.profile.identity()}
        save_array(directory, "static-initial.npy", q)
        flat = np.zeros_like(q)
        flat[[0, 3, 5]] = 1.
        target = driver.boundary_targets(flat)
        flat_final, flat_stages = driver.step(flat, 0, 1./1024, lambda _half: target)
        result["minkowski_stages"] = flat_stages
        require(valid_stage_sequence(flat_stages), "invalid Minkowski RK stage record")
        flat_error = float(np.max(abs(flat_final-flat)))
        _, full = case(driver, q, q, 1./1024, 4, "static", directory, started, records=result["cases"])
        _, half = case(driver, q, q, 1./2048, 8, "half-step", directory, started, records=result["cases"])
        row, _ = case(driver, q, q, 1./1024, 2, "split-first", directory, started, records=result["cases"])
        middle = np.load(directory/row["final_array"], allow_pickle=False)
        _, split = case(driver, middle, q, 1./1024, 2, "split-second", directory, started,
                        records=result["cases"], start_index=2)
        disturbed = q.copy()
        disturbed[11:] += 1.e-4*disturbance(driver.volume.grid)[11:]
        save_array(directory, "disturbed-initial.npy", disturbed)
        case(driver, disturbed, q, 1./1024, 4, "disturbed", directory, started, records=result["cases"])
        result["decision"] = evaluate(result["cases"], rms(full-half)/rms(q), full.tobytes() == split.tobytes(), flat_error)
        guard(directory, started)
        result["completed"] = True
        result["coupling_screen_passed"] = result["decision"]["passed"]
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["source_after"] = {}
    for name in before:
        try:
            result["source_after"][name] = sha(source_path(name))
        except Exception as error:
            result["source_after"][name] = None
            result["errors"].append(f"source recheck {name}: {type(error).__name__}: {error}")
    if before != result["source_after"]:
        result["errors"].append("source/parent/closure/native identity drift")
    for path, digest in ((PARENT, PARENT_SHA), (CLOSURE, CLOSURE_SHA), (NATIVE, NATIVE_SHA)):
        try:
            require(sha(path) == digest, f"retained identity drift: {path.name}")
        except Exception as error:
            result["errors"].append(f"retained recheck: {type(error).__name__}: {error}")
    result["artifact_hashes"] = {}
    for path in sorted(directory.rglob("*")):
        if path.is_file():
            try:
                result["artifact_hashes"][path.relative_to(directory).as_posix()] = sha(path)
            except Exception as error:
                result["errors"].append(f"artifact recheck: {type(error).__name__}: {error}")
    result["completed"] &= not result["errors"]
    result["coupling_screen_passed"] &= result["completed"]
    result["seconds"] = time.perf_counter()-started
    result = receipt_payload(result)
    encoded = json.dumps(result, sort_keys=True, indent=2, allow_nan=False)+"\n"
    require(len(encoded.encode("utf-8")) <= 4*1024**2, "receipt reserve exceeded")
    with (directory/"receipt.json").open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(encoded)
    print(json.dumps({k: result[k] for k in ("completed", "coupling_screen_passed", "errors", "seconds")}), flush=True)
    return 0 if result["coupling_screen_passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
