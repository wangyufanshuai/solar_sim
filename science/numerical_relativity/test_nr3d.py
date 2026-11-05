from __future__ import annotations

import numpy as np
import pytest

from .amr3d import advance_two_level_periodic_amr
from .constraints3d import constraint_report_3d

from .nr3d import (
    AMRHierarchy3D,
    BSSNState3D,
    Grid3D,
    Psi4SphereResult,
    adm_mass_extrapolated_from_state,
    adm_mass_from_state,
    adm_mass_from_isotropic_state,
    apparent_horizon_expansion_from_state,
    extract_psi4_from_weyl,
    extract_psi4_on_sphere,
    extract_psi4_mode_time_series,
    find_apparent_horizon_from_state,
    find_star_shaped_apparent_horizon_from_state,
    find_schwarzschild_apparent_horizon,
    outer_boundary_mask,
    project_psi4_mode,
    prolongate_periodic_state,
    prolongate_periodic_trilinear,
    restrict_periodic_full_weighting,
    restrict_periodic_state,
    restrict_periodic_volume_average,
    schwarzschild_3d_benchmark,
    schwarzschild_adm_mass,
    schwarzschild_weyl_psi4,
    weyl_electric_magnetic_from_state,
)


def test_3d_minkowski_state_uses_the_25_slot_contract() -> None:
    grid = Grid3D((7, 7, 7), (-2.0, -2.0, -2.0), (2.0, 2.0, 2.0))
    state = BSSNState3D.minkowski(grid)
    assert state.variable_names[0] == "chi"
    assert len(state.variable_names) == 25
    assert state.valid_cell_count == 7**3
    assert np.array_equal(state.chi, np.ones(grid.shape))


def test_schwarzschild_3d_state_masks_the_isotropic_throat() -> None:
    grid = Grid3D((9, 9, 9), (-2.0, -2.0, -2.0), (2.0, 2.0, 2.0))
    state = BSSNState3D.schwarzschild_isotropic(grid, mass_length=1.0)
    assert 0 < state.valid_cell_count < np.prod(grid.shape)
    assert np.all(state.chi[state.valid_mask] > 0.0)
    assert np.all(state.lapse[state.valid_mask] > 0.0)
    assert state.metadata["excision"].startswith("cells at r")


def test_schwarzschild_moving_puncture_seed_records_guard_band() -> None:
    grid = Grid3D((33, 33, 33), (-4.0, -4.0, -4.0), (4.0, 4.0, 4.0), boundary="excision")
    state = BSSNState3D.schwarzschild_isotropic(
        grid,
        mass_length=1.0,
        excision_radius=0.1,
        excision_buffer_cells=1,
        lapse_seed="psi-minus-two",
    )
    assert state.metadata["lapse_seed"] == "psi-minus-two"
    assert float(state.metadata["excision_radius"]) == pytest.approx(0.1)
    assert float(state.metadata["excision_guard_radius"]) == pytest.approx(0.35)
    assert state.metadata["excision_buffer_cells"] == "1"
    assert np.all(state.lapse[state.valid_mask] > 0.0)
    # With h=0.25 the guard is 0.35, so the isotropic horizon r=M/2 is
    # represented by valid cells and can be sampled by a later diagnostic.
    horizon_axis_index = (18, 16, 16)
    assert np.isclose(grid.coordinates[0][horizon_axis_index], 0.5)
    assert bool(state.valid_mask[horizon_axis_index])


def test_schwarzschild_exact_lapse_rejects_subthroat_guard() -> None:
    grid = Grid3D((17, 17, 17), (-2.0, -2.0, -2.0), (2.0, 2.0, 2.0), boundary="excision")
    with pytest.raises(ValueError, match="exact Schwarzschild lapse"):
        BSSNState3D.schwarzschild_isotropic(
            grid,
            mass_length=1.0,
            excision_radius=0.1,
            lapse_seed="schwarzschild",
        )


