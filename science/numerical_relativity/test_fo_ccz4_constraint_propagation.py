from __future__ import annotations

import pytest

from .fo_ccz4_constraint_propagation import (
    FOCCZ4ConstraintPropagationAudit3D,
    linearized_fo_ccz4_constraint_propagation_audit_3d,
)


@pytest.fixture(scope="module")
def audits() -> tuple[
    FOCCZ4ConstraintPropagationAudit3D,
    FOCCZ4ConstraintPropagationAudit3D,
    FOCCZ4ConstraintPropagationAudit3D,
]:
    return tuple(
        linearized_fo_ccz4_constraint_propagation_audit_3d(
            points=8,
            normal_axis=axis,
        )
        for axis in range(3)
    )  # type: ignore[return-value]


def test_candidate_constraint_rows_are_audited_without_false_closure_claim(
    audits: tuple[
        FOCCZ4ConstraintPropagationAudit3D,
        FOCCZ4ConstraintPropagationAudit3D,
        FOCCZ4ConstraintPropagationAudit3D,
    ],
) -> None:
    for audit in audits:
        assert audit.variable_count == 58
        assert audit.constraint_count == 73
        assert audit.ordering_constraint_count == 69
        assert audit.einstein_constraint_count == 4
        assert audit.constraint_rank == 40
        assert audit.propagation_matrix_rank == 23
        assert audit.direct_symbol_crosscheck_error_l_inf < 1.0e-8
        assert 0.22 < audit.normalized_closure_residual_l_inf < 0.25
        assert audit.constraint_propagation_closed is False
        assert audit.deterministic is True
        assert audit.contains_hamiltonian_momentum_constraints is True


def test_constraint_propagation_audit_rejects_invalid_tolerances() -> None:
    with pytest.raises(ValueError, match="rank_tolerance"):
        linearized_fo_ccz4_constraint_propagation_audit_3d(
            points=8,
            rank_tolerance=0.0,
        )
    with pytest.raises(ValueError, match="closure_tolerance"):
        linearized_fo_ccz4_constraint_propagation_audit_3d(
            points=8,
            closure_tolerance=0.0,
        )
