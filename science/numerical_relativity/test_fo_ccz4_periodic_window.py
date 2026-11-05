"""Guard the frozen campaign's interpretation, not a substitute for running it."""
from copy import deepcopy
from pathlib import Path
import runpy

import numpy as np
import pytest

from .fo_ccz4_checkpoint import FOCheckpoint, checkpoint_from_state
from .fo_ccz4_rhs import FOCCZ4State3D
from .nr3d import BSSNState3D, Grid3D


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[2]/"scripts/run-nr-k3-fo-ccz4-periodic-window.py"))


def rows(driver):
    result = []
    for family, n, steps in driver["CASES"]:
        value = 1.e-3/n**2
        samples = [{"step": step, "time": step/steps, "constraints": {
            **{name: value for name in driver["CONSTRAINTS"]}, "hamiltonian_l_inf": value},
            "perturbation_l2": 1.e-10*(1.+step/steps), "sampled_cfl_sum": .1, "finite_positive": True}
            for step in range(0, steps+1, driver["CHUNK"])]
        result.append({"family": family, "points": n, "steps": steps, "dt": 1./steps, "samples": samples})
    return result


def test_frozen_cases_cover_all_grids_both_families_and_controls(driver):
    cases = driver["CASES"]
    assert len(cases) == len(set(cases)) == 8
    assert all((family, n, 256) in cases for family in ("wave", "noise") for n in (9, 13, 17))
    assert ("wave", 17, 512) in cases and ("minkowski", 5, 256) in cases


def test_seeded_noise_is_deterministic_all_58_slots_and_all_spatial_axes(driver):
    noise = driver["initial_checkpoint"]("noise", 7, 256)
    assert noise.to_bytes() == driver["initial_checkpoint"]("noise", 7, 256).to_bytes()
    flat = driver["initial_checkpoint"]("minkowski", 7, 256)
    for a, b in zip(noise.slots, flat.slots):
        difference = a-b
        assert np.any(difference != 0.)
        assert np.max(abs(difference)) <= 1.e-10*(9./7)**2+2.e-16
        assert all(np.any(np.diff(difference, axis=axis) != 0.) for axis in range(3))
    diagnostic = driver["diagnostics"](noise, "noise")
    assert diagnostic["plane_oracle"] is None
    assert diagnostic["ordering_max_curl_l_inf"] > 0.
    assert diagnostic["max_auxiliary_reduction_l_inf"] > 0.
    assert diagnostic["runtime_writeback"] is False


def test_minkowski_all_slot_norm_zero_and_each_slot_counted(driver):
    flat = driver["initial_checkpoint"]("minkowski", 5, 256)
    assert driver["perturbation_norm"](flat.slots) == 0.
    for slot in range(58):
        arrays = [a.copy() for a in flat.slots]
        arrays[slot] += .125
        assert driver["perturbation_norm"](arrays) == pytest.approx(.125)
    with pytest.raises(ValueError, match="58"):
        driver["perturbation_norm"](flat.slots[:-1])


def test_wave_has_independent_plane_diagnostic_not_harmonic_trajectory_claim(driver):
    wave = driver["initial_checkpoint"]("wave", 9, 256)
    diagnostic = driver["diagnostics"](wave, "wave")
    assert diagnostic["plane_oracle"] is not None
    assert diagnostic["sampled_cfl_sum"] < .45
    assert diagnostic["rk_stage_cfl_monitored"] is False


def test_second_order_manufactured_norms_and_growth_pass_local_gates(driver):
    result = driver["screening"](rows(driver))
    assert all(r["orders"] == pytest.approx([2., 2.]) and r["order_gate"] for r in result["wave_orders"].values())
    assert all(r["bounded_growth_gate"] for r in result["noise"])
    assert result["sampled_domain_gate"] and result["sampled_cfl_gate"] and result["noise_resolution_gate"]


