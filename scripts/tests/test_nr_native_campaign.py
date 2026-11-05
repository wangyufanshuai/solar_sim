"""Native multisegment orchestration and independent audit controls, shadow only."""
from __future__ import annotations

import copy
import io
import json
import os
from pathlib import Path
import runpy
import subprocess
import time
from types import SimpleNamespace
import zlib

import numpy as np
import pytest

from science.numerical_relativity import native_campaign as N
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import NonlinearSBPCube
from science.numerical_relativity.fo_ccz4_schwarzschild import analytic_slots
from science.numerical_relativity.nr3d import Grid3D

P = runpy.run_path(str(N.ROOT / "scripts/run-nr-k3-projected-rk.py"))
A = runpy.run_path(str(N.ROOT / "scripts/audit-nr-k3-native-gauge-pulse.py"))
RUN = runpy.run_path(str(N.ROOT / "scripts/run-nr-k3-native-gauge-pulse.py"))


@pytest.fixture(scope="session", autouse=True)
def qualification():
    if "NR_NATIVE_CAMPAIGN_TEST_EVIDENCE" not in os.environ:
        pytest.skip("explicit bounded native test evidence directory required")
    directory = Path(os.environ["NR_NATIVE_CAMPAIGN_TEST_EVIDENCE"]).resolve()
    assert directory.parent == N.EVIDENCE and not directory.exists()
    budget = N.Budget(directory, seconds=600, cap=64 * 1024**2, headroom=2 * 1024**2)
    identity, binding, _ = N.native_identity()
    sources = {name: N.sha(N.ROOT / name) for name in RUN["EXTRA"]}
    directory.mkdir()
    result = dict(schema="nr-native-campaign-tests-v1", source_before=sources, native_identity=identity,
                  real_native_multisegment=False, real_diagnostic_failure=False,
                  physical_gate=False, scientificPayloadWriteback=False)
    budget.record("identity-before.json", result)
    for name in sources:
        budget.save("source-snapshot/" + name, (N.ROOT / name).read_bytes())
    started = time.monotonic()
    yield budget, binding, result
    result["source_after"] = {name: N.sha(N.ROOT / name) for name in sources}
    result["native_unchanged"] = N.native_identity()[0] == identity
    result["seconds"] = time.monotonic() - started
    result["artifact_hashes"] = {p.relative_to(directory).as_posix(): N.sha(p) for p in sorted(directory.rglob("*")) if p.is_file()}
    budget.record("receipt.json", result, finalizing=True)
    assert result["source_after"] == sources and result["native_unchanged"]
    budget.guard()


@pytest.fixture(scope="session")
def real_case(qualification):
    budget, binding, result = qualification
    mesh = Grid3D((9,) * 3, (1.,) * 3, (3.,) * 3, boundary="sbp-volume", spatial_order=4)
    q = analytic_slots(9, 4)
    driver = NonlinearSBPCube(mesh)
    row = dict(label="schwarzschild9-five-step-control", n=9, steps=5, dt=1/1024, completed=False)
    global_sha = N.codec.sha(b"native-five-step-control-not-a-full-scientific-campaign")
    endpoint = N.run_case(budget, row, mesh, q, q, binding, global_sha, lambda value: P["measured"](driver, value, q))
    checked = A["audit_case"](budget.directory, row, q, q, binding, global_sha)
    assert row["completed"] and checked["accepted_steps"] == 5 and checked["rhs_stages_audited"] == 20
    assert len(row["segments"]) == 3 and np.max(abs(endpoint - q)) > 1e-9
    result["real_native_multisegment"] = True
    budget.record("five-step-control.json", dict(case=row, independent_audit=checked))
    return budget, binding, global_sha, mesh, q, row


def test_native_five_steps_crosses_old_four_step_limit_by_verified_plan_chain(real_case):
    _, _, _, _, _, row = real_case
    assert [s["steps"] for s in row["segments"]] == [2, 2, 1]
    assert row["accepted_steps"] == row["native_published_steps"] == 5
    assert row["segments"][0]["predecessor"] is None
    assert [s["predecessor"]["point"] for s in row["segments"][1:]] == [2, 4]


