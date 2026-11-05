"""Synthetic arithmetic/coverage tests, not physical NR validation."""
import copy

import numpy as np
import pytest

from . import exterior_error_localization as L


def test_original_face_partition_is_balanced_exhaustive_and_disjoint():
    masks = L.region_masks()
    assert {k: int(v.sum()) for k, v in masks.items()} == {
        "lower_nearer": 44, "equidistant": 37, "upper_nearer": 44}
    np.testing.assert_array_equal(sum(m.astype(int) for m in masks.values()), np.ones((5, 5, 5)))
    assert masks["lower_nearer"][0, 0, 0]
    assert masks["upper_nearer"][-1, -1, -1]
    assert masks["equidistant"][0, 2, 4]


def test_signed_regional_cancellation_and_square_shares_are_exact():
    masks = L.region_masks()
    initial = np.ones((5, 5, 5))
    total = initial.copy()
    total[masks["lower_nearer"]] = .5
    total[masks["upper_nearer"]] = 1.25
    before = total.copy(), initial.copy()
    result = L.localize_error(total, initial)
    low, same, high = (result["regions"][k] for k in L.REGIONS)
    assert low["cross_mean"] == -1.
    assert low["negative_cross_magnitude"] == 1.
    assert low["alignment_cosine"] == -1.
    assert high["cross_mean"] == .5
    assert high["alignment_cosine"] == 1.
    assert same["evolution_rms"] == 0.
    assert same["alignment_cosine"] is None
    assert low["evolution_square_share"] == pytest.approx(.8)
    assert high["evolution_square_share"] == pytest.approx(.2)
    for actual, expected in zip((total, initial), before, strict=True):
        np.testing.assert_array_equal(actual, expected)
    assert result["whole"]["scalar_reference_checked"] is True
    assert result["physical_energy_or_flux"] is result["new_acceptance_gate"] is False


def test_zero_change_does_not_claim_a_measured_share_or_angle():
    result = L.localize_error(np.zeros((5, 5, 5, 3, 3)), np.zeros((5, 5, 5, 3, 3)))
    assert result["whole"]["component_count"] == 9
    for value in result["regions"].values():
        assert value["evolution_square_share"] is None
        assert value["alignment_cosine"] is None


def test_each_axis_has_five_equal_planes_reconstructing_all_squared_terms():
    xyz = np.indices((5, 5, 5)).astype(float)
    initial = np.stack((xyz[0], xyz[1]-2., xyz[2]+1.), axis=-1)
    total = initial+np.stack((xyz[2]/16., -xyz[0]/8., xyz[1]/4.), axis=-1)
    result = L.localize_error(total, initial)
    assert len(result["planes"]) == 15
    for axis in range(3):
        rows = [p for p in result["planes"] if p["axis"] == axis]
        assert [p["coordinate"] for p in rows] == list(L.CORE)
        assert all(p["node_count"] == 25 for p in rows)
        for key in ("total_mean_square", "initial_mean_square", "evolution_mean_square", "cross_mean"):
            assert sum(p[key] for p in rows)/5. == pytest.approx(result["whole"][key], rel=1.e-14)


def test_tensor_component_and_coordinate_permutations_preserve_whole_and_region_norms():
    rng = np.random.default_rng(431)
    initial = rng.normal(size=(5, 5, 5, 3, 3))
    total = initial+.1*rng.normal(size=initial.shape)
    first = L.localize_error(total, initial)
    second = L.localize_error(total.transpose(2, 1, 0, 4, 3), initial.transpose(2, 1, 0, 4, 3))
    for name in L.REGIONS:
        assert first["regions"][name]["total_rms"] == pytest.approx(second["regions"][name]["total_rms"])
        assert first["regions"][name]["cross_mean"] == pytest.approx(second["regions"][name]["cross_mean"])


@pytest.mark.parametrize("kind", ["shape", "components", "empty", "nan", "inf", "complex", "overflow"])
def test_invalid_or_unrepresentable_fields_are_rejected(kind):
    a = np.zeros((5, 5, 5))
    b = a.copy()
    if kind == "shape":
        a = np.zeros((4, 5, 5))
    elif kind == "components":
        b = np.zeros((5, 5, 5, 2))
    elif kind == "empty":
        a = b = np.empty((5, 5, 5, 0))
    elif kind == "complex":
        a = a.astype(complex)+1j
    else:
        a[0, 0, 0] = {"nan": float("nan"), "inf": float("inf"), "overflow": 1.e200}[kind]
    with pytest.raises(ValueError):
        L.localize_error(a, b)


def test_independent_scalar_reducer_disagreement_is_not_ignored(monkeypatch):
    original = L._scalar_reference

    def incorrect(a, b):
        result = copy.deepcopy(original(a, b))
        result["cross_mean"] += 1.
        return result

    monkeypatch.setattr(L, "_scalar_reference", incorrect)
    with pytest.raises(ValueError, match="scalar reduction mismatch"):
        L.localize_error(np.ones((5, 5, 5)), np.zeros((5, 5, 5)))
