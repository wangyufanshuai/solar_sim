"""Independent algebra and audit rejection checks; no evolution claims."""
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import runpy

import numpy as np
import pytest

A = runpy.run_path(str(Path(__file__).resolve().parents[1]/"audit-nr-k3-nonlinear-refinement.py"))
G = A["audit"].__globals__


def flat(n):
    q = np.zeros((58, n, n, n))
    q[[0, 3, 5]] = 1.
    return q


@pytest.mark.parametrize("n", [9, 13, 17])
def test_flat_tensor_constraints_and_norms(n):
    q = flat(n)
    fields, weights = A["tensor_fields"](q)
    assert weights.shape == (n,)*3 and np.all(weights > 0.)
    assert max(np.max(abs(v)) for v in fields.values()) < 2.e-13
    norms = A["norms"](q, q)
    assert set(norms) == {"whole", "central_box", "faces", "edges", "corners"}
    assert all(v["state_error"] == 0. for v in norms.values())


@pytest.mark.parametrize("n", [9, 13, 17])
def test_physical_trace_not_assumed_equal_to_stored_k(n):
    q = flat(n)
    x = np.broadcast_to(np.linspace(1., 3., n)[:, None, None], (n, n, n))
    q[17] = .02*x
    q[[11, 14, 16]] = .03*x
    fields, _ = A["tensor_fields"](q)
    np.testing.assert_allclose(fields["H_metric"], (2./3.)*(.11*x)**2, rtol=0., atol=2.e-13)
    np.testing.assert_allclose(fields["M_metric"][..., 0], -2.*.11/3., rtol=0., atol=2.e-13)
    np.testing.assert_allclose(fields["M_metric"][..., 1:], 0., rtol=0., atol=2.e-13)
    np.testing.assert_allclose(fields["trace_a"], .09*x, rtol=0., atol=2.e-13)


def test_metric_constraints_do_not_reconstruct_from_auxiliary_fields():
    q = A["initial_slots"](9)
    baseline, _ = A["tensor_fields"](q)
    changed = q.copy()
    changed[25:] += .003
    output, _ = A["tensor_fields"](changed)
    for key in ("H_metric", "M_metric", "det_h", "trace_a"):
        np.testing.assert_array_equal(output[key], baseline[key])
    assert np.max(abs(output["C_A"]-baseline["C_A"])) > .0029


@pytest.mark.parametrize("n", [9, 13, 17])
def test_initial_perturbation_leaves_metric_gauge_slots_unchanged(n):
    q, p = A["initial_slots"](n), A["initial_slots"](n, True)
    np.testing.assert_array_equal(q[:11], p[:11])
    assert 0. < np.max(abs(p[11:]-q[11:])) <= 1.e-4
    assert np.exp(q[6, 0, 0, 0]) == pytest.approx((np.sqrt(3.)-.5)/(np.sqrt(3.)+.5))


@pytest.mark.parametrize("kind", ["shape", "dtype", "nan", "metric", "lapse"])
def test_invalid_saved_states_rejected(kind):
    q = flat(9)
    if kind == "shape":
        q = q[:, :, :, :-1]
    elif kind == "dtype":
        q = q.astype(np.float32)
    elif kind == "nan":
        q[20, 2, 3, 4] = np.nan
    elif kind == "metric":
        q[0] = -1.
    else:
        q[6] = np.log(3.)
    with pytest.raises(ValueError):
        A["tensor_fields"](q)


@pytest.mark.parametrize("coarse,fine,expected", [(16.e-8, 1.e-8, "passed"), (8.e-8, 1.e-8, "failed"),
    (64.e-8, 1.e-8, "failed"), (1.e-14, 1.e-15, "unresolved"), (0., 0., "unresolved")])
def test_independent_temporal_decisions(coarse, fine, expected):
    record = A["decision_pair"](coarse, fine, 2., 3.5, 4.5)
    assert record["status"] == expected
    assert record["passed"] is (expected == "passed")


@pytest.mark.parametrize("key,value", [("passed", 1), ("resolved", 1), ("floor", 1.e-12),
    ("observed_order", 3.9), ("status", "failed"), ("coarse_error", 1.e-6)])
def test_changed_decision_rejected(key, value):
    expected = A["decision_pair"](16.e-8, 1.e-8, 2., 3.5, 4.5)
    recorded = dict(expected, **{key: value})
    with pytest.raises(ValueError):
        A["compare_decision"](expected, recorded)


def stages():
    return [dict(stage=k+1, cfl=.2, max_basis_condition=30., max_characteristic_residual=1.e-13,
        min_lapse=.5, min_chi=.3, det_h_max_error=1.e-13, sat_max_abs=.001, basis_builds=4,
        coefficients_sha256=hashlib.sha256(str(k).encode()).hexdigest(),
        faces=[dict(axis=a, side=s, sat_max_abs=.001) for a in range(3) for s in range(2)]) for k in range(4)]


@pytest.mark.parametrize("key,value", [("stage", True), ("min_lapse", 2.), ("det_h_max_error", 1.e-6),
    ("cfl", .4), ("max_basis_condition", 2.e6), ("max_characteristic_residual", 2.e-8),
    ("basis_builds", True), ("coefficients_sha256", "bad"), ("sat_max_abs", .1)])
def test_corrupt_stage_rejected(key, value):
    data = stages()
    data[2][key] = value
    with pytest.raises(ValueError):
        A["check_stages"](data)


def test_signed_faces_and_step_identity():
    data = stages()
    A["check_stages"](data)
    data[0]["faces"][0]["axis"] = False
    with pytest.raises(ValueError):
        A["check_stages"](data)