def test_brill_lindquist_two_puncture_data_is_time_symmetric_and_finite() -> None:
    grid = Grid3D((25, 25, 25), (-4.0, -4.0, -4.0), (4.0, 4.0, 4.0), boundary="excision")
    state = BSSNState3D.brill_lindquist_two_puncture(
        grid,
        masses=(1.0, 1.0),
        centers=((-0.75, 0.0, 0.0), (0.75, 0.0, 0.0)),
        excision_radius=0.3,
        excision_buffer_cells=2,
        formulation="ccz4",
    )
    report = constraint_report_3d(state)
    assert 0 < state.valid_cell_count < np.prod(grid.shape)
    assert state.metadata["initial_data"].startswith("time-symmetric-brill-lindquist")
    assert np.all(state.trace_k == 0.0)
    assert np.all(state.a == 0.0)
    assert report.norms["momentum_l_inf"] == 0.0
    assert np.isfinite(report.norms["hamiltonian_l2"])
    assert report.norms["hamiltonian_l2"] < 0.02


def test_amr_hierarchy_is_deterministic_and_nested() -> None:
    grid = Grid3D((5, 6, 7), (-1.0, -1.0, -1.0), (1.0, 1.0, 1.0))
    hierarchy = AMRHierarchy3D.from_grid(grid, levels=3, refinement_ratio=2)
    assert [level.level for level in hierarchy.levels] == [0, 1, 2]
    assert hierarchy.levels[1].shape == (9, 11, 13)
    assert hierarchy.levels[2].shape == (17, 21, 25)


def test_periodic_amr_hierarchy_uses_cell_centered_refinement_shapes() -> None:
    grid = Grid3D((5, 6, 7), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="periodic")
    hierarchy = AMRHierarchy3D.from_grid(grid, levels=3, refinement_ratio=2)
    assert hierarchy.levels[1].shape == (10, 12, 14)
    assert hierarchy.levels[2].shape == (20, 24, 28)


def test_amr_hierarchy_carries_the_selected_spatial_order() -> None:
    grid = Grid3D(
        (8, 8, 8),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
        spatial_order=4,
    )
    hierarchy = AMRHierarchy3D.from_grid(grid, levels=2, refinement_ratio=2)
    assert [level.spatial_order for level in hierarchy.levels] == [4, 4]


def test_outer_boundary_mask_is_explicitly_nonperiodic() -> None:
    grid = Grid3D((5, 6, 7), (-1.0, -1.0, -1.0), (1.0, 1.0, 1.0), boundary="sommerfeld")
    mask = outer_boundary_mask(grid)
    assert mask[0, :, :].all()
    assert mask[-1, :, :].all()
    assert mask[:, 0, :].all()
    assert mask[:, -1, :].all()
    assert mask[:, :, 0].all()
    assert mask[:, :, -1].all()
    assert not mask[2, 2, 2]


def test_periodic_amr_transfer_preserves_constants_and_components() -> None:
    coarse = np.zeros((4, 5, 6, 2), dtype=np.float64)
    coarse[..., 0] = 3.25
    coarse[..., 1] = -0.75
    fine = prolongate_periodic_trilinear(coarse, refinement_ratio=2)
    assert fine.shape == (8, 10, 12, 2)
    assert np.allclose(fine[..., 0], 3.25)
    assert np.allclose(fine[..., 1], -0.75)
    restricted = restrict_periodic_volume_average(fine, refinement_ratio=2)
    assert np.array_equal(restricted, coarse)


def test_periodic_amr_transfer_has_second_order_smooth_field_restriction() -> None:
    errors: list[float] = []
    for points in (8, 16, 32):
        grid = Grid3D(
            (points, points, points),
            (0.0, 0.0, 0.0),
            (1.0, 1.0, 1.0),
            boundary="periodic",
        )
        x, y, z = grid.coordinates
        coarse = np.sin(2.0 * np.pi * x) + 0.5 * np.cos(2.0 * np.pi * y) + 0.25 * np.sin(2.0 * np.pi * z)
        fine = prolongate_periodic_trilinear(coarse, refinement_ratio=2)
        restricted = restrict_periodic_volume_average(fine, refinement_ratio=2)
        errors.append(float(np.sqrt(np.mean((restricted - coarse) ** 2))))
    assert errors[0] / errors[1] > 3.0
    assert errors[1] / errors[2] > 3.0


