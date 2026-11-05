"""Independent nonlinear saved-state audit oracles; synthetic, not a BH test."""
from copy import deepcopy
import ast
import json
from pathlib import Path
import runpy
import sys
from types import SimpleNamespace

import numpy as np
import pytest

A = runpy.run_path(str(Path(__file__).resolve().parents[1]/"audit-nr-k3-nonlinear-sat.py"))


def flat():
    q = np.zeros((58, 9, 9, 9))
    q[[0, 3, 5]] = 1.
    return q


def stages():
    base = dict(cfl=.02, max_basis_condition=25., max_characteristic_residual=1.e-14,
                min_lapse=.5, min_chi=.3, det_h_max_error=1.e-15, sat_max_abs=.001, basis_builds=3,
                coefficients_sha256="a"*64,
                faces=[dict(axis=a, side=s, sat_max_abs=.001) for a in range(3) for s in range(2)])
    return [dict(deepcopy(base), stage=i) for i in range(1, 5)]


def test_minkowski_metric_and_all_reductions_are_roundoff_zero():
    q = flat()
    old = q.copy()
    assert max(A["norms"](q).values()) < 2.e-14
    np.testing.assert_array_equal(q, old)


def test_physical_trace_and_mixed_index_momentum_polynomial_oracle():
    q = flat()
    x, y, _ = np.meshgrid(*(np.linspace(1., 3., 9) for _ in range(3)), indexing="ij")
    q[11] = x*y  # Stored K=0, physical trace=x*y, K^x_x=x*y.
    fields, _ = A["tensor_fields"](q)
    np.testing.assert_allclose(fields["H_metric"], 0., atol=2.e-13, rtol=0.)
    np.testing.assert_allclose(fields["M_metric"][..., 0], 0., atol=2.e-13, rtol=0.)
    np.testing.assert_allclose(fields["M_metric"][..., 1], -x, atol=2.e-13, rtol=0.)
    np.testing.assert_allclose(fields["M_metric"][..., 2], 0., atol=2.e-13, rtol=0.)
    np.testing.assert_allclose(fields["trace_a"], x*y, atol=2.e-14, rtol=0.)


def test_metric_constraints_independent_of_all_auxiliary_slots():
    q = flat()
    before, _ = A["tensor_fields"](q)
    q[25:58] = .1
    after, _ = A["tensor_fields"](q)
    np.testing.assert_array_equal(after["H_metric"], before["H_metric"])
    np.testing.assert_array_equal(after["M_metric"], before["M_metric"])
    for key in ("C_A", "C_B", "C_D", "C_P"):
        np.testing.assert_allclose(after[key], .1, atol=2.e-14, rtol=0.)


def test_independent_initial_state_has_nonzero_curvature_diagnostic_and_disturbance():
    q, disturbed = A["initial_slots"]()
    diagnostics = A["norms"](q)
    assert 1.e-6 < diagnostics["H_metric"] < .1
    assert diagnostics["M_metric"] == 0.
    np.testing.assert_array_equal(q[:11], disturbed[:11])
    assert 1.e-5 < np.max(abs(q-disturbed)) < 1.e-4
    assert all(np.isfinite(value) for value in A["norms"](disturbed).values())


@pytest.mark.parametrize("defect", ["shape", "nan", "negative-metric", "integer", "lapse-overflow"])
def test_invalid_saved_states_rejected(defect):
    q = flat()
    if defect == "shape":
        q = q[:-1]
    elif defect == "nan":
        q[0, 0, 0, 0] = np.nan
    elif defect == "negative-metric":
        q[0] = -1.
    elif defect == "integer":
        q = q.astype(int)
    else:
        q[6] = 1000.
    with pytest.raises((ValueError, FloatingPointError)):
        A["tensor_fields"](q)


def test_four_six_face_records_are_accepted_without_mutation():
    value = stages()
    old = deepcopy(value)
    A["check_stage_sequence"](value)
    assert value == old


@pytest.mark.parametrize("defect", ["missing-stage", "duplicate-stage", "boolean-stage", "duplicate-face",
                                    "boolean-face", "nan", "cfl", "condition", "residual", "lapse", "chi",
                                    "face-total", "negative-face", "no-hash", "no-basis", "det-upper", "lapse-upper"])
