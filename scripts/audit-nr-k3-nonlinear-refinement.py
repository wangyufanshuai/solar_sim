"""Independent metric diagnostics/refinement decisions, not physical admission."""
from __future__ import annotations

import argparse
from copy import deepcopy
import hashlib
import json
import math
from pathlib import Path
import runpy
import shutil
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
HELPER = ROOT/"scripts/audit-nr-k3-full58-sbp.py"
HELPER_SHA = "c841f85b8934a7e6bef7437c165330fc1065bb6d7c6bffe7f055f7f224d9f588"
PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-nonlinear-refinement-audit.md"
RUN_PROTOCOL = "science/numerical_relativity/EXPERIMENT-20261009-nonlinear-refinement.md"
PARENT = EVIDENCE/"nr-k3-nonlinear-sat-v1-20261009/receipt.json"
PARENT_SHA = "e51a2b6dd4ad3ec3ed613135ef67561dae2ba3c6d9f105f90ac1464ae6d7a281"
PARENT_AUDIT = EVIDENCE/"nr-k3-nonlinear-sat-audit-v1-20261009.json"
PARENT_AUDIT_SHA = "1e6149bb69b53826b0dde9be17cbbba72b6b71b6a65226d52d847c45513be7c6"
EXTRA = (RUN_PROTOCOL, "scripts/run-nr-k3-nonlinear-refinement.py", "scripts/tests/test_nr_nonlinear_refinement.py",
         "science/numerical_relativity/EXPERIMENT-20261009-deadline-transition.md",
         "science/numerical_relativity/EXPERIMENT-20261009-deadline-transition-v2.md")
FLAGS = ("physical_validation", "physical_boundary_validated", "black_hole_evolution_validated",
         "amr_validated", "waveform_validated", "gpu_validated", "runtime_writeback",
         "scientificPayloadWriteback", "cpbc_ready", "strong_hyperbolicity_validated")
MATRIX = (("spatial-9", 9, 1./256, 8, False), ("spatial-13", 13, 1./256, 8, False),
          ("spatial-17", 17, 1./256, 8, False), ("temporal-coarse", 13, 1./128, 4, True),
          ("temporal-medium", 13, 1./256, 8, True), ("temporal-fine", 13, 1./512, 16, True))
EXPECTED_TRANSITIONS = {
    "scripts/run-nr-k3-initial-rhs-locality.py": (
        "5f315a6dcb9f42195ac86687a18af1366af6438962a3409ed6da966f809dcf6c",
        "644380dac80d3ddbe29d0578a254f0a8984fe2e6265e1481118eadda3df2115e"),
    "scripts/run-nr-k3-rk-stage-locality.py": (
        "e3e448edf7bdde7b570bc4628972192a91901dddbf353109b822934792b24eb7",
        "88e21026f47dd8f71d2fed1072a1e16241b8d9b7a313066d9ea923e400f50b32"),
    "scripts/tests/test_nr_rk_stage_locality.py": (
        "b488b7f82f3e39519202eb767630b1e7a866cf240a4fdf8628a1bb7ee7358687",
        "e5c769eaf148f3567f4ea1996310b954a9ab13d6323efe0cc7c3a06f38eb4f10"),
}
PAIRS = tuple((i, j) for i in range(3) for j in range(i, 3))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


require(sha(HELPER) == HELPER_SHA, "independent SBP helper changed")
SBP = runpy.run_path(str(HELPER))["sbp_matrix"]


def bounded(base, name):
    require(isinstance(name, str) and name and not Path(name).is_absolute(), "relative path required")
    path = (base/name).resolve()
    require(path.is_relative_to(base.resolve()) and path.is_file(), "bounded existing file required")
    return path


def finite(value):
    return type(value) in (int, float) and math.isfinite(value)


def same(left, right):
    return json.dumps(left, sort_keys=True, allow_nan=False) == json.dumps(right, sort_keys=True, allow_nan=False)


def derivative(matrix, values, axis):
    return np.moveaxis(np.tensordot(matrix, values, axes=(1, axis)), 0, axis)


