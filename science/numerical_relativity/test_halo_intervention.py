from dataclasses import fields, make_dataclass

import numpy as np
import pytest

from science.numerical_relativity import halo_intervention as H
from science.numerical_relativity.fo_ccz4_rhs import FOCCZ4RHS3D


@pytest.mark.parametrize("mode", H.MODES)
def test_mask_is_exact_original_layer_embedding(mode):
    mask = H.clamp_mask(mode)
    expected = np.zeros((25,)*3, dtype=bool)
    for i in range(25):
        for j in range(25):
            for k in range(25):
                expected[i, j, k] = ((mode in ("low", "both") and min(i, j, k) <= 5)
                    or (mode in ("high", "both") and max(i, j, k) >= 19))
    assert np.array_equal(mask, expected)
    assert not np.any(mask[6:19, 6:19, 6:19])


@pytest.mark.parametrize("mode", ("other", None, 1))
def test_mask_rejects_unknown_condition(mode):
    with pytest.raises(ValueError):
        H.clamp_mask(mode)


@pytest.mark.parametrize("mode", H.MODES)
def test_clamp_copies_all_rhs_tensors_without_mutating_input(mode):
    tails = {"h": (3, 3), "a": (3, 3), "shift": (3,), "b": (3,), "conformal_gamma": (3,),
             "lapse_gradient": (3,), "shift_gradient": (3, 3), "metric_gradient": (3, 3, 3),
             "conformal_factor_gradient": (3,)}
    rhs = FOCCZ4RHS3D(**{f.name: np.ones((25,)*3+tails.get(f.name, ())) for f in fields(FOCCZ4RHS3D)})
    result, mask = H.clamp_rhs(rhs, mode), H.clamp_mask(mode)
    for f in fields(rhs):
        original, changed = getattr(rhs, f.name), getattr(result, f.name)
        assert np.all(original == 1.)
        assert not np.shares_memory(original, changed)
        assert np.all(changed[mask] == 0.) and np.all(changed[~mask] == 1.)


@pytest.mark.parametrize("value", (np.zeros((17,)*3), np.full((25,)*3, np.nan)))
def test_clamp_rejects_wrong_grid_or_nonfinite_rhs(value):
    Fake = make_dataclass("Fake", [("value", object)])
    with pytest.raises(ValueError):
        H.clamp_rhs(Fake(value), "low")


def write_sample(path, mode="none", steps=1):
    selected = H.STEPS if steps == 256 else (1,)
    records = np.zeros(len(selected), dtype=H.RECORD)
    records["step"], records["time"] = selected, np.asarray(selected)/256.
    with path.open("xb") as stream:
        stream.write(H.HEADER.pack(b"NRHALO01", 1, 25, 58, H.MODES.index(mode), len(selected)))
        stream.write(records.tobytes())


@pytest.mark.parametrize("mode", H.MODES)
def test_diagnostic_is_readonly_and_mode_bound(tmp_path, mode):
    path = tmp_path/"result.diagnostic"
    write_sample(path, mode)
    data = H.read_records(path, mode, 1)
    assert data["q"].shape == (1, 58, 25, 25, 25)
    assert data[0]["step"] == 1 and data[0]["time"] == 1./256
    assert not data.flags.writeable
    with pytest.raises(ValueError):
        H.read_records(path, H.MODES[(H.MODES.index(mode)+1) % 4], 1)


@pytest.mark.parametrize("steps", (True, 2, 1., 512))
def test_reader_rejects_undeclared_step_contract(tmp_path, steps):
    with pytest.raises(ValueError):
        H.read_records(tmp_path/"missing", "none", steps)


@pytest.mark.parametrize("payload", (b"", b"NRFOCCZ4", H.HEADER.pack(b"NRHALO01", 1, 25, 58, 0, 1)))
def test_reader_rejects_wrong_or_truncated_format(tmp_path, payload):
    path = tmp_path/"bad"
    path.write_bytes(payload)
    with pytest.raises(ValueError):
        H.read_records(path, "none", 1)


@pytest.mark.parametrize("field,value", (("step", 2), ("time", .25), ("q", np.nan)))
def test_reader_rejects_wrong_saved_identity_or_nonfinite_state(tmp_path, field, value):
    path = tmp_path/"bad"
    write_sample(path)
    data = np.memmap(path, dtype=H.RECORD, mode="r+", offset=H.HEADER.size, shape=(1,))
    data[field][0] = value
    data.flush()
    del data
    with pytest.raises(ValueError):
        H.read_records(path, "none", 1)


def test_full_trajectory_has_all_five_declared_times(tmp_path):
    path = tmp_path/"full"
    write_sample(path, "both", 256)
    assert tuple(H.read_records(path, "both", 256)["step"]) == H.STEPS


def test_factorial_retains_signed_effects_and_interaction():
    base = np.array([1., -1., 2.])
    low, high, interaction = np.array([2., -2., 1.]), np.array([-1., 4., 3.]), np.array([.5, -.5, 0.])
    result = H.factorial({"both": base, "high": base+low, "low": base+high,
                          "none": base+low+high+interaction})
    for name, expected in (("release_low_from_both", low), ("release_high_from_both", high),
                           ("interaction", interaction), ("release_both", low+high+interaction)):
        assert np.array_equal(result["contrasts"][name]["fields"], expected)
    assert result["identity_residual"] == 0.
    assert result["reflection_measurement"] is result["unique_source_decomposition"] is False


def test_zero_effects_are_accepted_not_forced_above_floor():
    result = H.factorial({mode: np.zeros((5, 5, 5)) for mode in H.MODES})
    assert all(v["rms"] == 0. and not v["resolved_above_floor"] for v in result["contrasts"].values())


@pytest.mark.parametrize("bad", ({}, {"none": np.zeros(1)},
    {m: np.zeros(2 if m == "none" else 3) for m in H.MODES},
    {m: np.array([np.nan]) for m in H.MODES}))
def test_factorial_rejects_missing_mismatched_or_invalid_inputs(bad):
    with pytest.raises(ValueError):
        H.factorial(bad)


@pytest.mark.parametrize("value", ([], [np.nan], [np.inf]))
def test_summary_rejects_invalid_data(value):
    with pytest.raises(ValueError):
        H.summarize(value)


def test_summary_avoids_square_overflow():
    assert H.summarize(np.array([1.e200, -1.e200]))["rms"] == 1.e200
