from __future__ import annotations

import math

from .fo_ccz4_full_cpbc_energy_shadow import (
    FOCCZ4FullCPBCEnergyShadow3D,
    linearized_fo_ccz4_full_cpbc_energy_shadow_3d,
)


def _reports() -> list[FOCCZ4FullCPBCEnergyShadow3D]:
    return [
        linearized_fo_ccz4_full_cpbc_energy_shadow_3d(
            normal_axis=axis,
            orientation=orientation,
        )
        for axis in (0, 1, 2)
        for orientation in ("right", "left")
    ]


def test_full_58_variable_cpbc_energy_shadow_closes_on_both_faces() -> None:
    reports = _reports()

    assert all(report.variable_count == 58 for report in reports)
    assert all(report.constraint_count == 73 for report in reports)
    assert all(
        (report.incoming_mode_count, report.outgoing_mode_count, report.zero_mode_count)
        == (16, 16, 26)
        for report in reports
    )
    assert all(report.characteristic_basis_rank == 58 for report in reports)
    assert all(report.incoming_constraint_rank == 16 for report in reports)
    assert all(report.deterministic for report in reports)
    assert all(report.characteristic_basis_residual_l_inf < 1.0e-8 for report in reports)
    assert all(report.principal_weighted_symmetry_residual_l_inf < 1.0e-8 for report in reports)
    assert all(report.incoming_constraint_map_residual_l_inf < 1.0e-8 for report in reports)
    assert all(report.full_generator_decomposition_residual_l_inf < 1.0e-12 for report in reports)
    assert all(report.direct_symbol_crosscheck_error_l_inf < 1.0e-8 for report in reports)
    assert all(math.isfinite(report.source_energy_log_norm) for report in reports)
    assert all(report.homogeneous_boundary_flux_max_eigenvalue <= 1.0e-8 for report in reports)


def test_full_cpbc_candidate_flags_stop_at_frozen_numerical_boundary() -> None:
    reports = _reports()

    assert all(report.numerical_symmetrizer_validated for report in reports)
    assert all(report.incoming_constraint_map_validated for report in reports)
    assert all(report.homogeneous_boundary_energy_validated for report in reports)
    assert all(report.analytic_symmetrizer_validated is False for report in reports)
    assert all(report.nonlinear_cpbc_validated is False for report in reports)
    assert all(report.physical_boundary_validated is False for report in reports)
    assert all(report.cpbc_ready is False for report in reports)
    assert all(report.runtime_writeback is False for report in reports)


def test_full_cpbc_shadow_replay_is_deterministic() -> None:
    first = linearized_fo_ccz4_full_cpbc_energy_shadow_3d(
        normal_axis=2,
        orientation="left",
    )
    second = linearized_fo_ccz4_full_cpbc_energy_shadow_3d(
        normal_axis=2,
        orientation="left",
    )

    assert first.incoming_constraint_map_sha256 == second.incoming_constraint_map_sha256
    assert first.source_energy_log_norm == second.source_energy_log_norm
    assert first.homogeneous_boundary_flux_max_eigenvalue == second.homogeneous_boundary_flux_max_eigenvalue