def test_periodic_nodal_full_weighting_is_second_order() -> None:
    errors: list[float] = []
    for points in (8, 16, 32):
        coarse_grid = Grid3D(
            (points, points, points),
            (0.0, 0.0, 0.0),
            (1.0, 1.0, 1.0),
            boundary="periodic",
        )
        fine_grid = Grid3D(
            (2 * points, 2 * points, 2 * points),
            (0.0, 0.0, 0.0),
            (1.0, 1.0, 1.0),
            boundary="periodic",
        )
        coarse_x, coarse_y, coarse_z = coarse_grid.coordinates
        fine_x, fine_y, fine_z = fine_grid.coordinates
        coarse = (
            np.sin(2.0 * np.pi * coarse_x)
            + 0.5 * np.cos(2.0 * np.pi * coarse_y)
            + 0.25 * np.sin(2.0 * np.pi * coarse_z)
        )
        fine = (
            np.sin(2.0 * np.pi * fine_x)
            + 0.5 * np.cos(2.0 * np.pi * fine_y)
            + 0.25 * np.sin(2.0 * np.pi * fine_z)
        )
        restricted = restrict_periodic_full_weighting(fine, refinement_ratio=2)
        errors.append(float(np.sqrt(np.mean((restricted - coarse) ** 2))))
    assert errors[0] / errors[1] > 3.5
    assert errors[1] / errors[2] > 3.5


def test_gauge_wave_can_construct_a_requested_coordinate_time_slice() -> None:
    grid = Grid3D(
        (9, 9, 9),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
    )
    initial = BSSNState3D.gauge_wave(grid, amplitude=1.0e-3, time=0.0)
    shifted = BSSNState3D.gauge_wave(grid, amplitude=1.0e-3, time=0.125)
    assert initial.metadata["time"] == "0"
    assert shifted.metadata["time"] == "0.125"
    assert not np.array_equal(initial.chi, shifted.chi)


def test_periodic_amr_state_transfer_preserves_bssn_algebraic_constraints() -> None:
    grid = Grid3D(
        (8, 8, 8),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
        spatial_order=4,
    )
    state = BSSNState3D.minkowski(grid, formulation="ccz4")
    x, y, z = grid.coordinates
    phase = 2.0 * np.pi * (x + y + z)
    state.chi[:] = 1.0 + 1.0e-3 * np.sin(phase)
    state.h[..., 0, 0] = 1.0 + 1.0e-3 * np.cos(phase)
    state.h[..., 1, 1] = 1.0 - 5.0e-4 * np.cos(phase)
    state.a[..., 0, 0] = 1.0e-4 * np.sin(phase)
    state.a[..., 1, 1] = -1.0e-4 * np.sin(phase)
    state.trace_k[:] = 1.0e-4 * np.cos(phase)
    fine = prolongate_periodic_state(state, refinement_ratio=2)
    roundtrip = restrict_periodic_state(fine, refinement_ratio=2)
    fine_inverse = np.linalg.inv(fine.h)
    roundtrip_inverse = np.linalg.inv(roundtrip.h)
    fine_trace_a = np.einsum("...ij,...ij->...", fine_inverse, fine.a)
    roundtrip_trace_a = np.einsum("...ij,...ij->...", roundtrip_inverse, roundtrip.a)
    assert fine.grid.shape == (16, 16, 16)
    assert roundtrip.grid.shape == grid.shape
    assert np.max(np.abs(np.linalg.det(fine.h) - 1.0)) < 1.0e-12
    assert np.max(np.abs(np.linalg.det(roundtrip.h) - 1.0)) < 1.0e-12
    assert np.max(np.abs(fine_trace_a)) < 1.0e-12
    assert np.max(np.abs(roundtrip_trace_a)) < 1.0e-12
    assert fine.metadata["amr_transfer"].startswith("periodic-trilinear")
    assert roundtrip.metadata["amr_transfer"].startswith("periodic-volume")


@pytest.mark.parametrize("formulation", ["ccz4", "bssnok"])
def test_two_level_periodic_amr_subcycles_to_a_common_time_deterministically(
    formulation: str,
) -> None:
    grid = Grid3D(
        (5, 5, 5),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
    )
    state = BSSNState3D.minkowski(grid, formulation=formulation)  # type: ignore[arg-type]
    first = advance_two_level_periodic_amr(state, 1.0e-4, refinement_ratio=2)
    second = advance_two_level_periodic_amr(state, 1.0e-4, refinement_ratio=2)
    assert first.coarse_steps == 1
    assert first.fine_steps == 2
    assert first.fine_dt == 5.0e-5
    assert first.physical_time == 1.0e-4
    assert first.reflux_applied is False
    assert first.synchronization == "periodic-node-full-weighting-algebraic-projection"
    assert first.pre_sync_l2 == 0.0
    assert first.pre_sync_l_inf == 0.0
    assert first.state_sha256 == second.state_sha256
    assert np.array_equal(
        first.synchronized_coarse_state.chi,
        second.synchronized_coarse_state.chi,
    )
    assert first.synchronized_coarse_state.metadata["amr_reflux"] == "false"


