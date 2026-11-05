from __future__ import annotations

import pytest

from .fo_ccz4_gauge_regime_shadow import run_fo_ccz4_gauge_regime_sweep_3d


def test_gauge_regime_sweep_separates_legacy_and_tuned_shadow() -> None:
    cases = run_fo_ccz4_gauge_regime_sweep_3d(
        normal_axes=(0,),
        shift_coefficients=(0.75, 1.0),
    )

    assert len(cases) == 2
    legacy, tuned = cases
    assert legacy.shift_coefficient == 0.75
    assert legacy.variable_count == 58
    assert legacy.eigenbasis_rank == 58
    assert legacy.symmetrizer_condition_number > 1.0e10
    assert legacy.symmetrizer_condition_bound_validated is False
    assert legacy.numerical_candidate_validated is False
    assert legacy.deterministic_replay is True
    assert ("light-cleaning", "gamma-driver-longitudinal", 1.0) in legacy.speed_collisions

    assert tuned.shift_coefficient == 1.0
    assert tuned.variable_count == 58
    assert tuned.eigenbasis_rank == 58
    assert tuned.symmetrizer_condition_number < 1.0e10
    assert tuned.symmetrizer_condition_bound_validated is True
    assert tuned.numerical_candidate_validated is True
    assert tuned.deterministic_replay is True
    assert ("light-cleaning", "gamma-driver-longitudinal", 1.0) not in tuned.speed_collisions


def test_gauge_regime_sweep_rejects_invalid_campaign_inputs() -> None:
    with pytest.raises(ValueError, match="normal_axes"):
        run_fo_ccz4_gauge_regime_sweep_3d(normal_axes=(3,))
    with pytest.raises(ValueError, match="shift_coefficients"):
        run_fo_ccz4_gauge_regime_sweep_3d(shift_coefficients=(0.0,))
    with pytest.raises(ValueError, match="condition_number_limit"):
        run_fo_ccz4_gauge_regime_sweep_3d(condition_number_limit=0.0)
