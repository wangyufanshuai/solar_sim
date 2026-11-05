from __future__ import annotations

import pytest

from .fo_ccz4_constraint_envelope_boundary_shadow import (
    FOCCZ4ConstraintEnvelopeBoundaryShadow3D,
    linearized_fo_ccz4_constraint_envelope_boundary_shadow_3d,
)


@pytest.fixture(scope="module")
def audits() -> tuple[
    FOCCZ4ConstraintEnvelopeBoundaryShadow3D,
    FOCCZ4ConstraintEnvelopeBoundaryShadow3D,
]:
    return (
        linearized_fo_ccz4_constraint_envelope_boundary_shadow_3d(
            normal_axis=0,
            orientation="right",
        ),
        linearized_fo_ccz4_constraint_envelope_boundary_shadow_3d(
            normal_axis=0,
            orientation="left",
        ),
    )


def test_boundary_shadow_projects_to_constraint_nullspace(
    audits: tuple[
        FOCCZ4ConstraintEnvelopeBoundaryShadow3D,
        FOCCZ4ConstraintEnvelopeBoundaryShadow3D,
    ],
) -> None:
    for audit in audits:
        assert audit.variable_count == 58
        assert audit.incoming_mode_count == 16
        assert audit.incoming_constraint_rank == 7
        assert audit.free_incoming_dimension == 9
        assert audit.projected_constraint_rank == 9
        assert audit.projection_idempotence_residual_l_inf < 1.0e-8
        assert audit.projected_constraint_residual_l_inf < 1.0e-8
        assert audit.completed_envelope_closure_residual_l_inf < 1.0e-8
        assert audit.algebraic_projection_validated is True
        assert audit.continuum_energy_estimate_validated is False
        assert audit.physical_radiative_data_validated is False
        assert audit.nonlinear_cpbc_validated is False
        assert audit.cpbc_ready is False


def test_boundary_shadow_replays_deterministically() -> None:
    first = linearized_fo_ccz4_constraint_envelope_boundary_shadow_3d(
        normal_axis=2,
        orientation="left",
    )
    second = linearized_fo_ccz4_constraint_envelope_boundary_shadow_3d(
        normal_axis=2,
        orientation="left",
    )
    assert first.boundary_projection_sha256 == second.boundary_projection_sha256
    assert first.projected_constraint_residual_l_inf == (
        second.projected_constraint_residual_l_inf
    )


def test_boundary_shadow_rejects_invalid_inputs() -> None:
    with pytest.raises(ValueError, match="orientation"):
        linearized_fo_ccz4_constraint_envelope_boundary_shadow_3d(
            orientation="invalid",  # type: ignore[arg-type]
        )
    with pytest.raises(ValueError, match="rank_tolerance"):
        linearized_fo_ccz4_constraint_envelope_boundary_shadow_3d(
            rank_tolerance=0.0,
        )


def test_boundary_shadow_fails_closed_when_krylov_completion_is_truncated() -> None:
    audit = linearized_fo_ccz4_constraint_envelope_boundary_shadow_3d(
        points=8,
        max_iterations=1,
    )
    assert audit.completed_envelope_closure_residual_l_inf > 1.0e-8
    assert audit.algebraic_projection_validated is False
