from dataclasses import replace
from pathlib import Path
import runpy

import numpy as np
import pytest


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-fd4-window.py"))


def test_fd4_initial_control_preserves_55_slots_and_exact_order(driver):
    from science.numerical_relativity.fo_ccz4_rhs import _geometry
    seed = driver["STENCIL"]["initial"](4, "wave", driver["PROFILE"], points=5)
    corrected = driver["connection_consistent_initial_checkpoint"](seed)
    assert corrected.header == seed.header
    for i, (left, right) in enumerate(zip(seed.slots, corrected.slots)):
        if i not in (19, 20, 21):
            np.testing.assert_array_equal(left, right)
    state = corrected.to_state()
    assert state.grid.spatial_order == state.auxiliary.derivative_order == 4
    np.testing.assert_allclose(state.base.conformal_gamma, _geometry(state)[7], atol=2.e-18, rtol=0.)
    assert np.max(abs(seed.slots[19]-corrected.slots[19])) > 0.
    with pytest.raises(ValueError, match="initial-data only"):
        driver["connection_consistent_initial_checkpoint"](replace(corrected, header={**corrected.header, "step": 1}))


def test_time_control_initial_data_and_diagnostics_are_fourth_order(driver):
    coarse = driver["initial_checkpoint"](5, 1.e-4, 512)
    fine = driver["initial_checkpoint"](5, 1.e-4, 1024)
    assert all(a.tobytes() == b.tobytes() for a, b in zip(coarse.slots, fine.slots))
    assert coarse.header["dt"] == 2.*fine.header["dt"]
    measured = driver["sample"](coarse)
    assert measured["spatial_order"] == measured["auxiliary_derivative_order"] == 4
    assert measured["checkpoint_version"] == 3 and measured["finite_positive"]
    assert len(measured["auxiliary_reduction_l_inf_by_slot"]) == 33
    assert len(measured["planes"]["H_fourier"]) == 5
    assert not measured["runtime_writeback"]


def test_driver_rejects_second_order_diagnostics(driver):
    old = driver["REMAINDER"]["initial_checkpoint"](5, 1.e-4, 512)
    with pytest.raises(ValueError, match="v3/order 4"):
        driver["sample"](old)


def test_native_command_explicitly_binds_order_profile_and_case_time_step(driver):
    data = driver["initial_checkpoint"](5, 2.5e-5, 1024)
    cmd = driver["native_command"]("solver.exe", data, "in.bin", "out.bin", "out.json", 128, 4)
    flags = dict(zip(cmd[1::2], cmd[2::2]))
    assert flags["--spatial-order"] == 4
    assert flags["--dt"] == 1./1024 and flags["--amplitude"] == 2.5e-5
    assert flags["--restart"] == "in.bin" and flags["--steps"] == 128
    assert flags["--gauge-profile"] == "state-dependent-v1"
    assert flags["--solver-mode"] == "fo-rhs-shadow"


def test_unbound_receipt_fails_before_any_output(driver, tmp_path):
    path = tmp_path/"receipt.json"
    path.write_text('{"passed": true}', encoding="utf-8")
    with pytest.raises(ValueError, match="predeclared SHA"):
        driver["validate_origin"](path)
    assert list(tmp_path.iterdir()) == [path]


def output_fixture(driver):
    from science.numerical_relativity.test_fo_ccz4_spatial_checkpoint import manifest
    data = driver["initial_checkpoint"](5, 1.e-4, 512)
    final = replace(data, header={**data.header, "step": 64, "time": .125})
    raw = final.to_bytes()
    payload = manifest(4, True)
    payload["grid"].update(shape=[5]*3, spacing=[.2]*3, dt=1./512)
    fnv = driver["STENCIL"]["legacy_fnv"]
    payload["diagnostics"].update(step=64, time=.125,
                                  checkpoint_checksum_fnv1a64=fnv(raw),
                                  state_checksum_fnv1a64=fnv(raw[24:56]+raw[64:]))
    return data, raw, payload


def test_output_metadata_and_full_byte_checksums_are_validated(driver):
    data, raw, payload = output_fixture(driver)
    result = driver["validate_output"](data, raw, payload, 64)
    assert result.header["time"] == .125 and result.header["spatial_order"] == 4


@pytest.mark.parametrize("bad", ("version", "step", "time", "shape", "checksum", "dt", "manifest_dt", "spacing"))
def test_output_metadata_or_checksum_drift_rejected(driver, bad):
    data, raw, payload = output_fixture(driver)
    if bad == "version":
        payload["kernel_version"] = "0.2.1"
    elif bad == "shape":
        payload["grid"]["shape"] = [6]*3
    elif bad == "checksum":
        payload["diagnostics"]["checkpoint_checksum_fnv1a64"] = "0123456789abcdef"
    elif bad == "dt":
        data = replace(data, header={**data.header, "dt": 1./1024})
    elif bad == "manifest_dt":
        payload["grid"]["dt"] = 1./1024
    elif bad == "spacing":
        payload["grid"]["spacing"] = [.25]*3
    else:
        payload["diagnostics"][bad] = 0
    with pytest.raises(ValueError):
        driver["validate_output"](data, raw, payload, 64)


def test_timeout_and_disk_gates_prevent_starting_another_segment(driver, tmp_path, monkeypatch):
    runner = driver["Runner"](tmp_path, {"commands": []})
    runner.started -= 1201.
    with pytest.raises(ValueError, match="20-minute"):
        runner.budget()
    runner.started = driver["time"].perf_counter()
    from collections import namedtuple
    usage = namedtuple("Usage", "total used free")
    monkeypatch.setattr(driver["shutil"], "disk_usage", lambda _: usage(100, 99, 1))
    with pytest.raises(ValueError, match="disk capacity"):
        runner.budget()
