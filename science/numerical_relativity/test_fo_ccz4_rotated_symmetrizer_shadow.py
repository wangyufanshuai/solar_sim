from __future__ import annotations

import numpy as np
import pytest

from .ccz4_reference import GaugeConfig
from .fo_ccz4_rotated_symmetrizer_shadow import (
    rotated_fo_ccz4_numerical_symmetrizer_shadow_3d,
)


def test_rotated_frozen_symmetrizer_candidate_passes_at_oblique_normal() -> None:
    report = rotated_fo_ccz4_numerical_symmetrizer_shadow_3d(
        normal=(1.0, 2.0, 3.0),
    )

    assert report.numerical_candidate_validated
    assert report.source_axis_candidate_validated
    assert report.symmetrizer_min_eigenvalue > 0.0
    assert report.symmetrizer_condition_number <= 1.0e10
    assert report.rotation_covariance_residual_l_inf < 1.0e-8
    assert report.weighted_principal_symmetry_residual_l_inf < 1.0e-8
    assert np.max(np.abs(report.normal)) <= 1.0


def test_rotated_frozen_symmetrizer_replays_exactly() -> None:
    first = rotated_fo_ccz4_numerical_symmetrizer_shadow_3d(
        normal=(1.0, -2.0, 0.5),
    )
    second = rotated_fo_ccz4_numerical_symmetrizer_shadow_3d(
        normal=(1.0, -2.0, 0.5),
    )

    assert np.array_equal(first.symmetrizer, second.symmetrizer)
    assert np.array_equal(first.weighted_principal_matrix, second.weighted_principal_matrix)


def test_legacy_gamma_driver_fails_rotated_symmetrizer_gate() -> None:
    report = rotated_fo_ccz4_numerical_symmetrizer_shadow_3d(
        normal=(1.0, 2.0, 3.0),
        gauge=GaugeConfig(shift_coefficient=0.75, theta_coupling=2.0),
    )

    assert not report.numerical_candidate_validated
    assert not report.source_axis_candidate_validated
    assert report.symmetrizer_min_eigenvalue <= 0.0 or not np.isfinite(
        report.symmetrizer_condition_number
    )


@pytest.mark.parametrize("normal", ((0.0, 0.0, 0.0), (1.0, float("nan"), 0.0)))
def test_rotated_symmetrizer_rejects_invalid_normal(normal: tuple[float, float, float]) -> None:
    with pytest.raises(ValueError, match="normal"):
        rotated_fo_ccz4_numerical_symmetrizer_shadow_3d(normal=normal)
