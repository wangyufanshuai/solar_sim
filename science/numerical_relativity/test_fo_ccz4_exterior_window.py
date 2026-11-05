from dataclasses import replace

import numpy as np
import pytest

from .fo_ccz4_checkpoint import checkpoint_from_state
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_schwarzschild import SchwarzschildDomain, initial_state
from .fo_ccz4_exterior_window import (
    CORE, LINE, METRICS, indices, diagnostics, boundary_location_difference, timestep_difference,
)


def seed(n=17, domain=SchwarzschildDomain(), dt=1./256):
    return checkpoint_from_state(initial_state(n, 4, domain), profile=FOCCZ4GaugeProfile(),
        dt=dt, scenario=2, amplitude=0., tau_inverse=1., domain=domain)


@pytest.mark.parametrize("n", [17, 25, 33])
def test_common_nodes_are_same_physical_positions(n):
    grid = SchwarzschildDomain().grid(n, 4)
    for values in (CORE, LINE):
        np.testing.assert_array_equal(grid.coordinates[0][indices(grid, values), 0, 0], values)


@pytest.mark.parametrize("values", [(1.1,), (0.,), (3.1,), (float("nan"),)])
def test_no_hidden_interpolation_or_extrapolation(values):
    with pytest.raises(ValueError):
        indices(SchwarzschildDomain().grid(17, 4), values)


def test_boxes_share_initial_fields_at_equal_spacing():
    base = seed()
    expanded = seed(25, SchwarzschildDomain(.5, 3.5))
    np.testing.assert_array_equal(base.slots, np.asarray(expanded.slots)[:, 4:21, 4:21, 4:21])
    result = boundary_location_difference(base, expanded)
    # Different one-sided diagnostic closures cannot enter this shared interior.
    assert result["metrics"]["state"]["rms_difference"] == 0.
    assert result["metrics"]["H"]["rms_difference"] < 1.e-13


def test_diagnostics_cover_auxiliary_drift_and_keep_halo_separate():
    data = seed()
    data.slots[25][8, 8, 8] += .001
    result = diagnostics(data)
    assert set(result["core"]) == set(METRICS)
    assert result["halo_error_linf"] < 2.e-14
    assert result["core"]["A"]["linf"] > .0009
    assert len(result["line_rms_by_component"]["A"]) == len(LINE)
    assert result["core_points"] == 125 and result["physical_validation"] is False


@pytest.mark.parametrize("change", ["dt", "time", "order", "profile", "spacing"])
def test_invalid_boundary_pair_rejected(change):
    left, right = seed(), seed(25, SchwarzschildDomain(.5, 3.5))
    if change in ("dt", "time"):
        right = replace(right, header={**right.header, change: right.header[change]+.001})
    elif change == "order":
        right = replace(right, header={**right.header, "spatial_order": 2})
    elif change == "profile":
        right = replace(right, profile=None)
    else:
        right = seed(33)
    with pytest.raises(ValueError):
        boundary_location_difference(left, right)


def test_time_comparison_rejects_equal_dt_and_detects_signed_field_change():
    left, right = seed(), seed(dt=1./512)
    assert timestep_difference(left, right)["passed"]
    right.slots[17][8, 8, 8] += .01
    assert not timestep_difference(left, right)["passed"]
    with pytest.raises(ValueError, match="matched timestep"):
        timestep_difference(left, left)
