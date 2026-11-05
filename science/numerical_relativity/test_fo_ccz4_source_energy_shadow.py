from __future__ import annotations

import numpy as np
from scipy.linalg import expm

from .fo_ccz4_source_energy_shadow import (
    FOCCZ4SourceEnergyShadow3D,
    linearized_fo_ccz4_source_energy_shadow_3d,
)


def test_full_58_source_decomposition_and_energy_bound_close_on_all_normals() -> None:
    reports = [
        linearized_fo_ccz4_source_energy_shadow_3d(normal_axis=axis)
        for axis in (0, 1, 2)
    ]

    assert all(isinstance(report, FOCCZ4SourceEnergyShadow3D) for report in reports)
    assert all(report.variable_count == 58 for report in reports)
    assert all(report.source_matrix.shape == (58, 58) for report in reports)
    assert all(report.full_generator_decomposition_residual_l_inf < 1.0e-12 for report in reports)
    assert all(report.weighted_principal_symmetry_residual_l_inf < 1.0e-8 for report in reports)
    assert all(report.numerical_symmetrizer_candidate_validated for report in reports)
    assert all(report.source_energy_bound_validated for report in reports)
    assert all(report.source_energy_operator_min_eigenvalue <= 0.0 for report in reports)
    assert all(report.source_energy_operator_max_eigenvalue > 0.0 for report in reports)
    assert all(report.analytic_symmetrizer_validated is False for report in reports)
    assert all(report.nonlinear_source_validated is False for report in reports)
    assert all(report.cpbc_ready is False for report in reports)
    assert all(report.runtime_writeback is False for report in reports)


def test_frozen_fourier_generator_obeys_recorded_finite_time_energy_bound() -> None:
    report = linearized_fo_ccz4_source_energy_shadow_3d(normal_axis=1)
    rng = np.random.default_rng(20261006)
    state = rng.normal(size=58) + 1j * rng.normal(size=58)
    initial_energy = float(np.real(np.vdot(state, report.symmetrizer @ state)))

    for time in (0.01, 0.05, 0.1):
        evolved = expm(report.full_generator * time) @ state
        energy = float(np.real(np.vdot(evolved, report.symmetrizer @ evolved)))
        bound = initial_energy * np.exp(
            2.0 * report.source_energy_log_norm * time
        )
        assert energy <= bound * (1.0 + 1.0e-9)


def test_source_energy_audit_is_deterministic() -> None:
    first = linearized_fo_ccz4_source_energy_shadow_3d(normal_axis=2)
    second = linearized_fo_ccz4_source_energy_shadow_3d(normal_axis=2)

    assert first.source_matrix_sha256 == second.source_matrix_sha256
    assert first.source_energy_log_norm == second.source_energy_log_norm
    assert np.array_equal(first.source_matrix, second.source_matrix)
