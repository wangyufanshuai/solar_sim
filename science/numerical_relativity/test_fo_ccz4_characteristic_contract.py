from __future__ import annotations

from fractions import Fraction

import numpy as np
import pytest

from .fo_ccz4_analytic_symbol import analytic_fo_ccz4_principal_matrix_3d
from .fo_ccz4_characteristic_contract import (
    characteristic_speed_multiset,
    flat_fo_ccz4_characteristic_polynomial_contract,
    published_characteristic_speed_collisions,
)
from .ccz4_reference import GaugeConfig
from .fo_ccz4_rhs import FOCCZ4Config


@pytest.mark.parametrize("normal_axis", (0, 1, 2))
def test_exact_flat_characteristic_polynomial_matches_direct_matrix(
    normal_axis: int,
) -> None:
    contract = flat_fo_ccz4_characteristic_polynomial_contract(normal_axis=normal_axis)
    matrix = analytic_fo_ccz4_principal_matrix_3d(normal_axis=normal_axis)
    expected = np.asarray(
        [float(Fraction(value)) for value in contract.monic_coefficients_descending],
        dtype=np.float64,
    )
    observed = np.poly(matrix)
    assert contract.variable_count == 58
    assert len(contract.monic_coefficients_descending) == 59
    assert np.max(np.abs(observed.imag)) < 1.0e-12
    assert np.max(np.abs(observed.real - expected)) < 1.0e-8
    assert characteristic_speed_multiset(contract).size == 58
    assert np.array_equal(
        matrix,
        analytic_fo_ccz4_principal_matrix_3d(normal_axis=normal_axis),
    )


def test_exact_flat_characteristic_contract_rejects_legacy_degenerate_point() -> None:
    with pytest.raises(ValueError, match="shift_coefficient=1"):
        flat_fo_ccz4_characteristic_polynomial_contract(
            gauge=GaugeConfig(theta_coupling=2.0)
        )


def test_exact_flat_characteristic_contract_rejects_parameter_drift() -> None:
    with pytest.raises(ValueError, match="ordering_mu=1"):
        flat_fo_ccz4_characteristic_polynomial_contract(
            config=FOCCZ4Config(kappa1=0.0, ordering_mu=0.5)
        )


def test_legacy_gamma_driver_longitudinal_light_collision_is_explicit() -> None:
    collisions = published_characteristic_speed_collisions(
        gauge=GaugeConfig(
            shift_coefficient=0.75,
            shift_damping=0.0,
            theta_coupling=2.0,
        ),
        config=FOCCZ4Config(kappa1=0.0),
    )

    assert ("light-cleaning", "gamma-driver-longitudinal", 1.0) in collisions


def test_tuned_shadow_collision_is_different_and_not_silent() -> None:
    collisions = published_characteristic_speed_collisions()

    assert ("light-cleaning", "gamma-driver-transverse", 1.0) in collisions
    assert ("light-cleaning", "gamma-driver-longitudinal", 1.0) not in collisions
