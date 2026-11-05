from __future__ import annotations

import numpy as np
import pytest

from .ccz4_reference import CCZ4State1D, Grid1D, constraint_report
from .bssn_rhs import _physical_ricci, advance_bssn_rk4, bssn_rhs_1d
from .ccz4_reference import BoundaryConfig1D, _ricci_tensor_1d


def test_bssn_minkowski_rhs_is_zero() -> None:
    state = CCZ4State1D.minkowski(Grid1D(17, -1.0, 1.0), formulation="bssnok")
    rhs = bssn_rhs_1d(state)
    for name in (
        "chi", "h", "trace_k", "a", "theta", "conformal_gamma", "lapse", "shift", "b"
    ):
        assert np.array_equal(getattr(rhs, name), np.zeros_like(getattr(rhs, name)))
    assert rhs.geometric_gamma_rhs_supplied is True
    assert rhs.theta_evolution_supported is False


def test_bssn_rk4_preserves_minkowski_exactly() -> None:
    state = CCZ4State1D.minkowski(Grid1D(17, -1.0, 1.0), formulation="bssnok")
    evolved = advance_bssn_rk4(state, 0.01, steps=3)
    assert np.array_equal(evolved.chi, state.chi)
    assert np.array_equal(evolved.h, state.h)
    assert np.array_equal(evolved.lapse, state.lapse)
    assert max(constraint_report(evolved).norms.values()) == 0.0


def test_ccz4_is_not_silently_evolved_as_bssn() -> None:
    state = CCZ4State1D.minkowski(Grid1D(9, -1.0, 1.0), formulation="ccz4")
    with pytest.raises(ValueError, match="BSSNOK only"):
        bssn_rhs_1d(state)
    diagnostic = bssn_rhs_1d(state, allow_incomplete_ccz4=True)
    assert diagnostic.theta_evolution_supported is False


def test_uniform_trace_k_rhs_matches_vacuum_equations() -> None:
    state = CCZ4State1D.minkowski(Grid1D(9, -1.0, 1.0), formulation="bssnok")
    state.trace_k.fill(0.2)
    rhs = bssn_rhs_1d(state)
    assert np.allclose(rhs.chi, 2.0 * 0.2 / 3.0)
    assert np.allclose(rhs.trace_k, 0.2 * 0.2 / 3.0)
    assert np.allclose(rhs.lapse, -2.0 * 0.2)
    assert np.allclose(rhs.h, 0.0)
    assert np.allclose(rhs.a, 0.0)


def test_conformal_ricci_decomposition_converges_for_nontrivial_chi() -> None:
    errors: list[float] = []
    for points in (32, 64, 128):
        grid = Grid1D(
            points,
            0.0,
            1.0,
            boundary=BoundaryConfig1D(kind="periodic"),
        )
        state = CCZ4State1D.minkowski(grid, formulation="bssnok")
        state.chi[:] = 1.0 - 0.1 * np.sin(2.0 * np.pi * grid.x)
        h_inverse = np.linalg.inv(state.h)
        physical_metric = state.h / state.chi[:, None, None]
        physical_inverse = state.chi[:, None, None] * h_inverse
        direct = _ricci_tensor_1d(physical_metric, physical_inverse, grid)
        reconstructed = _physical_ricci(state, h_inverse)
        errors.append(float(np.sqrt(np.mean((direct - reconstructed) ** 2))))
    assert errors[0] / errors[1] > 3.0
    assert errors[1] / errors[2] > 3.0
