"""Independent saved-metric diagnostics and exact nonlinear SAT replay audit.

No production evolution, geometry, state constructor or campaign is imported.
This is not a continuum solution, a stability proof or physical admission.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import runpy
import shutil
import sys
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
HELPER = ROOT/"scripts/audit-nr-k3-full58-sbp.py"
SBP = runpy.run_path(str(HELPER))["sbp_matrix"]
PROTOCOL = ROOT/"science/numerical_relativity/EXPERIMENT-20261009-nonlinear-sat-audit.md"
CAMPAIGN_FILES = ("science/numerical_relativity/EXPERIMENT-20261008-nonlinear-sat.md",
                  "science/numerical_relativity/fo_ccz4_sbp_nonlinear.py",
                  "science/numerical_relativity/test_fo_ccz4_sbp_nonlinear.py",
                  "scripts/run-nr-k3-nonlinear-sat.py", "scripts/tests/test_nr_nonlinear_sat.py")
FLAGS = ("physical_validation", "physical_boundary_validated", "black_hole_evolution_validated",
         "amr_validated", "waveform_validated", "gpu_validated", "runtime_writeback",
         "scientificPayloadWriteback", "cpbc_ready", "strong_hyperbolicity_validated")
MATRIX = (("static", 1./1024, 4, 0, "static-initial.npy"),
          ("half-step", 1./2048, 8, 0, "static-initial.npy"),
          ("split-first", 1./1024, 2, 0, "static-initial.npy"),
          ("split-second", 1./1024, 2, 2, "split-first-final.npy"),
          ("disturbed", 1./1024, 4, 0, "disturbed-initial.npy"))
ARRAYS = {"static-initial.npy", "disturbed-initial.npy"} | {entry[0]+"-final.npy" for entry in MATRIX}
PAIRS = tuple((i, j) for i in range(3) for j in range(i, 3))
RETAINED = {
    EVIDENCE/"nr-k3-sbp-volume-v2-20261008/receipt.json": "4bf230893494e98eeea5f60d6405ee90c1d4dd90e579b3ad0676d6c2c32039b5",
    EVIDENCE/"nr-k3-sbp-volume-audit-v1-20261008.json": "cd40eb247972a021a7e48bda4b5f7debe36b009584bc2b37d5539670e283a446",
    EVIDENCE/"nr-k3-schwarzschild-replay-e-storage-v1-20261008/receipt.json": "2aef22efc6bbb38fbbdcfed2211071487a709a81f01fab3a35fec99d360591c2",
    Path("C:/Users/86137/NRShadowEvidence/nr-k3-schwarzschild-domain-v1-20261007/native-build/Release/nr-k2-fo-ccz4-shadow.exe"):
        "fc7ffb4eb3b40fbe8547c7178eb3f274f5ccbc6f6fa5d5f1decd1e2f1f761cbc",
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def bounded(base, name):
    require(isinstance(name, str) and name and not Path(name).is_absolute(), "relative path required")
    path = (base/name).resolve()
    require(path.is_relative_to(base.resolve()) and path.is_file(), "bounded existing file required")
    return path


def finite(value):
    return type(value) in (int, float) and math.isfinite(value)


def same_record(left, right):
    # JSON equality must not silently equate booleans with numeric parameters.
    return json.dumps(left, sort_keys=True, allow_nan=False) == json.dumps(right, sort_keys=True, allow_nan=False)


def derivative(matrix, values, axis):
    return np.moveaxis(np.tensordot(matrix, values, axes=(1, axis)), 0, axis)


def tensor_fields(q):
    require(q.shape == (58, 9, 9, 9) and q.dtype == np.float64 and np.all(np.isfinite(q)), "finite FP64 canonical9 cube required")
    h, a = (np.zeros((9, 9, 9, 3, 3)) for _ in range(2))
    d = np.zeros((9, 9, 9, 3, 3, 3))
    for slot, (i, j) in enumerate(PAIRS):
        h[..., i, j] = h[..., j, i] = q[slot]
        a[..., i, j] = a[..., j, i] = q[11+slot]
        for k in range(3):
            d[..., k, i, j] = d[..., k, j, i] = q[37+6*k+slot]
    require(np.all(np.linalg.eigvalsh(h) > 0.), "positive definite saved conformal metric required")
    with np.errstate(over="raise", under="raise", invalid="raise"):
        chi = np.exp(2.*q[10])
        alpha = np.exp(q[6])
    require(np.all((alpha > 0.) & (alpha < 2.)) and np.all(chi > 0.), "positive saved lapse/conformal factor required")
    metric = h/chi[..., None, None]
    inverse = np.linalg.inv(metric)
    extrinsic = (a+h*q[17, ..., None, None]/3.)/chi[..., None, None]
    mixed = np.einsum("...ik,...kj->...ij", inverse, extrinsic)
    trace = np.trace(mixed, axis1=-2, axis2=-1)
    matrix, w = SBP(9)

    def dx(field, axis):
        return derivative(matrix, field, axis)

    dg = [dx(metric, axis) for axis in range(3)]
    gamma = np.zeros((9, 9, 9, 3, 3, 3))
    for k in range(3):
        for i in range(3):
            for j in range(3):
                for ell in range(3):
                    gamma[..., k, i, j] += .5*inverse[..., k, ell]*(dg[i][..., ell, j]
                        +dg[j][..., ell, i]-dg[ell][..., i, j])
    ricci = np.zeros_like(metric)
    for i in range(3):
        for j in range(3):
            for k in range(3):
                ricci[..., i, j] += dx(gamma[..., k, i, j], k)-dx(gamma[..., k, i, k], j)
                for ell in range(3):
                    ricci[..., i, j] += gamma[..., k, i, j]*gamma[..., ell, k, ell]
                    ricci[..., i, j] -= gamma[..., ell, i, k]*gamma[..., k, j, ell]
    scalar = np.einsum("...ij,...ij->...", inverse, ricci)
    hamiltonian = scalar+trace**2-np.einsum("...ij,...ji->...", mixed, mixed)
    momentum = np.empty((9, 9, 9, 3))
    for i in range(3):
        momentum[..., i] = -dx(trace, i)
        for j in range(3):
            momentum[..., i] += dx(mixed[..., j, i], j)
            for ell in range(3):
                momentum[..., i] += gamma[..., j, j, ell]*mixed[..., ell, i]
                momentum[..., i] -= gamma[..., ell, j, i]*mixed[..., j, ell]
    fields = dict(H_metric=hamiltonian, M_metric=momentum, det_h=np.linalg.det(h)-1.,
                  trace_a=np.einsum("...ij,...ij->...", np.linalg.inv(h), a), Theta=q[18],
                  C_A=np.stack([q[25+k]-dx(np.log(alpha), k) for k in range(3)], axis=-1),
                  C_P=np.stack([q[55+k]-dx(.5*np.log(chi), k) for k in range(3)], axis=-1),
                  C_B=np.stack([np.stack([q[28+3*k+i]-dx(q[7+i], k) for i in range(3)], axis=-1)
                                for k in range(3)], axis=-2),
                  C_D=d-.5*np.stack([dx(h, k) for k in range(3)], axis=-3))
    require(all(np.all(np.isfinite(value)) for value in fields.values()), "finite reconstructed constraints required")
    return fields, w[:, None, None]*w[None, :, None]*w[None, None, :]


def norms(q):
    fields, weights = tensor_fields(q)
    return {key: float(np.sqrt(np.sum(weights*np.mean(value.reshape(9, 9, 9, -1)**2, axis=-1))/np.sum(weights)))
            for key, value in fields.items()}


def initial_slots():
    xyz = np.stack(np.meshgrid(*(np.linspace(1., 3., 9) for _ in range(3)), indexing="ij"), axis=-1)
    r = np.linalg.norm(xyz, axis=-1)
    q = np.zeros((58, 9, 9, 9))
    q[[0, 3, 5]] = 1.
    q[6] = np.log((r-.5)/(r+.5))
    q[10] = 2.*np.log(r/(r+.5))
    q[25:28] = np.moveaxis(xyz/(r*(r*r-.25))[..., None], -1, 0)
    q[55:58] = np.moveaxis(xyz/(r*r*(r+.5))[..., None], -1, 0)
    disturbed = q.copy()
    x, y, z = np.moveaxis(xyz, -1, 0)
    for slot in range(11, 58):
        phase = .17*slot
        disturbed[slot] += 1.e-4*(np.sin(x+2.*y+3.*z+phase)+.5*np.cos(2.*x-y+z-.3*phase)
                                 +.25*np.sin(x-3.*y+2.*z+.7*phase))/1.75
    return q, disturbed


def check_stage_sequence(stages):
    require(len(stages) == 4 and all(type(r["stage"]) is int for r in stages)
            and [r["stage"] for r in stages] == [1, 2, 3, 4], "four ordered RK stages required")
    for row in stages:
        require(all(finite(row[key]) for key in ("cfl", "max_basis_condition", "max_characteristic_residual",
                    "sat_max_abs", "min_lapse", "min_chi", "det_h_max_error")), "finite stage diagnostics required")
        require(0. < row["cfl"] <= .25*(1.+1.e-14) and 0. < row["max_basis_condition"] <= 1.e6
                and 0. <= row["max_characteristic_residual"] <= 2.e-11 and 0. < row["min_lapse"] < 2.
                and row["min_chi"] > 0. and 0. <= row["det_h_max_error"] <= 1.e-10, "stage contract exceeded")
        faces = row["faces"]
        require(all(type(r["axis"]) is int and type(r["side"]) is int for r in faces)
                and [(r["axis"], r["side"]) for r in faces] == [(a, s) for a in range(3) for s in range(2)], "six distinct signed faces required")
        require(all(finite(r["sat_max_abs"]) and r["sat_max_abs"] >= 0. for r in faces)
                and row["sat_max_abs"] == max(r["sat_max_abs"] for r in faces), "SAT summary inconsistent")
        digest = row["coefficients_sha256"]
        require(type(row["basis_builds"]) is int and row["basis_builds"] > 0 and isinstance(digest, str)
                and len(digest) == 64 and all(c in "0123456789abcdef" for c in digest), "coefficient evidence missing")


def check_case(row, spec):
    label, dt, count, start, _initial = spec
    require(row.get("label") == label and row.get("completed") is True and row.get("input_unchanged") is True
            and row.get("phase") == "completed" and "failure" not in row, "failed or unfinished case")
    require(finite(row.get("dt")) and row["dt"] == dt
            and all(type(row.get(key)) is int for key in ("steps", "start_index", "last_completed_step", "attempted_step"))
            and (row["steps"], row["start_index"], row["last_completed_step"], row["attempted_step"])
            == (count, start, start+count-1, start+count-1), "frozen time/index matrix changed")
    require(all(type(r.get("step")) is int for r in row["step_records"])
            and [r["step"] for r in row["step_records"]] == list(range(start, start+count)), "ordered integer steps required")
    require(row.get("final_array") == label+"-final.npy", "wrong final-state binding")


def scope(data, parent, closure):
    require(data.get("schema") == "nr-nonlinear-sbp-sat-campaign-v1" and data.get("completed") is True
            and data.get("coupling_screen_passed") is True and data.get("errors") == [], "completed coupling screen required")
    require(all(data.get(key) is False for key in FLAGS), "no physical/live admission allowed")
    identity = data["operator_identity"]
    require(identity.get("schema") == "nr-actual-nonlinear-sbp-sat-shadow-v1" and identity.get("shape") == [9]*3,
            "actual nonlinear cube identity required")
    require(all(identity.get(key) is False for key in FLAGS+("algebraic_projection", "auxiliary_reconstruction",
                "common_symmetrizer_validated", "nonlinear_stability_validated", "native_checkpoint_supported")), "unadmitted identity required")
    require(same_record(data["parameters"], parent["parameters"])
            and same_record(identity["volume_operator"], parent["operator_identity"]), "parent formulation/volume changed")
    require(identity.get("source_included") is True
            and identity.get("boundary") == "six stage-local characteristic SATs with explicit incoming analytic data"
            and identity.get("coefficient_cache") == "exact bytes within one RHS only"
            and identity.get("integrator") == "RK4 in58 canonical slots; integer half-step boundary times"
            and identity.get("ode_pde_split") == "11+47; PDE advection removed for SVD", "nonlinear boundary/source contract changed")
    inherited = {**parent["source_after"], **closure["auditor_sources"]}
    require(set(data["source_after"]) == set(inherited) | set(CAMPAIGN_FILES)
            and all(data["source_after"][key] == value for key, value in inherited.items()), "complete inherited source identity required")
    retained = list(RETAINED.values())
    require(data.get("parent_sha256") == retained[0] and data.get("closure_sha256") == retained[1]
            and data.get("native_sha256") == retained[3]
            and data.get("protocol_sha256") == data["source_after"][CAMPAIGN_FILES[0]], "retained identity binding changed")
    require(same_record(data["resource_caps"], dict(seconds=1200, output_bytes=32*1024**2,
                        c_reserve=3*1024**3, e_reserve=4*1024**3+32*1024**2)), "frozen resource caps changed")


def audit(primary, replay):
    require(primary.is_file() and replay.is_file() and not primary.samefile(replay)
            and primary.parent.resolve() != replay.parent.resolve(), "distinct experiment receipts and directories required")
    first, second = (json.loads(path.read_text(encoding="utf-8")) for path in (primary, replay))
    require(same_record({k: v for k, v in first.items() if k != "seconds"},
                        {k: v for k, v in second.items() if k != "seconds"}), "exact scientific process replay required")
    for path, digest in RETAINED.items():
        require(sha(path) == digest, "retained evidence/native identity changed")
    parent, closure = (json.loads(path.read_text(encoding="utf-8")) for path in list(RETAINED)[:2])
    artifacts, resolved_sources = 0, {}
    for path, data in ((primary, first), (replay, second)):
        scope(data, parent, closure)
        require(data["source_before"] == data["source_after"], "source transition during experiment")
        expected_artifacts = {"source-snapshot/"+Path(name).as_posix() for name in data["source_after"]} | ARRAYS
        require(set(data["artifact_hashes"]) == expected_artifacts, "complete source and array artifact matrix required")
        for name, digest in data["source_after"].items():
            source = bounded(ROOT, name)
            require(source not in resolved_sources or resolved_sources[source] == digest, "conflicting source aliases")
            resolved_sources[source] = digest
            require(sha(source) == digest, "current source drift")
            key = "source-snapshot/"+Path(name).as_posix()
            require(data["artifact_hashes"].get(key) == digest, "source snapshot absent from artifact manifest")
        require({name for name in data["artifact_hashes"] if name.endswith(".npy")} == ARRAYS, "seven saved cubes required")
        for name, digest in data["artifact_hashes"].items():
            require(sha(bounded(path.parent, name)) == digest, "artifact checksum mismatch")
            artifacts += 1
    saved = {name: np.load(bounded(primary.parent, name), allow_pickle=False) for name in ARRAYS}
    computed = {name: norms(q) for name, q in saved.items()}
    seed, disturbed = initial_slots()
    initial_error = max(float(np.max(abs(seed-saved["static-initial.npy"]))),
                        float(np.max(abs(disturbed-saved["disturbed-initial.npy"]))))
    require(initial_error <= 2.e-14, "independent initial fields disagree")
    require([r["label"] for r in first["cases"]] == [r[0] for r in MATRIX], "five ordered cases required")
    rows, stages, max_error = [], [], 0.
    for row, spec in zip(first["cases"], MATRIX, strict=True):
        check_case(row, spec)
        label, _dt, _count, _start, initial = spec
        final = label+"-final.npy"
        for name, field in ((initial, "initial_diagnostics"), (final, "final_diagnostics")):
            require(set(row[field]) == set(computed[name]) and all(finite(v) and v >= 0. for v in row[field].values()), "invalid diagnostic matrix")
            max_error = max(max_error, *(abs(value-row[field][key]) for key, value in computed[name].items()))
        departure = float(np.sqrt(np.mean((saved[final]-saved["static-initial.npy"])**2)))
        require(finite(row["departure_rms"]) and abs(departure-row["departure_rms"]) <= 2.e-14
                and departure < 1.e-2, "bounded departure disagreement")
        for step in row["step_records"]:
            check_stage_sequence(step["stages"])
            stages.extend(step["stages"])
        rows.append(dict(label=label, departure_rms=departure, initial_norms=computed[initial], final_norms=computed[final]))
    require(len(stages) == 80 and max_error <= 2.e-12, "diagnostic reconstruction mismatch")
    check_stage_sequence(first["minkowski_stages"])
    exact_restart = saved["static-final.npy"].tobytes() == saved["split-second-final.npy"].tobytes()
    ratio = float(np.sqrt(np.mean((saved["static-final.npy"]-saved["half-step-final.npy"])**2))
                  /np.sqrt(np.mean(saved["static-initial.npy"]**2)))
    decision = first["decision"]
    disturbance_stages = [r for step in first["cases"][-1]["step_records"] for r in step["stages"]]
    require(exact_restart and finite(ratio) and ratio <= 1.e-4
            and finite(decision["timestep_relative_rms"]) and abs(ratio-decision["timestep_relative_rms"]) <= 2.e-14,
            "restart/timestep control failed")
    require(len({r["coefficients_sha256"] for r in disturbance_stages}) > 1
            and max(r["sat_max_abs"] for r in disturbance_stages) > 2.e-12, "inactive/frozen nonlinear coupling")
    require(finite(decision["minkowski_max_error"]) and 0. <= decision["minkowski_max_error"] <= 2.e-14
            and decision["stages_checked"] == 80 and all(decision.get(key) is True for key in (
                "passed", "stage_records_valid", "restart_byte_equal", "active_disturbance_sat", "stage_coefficients_updated")), "decision disagreement")
    return dict(schema="nr-nonlinear-sat-saved-state-audit-v1", audit_completed=True, separate_process_exact_replay=True,
                source_keys_checked=len(first["source_after"]), distinct_source_files_checked=len(resolved_sources),
                artifacts_checked=artifacts, independent_saved_states=len(saved), curved_stage_records=80,
                minkowski_stage_records=4, minkowski_final_state_independently_recomputed=False,
                intermediate_stage_states_independently_recomputed=False,
                maximum_diagnostic_difference=max_error, maximum_initial_slot_difference=initial_error,
                timestep_relative_rms=ratio, restart_byte_equal=exact_restart, cases=rows,
                primary_sha256=sha(primary), replay_sha256=sha(replay),
                scope="independent diagnostic transcription and replay, not independent physical evolution",
                **{key: False for key in FLAGS})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--replay", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    require(output.parent == EVIDENCE.resolve() and not output.exists(), "fresh audit output required")
    require(shutil.disk_usage("C:/").free >= 3*1024**3 and shutil.disk_usage(ROOT).free >= 4*1024**3+32*1024**2,
            "storage reserve reached")
    started = time.perf_counter()
    sources = (Path(__file__).resolve(), PROTOCOL, HELPER, ROOT/"scripts/tests/test_nr_nonlinear_sat_audit.py")
    before = {p.relative_to(ROOT).as_posix(): sha(p) for p in sources}
    result = dict(schema="nr-nonlinear-sat-saved-state-audit-v1", audit_completed=False,
                  separate_process_exact_replay=False, errors=[],
                  input_receipts=[str(args.receipt.resolve()), str(args.replay.resolve())],
                  **{key: False for key in FLAGS})
    try:
        result.update(audit(args.receipt.resolve(), args.replay.resolve()))
        require(shutil.disk_usage("C:/").free >= 3*1024**3 and shutil.disk_usage(ROOT).free >= 4*1024**3+32*1024**2,
                "storage reserve reached after audit")
    except Exception as error:
        result.update(audit_completed=False, separate_process_exact_replay=False)
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["auditor_sources"] = before
    result["auditor_sources_after"] = {p.relative_to(ROOT).as_posix(): sha(p) for p in sources}
    if before != result["auditor_sources_after"]:
        result.update(audit_completed=False, separate_process_exact_replay=False)
        result["errors"].append("auditor source changed during reconstruction")
    result["seconds"] = time.perf_counter()-started
    with output.open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(result, sort_keys=True, indent=2, allow_nan=False)+"\n")
    print(json.dumps({k: result.get(k) for k in ("audit_completed", "independent_saved_states", "maximum_diagnostic_difference", "errors", "seconds")}))
    return 0 if result["audit_completed"] else 1


if __name__ == "__main__":
    sys.exit(main())
