from __future__ import annotations

import pytest

from .fo_ccz4_cpbc_shadow import (
    FOCCZ4CPBCAudit3D,
    linearized_fo_ccz4_cpbc_audit_3d,
)


@pytest.fixture(scope="module")
def cpbc_audit() -> FOCCZ4CPBCAudit3D:
    return linearized_fo_ccz4_cpbc_audit_3d(points=8)


def test_cpbc_shadow_reconstructs_a_complete_numerical_basis(
    cpbc_audit: FOCCZ4CPBCAudit3D,
) -> None:
    assert cpbc_audit.variable_count == 58
    assert "physical coordinate speed is -a" in cpbc_audit.phase_speed_convention
    assert cpbc_audit.constraint_operator_kind == "ordering-definition-curl-plus-algebraic"
    assert cpbc_audit.contains_hamiltonian_momentum_constraints is False
    assert cpbc_audit.published_speed_census_error < 1.0e-8
    assert cpbc_audit.published_speed_family_names[:2] == (
        "ode-kinematic",
        "reduced-advection",
    )
    assert cpbc_audit.published_gamma_driver_non_degenerate is True
    assert cpbc_audit.characteristic_basis_rank == 58
    assert cpbc_audit.characteristic_basis_condition_number < 1.0e4
    assert cpbc_audit.characteristic_diagonal_residual_l_inf < 1.0e-8
    assert cpbc_audit.principal_matrix_real_residual_l_inf < 1.0e-10


def test_cpbc_shadow_constructs_bounded_energy_symmetrizer(
    cpbc_audit: FOCCZ4CPBCAudit3D,
) -> None:
    assert cpbc_audit.numerical_symmetrizer_constructed is True
    assert cpbc_audit.symmetrizer_positive_definite is True
    assert cpbc_audit.symmetrizer_min_eigenvalue > 0.0
    assert cpbc_audit.symmetrizer_condition_number < 1.0e5
    assert cpbc_audit.symmetrizer_hermitian_residual_l_inf < 1.0e-12
    assert cpbc_audit.symmetrizer_energy_residual_l_inf < 1.0e-8
    assert cpbc_audit.analytic_symmetrizer_validated is False


def test_cpbc_shadow_audits_both_incoming_constraint_maps(
    cpbc_audit: FOCCZ4CPBCAudit3D,
) -> None:
    assert cpbc_audit.right_incoming_mode_count == 16
    assert cpbc_audit.left_incoming_mode_count == 16
    assert cpbc_audit.right_outgoing_mode_count == 16
    assert cpbc_audit.left_outgoing_mode_count == 16
    assert cpbc_audit.right_incoming_constraint_rank == 16
    assert cpbc_audit.left_incoming_constraint_rank == 16
    assert cpbc_audit.right_incoming_constraint_free_amplitude_count == 0
    assert cpbc_audit.left_incoming_constraint_free_amplitude_count == 0
    assert cpbc_audit.right_incoming_constraint_map_residual_l_inf < 1.0e-8
    assert cpbc_audit.left_incoming_constraint_map_residual_l_inf < 1.0e-8
    assert cpbc_audit.incoming_constraint_map_validated is False
    assert cpbc_audit.cpbc_ready is False


def test_cpbc_shadow_rejects_invalid_rank_tolerance() -> None:
    with pytest.raises(ValueError, match="rank_tolerance"):
        linearized_fo_ccz4_cpbc_audit_3d(points=8, rank_tolerance=0.0)