@pytest.mark.parametrize("mutation", ["predecessor", "global", "initial-sha", "dt", "start", "missing-segment", "accepted-count", "native-count", "point-time", "point-sha", "trace-sha", "completed-early"])
def test_independent_chain_audit_rejects_metadata_mutation(real_case, mutation):
    budget, binding, global_sha, mesh, q, row = real_case
    changed = copy.deepcopy(row)
    if mutation == "predecessor": changed["segments"][1]["predecessor"]["sha256"] = "0" * 64
    elif mutation == "global": changed["segments"][0]["global_plan_sha256"] = "0" * 64
    elif mutation == "initial-sha": changed["segments"][1]["initial_state_sha256"] = "0" * 64
    elif mutation == "dt": changed["segments"][1]["dt"] *= 2
    elif mutation == "start": changed["segments"][1]["start"] += 1
    elif mutation == "missing-segment": changed["segments"].pop(1)
    elif mutation == "accepted-count": changed["accepted_steps"] = 6
    elif mutation == "native-count": changed["native_published_steps"] = 4
    elif mutation == "point-time": changed["trajectory"][1]["time"] += 1
    elif mutation == "point-sha": changed["trajectory"][1]["state_sha256"] = "0" * 64
    elif mutation == "trace-sha": changed["segments"][0]["trace_sha256"] = "0" * 64
    elif mutation == "completed-early": changed["steps"] = 7
    with pytest.raises(ValueError): A["audit_case"](budget.directory, changed, q, q, binding, global_sha, diagnostics=False)


@pytest.mark.parametrize("mutation", ["stage-state", "rhs", "tick", "coefficient", "cfl", "det", "gate"])
def test_full_stage_checker_rejects_changes(real_case, mutation):
    budget, _, _, mesh, q, row = real_case
    first = row["segments"][0]
    raw = A["expand"]((budget.directory / first["trace"]).read_bytes(), first["trace_bytes"])
    meta, arrays = N.unpack_trace(raw, mesh, 0, 2, row["dt"])
    block, report = arrays[0].copy(), copy.deepcopy(meta["trace"][0])
    if mutation == "stage-state": block[2, 17, 0, 0, 0] += 1e-3
    elif mutation == "rhs": block[1, 17, 0, 0, 0] += 1e-3
    elif mutation == "tick": report["stages"][2]["boundary_tick"] += 1
    elif mutation == "coefficient": report["stages"][1]["coefficients_sha256"] = "0" * 64
    elif mutation == "cfl": report["stages"][0]["cfl"] = .3
    elif mutation == "det": report["stages"][0]["det_h_max_error"] = 2e-10
    elif mutation == "gate": report["stages"][0]["max_characteristic_residual"] = 3e-11
    with pytest.raises(ValueError): N.check_step(block, report, q, 0, row["dt"])


@pytest.mark.parametrize("mutation", ["append", "truncated", "wrong-size", "bomb-bound"])
def test_lossless_trace_expansion_is_bounded_and_exact(real_case, mutation):
    budget, _, _, _, _, row = real_case
    trace = row["segments"][0]
    raw, size = (budget.directory / trace["trace"]).read_bytes(), trace["trace_bytes"]
    if mutation == "append": raw += b"x"
    elif mutation == "truncated": raw = raw[:-1]
    elif mutation == "wrong-size": size -= 1
    elif mutation == "bomb-bound": raw, size = zlib.compress(b"A" * 4096), 128
    with pytest.raises(ValueError): A["expand"](raw, size)


