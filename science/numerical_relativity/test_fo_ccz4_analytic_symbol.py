from __future__ import annotations

import numpy as np
import pytest

from .ccz4_reference import GaugeConfig
from .fo_ccz4_analytic_symbol import (
    analytic_fo_ccz4_principal_matrix_3d,
    fo_ccz4_frame_representation_3d,
    fo_ccz4_rotation_representation_3d,
)
from .fo_ccz4_principal_symbol import linearized_fo_ccz4_principal_symbol_3d
from .fo_ccz4_rhs import FOCCZ4Config


@pytest.mark.parametrize("normal_axis", (0, 1, 2))
def test_direct_flat_fo_ccz4_principal_matrix_matches_fourier_shadow(
    normal_axis: int,
) -> None:
    gauge = GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0)
    config = FOCCZ4Config(kappa1=0.0)
    raw = linearized_fo_ccz4_principal_symbol_3d(
        points=8,
        normal_axis=normal_axis,
        gauge=gauge,
        config=config,
        return_raw=True,
    )
    direct = analytic_fo_ccz4_principal_matrix_3d(
        normal_axis=normal_axis,
        gauge=gauge,
        config=config,
    )
    extracted = raw.symbol / (1j * raw.effective_wave_number)
    error = float(np.max(np.abs(extracted - direct)))
    assert np.all(np.isfinite(direct))
    assert error < 1.0e-8


def test_direct_flat_fo_ccz4_matrix_rejects_non_advective_gauge() -> None:
    with pytest.raises(ValueError, match="advective gauge"):
        analytic_fo_ccz4_principal_matrix_3d(
            gauge=GaugeConfig(advective=False, theta_coupling=2.0)
        )


@pytest.mark.parametrize("normal", ((1.0, 2.0, 3.0), (1.0, -2.0, 0.5), (-3.0, 4.0, 5.0)))
def test_direct_flat_fo_ccz4_oblique_normal_has_axis_isotropic_spectrum(
    normal: tuple[float, float, float],
) -> None:
    """Check rotational spectral isotropy without exporting characteristic data."""

    axis = analytic_fo_ccz4_principal_matrix_3d(normal_axis=0)
    oblique = analytic_fo_ccz4_principal_matrix_3d(normal=normal)
    axis_eigenvalues = np.sort_complex(np.linalg.eigvals(axis))
    oblique_eigenvalues = np.sort_complex(np.linalg.eigvals(oblique))

    assert np.max(np.abs(np.imag(oblique_eigenvalues))) < 1.0e-12
    assert np.linalg.matrix_rank(np.linalg.eig(oblique)[1]) == 58
    assert np.max(np.abs(oblique_eigenvalues - axis_eigenvalues)) < 1.0e-10


def test_direct_flat_fo_ccz4_normal_argument_rejects_ambiguous_axis() -> None:
    with pytest.raises(ValueError, match="either normal_axis or normal"):
        analytic_fo_ccz4_principal_matrix_3d(normal_axis=1, normal=(1.0, 0.0, 0.0))


def test_direct_flat_fo_ccz4_normal_argument_normalizes_and_rejects_invalid() -> None:
    normalized = analytic_fo_ccz4_principal_matrix_3d(normal=(2.0, 0.0, 0.0))
    axis = analytic_fo_ccz4_principal_matrix_3d(normal_axis=0)
    assert np.array_equal(normalized, axis)
    with pytest.raises(ValueError, match="three finite components"):
        analytic_fo_ccz4_principal_matrix_3d(normal=(1.0, float("nan"), 0.0))
    with pytest.raises(ValueError, match="non-zero length"):
        analytic_fo_ccz4_principal_matrix_3d(normal=(0.0, 0.0, 0.0))


@pytest.mark.parametrize("normal", ((1.0, 2.0, 3.0), (1.0, -2.0, 0.5), (-3.0, 4.0, 5.0)))
def test_direct_flat_fo_ccz4_symbol_is_tensor_rotation_covariant(
    normal: tuple[float, float, float],
) -> None:
    vector = np.asarray(normal, dtype=np.float64)
    vector /= np.linalg.norm(vector)
    reference = np.asarray((0.0, 1.0, 0.0))
    if abs(float(np.dot(vector, reference))) >= 0.9:
        reference = np.asarray((0.0, 0.0, 1.0))
    second = reference - vector * float(np.dot(reference, vector))
    second /= np.linalg.norm(second)
    third = np.cross(vector, second)
    rotation = np.column_stack((vector, second, third))

    representation = fo_ccz4_rotation_representation_3d(rotation)
    axis_symbol = analytic_fo_ccz4_principal_matrix_3d(normal_axis=0)
    oblique_symbol = analytic_fo_ccz4_principal_matrix_3d(normal=normal)
    rotated_symbol = representation @ axis_symbol @ np.linalg.inv(representation)

    assert np.max(np.abs(oblique_symbol - rotated_symbol)) < 1.0e-10
    assert np.linalg.cond(representation) < 10.0


def test_fo_ccz4_rotation_representation_rejects_improper_rotation() -> None:
    with pytest.raises(ValueError, match=r"determinant \+1"):
        fo_ccz4_rotation_representation_3d(np.diag((-1.0, 1.0, 1.0)))


def test_fo_ccz4_general_frame_representation_reduces_to_rotation_map() -> None:
    angle = 0.37
    rotation = np.asarray(
        (
            (np.cos(angle), -np.sin(angle), 0.0),
            (np.sin(angle), np.cos(angle), 0.0),
            (0.0, 0.0, 1.0),
        ),
        dtype=np.float64,
    )
    general = fo_ccz4_frame_representation_3d(rotation)
    proper = fo_ccz4_rotation_representation_3d(rotation)
    assert np.max(np.abs(general - proper)) < 1.0e-14
    assert np.linalg.cond(general) < 10.0


def test_fo_ccz4_general_frame_representation_accepts_nonorthogonal_frame() -> None:
    frame = np.asarray(
        (
            (2.0, 0.1, 0.0),
            (0.0, 1.5, 0.2),
            (0.0, 0.0, 0.75),
        ),
        dtype=np.float64,
    )
    representation = fo_ccz4_frame_representation_3d(frame)
    assert representation.shape == (58, 58)
    assert np.all(np.isfinite(representation))
    assert np.linalg.cond(representation) < 1.0e4
    with pytest.raises(ValueError, match="invertible"):
        fo_ccz4_frame_representation_3d(np.zeros((3, 3)))
