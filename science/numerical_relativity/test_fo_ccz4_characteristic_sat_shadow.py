from __future__ import annotations

from .ccz4_reference import GaugeConfig
from .fo_ccz4_characteristic_sat_shadow import (
    linearized_fo_ccz4_characteristic_sat_shadow_3d,
)
from .fo_ccz4_rhs import FOCCZ4Config


def test_frozen_characteristic_sat_is_dissipative_and_constraint_closed() -> None:
    report = linearized_fo_ccz4_characteristic_sat_shadow_3d(
        points=8,
        normal_axis=0,
        orientation="right",
        gauge=GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0),
        config=FOCCZ4Config(kappa1=0.0),
    )
    assert report.frozen_characteristic_operator_validated is True
    assert report.incoming_mode_count == 16
    assert report.incoming_constraint_rank == 16
    assert report.incoming_constraint_free_amplitude_count == 0
    assert report.energy_penalty_max_eigenvalue <= 1.0e-8
    assert report.free_incoming_constraint_residual_l_inf <= 1.0e-8
    assert report.cpbc_ready is False


def test_frozen_characteristic_sat_is_deterministic_on_the_opposite_face() -> None:
    kwargs = dict(
        points=8,
        normal_axis=2,
        orientation="left",
        gauge=GaugeConfig(shift_coefficient=1.0, shift_damping=0.0, theta_coupling=2.0),
        config=FOCCZ4Config(kappa1=0.0),
    )
    first = linearized_fo_ccz4_characteristic_sat_shadow_3d(**kwargs)
    second = linearized_fo_ccz4_characteristic_sat_shadow_3d(**kwargs)
    assert first.frozen_characteristic_operator_validated is True
    assert first.sat_operator_sha256 == second.sat_operator_sha256
    assert first.energy_penalty_max_eigenvalue == second.energy_penalty_max_eigenvalue


def test_legacy_three_quarter_gamma_driver_is_retained_as_a_negative_control() -> None:
    report = linearized_fo_ccz4_characteristic_sat_shadow_3d(
        points=8,
        normal_axis=0,
        orientation="right",
        gauge=GaugeConfig(shift_coefficient=0.75, shift_damping=0.0, theta_coupling=2.0),
        config=FOCCZ4Config(kappa1=0.0),
    )
    assert report.frozen_characteristic_operator_validated is False
    assert report.cpbc_ready is False
