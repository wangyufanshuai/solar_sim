from dataclasses import replace
from pathlib import Path
import runpy
from types import SimpleNamespace

import numpy as np
import pytest


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-fd4-robust-window.py"))


@pytest.mark.parametrize("n", (8, 12, 16))
def test_all_slots_are_deterministic_nonplanar_and_have_checkerboard_content(driver, n):
    initial = driver["initial_checkpoint"]("noise", n, 20261007, 256)
    repeated = driver["initial_checkpoint"]("noise", n, 20261007, 256)
    different = driver["initial_checkpoint"]("noise", n, 20261008, 256)
    assert initial.to_bytes() == repeated.to_bytes() != different.to_bytes()
    assert initial.header["version"] == 3 and initial.header["spatial_order"] == 4
    assert initial.to_state().auxiliary.derivative_order == 4
    for q in initial.slots:
        assert all(np.any(q != np.roll(q, 1, axis=axis)) for axis in range(3))
    observation = driver["sample"](initial)
    assert all(np.all(np.abs(x) > 0.) for x in observation["checkerboard_signed_mean_by_slot"])
    assert observation["max_auxiliary_reduction_l_inf"] > 1.e-12  # Deliberately independent.
    assert observation["plane_oracle"] is None


def test_halved_step_has_identical_58_initial_fields(driver):
    coarse = driver["initial_checkpoint"]("noise", 12, 20261007, 256)
    fine = driver["initial_checkpoint"]("time", 12, 20261007, 512)
    assert coarse.header["dt"] == 2*fine.header["dt"]
    assert all(a.tobytes() == b.tobytes() for a, b in zip(coarse.slots, fine.slots))
    comparison = driver["temporal_comparison"](coarse, fine, coarse)
    assert all(x["passed"] and x["fraction"] == 0. for x in comparison["slots"])
    with pytest.raises(ValueError, match="dt/profile"):
        driver["temporal_comparison"](coarse, coarse, coarse)
    with pytest.raises(ValueError, match="metadata"):
        driver["temporal_comparison"](coarse, replace(fine, header={**fine.header, "time": 1.}), coarse)


def test_flat_control_and_unregistered_grid_rejection(driver):
    flat = driver["initial_checkpoint"]("minkowski", 6, 0, 256)
    sample = driver["sample"](flat)
    assert sample["perturbation_l2"] == 0. and sample["slot_l2"] == [0.]*58
    with pytest.raises(ValueError, match="undeclared"):
        driver["initial_checkpoint"]("noise", 9, 20261007, 256)


def test_wrong_parent_is_rejected_before_inspecting_paths(driver, tmp_path):
    path = tmp_path/"receipt.json"
    path.write_text("{}", encoding="utf-8")
    with pytest.raises(ValueError, match="frozen"):
        driver["parent_identity"](path)


@pytest.mark.parametrize("kind", ("c", "e", "time", "output"))
def test_capacity_stops_before_subprocess(driver, tmp_path, monkeypatch, kind):
    runner = driver["Runner"](tmp_path, {"commands": []})
    module_globals = runner.budget.__globals__
    if kind == "time":
        runner.started -= driver["HARD_TIMEOUT"]+1
    elif kind == "output":
        monkeypatch.setitem(module_globals, "OUTPUT_LIMIT", 0)
    def usage(path):
        is_output = Path(path) == tmp_path
        free = (driver["RESERVE_C"]-1 if kind == "c" and is_output else
                driver["RESERVE_E"]-1 if kind == "e" and not is_output else 10*1024**3)
        return SimpleNamespace(free=free)
    monkeypatch.setattr(module_globals["shutil"], "disk_usage", usage)
    with pytest.raises(ValueError):
        runner.budget()
    assert runner.receipt["commands"] == []