def test_bad_stage_record_cannot_be_audited_as_success(defect):
    value = stages()
    row = value[0]
    if defect == "missing-stage":
        value.pop()
    elif defect == "duplicate-stage":
        value[1]["stage"] = 1
    elif defect == "boolean-stage":
        row["stage"] = True
    elif defect == "duplicate-face":
        row["faces"][1] = row["faces"][0].copy()
    elif defect == "boolean-face":
        row["faces"][0]["axis"] = False
    elif defect == "nan":
        row["min_lapse"] = np.nan
    elif defect == "cfl":
        row["cfl"] = .251
    elif defect == "condition":
        row["max_basis_condition"] = 1.e7
    elif defect == "residual":
        row["max_characteristic_residual"] = 1.e-8
    elif defect == "lapse":
        row["min_lapse"] = 0.
    elif defect == "lapse-upper":
        row["min_lapse"] = 2.
    elif defect == "det-upper":
        row["det_h_max_error"] = 1.1e-10
    elif defect == "chi":
        row["min_chi"] = -1.
    elif defect == "face-total":
        row["sat_max_abs"] = .002
    elif defect == "negative-face":
        row["faces"][0]["sat_max_abs"] = -.001
    elif defect == "no-hash":
        row["coefficients_sha256"] = ""
    else:
        row["basis_builds"] = False
    with pytest.raises(ValueError):
        A["check_stage_sequence"](value)


def test_auditor_has_no_production_solver_dependency():
    source = (Path(__file__).resolve().parents[1]/"audit-nr-k3-nonlinear-sat.py").read_text(encoding="utf-8")
    tree = ast.parse(source)
    imports = [node.module for node in ast.walk(tree) if isinstance(node, ast.ImportFrom)]
    imports += [name.name for node in ast.walk(tree) if isinstance(node, ast.Import) for name in node.names]
    assert not any(name and name.startswith("science") for name in imports)
    loads = [node for node in ast.walk(tree) if isinstance(node, ast.Call)
             and ast.unparse(node.func) == "runpy.run_path"]
    assert len(loads) == 1 and ast.unparse(loads[0].args[0]) == "str(HELPER)"


def test_same_receipt_cannot_prove_separate_process_replay(tmp_path):
    path = tmp_path/"receipt.json"
    path.write_text("{}", encoding="utf-8")
    with pytest.raises(ValueError, match="distinct"):
        A["audit"](path, path)


@pytest.mark.parametrize("defect", ["boolean-start", "boolean-step", "float-count", "phase", "last-step", "attempted-step"])
def test_invalid_case_execution_metadata_rejected(defect):
    spec = ("static", 1./1024, 4, 0, "static-initial.npy")
    row = dict(label="static", dt=1./1024, steps=4, start_index=0, completed=True, input_unchanged=True,
               phase="completed", last_completed_step=3, attempted_step=3, final_array="static-final.npy",
               step_records=[dict(step=i, stages=stages()) for i in range(4)])
    if defect == "boolean-start":
        row["start_index"] = False
    elif defect == "boolean-step":
        row["step_records"][0]["step"] = False
    elif defect == "float-count":
        row["steps"] = 4.
    elif defect == "phase":
        row["phase"] = "saving-final"
    elif defect == "last-step":
        row["last_completed_step"] = 2
    else:
        row["attempted_step"] = 2
    with pytest.raises(ValueError):
        A["check_case"](row, spec)


