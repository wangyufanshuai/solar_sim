from __future__ import annotations

import numpy as np
import pytest

from .excision3d import (
    advance_excision_characteristic_shadow_3d,
    advance_excision_shadow_3d,
    excision_causality_report_3d,
)
from .nr3d import BSSNState3D, Grid3D


@pytest.mark.parametrize("formulation", ["ccz4", "bssnok"])
def test_excision_shadow_preserves_mask_and_is_deterministic(formulation: str) -> None:
    grid = Grid3D((17, 17, 17), (-2.0, -2.0, -2.0), (2.0, 2.0, 2.0), boundary="excision")
    initial = BSSNState3D.schwarzschild_isotropic(
        grid,
        mass_length=1.0,
        formulation=formulation,  # type: ignore[arg-type]
    )
    first = advance_excision_shadow_3d(initial, 1.0e-6, steps=2)
    second = advance_excision_shadow_3d(initial, 1.0e-6, steps=2)
    assert first.finite_state is True
    assert first.valid_mask_preserved is True
    assert first.physical_excision_validated is False
    assert first.ghost_fill == "nearest-valid-zero-gradient"
    assert first.outer_boundary == "sommerfeld-scalar-proxy"
    assert first.max_ghost_distance == 3
    assert first.causality_report.face_count > 0
    assert first.causality_report.physical_boundary_validated is False
    assert first.causality_report.pure_outflow is False
    assert first.causality_report.pure_outflow_fraction == 0.0
    assert first.causality_report.inflow_fraction == 1.0
    assert first.causality_report.max_outgoing_speed > 0.0
    assert first.causality_report == second.causality_report
    assert len(first.constraint_history) == 2
    assert all("hamiltonian_l2" in sample for sample in first.constraint_history)
    assert first.state_sha256 == second.state_sha256
    assert np.array_equal(first.state.valid_mask, initial.valid_mask)
    for name in ("chi", "h", "trace_k", "a", "theta", "conformal_gamma", "lapse", "shift", "b"):
        assert np.array_equal(
            getattr(first.state, name)[~initial.valid_mask],
            getattr(initial, name)[~initial.valid_mask],
        )


def test_excision_shadow_rejects_periodic_and_fourth_order_paths() -> None:
    periodic = BSSNState3D.minkowski(
        Grid3D((9, 9, 9), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="periodic")
    )
    with pytest.raises(ValueError, match="boundary='excision'"):
        advance_excision_shadow_3d(periodic, 1.0e-6)
    with pytest.raises(ValueError, match="boundary='excision'"):
        excision_causality_report_3d(periodic)
    fourth_order = BSSNState3D.schwarzschild_isotropic(
        Grid3D(
            (17, 17, 17),
            (-2.0, -2.0, -2.0),
            (2.0, 2.0, 2.0),
            boundary="excision",
            spatial_order=4,
        )
    )
    with pytest.raises(ValueError, match="second-order"):
        advance_excision_shadow_3d(fourth_order, 1.0e-6)
    with pytest.raises(ValueError, match="second-order"):
        advance_excision_characteristic_shadow_3d(fourth_order, 1.0e-6)


@pytest.mark.parametrize("formulation", ["ccz4", "bssnok"])
def test_characteristic_excision_shadow_is_finite_and_fail_closed(formulation: str) -> None:
    grid = Grid3D((9, 9, 9), (-1.0, -1.0, -1.0), (1.0, 1.0, 1.0), boundary="excision")
    initial = BSSNState3D.schwarzschild_isotropic(
        grid,
        excision_radius=0.1,
        lapse_seed="psi-minus-two",
        formulation=formulation,  # type: ignore[arg-type]
    )
    first = advance_excision_characteristic_shadow_3d(
        initial,
        1.0e-6,
        steps=1,
        penalty_strength=0.25,
    )
    second = advance_excision_characteristic_shadow_3d(
        initial,
        1.0e-6,
        steps=1,
        penalty_strength=0.25,
    )
    assert first.finite_state is True
    assert first.valid_mask_preserved is True
    assert first.physical_excision_validated is False
    assert "inner-characteristic-penalty-proxy" in first.ghost_fill
    assert first.state_sha256 == second.state_sha256
    assert first.state.metadata["excision_inner_boundary_operator"].startswith("incoming-")
    assert first.state.metadata["excision_characteristic_speed_method"] == (
        "inner-face-principal-speed-census-v1"
    )
    assert np.array_equal(first.state.valid_mask, initial.valid_mask)


def test_excision_causality_proxy_can_pass_for_declared_outflow_shift() -> None:
    grid = Grid3D((7, 7, 7), (-1.0, -1.0, -1.0), (1.0, 1.0, 1.0), boundary="excision")
    state = BSSNState3D.minkowski(grid)
    center = (3, 3, 3)
    state.valid_mask[center] = False
    for delta in (
        (-1, 0, 0),
        (1, 0, 0),
        (0, -1, 0),
        (0, 1, 0),
        (0, 0, -1),
        (0, 0, 1),
    ):
        face = tuple(component + offset for component, offset in zip(center, delta))
        normal = np.asarray(delta, dtype=np.float64)
        state.shift[face] = -2.0 * normal
    report = excision_causality_report_3d(state)
    assert report.face_count == 6
    assert report.pure_outflow is True
    assert report.pure_outflow_fraction == 1.0
    assert report.inflow_fraction == 0.0
    assert report.max_outgoing_speed == 0.0
    assert report.physical_boundary_validated is False
