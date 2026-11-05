from __future__ import annotations

import pytest

from .fo_ccz4_constraint_envelope_cpbc_shadow import (
    FOCCZ4ConstraintEnvelopeCPBCShadow3D,
    linearized_fo_ccz4_constraint_envelope_cpbc_shadow_3d,
)


@pytest.fixture(scope="module")
def audits() -> tuple[
    FOCCZ4ConstraintEnvelopeCPBCShadow3D,
    FOCCZ4ConstraintEnvelopeCPBCShadow3D,
    FOCCZ4ConstraintEnvelopeCPBCShadow3D,
    FOCCZ4ConstraintEnvelopeCPBCShadow3D,
    FOCCZ4ConstraintEnvelopeCPBCShadow3D,
    FOCCZ4ConstraintEnvelopeCPBCShadow3D,
]:
    return tuple(
        linearized_fo_ccz4_constraint_envelope_cpbc_shadow_3d(
            points=8,
            normal_axis=axis,
            orientation=orientation,
        )
        for axis in range(3)
        for orientation in ("right", "left")
    )  # type: ignore[return-value]


def test_envelope_map_separates_constraint_and_free_incoming_modes(
    audits: tuple[
        FOCCZ4ConstraintEnvelopeCPBCShadow3D,
        FOCCZ4ConstraintEnvelopeCPBCShadow3D,
        FOCCZ4ConstraintEnvelopeCPBCShadow3D,
        FOCCZ4ConstraintEnvelopeCPBCShadow3D,
        FOCCZ4ConstraintEnvelopeCPBCShadow3D,
        FOCCZ4ConstraintEnvelopeCPBCShadow3D,
    ],
) -> None:
    for audit in audits:
        assert audit.variable_count == 58
        assert audit.envelope_constraint_count == 17
        assert audit.main_incoming_mode_count == 16
        assert audit.main_outgoing_mode_count == 16
        assert audit.main_zero_mode_count == 26
        assert audit.incoming_constraint_rank == 7
        assert audit.free_incoming_nullity == 9
        assert audit.incoming_constraint_map_residual_l_inf < 1.0e-8
        assert audit.free_incoming_nullspace_residual_l_inf < 1.0e-8
        assert audit.completed_envelope_closure_residual_l_inf < 1.0e-8
        assert audit.characteristic_basis_rank == 58
        assert audit.frozen_envelope_map_validated is True
        assert audit.physical_radiative_data_validated is False
        assert audit.nonlinear_cpbc_validated is False
        assert audit.cpbc_ready is False


def test_envelope_map_replays_deterministically() -> None:
    first = linearized_fo_ccz4_constraint_envelope_cpbc_shadow_3d(
        normal_axis=2,
        orientation="left",
    )
    second = linearized_fo_ccz4_constraint_envelope_cpbc_shadow_3d(
        normal_axis=2,
        orientation="left",
    )
    assert first.incoming_constraint_map_sha256 == second.incoming_constraint_map_sha256
    assert first.free_incoming_nullspace_sha256 == second.free_incoming_nullspace_sha256
    assert first.incoming_constraint_rank == second.incoming_constraint_rank


def test_envelope_map_rejects_invalid_orientation_and_tolerance() -> None:
    with pytest.raises(ValueError, match="orientation"):
        linearized_fo_ccz4_constraint_envelope_cpbc_shadow_3d(
            orientation="invalid",  # type: ignore[arg-type]
        )
    with pytest.raises(ValueError, match="rank_tolerance"):
        linearized_fo_ccz4_constraint_envelope_cpbc_shadow_3d(
            rank_tolerance=0.0,
        )


def test_envelope_map_fails_closed_when_krylov_completion_is_truncated() -> None:
    audit = linearized_fo_ccz4_constraint_envelope_cpbc_shadow_3d(
        points=8,
        max_iterations=1,
    )
    assert audit.completed_envelope_closure_residual_l_inf > 1.0e-8
    assert audit.frozen_envelope_map_validated is False
