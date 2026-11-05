"""Frozen full58 three-dimensional SBP/SAT campaign; no live/native promotion."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import platform
import runpy
import shutil
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import fo_ccz4_sbp_cube as C  # noqa: E402
from science.numerical_relativity import fo_ccz4_sbp_frozen as F  # noqa: E402

BASE = runpy.run_path(str(ROOT/"scripts/run-nr-k3-full58-sbp.py"))
EVIDENCE = BASE["EVIDENCE"]
require, sha, save_array = BASE["require"], BASE["sha256"], BASE["save_array"]
PLANE = EVIDENCE/"nr-k3-full58-sbp-v1-20261008/receipt.json"
PLANE_SHA = "e69c15474f85414dbc3dad3a440f1be07e7612c9b8c99df71e2f4e5665d2b9af"
AUDIT = EVIDENCE/"nr-k3-full58-sbp-audit-v1-20261008.json"
AUDIT_SHA = "e5d83fe051c3643abfd8e46d6a659791c287ba5f18cf50a008b12aefb75c279a"
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261008-sbp-cube.md"
EXTRA = (PROTOCOL, "science/numerical_relativity/fo_ccz4_sbp_cube.py",
         "science/numerical_relativity/test_fo_ccz4_sbp_cube.py", "scripts/run-nr-k3-sbp-cube.py",
         "scripts/tests/test_nr_sbp_cube.py", "scripts/audit-nr-k3-full58-sbp.py",
         "scripts/tests/test_nr_full58_sbp_audit.py")
TIME, FLOOR, OUTPUT_CAP = .25, 2.e-12, 96*1024**2
FAMILIES = ("full58", "tt-plus")


def source_names():
    require(sha(PLANE) == PLANE_SHA and sha(AUDIT) == AUDIT_SHA, "plane/audit identity changed")
    plane = json.loads(PLANE.read_text(encoding="utf-8"))
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    require(plane["completed"] and plane["coupled_frozen_passed"] and not plane["errors"], "completed plane gate required")
    require(audit["audit_completed"] and not audit["errors"] and audit["state_count"] == 34, "completed saved-state audit required")
    require(audit["auditor_sha256"] == sha(ROOT/"scripts/audit-nr-k3-full58-sbp.py"), "auditor source changed")
    require(all(plane[key] is False for key in F.FLAGS), "plane physical scope changed")
    for name, digest in plane["source_after"].items():
        require(sha(BASE["bounded_path"](name)) == digest, "inherited source changed: "+name)
    return sorted(set(BASE["source_names"]()) | set(EXTRA))


def guard_factory(directory, started):
    def guard():
        require(time.perf_counter()-started <= 600., "600s cube campaign cap reached")
        require(shutil.disk_usage("C:/").free >= BASE["C_RESERVE"] and shutil.disk_usage(ROOT).free >= BASE["E_RESERVE"],
                "C/E disk reserve reached")
        used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
        require(used <= OUTPUT_CAP-4*1024**2, "96MiB cube cap with4MiB receipt reserve reached")
    return guard


def balance_passed(row):
    require(all(np.isfinite(v) for v in row.values()), "nonfinite cube balance")
    scale = max(1., *(abs(v) for v in row.values()))
    return abs(row["balance_residual"]) <= 2.e-11*scale


def advance(cube, initial, steps, dt, boundary, guard, *, start=0):
    q, balances = cube.field(initial).copy(), []
    peak = float(np.max(np.abs(q)))
    for index in range(start, start+steps+1):
        if (index-start) % 16 == 0:
            guard()
        if index in (start, start+steps//2, start+steps):
            report = cube.balance(q, None if boundary is None else boundary(2*index))
            balances.append({"step": index, "balance": report, "passed": balance_passed(report)})
        if index < start+steps:
            q = cube.step(q, index, dt, boundary)
            peak = max(peak, float(np.max(np.abs(q))))
            require(peak <= .05, "linear perturbation sanity bound exceeded")
    return q, balances, peak


def wave_case(cube, family, dt, category, directory, guard):
    steps = round(TIME/dt)
    require(steps*dt == TIME, "time step must divide fixed final time")
    waves = C.CubeWaves(cube, family, dt, steps)
    initial = waves.values(0)
    q, balances, peak = advance(cube, initial, steps, dt, waves, guard)
    exact = waves.exact_final()
    label = f"cube-{category}-{family}-n{cube.shape[0]}-dt{round(1./dt)}"
    row = {"category": category, "family": family, "n": cube.shape[0], "dt": dt, "steps": steps,
           "time": TIME, "state_error": cube.norm(q-exact[0]), "state_max_abs": peak,
           "balances": balances, "energy_identity_passed": all(r["passed"] for r in balances),
           "boundary_table_error": waves.table_error, "principal_linearity_error": waves.principal_linearity_error,
           "tt_closed_form_error": waves.tt_closed_form_error,
           "final_state": save_array(directory, label+".npy", q), **cube.diagnostics(q, exact)}
    print(json.dumps({"case": label, "state_error": row["state_error"]}), flush=True)
    return q, row, waves


def assess(cases):
    keys = [(r["family"], r["n"]) for r in cases]
    require(len(keys) == len(set(keys)) == 6 and set(keys) == {(f, n) for f in FAMILIES for n in (9, 17, 33)},
            "six unique cube spatial cases required")
    expected = {"H_metric", "H_fo", "M_stored_K", "M_metric", "Gamma_metric", "Theta", "trace_h", "trace_a",
                "C_A", "C_P", "C_B", "C_D"}
    for row in cases:
        require(set(row["constraint_errors"]) == expected, "12 exact cube constraint families required")
        require(all(np.isfinite(v) and v >= 0. for v in [row["state_error"], *row["constraint_errors"].values()]),
                "finite nonnegative cube errors required")
    groups = []
    for family in FAMILIES:
        rows = sorted((r for r in cases if r["family"] == family), key=lambda r: r["n"])
        errors = [r["state_error"] for r in rows]
        orders = [float(np.log2(a/b)) for a, b in zip(errors[:-1], errors[1:])] if min(errors) > FLOOR else None
        checks = []
        for name in sorted(expected):
            values = [r["constraint_errors"][name] for r in rows]
            for coarse, fine in zip(values[:-1], values[1:]):
                measured = min(coarse, fine) > FLOOR
                checks.append({"name": name, "coarse": coarse, "fine": fine,
                               "status": "measured" if measured else "bounded-null" if max(coarse, fine) <= FLOOR
                                         else "to-floor" if fine <= FLOOR else "from-floor-failed",
                               "order": float(np.log2(coarse/fine)) if measured else None,
                               "passed": fine < coarse if measured else fine <= FLOOR})
        groups.append({"family": family, "state_errors": errors, "state_orders": orders,
                       "state_passed": orders is not None and min(orders) >= 2.5,
                       "constraint_checks": checks, "constraints_passed": all(r["passed"] for r in checks)})
    return {"groups": groups, "passed": all(g["state_passed"] and g["constraints_passed"] for g in groups)}


def split_replay(cube, family, waves, expected, directory, guard):
    half, _, _ = advance(cube, waves.values(0), waves.steps//2, waves.dt, waves, guard)
    name = save_array(directory, "cube-split-"+family+".npy", half)
    restored = np.load(directory/name, allow_pickle=False)
    final, _, _ = advance(cube, restored, waves.steps//2, waves.dt, waves, guard, start=waves.steps//2)
    return {"family": family, "equal": bool(np.array_equal(final, expected)),
            "max_abs_difference": float(np.max(np.abs(final-expected))), "intermediate": name,
            "scope": "cube-npy-and-identical-halfstep-indices;not-native-checkpoint"}


def homogeneous(cube, directory, guard):
    x, y, z = np.meshgrid(*(np.linspace(-1., 1., n) for n in cube.shape), indexing="ij", sparse=True)
    j = np.arange(58)
    envelope = ((1.-x*x)*(1.-y*y)*(1.-z*z))**3
    initial = 1.e-3/np.sqrt(58.)*envelope[..., None]*np.sin(np.pi*(x[..., None]*(j%3+1)
               +y[..., None]*(j%2+1)+z[..., None]))*np.cos(j+1)
    q, balances, peak = advance(cube, initial, 128, 1./512., None, guard)
    return {"n": cube.shape[0], "time": TIME, "dt": 1./512., "steps": 128,
            "initial_norm": cube.norm(initial), "final_norm": cube.norm(q), "state_max_abs": peak,
            "balances": balances, "energy_identity_passed": all(r["passed"] for r in balances),
            "final_state": save_array(directory, f"cube-homogeneous-n{cube.shape[0]}.npy", q), **cube.diagnostics(q)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    directory = BASE["fresh_output"](args.output_directory)
    started = time.perf_counter()
    guard = guard_factory(directory, started)
    guard()
    names = source_names()
    before = {name: sha(BASE["bounded_path"](name)) for name in names}
    directory.mkdir()
    result = {"schema": "nr-full58-sbp-cube-campaign-v1", "completed": False, "cube_gate_passed": False,
              "scope": "three-dimensional-Minkowski-linearization;not-curved-or-nonlinear",
              "source_before": before, "plane_sha256": PLANE_SHA, "plane_audit_sha256": AUDIT_SHA,
              "protocol_sha256": sha(ROOT/PROTOCOL), "python": sys.version, "platform": platform.platform(),
              "numpy": np.__version__, "scipy": BASE["scipy"].__version__,
              "resource_caps": {"seconds": 600, "output_bytes": OUTPUT_CAP,
                                "c_reserve": BASE["C_RESERVE"], "e_reserve": BASE["E_RESERVE"]},
              "cases": [], "time_controls": [], "homogeneous": [], "split_replay": [], "errors": [],
              "cpbc_ready": False, "strong_hyperbolicity_validated": False, **{key: False for key in F.FLAGS}}
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT/name, target)
            require(sha(target) == digest, "source snapshot mismatch")
        systems = tuple(F.build_system(n) for n in np.eye(3))
        result["systems"] = [s.identity for s in systems]
        save_array(directory, "cube-operators.npy", np.stack([s.principal for s in systems]+[systems[0].source]))
        for family in FAMILIES:
            for n in (9, 17, 33):
                guard()
                cube = C.FrozenSBPCube.box(n, systems=systems)
                result["cube_identity"] = cube.identity
                q, row, waves = wave_case(cube, family, 1./512., "spatial", directory, guard)
                result["cases"].append(row)
                if n == 9:
                    result["split_replay"].append(split_replay(cube, family, waves, q, directory, guard))
            cube = C.FrozenSBPCube.box(9, systems=systems)
            states, rows = [], []
            for dt in (1./96., 1./192., 1./384.):
                guard()
                q, row, _ = wave_case(cube, family, dt, "temporal", directory, guard)
                states.append(q)
                rows.append(row)
            temporal = BASE["temporal_order"](cube, states)
            result["time_controls"].append({"family": family, "cases": rows, **temporal})
        for n in (9, 17, 33):
            guard()
            row = homogeneous(C.FrozenSBPCube.box(n, systems=systems), directory, guard)
            result["homogeneous"].append(row)
            print(json.dumps({"case": "homogeneous", "n": n, "norm": row["final_norm"]}), flush=True)
        result["spatial_assessment"] = assess(result["cases"])
        all_rows = result["cases"]+result["homogeneous"]+[r for g in result["time_controls"] for r in g["cases"]]
        result["energy_identity_passed"] = all(r["energy_identity_passed"] for r in all_rows)
        result["time_order_passed"] = all(g["passed"] for g in result["time_controls"])
        result["split_replay_passed"] = all(g["equal"] for g in result["split_replay"])
        result["cube_gate_passed"] = (result["spatial_assessment"]["passed"] and result["energy_identity_passed"]
                                      and result["time_order_passed"] and result["split_replay_passed"])
        guard()
        result["completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["source_after"] = {name: sha(BASE["bounded_path"](name)) for name in names}
    if before != result["source_after"] or sha(PLANE) != PLANE_SHA or sha(AUDIT) != AUDIT_SHA:
        result["errors"].append("source or parent identity drift")
    result["completed"] &= not result["errors"]
    result["cube_gate_passed"] &= result["completed"]
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    result["seconds"] = time.perf_counter()-started
    require(len(json.dumps(result, allow_nan=False).encode("utf-8")) <= 4*1024**2, "receipt reserve exceeded")
    BASE["new_json"](directory/"receipt.json", result)
    print(json.dumps({k: result[k] for k in ("completed", "cube_gate_passed", "errors", "seconds")}), flush=True)
    return 0 if result["completed"] and result["cube_gate_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