def test_two_level_periodic_amr_reports_fine_coarse_mismatch_without_refluxing() -> None:
    grid = Grid3D(
        (5, 5, 5),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
    )
    state = BSSNState3D.gauge_wave(
        grid,
        amplitude=1.0e-3,
        wavelength=1.0,
        formulation="ccz4",
    )
    report = advance_two_level_periodic_amr(
        state,
        1.0e-5,
        coarse_steps=1,
        refinement_ratio=2,
    )
    assert report.pre_sync_l2 >= 0.0
    assert report.pre_sync_l_inf >= report.pre_sync_l2
    assert report.fine_state.grid.shape == (10, 10, 10)
    assert np.all(np.isfinite(report.fine_state.chi))
    assert np.max(np.abs(np.linalg.det(report.synchronized_coarse_state.h) - 1.0)) < 1.0e-12
    inverse = np.linalg.inv(report.synchronized_coarse_state.h)
    trace_a = np.einsum(
        "...ij,...ij->...",
        inverse,
        report.synchronized_coarse_state.a,
    )
    assert np.max(np.abs(trace_a)) < 1.0e-12


def test_two_level_amr_rejects_nonperiodic_or_invalid_refinement_contracts() -> None:
    nonperiodic = BSSNState3D.minkowski(
        Grid3D((5, 5, 5), (-1.0, -1.0, -1.0), (1.0, 1.0, 1.0), boundary="excision")
    )
    with pytest.raises(ValueError, match="fully valid periodic"):
        advance_two_level_periodic_amr(nonperiodic, 1.0e-4)
    periodic = BSSNState3D.minkowski(
        Grid3D((5, 5, 5), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="periodic")
    )
    with pytest.raises(ValueError, match="at least two"):
        advance_two_level_periodic_amr(periodic, 1.0e-4, refinement_ratio=1)


def test_schwarzschild_horizon_and_adm_mass_benchmarks() -> None:
    horizon = find_schwarzschild_apparent_horizon(1.0)
    adm = schwarzschild_adm_mass(1.0)
    assert horizon.passed is True
    assert abs(horizon.radius - 0.5) < 1.0e-12
    assert adm.passed is True
    assert abs(adm.mass - 1.0) < 1.0e-13


def test_state_coordinate_sphere_horizon_finder_recovers_flat_constant_trace_root() -> None:
    grid = Grid3D((33, 33, 33), (-2.0, -2.0, -2.0), (2.0, 2.0, 2.0), boundary="excision")
    state = BSSNState3D.minkowski(grid, formulation="ccz4")
    state.trace_k[:] = 3.0
    left = apparent_horizon_expansion_from_state(
        state, 0.75, theta_samples=12, phi_samples=24
    )
    right = apparent_horizon_expansion_from_state(
        state, 1.25, theta_samples=12, phi_samples=24
    )
    result = find_apparent_horizon_from_state(
        state,
        (0.75, 1.25),
        theta_samples=12,
        phi_samples=24,
        tolerance=1.0e-10,
        angular_tolerance=1.0e-2,
    )
    assert left.expansion > 0.0 > right.expansion
    assert result.passed is True
    assert abs(result.radius - 1.0) < 1.0e-3
    assert result.angular_std < 1.0e-2


def test_star_shaped_horizon_solver_recovers_flat_constant_trace_surface() -> None:
    grid = Grid3D((33, 33, 33), (-2.0, -2.0, -2.0), (2.0, 2.0, 2.0), boundary="excision")
    state = BSSNState3D.minkowski(grid, formulation="ccz4")
    state.trace_k[:] = 3.0
    theta = np.pi * (np.arange(4, dtype=np.float64) + 0.5) / 4.0
    phi = 2.0 * np.pi * np.arange(8, dtype=np.float64) / 8.0
    initial_radius = 0.8 * (
        1.0 + 0.05 * np.sin(theta)[:, None] * np.cos(phi)[None, :]
    )
    result = find_star_shaped_apparent_horizon_from_state(
        state,
        initial_radius,
        theta_samples=4,
        phi_samples=8,
        iterations=12,
        tolerance=1.0e-6,
        angular_tolerance=1.0e-6,
    )
    assert result.passed is True
    assert result.method == "state-star-shaped-apparent-horizon-damped-newton"
    assert abs(result.mean_expansion) < 1.0e-6
    assert result.expansion_l2 < 1.0e-6
    assert result.angular_std < 1.0e-6
    assert np.max(np.abs(result.radii - 1.0)) < 5.0e-4


