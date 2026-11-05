"""Prospective full58 frozen SBP/SAT campaign; never a native/physical admission."""
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
import scipy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.numerical_relativity import fo_ccz4_sbp_frozen as F  # noqa: E402

EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
ANCHOR = EVIDENCE/"nr-k3-boundary-compatibility-v1-20261008/receipt.json"
ANCHOR_SHA = "6db4c07fc63e9ed13ec569e5306cb2588ab264a5371818cc5831b1cb2dc8dd6a"
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-full58-sbp.md"
EXTRA = (
    "science/numerical_relativity/sbp_boundary_operator.py",
    "science/numerical_relativity/test_sbp_boundary_operator.py",
    "science/numerical_relativity/DECISION-20261008-boundary-gauge-route.md",
    "science/numerical_relativity/EXPERIMENT-20261008-full58-sbp.md",
    "science/numerical_relativity/fo_ccz4_sbp_frozen.py",
    "science/numerical_relativity/test_fo_ccz4_sbp_frozen.py",
    "scripts/run-nr-k3-full58-sbp.py", "scripts/tests/test_nr_full58_sbp.py",
)
NORMALS = {"x": (1., 0., 0.), "y": (0., 1., 0.), "z": (0., 0., 1.), "oblique": (1., 2., 3.)}
FAMILIES = ("full58", "tt-plus")
C_RESERVE, E_RESERVE = 3*1024**3, 4*1024**3+32*1024**2
OUTPUT_CAP, FLOOR, TIME = 32*1024**2, 2.e-12, .5


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def new_json(path, value):
    with Path(path).open("x", encoding="utf-8") as stream:
        json.dump(value, stream, sort_keys=True, indent=2, allow_nan=False)
        stream.write("\n")


def save_array(directory, name, value):
    with (directory/name).open("xb") as stream:
        np.save(stream, value, allow_pickle=False)
    return name


def fresh_output(path):
    directory = path.resolve()
    require(directory.parent == EVIDENCE.resolve(), "fresh direct child of workspace evidence required")
    require(not directory.exists(), "output already exists; no overwrite")
    return directory


def bounded_path(name):
    path = (ROOT/name).resolve()
    require(path.is_relative_to(ROOT.resolve()), "source outside workspace")
    require(path.is_file(), "source file missing: "+str(name))
    return path


def source_names():
    require(sha256(ANCHOR) == ANCHOR_SHA, "compatibility anchor changed")
    parent = json.loads(ANCHOR.read_text(encoding="utf-8"))
    require(parent["completed"] is True and parent["prediction_passed"] is True and not parent["errors"],
            "completed compatibility anchor required")
    require(parent["source_before"] == parent["source_after"] and len(parent["source_after"]) == 247,
            "247 stable inherited sources required")
    require(all(parent[key] is False for key in F.FLAGS), "anchor scope changed")
    for name, digest in parent["source_after"].items():
        require(sha256(bounded_path(name)) == digest, "inherited source changed: "+name)
    return sorted(set(parent["source_after"]) | set(EXTRA))


def guard_factory(directory, started):
    def guard(*, enforce_time=True):
        require(not enforce_time or time.perf_counter()-started <= 600., "600s campaign cap reached")
        require(shutil.disk_usage("C:/").free >= C_RESERVE and shutil.disk_usage(ROOT).free >= E_RESERVE,
                "C/E disk reserve reached")
        used = sum(p.stat().st_size for p in directory.rglob("*") if p.is_file()) if directory.exists() else 0
        require(used <= OUTPUT_CAP-4*1024**2, "32MiB cap with4MiB receipt reserve reached")
    return guard


def balance_passed(row):
    require(all(np.isfinite(v) for v in row.values()), "nonfinite energy report")
    scale = max(1., *(abs(v) for v in row.values()))
    return (abs(row["balance_residual"]) <= 2.e-11*scale
            and abs(row["boundary_identity_residual"]) <= 2.e-11*scale
            and row["source_excess"] <= 2.e-11*scale)


