from __future__ import annotations

import numpy as np
import pytest
from scipy.linalg import expm

from .fo_ccz4_subsidiary_cpbc_shadow import (
    linearized_z4c_subsidiary_cpbc_shadow_3d,
)


def test_homogeneous_right_boundary_is_energy_dissipative() -> None:
    report = linearized_z4c_subsidiary_cpbc_shadow_3d(
        normal_axis=0,
        orientation="right",
    )

    assert report.characteristic_basis_rank == 10
    assert report.incoming_mode_count == 4
    assert report.outgoing_mode_count == 4
    assert report.zero_mode_count == 2
    assert report.boundary_energy_rate_max_eigenvalue <= 1.0e-12
    assert report.source_energy_log_norm == pytest.approx(0.5)
    assert report.source_growth_bound_validated
    assert report.homogeneous_maximally_dissipative_validated
    assert report.cpbc_ready is False


def test_reflected_map_is_checked_in_the_energy_norm_on_left_face() -> None:
    report = linearized_z4c_subsidiary_cpbc_shadow_3d(
        normal_axis=2,
        orientation="left",
        reflection_coefficient=0.5,
    )

    assert report.boundary_map_rank == 4
    assert report.boundary_map_residual_l_inf <= 1.0e-12
    assert report.boundary_energy_rate_max_eigenvalue < 0.0
    assert report.homogeneous_maximally_dissipative_validated


def test_subsonic_shift_moves_zero_speed_compatibility_fields_without_breaking_zero_map() -> None:
    report = linearized_z4c_subsidiary_cpbc_shadow_3d(
        normal_axis=1,
        shift_normal=0.25,
        orientation="right",
    )

    assert report.incoming_mode_count == 6
    assert report.outgoing_mode_count == 4
    assert report.zero_mode_count == 0
    assert report.boundary_map_rank == 0
    assert report.boundary_energy_rate_max_eigenvalue <= 1.0e-12


def test_nonzero_reflection_requires_matching_characteristic_counts() -> None:
    with pytest.raises(ValueError, match="equal incoming/outgoing counts"):
        linearized_z4c_subsidiary_cpbc_shadow_3d(
            shift_normal=0.25,
            reflection_coefficient=0.5,
        )


def test_receipt_characteristic_speeds_are_real_and_deterministic() -> None:
    first = linearized_z4c_subsidiary_cpbc_shadow_3d()
    second = linearized_z4c_subsidiary_cpbc_shadow_3d()

    assert np.all(np.isfinite(first.characteristic_speeds))
    assert first.boundary_map_sha256 == second.boundary_map_sha256
    assert first.characteristic_speeds == second.characteristic_speeds


@pytest.mark.parametrize("orientation", ["left", "right"])
@pytest.mark.parametrize("shift", [-2.0, 2.0])
def test_pure_inflow_and_pure_outflow_have_well_defined_empty_maps(orientation, shift):
    report = linearized_z4c_subsidiary_cpbc_shadow_3d(
        orientation=orientation, shift_normal=shift,
    )
    assert report.incoming_mode_count + report.outgoing_mode_count == 10
    assert min(report.incoming_mode_count, report.outgoing_mode_count) == 0
    assert report.homogeneous_maximally_dissipative_validated


def test_amplifying_reflection_fails_energy_gate():
    report = linearized_z4c_subsidiary_cpbc_shadow_3d(reflection_coefficient=1.1)
    assert report.boundary_energy_rate_max_eigenvalue > 0.0
    assert not report.homogeneous_maximally_dissipative_validated


def test_source_terms_obey_the_recorded_finite_time_energy_bound() -> None:
    report = linearized_z4c_subsidiary_cpbc_shadow_3d(
        normal_axis=0,
        effective_wave_number=1.25,
    )
    weights = np.ones(10)
    weights[3] = 4.0
    h = np.diag(weights)
    rng = np.random.default_rng(20261006)
    state = rng.normal(size=10) + 1j * rng.normal(size=10)
    # The public report intentionally omits matrices; reconstruct the source
    # and principal contract through the canonical shadow function instead.
    from .fo_ccz4_subsidiary_shadow import linearized_z4c_subsidiary_shadow_3d

    subsidiary = linearized_z4c_subsidiary_shadow_3d(
        normal_axis=0,
        effective_wave_number=1.25,
    )
    generator = 1j * 1.25 * subsidiary.principal_matrix + subsidiary.source_matrix
    initial_energy = float(np.real(np.vdot(state, h @ state)))
    for time in (0.1, 0.5, 1.0):
        evolved = expm(generator * time) @ state
        energy = float(np.real(np.vdot(evolved, h @ evolved)))
        assert energy <= initial_energy * np.exp(
            2.0 * report.source_energy_log_norm * time
        ) * (1.0 + 1.0e-10)
