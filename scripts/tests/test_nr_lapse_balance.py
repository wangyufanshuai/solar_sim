from pathlib import Path
import runpy

import numpy as np
import pytest


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-lapse-balance.py"))


def test_rhs_format_is_distinct_and_strict(driver):
    pack = driver["HEADER"].pack(driver["RHS_MAGIC"], 1, 5, 58)
    raw = pack + np.arange(58*5**3, dtype="<f8").tobytes()
    q = driver["read_rhs"](raw, 5)
    assert len(q) == 58 and q[-1][-1, -1, -1] == 58*5**3-1
    for bad in (raw[:-1], raw+b"x", b"NRK2FO01"+raw[8:], raw[:16]):
        with pytest.raises(ValueError):
            driver["read_rhs"](bad, 5)
    with pytest.raises(ValueError):
        driver["read_rhs"](raw, 8)
    with pytest.raises(ValueError, match="nonfinite"):
        driver["read_rhs"](pack+np.full(58*5**3, np.nan, dtype="<f8").tobytes(), 5)


def test_preregistered_inputs_are_complete_repeatable_and_valid(driver):
    a, b = driver["fixtures"](), driver["fixtures"]()
    assert len(a) == len({row[0] for row in a}) == 20
    assert sum(row[2] == "independent" for row in a) == 4
    for (label, left, _), (other, right, _) in zip(a, b):
        assert label == other and left.to_bytes() == right.to_bytes()
        assert left.header["time"] == left.header["step"] == 0


def test_source_closure_includes_probe_and_old_campaign(driver):
    name = "scripts/run-nr-k3-trace-source-window.py"
    data = driver["source_identity"]({"source_before": {name: "placeholder"}})
    assert set(data) == set(driver["NEW_FILES"]) | {name}
    assert len(driver["NEW_FILES"]) == 6


def test_existing_evidence_directory_is_not_overwritten(driver, tmp_path, monkeypatch):
    monkeypatch.setitem(driver["campaign"].__globals__, "retained_identity", lambda: {})
    with pytest.raises(ValueError, match="fresh evidence"):
        driver["campaign"](tmp_path)
    assert not list(tmp_path.iterdir())


def test_changed_parent_stops_before_any_native_execution(driver, monkeypatch):
    monkeypatch.setitem(driver["retained_identity"].__globals__, "sha256", lambda _: "changed")
    with pytest.raises(ValueError, match="receipt changed"):
        driver["retained_identity"]()
