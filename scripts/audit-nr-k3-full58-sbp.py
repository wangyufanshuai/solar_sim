"""Read-only saved-state audit, separate SBP matrix and metric-tensor algebra.

Does not rerun evolution, change campaign criteria, or claim a third-party
physical validation. Canonical operators are read from the hashed campaign;
the continuum matrix exponential shares those operators. TT has an additional
independent closed-form reference. Outputs never overwrite retained evidence.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import time

import numpy as np
from scipy.linalg import expm

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT/"tmp/nr-shadow-evidence"


def require(value, message):
    if not value:
        raise ValueError(message)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def sbp_matrix(n):
    h = 2./(n-1)
    d = np.zeros((n, n))
    rows = ((-24/17, 59/34, -4/17, -3/34), (-.5, 0., .5),
            (4/43, -59/86, 0., 59/86, -4/43), (3/98, 0., -59/98, 0., 32/49, -4/49))
    for i, row in enumerate(rows):
        d[i, :len(row)] = row
        d[-1-i, -len(row):] = -np.asarray(row)[::-1]
    for i in range(4, n-4):
        d[i, i-2:i+3] = (1/12, -2/3, 0., 2/3, -1/12)
    w = np.ones(n)
    w[:4] = (17/48, 59/48, 43/48, 49/48)
    w[-4:] = w[:4][::-1]
    return d/h, w*h


def tensor_constraints(q, dq, ddq, normal, index):
    n = np.asarray(normal)
    shape = (len(q), 3, 3)
    h, dh, ddh, a, da = (np.zeros(shape) for _ in range(5))
    for i in range(3):
        for j in range(3):
            hs, aa = index[f"h{min(i,j)}{max(i,j)}"], index[f"A{min(i,j)}{max(i,j)}"]
            h[:, i, j], dh[:, i, j], ddh[:, i, j] = q[:, hs], dq[:, hs], ddq[:, hs]
            a[:, i, j], da[:, i, j] = q[:, aa], dq[:, aa]
    metric_second = ddh-2.*ddq[:, index["ln_phi"], None, None]*np.eye(3)
    christoffel_derivative = np.zeros((len(q), 3, 3, 3))
    for upper in range(3):
        for i in range(3):
            for j in range(3):
                christoffel_derivative[:, upper, i, j] = .5*(
                    n[i]*metric_second[:, upper, j]+n[j]*metric_second[:, upper, i]
                    -n[upper]*metric_second[:, i, j])
    ricci = np.zeros(shape)
    for i in range(3):
        for j in range(3):
            ricci[:, i, j] = sum(n[k]*christoffel_derivative[:, k, i, j]
                                    -n[j]*christoffel_derivative[:, k, i, k] for k in range(3))
    dk = da+dq[:, index["K"], None, None]*np.eye(3)/3.
    momentum = np.einsum("j,nij->ni", n, dk)-np.trace(dk, axis1=1, axis2=2)[:, None]*n
    gradient_metric = np.empty((len(q), 3, 3, 3))
    d_gradient_metric = np.empty_like(gradient_metric)
    b = np.empty((len(q), 3, 3))
    for k in range(3):
        for i in range(3):
            b[:, k, i] = q[:, index[f"B{k}{i}"]]-n[k]*dq[:, index[f"beta{i}"]]
            for j in range(3):
                slot = index[f"D{k}{min(i,j)}{max(i,j)}"]
                gradient_metric[:, k, i, j] = q[:, slot]-.5*n[k]*dh[:, i, j]
                d_gradient_metric[:, k, i, j] = dq[:, slot]
    p = np.stack([q[:, index[f"P{i}"]] for i in range(3)], axis=1)
    dp = np.stack([dq[:, index[f"P{i}"]] for i in range(3)], axis=1)
    h_fo = sum(2.*n[i]*(d_gradient_metric[:, j, i, j]-d_gradient_metric[:, i, j, j])
               for i in range(3) for j in range(3))+4.*dp@n
    upper_pairs = [(i, j) for i in range(3) for j in range(i, 3)]
    return {"H_metric": np.trace(ricci, axis1=1, axis2=2), "H_fo": h_fo,
            "M_metric": momentum, "M_stored_K": momentum+np.trace(da, axis1=1, axis2=2)[:, None]*n,
            "Gamma_metric": np.stack([q[:, index[f"GammaHat{i}"]] for i in range(3)], axis=1)
                            -np.einsum("j,nij->ni", n, dh)+.5*np.trace(dh, axis1=1, axis2=2)[:, None]*n,
            "trace_h": np.trace(h, axis1=1, axis2=2), "trace_a": np.trace(a, axis1=1, axis2=2),
            "Theta": q[:, index["Theta"]],
            "C_A": np.stack([q[:, index[f"A{i}"]] for i in range(3)], axis=1)-dq[:, index["ln_alpha"], None]*n,
            "C_P": p-dq[:, index["ln_phi"], None]*n, "C_B": b.reshape(len(q), 9),
            "C_D": np.stack([gradient_metric[:, k, i, j] for k in range(3) for i, j in upper_pairs], axis=1)}


def norm(q, w):
    return float(np.sqrt(np.sum(w*np.sum(q.reshape(len(w), -1)**2, axis=1))))


def independent_mode(family, normal, index):
    if family == "full58":
        j = np.arange(1, 59)
        return 1.e-3*(np.sin(j)+1j*np.cos(2*j))/np.sqrt(58.)
    n = np.asarray(normal)
    a = np.eye(3)[np.argmin(np.abs(n))]
    a = a-n*(a@n)
    a /= np.linalg.norm(a)
    b = np.cross(n, a)
    h = 1.e-3*(np.outer(a, a)-np.outer(b, b))
    mode = np.zeros(58, dtype=complex)
    for i in range(3):
        for j in range(i, 3):
            mode[index[f"h{i}{j}"]] = h[i, j]
            mode[index[f"A{i}{j}"]] = .5j*np.pi*h[i, j]
            for k in range(3):
                mode[index[f"D{k}{i}{j}"]] = .5j*np.pi*n[k]*h[i, j]
    return mode


def audit(receipt_path, replay_path):
    first = json.loads(receipt_path.read_text(encoding="utf-8"))
    second = json.loads(replay_path.read_text(encoding="utf-8"))
    require(first["schema"] == second["schema"] == "nr-full58-sbp-campaign-v1", "wrong campaign schema")
    require({k: v for k, v in first.items() if k != "seconds"} ==
            {k: v for k, v in second.items() if k != "seconds"}, "separate-process replay mismatch")
    files_checked = 0
    for value, receipt in ((first, receipt_path), (second, replay_path)):
        require(value["source_before"] == value["source_after"], "campaign source drift")
        for name, digest in value["source_after"].items():
            path = (ROOT/name).resolve()
            require(path.is_relative_to(ROOT.resolve()) and sha(path) == digest, "current source mismatch")
        for name, digest in value["artifact_hashes"].items():
            path = (receipt.parent/name).resolve()
            require(path.is_relative_to(receipt.parent) and sha(path) == digest, "artifact mismatch")
            files_checked += 1
    rows = first["cases"]+[row for family in first["time_controls"] for row in family["cases"]]+first["homogeneous"]
    require(len(first["cases"]) == 24 and len(rows) == 34, "34 final state audits required")
    maximum_difference, state_errors, constraint_errors, audited = 0., {}, {}, []
    for row in rows:
        spec = first["systems"][row["direction"]]
        index = {name: i for i, name in enumerate(spec["variable_order"])}
        operators = np.load(receipt_path.parent/("operators-"+row["direction"]+".npy"), allow_pickle=False)
        principal, source, _, _, symmetrizer = operators
        q = np.load(receipt_path.parent/row["final_state"], allow_pickle=False)
        require(q.shape == (row["n"], 58) and np.all(np.isfinite(q)), "invalid stored full58 state")
        derivative, weights = sbp_matrix(row["n"])
        actual = tensor_constraints(q, derivative@q, derivative@derivative@q, spec["normal"], index)
        fields = {"constraint_norms": {k: norm(v, weights) for k, v in actual.items()}}
        if "family" in row:
            initial = independent_mode(row["family"], spec["normal"], index)
            mode = expm(row["time"]*(source+1j*np.pi*principal))@initial
            if row["family"] == "tt-plus":
                require(np.max(np.abs(mode-initial*np.exp(-1j*np.pi*row["time"]))) <= 2.e-12, "TT analytic mode mismatch")
            wave = np.exp(1j*np.pi*np.linspace(-1., 1., row["n"])[:, None])*mode
            reference = [np.real((1j*np.pi)**d*wave) for d in range(3)]
            exact = tensor_constraints(*reference, spec["normal"], index)
            fields["constraint_errors"] = {k: norm(actual[k]-v, weights) for k, v in exact.items()}
            constraint_errors[row["final_state"]] = fields["constraint_errors"]
            fields["reference_constraint_norms"] = {k: norm(v, weights) for k, v in exact.items()}
            error = q-reference[0]
            state_error = float(np.sqrt(np.sum(weights*np.einsum("ni,ij,nj->n", error, symmetrizer, error))))
            maximum_difference = max(maximum_difference, abs(state_error-row["state_error"]))
            state_errors[row["final_state"]] = state_error
        local = max(abs(v-row[field][k]) for field, values in fields.items() for k, v in values.items())
        maximum_difference = max(maximum_difference, local)
        audited.append({"state": row["final_state"], "max_constraint_norm_difference": local})
    require(maximum_difference <= 2.e-12, "independent saved-state recomputation mismatch")
    # Recompute spatial decisions without calling the campaign's classifier.
    for group in first["spatial_assessment"]["groups"]:
        selected = sorted((r for r in first["cases"] if r["direction"] == group["direction"]
                           and r["family"] == group["family"]), key=lambda r: r["n"])
        errors = [state_errors[r["final_state"]] for r in selected]
        orders = [float(np.log2(a/b)) for a, b in zip(errors[:-1], errors[1:])]
        require((min(orders) >= 2.5) == group["state_passed"], "spatial state verdict mismatch")
        checks = []
        for name in constraint_errors[selected[0]["final_state"]]:
            values = [constraint_errors[row["final_state"]][name] for row in selected]
            checks.extend(fine < coarse if min(coarse, fine) > 2.e-12 else fine <= 2.e-12
                          for coarse, fine in zip(values[:-1], values[1:]))
        require(all(checks) == group["constraints_passed"], "constraint refinement verdict mismatch")
    for group in first["time_controls"]:
        states = [np.load(receipt_path.parent/row["final_state"], allow_pickle=False) for row in group["cases"]]
        h = np.load(receipt_path.parent/"operators-x.npy", allow_pickle=False)[4]
        weights = sbp_matrix(17)[1]
        differences = [float(np.sqrt(np.sum(weights*np.einsum("ni,ij,nj->n", a-b, h, a-b))))
                       for a, b in zip(states[:-1], states[1:])]
        passed = min(differences) > 2.e-12 and np.log2(differences[0]/differences[1]) >= 3.5
        require(bool(passed) == group["passed"], "time-order verdict mismatch")
    return {"state_audits": audited, "state_count": len(rows), "artifact_hashes_checked": files_checked,
            "max_recomputed_norm_difference": maximum_difference, "separate_process_exact_replay": True,
            "campaign_completed": first["completed"], "retained_coupled_frozen_passed": first["coupled_frozen_passed"],
            "scope": "saved-state-matrix-SBP-and-tensor-constraint-reconstruction;not-third-party-physics"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--replay", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    receipt, replay, output = (p.resolve() for p in (args.receipt, args.replay, args.output))
    require(receipt.is_relative_to(EVIDENCE.resolve()) and replay.is_relative_to(EVIDENCE.resolve()), "evidence scope required")
    require(output.parent == EVIDENCE.resolve() and not output.exists(), "fresh workspace audit output required")
    started = time.perf_counter()
    result = {"schema": "nr-full58-sbp-saved-state-audit-v1", "audit_completed": False, "errors": [],
              "auditor_sha256": sha(__file__), "receipt_sha256": sha(receipt), "replay_sha256": sha(replay),
              "physical_validation": False, "runtime_writeback": False, "scientificPayloadWriteback": False}
    try:
        result.update(audit(receipt, replay))
        result["audit_completed"] = True
    except Exception as error:
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["seconds"] = time.perf_counter()-started
    with output.open("x", encoding="utf-8") as stream:
        json.dump(result, stream, sort_keys=True, indent=2, allow_nan=False)
        stream.write("\n")
    print(json.dumps({k: result[k] for k in ("audit_completed", "errors", "seconds")}), flush=True)
    return 0 if result["audit_completed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
