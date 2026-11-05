from copy import deepcopy
from dataclasses import replace
from pathlib import Path
import runpy

import pytest

from science.numerical_relativity.test_auxiliary_manifest import current_manifest


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-auxiliary-manifest.py"))


def output_fixture(driver, *, order=2, profile=None, mode=1):
    data = driver["STENCIL"]["initial"](order, "noise", profile, points=5)
    data = replace(data, header={**data.header, "solver_mode": mode})
    raw = data.to_bytes()
    payload = current_manifest(dynamic=bool(mode), order=order, profile=profile is not None)
    payload["grid"].update(shape=[5]*3, spacing=[.2]*3, dt=data.header["dt"])
    payload["diagnostics"].update(scenario="minkowski", **{k: data.header[k] for k in ("step", "time", "amplitude", "wavelength")})
    payload["diagnostics"].update(checkpoint_checksum_fnv1a64=driver["STENCIL"]["legacy_fnv"](raw),
                                 state_checksum_fnv1a64=driver["STENCIL"]["legacy_fnv"](raw[24:56]+raw[64:]))
    return data, raw, payload


def old_envelope(new):
    old = deepcopy(new)
    old["kernel_version"] = "0.3.1"
    del old["diagnostics"]["auxiliary_evolution"]
    old["diagnostics"]["auxiliary_ordering_reconstructed"] = True
    return old


@pytest.mark.parametrize("order,profile,mode", ((2,False,0),(4,False,0),(2,False,1),(4,False,1),(2,True,1),(4,True,1)))
def test_raw_output_and_whitelisted_metadata_are_checked_without_mutation(driver, order, profile, mode):
    p = driver["PROFILE"] if profile else None
    data, raw, payload = output_fixture(driver, order=order, profile=p, mode=mode)
    saved = deepcopy(payload)
    old = old_envelope(payload)
    for manifest, version in ((old, "0.3.1"), (payload, "0.3.2")):
        checked = driver["validate_output"](data, raw, manifest, 0, version)
        assert checked.to_bytes() == raw
    driver["metadata_parity"](old, payload, profile=p, order=order)
    assert payload == saved


@pytest.mark.parametrize("field", ("time", "step", "amplitude", "wavelength"))
def test_checksum_identity_is_not_enough_when_metadata_drifts(driver, field):
    data, raw, payload = output_fixture(driver)
    payload["diagnostics"][field] += 1.
    with pytest.raises(ValueError, match="metadata disagree"):
        driver["validate_output"](data, raw, payload, 0, "0.3.2")


@pytest.mark.parametrize("mutation", ("new-extra", "old-extra", "bad-policy", "wrong-version", "old-policy"))
def test_metadata_comparison_cannot_strip_unapproved_changes(driver, mutation):
    payload = current_manifest()
    old = old_envelope(payload)
    if mutation == "new-extra":
        payload["diagnostics"]["unapproved"] = True
    elif mutation == "old-extra":
        old["grid"]["unapproved"] = True
    elif mutation == "bad-policy":
        payload["diagnostics"]["auxiliary_evolution"]["reconstruct_auxiliaries_during_step"] = True
    elif mutation == "wrong-version":
        payload["kernel_version"] = "0.3.1"
    else:
        old["diagnostics"]["auxiliary_evolution"] = payload["diagnostics"]["auxiliary_evolution"]
    with pytest.raises(ValueError):
        driver["metadata_parity"](old, payload, profile=None, order=2)


@pytest.mark.parametrize("mutation", ("operator", "entry", "duplicate", "missing"))
def test_writer_only_source_guard_fails_closed(driver, mutation):
    old = "numeric();\nvoid write_manifest() { old_writer(); }\n} // namespace\n\nint main() { run(); }"
    allowed = old.replace("old_writer()", "new_writer()")
    driver["numerical_source_unchanged"](old, allowed)
    changed = {"operator": allowed.replace("numeric()", "different_numeric()"),
               "entry": allowed.replace("run()", "different_run()"),
               "duplicate": allowed+"void write_manifest(", "missing": "anything"}[mutation]
    with pytest.raises(ValueError):
        driver["numerical_source_unchanged"](old, changed)


def test_wrong_archive_stops_before_any_other_path_is_used(driver, tmp_path):
    (tmp_path/"baseline-receipt.json").write_text("{}", encoding="utf-8")
    with pytest.raises(ValueError, match="frozen parent"):
        driver["archive_identity"](tmp_path)


def test_zero_step_control_catches_agreeing_but_reconstructed_outputs(driver, tmp_path):
    data, raw, payload = output_fixture(driver)
    original = replace(data, slots=tuple(q if i != 25 else q+1.e-6 for i, q in enumerate(data.slots)))
    path = tmp_path/"input.bin"
    path.write_bytes(original.to_bytes())
    observed = tmp_path/"wrong-output.bin"
    observed.write_bytes(raw)

    class FakeRunner:
        def native(self, label, binary, data, path, *, steps, version="0.3.2"):
            assert steps == 0
            return {"path": observed, "data": data,
                    "manifest": payload if version == "0.3.2" else old_envelope(payload)}

    with pytest.raises(ValueError, match="zero-step restart reconstructed"):
        driver["run_case"](FakeRunner(), "new.exe", "old.exe", "test", original, path, {"cases": []})


def test_existing_checkpoint_cannot_be_overwritten_by_fixture_writer(driver, tmp_path):
    data, raw, _ = output_fixture(driver)
    path = tmp_path/"immutable.bin"
    path.write_bytes(raw)
    with pytest.raises(FileExistsError):
        driver["STENCIL"]["write_checkpoint"](path, data)
    assert path.read_bytes() == raw