def test_diagnostic_failure_does_not_promote_published_points(qualification):
    budget, binding, result = qualification
    mesh = Grid3D((9,) * 3, (1.,) * 3, (3.,) * 3, boundary="sbp-volume", spatial_order=4)
    q, driver = analytic_slots(9, 4), NonlinearSBPCube(mesh)
    row = dict(label="injected-diagnostic-failure", n=9, steps=2, dt=1/1024, completed=False)
    count = 0
    def measure(value):
        nonlocal count
        count += 1
        if count == 3:
            raise ValueError("explicit diagnostic-failure test hook")
        return P["measured"](driver, value, q)
    with pytest.raises(ValueError, match="diagnostic-failure"):
        N.run_case(budget, row, mesh, q, q, binding, "a" * 64, measure)
    row.update(status="batch-aborted", failure="explicit diagnostic-failure test hook")
    assert row["accepted_steps"] == 1 and row["native_published_steps"] == 2 and not row["completed"]
    checked = A["audit_case"](budget.directory, row, q, q, binding, "a" * 64)
    assert checked["accepted_steps"] == 1 and checked["native_published_steps"] == 2
    budget.record("diagnostic-failure-control.json", dict(case=row, audit=checked))
    result["real_diagnostic_failure"] = True


def test_timeout_retains_partial_output_after_deadline(tmp_path, monkeypatch):
    budget = N.Budget(tmp_path, seconds=30, cap=2 * 1024**2, headroom=65536)
    def timeout(*args, **kwargs):
        budget.deadline = time.monotonic() - 1
        raise subprocess.TimeoutExpired(args[0], 1, output=b"partial", stderr=b"timeout-location")
    monkeypatch.setattr(N.subprocess, "run", timeout)
    with pytest.raises(N.ResourceLimit, match="timeout"):
        N.invoke(budget, "test-timeout", ["not-executed-mock"], output_cap=1024)
    assert (tmp_path / "test-timeout.timeout-stdout").read_bytes() == b"partial"
    assert (tmp_path / "test-timeout.timeout-stderr").read_bytes() == b"timeout-location"


@pytest.mark.parametrize("kind", ["C", "E", "cap", "time"])
def test_resource_guard_is_fail_closed(tmp_path, monkeypatch, kind):
    budget = N.Budget(tmp_path, seconds=30, cap=2 * 1024**2, headroom=65536)
    if kind in ("C", "E"):
        monkeypatch.setattr(N.shutil, "disk_usage", lambda path: SimpleNamespace(free=(N.C_RESERVE - 1 if str(path) == "C:/" and kind == "C" else N.E_RESERVE - 1 if str(path) != "C:/" and kind == "E" else 100 * 1024**3)))
    elif kind == "cap": budget.cap = 65536
    else: budget.deadline = time.monotonic() - 1
    with pytest.raises(N.ResourceLimit): budget.save("forbidden.bin", b"123")
    assert not (tmp_path / "forbidden.bin").exists()


@pytest.mark.parametrize("name", ["../escape", "../../escape", str(N.ROOT / "outside-test")])
def test_artifact_path_escape_rejected(tmp_path, name):
    with pytest.raises(ValueError): N.contained(tmp_path, name)


def test_existing_scientific_artifact_not_replaced(tmp_path):
    budget = N.Budget(tmp_path, seconds=30, cap=2 * 1024**2, headroom=65536)
    budget.save("immutable.bin", b"original")
    with pytest.raises(FileExistsError): budget.save("immutable.bin", b"changed")
    assert (tmp_path / "immutable.bin").read_bytes() == b"original"


@pytest.mark.parametrize("amplitude,status", [(1e-7, "passed"), (1e-14, "unresolved")])
def test_temporal_positive_and_unresolved_controls_keep_original_floor(amplitude, status):
    arrays = [np.zeros((58, 13, 13, 13)) for _ in range(3)]
    for index, q in enumerate(arrays): q[17] = amplitude / 16**index
    mesh = Grid3D((13,) * 3, (1.,) * 3, (3.,) * 3, boundary="sbp-volume", spatial_order=4)
    report = N.temporal_screen(arrays, NonlinearSBPCube(mesh), P["R"])
    independent = A["temporal"](arrays)
    A["INITIAL"]["compare_screen"](report, independent)
    assert report["status"] == status
    assert report["physical_gate"] is False and report["floor"] == 2e-13