def tensor_fields(q):
    require(q.ndim == 4 and q.shape[0] == 58 and q.shape[1] in (9, 13, 17)
            and q.shape[1:] == (q.shape[1],)*3 and q.dtype == np.float64 and np.all(np.isfinite(q)),
            "finite canonical FP64 9/13/17 cube required")
    n = q.shape[1]
    shape = (n,)*3
    h, a = (np.zeros((*shape, 3, 3)) for _ in range(2))
    d = np.zeros((*shape, 3, 3, 3))
    for slot, (i, j) in enumerate(PAIRS):
        h[..., i, j] = h[..., j, i] = q[slot]
        a[..., i, j] = a[..., j, i] = q[11+slot]
        for k in range(3):
            d[..., k, i, j] = d[..., k, j, i] = q[37+6*k+slot]
    require(np.all(np.linalg.eigvalsh(h) > 0.), "positive definite saved metric required")
    with np.errstate(over="raise", under="raise", invalid="raise"):
        chi, alpha = np.exp(2.*q[10]), np.exp(q[6])
    require(np.all((alpha > 0.) & (alpha < 2.)) and np.all(chi > 0.), "saved gauge outside admissible range")
    metric = h/chi[..., None, None]
    inverse = np.linalg.inv(metric)
    extrinsic = (a+h*q[17, ..., None, None]/3.)/chi[..., None, None]
    mixed = np.einsum("...ik,...kj->...ij", inverse, extrinsic)
    trace = np.trace(mixed, axis1=-2, axis2=-1)
    matrix, w = SBP(n)

    def dx(field, axis):
        return derivative(matrix, field, axis)

    dg = [dx(metric, axis) for axis in range(3)]
    gamma = np.zeros((*shape, 3, 3, 3))
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
    hamiltonian = np.einsum("...ij,...ij->...", inverse, ricci)+trace**2-np.einsum("...ij,...ji->...", mixed, mixed)
    momentum = np.empty((*shape, 3))
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
    require(all(np.all(np.isfinite(value)) for value in fields.values()), "nonfinite reconstructed fields")
    return fields, w[:, None, None]*w[None, :, None]*w[None, None, :]


def initial_slots(n, perturbed=False):
    xyz = np.stack(np.meshgrid(*(np.linspace(1., 3., n) for _ in range(3)), indexing="ij"), axis=-1)
    r = np.linalg.norm(xyz, axis=-1)
    q = np.zeros((58, n, n, n))
    q[[0, 3, 5]] = 1.
    q[6] = np.log((r-.5)/(r+.5))
    q[10] = 2.*np.log(r/(r+.5))
    for axis in range(3):
        q[25+axis] = xyz[..., axis]/(r*(r*r-.25))
        q[55+axis] = xyz[..., axis]/(r*r*(r+.5))
    if perturbed:
        x, y, z = np.moveaxis(xyz, -1, 0)
        for slot in range(11, 58):
            phase = .17*slot
            q[slot] += 1.e-4*(np.sin(x+2.*y+3.*z+phase)+.5*np.cos(2.*x-y+z-.3*phase)
                              +.25*np.sin(x-3.*y+2.*z+.7*phase))/1.75
    return q


def rms(field, weights, mask=None):
    if mask is None:
        mask = np.ones(weights.shape, dtype=bool)
    squared = np.mean(field.reshape((*weights.shape, -1))**2, axis=-1)
    return float(np.sqrt(np.sum((weights*squared)[mask])/np.sum(weights[mask])))


def norms(q, reference):
    fields, weights = tensor_fields(q)
    fields["state_error"] = np.moveaxis(q-reference, 0, -1)
    n = q.shape[1]
    xyz = np.meshgrid(*(np.linspace(1., 3., n) for _ in range(3)), indexing="ij")
    boundary = np.zeros((n, n, n), dtype=int)
    central = np.ones((n, n, n), dtype=bool)
    for coordinate in xyz:
        boundary += (coordinate == 1.) | (coordinate == 3.)
        central &= (coordinate >= 1.5) & (coordinate <= 2.5)
    masks = {"whole": np.ones_like(central), "central_box": central,
             "faces": boundary == 1, "edges": boundary == 2, "corners": boundary == 3}
    return {region: {key: rms(value, weights, mask) for key, value in fields.items()} for region, mask in masks.items()}