def test_star_shaped_horizon_solver_rejects_periodic_grid_and_dense_overflow() -> None:
    periodic = BSSNState3D.minkowski(
        Grid3D((9, 9, 9), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="periodic")
    )
    with pytest.raises(ValueError, match="non-periodic"):
        find_star_shaped_apparent_horizon_from_state(periodic, 0.5)
    nonperiodic = BSSNState3D.minkowski(
        Grid3D((9, 9, 9), (-1.0, -1.0, -1.0), (1.0, 1.0, 1.0), boundary="excision")
    )
    with pytest.raises(ValueError, match="max_surface_unknowns"):
        find_star_shaped_apparent_horizon_from_state(
            nonperiodic,
            0.5,
            theta_samples=8,
            phi_samples=16,
            max_surface_unknowns=32,
        )


def test_state_backed_isotropic_adm_surface_integral_converges() -> None:
    errors: list[float] = []
    for points in (33, 65):
        grid = Grid3D(
            (points, points, points),
            (-4.0, -4.0, -4.0),
            (4.0, 4.0, 4.0),
            boundary="excision",
        )
        state = BSSNState3D.schwarzschild_isotropic(grid, mass_length=1.0)
        result = adm_mass_from_isotropic_state(
            state,
            2.0,
            theta_samples=12,
            phi_samples=24,
            tolerance=0.1,
        )
        errors.append(abs(result.mass - 1.0))
        assert result.passed is True
    assert errors[0] / errors[1] > 2.0


def test_full_physical_metric_adm_surface_integral_converges_for_schwarzschild() -> None:
    errors: list[float] = []
    finite_radius_expected = (1.0 + 0.5 / 2.0) ** 3
    for points in (33, 65):
        grid = Grid3D(
            (points, points, points),
            (-4.0, -4.0, -4.0),
            (4.0, 4.0, 4.0),
            boundary="excision",
        )
        state = BSSNState3D.schwarzschild_isotropic(grid, mass_length=1.0)
        result = adm_mass_from_state(
            state,
            2.0,
            theta_samples=12,
            phi_samples=24,
        )
        assert result.method == "full-physical-metric-surface-integral"
        assert result.passed is True
        errors.append(abs(result.mass - finite_radius_expected))
    assert errors[0] / errors[1] > 2.0


def test_full_physical_metric_adm_extrapolation_recovers_schwarzschild_mass() -> None:
    grid = Grid3D((65, 65, 65), (-6.0, -6.0, -6.0), (6.0, 6.0, 6.0), boundary="excision")
    state = BSSNState3D.schwarzschild_isotropic(grid, mass_length=1.0)
    result = adm_mass_extrapolated_from_state(
        state,
        (2.0, 3.0, 4.0),
        theta_samples=12,
        phi_samples=24,
        tolerance=0.1,
    )
    assert result.method == "full-physical-metric-asymptotic-extrapolation"
    assert result.passed is True
    assert abs(result.mass - 1.0) < 0.1


def test_static_schwarzschild_has_zero_radiative_psi4() -> None:
    result = schwarzschild_weyl_psi4(1.0, extraction_radius=20.0)
    assert abs(result.value) < 1.0e-15
    electric = np.diag((-2.0, 1.0, 1.0))
    magnetic = np.zeros((3, 3))
    projected = extract_psi4_from_weyl(electric, magnetic)
    assert abs(projected.value) < 1.0e-15


def test_state_weyl_reconstruction_has_zero_magnetic_part_on_static_slice() -> None:
    grid = Grid3D((25, 25, 25), (-4.0, -4.0, -4.0), (4.0, 4.0, 4.0), boundary="excision")
    state = BSSNState3D.schwarzschild_isotropic(grid, mass_length=1.0)
    weyl = weyl_electric_magnetic_from_state(state)
    valid = state.valid_mask
    assert np.max(np.abs(weyl.magnetic[valid])) < 1.0e-12
    assert np.all(np.isfinite(weyl.electric[valid]))


