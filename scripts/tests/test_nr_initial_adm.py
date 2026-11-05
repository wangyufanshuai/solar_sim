"""Independent continuum controls, not a finite-difference evolution campaign."""

from dataclasses import fields
from decimal import Decimal, localcontext
import hashlib
import itertools
import json
import os
from pathlib import Path

import numpy as np
import pytest

from science.numerical_relativity import schwarzschild_initial_adm as O
from science.numerical_relativity.fo_ccz4_gauge_pulse import initial_slots
from science.numerical_relativity.fo_ccz4_principal_symbol import _rhs_components
from science.numerical_relativity.fo_ccz4_rhs import _fo_ccz4_volume_rhs_3d
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import GAUGE, CONFIG, PROFILE
from science.numerical_relativity.fo_ccz4_sbp_volume import state_from_slots
from science.numerical_relativity.nr3d import Grid3D

PAIRS = ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))
POINTS = (
    (2.0, 2.0, 2.0),
    (1.7, 2.1, 2.4),
    (2.2, 1.6, 1.9),
    (1.25, 2.0, 2.0),
    (2.75, 1.8, 2.2),
    (1.1, 2.2, 2.0),
)
TOL = O.ABS_TOLERANCE


def close(actual, expected, tol=TOL):
    np.testing.assert_allclose(actual, expected, rtol=0.0, atol=tol)


def state_and_oracle(n=9, amplitude=0.001):
    grid = Grid3D(
        (n,) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4
    )
    q, _ = initial_slots(n, amplitude=amplitude)
    oracle = O.initial_adm(np.stack(grid.coordinates, axis=-1), amplitude)
    return state_from_slots(grid, q), oracle, q


class ExactInitialDerivative:
    """Local callback bound to exact registered buffers, not guessed array values."""

    def __init__(self, state, oracle):
        self.base = state.base
        self.entries = {}
        self.calls = {}
        aux = state.auxiliary
        close(aux.lapse_gradient, oracle.grad_ln_alpha, O.INITIAL_TOLERANCE)
        close(aux.conformal_factor_gradient, oracle.grad_ln_phi, O.INITIAL_TOLERANCE)
        for name, value, hessian in (
            ("A", aux.lapse_gradient, oracle.hess_ln_alpha),
            ("P", aux.conformal_factor_gradient, oracle.hess_ln_phi),
        ):
            derivatives = tuple(hessian[..., axis, :] for axis in range(3))
            self.register(name, value, derivatives)
            for component in range(3):
                self.register(
                    name + "-component",
                    value[..., component],
                    tuple(x[..., component] for x in derivatives),
                )
        for name, value in (
            ("a", state.base.a),
            ("K", state.base.trace_k),
            ("Theta", state.base.theta),
            ("Gamma", state.base.conformal_gamma),
            ("b", state.base.b),
            ("B", aux.shift_gradient),
            ("D", aux.metric_gradient),
        ):
            assert np.count_nonzero(value) == 0
            self.register(name, value, tuple(np.zeros_like(value) for _ in range(3)))
            for index in np.ndindex(value.shape[3:]):
                component = value[(slice(None),) * 3 + index]
                self.register(
                    name + "-component",
                    component,
                    tuple(np.zeros_like(component) for _ in range(3)),
                )

    @staticmethod
    def key(value):
        return (
            value.__array_interface__["data"][0],
            value.shape,
            value.strides,
            value.dtype.str,
        )

    def register(self, name, value, derivatives):
        # Keep buffers alive. Snapshot values so a later mutation is rejected.
        self.entries[self.key(value)] = (name, value, value.copy(), derivatives)

    def __call__(self, value, base, axis):
        if base is not self.base or type(axis) is not int or axis not in (0, 1, 2):
            raise ValueError("registered base and Cartesian axis required")
        if not isinstance(value, np.ndarray) or self.key(value) not in self.entries:
            raise ValueError("unregistered derivative buffer")
        name, original, snapshot, derivatives = self.entries[self.key(value)]
        if not np.array_equal(value, snapshot) or not np.shares_memory(value, original):
            raise ValueError("registered derivative data changed")
        self.calls[name] = self.calls.get(name, 0) + 1
        return derivatives[axis]


@pytest.fixture(scope="session")
def observations():
    rows = []
    yield rows
    location = os.environ.get("NR_INITIAL_ADM_CONTROL_ROOT")
    if location:
        target = Path(location).resolve()
        assert (
            target.parent
            == Path(__file__).resolve().parents[2] / "tmp/nr-shadow-evidence"
        )
        with (target / "initial-adm-observations.json").open(
            "x", encoding="utf-8"
        ) as stream:
            json.dump(
                dict(
                    method=O.METHOD,
                    cases=rows,
                    full_einstein_rhs_validated=False,
                    new_scientific_evolution=False,
                ),
                stream,
                sort_keys=True,
                allow_nan=False,
            )