def test_prospective_complete_matrix_budget_fits_registered_cap():
    assert 768 * 1024**2 < N.worst_case_bytes() <= N.OUTPUT_CAP == 832 * 1024**2
    assert N.C_RESERVE == 3 * 1024**3 and N.E_RESERVE == 4 * 1024**3 + 32 * 1024**2


def test_complete_real_source_union_snapshots_once_before_numerical_calls(qualification):
    budget, _, _ = qualification
    identity, _, inherited = N.native_identity()
    primary = json.loads(RUN["PRIMARY"].read_text(encoding="utf-8"))
    assert N.sha(RUN["PRIMARY"]) == RUN["PRIMARY_SHA"]
    extra = {name: N.sha(N.ROOT / name) for name in RUN["EXTRA"]}
    raw_keys = set(inherited) | set(primary["source_after"]) | set(extra)
    sources = N.merge_source_tables(inherited, extra, primary["source_after"])
    assert len(raw_keys) > len(sources) == len({str(N.ROOT / name).casefold() for name in sources})
    child = N.Budget(budget.directory / "complete-source-registration", seconds=30, cap=8 * 1024**2, headroom=1024**2)
    N.save_source_snapshot(child, sources)
    saved = {p.relative_to(child.directory / "source-snapshot").as_posix(): N.sha(p)
             for p in (child.directory / "source-snapshot").rglob("*") if p.is_file()}
    assert saved == sources
    budget.record("source-registration-control.json", dict(raw_keys=len(raw_keys), canonical_files=len(sources),
                  complete_snapshot_verified=True, native_identity=identity))


@pytest.mark.parametrize("alias", ["scripts\\audit-nr-k3-full58-sbp.py", "scripts/./audit-nr-k3-full58-sbp.py",
                                   "SCRIPTS/audit-nr-k3-full58-sbp.py"])
def test_source_aliases_have_one_order_independent_identity(alias):
    name = "scripts/audit-nr-k3-full58-sbp.py"
    digest = N.sha(N.ROOT / name)
    left = N.merge_source_tables({name: digest}, {alias: digest})
    right = N.merge_source_tables({alias: digest}, {name: digest})
    assert left == right and len(left) == 1
    assert N.sha(N.ROOT / next(iter(left))) == digest


@pytest.mark.parametrize("alias", ["scripts/audit-nr-k3-full58-sbp.py", "scripts\\audit-nr-k3-full58-sbp.py",
                                   "SCRIPTS/audit-nr-k3-full58-sbp.py"])
def test_source_hash_conflicts_cannot_be_overwritten(alias):
    name = "scripts/audit-nr-k3-full58-sbp.py"
    with pytest.raises(ValueError, match="conflicting source identity"):
        N.merge_source_tables({name: N.sha(N.ROOT / name)}, {alias: "0" * 64})


@pytest.mark.parametrize("invalid", ["../outside.py", "E:scripts/audit-nr-k3-full58-sbp.py", "scripts/audit-nr-k3-full58-sbp.py:stream"])
def test_source_alias_normalization_does_not_authorize_path_escape(invalid):
    with pytest.raises(ValueError):
        N.merge_source_tables({invalid: "0" * 64})


def test_snapshot_rejects_stale_source_before_any_write(tmp_path):
    budget = N.Budget(tmp_path, seconds=30, cap=2 * 1024**2, headroom=65536)
    good = "scripts/audit-nr-k3-full58-sbp.py"
    bad = "scripts/audit-nr-k3-nonlinear-dual-diagnostics.py"
    with pytest.raises(ValueError, match="source changed before snapshot"):
        N.save_source_snapshot(budget, {good: N.sha(N.ROOT / good), bad: "0" * 64})
    assert not (tmp_path / "source-snapshot").exists()


def test_snapshot_requires_aliases_resolved_before_any_write(tmp_path):
    budget = N.Budget(tmp_path, seconds=30, cap=2 * 1024**2, headroom=65536)
    name = "scripts/audit-nr-k3-full58-sbp.py"
    digest = N.sha(N.ROOT / name)
    with pytest.raises(ValueError, match="canonical unique source table"):
        N.save_source_snapshot(budget, {name: digest, name.replace("/", "\\"): digest})
    assert not (tmp_path / "source-snapshot").exists()


