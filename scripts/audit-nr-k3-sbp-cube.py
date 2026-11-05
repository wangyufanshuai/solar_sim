"""Independent dense-SBP/tensor reconstruction of saved linear cube states.

This audits artifacts and numerical diagnostics, not third-party physics.
No solver state, frozen criterion or old receipt is modified.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import runpy
import time

import numpy as np
from scipy.linalg import expm

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
PLANE = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-full58-sbp.py"))
require, sha = PLANE["require"], PLANE["sha"]
NORMALS = np.array(((1., 2., 3.), (-2., 1., 1.), (1., -3., 2.)))
NORMALS /= np.linalg.norm(NORMALS, axis=1)[:, None]


def derivative(matrix, values, axis):
    return np.moveaxis(np.tensordot(matrix, values, axes=(1, axis)), 0, axis)


def norm(values, weights):
    return float(np.sqrt(np.sum(weights*np.sum(values.reshape(weights.shape+(-1,))**2, axis=-1))))


def tensor_constraints(q, matrix, index):
    shape = q.shape[:3]
    gradient = [derivative(matrix, q, d) for d in range(3)]
    h, a = (np.empty(shape+(3, 3)) for _ in range(2))
    dg = np.empty((3,)+shape+(3, 3))
    d = np.empty(shape+(3, 3, 3))
    b = np.empty(shape+(3, 3))
    for i in range(3):
        for j in range(3):
            hs, aa = index[f"h{min(i,j)}{max(i,j)}"], index[f"A{min(i,j)}{max(i,j)}"]
            h[..., i, j], a[..., i, j] = q[..., hs], q[..., aa]
            for k in range(3):
                dg[k, ..., i, j] = gradient[k][..., hs]-2.*int(i == j)*gradient[k][..., index["ln_phi"]]
                d[..., k, i, j] = q[..., index[f"D{k}{min(i,j)}{max(i,j)}"]]
            b[..., i, j] = q[..., index[f"B{i}{j}"]]-gradient[i][..., index[f"beta{j}"]]
    p = np.stack([q[..., index[f"P{i}"]] for i in range(3)], axis=-1)
    connection, fo_connection = (np.empty(shape+(3, 3, 3)) for _ in range(2))
    for upper in range(3):
        for i in range(3):
            for j in range(3):
                connection[..., upper, i, j] = .5*(dg[i, ..., upper, j]+dg[j, ..., upper, i]-dg[upper, ..., i, j])
                fo_connection[..., upper, i, j] = (d[..., i, upper, j]+d[..., j, upper, i]-d[..., upper, i, j]
                    -int(upper == i)*p[..., j]-int(upper == j)*p[..., i]+int(i == j)*p[..., upper])
    curvatures = []
    for gamma in (connection, fo_connection):
        partial = [derivative(matrix, gamma, axis) for axis in range(3)]
        curvatures.append(sum(partial[k][..., k, i, i]-partial[i][..., k, i, k]
                              for i in range(3) for k in range(3)))
    extrinsic = a+q[..., index["K"], None, None]*np.eye(3)/3.
    dk = [derivative(matrix, extrinsic, axis) for axis in range(3)]
    momentum = np.stack([sum(dk[j][..., i, j]-dk[i][..., j, j] for j in range(3)) for i in range(3)], axis=-1)
    trace_a = np.trace(a, axis1=-2, axis2=-1)
    trace_h = np.trace(h, axis1=-2, axis2=-1)
    da = np.stack([derivative(matrix, trace_a, axis) for axis in range(3)], axis=-1)
    gamma_metric = np.stack([q[..., index[f"GammaHat{i}"]]
        -sum(gradient[j][..., index[f"h{min(i,j)}{max(i,j)}"]] for j in range(3))
        +.5*derivative(matrix, trace_h, i) for i in range(3)], axis=-1)
    return {"H_metric": curvatures[0], "H_fo": curvatures[1], "M_metric": momentum,
            "M_stored_K": momentum+da, "Gamma_metric": gamma_metric, "trace_h": trace_h,
            "trace_a": trace_a, "Theta": q[..., index["Theta"]],
            "C_A": np.stack([q[..., index[f"A{i}"]]-gradient[i][..., index["ln_alpha"]] for i in range(3)], axis=-1),
            "C_P": p-np.stack([gradient[i][..., index["ln_phi"]] for i in range(3)], axis=-1),
            "C_B": b.reshape(shape+(9,)),
            "C_D": np.stack([d[..., k, i, j]-.5*gradient[k][..., index[f"h{i}{j}"]]
                             for k in range(3) for i in range(3) for j in range(i, 3)], axis=-1)}


def continuum(n, family, time_value, operators, index):
    xyz = np.meshgrid(*(np.linspace(-1., 1., n) for _ in range(3)), indexing="ij", sparse=True)
    state = np.zeros((n, n, n, 58))
    fields = {}
    for normal, phase in zip(NORMALS, (0., .37, .81)):
        initial = PLANE["independent_mode"](family, normal, index)*np.exp(1j*phase)/3.
        generator = operators[3]+1j*np.pi*sum(normal[d]*operators[d] for d in range(3))
        mode = expm(time_value*generator)@initial
        if family == "tt-plus":
            require(np.max(np.abs(mode-initial*np.exp(-1j*np.pi*time_value))) <= 2.e-12, "TT continuum disagreement")
        wave = np.exp(1j*np.pi*sum(normal[d]*xyz[d] for d in range(3)))[..., None]*mode
        state += wave.real
        reference = PLANE["tensor_constraints"](*(np.real((1j*np.pi)**d*wave).reshape(-1, 58) for d in range(3)), normal, index)
        for key, values in reference.items():
            value = values.reshape((n, n, n)+values.shape[1:])
            fields[key] = fields.get(key, 0.)+value
    return state, fields


def audit(receipt, replay=None):
    first = json.loads(receipt.read_text(encoding="utf-8"))
    require(first["schema"] == "nr-full58-sbp-cube-campaign-v1" and first["completed"], "completed cube campaign required")
    receipts = [(receipt, first)]
    if replay is not None:
        other = json.loads(replay.read_text(encoding="utf-8"))
        require({k: v for k, v in first.items() if k != "seconds"} ==
                {k: v for k, v in other.items() if k != "seconds"}, "separate-process replay mismatch")
        receipts.append((replay, other))
    artifacts = 0
    for path, value in receipts:
        require(value["source_before"] == value["source_after"], "source drift")
        for name, digest in value["source_after"].items():
            source = (ROOT/name).resolve()
            require(source.is_relative_to(ROOT.resolve()) and sha(source) == digest, "current source mismatch")
        for name, digest in value["artifact_hashes"].items():
            source = (path.parent/name).resolve()
            require(source.is_relative_to(path.parent) and sha(source) == digest, "artifact mismatch")
            artifacts += 1
    rows = first["cases"]+[r for g in first["time_controls"] for r in g["cases"]]+first["homogeneous"]
    require(len(rows) == 15 and len({r["final_state"] for r in rows}) == 15, "15 distinct final states required")
    index = {name: i for i, name in enumerate(first["systems"][0]["variable_order"])}
    operators = np.load(receipt.parent/"cube-operators.npy", allow_pickle=False)
    require(operators.shape == (4, 58, 58) and np.all(np.isfinite(operators)), "invalid cube operators")
    state_errors, constraint_errors, audits, max_difference = {}, {}, [], 0.
    for row in rows:
        name, n = row["final_state"], row["n"]
        require(name in first["artifact_hashes"], "unbound saved state")
        q = np.load(receipt.parent/name, allow_pickle=False)
        require(q.shape == (n, n, n, 58) and np.all(np.isfinite(q)), "invalid saved cube")
        matrix, w = PLANE["sbp_matrix"](n)
        weights = w[:, None, None]*w[None, :, None]*w[None, None, :]
        fields = tensor_constraints(q, matrix, index)
        observed = {"constraint_norms": {k: norm(v, weights) for k, v in fields.items()}}
        if "family" in row:
            reference, exact = continuum(n, row["family"], row["time"], operators, index)
            state_errors[name] = norm(q-reference, weights)
            max_difference = max(max_difference, abs(state_errors[name]-row["state_error"]))
            observed["constraint_errors"] = {k: norm(fields[k]-v, weights) for k, v in exact.items()}
            observed["reference_constraint_norms"] = {k: norm(v, weights) for k, v in exact.items()}
            constraint_errors[name] = observed["constraint_errors"]
        local = max(abs(v-row[field][k]) for field, values in observed.items() for k, v in values.items())
        max_difference = max(max_difference, local)
        audits.append({"state": name, "max_norm_difference": local})
    require(max_difference <= 2.e-12, "independent tensor reconstruction mismatch")
    spatial_passed = []
    for group in first["spatial_assessment"]["groups"]:
        selected = sorted((r for r in first["cases"] if r["family"] == group["family"]), key=lambda r: r["n"])
        errors = [state_errors[r["final_state"]] for r in selected]
        state_passed = min(errors) > 2.e-12 and min(np.log2(errors[0]/errors[1]), np.log2(errors[1]/errors[2])) >= 2.5
        require(bool(state_passed) == group["state_passed"], "state refinement verdict disagreement")
        checks = []
        for key in constraint_errors[selected[0]["final_state"]]:
            values = [constraint_errors[r["final_state"]][key] for r in selected]
            checks.extend(fine < coarse if min(coarse, fine) > 2.e-12 else fine <= 2.e-12
                          for coarse, fine in zip(values[:-1], values[1:]))
        require(all(checks) == group["constraints_passed"], "constraint refinement verdict disagreement")
        spatial_passed.append(bool(state_passed and all(checks)))
    time_passed = []
    for group in first["time_controls"]:
        states = [np.load(receipt.parent/r["final_state"], allow_pickle=False) for r in group["cases"]]
        w = PLANE["sbp_matrix"](9)[1]
        weights = w[:, None, None]*w[None, :, None]*w[None, None, :]
        differences = [norm(a-b, weights) for a, b in zip(states[:-1], states[1:])]
        passed = min(differences) > 2.e-12 and np.log2(differences[0]/differences[1]) >= 3.5
        require(bool(passed) == group["passed"], "temporal verdict disagreement")
        time_passed.append(bool(passed))
    return {"state_count": len(rows), "state_audits": audits, "artifact_hashes_checked": artifacts,
            "max_norm_difference": max_difference, "separate_process_exact_replay": replay is not None,
            "spatial_passed_recomputed": all(spatial_passed), "time_passed_recomputed": all(time_passed),
            "retained_cube_gate_passed": first["cube_gate_passed"],
            "scope": "independent-dense-SBP-and-tensor-saved-state-reconstruction;not-third-party-physics"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--replay", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    receipt, output = args.receipt.resolve(), args.output.resolve()
    replay = None if args.replay is None else args.replay.resolve()
    require(receipt.is_relative_to(EVIDENCE.resolve()) and (replay is None or replay.is_relative_to(EVIDENCE.resolve())), "evidence scope required")
    require(output.parent == EVIDENCE.resolve() and not output.exists(), "fresh direct-child audit file required")
    started = time.perf_counter()
    result = {"schema": "nr-full58-sbp-cube-saved-state-audit-v1", "audit_completed": False, "errors": [],
              "auditor_sha256": sha(__file__), "helper_sha256": sha(ROOT/"scripts/audit-nr-k3-full58-sbp.py"),
              "receipt_sha256": sha(receipt), "replay_sha256": None if replay is None else sha(replay),
              "physical_validation": False, "runtime_writeback": False, "scientificPayloadWriteback": False}
    try:
        result.update(audit(receipt, replay))
        result["audit_completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["seconds"] = time.perf_counter()-started
    with output.open("x", encoding="utf-8") as stream:
        json.dump(result, stream, indent=2, sort_keys=True, allow_nan=False)
        stream.write("\n")
    print(json.dumps({k: result[k] for k in ("audit_completed", "errors", "seconds")}), flush=True)
    return 0 if result["audit_completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