@pytest.mark.parametrize("n", (9, 13, 17))
@pytest.mark.parametrize("amplitude", (0.0, 0.001, -0.001))
def test_frozen_volume_rhs_matches_independent_initial_adm(n, amplitude, observations):
    state, o, q = state_and_oracle(n, amplitude)
    before = q.tobytes()
    expected_initial = np.zeros_like(q)
    expected_initial[[0, 3, 5]] = 1.0
    expected_initial[6] = o.ln_alpha
    expected_initial[10] = o.ln_phi
    expected_initial[25:28] = np.moveaxis(o.grad_ln_alpha, -1, 0)
    expected_initial[55:58] = np.moveaxis(o.grad_ln_phi, -1, 0)
    close(q, expected_initial, O.INITIAL_TOLERANCE)
    derivative = ExactInitialDerivative(state, o)
    rhs = _fo_ccz4_volume_rhs_3d(
        state,
        gauge=GAUGE,
        config=CONFIG,
        gauge_profile=PROFILE,
        first_derivative=derivative,
    )
    actual = np.array(_rhs_components(rhs))
    expected = np.zeros_like(q)
    for offset, (i, j) in enumerate(PAIRS):
        expected[11 + offset] = o.conformal_a_rate[..., i, j]
    expected[17] = o.trace_k_rate
    close(actual, expected)
    physical = (
        rhs.a + np.eye(3) * rhs.trace_k[..., None, None] / 3.0
    ) / state.base.chi[..., None, None]
    close(physical, o.physical_k_rate)
    close(o.direct_adm_k_rate, o.physical_k_rate)
    assert q.tobytes() == before
    for _, value, snapshot, _ in derivative.entries.values():
        assert np.array_equal(value, snapshot)
    assert {"A", "A-component", "P", "P-component"} <= set(derivative.calls)
    if amplitude:
        assert np.max(np.abs(o.physical_k_rate)) > 1.0e-3
    zero_slots = list(range(11)) + list(range(18, 58))
    observations.append(
        dict(
            n=n,
            amplitude=amplitude,
            initial_sha256=hashlib.sha256(before).hexdigest(),
            initial_error=float(np.max(np.abs(q - expected_initial))),
            canonical58_error=float(np.max(np.abs(actual - expected))),
            physical_k_error=float(np.max(np.abs(physical - o.physical_k_rate))),
            direct_vs_cancellation_error=float(
                np.max(np.abs(o.direct_adm_k_rate - o.physical_k_rate))
            ),
            zero51_error=float(np.max(np.abs(actual[zero_slots]))),
            physical_k_magnitude=float(np.max(np.abs(o.physical_k_rate))),
            derivative_calls=derivative.calls,
        )
    )


@pytest.mark.parametrize("amplitude", (0.0, 0.001, -0.001, 0.01, -0.01))
def test_tensor_identities_and_static_cancellation(amplitude):
    o = O.initial_adm(POINTS, amplitude)
    close(o.physical_k_rate, o.direct_adm_k_rate)
    close(o.ricci, np.swapaxes(o.ricci, -1, -2))
    close(np.trace(o.ricci, axis1=-2, axis2=-1), 0.0)
    close(np.trace(o.conformal_a_rate, axis1=-2, axis2=-1), 0.0)
    close(o.trace_k_rate, o.chi * np.trace(o.physical_k_rate, axis1=-2, axis2=-1))
    close(
        (o.conformal_a_rate + np.eye(3) * o.trace_k_rate[..., None, None] / 3.0)
        / o.chi[..., None, None],
        o.physical_k_rate,
    )
    if amplitude == 0.0:
        assert np.count_nonzero(o.physical_k_rate) == 0


def decimal_jet(point, amplitude, kind):
    """80-digit scalar evaluations + central differences; no analytic jet reuse."""
    with localcontext() as context:
        context.prec = 80
        xyz = [Decimal(str(x)) for x in point]
        eps, a = Decimal("1e-8"), Decimal(str(amplitude))

        def scalar(p):
            radius = sum(x * x for x in p).sqrt()
            if kind == "ln_phi":
                return -2 * (1 + Decimal("0.5") / radius).ln()
            bump = Decimal(1)
            for x in p:
                u = (x - 2) / Decimal(".75")
                bump *= max(1 - u * u, Decimal(0)) ** 6
            return (
                (radius - Decimal(".5")) / (radius + Decimal(".5")) * (a * bump).exp()
            )

        def offset(axes):
            p = xyz.copy()
            for i, direction in axes:
                p[i] += direction * eps
            return scalar(p)

        value = scalar(xyz)
        grad = [(offset([(i, 1)]) - offset([(i, -1)])) / (2 * eps) for i in range(3)]
        hess = np.empty((3, 3))
        for i in range(3):
            hess[i, i] = float(
                (offset([(i, 1)]) - 2 * value + offset([(i, -1)])) / eps**2
            )
            for j in range(i + 1, 3):
                v = sum(
                    Decimal(si * sj) * offset([(i, si), (j, sj)])
                    for si, sj in itertools.product((-1, 1), repeat=2)
                ) / (4 * eps**2)
                hess[i, j] = hess[j, i] = float(v)
        return float(value), np.array([float(x) for x in grad]), hess