def first_saved_stage(real_case):
    budget, _, _, mesh, _, row = real_case
    segment = row["segments"][0]
    raw = A["expand"]((budget.directory / segment["trace"]).read_bytes(), segment["trace_bytes"])
    meta, arrays = N.unpack_trace(raw, mesh, 0, 2, row["dt"])
    return arrays[0, 0].copy(), copy.deepcopy(meta["trace"][0]["stages"][0]), row["dt"]


def test_frozen_v2_negative_report_counterexample_is_now_rejected(real_case, qualification):
    budget, binding, global_sha, _, q, row = real_case
    old_root = N.EVIDENCE / "nr-k3-native-campaign-tests-v2-20261010"
    old_receipt = old_root / "receipt.json"
    assert N.sha(old_receipt) == "9894d706e47f58d34164699ddf6046189b20675f4d3ef63c176456ff3413b3d7"
    saved = "source-snapshot/scripts/audit-nr-k3-native-gauge-pulse.py"
    old_data = json.loads(old_receipt.read_text(encoding="utf-8"))
    assert N.sha(old_root / saved) == old_data["artifact_hashes"][saved]
    legacy = {"__file__": str(N.ROOT / "scripts/audit-nr-k3-native-gauge-pulse.py"), "__name__": "frozen_v2_audit"}
    exec(compile((old_root / saved).read_bytes(), str(old_root / saved), "exec"), legacy)
    changed = copy.deepcopy(row)
    changed["trajectory"][1]["algebraic_errors"]["det_h"] = -1.
    changed["segments"][0]["points"][0]["algebraic_errors"]["det_h"] = -1.
    assert legacy["audit_case"](budget.directory, changed, q, q, binding, global_sha, diagnostics=False)["raw_rk_byte_exact"]
    with pytest.raises(ValueError, match="nonnegative raw summary"):
        A["audit_case"](budget.directory, changed, q, q, binding, global_sha, diagnostics=False)
    budget.record("retained-v2-counterexample.json", dict(old_receipt_sha256=N.sha(old_receipt),
                  old_auditor_sha256=N.sha(old_root / saved), mutation="endpoint-det-report=-1",
                  old_accepted=True, new_rejected=True, states_modified=False, physical_gate=False))


@pytest.mark.parametrize("field", ["cfl", "min_lapse", "min_chi", "det_h_max_error"])
def test_independent_stage_summary_is_checked_against_actual_slots(real_case, field):
    q, report, dt = first_saved_stage(real_case)
    report[field] = report[field] / 2 if field != "det_h_max_error" else 5e-11
    with pytest.raises(ValueError, match="raw-state summary disagreement"):
        A["audit_stage_state"](q, report, dt)


@pytest.mark.parametrize("field", ["det_h", "trace_a", "trace_D"])
@pytest.mark.parametrize("value", [-1., .01])
def test_independent_endpoint_summary_cannot_hide_negative_or_false_residuals(real_case, field, value):
    _, _, _, _, q, row = real_case
    point = copy.deepcopy(row["trajectory"][0])
    point["algebraic_errors"][field] = value
    with pytest.raises(ValueError, match="raw summary|raw-state summary"):
        A["audit_endpoint_state"](q, point)


@pytest.mark.parametrize("mutation", ["nonfinite", "negative-metric", "determinant", "max-lapse", "zero-lapse", "chi-underflow", "cfl"])
def test_raw_stage_illegal_state_rejected_even_with_unchanged_good_report(real_case, mutation):
    q, report, dt = first_saved_stage(real_case)
    if mutation == "nonfinite": q[17, 4, 4, 4] = np.nan
    elif mutation == "negative-metric": q[0, 4, 4, 4] = -1.
    elif mutation == "determinant": q[0, 4, 4, 4] += 1e-8
    elif mutation == "max-lapse": q[6, 4, 4, 4] = np.log(2.1)
    elif mutation == "zero-lapse": q[6, 4, 4, 4] = -1000.
    elif mutation == "chi-underflow": q[10, 4, 4, 4] = -1000.
    elif mutation == "cfl": q[7, 4, 4, 4] = 1e6
    with pytest.raises(ValueError): A["audit_stage_state"](q, report, dt)


