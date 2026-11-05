from __future__ import annotations

import numpy as np
import pytest

from .fo_ccz4_local_frame_shadow import (
    audit_fo_ccz4_local_frame_3d,
    local_orthonormal_frame_from_metric_3d,
)
from .nr3d import BSSNState3D, Grid3D


def _state() -> BSSNState3D:
    grid = Grid3D(
        (7, 7, 7),
        (2.0, 2.0, 2.0),
        (4.0, 4.0, 4.0),
        boundary="sommerfeld",
    )
    state = BSSNState3D.schwarzschild_isotropic(
        grid,
        mass_length=1.0,
        center=(0.0, 0.0, 0.0),
        excision_radius=0.5,
        lapse_seed="schwarzschild",
        formulation="ccz4",
    )
    x, y, z = grid.coordinates
    state.h[..., 0, 0] *= 1.0 + 1.0e-2 * np.sin(x)
    state.h[..., 1, 1] *= 1.0 + 5.0e-3 * np.cos(y)
    cross = 1.0e-3 * np.sin(x + y + z)
    state.h[..., 0, 1] = cross
    state.h[..., 1, 0] = cross
    return state


def test_local_frame_builder_is_metric_orthonormal_and_oriented() -> None:
    metric = np.diag((4.0, 1.0, 9.0))
    frame = local_orthonormal_frame_from_metric_3d(
        metric,
        np.asarray((-1.0, 0.0, 0.0)),
    )
    assert np.allclose(frame @ metric @ frame.T, np.eye(3), rtol=0.0, atol=1.0e-12)
    assert np.linalg.det(frame) > 0.0
    assert np.allclose(frame[0] @ metric, (-2.0, 0.0, 0.0), rtol=0.0, atol=1.0e-12)


def test_local_frame_audit_is_deterministic_and_fail_closed() -> None:
    state = _state()
    first = audit_fo_ccz4_local_frame_3d(state, axes=(0, 1))
    second = audit_fo_ccz4_local_frame_3d(state, axes=(0, 1))
    assert first == second
    assert first.face_count == 4 * 7 * 7
    assert first.boundary_cell_count > 0
    assert first.local_orthonormal_frame_validated is True
    assert first.max_metric_orthonormality_residual < 1.0e-10
    assert first.max_normal_covector_residual < 1.0e-10
    assert first.min_frame_determinant > 0.0
    assert first.max_frame_condition_number > 1.0
    assert first.max_euclidean_orthogonality_defect > 0.0
    assert first.variable_coefficient_principal_proxy_validated is False
    assert first.variable_coefficient_boundary_validated is False
    assert first.nonlinear_cpbc_validated is False
    assert first.physical_boundary_validated is False
    assert first.runtime_writeback is False


def test_local_frame_audit_rejects_indefinite_metric() -> None:
    state = _state()
    state.h[0, 0, 0, 0, 0] = -1.0
    with pytest.raises(ValueError, match="positive definite"):
        audit_fo_ccz4_local_frame_3d(state, axes=(0,))


def test_local_frame_audit_rejects_periodic_grid() -> None:
    state = BSSNState3D.minkowski(
        Grid3D((7, 7, 7), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="periodic")
    )
    with pytest.raises(ValueError, match="boundary='sommerfeld'"):
        audit_fo_ccz4_local_frame_3d(state)
