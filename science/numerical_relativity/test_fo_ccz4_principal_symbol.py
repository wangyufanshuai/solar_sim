from __future__ import annotations

import numpy as np
import pytest

from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER
from .fo_ccz4_principal_symbol import (
    linearized_fo_ccz4_principal_symbol_3d,
    published_fo_ccz4_speed_family_contract,
)
from .ccz4_reference import GaugeConfig
from .fo_ccz4_rhs import FOCCZ4Config


def test_fo_ccz4_principal_symbol_has_the_full_contract() -> None:
    report = linearized_fo_ccz4_principal_symbol_3d(points=8)
    assert report.variable_count == len(FOCCZ4_VARIABLE_ORDER) == 58
    assert report.ode_variable_count == 11
    assert report.pde_variable_count == 47
    assert report.eigenvector_rank == 58
    # The raw contracted-Gamma variable is not itself a vanishing constraint;
    # removing those three false rows leaves the metric/order/algebraic map at
    # rank 36.  Z4 connection reconstruction is audited separately.
    assert report.constraint_map_rank == 36
    assert report.strong_hyperbolicity_validated is False
    assert report.constraint_preserving_validated is False
    assert report.physical_boundary_validated is False


def test_fo_ccz4_full_symbol_audit_uses_normalized_fourier_projection() -> None:
    """The full coupled symbol must not contain a projection-induced defect."""

    report = linearized_fo_ccz4_principal_symbol_3d(points=8)
    assert report.full_symbol_eigenvector_rank == report.variable_count
    assert report.full_symbol_defect == 0
    assert report.full_symbol_nullity == report.full_symbol_zero_eigenvalue_count
    assert report.full_symbol_diagonalizable is True
    assert report.full_symbol_nonzero_speed_defect == 0
    assert report.full_symbol_condition_number < 1.0e4
    assert report.full_symbol_inverse_residual_l_inf < 1.0e-8
    assert report.full_symbol_incoming_mode_count == 16
    assert report.full_symbol_outgoing_mode_count == 16
    assert report.full_symbol_zero_speed_mode_count == 26
    assert np.isfinite(report.full_symbol_eigenvector_residual_l_inf)
    assert report.full_symbol_eigenvector_residual_l_inf < 1.0e-8
    assert report.ode_principal_row_residual_l_inf < 1.0e-10
    assert report.ode_principal_column_residual_l_inf < 1.0e-10


def test_fo_ccz4_principal_symbol_speeds_are_finite_and_expected() -> None:
    report = linearized_fo_ccz4_principal_symbol_3d(points=8)
    assert all(np.isfinite(value) for value in report.phase_speeds)
    assert np.isfinite(report.eigenvector_condition_number)
    assert report.max_real_eigenvalue_abs < 1.0e-6
    assert report.expected_speed_errors["light"] < 1.0e-8
    assert report.expected_speed_errors["one-plus-log"] < 1.0e-8
    assert report.expected_speed_errors["gamma-driver"] < 1.0e-8
    assert report.published_speed_census_error < 1.0e-8


def test_published_speed_family_contract_is_named_and_closes_to_58_modes() -> None:
    report = linearized_fo_ccz4_principal_symbol_3d(points=8)
    families = report.published_speed_family_contract
    assert [family.name for family in families] == [
        "ode-kinematic",
        "reduced-advection",
        "light-cleaning",
        "one-plus-log",
        "gamma-driver-longitudinal",
        "ordering-longitudinal",
        "gamma-driver-transverse",
        "ordering-transverse",
    ]
    total_modes = sum(
        family.multiplicity * (2 if family.signed else 1) for family in families
    )
    assert total_modes == report.variable_count == 58
    assert families[0].multiplicity == 11
    assert families[1].multiplicity == 15
    assert families[2].multiplicity == 6
    assert report.published_gamma_driver_non_degenerate is True


def test_published_speed_contract_preserves_gamma_driver_degeneracy_marker() -> None:
    gauge = GaugeConfig(
        shift_coefficient=0.75,
        shift_damping=0.0,
        theta_coupling=2.0,
    )
    families = published_fo_ccz4_speed_family_contract(gauge, FOCCZ4Config(kappa1=0.0))
    assert families[4].phase_speed_formula == "+-sqrt(4*f/3)"
    report = linearized_fo_ccz4_principal_symbol_3d(points=8, gauge=gauge)
    assert report.published_gamma_driver_non_degenerate is False
    assert report.strong_hyperbolicity_validated is False


def test_fo_ccz4_principal_symbol_is_replayable() -> None:
    first = linearized_fo_ccz4_principal_symbol_3d(points=8)
    second = linearized_fo_ccz4_principal_symbol_3d(points=8)
    assert first.symbol_sha256 == second.symbol_sha256
    assert first.eigenvector_sha256 == second.eigenvector_sha256
    assert first.constraint_map_sha256 == second.constraint_map_sha256


def test_fo_ccz4_principal_symbol_isotropic_across_cartesian_normals() -> None:
    reports = [
        linearized_fo_ccz4_principal_symbol_3d(points=8, normal_axis=axis)
        for axis in (0, 1, 2)
    ]
    assert [report.normal_axis for report in reports] == [0, 1, 2]
    assert all(report.full_symbol_diagonalizable for report in reports)
    assert all(report.full_symbol_defect == 0 for report in reports)
    assert all(report.full_symbol_eigenvector_rank == 58 for report in reports)
    assert all(report.published_speed_census_error < 1.0e-8 for report in reports)
    assert all(report.full_symbol_incoming_mode_count == 16 for report in reports)
    assert all(report.full_symbol_outgoing_mode_count == 16 for report in reports)
    assert all(report.full_symbol_zero_speed_mode_count == 26 for report in reports)
    assert max(report.full_symbol_condition_number for report in reports) < 1.0e4


def test_fo_ccz4_shadow_avoids_legacy_gamma_driver_degeneracy() -> None:
    tuned = linearized_fo_ccz4_principal_symbol_3d(points=8)
    legacy = linearized_fo_ccz4_principal_symbol_3d(
        points=8,
        gauge=GaugeConfig(shift_coefficient=0.75, shift_damping=0.0, theta_coupling=2.0),
    )
    assert tuned.shift_coefficient == 1.0
    assert tuned.eigenvector_condition_number < 1.0e4
    assert legacy.shift_coefficient == 0.75
    assert legacy.eigenvector_condition_number > 1.0e6
    assert legacy.full_symbol_nonzero_speed_defect > 0
    assert legacy.full_symbol_diagonalizable is False


def test_published_speed_census_is_fail_closed_for_nonstandard_couplings() -> None:
    with pytest.raises(ValueError, match="cleaning_speed=1"):
        linearized_fo_ccz4_principal_symbol_3d(
            points=8,
            config=FOCCZ4Config(cleaning_speed=0.9),
        )
    with pytest.raises(ValueError, match="c=1"):
        linearized_fo_ccz4_principal_symbol_3d(
            points=8,
            gauge=GaugeConfig(
                shift_coefficient=1.0,
                shift_damping=0.0,
                theta_coupling=1.8,
            ),
            config=FOCCZ4Config(c=0.9),
        )