def test_final_endpoint_does_not_acquire_stage_only_lapse_domain(real_case):
    _, _, _, _, q, row = real_case
    endpoint = q.copy()
    endpoint[6] = np.log(2.1)
    assert A["audit_endpoint_state"](endpoint, row["trajectory"][0]) <= 2e-12


@pytest.mark.parametrize("n", [9, 13])
def test_independent_cfl_has_analytic_anisotropic_metric_shift_anchor(n):
    q = np.zeros((58, n, n, n))
    q[0], q[3], q[5] = 4., .5, .5
    q[6], q[10] = np.log(.5), .5 * np.log(.25)
    q[7], q[8], q[9] = .1, .2, .3
    dt = 1e-3
    expected = float(dt * ((.1 + np.sqrt(.125)) + 1.2 + 1.3) * (n - 1) / 2)
    report = dict(cfl=expected, min_lapse=.5, min_chi=.25, det_h_max_error=0.)
    assert A["audit_stage_state"](q, report, dt) <= 2e-12


@pytest.mark.parametrize("gate", ["determinant", "cfl"])
def test_summary_tolerance_does_not_relax_raw_physical_caps(gate):
    q = np.zeros((58, 9, 9, 9))
    q[0], q[3], q[5] = 1., 1., 1.
    q[6], q[10] = np.log(.5), .5 * np.log(.25)
    dt = 1e-3
    if gate == "determinant": q[0, 4, 4, 4] += 1.005e-10
    else: dt = .25 / (3 * np.sqrt(.5) * 4) * (1 + 2e-13)
    report = dict(cfl=.25, min_lapse=.5, min_chi=.25, det_h_max_error=1e-10)
    with pytest.raises(ValueError, match="original raw stage"):
        A["audit_stage_state"](q, report, dt)


@pytest.fixture(scope="session")
def registration_envelope(qualification):
    budget, binding, result = qualification
    directory = budget.directory / "registration-only-fixture"
    child = N.Budget(directory, seconds=60, cap=8 * 1024**2, headroom=1024**2)
    identity, _, inherited = N.native_identity()
    primary = json.loads(RUN["PRIMARY"].read_text(encoding="utf-8"))
    sources = N.merge_source_tables(inherited, primary["source_after"],
                                   {name: N.sha(N.ROOT / name) for name in RUN["EXTRA"]})
    initial, reference = RUN["initial_slots"](13)
    cases = [dict(label=f"native-gauge-pulse-13-{steps}", n=13, steps=steps, dt=1/(16*steps),
                  status="not-attempted", completed=False, accepted_steps=0, native_published_steps=0,
                  segments=[], trajectory=[]) for steps in (7, 14, 28)]
    plan = dict(schema="nr-native-gauge-pulse-plan-v1", n=13, lower=[1.] * 3, upper=[3.] * 3, end_time=1/16,
                segment_steps=2, case_matrix=[{k: row[k] for k in ("label", "steps", "dt")} for row in cases],
                initial_state_sha256=N.codec.sha(initial.tobytes()), reference_state_sha256=N.codec.sha(reference.tobytes()),
                initial_identity=RUN["pulse_identity"](), native_identity=identity, source_sha256=N.codec.sha(N.json_bytes(sources)),
                physical_gate=False, live_admission=False, scientificPayloadWriteback=False)
    child.record("global-plan.json", plan)
    child.record("registered-cases.json", cases)
    child.save("binding.txt", binding)
    for name, value in (("initial", initial), ("reference", reference)):
        buffer = io.BytesIO()
        np.save(buffer, value, allow_pickle=False)
        child.save(name + ".npy", buffer.getvalue())
    N.save_source_snapshot(child, sources)
    data = dict(schema="nr-native-gauge-pulse-v1", fixture_kind="registration-only-no-evolution", completed=False,
                source_before=sources, source_after=sources, cases=cases, errors=["explicit registration-only qualification fixture"],
                global_plan="global-plan.json", global_plan_sha256=N.codec.sha(N.json_bytes(plan)), native_identity=identity,
                python_parent_sha256=RUN["PRIMARY_SHA"], old_python_replay_completed=False, old_failure_regraded=False,
                spatial_order_validated=False, constraint_convergence_validated=False, temporal_screen=None, temporal_screen_passed=False,
                physical_gate=False, live_admission=False, scientificPayloadWriteback=False,
                resource_caps=dict(seconds=N.SECONDS, output_bytes=N.OUTPUT_CAP, headroom=N.HEADROOM,
                                   c_reserve=N.C_RESERVE, e_reserve=N.E_RESERVE))
    data["artifact_hashes"] = {p.relative_to(directory).as_posix(): N.sha(p) for p in directory.rglob("*") if p.is_file()}
    child.record("receipt.json", data)
    checked = A["audit"](directory / "receipt.json")
    budget.record("registration-only-audit.json", checked)
    result["registration_only_full_entry_checked"] = True
    return directory, data, plan, cases, checked


