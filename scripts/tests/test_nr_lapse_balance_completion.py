from pathlib import Path
import runpy

import pytest


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[1]/"finish-nr-k3-lapse-balance.py"))


@pytest.mark.parametrize("order", (2, 4))
def test_analytic_negative_input_is_valid_but_has_no_dynamic_profile(driver, order):
    base = driver["BASE"]
    data = next(d for _,d,f in base["fixtures"]() if d.header["spatial_order"] == order and f == "independent")
    candidate = driver["analytic_input"](data)
    raw = candidate.to_bytes()
    observed = base["decode_checkpoint"](raw, expected_profile=None, expected_spatial_order=order)
    assert observed.header["solver_mode"] == 0 and observed.header["version"] == (3 if order == 4 else 1)
    assert observed.profile is None and data.profile is not None and data.header["solver_mode"] == 1
    with pytest.raises(ValueError):
        base["decode_checkpoint"](raw, expected_profile=base["PROFILE"], expected_spatial_order=order)


def test_existing_completion_is_not_replaced(driver, tmp_path, monkeypatch):
    monkeypatch.setitem(driver["campaign"].__globals__, "retained_identity", lambda: {})
    with pytest.raises(ValueError, match="fresh completion"):
        driver["campaign"](tmp_path)
    assert not list(tmp_path.iterdir())


def test_changed_stop_receipt_is_not_accepted(driver, monkeypatch):
    monkeypatch.setitem(driver["retained_identity"].__globals__, "sha256", lambda _: "drift")
    with pytest.raises(ValueError, match="stopped v1"):
        driver["retained_identity"]()


def test_encoded_writer_is_exclusive(driver, tmp_path):
    path = tmp_path/"retained.bin"
    driver["write_encoded"](path, b"original")
    with pytest.raises(FileExistsError):
        driver["write_encoded"](path, b"replace")
    assert path.read_bytes() == b"original"
