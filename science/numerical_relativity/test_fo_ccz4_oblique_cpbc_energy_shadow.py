from __future__ import annotations

import pytest

from .ccz4_reference import GaugeConfig
from .fo_ccz4_oblique_cpbc_energy_shadow import (
    linearized_fo_ccz4_oblique_cpbc_energy_shadow_3d,
)


@pytest.mark.parametrize("orientation", ("right", "left"))
def test_oblique_full_cpbc_energy_candidate_passes_both_faces(
    orientation: str,
) -> None:
    report = linearized_fo_ccz4_oblique_cpbc_energy_shadow_3d(
        normal=(1.0, 2.0, 3.0),
        orientation=orientation,  # type: ignore[arg-type]
    )

    assert report.row_space_transport_validated
    assert report.numerical_symmetrizer_validated
    assert report.incoming_constraint_map_validated
    assert report.homogeneous_boundary_energy_validated
    assert report.incoming_mode_count == 16
    assert report.outgoing_mode_count == 16
    assert report.zero_mode_count == 26
    assert report.incoming_constraint_rank == 16
    assert report.homogeneous_boundary_flux_max_eigenvalue <= -0.49
    assert report.rotation_covariance_residual_l_inf < 1.0e-8


def test_oblique_full_cpbc_energy_candidate_replays_deterministically() -> None:
    first = linearized_fo_ccz4_oblique_cpbc_energy_shadow_3d(
        normal=(1.0, -2.0, 0.5), orientation="right"
    )
    second = linearized_fo_ccz4_oblique_cpbc_energy_shadow_3d(
        normal=(1.0, -2.0, 0.5), orientation="right"
    )

    assert first.incoming_constraint_map_sha256 == second.incoming_constraint_map_sha256
    assert first.incoming_constraint_map_residual_l_inf == second.incoming_constraint_map_residual_l_inf


def test_legacy_gamma_driver_fails_oblique_full_cpbc_energy_gate() -> None:
    report = linearized_fo_ccz4_oblique_cpbc_energy_shadow_3d(
        normal=(1.0, 2.0, 3.0),
        orientation="right",
        gauge=GaugeConfig(shift_coefficient=0.75, theta_coupling=2.0),
    )

    assert not report.numerical_symmetrizer_validated
    assert not report.homogeneous_boundary_energy_validated
    assert not report.cpbc_ready
