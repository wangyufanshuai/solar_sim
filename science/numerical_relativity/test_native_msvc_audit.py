from pathlib import Path
import runpy

import pytest


@pytest.fixture
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[2] / "scripts/run-nr-k2-native-msvc.py"))


def test_generator_pins_native_instance_without_shell_or_environment_edits(driver):
    command = driver["configure_command"]("C:/Program Files/cmake.exe", "C:/Build Tools", "source", "build")
    assert command[command.index("-G") + 1] == "Visual Studio 17 2022"
    assert command[command.index("-A") + 1] == "x64"
    assert command[command.index("-T") + 1] == "v143,host=x64"
    assert command[-1] == "-DCMAKE_GENERATOR_INSTANCE=C:/Build Tools"


@pytest.mark.parametrize("bad", ({"observed_threads": 1}, {"worker_mask": 1}, {"openmp_version": 0},
                                {"checksum": 0}, {"cpp_standard": 201402}, {"pointer_bytes": 4}, {"passed": False}))
def test_probe_cannot_pass_by_claiming_compiler_presence(driver, bad):
    probe = {"passed": True, "cpp_standard": 201703, "openmp_version": 200203,
             "pointer_bytes": 8, "requested_threads": 4, "observed_threads": 4,
             "worker_mask": 15, "checksum": 5559680, "expected_checksum": 5559680}
    assert driver["validate_probe"](probe)
    assert not driver["validate_probe"]({**probe, **bad})


def test_receipt_keeps_existing_evidence_and_rejects_nonfinite(driver, tmp_path):
    path = tmp_path / "receipt.json"
    with pytest.raises(ValueError):
        driver["write_new_json"](path, {"value": float("nan")})
    assert not path.exists()
    driver["write_new_json"](path, {"value": 1})
    before = path.read_bytes()
    with pytest.raises(FileExistsError):
        driver["write_new_json"](path, {"value": 2})
    assert path.read_bytes() == before


def test_replay_requires_every_contract_gate_and_keeps_shadow_scope(driver):
    names = ("cross_backend_passed", "checkpoint_equal_thread_count", "checkpoint_equal_restart",
             "manifest_equal_thread_count", "manifest_equal_restart", "manifest_identity_parity",
             "mismatched_scenario_rejected", "ordering_fixture_passed", "dynamic_rhs_implemented")
    valid = {**dict.fromkeys(names, True), "runtime_writeback": False,
             "physical_validation": False, "promotion": "blocked-pending-validation"}
    assert driver["validate_replay"](valid, dynamic=True)
    for name in names:
        assert not driver["validate_replay"]({**valid, name: False}, dynamic=True)
    assert not driver["validate_replay"]({**valid, "physical_validation": True}, dynamic=True)
    assert not driver["validate_replay"]({**valid, "runtime_writeback": True}, dynamic=True)


def test_analytic_replay_requires_measured_agreement_not_old_writer_flag(driver):
    names = ("cross_backend_passed", "checkpoint_equal_thread_count", "checkpoint_equal_restart",
             "manifest_equal_thread_count", "manifest_equal_restart", "manifest_identity_parity",
             "mismatched_scenario_rejected")
    valid = {**dict.fromkeys(names, True), "runtime_writeback": False, "physical_validation": False,
             "promotion": "blocked-pending-validation", "analytic_auxiliary_agreement": True}
    assert driver["validate_replay"](valid, dynamic=False)
    for name in (*names, "analytic_auxiliary_agreement"):
        assert not driver["validate_replay"]({**valid, name: False}, dynamic=False)
    del valid["analytic_auxiliary_agreement"]
    valid["auxiliary_ordering_reconstructed"] = True
    assert not driver["validate_replay"](valid, dynamic=False)
