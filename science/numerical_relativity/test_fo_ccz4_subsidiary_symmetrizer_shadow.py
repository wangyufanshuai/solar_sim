from __future__ import annotations

import numpy as np
import pytest

from .fo_ccz4_subsidiary_symmetrizer_shadow import (
    FOCCZ4SubsidiarySymmetrizerShadow3D,
    linearized_z4c_subsidiary_symmetrizer_shadow_3d,
)


@pytest.fixture(scope="module")
def audits() -> tuple[
    FOCCZ4SubsidiarySymmetrizerShadow3D,
    FOCCZ4SubsidiarySymmetrizerShadow3D,
    FOCCZ4SubsidiarySymmetrizerShadow3D,
]:
    return tuple(
        linearized_z4c_subsidiary_symmetrizer_shadow_3d(normal_axis=axis)
        for axis in range(3)
    )  # type: ignore[return-value]


def test_reduced_subsidiary_has_positive_explicit_symmetrizer(
    audits: tuple[
        FOCCZ4SubsidiarySymmetrizerShadow3D,
        FOCCZ4SubsidiarySymmetrizerShadow3D,
        FOCCZ4SubsidiarySymmetrizerShadow3D,
    ],
) -> None:
    for audit in audits:
        assert audit.symmetrizer.shape == (10, 10)
        assert np.allclose(audit.symmetrizer, np.diag((1.0, 1.0, 1.0, 4.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0)))
        assert audit.symmetrizer_min_eigenvalue == 1.0
        assert audit.symmetrizer_max_eigenvalue == 4.0
        assert audit.symmetrizer_condition_number == 4.0
        assert audit.positive_definite is True
        assert audit.weighted_principal_symmetry_residual_l_inf < 1.0e-14
        assert audit.subsidiary_shadow_closed is True
        assert audit.symmetrizer_validated is True
        assert audit.cpbc_ready is False
        assert audit.deterministic is True


def test_shift_and_lapse_preserve_the_reduced_symmetrizer() -> None:
    audit = linearized_z4c_subsidiary_symmetrizer_shadow_3d(
        normal_axis=2,
        lapse=1.5,
        shift_normal=-0.25,
    )
    assert audit.symmetrizer_validated is True
    assert audit.weighted_principal_symmetry_residual_l_inf < 1.0e-14


def test_symmetrizer_audit_rejects_invalid_inputs() -> None:
    with pytest.raises(ValueError, match="normal_axis"):
        linearized_z4c_subsidiary_symmetrizer_shadow_3d(normal_axis=3)
    with pytest.raises(ValueError, match="closure_tolerance"):
        linearized_z4c_subsidiary_symmetrizer_shadow_3d(closure_tolerance=0.0)
    with pytest.raises(ValueError, match="symmetry_tolerance"):
        linearized_z4c_subsidiary_symmetrizer_shadow_3d(symmetry_tolerance=0.0)


def test_symmetrizer_audit_replays_deterministically() -> None:
    first = linearized_z4c_subsidiary_symmetrizer_shadow_3d(normal_axis=1)
    second = linearized_z4c_subsidiary_symmetrizer_shadow_3d(normal_axis=1)
    assert first.symmetrizer_sha256 == second.symmetrizer_sha256
    assert np.array_equal(first.symmetrizer, second.symmetrizer)
    assert np.array_equal(first.weighted_principal_matrix, second.weighted_principal_matrix)