def diagnostics(line, q, exact_fields=None):
    first = line.operator.derivative(q)
    second = line.operator.derivative(first)
    observed = F.constraint_fields(q, first, second, line.system.normal)
    result = {"constraint_norms": {k: F.weighted_l2(v, line.operator.norm_weights) for k, v in observed.items()}}
    if exact_fields is not None:
        exact = F.constraint_fields(*exact_fields, line.system.normal)
        result["constraint_errors"] = {k: F.weighted_l2(observed[k]-v, line.operator.norm_weights) for k, v in exact.items()}
        result["reference_constraint_norms"] = {k: F.weighted_l2(v, line.operator.norm_weights) for k, v in exact.items()}
    return result


def advance(line, initial, steps, dt, boundary, guard, *, start_step=0):
    q = initial.copy()
    balances = []
    peak = float(np.max(np.abs(q)))
    samples = {start_step, start_step+steps//4, start_step+steps//2, start_step+3*steps//4, start_step+steps}
    for index in range(start_step, start_step+steps+1):
        if (index-start_step) % 32 == 0:
            guard()
        if index in samples:
            row = line.balance(q, boundary(2*index) if boundary is not None else None)
            balances.append({"step": index, "balance": row, "passed": balance_passed(row)})
        if index < start_step+steps:
            q = line.step(q, index, dt, boundary)
            peak = max(peak, float(np.max(np.abs(q))))
    return q, balances, peak


def plane_case(system, direction, n, family, dt, directory, guard, *, category="spatial"):
    steps = round(TIME/dt)
    require(steps*dt == TIME, "dt must exactly divide final time")
    line = F.FrozenSBPLine(system, F.SBP42(n, 2./(n-1)))
    x = np.linspace(-1., 1., n)
    mode = F.plane_mode(family, system.normal)
    table = F.PlaneBoundary(system, mode, dt, steps)
    initial = F.plane_values(mode, x)
    q, balances, peak = advance(line, initial, steps, dt, table, guard)
    reference = [F.plane_values(table.final_mode, x, derivative=d) for d in range(3)]
    label = f"{category}-{direction}-{family}-n{n}-dt{round(1./dt)}"
    row = {"direction": direction, "n": n, "family": family, "dt": dt, "steps": steps, "time": TIME,
           "operator": line.operator.identity, "state_error": line.norm(q-reference[0]),
           "state_euclidean_error": F.weighted_l2(q-reference[0], line.operator.norm_weights),
           "state_max_abs": peak, "boundary_table_error": table.table_error,
           "balances": balances, "energy_identity_passed": all(r["passed"] for r in balances),
           "final_state": save_array(directory, label+".npy", q), **diagnostics(line, q, reference)}
    if family == "tt-plus":
        row["tt_closed_form_error"] = float(np.max(np.abs(table.final_mode-np.exp(-1j*np.pi*TIME)*mode)))
        row["tt_continuum_passed"] = row["tt_closed_form_error"] <= FLOOR
    print(json.dumps({"case": label, "state_error": row["state_error"], "energy_identity_passed": row["energy_identity_passed"]}), flush=True)
    return q, row


def refinement(cases):
    keys = [(r["direction"], r["family"], r["n"]) for r in cases]
    expected = {(d, f, n) for d in NORMALS for f in FAMILIES for n in (17, 33, 65)}
    require(len(keys) == len(set(keys)) == 24 and set(keys) == expected, "24 unique spatial cases required")
    names = set(cases[0]["constraint_errors"])
    require(len(names) == 12, "all12 constraint families required")
    for row in cases:
        require(set(row["constraint_errors"]) == names, "constraint family coverage mismatch")
        require(all(np.isfinite(v) and v >= 0. for v in [row["state_error"], *row["constraint_errors"].values()]),
                "finite nonnegative error norms required")
    groups = []
    for direction in NORMALS:
        for family in FAMILIES:
            rows = sorted((r for r in cases if r["direction"] == direction and r["family"] == family), key=lambda r: r["n"])
            errors = [r["state_error"] for r in rows]
            state_measurable = min(errors) > FLOOR
            orders = [float(np.log2(a/b)) for a, b in zip(errors[:-1], errors[1:])] if state_measurable else None
            checks = []
            for name in rows[0]["constraint_errors"]:
                values = [r["constraint_errors"][name] for r in rows]
                for pair, (coarse, fine) in enumerate(zip(values[:-1], values[1:])):
                    measurable = min(coarse, fine) > FLOOR
                    status = ("measured" if measurable else "bounded-null" if max(coarse, fine) <= FLOOR
                              else "to-floor" if fine <= FLOOR else "from-floor-failed")
                    checks.append({"name": name, "pair": pair, "coarse": coarse, "fine": fine, "status": status,
                                   "order": float(np.log2(coarse/fine)) if measurable else None,
                                   "passed": fine < coarse if measurable else fine <= FLOOR})
            groups.append({"direction": direction, "family": family, "state_errors": errors, "state_orders": orders,
                           "state_passed": state_measurable and min(orders) >= 2.5,
                           "constraint_checks": checks, "constraints_passed": all(r["passed"] for r in checks)})
    return {"groups": groups, "passed": all(r["state_passed"] and r["constraints_passed"] for r in groups)}


def temporal_order(line, values):
    require(len(values) == 3, "three temporal states required")
    differences = [line.norm(a-b) for a, b in zip(values[:-1], values[1:])]
    measurable = min(differences) > FLOOR
    order = float(np.log2(differences[0]/differences[1])) if measurable else None
    return {"differences": differences, "order": order, "status": "measured" if measurable else "inconclusive-floor",
            "passed": measurable and order >= 3.5}


def split_replay(system, family, directory, guard, expected):
    line = F.FrozenSBPLine(system, F.SBP42(17, 1./8.))
    dt, steps = 1./512., 256
    mode = F.plane_mode(family, system.normal)
    table = F.PlaneBoundary(system, mode, dt, steps)
    initial = F.plane_values(mode, np.linspace(-1., 1., 17))
    half, _, _ = advance(line, initial, steps//2, dt, table, guard)
    name = save_array(directory, "split-"+family+"-half.npy", half)
    restored = np.load(directory/name, allow_pickle=False)
    result, _, _ = advance(line, restored, steps//2, dt, table, guard, start_step=steps//2)
    return {"family": family, "equal": bool(np.array_equal(result, expected)),
            "max_abs_difference": float(np.max(np.abs(result-expected))), "intermediate": name,
            "scope": "frozen-line-npy-and-identical-halfstep-indices;not-native-checkpoint"}


def homogeneous_case(system, direction, directory, guard):
    line = F.FrozenSBPLine(system, F.SBP42(33, 1./16.))
    x, j = np.linspace(-1., 1., 33)[:, None], np.arange(58)[None, :]
    initial = 1.e-3*(1.-x*x)**3*np.sin((j%3+1)*np.pi*x)*np.cos(j+1)/np.sqrt(58.)
    initial_energy = line.energy(initial)
    final, balances, peak = advance(line, initial, 256, 1./512., None, guard)
    bound = initial_energy*np.exp(2.*system.source_log_norm*TIME)
    energy = line.energy(final)
    return {"direction": direction, "n": 33, "time": TIME, "dt": 1./512., "steps": 256,
            "initial_energy": initial_energy, "final_energy": energy, "source_inclusive_bound": float(bound),
            "bound_passed": bool(energy <= bound+2.e-11*max(1., float(bound))), "state_max_abs": peak,
            "balances": balances, "energy_identity_passed": all(r["passed"] for r in balances),
            "final_state": save_array(directory, "homogeneous-"+direction+".npy", final), **diagnostics(line, final)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-directory", type=Path, required=True)
    args = parser.parse_args()
    directory = fresh_output(args.output_directory)
    started = time.perf_counter()
    guard = guard_factory(directory, started)
    guard()
    names = source_names()
    before = {name: sha256(bounded_path(name)) for name in names}
    directory.mkdir()
    result = {"schema": "nr-full58-sbp-campaign-v1", "completed": False, "coupled_frozen_passed": False,
              "scope": "full58-source-inclusive-Minkowski-plane-reduction;not-3D-nonlinear",
              "protocol_sha256": sha256(PROTOCOL), "parent_sha256": ANCHOR_SHA, "source_before": before,
              "python": sys.version, "numpy": np.__version__, "scipy": scipy.__version__, "platform": platform.platform(),
              "systems": {}, "cases": [], "time_controls": [], "homogeneous": [], "split_replay": [], "errors": [],
              "resource_caps": {"seconds": 600, "output_bytes": OUTPUT_CAP, "c_reserve": C_RESERVE, "e_reserve": E_RESERVE},
              "cpbc_ready": False, "strong_hyperbolicity_validated": False, **{key: False for key in F.FLAGS}}
    try:
        for name, digest in before.items():
            target = directory/"source-snapshot"/name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT/name, target)
            require(sha256(target) == digest, "source snapshot changed")
        for direction, normal in NORMALS.items():
            guard()
            system = F.build_system(normal)
            result["systems"][direction] = system.identity
            save_array(directory, "operators-"+direction+".npy",
                       np.stack((system.principal, system.source, system.basis, system.inverse_basis, system.symmetrizer)))
            for family in FAMILIES:
                for n in (17, 33, 65):
                    guard()
                    q, row = plane_case(system, direction, n, family, 1./512., directory, guard)
                    result["cases"].append(row)
                    if direction == "x" and n == 17:
                        result["split_replay"].append(split_replay(system, family, directory, guard, q))
                if direction == "x":
                    states, rows = [], []
                    for dt in (1./64., 1./128., 1./256.):
                        guard()
                        q, row = plane_case(system, direction, 17, family, dt, directory, guard, category="temporal")
                        states.append(q)
                        rows.append(row)
                    report = temporal_order(F.FrozenSBPLine(system, F.SBP42(17, 1./8.)), states)
                    result["time_controls"].append({"family": family, "cases": rows, **report})
            guard()
            result["homogeneous"].append(homogeneous_case(system, direction, directory, guard))
        result["spatial_assessment"] = refinement(result["cases"])
        result["energy_passed"] = all(r["energy_identity_passed"] for r in result["cases"]+result["homogeneous"])
        result["energy_passed"] &= all(r["energy_identity_passed"] for t in result["time_controls"] for r in t["cases"])
        result["energy_passed"] &= all(r["bound_passed"] for r in result["homogeneous"])
        result["time_order_passed"] = all(r["passed"] for r in result["time_controls"])
        result["split_replay_passed"] = all(r["equal"] for r in result["split_replay"])
        result["tt_continuum_passed"] = all(r.get("tt_continuum_passed", True) for r in result["cases"])
        result["coupled_frozen_passed"] = all(result[key] for key in
            ("energy_passed", "time_order_passed", "split_replay_passed", "tt_continuum_passed")) and result["spatial_assessment"]["passed"]
        result["completed"] = True
        guard()
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["source_after"] = {name: sha256(bounded_path(name)) for name in names}
    if result["source_after"] != before or sha256(ANCHOR) != ANCHOR_SHA:
        result["errors"].append("source or anchor changed during campaign")
    result["completed"] &= not result["errors"]
    result["coupled_frozen_passed"] &= result["completed"]
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): sha256(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    result["seconds"] = time.perf_counter()-started
    require(len(json.dumps(result, allow_nan=False).encode("utf-8")) <= 4*1024**2, "receipt reserve exceeded")
    new_json(directory/"receipt.json", result)
    print(json.dumps({key: result[key] for key in ("completed", "coupled_frozen_passed", "errors", "seconds")}), flush=True)
    return 0 if result["completed"] and result["coupled_frozen_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
