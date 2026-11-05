"""Read-only saved-stage audit. No production integrator/map/RHS imports.

Reconstructs RK arithmetic and the cofactor map from saved arrays; does not
recompute the Einstein RHS, prove stability, or confer any physical admission.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import xml.etree.ElementTree as ET

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT/"tmp/nr-shadow-evidence"
FLAGS = ("physical_validation", "physical_boundary_validated", "black_hole_evolution_validated",
         "amr_validated", "waveform_validated", "gpu_validated", "runtime_writeback",
         "scientificPayloadWriteback", "cpbc_ready", "strong_hyperbolicity_validated")
POLICIES = ("none", "endpoint", "stages-and-endpoint")


def require(ok, message):
    if not ok:
        raise ValueError(message)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def contained(root, name):
    path = (root/name).resolve()
    require(path.is_relative_to(root.resolve()), "path escape")
    return path


def projected(q):
    """Independent polynomial cofactor/cube-root map, explicit canonical slots."""
    result = q.copy()
    a, b, c, d, e, f = q[:6]
    det = a*(d*f-e*e)-b*(b*f-c*e)+c*(b*e-c*d)
    require(np.all(det > 0.), "positive cofactor determinant required")
    result[:6] /= np.cbrt(det)
    a, b, c, d, e, f = result[:6]
    det = a*(d*f-e*e)-b*(b*f-c*e)+c*(b*e-c*d)
    cofactors = (d*f-e*e, c*e-b*f, b*e-c*d, a*f-c*c, b*c-a*e, a*d-b*b)
    for offset in (11, 37, 43, 49):
        trace = sum(cofactors[j]*q[offset+j]*(2. if j in (1, 2, 4) else 1.) for j in range(6))/det
        result[offset:offset+6] = q[offset:offset+6]-result[:6]*trace/3.
    return result


def check_array(q, n):
    require(q.shape == (58, n, n, n) and q.dtype == np.float64 and np.all(np.isfinite(q)), "finite FP64 cube required")
    return q


def audit_case(row, initial, load):
    require(row["policy"] in POLICIES and row["completed"] is True and row["input_unchanged"] is True,
            "completed unmutated policy case required")
    policy, n, dt, steps = (row[k] for k in ("policy", "n", "dt", "steps"))
    q = check_array(initial, n).copy()
    observations = row["observations"]
    require(len(observations) == 5*steps and len(row["trajectory"]) == steps+1, "complete stage/endpoint sequence required")
    maximum = 0.
    for step in range(steps):
        records = observations[5*step:5*step+5]
        slopes = []
        for position, record in enumerate(records):
            stage = position+1 if position < 4 else 0
            half = 2*step+(0, 1, 1, 2, 2)[position]
            require(record["step"] == step and record["stage"] == stage and record["half_index"] == half
                    and record["completed"] is True, "integer RK stage identity mismatch")
            if position == 0:
                expected = q
            elif position in (1, 2):
                expected = q+.5*dt*slopes[-1]
            elif position == 3:
                expected = q+dt*slopes[-1]
            else:
                expected = q+dt*(slopes[0]+2.*slopes[1]+2.*slopes[2]+slopes[3])/6.
            raw = check_array(load(record["raw_array"]), n)
            effective = check_array(load(record["effective_array"]), n)
            require(raw.tobytes() == expected.tobytes(), "saved raw stage is not the declared RK combination")
            mapped = policy == "stages-and-endpoint" or policy == "endpoint" and stage == 0
            if mapped:
                error = float(np.max(abs(effective-projected(raw))/np.maximum(1., abs(effective))))
                require(error <= 2.e-12, "independent map disagreement")
                maximum = max(maximum, error)
            else:
                require(effective.tobytes() == raw.tobytes(), "undeclared stage projection")
            if stage:
                slopes.append(check_array(load(record["rhs_array"]), n))
            else:
                q = effective
                point = row["trajectory"][step+1]
                require(point["point"] == step+1 and point["time"] == (step+1)*dt
                        and point["array"] == record["effective_array"], "accepted endpoint link mismatch")
    return dict(label=row["label"], steps=steps, rhs_stages=4*steps, map_relative_max=maximum)


def audit_receipt(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    require(data["schema"] == "nr-projected-rk-policy-pilot-v1" and data["completed"] is True
            and data["component_passed"] is True and not data["errors"]
            and data["source_before"] == data["source_after"]
            and all(data.get(k) is False for k in FLAGS)
            and data["fo_ccz4_temporal_order_validated"] is data["old_failure_regraded"] is False,
            "completed unadmitted method pilot required")
    files = {p.relative_to(path.parent).as_posix() for p in path.parent.rglob("*") if p.is_file() and p != path}
    require(files == set(data["artifact_hashes"]), "complete artifact manifest required")
    for name, digest in data["artifact_hashes"].items():
        require(sha(contained(path.parent, name)) == digest, "artifact hash mismatch")
    for name, digest in data["source_after"].items():
        require(sha(contained(ROOT, name)) == digest, "current source drift")
    def load(name):
        return np.load(contained(path.parent, name), allow_pickle=False)
    initials = {}
    initial_error = 0.
    for initial in data["initial_data"]:
        raw, q = load(initial["original_array"]), load(initial["common_array"])
        initial_error = max(initial_error, float(np.max(abs(q-projected(raw))/np.maximum(1., abs(q)))))
        require(sha(contained(path.parent, initial["common_array"])) == initial["common_sha256"]
                and sha(contained(path.parent, initial["original_array"])) == initial["original_sha256"], "initial hash mismatch")
        initials[initial["label"]] = (q, initial["common_sha256"])
    require(initial_error <= 2.e-12 and set(initials) == {"static", "perturbed"}, "independent common initial mapping failed")
    matrix = [(f"static-{p}", p, 1, 1./256) for p in POLICIES]+[
        (f"perturbed-{p}-{n}", p, n, 1./(256*n)) for p in POLICIES for n in (1, 2, 4)]
    require(len(data["cases"]) == len(matrix), "complete12-case matrix required")
    cases = []
    for row, (label, policy, steps, dt) in zip(data["cases"], matrix, strict=True):
        require((row["label"], row["policy"], row["steps"], row["dt"], row["n"]) == (label, policy, steps, dt, 9),
                "fixed matrix mismatch")
        q, digest = initials["static" if label.startswith("static-") else "perturbed"]
        require(row["common_initial_sha256"] == digest, "policies used different initial data")
        cases.append(audit_case(row, q, load))
    return data, dict(receipt_sha256=sha(path), cases=cases, initial_map_relative_max=initial_error,
                      artifacts_checked=len(files), source_keys_checked=len(data["source_after"]))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--primary", type=Path, required=True)
    parser.add_argument("--replay", type=Path, required=True)
    parser.add_argument("--test-report", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    paths = [p.resolve() for p in (args.primary, args.replay, args.test_report, args.output)]
    require(all(p.is_relative_to(ROOT) for p in paths) and paths[-1].parent == EVIDENCE.resolve()
            and paths[0] != paths[1] and not paths[-1].exists(), "local inputs and fresh evidence output required")
    require(shutil.disk_usage("C:/").free >= 3*1024**3
            and shutil.disk_usage(ROOT).free >= 4*1024**3+32*1024**2+65536, "original disk reserves required")
    tests = list(ET.parse(paths[2]).getroot().iter("testcase"))
    require(tests and all(c.get("classname", "").endswith("scripts.tests.test_nr_projected_rk_audit") for c in tests)
            and not any(x.tag in ("failure", "error", "skipped") for c in tests for x in c), "green dedicated audit tests required")
    primary, p = audit_receipt(paths[0])
    replay, r = audit_receipt(paths[1])
    require({k: v for k, v in primary.items() if k != "seconds"} == {k: v for k, v in replay.items() if k != "seconds"},
            "separate-process scientific replay differs")
    result = dict(schema="nr-projected-rk-saved-stage-audit-v1", audit_completed=True,
        primary=p, replay=r, exact_replay_except_root_seconds=True,
        rhs_recomputed=False, temporal_order_validated=False,
        auditor_sha256=sha(Path(__file__)), tests_sha256=sha(paths[2]), tests_passed=len(tests),
        auditor_tests_source_sha256=sha(ROOT/"scripts/tests/test_nr_projected_rk_audit.py"),
        **{key: False for key in FLAGS})
    require(shutil.disk_usage("C:/").free >= 3*1024**3
            and shutil.disk_usage(ROOT).free >= 4*1024**3+32*1024**2+65536, "original disk reserves required")
    with paths[-1].open("x", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2, sort_keys=True, allow_nan=False)
        handle.write("\n")
    print(json.dumps(result, sort_keys=True), flush=True)


if __name__ == "__main__":
    main()
