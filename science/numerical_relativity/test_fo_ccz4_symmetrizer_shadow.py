from __future__ import annotations

import numpy as np
import pytest

from .ccz4_reference import GaugeConfig
from .fo_ccz4_rhs import FOCCZ4Config
from .fo_ccz4_symmetrizer_shadow import (
    FOCCZ4NumericalSymmetrizerShadow3D,
    linearized_fo_ccz4_numerical_symmetrizer_shadow_3d,
)


@pytest.fixture(scope="module")
def audits() -> tuple[
    FOCCZ4NumericalSymmetrizerShadow3D,
    FOCCZ4NumericalSymmetrizerShadow3D,
    FOCCZ4NumericalSymmetrizerShadow3D,
]:
    gauge = GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0)
    config = FOCCZ4Config(kappa1=0.0)
    return tuple(
        linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(
            normal_axis=axis,
            gauge=gauge,
            config=config,
        )
        for axis in range(3)
    )  # type: ignore[return-value]


def test_58_variable_numerical_symmetrizer_candidate_is_positive(
    audits: tuple[
        FOCCZ4NumericalSymmetrizerShadow3D,
        FOCCZ4NumericalSymmetrizerShadow3D,
        FOCCZ4NumericalSymmetrizerShadow3D,
    ],
) -> None:
    for audit in audits:
        assert audit.variable_count == 58
        assert audit.eigenbasis_rank == 58
        assert np.isfinite(audit.eigenbasis_condition_number)
        assert audit.eigenbasis_residual_l_inf < 1.0e-10
        assert audit.eigenvalues_imaginary_l_inf < 1.0e-10
        assert audit.symmetrizer_min_eigenvalue > 0.0
        assert audit.symmetrizer_max_eigenvalue > audit.symmetrizer_min_eigenvalue
        assert audit.symmetrizer_condition_number <= 1.0e10
        assert audit.symmetrizer_condition_bound_validated is True
        assert audit.weighted_principal_symmetry_residual_l_inf < 1.0e-8
        assert audit.numerical_candidate_validated is True
        assert audit.analytic_symmetrizer_validated is False
        assert audit.parameter_sweep_validated is False
        assert audit.cpbc_ready is False
        assert audit.deterministic is True


def test_numerical_symmetrizer_replays_deterministically() -> None:
    kwargs = {
        "normal_axis": 1,
        "gauge": GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0),
        "config": FOCCZ4Config(kappa1=0.0),
    }
    first = linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(**kwargs)
    second = linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(**kwargs)
    assert first.symmetrizer_sha256 == second.symmetrizer_sha256
    assert np.array_equal(first.symmetrizer, second.symmetrizer)
    assert np.array_equal(first.eigenbasis, second.eigenbasis)


def test_numerical_symmetrizer_rejects_invalid_inputs() -> None:
    with pytest.raises(ValueError, match="points"):
        linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(points=7)
    with pytest.raises(ValueError, match="harmonic"):
        linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(harmonic=0)
    with pytest.raises(ValueError, match="normal_axis"):
        linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(normal_axis=3)
    with pytest.raises(ValueError, match="rank_tolerance"):
        linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(rank_tolerance=0.0)
    with pytest.raises(ValueError, match="eigenbasis_tolerance"):
        linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(eigenbasis_tolerance=0.0)
    with pytest.raises(ValueError, match="symmetry_tolerance"):
        linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(symmetry_tolerance=0.0)
    with pytest.raises(ValueError, match="condition_number_limit"):
        linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(condition_number_limit=0.0)


def test_legacy_gamma_driver_regime_fails_condition_bound() -> None:
    audit = linearized_fo_ccz4_numerical_symmetrizer_shadow_3d(
        normal_axis=0,
        gauge=GaugeConfig(
            shift_coefficient=0.75,
            shift_damping=0.0,
            theta_coupling=2.0,
        ),
        config=FOCCZ4Config(kappa1=0.0),
    )

    assert audit.symmetrizer_condition_number > 1.0e10
    assert audit.symmetrizer_condition_bound_validated is False
    assert audit.numerical_candidate_validated is False
