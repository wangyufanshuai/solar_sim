from copy import deepcopy
from dataclasses import replace
from pathlib import Path
import runpy

import pytest


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-spatial-order.py"))


def rows():
    return [{"order":order,"points":n,"axis":axis,"l2":(axis+1.)/n**order}
            for order in (2,4) for n in (16,24,32) for axis in range(3)]


def test_manufactured_gate_requires_order_on_every_axis_and_keeps_raw_values(driver):
    values = rows()
    result = driver["manufactured_gate"](values)
    assert len(result) == 6 and all(r["passed"] for r in result)
    assert values == rows()
    values[-1]["l2"] *= 2.
    assert not all(r["passed"] for r in driver["manufactured_gate"](values))


@pytest.mark.parametrize("bad", ("missing","duplicate","axis","nan","zero"))
def test_missing_or_unmeasurable_manufactured_rows_fail_closed(driver,bad):
    values = rows()
    if bad == "missing":
        values.pop()
    elif bad == "duplicate":
        values[-1] = values[0]
    elif bad == "axis":
        values[0]["axis"] = 8
    else:
        values[0]["l2"] = float("nan") if bad == "nan" else 0.
    with pytest.raises(ValueError):
        driver["manufactured_gate"](values)


def manifests():
    old = {"kernel_version":"0.2.1","grid":{"dt":.1},"diagnostics":{"checksum":"abc"}}
    new = {"kernel_version":"0.3.0","grid":{"dt":.1,"spatial_order":2},
           "diagnostics":{"checksum":"abc","checkpoint_version":1,"spatial_order_bound_to_checkpoint":True,
                          "spatial_operator":"centered-periodic","numerical_dissipation":"none"}}
    return old,new


def test_legacy_manifest_comparison_preserves_inputs(driver):
    old,new = manifests()
    before = deepcopy((old,new))
    assert driver["legacy_manifest_equal"](old,new)
    assert before == (old,new)


@pytest.mark.parametrize("bad", ("version","order","checksum","unexpected","dissipation"))
def test_legacy_manifest_drift_is_not_stripped(driver,bad):
    old,new = manifests()
    if bad == "version":
        new["kernel_version"] = "0.4.0"
    elif bad == "order":
        new["grid"]["spatial_order"] = 4
    elif bad == "checksum":
        new["diagnostics"]["checksum"] = "changed"
    elif bad == "unexpected":
        new["extra"] = True
    else:
        new["diagnostics"]["numerical_dissipation"] = "KO"
    with pytest.raises(ValueError):
        driver["legacy_manifest_equal"](old,new)


@pytest.mark.parametrize("order", (2,4))
def test_independent_seed_is_repeatable_and_binds_spatial_order(driver,order):
    first = driver["initial"](order,"noise",driver["PROFILE"],5)
    second = driver["initial"](order,"noise",driver["PROFILE"],5)
    assert first.to_bytes() == second.to_bytes()
    assert first.to_state().auxiliary.derivative_order == order
    assert driver["state_error"](first,second) == 0.


def test_cross_backend_comparison_rejects_metadata_drift(driver):
    first = driver["initial"](4,"noise",None,5)
    other = replace(first,header={**first.header,"spatial_order":2})
    with pytest.raises(ValueError,match="metadata"):
        driver["state_error"](first,other)


def test_corruption_cases_rejected_by_independent_python_decoder(driver):
    data = driver["initial"](4,"noise",driver["PROFILE"],5)
    variants = driver["corrupt_v3"](data)
    assert len(variants) == 7
    for raw in variants.values():
        with pytest.raises(ValueError):
            driver["decode_checkpoint"](raw,expected_profile=driver["PROFILE"],expected_spatial_order=4)


def test_old_receipt_identity_is_required(driver,tmp_path):
    (tmp_path/"baseline-receipt.json").write_text("{}")
    with pytest.raises(ValueError,match="archive receipt"):
        driver["archive_identity"](tmp_path)


def test_manifest_checksums_cover_all_checkpoint_and_state_bytes(driver):
    raw = driver["initial"](4,"noise",None,5).to_bytes()
    data = {"diagnostics":{"checkpoint_checksum_fnv1a64":driver["legacy_fnv"](raw),
                           "state_checksum_fnv1a64":driver["legacy_fnv"](raw[24:56]+raw[64:])}}
    driver["verify_manifest_checksums"](raw,data)
    changed = raw[:-1]+bytes([raw[-1] ^ 1])
    with pytest.raises(ValueError,match="checkpoint checksum"):
        driver["verify_manifest_checksums"](changed,data)
    data["diagnostics"]["checkpoint_checksum_fnv1a64"] = driver["legacy_fnv"](changed)
    with pytest.raises(ValueError,match="state checksum"):
        driver["verify_manifest_checksums"](changed,data)
