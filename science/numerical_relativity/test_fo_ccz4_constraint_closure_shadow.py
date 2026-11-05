from __future__ import annotations

import pytest

from .fo_ccz4_constraint_closure_shadow import (
    FOCCZ4ConstraintClosureShadow3D,
    linearized_fo_ccz4_constraint_closure_shadow_3d,
)


@pytest.fixture(scope="module")
def audits() -> tuple[
    FOCCZ4ConstraintClosureShadow3D,
    FOCCZ4ConstraintClosureShadow3D,
    FOCCZ4ConstraintClosureShadow3D,
]:
    return tuple(
        linearized_fo_ccz4_constraint_closure_shadow_3d(
            points=8,
            normal_axis=axis,
        )
        for axis in range(3)
    )  # type: ignore[return-value]


def test_candidate_rows_have_a_rank17_invariant_envelope(
    audits: tuple[
        FOCCZ4ConstraintClosureShadow3D,
        FOCCZ4ConstraintClosureShadow3D,
        FOCCZ4ConstraintClosureShadow3D,
    ],
) -> None:
    for audit in audits:
        assert audit.variable_count == 58
        assert audit.initial_constraint_count == 10
        assert audit.initial_projection_rank == 8
        assert audit.completed_constraint_count == 17
        assert audit.completed_constraint_rank == 17
        assert audit.completion_iterations == 3
        assert audit.added_constraint_count == 7
        assert audit.direct_symbol_crosscheck_error_l_inf < 1.0e-8
        assert audit.normalized_closure_residual_l_inf < 1.0e-10
        assert audit.positive_speed_count == 7
        assert audit.negative_speed_count == 7
        assert audit.zero_speed_count == 3
        assert audit.characteristic_basis_rank == 17
        assert audit.characteristic_diagonalizable is True
        assert audit.invariant_envelope_validated is True
        assert audit.physical_subsidiary_equations_validated is False
        assert audit.cpbc_ready is False
        assert audit.deterministic is True


def test_closure_shadow_replays_deterministically() -> None:
    first = linearized_fo_ccz4_constraint_closure_shadow_3d(normal_axis=1)
    second = linearized_fo_ccz4_constraint_closure_shadow_3d(normal_axis=1)
    assert first.completed_constraint_matrix_sha256 == (
        second.completed_constraint_matrix_sha256
    )
    assert first.closure_operator_sha256 == second.closure_operator_sha256
    assert first.normalized_closure_residual_l_inf == (
        second.normalized_closure_residual_l_inf
    )


def test_closure_shadow_rejects_invalid_inputs() -> None:
    with pytest.raises(ValueError, match="normal_axis"):
        linearized_fo_ccz4_constraint_closure_shadow_3d(normal_axis=3)
    with pytest.raises(ValueError, match="rank_tolerance"):
        linearized_fo_ccz4_constraint_closure_shadow_3d(rank_tolerance=0.0)
    with pytest.raises(ValueError, match="closure_tolerance"):
        linearized_fo_ccz4_constraint_closure_shadow_3d(closure_tolerance=0.0)
    with pytest.raises(ValueError, match="max_iterations"):
        linearized_fo_ccz4_constraint_closure_shadow_3d(max_iterations=0)