def decision_pair(coarse, fine, ratio, minimum, maximum=None):
    require(all(finite(v) and v >= 0. for v in (coarse, fine)) and ratio > 1., "finite refinement differences required")
    resolved = coarse > 2.e-13 and fine > 2.e-13
    p = math.log(coarse/fine)/math.log(ratio) if resolved else None
    passed = bool(resolved and coarse > fine and p >= minimum and (maximum is None or p <= maximum))
    return dict(coarse_error=coarse, fine_error=fine, refinement_ratio=ratio, floor=2.e-13,
                observed_order=p, resolved=resolved, passed=passed,
                status="passed" if passed else ("failed" if resolved else "unresolved"))


def compare_decision(observed, stored):
    require(set(observed) == set(stored), "decision fields changed")
    for key, expected in observed.items():
        if key in ("observed_order", "coarse_error", "fine_error") and expected is not None:
            allowance = 1.e-7 if key == "observed_order" else 2.e-12
            require(finite(stored[key]) and abs(stored[key]-expected) <= allowance, "numeric decision disagreement")
        else:
            require(same(stored[key], expected), "decision status/type disagreement")


def check_stages(stages):
    require(len(stages) == 4 and all(type(s.get("stage")) is int for s in stages)
            and [s["stage"] for s in stages] == [1, 2, 3, 4], "ordered four-stage record required")
    for s in stages:
        require(all(finite(s.get(k)) for k in ("cfl", "max_basis_condition", "max_characteristic_residual",
                    "min_lapse", "min_chi", "det_h_max_error", "sat_max_abs")), "finite stage values required")
        require(0. < s["cfl"] <= .25*(1.+1.e-14) and 0. < s["max_basis_condition"] <= 1.e6
                and 0. <= s["max_characteristic_residual"] <= 2.e-11 and 0. < s["min_lapse"] < 2.
                and s["min_chi"] > 0. and 0. <= s["det_h_max_error"] <= 1.e-10, "stage bounds failed")
        require([(r.get("axis"), r.get("side")) for r in s["faces"]] == [(a, b) for a in range(3) for b in range(2)]
                and all(type(r.get("axis")) is int and type(r.get("side")) is int
                        and finite(r.get("sat_max_abs")) and r["sat_max_abs"] >= 0. for r in s["faces"]), "signed face matrix changed")
        digest = s.get("coefficients_sha256")
        require(isinstance(digest, str) and len(digest) == 64 and all(c in "0123456789abcdef" for c in digest)
                and type(s.get("basis_builds")) is int and s["basis_builds"] > 0
                and s["sat_max_abs"] == max(r["sat_max_abs"] for r in s["faces"]), "stage coupling identity changed")


def check_case(row, spec, parent):
    label, n, dt, steps, perturbed = spec
    require(row.get("label") == label and row.get("completed") is True and row.get("input_unchanged") is True
            and row.get("phase") == "completed" and "failure" not in row, "completed case required")
    require(all(type(row.get(k)) is int for k in ("n", "steps", "attempted_step", "last_completed_step"))
            and (row["n"], row["steps"], row["attempted_step"], row["last_completed_step"]) == (n, steps, steps-1, steps-1)
            and finite(row.get("dt")) and row["dt"] == dt and row.get("perturbed") is perturbed
            and finite(row.get("end_time")) and row["end_time"] == 1./32, "frozen matrix changed")
    require(row.get("initial_array") == label+"-initial.npy" and row.get("final_array") == label+"-final.npy",
            "saved state binding changed")
    require([r.get("step") for r in row["step_records"]] == list(range(steps))
            and all(type(r.get("step")) is int for r in row["step_records"]), "ordered unique steps required")
    expected = deepcopy(parent["operator_identity"])
    expected["shape"] = expected["volume_operator"]["shape"] = [n]*3
    expected["volume_operator"]["spacing"] = [2./(n-1)]*3
    require(same(row["operator_identity"], expected) and same(row["parameters"], parent["parameters"]),
            "unchanged formulation/operator required")
    for step in row["step_records"]:
        check_stages(step["stages"])


