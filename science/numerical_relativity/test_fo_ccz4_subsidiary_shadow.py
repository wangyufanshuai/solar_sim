from __future__ import annotations

import numpy as np
import pytest

from .fo_ccz4_subsidiary_shadow import (
    FOCCZ4SubsidiaryShadow3D,
    SUBSIDIARY_STATE_ORDER,
    linearized_z4c_subsidiary_shadow_3d,
)


@pytest.fixture(scope="module")
def audits() -> tuple[
    FOCCZ4SubsidiaryShadow3D,
    FOCCZ4SubsidiaryShadow3D,
    FOCCZ4SubsidiaryShadow3D,
]:
    return tuple(
        linearized_z4c_subsidiary_shadow_3d(normal_axis=axis)
        for axis in range(3)
    )  # type: ignore[return-value]


def test_flat_subsidiary_block_has_expected_wave_and_zero_speed_sectors(
    audits: tuple[
        FOCCZ4SubsidiaryShadow3D,
        FOCCZ4SubsidiaryShadow3D,
        FOCCZ4SubsidiaryShadow3D,
    ],
) -> None:
    expected_speeds = (-1.0,) * 4 + (0.0,) * 2 + (1.0,) * 4
    for audit in audits:
        assert audit.state_order == SUBSIDIARY_STATE_ORDER
        assert audit.principal_matrix.shape == (10, 10)
        assert audit.source_matrix.shape == (10, 10)
        assert np.allclose(audit.characteristic_speeds, expected_speeds)
        assert audit.compatibility_constraint_count == 2
        assert audit.compatibility_constraint_rank == 2
        assert audit.compatibility_propagation_rank == 0
        assert audit.compatibility_closure_residual_l_inf < 1.0e-14
        assert audit.principal_closed is True
        assert audit.projection_from_fo_ccz4_validated is False
        assert audit.cpbc_ready is False
        assert audit.deterministic is True


def test_constant_shift_and_lapse_change_coordinate_speeds_but_keep_closure() -> None:
    audit = linearized_z4c_subsidiary_shadow_3d(
        normal_axis=2,
        lapse=1.5,
        shift_normal=-0.25,
        effective_wave_number=2.0,
    )
    expected = (-1.75,) * 4 + (-0.25,) * 2 + (1.25,) * 4
    assert np.allclose(audit.characteristic_speeds, expected)
    assert audit.compatibility_propagation_rank == 2
    assert audit.compatibility_closure_residual_l_inf < 1.0e-14
    assert audit.principal_closed is True


def test_subsidiary_contract_rejects_invalid_inputs() -> None:
    with pytest.raises(ValueError, match="normal_axis"):
        linearized_z4c_subsidiary_shadow_3d(normal_axis=3)
    with pytest.raises(ValueError, match="lapse"):
        linearized_z4c_subsidiary_shadow_3d(lapse=0.0)
    with pytest.raises(ValueError, match="shift_normal"):
        linearized_z4c_subsidiary_shadow_3d(shift_normal=float("nan"))
    with pytest.raises(ValueError, match="effective_wave_number"):
        linearized_z4c_subsidiary_shadow_3d(effective_wave_number=0.0)
    with pytest.raises(ValueError, match="closure_tolerance"):
        linearized_z4c_subsidiary_shadow_3d(closure_tolerance=0.0)


def test_subsidiary_contract_is_deterministic() -> None:
    first = linearized_z4c_subsidiary_shadow_3d(normal_axis=1)
    second = linearized_z4c_subsidiary_shadow_3d(normal_axis=1)
    assert first.principal_matrix_sha256 == second.principal_matrix_sha256
    assert np.array_equal(first.principal_matrix, second.principal_matrix)
    assert np.array_equal(first.source_matrix, second.source_matrix)
    assert first.characteristic_speeds == second.characteristic_speeds
    assert first.compatibility_closure_residual_l_inf == (
        second.compatibility_closure_residual_l_inf
    )
