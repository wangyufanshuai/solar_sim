from __future__ import annotations

import numpy as np
import pytest
from pathlib import Path
import runpy

from .ccz4_reference import GaugeConfig
from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER
from .fo_ccz4_analytic_symbol import analytic_fo_ccz4_principal_matrix_3d
from .fo_ccz4_frozen_symbol import (
    frozen_fo_ccz4_principal_matrix_3d as assemble,
    probe_frozen_fo_ccz4_rhs_matrix_3d as probe,
)
from .fo_ccz4_local_principal_proxy_shadow import linearized_fo_ccz4_local_principal_proxy_3d
from .fo_ccz4_rhs import FOCCZ4Config


IDX = {name: index for index, name in enumerate(FOCCZ4_VARIABLE_ORDER)}


def _metric():
    h = np.asarray(((1.1, .13, -.1), (.13, .9, .02), (-.1, .02, 1.2)))
    return h / np.linalg.det(h)**(1.0 / 3.0)


@pytest.mark.parametrize("normal", ((1., 0., 0.), (0., -1., 0.), (1., -2., .3)))
def test_frozen_matrix_matches_independent_flat_assembly(normal):
    n = np.asarray(normal)
    matrix = assemble(np.eye(3), 1., 1., np.zeros(3), n)
    flat = analytic_fo_ccz4_principal_matrix_3d(normal=n)
    np.testing.assert_allclose(matrix, np.linalg.norm(n) * flat, rtol=0., atol=2.e-14)


@pytest.mark.parametrize("profile", ("affine", "sine"))
@pytest.mark.parametrize("strength,shift_coeff", ((1., 1.), (1., .75), (0., .75)))
def test_frozen_nonflat_assembly_matches_actual_rhs(profile, strength, shift_coeff):
    args = (_metric(), .61, .7, np.array((.2, -.1, .05)), np.array((1., -2., .3)))
    params = dict(
        gauge=GaugeConfig(shift_coefficient=shift_coeff, theta_coupling=1.2),
        config=FOCCZ4Config(c=.6, cleaning_speed=1.2, ordering_mu=.8, shift_strength=strength),
    )
    direct = assemble(*args, **params)
    measured = probe(*args, **params, profile=profile)
    np.testing.assert_allclose(direct, measured, rtol=0., atol=2.e-12)
    assert not np.any(direct[:11])
    assert not np.any(direct[:, :11])


def test_lapse_and_conformal_factor_do_not_rescale_gamma_driver():
    args = (np.eye(3), .4, .8, np.array((.03, 0., 0.)), np.array((1., 0., 0.)))
    direct = assemble(*args)
    assert direct[IDX["GammaHat0"], IDX["B00"]] == pytest.approx(4. / 3.)
    assert direct[IDX["B00"], IDX["b0"]] == 1.
    assert direct[IDX["A0"], IDX["K"]] == -2.
    assert direct[IDX["K"], IDX["A0"]] == pytest.approx(-.4 * .8)
    assert np.count_nonzero(direct[:11]) == 0
    # The discarded physical-frame scaling cannot infer h and chi separately.
    legacy, _ = linearized_fo_ccz4_local_principal_proxy_3d(args[0]/args[1], args[2], args[3], args[4])
    assert np.max(np.abs(legacy - direct)) > .1
    assert np.max(np.abs(legacy[:11])) == pytest.approx(.03)


def test_same_physical_metric_with_different_conformal_split_is_not_same_matrix():
    a = assemble(np.eye(3), .5, .8, (0., 0., 0.), (1., 0., 0.))
    b = assemble(2. * np.eye(3), 1., .8, (0., 0., 0.), (1., 0., 0.))
    assert a[IDX["GammaHat0"], IDX["B00"]] == pytest.approx(4./3.)
    assert b[IDX["GammaHat0"], IDX["B00"]] == pytest.approx(2./3.)
    assert np.max(np.abs(a - b)) > .5


def test_frozen_probe_has_centered_source_cancellation_and_amplitude_replay():
    args = (np.eye(3), .6, .8, np.array((.03, 0., 0.)), np.array((1., 0., 0.)))
    p1 = probe(*args, amplitude=1.e-5)
    p2 = probe(*args, amplitude=5.e-6)
    p3 = probe(*args, amplitude=1.e-5)
    assert np.array_equal(p1, p3)
    np.testing.assert_allclose(p1, p2, rtol=0., atol=2.e-12)
    # If the ramp were not zero at the sampled point, source terms would leak
    # into the ODE rows. In particular ln(alpha)_t contains +4*Theta.
    assert np.count_nonzero(p1[:11]) == 0
    assert p1[IDX["ln_alpha"], IDX["Theta"]] == 0.


def test_normal_covector_linearity_and_orientation():
    args = (_metric(), .61, .7, (.2, -.1, .05))
    nx, ny = np.array((1., 0., 0.)), np.array((0., 1., 0.))
    ax, ay = assemble(*args, nx), assemble(*args, ny)
    np.testing.assert_allclose(assemble(*args, 2.*nx-3.*ny), 2.*ax-3.*ay, rtol=0., atol=2.e-14)
    np.testing.assert_allclose(assemble(*args, -nx), -ax, rtol=0., atol=2.e-14)


@pytest.mark.parametrize("method", (assemble, probe))
def test_frozen_assembly_rejects_invalid_coefficients(method):
    with pytest.raises(ValueError, match="positive definite"):
        method(np.diag((-1., 1., 1.)), 1., 1., (0., 0., 0.), (1., 0., 0.))
    with pytest.raises(ValueError, match="chi"):
        method(np.eye(3), 0., 1., (0., 0., 0.), (1., 0., 0.))
    with pytest.raises(ValueError, match="lapse"):
        method(np.eye(3), 1., float("nan"), (0., 0., 0.), (1., 0., 0.))
    with pytest.raises(ValueError, match="normal_covector"):
        method(np.eye(3), 1., 1., (0., 0., 0.), (0., 0., 0.))


def test_probe_preserves_input_arrays_and_rejects_large_perturbation():
    h, beta, n = _metric(), np.array((.2, -.1, .05)), np.array((1., -2., .3))
    before = [arr.copy() for arr in (h, beta, n)]
    probe(h, .6, .8, beta, n)
    for original, expected in zip((h, beta, n), before):
        np.testing.assert_array_equal(original, expected)
    with pytest.raises(ValueError, match="amplitude too large"):
        probe(h, .6, .8, beta, n, amplitude=1.)


def test_proxy_crosscheck_driver_freezes_h_and_chi_separately():
    driver = runpy.run_path(str(Path(__file__).resolve().parents[2] / "scripts/run-nr-k3-fo-ccz4-local-principal-proxy.py"))
    h = _metric()
    beta = np.array((.2, -.1, .05))
    gauge, config = GaugeConfig(theta_coupling=2.), FOCCZ4Config(kappa1=0.)
    actual = driver["_actual_constant_background_symbol"](
        h, .7, beta, chi=.61, axis=1, side=-1, gauge=gauge, config=config,
    )
    expected = assemble(h, .61, .7, beta, (0., -1., 0.), gauge=gauge, config=config)
    wrong_split = assemble(h/.61, 1., .7, beta, (0., -1., 0.), gauge=gauge, config=config)
    np.testing.assert_allclose(actual, expected, rtol=0., atol=2.e-12)
    assert np.max(abs(actual-wrong_split)) > .1