def check_identity(data, directory, parent, parent_audit):
    require(data.get("schema") == "nr-nonlinear-refinement-campaign-v1" and data.get("completed") is True
            and data.get("errors") == [] and data.get("closure_completed") is False
            and all(data.get(k) is False for k in FLAGS), "complete unadmitted campaign required")
    require(type(data.get("refinement_screen_passed")) is bool and data.get("parent_sha256") == PARENT_SHA
            and data.get("protocol_sha256") == data["source_before"].get(RUN_PROTOCOL), "campaign identity changed")
    require(same(data.get("resource_caps"), dict(seconds=2400., output_bytes=64*1024**2,
                c_reserve=3*1024**3, e_reserve=4*1024**3+32*1024**2)), "frozen resource contract changed")
    require(data["source_before"] == data["source_after"], "campaign source drift")
    inherited = {**parent["source_after"], **parent_audit["auditor_sources"]}
    require(set(data["source_after"]) == set(inherited) | set(EXTRA), "complete inherited source set required")
    transition_path = bounded(directory, "transition.json")
    require(sha(transition_path) == data["transition_sha256"], "transition artifact changed")
    transition = json.loads(transition_path.read_text(encoding="utf-8"))
    expected = {name: {"old_sha256": pair[0], "new_sha256": pair[1]} for name, pair in EXPECTED_TRANSITIONS.items()}
    require(transition.get("schema") == "nr-deadline-source-transition-v2" and transition.get("transition_completed") is True
            and same(transition.get("transitions"), expected) and transition["source_after"] == data["source_after"]
            and transition.get("parent_sha256") == PARENT_SHA and transition.get("audit_sha256") == PARENT_AUDIT_SHA
            and transition.get("replay_sha256") == "bdacba46c4cb2ab04d3e80cc660ce242eaf4eb7e65604b6aaf5ab6495a5b39d4"
            and all(transition.get(k) is False for k in FLAGS), "explicit exact source transition required")
    for name, old in inherited.items():
        new = data["source_after"][name]
        require((old, new) == EXPECTED_TRANSITIONS[name] if name in EXPECTED_TRANSITIONS else old == new,
                "inherited source transition mismatch")
    distinct = set()
    for name, digest in data["source_after"].items():
        source = bounded(ROOT, name)
        require(sha(source) == digest and sha(bounded(directory/"source-snapshot", name)) == digest,
                "current/saved source identity mismatch")
        distinct.add(source)
    expected_artifacts = {p.relative_to(directory).as_posix() for p in directory.rglob("*")
                          if p.is_file() and p != directory/"receipt.json"}
    require(set(data["artifact_hashes"]) == expected_artifacts, "complete artifact manifest required")
    for name, digest in data["artifact_hashes"].items():
        require(sha(bounded(directory, name)) == digest, "saved artifact changed")
    return len(distinct), len(expected_artifacts)


