"""Study coverage, independent formulas and preserved failure controls."""
import copy
import json
import math
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
R = runpy.run_path(str(ROOT/"scripts/run-nr-k3-algebraic-projection.py"))
G = R["main"].__globals__


def parent_fixture():
    cases = []
    for label, count in (("static-13-long", 17), ("perturbed-13-long", 12)):
        cases.append(dict(label=label, n=13, dt=1./256, completed=count == 17,
            trajectory=[dict(point=i, time=i/256., completed=True, input_unchanged=True,
                             array=label+f"-{i}.npy", measurements={}) for i in range(count)]))
    cases[1]["rejection"] = dict(accepted=False, restart_permitted=False, state_array="rejected.npy")
    return dict(cases=cases)


def test_all_states_include_rejection_and_share_original_analytic_reference():
    rows = R["selected"](parent_fixture())
    assert len(rows) == 30 and len({x["array"] for x in rows}) == 30
    assert [x["input_kind"] for x in rows].count("initial") == 2
    assert [x["input_kind"] for x in rows].count("accepted") == 27
    assert rows[-1]["input_kind"] == "rejected" and rows[-1]["time"] == 11.5/256.
    assert all(x["reference"] == "static-13-long-0.npy" for x in rows)


@pytest.mark.parametrize("bad", ["case-order", "count", "time", "point", "completion", "accepted", "restart"])
def test_incomplete_or_regraded_parent_cannot_be_selected(bad):
    parent = parent_fixture()
    if bad == "case-order":
        parent["cases"].reverse()
    elif bad == "count":
        parent["cases"][0]["trajectory"].pop()
    elif bad == "time":
        parent["cases"][0]["trajectory"][2]["time"] += .01
    elif bad == "point":
        parent["cases"][0]["trajectory"][2]["point"] = 1
    elif bad == "completion":
        parent["cases"][0]["trajectory"][2]["completed"] = False
    else:
        parent["cases"][1]["rejection"]["accepted" if bad == "accepted" else "restart_permitted"] = True
    with pytest.raises(ValueError):
        R["selected"](parent)


@pytest.mark.parametrize("n", [9, 13])
def test_actual_diagnostics_and_dense_auditor_agree_for_map(n):
    reference = R["A"]["A"]["initial_slots"](n)
    q = R["A"]["A"]["initial_slots"](n, True)
    driver = R["NonlinearSBPCube"](R["Grid3D"]((n,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4))
    original = q.tobytes()
    mapped, record = R["sample"](driver, q, reference)
    assert q.tobytes() == original
    assert max(record["after_algebraic_errors"].values()) <= 2.e-12
    assert record["independent_diagnostics_max"] <= 2.e-12
    assert record["before"]["whole"]["trace_a"] > 1.e-5
    assert record["correction_norms"]["whole"]["physical_extrinsic_correction"] > 1.e-6
    assert mapped.tobytes() != original and record["disabled_byte_exact"]
    assert all(not record[k] for k in ("restart_permitted", "evolution_executed", "original_state_improved"))
    assert set(record["field_change_norms"]) == {"whole", "central_box", "faces", "edges", "corners"}


def test_cofactor_map_matches_spatially_varying_non_diagonal_cube():
    n = 9
    q = R["A"]["A"]["initial_slots"](n, True)
    x, y, z = np.meshgrid(*(np.linspace(0., 1., n) for _ in range(3)), indexing="ij")
    q[0], q[3], q[5] = 1.2+.1*x, 1.3+.2*y, 1.4+.1*z
    q[1], q[2], q[4] = .08*x, -.03*y, .04*z
    np.testing.assert_allclose(R["independent_map"](q), R["project_algebraic_slots"](q, enabled=True),
                               rtol=2.e-13, atol=2.e-13)


def test_incorrect_map_cannot_pass_independent_check(monkeypatch):
    q = R["A"]["A"]["initial_slots"](9, True)
    project = R["project_algebraic_slots"]
    def wrong(value, *, enabled=False):
        out = project(value, enabled=enabled)
        if enabled:
            out[18] += 1.e-4
        return out
    monkeypatch.setitem(G, "project_algebraic_slots", wrong)
    with pytest.raises(ValueError, match="independent"):
        R["sample"](None, q, q)


@pytest.mark.parametrize("denominator", [0., 1.e-15, 2.e-14, math.nextafter(2.e-14, math.inf)])
def test_ratios_respect_resolution_floor(denominator):
    row = R["ratio"](denominator, 1.e-5)
    assert not row["physical_gate"]
    assert row["resolved"] is (denominator > 2.e-14)
    assert (row["after_over_before"] is None) is (denominator <= 2.e-14)


@pytest.mark.parametrize("bad", [-1., math.inf, math.nan])
def test_invalid_ratio_rejected(bad):
    with pytest.raises(ValueError):
        R["ratio"](bad, 1.)


@pytest.mark.parametrize("position", ["before", "at", "after"])
def test_absolute_deadline_is_not_renewed(monkeypatch, tmp_path, position):
    deadline = 123.+180.
    now = math.nextafter(deadline, -math.inf) if position == "before" else deadline+(position == "after")
    monkeypatch.setattr(G["time"], "perf_counter", lambda: now)
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda _: SimpleNamespace(free=100*1024**3))
    if position == "before":
        R["guard"](tmp_path, deadline)
    else:
        with pytest.raises(ValueError, match="deadline"):
            R["guard"](tmp_path, deadline)


