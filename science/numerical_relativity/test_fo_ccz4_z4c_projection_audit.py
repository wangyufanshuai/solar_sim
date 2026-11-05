from __future__ import annotations

import pytest

from .fo_ccz4_z4c_projection_audit import (
    FOCCZ4Z4CProjectionAudit3D,
    linearized_fo_ccz4_z4c_projection_audit_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config


@pytest.fixture(scope="module")
def audits() -> tuple[
    FOCCZ4Z4CProjectionAudit3D,
    FOCCZ4Z4CProjectionAudit3D,
    FOCCZ4Z4CProjectionAudit3D,
]:
    return tuple(
        linearized_fo_ccz4_z4c_projection_audit_3d(
            points=8,
            normal_axis=axis,
        )
        for axis in range(3)
    )  # type: ignore[return-value]


def test_candidate_z4c_projection_is_explicitly_negative_until_closed(
    audits: tuple[
        FOCCZ4Z4CProjectionAudit3D,
        FOCCZ4Z4CProjectionAudit3D,
        FOCCZ4Z4CProjectionAudit3D,
    ],
) -> None:
    for audit in audits:
        assert audit.variable_count == 58
        assert audit.subsidiary_state_count == 10
        assert audit.projection_rank == 8
        assert audit.propagation_matrix_rank == 8
        assert audit.direct_symbol_crosscheck_error_l_inf < 1.0e-8
        assert audit.ordering_constraint_rank == 36
        assert audit.normalized_unconstrained_subsidiary_residual_l_inf > 1.0e-2
        assert audit.normalized_ordering_modulo_subsidiary_residual_l_inf < 1.0e-8
        assert audit.continuum_subsidiary_equivalence_modulo_ordering_validated is True
        # The candidate projection is deliberately still a negative gate.
        # Its residual is a diagnostic, not a CPBC proof, and must remain
        # non-zero after using the physical FO-CCZ4 K contract.
        assert audit.normalized_closure_residual_l_inf > 1.0e-2
        assert audit.projection_validated is False
        assert audit.cpbc_ready is False
        assert audit.deterministic is True


def test_projection_audit_rejects_invalid_inputs() -> None:
    with pytest.raises(ValueError, match="normal_axis"):
        linearized_fo_ccz4_z4c_projection_audit_3d(normal_axis=3)
    with pytest.raises(ValueError, match="rank_tolerance"):
        linearized_fo_ccz4_z4c_projection_audit_3d(
            points=8,
            rank_tolerance=0.0,
        )
    with pytest.raises(ValueError, match="closure_tolerance"):
        linearized_fo_ccz4_z4c_projection_audit_3d(
            points=8,
            closure_tolerance=0.0,
        )
    with pytest.raises(ValueError, match="flat shadow gauge/configuration"):
        linearized_fo_ccz4_z4c_projection_audit_3d(
            points=8,
            config=FOCCZ4Config(kappa1=0.1),
        )


def test_projection_audit_replays_deterministically() -> None:
    first = linearized_fo_ccz4_z4c_projection_audit_3d(
        points=8,
        normal_axis=1,
    )
    second = linearized_fo_ccz4_z4c_projection_audit_3d(
        points=8,
        normal_axis=1,
    )
    assert first.projection_matrix_sha256 == second.projection_matrix_sha256
    assert first.normalized_closure_residual_l_inf == (
        second.normalized_closure_residual_l_inf
    )
