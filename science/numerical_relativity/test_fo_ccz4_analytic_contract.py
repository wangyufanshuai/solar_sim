from __future__ import annotations

import numpy as np
import pytest

from .fo_ccz4 import FOCCZ4_ODE_VARIABLES
from .fo_ccz4_analytic_contract import audit_fo_ccz4_ode_block_3d


@pytest.mark.parametrize("normal_axis", (0, 1, 2))
def test_flat_fo_ccz4_ode_block_is_a_deterministic_zero_speed_contract(
    normal_axis: int,
) -> None:
    report = audit_fo_ccz4_ode_block_3d(points=8, normal_axis=normal_axis)
    assert report.variable_count == 58
    assert report.variable_names == FOCCZ4_ODE_VARIABLES
    assert report.zero_speed_count == 11
    assert report.canonical_basis_rank == 11
    assert report.flat_ode_block_validated is True
    assert report.analytic_full_eigenvectors_validated is False
    assert report.strong_hyperbolicity_validated is False
    assert report.constraint_preserving_validated is False
    assert report.physical_boundary_validated is False
    assert report.principal_row_residual_l_inf <= report.residual_tolerance
    assert report.principal_column_residual_l_inf <= report.residual_tolerance
    assert report.canonical_basis_residual_l_inf <= report.residual_tolerance


def test_flat_fo_ccz4_ode_block_receipt_is_replayable() -> None:
    first = audit_fo_ccz4_ode_block_3d(points=8, normal_axis=0)
    second = audit_fo_ccz4_ode_block_3d(points=8, normal_axis=0)
    assert first == second
    assert len(first.variable_order_sha256) == 64
    assert len(first.symbol_sha256) == 64
    assert np.isfinite(first.canonical_basis_residual_l_inf)


def test_flat_fo_ccz4_ode_block_rejects_nonpositive_tolerance() -> None:
    with pytest.raises(ValueError, match="residual_tolerance"):
        audit_fo_ccz4_ode_block_3d(residual_tolerance=0.0)
