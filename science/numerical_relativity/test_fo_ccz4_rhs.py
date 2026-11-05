from __future__ import annotations

import numpy as np
import pytest

from .ccz4_reference import GaugeConfig
from .ccz4_3d import ccz4_rhs_3d
from .fo_ccz4_rhs import (
    FOCCZ4Config,
    FOCCZ4RobustStabilityReport3D,
    FOCCZ4State3D,
    advance_fo_ccz4_rk4_3d,
    fo_ccz4_robust_stability_campaign_3d,
    fo_ccz4_rhs_3d,
)
from .fo_ccz4 import FOCCZ4Auxiliary3D
from .bssn3d import _d1
from .nr3d import BSSNState3D, Grid3D


def _grid(points: int = 7) -> Grid3D:
    return Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
        spatial_order=2,
    )


def _finite_rhs(rhs: object) -> bool:
    return all(
        np.all(np.isfinite(getattr(rhs, name)))
        for name in (
            "h",
            "ln_lapse",
            "shift",
            "ln_phi",
            "a",
            "trace_k",
            "theta",
            "conformal_gamma",
            "b",
            "lapse_gradient",
            "shift_gradient",
            "metric_gradient",
            "conformal_factor_gradient",
        )
    )


def test_fo_ccz4_rhs_minkowski_is_exactly_zero() -> None:
    state = FOCCZ4State3D.from_bssn_state(BSSNState3D.minkowski(_grid()))
    rhs = fo_ccz4_rhs_3d(state)
    assert _finite_rhs(rhs)
    assert all(
        np.array_equal(getattr(rhs, name), np.zeros_like(getattr(rhs, name)))
        for name in (
            "h",
            "ln_lapse",
            "shift",
            "ln_phi",
            "a",
            "trace_k",
            "theta",
            "conformal_gamma",
            "b",
            "lapse_gradient",
            "shift_gradient",
            "metric_gradient",
            "conformal_factor_gradient",
        )
    )


def test_fo_ccz4_rhs_gauge_wave_is_deterministic_and_finite() -> None:
    base = BSSNState3D.gauge_wave(_grid(9), amplitude=1.0e-3, wavelength=1.0)
    first = fo_ccz4_rhs_3d(FOCCZ4State3D.from_bssn_state(base))
    second = fo_ccz4_rhs_3d(FOCCZ4State3D.from_bssn_state(base))
    assert _finite_rhs(first)
    assert all(
        np.array_equal(getattr(first, name), getattr(second, name))
        for name in (
            "h",
            "ln_lapse",
            "shift",
            "ln_phi",
            "a",
            "trace_k",
            "theta",
            "conformal_gamma",
            "b",
            "lapse_gradient",
            "shift_gradient",
            "metric_gradient",
            "conformal_factor_gradient",
        )
    )


def test_fo_ccz4_rhs_handles_three_dimensional_shift_perturbation() -> None:
    grid = _grid(7)
    state = BSSNState3D.minkowski(grid)
    x, y, z = grid.coordinates
    phase = 2.0 * np.pi * (x + 2.0 * y + 3.0 * z)
    amplitude = 1.0e-5
    state.shift[..., 0] = amplitude * np.sin(phase)
    state.shift[..., 1] = amplitude * np.cos(phase)
    state.shift[..., 2] = amplitude * np.sin(phase + 0.3)
    state.b[..., 0] = amplitude * np.cos(phase)
    state.b[..., 1] = amplitude * np.sin(phase)
    state.b[..., 2] = amplitude * np.cos(phase + 0.3)
    state.conformal_gamma[..., 0] = amplitude * np.sin(phase)
    state.conformal_gamma[..., 1] = amplitude * np.cos(phase)
    state.conformal_gamma[..., 2] = amplitude * np.sin(phase + 0.3)
    first = fo_ccz4_rhs_3d(FOCCZ4State3D.from_bssn_state(state))
    second = fo_ccz4_rhs_3d(FOCCZ4State3D.from_bssn_state(state))
    assert _finite_rhs(first)
    assert float(np.max(np.abs(first.shift))) > 0.0
    assert all(
        np.array_equal(getattr(first, name), getattr(second, name))
        for name in (
            "h",
            "ln_lapse",
            "shift",
            "ln_phi",
            "a",
            "trace_k",
            "theta",
            "conformal_gamma",
            "b",
            "lapse_gradient",
            "shift_gradient",
            "metric_gradient",
            "conformal_factor_gradient",
        )
    )


def test_fo_ccz4_rk4_shadow_preserves_positive_log_fields() -> None:
    state = FOCCZ4State3D.from_bssn_state(
        BSSNState3D.gauge_wave(_grid(7), amplitude=1.0e-4, wavelength=1.0)
    )
    evolved = advance_fo_ccz4_rk4_3d(
        state,
        1.0e-5,
        steps=2,
        gauge=GaugeConfig(theta_coupling=2.0),
        config=FOCCZ4Config(),
    )
    assert np.all(np.isfinite(evolved.base.chi))
    assert np.all(np.isfinite(evolved.base.lapse))
    assert np.all(evolved.base.chi > 0.0)
    assert np.all(evolved.base.lapse > 0.0)
    assert evolved.base.valid_mask.all()
    assert evolved.auxiliary.source_state_sha256 != ""


def test_fo_ccz4_seeded_robust_stability_is_deterministic_and_bounded() -> None:
    first = fo_ccz4_robust_stability_campaign_3d(
        points=7,
        dt=1.0e-3,
        checkpoints=(1, 2),
        amplitude=1.0e-7,
        seed=17,
    )
    second = fo_ccz4_robust_stability_campaign_3d(
        points=7,
        dt=1.0e-3,
        checkpoints=(1, 2),
        amplitude=1.0e-7,
        seed=17,
    )
    assert isinstance(first, FOCCZ4RobustStabilityReport3D)
    assert first.passed and second.passed
    assert first == second
    assert all(sample.constraint_norms_finite for sample in first.samples)
    assert all(sample.finite_positive_state for sample in first.samples)
    assert all(sample.growth_ratio <= first.growth_limit for sample in first.samples)