@pytest.mark.parametrize("drive", ["C", "E"])
def test_original_drive_reserves_enforced(monkeypatch, tmp_path, drive):
    def usage(path):
        low = str(path) == "C:/" if drive == "C" else path == R["ROOT"]
        return SimpleNamespace(free=R[drive+"_RESERVE"]-1 if low else 100*1024**3)
    monkeypatch.setattr(G["shutil"], "disk_usage", usage)
    with pytest.raises(ValueError, match="reserve"):
        R["guard"](tmp_path, math.inf)


def test_receipt_headroom_reserved(monkeypatch, tmp_path):
    monkeypatch.setattr(G["shutil"], "disk_usage", lambda _: SimpleNamespace(free=100*1024**3))
    with pytest.raises(ValueError, match="cap"):
        R["guard"](tmp_path, math.inf, additional=88*1024**2+1)


@pytest.mark.parametrize("phase", ["measurement", "save-mapped", "save-correction"])
def test_partial_state_kept_when_processing_fails(monkeypatch, tmp_path, phase):
    parent, output = tmp_path/"parent", tmp_path/"output"
    parent.mkdir()
    output.mkdir()
    q = R["A"]["A"]["initial_slots"](13, True)
    np.save(parent/"q.npy", q, allow_pickle=False)
    monkeypatch.setitem(G, "PARENT", parent/"receipt.json")
    monkeypatch.setitem(G, "guard", lambda *args, **kwargs: None)
    monkeypatch.setitem(G, "selected", lambda _: [dict(label="one", array="q.npy", reference="q.npy", time=0., input_kind="rejected", stored=None)])
    def sample(*args):
        if phase == "measurement":
            raise ValueError("injected measurement failure")
        return q, {}
    monkeypatch.setitem(G, "sample", sample)
    save = R["save"]
    def fail_save(directory, name, value, deadline):
        if (phase == "save-mapped" and name.endswith("mapped.npy")) or (phase == "save-correction" and name.endswith("delta.npy")):
            raise OSError("injected persistence failure")
        save(directory, name, value, deadline)
    monkeypatch.setitem(G, "save", fail_save)
    result = dict(states=[])
    with pytest.raises((ValueError, OSError)):
        R["collect"]({}, output, math.inf, result)
    assert len(result["states"]) == 1 and not result["states"][0]["completed"]
    assert result["states"][0]["phase"] == phase and not result["states"][0]["restart_permitted"]
    assert len(list(output.glob("*.npy"))) == (1 if phase == "save-correction" else 0)


@pytest.mark.parametrize("problem", ["failure", "source-drift", "nonfinite"])
def test_final_failure_receipt_cannot_become_passed(monkeypatch, tmp_path, problem):
    evidence = tmp_path/"evidence"
    evidence.mkdir()
    output = evidence/"study"
    source, protocol, report, parent, audit = (tmp_path/name for name in ("source.py", "protocol.md", "report.xml", "parent.json", "audit.json"))
    for path in (source, protocol, report, parent, audit):
        path.write_text("fixture", encoding="utf-8")
    before = {"source.py": R["sha"](source), "protocol.md": R["sha"](protocol)}
    tests = dict(runner_tests=dict(sha256=R["sha"](report)))
    retained = {parent: R["sha"](parent), audit: R["sha"](audit)}
    for name, value in dict(ROOT=tmp_path, EVIDENCE=evidence, PROTOCOL="protocol.md", PARENT=parent, AUDIT=audit, RETAINED=retained).items():
        monkeypatch.setitem(G, name, value)
    monkeypatch.setitem(G, "sources", lambda _: (before, tests, {}))
    monkeypatch.setitem(G, "guard", lambda *args, **kwargs: None)
    monkeypatch.setitem(G["D"], "verify_artifacts", lambda *args: 0)
    def collect(_parent, _directory, _deadline, result):
        result["states"].append(dict(label="one", completed=False, phase="measurement"))
        if problem == "failure":
            raise ValueError("injected study failure")
        result["states"] = [dict(completed=True) for _ in range(30)]
        if problem == "source-drift":
            source.write_text("changed", encoding="utf-8")
        else:
            result["metric"] = math.nan
    monkeypatch.setitem(G, "collect", collect)
    monkeypatch.setattr(G["argparse"].ArgumentParser, "parse_args", lambda _: SimpleNamespace(output_directory=output, test_report=report))
    assert R["main"]() == 1
    data = json.loads((output/"receipt.json").read_text(encoding="utf-8"))
    assert not data["completed"] and not data["component_passed"] and not data["parent_probe_passed"]
    assert all(data[k] is False for k in R["FLAGS"])
    if problem == "failure":
        assert "injected study failure" in data["states"][0]["failure"]
    elif problem == "source-drift":
        assert "source identity changed" in data["errors"]
    else:
        assert data["nonfinite_record_paths"]


def test_selection_does_not_mutate_parent_records():
    parent = parent_fixture()
    before = copy.deepcopy(parent)
    R["selected"](parent)
    assert parent == before
