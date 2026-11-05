from copy import deepcopy
from pathlib import Path
import runpy

import pytest


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-fd4-constant-preserving.py"))


def fixture(driver, version="0.3.1"):
    fixtures = runpy.run_path(str(Path(__file__).with_name("test_nr_fd4_window.py")))
    data, raw, payload = fixtures["output_fixture"](driver["WINDOW"])
    payload["kernel_version"] = version
    payload["diagnostics"].update(amplitude=data.header["amplitude"], wavelength=data.header["wavelength"])
    return data, raw, payload


@pytest.mark.parametrize("version", ("0.3.0", "0.3.1"))
def test_control_and_candidate_require_their_exact_versions(driver, version):
    data, raw, payload = fixture(driver, version)
    saved = deepcopy(payload)
    result = driver["validate_output"](data, raw, payload, 64, version)
    assert result.header["step"] == 64 and payload == saved
    with pytest.raises(ValueError, match="version/grid"):
        driver["validate_output"](data, raw, payload, 64, "unexpected")


@pytest.mark.parametrize("field", ("time", "step", "amplitude", "wavelength"))
def test_manifest_metadata_drift_cannot_pass_full_byte_checksums(driver, field):
    data, raw, payload = fixture(driver)
    payload["diagnostics"][field] += .1
    with pytest.raises(ValueError, match="metadata disagree"):
        driver["validate_output"](data, raw, payload, 64, "0.3.1")


def test_wrong_failure_archive_is_rejected_without_reading_arbitrary_paths(driver, tmp_path):
    (tmp_path/"baseline-receipt.json").write_text("{}", encoding="utf-8")
    with pytest.raises(ValueError, match="frozen failure"):
        driver["archive_identity"](tmp_path)


def test_actual_initial_control_uses_all_six_symmetric_offdiagonal_slots(driver):
    from dataclasses import replace
    data = driver["WINDOW"]["initial_checkpoint"](5, 1.e-4, 512)
    assert driver["offdiagonal_peak"](data) == 0.
    for index in (1, 2, 4, 12, 13, 15):
        slots = [q.copy() for q in data.slots]
        slots[index][0, 0, 0] = -1.e-18
        assert driver["offdiagonal_peak"](replace(data, slots=tuple(slots))) == 1.e-18