def test_fo_ccz4_config_rejects_nonphysical_parameter_ranges() -> None:
    with pytest.raises(ValueError, match="cleaning_speed"):
        FOCCZ4Config(cleaning_speed=0.0)
    with pytest.raises(ValueError, match="ordering_mu"):
        FOCCZ4Config(ordering_mu=0.0)
    with pytest.raises(ValueError, match="shift_strength"):
        FOCCZ4Config(shift_strength=0.5)


def test_fo_ccz4_shift_gradient_ordering_curl_sign_matches_table_one() -> None:
    """Lock the FO-CCZ4 B_k^i ordering sign to the published PDE table.

    A pure P_1 field on Minkowski isolates the ``+alpha^2 mu curl_P`` RHS
    contribution in the B equation.  The test deliberately bypasses the auxiliary builder so
    that it probes the RHS algebra rather than only the derivative-constraint
    construction.
    """

    base = BSSNState3D.minkowski(_grid(9))
    source = FOCCZ4State3D.from_bssn_state(base).auxiliary
    lapse_gradient = np.array(source.lapse_gradient, copy=True)
    shift_gradient = np.array(source.shift_gradient, copy=True)
    metric_gradient = np.array(source.metric_gradient, copy=True)
    conformal_factor_gradient = np.array(source.conformal_factor_gradient, copy=True)
    x, _, _ = base.grid.coordinates
    conformal_factor_gradient[..., 1] = np.sin(2.0 * np.pi * x)
    auxiliary = FOCCZ4Auxiliary3D(
        lapse_gradient=lapse_gradient,
        shift_gradient=shift_gradient,
        metric_gradient=metric_gradient,
        conformal_factor_gradient=conformal_factor_gradient,
        derivative_order=source.derivative_order,
        source_state_sha256=source.source_state_sha256,
    )
    state = FOCCZ4State3D(base, auxiliary)
    tiny_mu = 1.0e-12
    rhs_without_ordering = fo_ccz4_rhs_3d(
        state, config=FOCCZ4Config(ordering_mu=tiny_mu)
    )
    rhs_with_ordering = fo_ccz4_rhs_3d(
        state, config=FOCCZ4Config(ordering_mu=1.0)
    )
    # Remove the tiny baseline ordering term with a second evaluation at the
    # same coefficient; this keeps the test within the positive-mu contract.
    rhs_baseline = fo_ccz4_rhs_3d(
        state, config=FOCCZ4Config(ordering_mu=tiny_mu)
    )
    expected_curl_p = (1.0 - tiny_mu) * _d1(conformal_factor_gradient[..., 1], base, 0)
    observed = rhs_with_ordering.shift_gradient[..., 0, 1] - rhs_baseline.shift_gradient[..., 0, 1]
    assert np.allclose(observed, expected_curl_p, rtol=0.0, atol=2.0e-13)
    assert np.all(np.isfinite(rhs_without_ordering.shift_gradient))


def test_fo_ccz4_geometric_rhs_crosscheck_refines_against_second_order_path() -> None:
    errors: list[tuple[float, float, float]] = []
    for points in (7, 9, 13):
        base = BSSNState3D.gauge_wave(
            _grid(points), amplitude=1.0e-4, wavelength=1.0
        )
        first_order = fo_ccz4_rhs_3d(FOCCZ4State3D.from_bssn_state(base))
        second_order = ccz4_rhs_3d(base)
        errors.append(
            (
                float(np.max(np.abs(first_order.a - second_order.a))),
                float(np.max(np.abs(first_order.trace_k - second_order.trace_k))),
                float(np.max(np.abs(first_order.theta - second_order.theta))),
            )
        )
    assert errors[1][0] < errors[0][0] and errors[2][0] < errors[1][0]
    assert errors[1][1] < errors[0][1] and errors[2][1] < errors[1][1]
    assert errors[1][2] < errors[0][2] and errors[2][2] < errors[1][2]


def test_fo_ccz4_sommerfeld_proxy_is_explicit_and_finite() -> None:
    grid = Grid3D(
        (9, 9, 9),
        (-1.0, -1.0, -1.0),
        (1.0, 1.0, 1.0),
        boundary="sommerfeld",
        spatial_order=2,
    )
    state = FOCCZ4State3D.from_bssn_state(BSSNState3D.minkowski(grid))
    with pytest.raises(ValueError, match="sommerfeld-proxy"):
        fo_ccz4_rhs_3d(state)
    rhs = fo_ccz4_rhs_3d(state, boundary_mode="sommerfeld-proxy")
    assert _finite_rhs(rhs)
    evolved = advance_fo_ccz4_rk4_3d(
        state,
        1.0e-3,
        steps=1,
        gauge=GaugeConfig(shift_coefficient=1.0, shift_damping=0.0),
        config=FOCCZ4Config(kappa1=0.0),
        boundary_mode="sommerfeld-proxy",
    )
    assert np.all(np.isfinite(evolved.base.lapse))
    assert np.all(evolved.base.lapse > 0.0)
    assert evolved.base.valid_mask.all()


def test_fo_ccz4_periodic_path_rejects_sommerfeld_proxy() -> None:
    state = FOCCZ4State3D.from_bssn_state(BSSNState3D.minkowski(_grid()))
    with pytest.raises(ValueError, match="periodic"):
        fo_ccz4_rhs_3d(state, boundary_mode="sommerfeld-proxy")
