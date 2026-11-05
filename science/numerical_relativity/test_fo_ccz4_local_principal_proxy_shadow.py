from __future__ import annotations

import numpy as np
import pytest

from .fo_ccz4_analytic_symbol import analytic_fo_ccz4_principal_matrix_3d
from .ccz4_reference import GaugeConfig
from .fo_ccz4_local_principal_proxy_shadow import (
    linearized_fo_ccz4_local_principal_proxy_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config


def test_local_principal_proxy_reduces_to_flat_symbol() -> None:
    gauge = GaugeConfig(theta_coupling=2.0)
    config = FOCCZ4Config(kappa1=0.0)
    expected = analytic_fo_ccz4_principal_matrix_3d(
        normal_axis=0,
        gauge=gauge,
        config=config,
    )
    operator, report = linearized_fo_ccz4_local_principal_proxy_3d(
        np.eye(3),
        1.0,
        np.zeros(3),
        np.asarray((1.0, 0.0, 0.0)),
        gauge=gauge,
        config=config,
    )
    assert np.array_equal(operator, expected)
    assert report.local_similarity_validated is True
    assert report.rhs_principal_consistency_validated is False
    assert report.operator_similarity_residual_l_inf == 0.0
    assert report.coordinate_normal_scale == 1.0
    assert report.beta_n == 0.0
    assert report.variable_coefficient_principal_proxy_validated is False
    assert report.variable_coefficient_boundary_validated is False
    assert report.nonlinear_cpbc_validated is False
    assert report.physical_boundary_validated is False
    assert report.runtime_writeback is False


def test_local_principal_proxy_is_deterministic_for_variable_metric() -> None:
    metric = np.asarray(
        (
            (4.0, 0.2, 0.0),
            (0.2, 1.5, 0.1),
            (0.0, 0.1, 9.0),
        ),
        dtype=np.float64,
    )
    shift = np.asarray((0.03, -0.02, 0.01), dtype=np.float64)
    first_operator, first = linearized_fo_ccz4_local_principal_proxy_3d(
        metric,
        0.8,
        shift,
        np.asarray((1.0, 0.0, 0.0)),
    )
    second_operator, second = linearized_fo_ccz4_local_principal_proxy_3d(
        metric,
        0.8,
        shift,
        np.asarray((1.0, 0.0, 0.0)),
    )
    assert np.array_equal(first_operator, second_operator)
    assert first == second
    assert first.variable_count == 58
    assert first.gamma_nn > 0.0
    assert first.coordinate_normal_scale > 0.0
    assert first.frame_condition_number > 1.0
    assert np.all(np.isfinite(first_operator))
    assert first.local_similarity_validated is True
    assert first.rhs_principal_consistency_validated is False
    assert first.operator_imaginary_l_inf < 1.0e-7


def test_local_principal_proxy_rejects_indefinite_metric() -> None:
    metric = np.diag((-1.0, 1.0, 1.0))
    with pytest.raises(ValueError, match="positive definite"):
        linearized_fo_ccz4_local_principal_proxy_3d(
            metric,
            1.0,
            np.zeros(3),
            np.asarray((1.0, 0.0, 0.0)),
        )