def test_complete_audit_entry_does_not_promote_registration_fixture(registration_envelope):
    _, _, _, _, checked = registration_envelope
    assert checked["audit_completed"] and checked["native_steps_audited"] == checked["scientific_steps_audited"] == 0
    assert checked["physical_experiment_completed"] is checked["physical_gate"] is False
    assert checked["test_gate_revalidated"] is checked["python_endpoint_parity_recomputed"] is False


@pytest.mark.parametrize("mutation", ["physical", "live", "writeback", "empty-sources", "omitted-source", "source-alias",
                                      "budget", "python-parent", "preregistration", "completion", "temporal", "case-grid"])
def test_full_audit_entry_rejects_coherently_rehashed_bad_envelopes(registration_envelope, monkeypatch, mutation):
    directory, saved, original_plan, registered, _ = registration_envelope
    data, plan, cases = copy.deepcopy(saved), copy.deepcopy(original_plan), copy.deepcopy(registered)
    if mutation in ("physical", "live", "writeback"):
        plan[{"physical": "physical_gate", "live": "live_admission", "writeback": "scientificPayloadWriteback"}[mutation]] = True
    elif mutation in ("empty-sources", "omitted-source", "source-alias"):
        table = data["source_before"]
        if mutation == "empty-sources": table.clear()
        elif mutation == "omitted-source": table.pop(next(iter(table)))
        else:
            name = next(iter(table))
            table[name.replace("/", "\\")] = table[name]
        data["source_after"] = copy.deepcopy(table)
        plan["source_sha256"] = N.codec.sha(N.json_bytes(table))
    elif mutation == "budget": data["resource_caps"]["seconds"] += 1
    elif mutation == "python-parent": data["python_parent_sha256"] = "0" * 64
    elif mutation == "preregistration": cases[1]["steps"] = 15
    elif mutation == "completion": data["completed"] = True
    elif mutation == "temporal": data["temporal_screen"] = {"status": "passed"}
    elif mutation == "case-grid": data["cases"][0]["n"] = 9
    overrides = {directory / "global-plan.json": N.json_bytes(plan), directory / "registered-cases.json": N.json_bytes(cases)}
    for path, raw in overrides.items(): data["artifact_hashes"][path.name] = N.codec.sha(raw)
    data["global_plan_sha256"] = N.codec.sha(overrides[directory / "global-plan.json"])
    overrides[directory / "receipt.json"] = N.json_bytes(data)
    read_bytes, read_text = Path.read_bytes, Path.read_text
    monkeypatch.setattr(Path, "read_bytes", lambda path: overrides[path] if path in overrides else read_bytes(path))
    monkeypatch.setattr(Path, "read_text", lambda path, *a, **kw: overrides[path].decode("utf-8") if path in overrides else read_text(path, *a, **kw))
    with pytest.raises(ValueError): A["audit"](directory / "receipt.json")