def test_state_weyl_reconstruction_resolves_nonzero_tracefree_electric_curvature() -> None:
    grid = Grid3D((33, 33, 33), (-4.0, -4.0, -4.0), (4.0, 4.0, 4.0), boundary="excision")
    state = BSSNState3D.schwarzschild_isotropic(grid, mass_length=1.0)
    weyl = weyl_electric_magnetic_from_state(state)
    inverse = np.linalg.inv(state.h)
    trace = np.einsum("...ij,...ij->...", inverse, weyl.electric)
    x, y, z = grid.coordinates
    radius = np.sqrt(x * x + y * y + z * z)
    shell = state.valid_mask & (radius > 1.5) & (radius < 3.0)
    assert np.max(np.abs(weyl.electric[shell])) > 1.0e-3
    assert np.max(np.abs(trace[shell])) < 1.0e-11
    assert np.max(np.abs(weyl.electric[shell] - np.swapaxes(weyl.electric[shell], -1, -2))) < 1.0e-12


def test_static_schwarzschild_psi4_sphere_residual_refines_downward() -> None:
    residuals: list[float] = []
    for points in (17, 25, 33):
        grid = Grid3D((points, points, points), (-4.0, -4.0, -4.0), (4.0, 4.0, 4.0), boundary="excision")
        state = BSSNState3D.schwarzschild_isotropic(grid, mass_length=1.0)
        result = extract_psi4_on_sphere(state, 2.0, theta_samples=8, phi_samples=16)
        residuals.append(float(np.max(np.abs(result.values))))
    assert residuals[0] > residuals[1] > residuals[2]
    assert residuals[0] / residuals[1] > 1.5
    assert residuals[1] / residuals[2] > 1.3


def test_spin_minus_two_ell2_mode_projector_is_orthonormal_for_reference_basis() -> None:
    theta_samples, phi_samples = 12, 24
    cosine, _ = np.polynomial.legendre.leggauss(theta_samples)
    basis_m0 = np.sqrt(15.0 / (32.0 * np.pi)) * (1.0 - cosine[:, None] ** 2) * np.ones(
        (1, phi_samples), dtype=np.complex128
    )
    sphere = Psi4SphereResult(2.0, basis_m0, "synthetic-spin-minus-two-basis", True)
    recovered = project_psi4_mode(sphere, 2, 0)
    leakage = project_psi4_mode(sphere, 2, 2)
    assert abs(recovered.value - 1.0) < 1.0e-12
    assert abs(leakage.value) < 1.0e-12


def test_state_psi4_sphere_is_roundoff_bounded_for_minkowski() -> None:
    grid = Grid3D((17, 17, 17), (-3.0, -3.0, -3.0), (3.0, 3.0, 3.0), boundary="excision")
    state = BSSNState3D.minkowski(grid, formulation="ccz4")
    result = extract_psi4_on_sphere(state, 1.0, theta_samples=8, phi_samples=16)
    assert result.method == "state-weyl-null-tetrad-sphere"
    assert result.radiative_input_required is False
    assert np.array_equal(result.values, np.zeros_like(result.values))


def test_psi4_mode_time_series_has_ordered_retarded_time_and_deterministic_zero() -> None:
    grid = Grid3D(
        (9, 9, 9),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
    )
    states = (
        BSSNState3D.minkowski(grid, formulation="ccz4"),
        BSSNState3D.minkowski(grid, formulation="ccz4"),
    )
    result = extract_psi4_mode_time_series(
        states,
        (0.0, 0.25),
        0.2,
        ell=2,
        m=0,
        center=(0.5, 0.5, 0.5),
        theta_samples=8,
        phi_samples=16,
    )
    assert result.method.endswith("mode-time-series")
    assert np.array_equal(result.times, np.asarray((0.0, 0.25)))
    assert np.allclose(result.retarded_times, np.asarray((-0.2, 0.05)))
    assert np.array_equal(result.values, np.zeros(2, dtype=np.complex128))
    assert result.radiative_input_required is False


def test_k3a_benchmark_remains_blocked_for_dynamic_promotion() -> None:
    summary = schwarzschild_3d_benchmark(1.0)
    assert summary["promotion"] == "blocked-pending-k3-dynamic-rhs-amr"
