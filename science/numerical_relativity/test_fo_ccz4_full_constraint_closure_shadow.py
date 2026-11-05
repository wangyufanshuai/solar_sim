from __future__ import annotations

import pytest

from .fo_ccz4_full_constraint_closure_shadow import (
    linearized_fo_ccz4_full_constraint_closure_shadow_3d,
)


@pytest.mark.parametrize("normal_axis", (0, 1, 2))
def test_full_fourier_constraint_closure_is_closed_but_not_physical_cpbc(
    normal_axis: int,
) -> None:
    report = linearized_fo_ccz4_full_constraint_closure_shadow_3d(
        points=8,
        normal_axis=normal_axis,
    )
    assert report.variable_count == 58
    assert report.raw_constraint_count == 69
    assert report.raw_constraint_rank == 36
    assert report.completed_constraint_count == 39
    assert report.completed_constraint_rank == 39
    assert report.completion_iterations == 1
    assert report.full_symbol_finite is True
    assert report.normalized_closure_residual_l_inf < 1.0e-8
    assert report.full_constraint_closure_validated is True
    assert report.physical_subsidiary_equations_validated is False
    assert report.cpbc_ready is False


def test_full_fourier_constraint_closure_is_replayable() -> None:
    first = linearized_fo_ccz4_full_constraint_closure_shadow_3d(
        points=8,
        normal_axis=1,
    )
    second = linearized_fo_ccz4_full_constraint_closure_shadow_3d(
        points=8,
        normal_axis=1,
    )
    assert first.constraint_rows_sha256 == second.constraint_rows_sha256
    assert first.full_symbol_sha256 == second.full_symbol_sha256
    assert first.completed_rows_sha256 == second.completed_rows_sha256
    assert first.normalized_closure_residual_l_inf == (
        second.normalized_closure_residual_l_inf
    )


def test_full_fourier_constraint_closure_rejects_invalid_parameters() -> None:
    with pytest.raises(ValueError, match="rank_tolerance"):
        linearized_fo_ccz4_full_constraint_closure_shadow_3d(rank_tolerance=0.0)
    with pytest.raises(ValueError, match="closure_tolerance"):
        linearized_fo_ccz4_full_constraint_closure_shadow_3d(closure_tolerance=0.0)
    with pytest.raises(ValueError, match="max_iterations"):
        linearized_fo_ccz4_full_constraint_closure_shadow_3d(max_iterations=0)