def identity_fixture(monkeypatch, tmp_path):
    root = tmp_path
    directory = root/"campaign"
    snapshots = directory/"source-snapshot"
    snapshots.mkdir(parents=True)
    sources = {}
    for name in ("source.py", "protocol.md"):
        (root/name).write_text("synthetic "+name)
        (snapshots/name).write_bytes((root/name).read_bytes())
        sources[name] = A["sha"](root/name)
    parent = {"source_after": {"source.py": sources["source.py"]}}
    parent_audit = {"auditor_sources": {}}
    transition = dict(schema="nr-deadline-source-transition-v2", transition_completed=True,
                      transitions={}, source_after=sources, parent_sha256=A["PARENT_SHA"],
                      audit_sha256=A["PARENT_AUDIT_SHA"],
                      replay_sha256="bdacba46c4cb2ab04d3e80cc660ce242eaf4eb7e65604b6aaf5ab6495a5b39d4",
                      **{key: False for key in A["FLAGS"]})
    (directory/"transition.json").write_text(json.dumps(transition))
    data = dict(schema="nr-nonlinear-refinement-campaign-v1", completed=True, errors=[], closure_completed=False,
                refinement_screen_passed=False, parent_sha256=A["PARENT_SHA"], protocol_sha256=sources["protocol.md"],
                source_before=deepcopy(sources), source_after=sources, transition_sha256=A["sha"](directory/"transition.json"),
                resource_caps=dict(seconds=2400., output_bytes=64*1024**2, c_reserve=3*1024**3,
                                   e_reserve=4*1024**3+32*1024**2),
                **{key: False for key in A["FLAGS"]})
    data["artifact_hashes"] = {p.relative_to(directory).as_posix(): A["sha"](p) for p in directory.rglob("*") if p.is_file()}
    monkeypatch.setitem(G, "ROOT", root)
    monkeypatch.setitem(G, "EXTRA", ("protocol.md",))
    monkeypatch.setitem(G, "RUN_PROTOCOL", "protocol.md")
    monkeypatch.setitem(G, "EXPECTED_TRANSITIONS", {})
    return data, directory, parent, parent_audit


def test_failed_scientific_screen_may_still_have_a_valid_identity(monkeypatch, tmp_path):
    data, directory, parent, parent_audit = identity_fixture(monkeypatch, tmp_path)
    assert A["check_identity"](data, directory, parent, parent_audit) == (2, 3)
    assert data["refinement_screen_passed"] is False


@pytest.mark.parametrize("mutation", ["source", "snapshot", "manifest", "nested-receipt", "admission", "missing-source", "transition", "reserve"])
def test_identity_or_artifact_tampering_rejected(monkeypatch, tmp_path, mutation):
    data, directory, parent, parent_audit = identity_fixture(monkeypatch, tmp_path)
    if mutation == "source":
        (tmp_path/"source.py").write_text("changed")
    elif mutation == "snapshot":
        (directory/"source-snapshot/source.py").write_text("changed")
    elif mutation == "manifest":
        del data["artifact_hashes"]["source-snapshot/source.py"]
    elif mutation == "nested-receipt":
        (directory/"source-snapshot/receipt.json").write_text("unlisted nested artifact")
    elif mutation == "admission":
        data["physical_validation"] = True
    elif mutation == "missing-source":
        del data["source_after"]["source.py"]
    elif mutation == "reserve":
        data["resource_caps"]["c_reserve"] = 2*1024**3
    else:
        data["transition_sha256"] = "0"*64
    with pytest.raises(ValueError):
        A["check_identity"](data, directory, parent, parent_audit)


def case_fixture():
    parent = {"operator_identity": {"shape": [9]*3, "volume_operator": {"shape": [9]*3, "spacing": [.25]*3}},
              "parameters": {"gauge": {"sample": 2.}}}
    spec = ("spatial-13", 13, 1./256, 8, False)
    operator = deepcopy(parent["operator_identity"])
    operator["shape"] = operator["volume_operator"]["shape"] = [13]*3
    operator["volume_operator"]["spacing"] = [1./6]*3
    row = dict(label="spatial-13", completed=True, input_unchanged=True, phase="completed", n=13,
               steps=8, dt=1./256, attempted_step=7, last_completed_step=7, perturbed=False, end_time=1./32,
               initial_array="spatial-13-initial.npy", final_array="spatial-13-final.npy",
               operator_identity=operator, parameters=deepcopy(parent["parameters"]),
               step_records=[dict(step=k, stages=stages()) for k in range(8)])
    return row, spec, parent


def test_case_accepts_only_declared_grid_change_from_parent():
    row, spec, parent = case_fixture()
    A["check_case"](row, spec, parent)


@pytest.mark.parametrize("mutation", ["completed", "n", "dt", "step", "endpoint", "label", "operator", "parameter", "initial", "final"])
def test_case_scope_change_rejected(mutation):
    row, spec, parent = case_fixture()
    if mutation == "completed":
        row["completed"] = 1
    elif mutation == "n":
        row["n"] = 13.
    elif mutation == "dt":
        row["dt"] = 1./128
    elif mutation == "step":
        row["step_records"][0]["step"] = False
    elif mutation == "endpoint":
        row["end_time"] = 1./64
    elif mutation == "label":
        row["label"] = "different"
    elif mutation == "operator":
        row["operator_identity"]["volume_operator"]["spacing"] = [.25]*3
    elif mutation == "parameter":
        row["parameters"]["gauge"]["sample"] = True
    else:
        row[mutation+"_array"] = "different.npy"
    with pytest.raises(ValueError):
        A["check_case"](row, spec, parent)
