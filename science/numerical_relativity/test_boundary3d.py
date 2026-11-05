from __future__ import annotations

import numpy as np
import pytest

from .bssn3d import advance_bssn_rk4_3d
from .bssn3d import bssn_rhs_3d
from .ccz4_3d import advance_ccz4_rk4_3d
from .ccz4_3d import ccz4_rhs_3d
from .boundary3d import (
    apply_inner_characteristic_penalty_rhs_3d,
    characteristic_speed_report_3d,
    inner_characteristic_speed_report_3d,
)
from .ccz4_reference import GaugeConfig
from .excision3d import _filled_state
from .nr3d import BSSNState3D, Grid3D


def _perturbed_state(formulation: str) -> BSSNState3D:
    grid = Grid3D(
        (9, 9, 9),
        (-1.0, -1.0, -1.0),
        (1.0, 1.0, 1.0),
        boundary="sommerfeld",
    )
    state = BSSNState3D.minkowski(grid, formulation=formulation)  # type: ignore[arg-type]
    x, y, z = grid.coordinates
    phase = np.pi * (x + y + z)
    state.chi[:] = 1.0 + 1.0e-4 * np.sin(phase)
    state.h[..., 0, 0] = 1.0 + 1.0e-4 * np.cos(phase)
    state.h[..., 1, 1] = 1.0 - 5.0e-5 * np.cos(phase)
    state.h[..., 2, 2] = 1.0 - 5.0e-5 * np.cos(phase)
    state.trace_k[:] = 1.0e-4 * np.sin(phase)
    state.a[..., 0, 0] = 1.0e-4 * np.sin(phase)
    state.a[..., 1, 1] = -5.0e-5 * np.sin(phase)
    state.a[..., 2, 2] = -5.0e-5 * np.sin(phase)
    state.lapse[:] = 1.0 + 5.0e-5 * np.cos(phase)
    state.shift[..., 0] = 1.0e-5 * np.sin(phase)
    state.b[..., 0] = 1.0e-5 * np.cos(phase)
    if formulation == "ccz4":
        state.theta[:] = 1.0e-5 * np.cos(phase)
        state.conformal_gamma[..., 0] = 2.0e-5 * np.sin(phase)
    return state


@pytest.mark.parametrize("formulation", ["ccz4", "bssnok"])
def test_characteristic_speed_report_is_explicit_and_deterministic(formulation: str) -> None:
    state = _perturbed_state(formulation)
    first = characteristic_speed_report_3d(state)
    second = characteristic_speed_report_3d(state)
    assert first == second
    assert first.face_count == 6 * 9 * 9
    assert first.mode_count == first.face_count * 8
    assert first.incoming_mode_count > 0
    assert first.outgoing_mode_count > 0
    assert first.incoming_fraction > 0.0
    assert first.constraint_incoming_fraction > 0.0
    assert first.physical_boundary_validated is False
    assert first.constraint_preserving_validated is False
    assert first.min_speed < 0.0 < first.max_speed


@pytest.mark.parametrize("formulation", ["ccz4", "bssnok"])
def test_characteristic_penalty_shadow_evolves_finitely(formulation: str) -> None:
    state = _perturbed_state(formulation)
    if formulation == "ccz4":
        evolved = advance_ccz4_rk4_3d(
            state,
            1.0e-5,
            steps=1,
            project_algebraic=True,
            gauge=GaugeConfig(theta_coupling=2.0),
            boundary_mode="characteristic-proxy",
        )
    else:
        evolved = advance_bssn_rk4_3d(
            state,
            1.0e-5,
            steps=1,
            project_algebraic=True,
            boundary_mode="characteristic-proxy",
        )
    assert all(np.all(np.isfinite(getattr(evolved, name))) for name in (
        "chi", "h", "trace_k", "a", "theta", "conformal_gamma",
        "lapse", "shift", "b",
    ))
    assert np.all(evolved.chi > 0.0)
    assert np.all(evolved.lapse > 0.0)


def test_characteristic_speed_report_rejects_periodic_grid() -> None:
    state = BSSNState3D.minkowski(
        Grid3D((7, 7, 7), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="periodic")
    )
    with pytest.raises(ValueError, match="boundary='sommerfeld'"):
        characteristic_speed_report_3d(state)


@pytest.mark.parametrize("formulation", ["ccz4", "bssnok"])
def test_inner_characteristic_speed_report_keeps_excision_proxy_explicit(
    formulation: str,
) -> None:
    state = BSSNState3D.schwarzschild_isotropic(
        Grid3D(
            (9, 9, 9),
            (-1.0, -1.0, -1.0),
            (1.0, 1.0, 1.0),
            boundary="excision",
        ),
        excision_radius=0.1,
        lapse_seed="psi-minus-two",
        formulation=formulation,  # type: ignore[arg-type]
    )
    first = inner_characteristic_speed_report_3d(state)
    second = inner_characteristic_speed_report_3d(state)
    assert first == second
    assert first.face_count > 0
    assert first.mode_count == first.face_count * 8
    assert 0.0 < first.incoming_fraction < 1.0
    assert first.constraint_incoming_fraction > 0.0
    assert first.method == "inner-face-principal-speed-census-v1"
    assert first.physical_boundary_validated is False
    assert first.constraint_preserving_validated is False


@pytest.mark.parametrize("formulation", ["ccz4", "bssnok"])
def test_inner_characteristic_penalty_is_deterministic_and_oriented(
    formulation: str,
) -> None:
    state = BSSNState3D.schwarzschild_isotropic(
        Grid3D(
            (9, 9, 9),
            (-1.0, -1.0, -1.0),
            (1.0, 1.0, 1.0),
            boundary="excision",
        ),
        excision_radius=0.1,
        lapse_seed="psi-minus-two",
        formulation=formulation,  # type: ignore[arg-type]
    )
    filled, _ = _filled_state(state)
    raw = (
        ccz4_rhs_3d(filled, gauge=GaugeConfig(theta_coupling=2.0))
        if formulation == "ccz4"
        else bssn_rhs_3d(filled)
    )
    first = apply_inner_characteristic_penalty_rhs_3d(
        state,
        raw,
        gauge=GaugeConfig(theta_coupling=2.0),
        penalty_strength=0.25,
    )
    second = apply_inner_characteristic_penalty_rhs_3d(
        state,
        raw,
        gauge=GaugeConfig(theta_coupling=2.0),
        penalty_strength=0.25,
    )
    assert all(
        np.array_equal(getattr(first, name), getattr(second, name))
        for name in (
            "chi", "h", "trace_k", "a", "theta", "conformal_gamma",
            "lapse", "shift", "b",
        )
    )
    assert all(np.all(np.isfinite(getattr(first, name))) for name in (
        "chi", "h", "trace_k", "a", "theta", "conformal_gamma",
        "lapse", "shift", "b",
    ))
    assert not np.array_equal(first.chi, raw.chi)