@pytest.mark.parametrize("point", POINTS)
@pytest.mark.parametrize("amplitude", (0.0, 0.001, -0.001))
def test_decimal_scalar_differences_check_analytic_jets(point, amplitude):
    o = O.initial_adm(point, amplitude)
    value, gradient, hessian = decimal_jet(point, amplitude, "alpha")
    close(o.alpha, value)
    close(o.grad_alpha, gradient)
    close(o.hess_alpha, hessian)
    value, gradient, hessian = decimal_jet(point, amplitude, "ln_phi")
    close(o.ln_phi, value)
    close(o.grad_ln_phi, gradient)
    close(o.hess_ln_phi, hessian)


@pytest.mark.parametrize("axis", (0, 1, 2))
@pytest.mark.parametrize("value", (1.1, 1.25, 2.75, 2.9))
def test_exact_compact_support_and_boundary_zero(axis, value):
    point = np.array([2.0, 2.0, 2.0])
    point[axis] = value
    o = O.initial_adm(point)
    for data in (o.bump, o.bump_gradient, o.bump_hessian, o.physical_k_rate):
        assert np.count_nonzero(data) == 0


@pytest.mark.parametrize(
    "point",
    (
        [],
        [1, 2],
        [np.nan, 2, 2],
        [1e308, 2, 2],
        [0.9, 2, 2],
        [3.1, 2, 2],
        [True] * 3,
        [2 + 1j] * 3,
        "xyz",
    ),
)
def test_bad_coordinates_rejected(point):
    with pytest.raises(ValueError):
        O.initial_adm(point)


@pytest.mark.parametrize(
    "amplitude", (True, np.float64(0.001), np.nan, np.inf, -0.011, 0.011, "0")
)
def test_bad_amplitude_rejected(amplitude):
    with pytest.raises(ValueError):
        O.initial_adm([2, 2, 2], amplitude)


@pytest.mark.parametrize("permutation", ((1, 0, 2), (2, 1, 0), (1, 2, 0)))
@pytest.mark.parametrize("amplitude", (0.001, -0.001))
def test_cartesian_permutation_covariance(permutation, amplitude):
    point = np.array([1.7, 2.1, 2.4])
    p = list(permutation)
    original, permuted = (
        O.initial_adm(point, amplitude),
        O.initial_adm(point[p], amplitude),
    )
    for name in ("ricci", "physical_k_rate", "conformal_a_rate", "hess_alpha"):
        close(getattr(permuted, name), getattr(original, name)[p][:, p])
    close(permuted.grad_alpha, original.grad_alpha[p])


def test_input_is_not_mutated_and_output_arrays_are_read_only():
    points = np.array(POINTS)
    saved = points.copy()
    oracle = O.initial_adm(points)
    assert np.array_equal(points, saved)
    points[:] = 1.0
    assert np.array_equal(oracle.coordinates, saved)
    for field in fields(oracle):
        value = getattr(oracle, field.name)
        assert not value.flags.writeable
        with pytest.raises(ValueError):
            value.flat[0] = 1.0


@pytest.mark.parametrize(
    "failure", ("unknown", "copy", "base", "axis-bool", "axis-range", "A", "zero", "P")
)
def test_exact_callback_rejects_invalid_or_mutated_inputs(failure):
    state, o, _ = state_and_oracle()
    callback = ExactInitialDerivative(state, o)
    value, base, axis = state.auxiliary.lapse_gradient, state.base, 0
    if failure == "unknown":
        value = np.zeros(state.grid.shape)
    elif failure == "copy":
        value = value.copy()
    elif failure == "base":
        base = object()
    elif failure == "axis-bool":
        axis = False
    elif failure == "axis-range":
        axis = 3
    else:
        if failure == "P":
            value = state.auxiliary.conformal_factor_gradient
        elif failure == "zero":
            value = state.base.a
        value.flat[0] += 0.1
    with pytest.raises(ValueError):
        callback(value, base, axis)


@pytest.mark.parametrize("mutation", ("sign", "missing-chi", "missing-trace-free"))
def test_independent_tensor_oracle_detects_wrong_conformal_mapping(mutation):
    o = O.initial_adm(np.array(POINTS), 0.001)
    expected = o.conformal_a_rate
    wrong = {
        "sign": -expected,
        "missing-chi": o.physical_k_rate
        - np.eye(3) * o.trace_k_rate[..., None, None] / 3.0,
        "missing-trace-free": o.chi[..., None, None] * o.physical_k_rate,
    }[mutation]
    assert np.max(np.abs(wrong - expected)) > 1e-6
    with pytest.raises(AssertionError):
        close(wrong, expected)