@pytest.mark.parametrize("mutation", ("missing", "duplicate", "wrong_time", "missing_checkpoint", "wrong_dt"))
def test_incomplete_or_mixed_run_cannot_pass(driver, mutation):
    data = rows(driver)
    if mutation == "missing":
        data.pop()
    elif mutation == "duplicate":
        data.append(deepcopy(data[0]))
    elif mutation == "wrong_time":
        data[0]["samples"][-1]["time"] += .01
    elif mutation == "missing_checkpoint":
        data[3]["samples"].pop(1)
    else:
        data[0]["dt"] /= 2.
    with pytest.raises(ValueError):
        driver["screening"](data)


def test_nonconvergence_and_roundoff_are_not_passes(driver):
    data = rows(driver)
    for row in data:
        for sample in row["samples"]:
            sample["constraints"]["hamiltonian_l2"] = .1
            sample["constraints"]["theta_l_inf"] = 1.e-15
    result = driver["screening"](data)
    assert result["wave_orders"]["hamiltonian_l2"]["orders"] == [0., 0.]
    assert not result["wave_orders"]["hamiltonian_l2"]["order_gate"]
    assert not result["wave_orders"]["theta_l_inf"]["measurable"]
    assert not result["wave_absolute_gate"]


def test_transient_noise_growth_cfl_or_invalid_state_cannot_be_hidden_by_good_endpoint(driver):
    data = rows(driver)
    noise = next(r for r in data if (r["family"], r["points"]) == ("noise", 17))
    noise["samples"][1]["perturbation_l2"] = 1.e-6
    noise["samples"][1]["sampled_cfl_sum"] = .46
    noise["samples"][1]["finite_positive"] = False
    result = driver["screening"](data)
    assert not result["noise"][-1]["bounded_growth_gate"]
    assert not result["noise_resolution_gate"]
    assert not result["sampled_domain_gate"] and not result["sampled_cfl_gate"]


def test_unmeasurable_noise_normalizer_rejected(driver):
    data = rows(driver)
    next(r for r in data if r["family"] == "noise")["samples"][0]["perturbation_l2"] = 0.
    with pytest.raises(ValueError, match="normalization"):
        driver["screening"](data)


def temporal_fixture(driver, sign, steps):
    grid = Grid3D((5,)*3, (0.,)*3, (1.,)*3, boundary="periodic", spatial_order=2)
    base = BSSNState3D.minkowski(grid)
    x = grid.coordinates[0]
    base.trace_k[:] = sign*.01*np.sin(2.*np.pi*x)
    return checkpoint_from_state(FOCCZ4State3D.from_bssn_state(base), profile=driver["PROFILE"],
                                 dt=1./steps, time=1., step=steps)


def test_temporal_contrast_compares_fields_not_just_norms(driver):
    result = driver["temporal_comparison"](temporal_fixture(driver, 1., 256), temporal_fixture(driver, -1., 512))
    assert result["momentum"]["fraction"] == pytest.approx(2.)
    assert not result["momentum"]["time_control_gate"]


@pytest.mark.parametrize("name,value", (("time", .5), ("points", 6), ("dt", .003), ("step", 511)))
def test_temporal_metadata_mismatch_rejected(driver, name, value):
    coarse, fine = temporal_fixture(driver, 1., 256), temporal_fixture(driver, 1., 512)
    bad = FOCheckpoint({**fine.header, name: value}, fine.slots, fine.profile)
    with pytest.raises(ValueError):
        driver["temporal_comparison"](coarse, bad)


def test_json_no_overwrite_nonfinite_and_binary_binding(driver, tmp_path):
    path = tmp_path/"receipt.json"
    with pytest.raises(ValueError):
        driver["write_new_json"](path, {"bad": float("nan")})
    assert not path.exists()
    driver["write_new_json"](path, {"ok": True})
    before = path.read_bytes()
    with pytest.raises(FileExistsError):
        driver["write_new_json"](path, {})
    assert path.read_bytes() == before
    with pytest.raises(ValueError, match="verified"):
        driver["require_bound_binary"](path, {"passed": True})