def scope_fixture():
    parent = dict(parameters={"config": {"tau_inverse": 1.}},
                  operator_identity={"schema": "synthetic-volume", "shape": [9]*3},
                  source_after={"inherited.py": "a"*64})
    closure = {"auditor_sources": {"auditor.py": "b"*64}}
    identity = dict(schema="nr-actual-nonlinear-sbp-sat-shadow-v1", shape=[9]*3,
                    volume_operator=deepcopy(parent["operator_identity"]), source_included=True,
                    boundary="six stage-local characteristic SATs with explicit incoming analytic data",
                    coefficient_cache="exact bytes within one RHS only",
                    integrator="RK4 in58 canonical slots; integer half-step boundary times",
                    ode_pde_split="11+47; PDE advection removed for SVD",
                    **{key: False for key in A["FLAGS"]+("algebraic_projection", "auxiliary_reconstruction",
                       "common_symmetrizer_validated", "nonlinear_stability_validated", "native_checkpoint_supported")})
    retained = list(A["RETAINED"].values())
    data = dict(schema="nr-nonlinear-sbp-sat-campaign-v1", completed=True, coupling_screen_passed=True, errors=[],
                operator_identity=identity, parameters=deepcopy(parent["parameters"]),
                parent_sha256=retained[0], closure_sha256=retained[1], native_sha256=retained[3],
                protocol_sha256="c"*64,
                resource_caps=dict(seconds=1200, output_bytes=32*1024**2, c_reserve=3*1024**3,
                                   e_reserve=4*1024**3+32*1024**2),
                source_after={**parent["source_after"], **closure["auditor_sources"],
                              **{key: "c"*64 for key in A["CAMPAIGN_FILES"]}},
                **{key: False for key in A["FLAGS"]})
    return data, parent, closure


def test_valid_scope_preserves_the_entire_parent_contract():
    data, parent, closure = scope_fixture()
    old = deepcopy(data)
    A["scope"](data, parent, closure)
    assert data == old and json.dumps(data, allow_nan=False)


@pytest.mark.parametrize("defect", ["missing-source", "wrong-inherited-hash", "parent-digest", "closure-digest",
                                    "native-digest", "protocol-digest", "volume", "boolean-parameter",
                                    "projection", "boundary", "source-term", "resource-cap"])
def test_altered_scope_or_omitted_sources_rejected(defect):
    data, parent, closure = scope_fixture()
    if defect == "missing-source":
        del data["source_after"]["inherited.py"]
    elif defect == "wrong-inherited-hash":
        data["source_after"]["inherited.py"] = "f"*64
    elif defect.endswith("-digest"):
        data[defect.removesuffix("-digest")+"_sha256"] = "f"*64
    elif defect == "volume":
        data["operator_identity"]["volume_operator"]["shape"] = [17]*3
    elif defect == "boolean-parameter":
        data["parameters"]["config"]["tau_inverse"] = True
    elif defect == "projection":
        data["operator_identity"]["algebraic_projection"] = True
    elif defect == "boundary":
        data["operator_identity"]["boundary"] = "periodic"
    elif defect == "source-term":
        data["operator_identity"]["source_included"] = False
    else:
        data["resource_caps"]["c_reserve"] = 0
    with pytest.raises(ValueError):
        A["scope"](data, parent, closure)


@pytest.mark.parametrize("failure", [False, True])
def test_cli_retains_terminal_failure_without_false_admission(monkeypatch, tmp_path, failure):
    namespace = A["main"].__globals__
    output = tmp_path/"audit.json"
    monkeypatch.setitem(namespace, "EVIDENCE", tmp_path)
    monkeypatch.setattr(namespace["shutil"], "disk_usage", lambda _path: SimpleNamespace(free=100*1024**3))

    def synthetic_audit(_primary, _replay):
        if failure:
            raise ValueError("synthetic reconstruction failure")
        return dict(audit_completed=True, separate_process_exact_replay=True)

    monkeypatch.setitem(namespace, "audit", synthetic_audit)
    monkeypatch.setattr(sys, "argv", ["audit", "--receipt", str(tmp_path/"primary.json"),
                                    "--replay", str(tmp_path/"replay.json"), "--output", str(output)])
    assert A["main"]() == (1 if failure else 0)
    result = json.loads(output.read_text(encoding="utf-8"))
    assert result["audit_completed"] is (not failure)
    assert result["separate_process_exact_replay"] is (not failure)
    assert result["auditor_sources"] == result["auditor_sources_after"]
    assert all(result[key] is False for key in A["FLAGS"])
    assert result["errors"] == (["ValueError: synthetic reconstruction failure"] if failure else [])
    with pytest.raises(ValueError, match="fresh"):
        A["main"]()
