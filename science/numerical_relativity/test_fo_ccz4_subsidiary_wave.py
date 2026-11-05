from __future__ import annotations

import numpy as np
import pytest

from .fo_ccz4_subsidiary_wave import (
    FOCCZ4SubsidiaryWaveShadow3D,
    SUBSIDIARY_WAVE_FIELDS,
    SUBSIDIARY_WAVE_STATE_ORDER,
    linearized_z4c_subsidiary_wave_shadow_3d,
)


@pytest.fixture(scope="module")
def audits() -> tuple[
    FOCCZ4SubsidiaryWaveShadow3D,
    FOCCZ4SubsidiaryWaveShadow3D,
    FOCCZ4SubsidiaryWaveShadow3D,
]:
    return tuple(
        linearized_z4c_subsidiary_wave_shadow_3d(normal_axis=axis)
        for axis in range(3)
    )  # type: ignore[return-value]


def test_wave_subsidiary_has_eight_light_pairs_and_zero_speed_fields(
    audits: tuple[
        FOCCZ4SubsidiaryWaveShadow3D,
        FOCCZ4SubsidiaryWaveShadow3D,
        FOCCZ4SubsidiaryWaveShadow3D,
    ],
) -> None:
    expected_speeds = (-1.0,) * 8 + (0.0,) * 8 + (1.0,) * 8
    for audit in audits:
        assert len(SUBSIDIARY_WAVE_FIELDS) == 8
        assert audit.state_order == SUBSIDIARY_WAVE_STATE_ORDER
        assert audit.principal_matrix.shape == (24, 24)
        assert audit.source_matrix.shape == (24, 24)
        assert np.allclose(audit.characteristic_speeds, expected_speeds)
        assert audit.positive_speed_count == 8
        assert audit.negative_speed_count == 8
        assert audit.zero_speed_count == 8
        assert audit.compatibility_constraint_count == 8
        assert audit.compatibility_constraint_rank == 8
        assert audit.compatibility_propagation_rank == 0
        assert audit.compatibility_closure_residual_l_inf < 1.0e-14
        assert audit.right_incoming_count == 8
        assert audit.left_incoming_count == 8
        assert all(name.endswith(":P+alphaQ") for name in audit.right_incoming_characteristic_rows)
        assert all(name.endswith(":P-alphaQ") for name in audit.left_incoming_characteristic_rows)
        assert audit.subsidiary_wave_closed is True
        assert audit.projection_from_fo_ccz4_validated is False
        assert audit.cpbc_ready is False


def test_shifted_wave_subsidiary_keeps_closure_and_changes_incoming_census() -> None:
    audit = linearized_z4c_subsidiary_wave_shadow_3d(
        normal_axis=2,
        lapse=1.5,
        shift_normal=2.0,
        effective_wave_number=2.0,
    )
    expected_speeds = (0.5,) * 8 + (2.0,) * 8 + (3.5,) * 8
    assert np.allclose(audit.characteristic_speeds, expected_speeds)
    assert audit.compatibility_propagation_rank == 8
    assert audit.compatibility_closure_residual_l_inf < 1.0e-14
    assert audit.right_incoming_count == 24
    assert audit.left_incoming_count == 0
    assert audit.subsidiary_wave_closed is True


@pytest.mark.parametrize("shift,right,left,zero", [
    (-2.0, 0, 24, 0), (-0.25, 8, 16, 0), (0.25, 16, 8, 0),
    (1.0, 16, 0, 8), (-1.0, 0, 16, 8),
])
def test_census_includes_shift_transport_and_glancing_modes(shift, right, left, zero):
    audit = linearized_z4c_subsidiary_wave_shadow_3d(shift_normal=shift)
    assert (audit.right_incoming_count, audit.left_incoming_count, audit.zero_speed_count) == (
        right, left, zero,
    )
    assert right + left + zero == 24
    # q_t = a q_x has solution f(x+a*t): a>0 travels towards decreasing x,
    # hence can enter the domain only through its right face.
    assert audit.right_incoming_count == audit.positive_speed_count
    assert audit.left_incoming_count == audit.negative_speed_count


def test_wave_subsidiary_rejects_invalid_inputs() -> None:
    with pytest.raises(ValueError, match="normal_axis"):
        linearized_z4c_subsidiary_wave_shadow_3d(normal_axis=3)
    with pytest.raises(ValueError, match="lapse"):
        linearized_z4c_subsidiary_wave_shadow_3d(lapse=0.0)
    with pytest.raises(ValueError, match="shift_normal"):
        linearized_z4c_subsidiary_wave_shadow_3d(shift_normal=float("nan"))
    with pytest.raises(ValueError, match="effective_wave_number"):
        linearized_z4c_subsidiary_wave_shadow_3d(effective_wave_number=0.0)
    with pytest.raises(ValueError, match="closure_tolerance"):
        linearized_z4c_subsidiary_wave_shadow_3d(closure_tolerance=0.0)


def test_wave_subsidiary_replays_deterministically() -> None:
    first = linearized_z4c_subsidiary_wave_shadow_3d(normal_axis=1)
    second = linearized_z4c_subsidiary_wave_shadow_3d(normal_axis=1)
    assert first.principal_matrix_sha256 == second.principal_matrix_sha256
    assert np.array_equal(first.principal_matrix, second.principal_matrix)
    assert np.array_equal(first.source_matrix, second.source_matrix)
    assert first.characteristic_speeds == second.characteristic_speeds
    assert first.right_incoming_characteristic_rows == (
        second.right_incoming_characteristic_rows
    )
