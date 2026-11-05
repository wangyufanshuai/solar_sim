from copy import deepcopy
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[1] / "run-nr-k3-topology-cache.py"))


def timing_rows(driver, baseline=2., candidate=1.):
    return [{"pair": i, "backend": name, "seconds": baseline if name == "baseline" else candidate}
            for i in range(driver["PAIRS"])
            for name in (("baseline", "candidate") if i % 2 == 0 else ("candidate", "baseline"))]


def test_performance_keeps_all_paired_observations(driver):
    rows = timing_rows(driver)
    result = driver["performance_summary"](rows)
    assert result["local_speedup_gate"]
    assert result["paired_speedups"] == [2.] * 6
    assert rows == timing_rows(driver)


@pytest.mark.parametrize("mutation", ("missing", "duplicate", "bad-backend", "order", "nan", "infinity", "zero"))
def test_timing_gate_rejects_incomplete_or_invalid_evidence(driver, mutation):
    rows = timing_rows(driver)
    if mutation == "missing":
        rows.pop()
    elif mutation == "duplicate":
        rows[-1] = deepcopy(rows[0])
    elif mutation == "bad-backend":
        rows[0]["backend"] = "unknown"
    elif mutation == "order":
        rows[0], rows[1] = rows[1], rows[0]
    else:
        rows[0]["seconds"] = {"nan": float("nan"), "infinity": float("inf"), "zero": 0.}[mutation]
    with pytest.raises(ValueError):
        driver["performance_summary"](rows)


def test_timing_gate_requires_both_effect_and_consistent_pairs(driver):
    assert not driver["performance_summary"](timing_rows(driver, 1.05, 1.))["local_speedup_gate"]
    rows = timing_rows(driver)
    for row in rows:
        if row["pair"] in (0, 1) and row["backend"] == "candidate":
            row["seconds"] = 3.
    result = driver["performance_summary"](rows)
    assert result["median_speedup"] == 2.
    assert result["faster_pairs"] == 4
    assert not result["local_speedup_gate"]


def test_manifest_comparison_allows_only_expected_version_delta(driver):
    a = {"kernel_version": "0.2.0", "diagnostics": {"checksum": "abc", "runtime_writeback": False}}
    b = {**deepcopy(a), "kernel_version": "0.2.1"}
    assert driver["equivalent_manifests"](a, b, "0.2.0", "0.2.1")
    assert a["kernel_version"] == "0.2.0"
    assert b["kernel_version"] == "0.2.1"
    b["diagnostics"]["checksum"] = "def"
    with pytest.raises(ValueError, match="beyond"):
        driver["equivalent_manifests"](a, b, "0.2.0", "0.2.1")


@pytest.mark.parametrize("version", (None, "0.1.0", "0.2.0", "0.2.2"))
def test_unexpected_candidate_version_rejected(driver, version):
    with pytest.raises(ValueError, match="version"):
        driver["equivalent_manifests"]({"kernel_version": "0.2.0"}, {"kernel_version": version}, "0.2.0", "0.2.1")


@pytest.mark.parametrize("profile_enabled", (False, True))
def test_seed_is_deterministic_independent_and_all_slots_nonconstant(driver, profile_enabled):
    profile = driver["PROFILE"] if profile_enabled else None
    first = driver["independent_seed"](5, profile)
    second = driver["independent_seed"](5, profile)
    assert first.to_bytes() == second.to_bytes()
    assert len(first.slots) == 58
    for slot in first.slots:
        assert np.all(np.isfinite(slot))
        for axis in range(3):
            assert np.max(abs(np.diff(slot, axis=axis))) > 1.e-7


@pytest.mark.parametrize("profile_enabled", (False, True))
def test_bad_restart_fixtures_are_invalid_and_not_mistaken_for_good_inputs(driver, profile_enabled):
    profile = driver["PROFILE"] if profile_enabled else None
    checkpoint = driver["independent_seed"](5, profile)
    bad = driver["bad_payloads"](checkpoint)
    assert set(bad) == {"truncated", "trailing", "points", "nonfinite", "indefinite", "profile"}
    for label, raw in bad.items():
        expected = (None if profile else driver["PROFILE"]) if label == "profile" else profile
        with pytest.raises(ValueError):
            driver["decode_checkpoint"](raw, expected_profile=expected)


def test_full_checkpoint_bytes_are_compared(driver, tmp_path):
    a, b = tmp_path / "left.bin", tmp_path / "right.bin"
    a.write_bytes(b"state-a")
    b.write_bytes(b"state-b")
    with pytest.raises(ValueError, match="checkpoint bytes"):
        driver["compare_outputs"]({"path": a}, {"path": b}, ("0.2.0", "0.2.1"))


def test_rejected_restart_cannot_leave_an_output(driver, tmp_path, monkeypatch):
    runner = driver["BoundedRun"](tmp_path, {"commands": []})
    monkeypatch.setattr(runner, "execute", lambda *args, **kwargs: ("", .1))
    (tmp_path / "bad.bin").write_bytes(b"unexpected output")
    with pytest.raises(ValueError, match="wrote output"):
        runner.native("bad", "unused.exe", driver["CASES"][1], reject=True)


def test_successful_exit_cannot_pass_negative_case(driver, tmp_path, monkeypatch):
    runner = driver["BoundedRun"](tmp_path, {"commands": []})
    monkeypatch.setattr(runner, "budget", lambda: 1.)
    monkeypatch.setattr(driver["subprocess"], "run", lambda *args, **kwargs: SimpleNamespace(
        returncode=0, stdout="", stderr=""))
    with pytest.raises(ValueError, match="exit code"):
        runner.execute("bad", ["unused.exe"], reject=True)
    assert len(runner.receipt["commands"]) == 1
    assert (tmp_path / "bad.log").exists()


def test_process_timeout_is_retained_and_not_retried(driver, tmp_path, monkeypatch):
    runner = driver["BoundedRun"](tmp_path, {"commands": []})
    monkeypatch.setattr(runner, "budget", lambda: .1)
    calls = []

    def timed_out(*args, **kwargs):
        calls.append(args)
        raise driver["subprocess"].TimeoutExpired("unused", .1, output=b"partial")

    monkeypatch.setattr(driver["subprocess"], "run", timed_out)
    with pytest.raises(driver["subprocess"].TimeoutExpired):
        runner.execute("timeout", ["unused.exe"])
    assert len(calls) == 1
    assert runner.receipt["commands"][0]["timed_out"]
    assert "partial" in (tmp_path / "timeout.log").read_text()


def test_archive_drift_rejected_without_execution(driver, tmp_path):
    (tmp_path / "baseline-receipt.json").write_text("{}")
    with pytest.raises(ValueError, match="archived receipt"):
        driver["verify_archive"](tmp_path)
