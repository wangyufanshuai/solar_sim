"""Synthetic layout/arithmetic tests, not Schwarzschild physical validation."""
import numpy as np
import pytest

from . import schwarzschild_rhs_locality as L
from .fo_ccz4_schwarzschild import SchwarzschildDomain


@pytest.mark.parametrize("n", [9, 17, 25, 33])
def test_partition_is_exhaustive_and_core_has_125_active_nodes(n):
    masks = L.partitions(n)
    np.testing.assert_array_equal(sum(v.astype(int) for v in masks.values()), np.ones((n,)*3))
    assert masks["active"].sum() == (n-4)**3
    assert L.core_mask(n).sum() == 125
    assert np.all(masks["active"][L.core_mask(n)])


@pytest.mark.parametrize("bounds,n", [((1., 3.), 17), ((1., 3.5), 21), ((.5, 3.5), 25)])
def test_common_cube_recovers_coordinate_fields_without_mutation(bounds, n):
    grid = SchwarzschildDomain(*bounds).grid(n, 4)
    xyz = grid.coordinates
    value = np.broadcast_to(xyz[0]+2*xyz[1]+3*xyz[2], (58, *grid.shape)).copy()
    digest = value.tobytes()
    actual = L.common_cube(value, grid, 17)
    small = SchwarzschildDomain().grid(17, 4).coordinates
    np.testing.assert_array_equal(actual[0], small[0]+2*small[1]+3*small[2])
    assert value.tobytes() == digest
    actual[:] = 0.
    assert value.tobytes() == digest


@pytest.mark.parametrize("bounds,n,expected", [((1., 3.), 17, (61, 61, 98)),
    ((1., 3.5), 21, (61, 0, 61)), ((.5, 3.5), 25, (0, 0, 0)),
    ((1., 3.), 25, (0, 0, 0)), ((1., 3.), 33, (0, 0, 0))])
def test_support_envelope_distinguishes_rhs_and_composed_diagnostics(bounds, n, expected):
    first, second = L.support_envelopes(SchwarzschildDomain(*bounds).grid(n, 4))
    assert first["either_halo_reach_nodes"] == 0
    assert tuple(second[k] for k in ("lower_halo_reach_nodes", "upper_halo_reach_nodes", "either_halo_reach_nodes")) == expected
    assert first["causal_domain_of_dependence"] is second["causal_domain_of_dependence"] is False


def test_signed_difference_stays_in_prescribed_partition_and_has_all_slots():
    a = np.zeros((58, 9, 9, 9))
    mask = L.partitions(9)["lower_only"]
    a[17, mask] = -3.
    result = L.compare(a, np.zeros_like(a))
    assert result["lower_only"]["max_abs_difference"] == 3.
    assert result["lower_only"]["difference"][17]["minimum"] == -3.
    for name in ("active", "upper_only", "mixed_lower_upper", "core"):
        assert result[name]["max_abs_difference"] == 0.
        assert result[name]["bytes_equal"]
    assert all(len(r["difference"]) == 58 for r in result.values())


def test_scaled_norm_does_not_overflow_finite_large_components():
    a = np.full((58, 9, 9, 9), 1.e250)
    result = L.slot_norms(a, L.core_mask(9))
    assert all(r["l2"] == 1.e250 for r in result)


@pytest.mark.parametrize("defect", ["shape", "nan", "inf", "complex", "slots"])
def test_invalid_components_are_rejected(defect):
    a = np.zeros((58, 9, 9, 9))
    if defect == "shape":
        a = a[:, :8]
    elif defect == "slots":
        a = a[:57]
    elif defect == "complex":
        a = a.astype(complex)+1j
    else:
        a[0, 0, 0, 0] = float(defect)
    with pytest.raises(ValueError):
        L.fields(a)


@pytest.mark.parametrize("n", [True, 8, 10, 17., None, "17", float("nan"), 17+0j])
def test_invalid_or_unaligned_core_is_rejected(n):
    with pytest.raises(ValueError):
        L.core_mask(n)


def test_common_cube_rejects_different_spacing_or_boundary():
    grid = SchwarzschildDomain().grid(17, 4)
    with pytest.raises(ValueError, match="matched FD4"):
        L.common_cube(np.zeros((58, 17, 17, 17)), grid, 25)
    with pytest.raises(ValueError, match="matched FD4"):
        L.common_cube(np.zeros((58, 17, 17, 17)), SchwarzschildDomain().grid(17, 2), 17)


@pytest.mark.parametrize("kind", ["empty", "wrong_shape", "not_boolean"])
def test_bad_norm_masks_are_rejected(kind):
    mask = np.zeros((9,)*3, dtype=bool)
    if kind == "wrong_shape":
        mask = np.ones((8,)*3, dtype=bool)
    elif kind == "not_boolean":
        mask = np.ones((9,)*3, dtype=int)
    with pytest.raises(ValueError):
        L.slot_norms(np.zeros((58, 9, 9, 9)), mask)