def audit(receipt):
    require(receipt.name == "receipt.json" and receipt.parent.parent == EVIDENCE.resolve(), "bounded campaign receipt required")
    require(sha(PARENT) == PARENT_SHA and sha(PARENT_AUDIT) == PARENT_AUDIT_SHA, "closed parent changed")
    parent = json.loads(PARENT.read_text(encoding="utf-8"))
    parent_audit = json.loads(PARENT_AUDIT.read_text(encoding="utf-8"))
    data = json.loads(receipt.read_text(encoding="utf-8"))
    source_count, artifact_count = check_identity(data, receipt.parent, parent, parent_audit)
    require(len(data["cases"]) == 6, "six complete cases required")
    results, finals = [], []
    max_norm_error = max_seed_error = 0.
    active = True
    for row, spec in zip(data["cases"], MATRIX, strict=True):
        label, n, _dt, _steps, perturbed = spec
        check_case(row, spec, parent)
        initial, final = [np.load(bounded(receipt.parent, label+suffix+".npy"), allow_pickle=False)
                          for suffix in ("-initial", "-final")]
        require(initial.shape == final.shape == (58, n, n, n), "saved grid changed")
        seed, reference = initial_slots(n, perturbed), initial_slots(n)
        max_seed_error = max(max_seed_error, float(np.max(abs(initial-seed))))
        computed = {"initial_measurements": norms(initial, reference), "final_measurements": norms(final, reference)}
        for phase, regions in computed.items():
            require(set(row[phase]) == set(regions), "region coverage mismatch")
            for region, values in regions.items():
                require(set(row[phase][region]) == set(values), "diagnostic coverage mismatch")
                for key, value in values.items():
                    recorded = row[phase][region][key]
                    require(finite(recorded) and recorded >= 0., "finite diagnostic required")
                    max_norm_error = max(max_norm_error, abs(recorded-value))
        results.append(dict(label=label, **computed))
        if perturbed:
            finals.append(final)
            stages = [s for step in row["step_records"] for s in step["stages"]]
            active &= max(s["sat_max_abs"] for s in stages) > 2.e-12 and len({s["coefficients_sha256"] for s in stages}) > 1
    require(max_seed_error <= 2.e-14 and max_norm_error <= 2.e-12, "independent initial/diagnostic reconstruction differs")
    spatial = []
    for metric in ("state_error", "H_metric", "M_metric"):
        for a, b in ((0, 1), (1, 2)):
            spatial.append(dict(metric=metric, grids=[MATRIX[a][1], MATRIX[b][1]],
                **decision_pair(results[a]["final_measurements"]["whole"][metric],
                                results[b]["final_measurements"]["whole"][metric],
                                (MATRIX[b][1]-1)/(MATRIX[a][1]-1), 1.5)))
    _d, w = SBP(13)
    weights = w[:, None, None]*w[None, :, None]*w[None, None, :]
    differences = [rms(np.moveaxis(finals[i]-finals[i+1], 0, -1), weights) for i in (0, 1)]
    temporal = decision_pair(*differences, 2., 3.5, 4.5)
    recorded = data["decision"]
    require(len(recorded["spatial"]) == len(spatial), "complete spatial decision matrix required")
    for expected, observed in zip(spatial, recorded["spatial"], strict=True):
        compare_decision(expected, observed)
    compare_decision(temporal, recorded["temporal"])
    spatial_passed = all(r["passed"] for r in spatial)
    passed = bool(spatial_passed and temporal["passed"] and active)
    require(recorded.get("passed") is passed and data["refinement_screen_passed"] is passed
            and recorded.get("spatial_passed") is spatial_passed and recorded.get("temporal_passed") is temporal["passed"]
            and recorded.get("active_updated_sat") is active and type(recorded.get("stages_checked")) is int
            and recorded["stages_checked"] == 208 and type(recorded.get("disturbed_stages")) is int
            and recorded["disturbed_stages"] == 112, "aggregate decision mismatch")
    return dict(audit_completed=True, refinement_screen_passed=passed, spatial=spatial, temporal=temporal,
                independent_saved_arrays=12, distinct_saved_array_hashes=len({sha(bounded(receipt.parent, spec[0]+suffix+".npy"))
                    for spec in MATRIX for suffix in ("-initial", "-final")}),
                maximum_diagnostic_difference=max_norm_error, maximum_initial_slot_difference=max_seed_error,
                source_keys_checked=len(data["source_after"]), distinct_source_files_checked=source_count,
                artifacts_checked=artifact_count, cases=results, receipt_sha256=sha(receipt))


def storage_guard():
    require(shutil.disk_usage("C:/").free >= 3*1024**3 and shutil.disk_usage(ROOT).free >= 4*1024**3+32*1024**2,
            "C/E storage reserve reached")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    require(output.parent == EVIDENCE.resolve() and not output.exists(), "fresh audit output required")
    storage_guard()
    started = time.perf_counter()
    paths = (Path(__file__).resolve(), ROOT/PROTOCOL, HELPER, ROOT/"scripts/tests/test_nr_nonlinear_refinement_audit.py")
    before = {p.relative_to(ROOT).as_posix(): sha(p) for p in paths}
    result = dict(schema="nr-nonlinear-refinement-independent-audit-v1", audit_completed=False,
                  refinement_screen_passed=False, closure_completed=False, separate_process_exact_replay=False,
                  intermediate_stage_states_independently_recomputed=False, errors=[],
                  scope="independent diagnostic/decision transcription, not independent physical evolution",
                  **{key: False for key in FLAGS})
    try:
        result.update(audit(args.receipt.resolve()))
        storage_guard()
    except Exception as error:
        result.update(audit_completed=False, refinement_screen_passed=False)
        result["errors"].append(f"{type(error).__name__}: {error}")
    result["auditor_sources"] = before
    result["auditor_sources_after"] = {p.relative_to(ROOT).as_posix(): sha(p) for p in paths}
    if before != result["auditor_sources_after"]:
        result.update(audit_completed=False, refinement_screen_passed=False)
        result["errors"].append("auditor source identity changed")
    result["seconds"] = time.perf_counter()-started
    with output.open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(json.dumps(result, sort_keys=True, indent=2, allow_nan=False)+"\n")
    print(json.dumps({key: result[key] for key in ("audit_completed", "refinement_screen_passed", "errors", "seconds")}), flush=True)
    return 0 if result["audit_completed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
