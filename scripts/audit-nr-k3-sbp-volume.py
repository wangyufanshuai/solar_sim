"""Independent static curved-volume algebra and exact process replay audit.

No production RHS, geometry, SBP implementation or campaign runner is imported.
The closed-form oracle applies ONLY to conformally flat static input, not to a
generic evolved state, nonlinear stability, a physical boundary or a black hole.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import runpy
import shutil
import time

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "tmp/nr-shadow-evidence"
HELPER = ROOT / "scripts/audit-nr-k3-full58-sbp.py"
SBP = runpy.run_path(str(HELPER))["sbp_matrix"]
PROTOCOL = ROOT / "science/numerical_relativity/EXPERIMENT-20261008-sbp-volume-audit.md"
PRIMARY_SHA = "4bf230893494e98eeea5f60d6405ee90c1d4dd90e579b3ad0676d6c2c32039b5"
PARENT = EVIDENCE / "nr-k3-sbp-cube-v1-20261008/receipt.json"
PARENT_SHA = "395e3068455ad9939e476d424b401794e82bb61aea50ebf4d589816dbdc7b886"
FAILED = EVIDENCE / "nr-k3-sbp-volume-v1-20261008/receipt.json"
FAILED_SHA = "f0c13f0e90ec3cfca14fd769fd1c771bb03d8eea2d66550a9ff1041b61576a93"
NATIVE = Path("C:/Users/86137/NRShadowEvidence/nr-k3-schwarzschild-domain-v1-20261007/native-build/Release/nr-k2-fo-ccz4-shadow.exe")
NATIVE_SHA = "fc7ffb4eb3b40fbe8547c7178eb3f274f5ccbc6f6fa5d5f1decd1e2f1f761cbc"
FLAGS = (
    "physical_validation", "physical_boundary_validated", "black_hole_evolution_validated",
    "amr_validated", "waveform_validated", "gpu_validated", "runtime_writeback",
    "scientificPayloadWriteback", "cpbc_ready", "strong_hyperbolicity_validated",
)
TRANSITIONS = {
    "science/numerical_relativity/fo_ccz4_rhs.py": "9f46de1be40409b4ee5412684df3ebb77cc96f2fc72ba9db43c42da9a883fdc3",
    "science/numerical_relativity/nr3d.py": "07a88b18da845c5c77d048d1de8694b6b54719de1b4179ca360221511a819451",
}
ARRAYS = {f"schwarzschild-n{n}-{label}.npy" for n in (17, 25, 33) for label in ("state", "rhs", "ricci")}
ARRAYS |= {"nonlinear-n9-state.npy", "nonlinear-n9-rhs.npy"}
REGIONS = ("core_rms", "whole_sbp_rms", "six_faces_rms")
SYMMETRIC = tuple((i, j) for i in range(3) for j in range(i, 3))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(path):
    with Path(path).open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def contained_file(base, name):
    require(isinstance(name, str) and name and not Path(name).is_absolute(), "relative artifact path required")
    path = (base / name).resolve()
    require(path.is_relative_to(base.resolve()) and path.is_file(), "bounded existing file required")
    return path


def compare_replay(first, second):
    require({k: v for k, v in first.items() if k != "seconds"}
            == {k: v for k, v in second.items() if k != "seconds"}, "scientific process replay mismatch")


def validate_scope(data):
    require(data.get("schema") == "nr-nonlinear-sbp-volume-campaign-v1", "wrong volume schema")
    require(data.get("scope") == "actual-nonlinear-FO-CCZ4-volume-only;no-IBVP-or-new-evolution", "wrong volume scope")
    require(data.get("completed") is True and data.get("volume_gate_passed") is True
            and data.get("errors") == [], "completed volume gate required")
    require(all(data.get(key) is False for key in FLAGS), "physical/live flags must remain false")
    identity = data.get("operator_identity", {})
    require(identity.get("boundary") == "sbp-volume" and identity.get("interior_order") == 4
            and identity.get("boundary_order") == 2, "explicit SBP(4,2) identity required")
    require(all(identity.get(key) is False for key in FLAGS + (
        "boundary_conditions_applied", "sat_applied", "fixed_halo", "evolution_supported",
        "auxiliaries_reconstructed")), "volume-only identity required")
    require(identity.get("auxiliary_fields_independent") is True
            and len(identity.get("variable_order", [])) == 58, "58 independent variables required")
    p = data["parameters"]
    require(p["gauge"] == dict(advective=True, lapse_coefficient=2., lapse_driver="one-plus-log",
            shift_coefficient=1., shift_damping=0., shift_driver="gamma-driver", theta_coupling=2.), "gauge changed")
    require(p["config"] == dict(c=1., cleaning_speed=1., k0=0., kappa1=.1, kappa2=0.,
            kappa3=1., ordering_mu=1., shift_strength=1., tau_inverse=1.), "configuration changed")
    require(p["profile"] == {
        "ordering_law": "mu=ordering_scale*chi", "shift_law": "f=shift_scale*alpha*chi",
        "parameters": {"ordering_scale": .2, "shift_scale": 3.}, "runtime_writeback": False,
        "schema_version": "fo-ccz4-state-dependent-gauge-shadow-v1",
    }, "state-dependent profile changed")


def analytic_state(n):
    require(type(n) is int and n >= 9, "integer grid with at least9 nodes required")
    coordinates = np.stack(np.meshgrid(*(np.linspace(1., 3., n) for _ in range(3)), indexing="ij"), axis=-1)
    r = np.sqrt(np.sum(coordinates**2, axis=-1))
    alpha = (r-.5)/(r+.5)
    q = np.zeros((58, n, n, n))
    q[[0, 3, 5]] = 1.
    q[6] = np.log(alpha)
    q[10] = 2.*np.log(r/(r+.5))
    q[25:28] = np.moveaxis(coordinates/(r*(r*r-.25))[..., None], -1, 0)
    q[55:58] = np.moveaxis(coordinates/(r*r*(r+.5))[..., None], -1, 0)
    unit = coordinates/r[..., None]
    ricci = (np.eye(3)-3.*unit[..., :, None]*unit[..., None, :])/(r**3*(1.+.5/r)**2)[..., None, None]
    return q, ricci


def check_array(value, shape):
    require(value.shape == shape and value.dtype == np.float64 and np.all(np.isfinite(value)),
            "finite float64 array of declared shape required")


def static_rhs(q):
    require(q.ndim == 4 and q.shape[0] == 58 and len(set(q.shape[1:])) == 1,
            "58-slot cubic static state required")
    n = q.shape[1]
    require(n >= 9, "at least9 nodes required")
    check_array(q, (58, n, n, n))
    active = {0, 3, 5, 6, 10, 25, 26, 27, 55, 56, 57}
    require(np.all(q[[0, 3, 5]] == 1.) and all(np.all(q[k] == 0.) for k in range(58) if k not in active),
            "oracle is restricted to conformally flat static structure")
    with np.errstate(over="raise", under="raise", invalid="raise"):
        alpha, chi = np.exp(q[6]), np.exp(2.*q[10])
    d, _ = SBP(n)

    def derivative(values, axis):
        moved = np.moveaxis(values, axis, 0)
        return np.moveaxis((d @ moved.reshape(n, -1)).reshape(moved.shape), 0, axis)

    a, p = np.moveaxis(q[25:28], 0, -1), np.moveaxis(q[55:58], 0, -1)
    da = np.stack([derivative(a, k) for k in range(3)], axis=-2)
    dp = np.stack([derivative(p, k) for k in range(3)], axis=-2)
    eye = np.eye(3)
    ricci = .5*(dp+np.swapaxes(dp, -1, -2)) + p[..., :, None]*p[..., None, :]
    ricci += eye*(np.trace(dp, axis1=-2, axis2=-1)-np.sum(p*p, axis=-1))[..., None, None]
    t = .5*(da+np.swapaxes(da, -1, -2)) + a[..., :, None]*a[..., None, :]
    t += p[..., :, None]*a[..., None, :]+a[..., :, None]*p[..., None, :]
    t -= eye*np.sum(p*a, axis=-1)[..., None, None]
    tensor = (alpha*chi)[..., None, None]*(ricci-t)
    trace = np.trace(tensor, axis1=-2, axis2=-1)
    trace_free = tensor-eye*trace[..., None, None]/3.
    rhs = np.zeros_like(q)
    for offset, (i, j) in enumerate(SYMMETRIC):
        rhs[11+offset] = trace_free[..., i, j]
    rhs[17] = trace
    rhs[18] = .5*alpha*chi*np.trace(ricci, axis1=-2, axis2=-1)
    curl = (.2*alpha**2*chi)[..., None, None]*(dp-np.swapaxes(dp, -1, -2))
    for k in range(3):
        for i in range(3):
            rhs[28+3*k+i] = curl[..., k, i]
    return rhs, ricci


def norms(values):
    n = values.shape[0]
    require(n in (17, 25, 33) and values.shape[:3] == (n, n, n)
            and np.all(np.isfinite(values)), "declared fixed-core grid required")
    # Nodes are exactly aligned at all three declared resolutions.
    points = (np.array((.5, .75, 1., 1.25, 1.5))*(n-1)/2.).astype(int)
    core = values[np.ix_(points, points, points)]
    _, w = SBP(n)
    component_square = np.mean(values.reshape(n, n, n, -1)**2, axis=-1)
    whole = np.einsum("i,j,k,ijk->", w, w, w, component_square)/float(np.sum(w)**3)
    faces = [np.take(values, side, axis=axis).ravel() for axis in range(3) for side in (0, -1)]
    return dict(core_rms=float(np.sqrt(np.mean(core**2))), whole_sbp_rms=float(np.sqrt(whole)),
                six_faces_rms=float(np.sqrt(np.mean(np.concatenate(faces)**2))))


def refinement(rows):
    require([r["points"] for r in rows] == [17, 25, 33], "complete refinement matrix required")
    results = []
    for metric in ("rhs", "ricci_error"):
        for region in REGIONS:
            for left, right in zip(rows[:-1], rows[1:], strict=True):
                a, b = left[metric][region], right[metric][region]
                require(math.isfinite(a) and math.isfinite(b) and a >= 0. and b >= 0., "invalid error norm")
                measurable = min(a, b) > 2.e-12
                order = math.log(a/b)/math.log((right["points"]-1)/(left["points"]-1)) if measurable else None
                passed = measurable and b < a and (region != "core_rms" or order >= 3.)
                results.append(dict(metric=metric, region=region, points=[left["points"], right["points"]],
                                    order=order, measurable=measurable, decreasing=b < a, passed=passed))
    return {"checks": results, "passed": all(row["passed"] for row in results)}


def audit_static(directory, recorded):
    require([row["points"] for row in recorded] == [17, 25, 33], "complete static matrix required")
    rows = []
    max_norm_difference = 0.
    for row in recorded:
        n = row["points"]
        q, saved_rhs, saved_ricci = (np.load(contained_file(directory, f"schwarzschild-n{n}-{label}.npy"),
                                            allow_pickle=False) for label in ("state", "rhs", "ricci"))
        check_array(q, (58, n, n, n))
        check_array(saved_rhs, q.shape)
        check_array(saved_ricci, (n, n, n, 3, 3))
        expected, analytic_ricci = analytic_state(n)
        input_difference = float(np.max(abs(q-expected)))
        require(input_difference <= 2.e-14, "analytic static input mismatch")
        rhs, ricci = static_rhs(q)
        rhs_difference, ricci_difference = (float(np.max(abs(a-b))) for a, b in ((rhs, saved_rhs), (ricci, saved_ricci)))
        require(max(rhs_difference, ricci_difference) <= 2.e-11, "independent static reconstruction mismatch")
        result = dict(points=n, rhs=norms(np.moveaxis(rhs, 0, -1)), ricci_error=norms(ricci-analytic_ricci),
                      input_difference=input_difference, rhs_difference=rhs_difference, ricci_difference=ricci_difference)
        for metric in ("rhs", "ricci_error"):
            for region in REGIONS:
                difference = abs(row[metric][region]-result[metric][region])
                require(difference <= 2.e-14, "independent diagnostic norm mismatch")
                max_norm_difference = max(max_norm_difference, difference)
        require(row["input_unchanged"] is True and row["surface_rhs_max_abs"] > 2.e-12, "surface/input gate failed")
        require(abs(row["analytic_ricci_max_abs"]-float(np.max(abs(analytic_ricci)))) <= 2.e-14, "curvature oracle mismatch")
        rows.append(result)
    return rows, max_norm_difference


def audit(receipt, replay):
    require(receipt.resolve() != replay.resolve(), "distinct replay receipt required")
    require(sha(receipt) == PRIMARY_SHA, "frozen primary receipt changed")
    first, second = (json.loads(p.read_text(encoding="utf-8")) for p in (receipt, replay))
    compare_replay(first, second)
    validate_scope(first)
    require(sha(PARENT) == PARENT_SHA and first["parent_sha256"] == PARENT_SHA, "parent identity changed")
    require(sha(FAILED) == FAILED_SHA and first["retained_failure_sha256"] == FAILED_SHA, "retained failure changed")
    require(sha(NATIVE) == NATIVE_SHA and first["native_sha256"] == NATIVE_SHA, "native binary changed")
    old = json.loads(PARENT.read_text(encoding="utf-8"))
    require(set(first["source_transition"]) == set(TRANSITIONS), "unexpected transition set")
    for name, prior in old["source_after"].items():
        require(sha(contained_file(PARENT.parent, "source-snapshot/"+name)) == prior, "archived parent source changed")
        if name in TRANSITIONS:
            require(prior == TRANSITIONS[name] and first["source_transition"][name] == {
                "old_sha256": prior, "new_sha256": first["source_after"][name]}, "source transition mismatch")
        else:
            require(prior == first["source_after"][name], "unexpected inherited source change")
    sources = first["source_after"]
    require(len(sources) == 268 and first["source_before"] == sources, "complete immutable source set required")
    for name, digest in sources.items():
        require(sha(contained_file(ROOT, name)) == digest, "current source drift: "+name)
    expected_artifacts = ARRAYS | {"source-snapshot/"+name for name in sources}
    require(set(first["artifact_hashes"]) == expected_artifacts, "complete artifact matrix required")
    artifacts_checked = 0
    for directory in (receipt.parent, replay.parent):
        for name, digest in first["artifact_hashes"].items():
            require(sha(contained_file(directory, name)) == digest, "artifact identity mismatch: "+name)
            artifacts_checked += 1
    original = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-sbp-volume.md"
    amendment = ROOT/"science/numerical_relativity/EXPERIMENT-20261008-sbp-volume-v2.md"
    require(sha(original) == first["original_protocol_sha256"] and sha(amendment) == first["protocol_sha256"], "protocol identity changed")
    legacy = first["legacy"]
    require([(r["boundary"], r["spatial_order"], r["profile"], r["tau_inverse"]) for r in legacy]
            == [("periodic", 2, False, 0.), ("periodic", 4, True, 1.),
                ("sommerfeld-proxy", 2, True, 1.), ("schwarzschild-dirichlet", 4, True, 1.)], "legacy matrix incomplete")
    require(all(all(r[k] is True for k in ("passed", "rhs_byte_equal", "rk_byte_equal", "input_unchanged"))
                and r["rhs_max_difference"] == r["rk_max_difference"] == 0. for r in legacy), "legacy parity failed")
    rows, norm_difference = audit_static(receipt.parent, first["curved"])
    decision = refinement(rows)
    recorded = first["curved_assessment"]
    require(decision["passed"] and recorded["passed"] is True and len(recorded["checks"]) == 12, "refinement gate failed")
    for a, b in zip(decision["checks"], recorded["checks"], strict=True):
        require({k: v for k, v in a.items() if k != "order"} == {k: v for k, v in b.items() if k != "order"}
                and abs(a["order"]-b["order"]) <= 2.e-8, "refinement decision mismatch")
    nonlin = first["nonlinear_decomposition"]
    require(nonlin["passed"] is True and nonlin["input_unchanged"] is True
            and 0. <= nonlin["dense_max_difference"] <= 2.e-11, "nonlinear arithmetic gate failed")
    points = [[0, 0, 0], [0, 4, 8], [4, 4, 4], [8, 8, 8], [7, 3, 1]]
    require([r["point"] for r in nonlin["principal_checks"]] == points, "principal matrix incomplete")
    require(all(0. <= r["max_difference"] <= 2.e-11 and r["ode_principal_max_abs"] == 0.
                for r in nonlin["principal_checks"]), "principal/source gate failed")
    for label in ("state", "rhs"):
        check_array(np.load(receipt.parent/f"nonlinear-n9-{label}.npy", allow_pickle=False), (58, 9, 9, 9))
    flat = first["flat_linearization"]
    require(flat["passed"] is True and [r["amplitude"] for r in flat["rows"]] == [1.e-3, 5.e-4, 2.5e-4]
            and len(flat["orders"]) == 2, "flat-amplitude matrix incomplete")
    flat_orders = []
    for i in range(2):
        a, b = (flat["rows"][k]["remainder_rms"] for k in (i, i+1))
        require(min(a, b) > 2.e-12 and all(math.isfinite(v) for v in (a, b)), "unmeasurable amplitude order")
        order = math.log(a/b)/math.log(2.)
        require(order >= 1.8 and abs(order-flat["orders"][i]["order"]) <= 2.e-14
                and flat["orders"][i]["measurable"] is True, "amplitude order mismatch")
        flat_orders.append(order)
    return dict(audit_completed=True, separate_process_exact_replay=True, sources_checked=len(sources),
                artifacts_checked=artifacts_checked, independent_static_states=3, rows=rows,
                maximum_diagnostic_difference=norm_difference, curved_assessment=decision,
                flat_amplitude_orders=flat_orders, generic_nonlinear_independent_physics_validation=False,
                scope="independent-static-conformally-flat-volume-algebra-and-exact-process-replay",
                **{key: False for key in FLAGS})


def fresh_output(path):
    path = path.resolve()
    require(path.parent == EVIDENCE.resolve() and path.suffix == ".json" and not path.exists(), "fresh direct evidence JSON required")
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--replay", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    output = fresh_output(args.output)
    require(shutil.disk_usage("C:/").free >= 3*1024**3
            and shutil.disk_usage(ROOT).free >= 4*1024**3+32*1024**2, "storage reserve reached")
    started = time.perf_counter()
    provenance = {str(p.relative_to(ROOT)): sha(p) for p in (
        Path(__file__).resolve(), HELPER, PROTOCOL, ROOT/"scripts/tests/test_nr_sbp_volume_audit.py")}
    result = {"schema": "nr-nonlinear-sbp-volume-independent-audit-v1", "audit_completed": False, "errors": []}
    try:
        result.update(audit(args.receipt.resolve(), args.replay.resolve()))
        require(time.perf_counter()-started <= 120., "120s audit cap reached")
        require(all(sha(ROOT/name) == digest for name, digest in provenance.items()), "auditor source drift")
    except Exception as error:
        result.update(audit_completed=False, errors=[f"{type(error).__name__}: {error}"])
    result.update(auditor_sources=provenance, receipt_sha256=sha(args.receipt), replay_sha256=sha(args.replay),
                  seconds=time.perf_counter()-started)
    encoded = json.dumps(result, sort_keys=True, indent=2, allow_nan=False)+"\n"
    require(len(encoded.encode("utf-8")) <= 1024**2, "1MiB audit output cap reached")
    with output.open("x", encoding="utf-8", newline="\n") as handle:
        handle.write(encoded)
    print(json.dumps({k: result[k] for k in ("audit_completed", "errors", "seconds")}), flush=True)
    return 0 if result["audit_completed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
