from pathlib import Path
import runpy

import pytest


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-trace-source-window.py"))


def test_frozen_execution_counts_and_positive_steps(driver):
    assert len(driver["CASES"])*4 + len(driver["parity_cases"]())*2 + 8 == 288
    assert len(driver["parity_cases"]()) == 16
    assert all(c.steps_per_unit//4 > 0 for c in driver["CASES"])


def test_existing_campaign_directory_is_not_overwritten(driver, tmp_path, monkeypatch):
    sentinel = tmp_path/"sentinel"
    sentinel.write_bytes(b"preserved")
    monkeypatch.setitem(driver["campaign"].__globals__, "retained_identity", lambda: {})
    with pytest.raises(ValueError, match="fresh output directory"):
        driver["campaign"](tmp_path)
    assert sentinel.read_bytes() == b"preserved" and len(list(tmp_path.iterdir())) == 1


def test_python_worker_refuses_existing_output(driver, tmp_path):
    path = tmp_path/"existing.bin"
    path.write_bytes(b"retained")
    with pytest.raises(ValueError, match="collision"):
        driver["python_step"](tmp_path/"not-read.bin", path, 4)
    assert path.read_bytes() == b"retained"


def test_source_identity_unifies_old_and_new_files(driver):
    name = "scripts/analyze-nr-auxiliary-trace-source.py"
    identities = driver["source_identity"]({"source_before": {name: "ignored"}})
    assert set(identities) == set(driver["NEW_FILES"]) | {name}
    assert all(len(digest) == 64 for digest in identities.values())


def test_parent_receipt_drift_stops_before_running_solver(driver, monkeypatch):
    monkeypatch.setitem(driver["retained_identity"].__globals__, "sha256", lambda _: "wrong")
    with pytest.raises(ValueError, match="receipts or binary"):
        driver["retained_identity"]()
