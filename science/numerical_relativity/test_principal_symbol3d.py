from __future__ import annotations

import pytest

from .principal_symbol3d import linearized_principal_symbol_3d


@pytest.mark.parametrize(
    ("formulation", "expected_modes"),
    (("ccz4", 25), ("bssnok", 24)),
)
def test_discrete_principal_symbol_recovers_gauge_and_light_families(
    formulation: str,
    expected_modes: int,
) -> None:
    first = linearized_principal_symbol_3d(formulation, points=10)
    second = linearized_principal_symbol_3d(formulation, points=10)
    assert first.mode_count == expected_modes
    assert len(first.phase_speeds) == expected_modes
    assert first.symbol_sha256 == second.symbol_sha256
    assert first.eigenvector_sha256 == second.eigenvector_sha256
    assert first.constraint_map_sha256 == second.constraint_map_sha256
    assert first.eigenvector_rank == expected_modes
    assert 0 < first.constraint_map_rank <= 10
    assert len(first.constraint_mode_response) == expected_modes
    assert first.constraint_response_threshold == 1.0e-8
    assert first.max_constraint_response > first.constraint_response_threshold
    assert first.incoming_constraint_mode_count > 0
    assert first.outgoing_constraint_mode_count > 0
    assert first.eigenvector_condition_number > 1.0
    assert first.eigenvector_condition_number < float("inf")
    assert first.method == "real-cosine-fourier-linearization-v1"
    assert first.eigenvectors_available is False
    assert first.physical_boundary_validated is False
    assert first.constraint_preserving_validated is False
    assert all(value < 0.1 for value in first.expected_speed_errors.values())
    assert first.phase_speeds[0] < -1.0
    assert first.phase_speeds[-1] > 1.0


def test_discrete_principal_symbol_rejects_nyquist_and_small_grids() -> None:
    with pytest.raises(ValueError, match="at least eight"):
        linearized_principal_symbol_3d(points=7)
    with pytest.raises(ValueError, match="Nyquist"):
        linearized_principal_symbol_3d(points=10, harmonic=5)
