"""Analytic, physical-invariance, and malformed-data controls for lapse pulses."""
from fractions import Fraction
import math

import numpy as np
import pytest

from .fo_ccz4_gauge_pulse import CHANGED_SLOTS, compact_lapse_bump, identity, initial_slots
from .fo_ccz4_sbp_nonlinear import NonlinearSBPCube
from .nr3d import Grid3D
from .sbp_metric_geometry import constraints_from_slots


@pytest.mark.parametrize("n", [9, 13, 17])
def test_only_gauge_slots_change_and_six_faces_stay_exact(n):
    q, reference = initial_slots(n)
    keep = [k for k in range(58) if k not in CHANGED_SLOTS]
    assert np.array_equal(q[keep], reference[keep])
    assert not np.shares_memory(q, reference) and np.max(abs(q-reference)) > 0.
    grid = Grid3D((n,)*3, (1.,)*3, (3.,)*3, boundary="sbp-volume", spatial_order=4)
    driver = NonlinearSBPCube(grid)
    for pulse_face, old_face in zip(driver.boundary_targets(q), driver.boundary_targets(reference), strict=True):
        assert pulse_face.tobytes() == old_face.tobytes()
    a, b = driver.state(q).base, driver.state(reference).base
    assert np.array_equal(a.h/a.chi[..., None, None], b.h/b.chi[..., None, None])
    assert np.array_equal(a.a, b.a) and not np.any(a.a) and not np.any(a.trace_k)
    assert np.all(a.lapse > 0.) and np.max(abs(q[6]-reference[6])) <= .001+1.e-16


@pytest.mark.parametrize("n", [9, 13, 17])
def test_independent_physical_constraints_unchanged_not_forced_to_zero(n):
    q, reference = initial_slots(n)
    a, b = (constraints_from_slots(x, (2./(n-1),)*3) for x in (q, reference))
    for key in ("H_metric_hessian", "M_metric"):
        assert np.array_equal(a[key], b[key])
    # Spatial truncation in H is retained, not overwritten with the continuum zero.
    assert np.max(abs(a["H_metric_hessian"])) > 1.e-10
    assert np.array_equal(a["M_metric"], np.zeros_like(a["M_metric"]))


def test_bump_and_gradient_against_exact_rational_polynomial():
    points = (Fraction(7, 4), Fraction(9, 4), Fraction(2))
    u = [(x-2)/Fraction(3, 4) for x in points]
    f = [(1-x*x)**6 for x in u]
    expected = math.prod(f)
    derivative = [-12*u[k]/Fraction(3, 4)*(1-u[k]**2)**5
                  *f[(k+1) % 3]*f[(k+2) % 3] for k in range(3)]
    actual, gradient = compact_lapse_bump(tuple(np.array(float(x)) for x in points))
    assert actual == pytest.approx(float(expected), abs=4.e-16)
    assert gradient == pytest.approx([float(x) for x in derivative], abs=2.e-15)


@pytest.mark.parametrize("x", [0., 1., 1.25, 2.75, 3., 4.])
def test_outside_and_support_edge_are_exact_zero(x):
    value, gradient = compact_lapse_bump((np.array(x), np.array(2.), np.array(2.)))
    assert value == 0. and not np.any(gradient)


def test_center_peak_zero_gradient_and_zero_amplitude_control():
    value, gradient = compact_lapse_bump(tuple(np.array(2.) for _ in range(3)))
    assert value == 1. and not np.any(gradient)
    q, reference = initial_slots(13, amplitude=0.)
    assert q.tobytes() == reference.tobytes()
    info = identity()
    assert info["physical_metric_unchanged"] and info["physical_extrinsic_curvature_unchanged"]
    assert not info["einstein_constraint_solve"] and not info["analytic_positive_time_solution"]
    assert not info["gravitational_radiation_injected"] and not info["scientificPayloadWriteback"]


@pytest.mark.parametrize("value", [True, "0.001", .1, math.nan, math.inf, 1j])
def test_bad_amplitude_rejected(value):
    with pytest.raises(ValueError):
        initial_slots(13, amplitude=value)


@pytest.mark.parametrize("value", [8, 18, 13., True])
def test_unsupported_grid_rejected(value):
    with pytest.raises(ValueError):
        initial_slots(value)


@pytest.mark.parametrize("xyz", [(1., 2.), (np.ones(2), np.ones(3), np.ones(2)),
                                 (np.array(math.nan), np.array(2.), np.array(2.)),
                                 (np.array(1j), np.array(2.), np.array(2.))])
def test_malformed_coordinates_rejected(xyz):
    with pytest.raises(ValueError):
        compact_lapse_bump(xyz)
