"""Nonlinear physical-metric controls; no new time evolution or native calls."""

import ast
from dataclasses import fields, replace
import json
import os
from pathlib import Path

import numpy as np
import pytest

from science.numerical_relativity import continuum_adm as O
from science.numerical_relativity.fo_ccz4_principal_symbol import _rhs_components
from science.numerical_relativity.fo_ccz4_rhs import _fo_ccz4_volume_rhs_3d
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import GAUGE, CONFIG, PROFILE
from science.numerical_relativity.fo_ccz4_sbp_volume import state_from_slots
from science.numerical_relativity.nr3d import Grid3D


def close(actual, expected, tolerance=O.TOLERANCE):
    np.testing.assert_allclose(actual, expected, rtol=0.0, atol=tolerance)


def rotation(index):
    a, b = ((0.0, 0.0), (0.37, -0.41), (-0.53, 0.29))[index]
    z = np.array(
        [[np.cos(a), -np.sin(a), 0.0], [np.sin(a), np.cos(a), 0.0], [0.0, 0.0, 1.0]]
    )
    y = np.array(
        [[np.cos(b), 0.0, np.sin(b)], [0.0, 1.0, 0.0], [-np.sin(b), 0.0, np.cos(b)]]
    )
    return z @ y


def manufactured(points, sign=1.0, orientation=2):
    """Deterministic analytic, generally constraint-violating physical fields."""
    x = np.asarray(points) - 2.0
    q = rotation(orientation)
    dyads = np.einsum("ai,aj->aij", q, q)
    linear = np.array([[0.03, 0.02, -0.01], [-0.01, 0.04, 0.015], [0.02, -0.025, 0.02]])
    quadratic = np.zeros((3, 3, 3))
    quadratic[0, 0, 1] = quadratic[0, 1, 0] = 0.005
    quadratic[1, 1, 2] = quadratic[1, 2, 1] = 0.007
    quadratic[2, 0, 2] = quadratic[2, 2, 0] = 0.004
    u = (
        np.array([0.04, -0.02, 0.01])
        + np.einsum("ai,...i->...a", linear, x)
        + 0.5 * np.einsum("aij,...i,...j->...a", quadratic, x, x)
    )
    du = linear + np.einsum("aij,...j->...ai", quadratic, x)
    diagonal = np.exp(2.0 * u)
    g = np.einsum("...a,aij->...ij", diagonal, dyads)
    dg = np.einsum("...a,...as,aij->...sij", 2.0 * diagonal, du, dyads)
    ddg = np.einsum(
        "...a,...ast,aij->...stij",
        diagonal,
        4.0 * du[..., :, :, None] * du[..., :, None, :] + 2.0 * quadratic,
        dyads,
    )
    k = sign * (
        np.array(
            [[0.021, 0.009, -0.006], [0.009, -0.018, 0.008], [-0.006, 0.008, 0.035]]
        )
        + 0.007 * x[..., :, None] * x[..., None, :]
        + 0.002 * np.sum(x, axis=-1)[..., None, None] * np.eye(3)
    )
    dk = np.empty((*x.shape[:-1], 3, 3, 3))
    for s in range(3):
        e = np.eye(3)[s]
        dk[..., s, :, :] = sign * (
            0.007 * (e[:, None] * x[..., None, :] + x[..., :, None] * e[None, :])
            + 0.002 * np.eye(3)
        )
    l_hessian = np.array(
        [[0.006, 0.006, 0.0], [0.006, 0.0, -0.004], [0.0, -0.004, 0.0]]
    )
    l_gradient = np.array([0.023, -0.020, 0.015]) + np.einsum(
        "ij,...j->...i", l_hessian, x
    )
    logalpha = (
        -0.1
        + np.einsum("i,...i->...", [0.023, -0.020, 0.015], x)
        + 0.5 * np.einsum("ij,...i,...j->...", l_hessian, x, x)
    )
    alpha = np.exp(logalpha)
    dalpha = alpha[..., None] * l_gradient
    ddalpha = alpha[..., None, None] * (
        l_hessian + l_gradient[..., :, None] * l_gradient[..., None, :]
    )
    beta_linear = np.array(
        [[0.013, 0.007, -0.009], [-0.004, 0.011, 0.005], [0.006, -0.008, 0.014]]
    )
    beta_quadratic = np.array(
        [
            [[0.006, -0.003, 0.002], [0.002, 0.004, -0.001], [-0.004, 0.001, 0.003]],
            [[0.002, 0.004, -0.001], [-0.002, 0.005, 0.003], [0.001, -0.003, 0.002]],
            [[-0.004, 0.001, 0.003], [0.001, -0.003, 0.002], [0.004, 0.002, -0.005]],
        ]
    )
    beta = (
        np.array([0.012, -0.016, 0.019])
        + np.einsum("si,...s->...i", beta_linear, x)
        + 0.5 * np.einsum("sti,...s,...t->...i", beta_quadratic, x, x)
    )
    dbeta = beta_linear + np.einsum("sti,...t->...si", beta_quadratic, x)
    ddbeta = np.broadcast_to(beta_quadratic, (*x.shape[:-1], 3, 3, 3)).copy()
    driver_linear = np.array(
        [[0.002, -0.004, 0.003], [0.005, 0.002, -0.001], [-0.003, 0.001, 0.004]]
    )
    driver = np.array([0.018, -0.014, 0.022]) + np.einsum(
        "si,...s->...i", driver_linear, x
    )
    ddriver = np.broadcast_to(driver_linear, (*x.shape[:-1], 3, 3)).copy()
    return O.PhysicalJet(
        g, dg, ddg, k, dk, alpha, dalpha, ddalpha, beta, dbeta, ddbeta, driver, ddriver
    )


def zero_fields(gamma, extrinsic=None):
    shape = np.shape(gamma)[:-2]

    def z(*tail):
        return np.zeros(shape + tail)

    return O.PhysicalJet(
        gamma,
        z(3, 3, 3),
        z(3, 3, 3, 3),
        z(3, 3) if extrinsic is None else extrinsic,
        z(3, 3, 3),
        np.ones(shape),
        z(3),
        z(3, 3),
        z(3),
        z(3, 3),
        z(3, 3, 3),
        z(3),
        z(3, 3),
    )


def unpack(q):
    shape = q.shape[1:]
    h, a, d = (
        np.zeros((*shape, 3, 3)),
        np.zeros((*shape, 3, 3)),
        np.zeros((*shape, 3, 3, 3)),
    )
    for index, (i, j) in enumerate(O.PAIRS):
        h[..., i, j] = h[..., j, i] = q[index]
        a[..., i, j] = a[..., j, i] = q[11 + index]
        for s in range(3):
            d[..., s, i, j] = d[..., s, j, i] = q[37 + 6 * s + index]
    return dict(
        h=h,
        a=a,
        K=q[17],
        Theta=q[18],
        Gamma=np.moveaxis(q[19:22], 0, -1),
        b=np.moveaxis(q[22:25], 0, -1),
        A=np.moveaxis(q[25:28], 0, -1),
        B=np.moveaxis(q[28:37], 0, -1).reshape((*shape, 3, 3)),
        D=d,
        P=np.moveaxis(q[55:58], 0, -1),
    )


class ExactPhysicalDerivative:
    def __init__(self, state, oracle):
        self.base, self.entries, self.calls = state.base, {}, 0
        aux = state.auxiliary
        actual = dict(
            h=state.base.h,
            a=state.base.a,
            K=state.base.trace_k,
            Theta=state.base.theta,
            Gamma=state.base.conformal_gamma,
            b=state.base.b,
            A=aux.lapse_gradient,
            B=aux.shift_gradient,
            D=aux.metric_gradient,
            P=aux.conformal_factor_gradient,
        )
        values, gradients = (
            unpack(oracle.slots),
            [unpack(dq) for dq in oracle.slot_gradients],
        )
        for name, array in actual.items():
            close(array, values[name])
            self.register(array, tuple(g[name] for g in gradients))
            for index in np.ndindex(array.shape[3:]):
                view = (slice(None),) * 3 + index
                self.register(array[view], tuple(g[name][view] for g in gradients))

    @staticmethod
    def key(value):
        return (
            value.__array_interface__["data"][0],
            value.shape,
            value.strides,
            value.dtype.str,
        )

    def register(self, value, derivatives):
        self.entries[self.key(value)] = (value, value.copy(), derivatives)

    def __call__(self, value, base, axis):
        if base is not self.base or type(axis) is not int or axis not in (0, 1, 2):
            raise ValueError("registered base and axis required")
        if not isinstance(value, np.ndarray) or self.key(value) not in self.entries:
            raise ValueError("unregistered buffer")
        original, saved, derivatives = self.entries[self.key(value)]
        if not np.shares_memory(value, original) or not np.array_equal(value, saved):
            raise ValueError("registered buffer changed")
        self.calls += 1
        return derivatives[axis]


@pytest.fixture(scope="session")
def observations():
    rows = []
    yield rows
    location = os.environ.get("NR_CONTINUUM_ADM_CONTROL_ROOT")
    if location:
        target = Path(location).resolve()
        assert (
            target.parent
            == Path(__file__).resolve().parents[2] / "tmp/nr-shadow-evidence"
        )
        with (target / "continuum-adm-observations.json").open(
            "x", encoding="utf-8"
        ) as stream:
            json.dump(
                dict(
                    method=O.METHOD,
                    cases=rows,
                    general_nonzero_z4_validated=False,
                    new_scientific_evolution=False,
                ),
                stream,
                sort_keys=True,
                allow_nan=False,
            )


@pytest.mark.parametrize("orientation", (0, 1, 2))
@pytest.mark.parametrize("sign", (-1.0, 1.0))
def test_full58_matches_independent_physical_adm(sign, orientation, observations):
    grid = Grid3D(
        (9,) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4
    )
    jet = manufactured(np.stack(grid.coordinates, axis=-1), sign, orientation)
    oracle = O.evaluate(jet)
    state = state_from_slots(grid, oracle.slots)
    close(state.base.h / state.base.chi[..., None, None], jet.gamma)
    close(
        (state.base.a + state.base.h * state.base.trace_k[..., None, None] / 3.0)
        / state.base.chi[..., None, None],
        jet.extrinsic,
    )
    callback = ExactPhysicalDerivative(state, oracle)
    rhs = _fo_ccz4_volume_rhs_3d(
        state,
        gauge=GAUGE,
        config=CONFIG,
        gauge_profile=PROFILE,
        first_derivative=callback,
    )
    actual = np.array(_rhs_components(rhs))
    close(actual, oracle.rhs)
    gdot = (rhs.h - 2.0 * state.base.h * rhs.ln_phi[..., None, None]) / state.base.chi[
        ..., None, None
    ]
    kdot = (
        rhs.a
        + rhs.h * state.base.trace_k[..., None, None] / 3.0
        + state.base.h * rhs.trace_k[..., None, None] / 3.0
    ) / state.base.chi[..., None, None] - 2.0 * jet.extrinsic * rhs.ln_phi[
        ..., None, None
    ]
    close(gdot, oracle.gamma_rate)
    close(kdot, oracle.extrinsic_rate)
    for array, saved, _ in callback.entries.values():
        assert np.array_equal(array, saved)
    assert np.max(np.abs(oracle.hamiltonian)) > 1e-4
    assert np.max(np.abs(oracle.momentum)) > 1e-4
    assert np.max(np.abs(oracle.momentum_gamma_feedback)) > 1e-4
    assert np.max(np.abs(oracle.shift_coefficient_gradient_term)) > 1e-5
    per_slot = np.max(np.abs(actual - oracle.rhs), axis=(1, 2, 3))
    observations.append(
        dict(
            orientation=orientation,
            extrinsic_sign=sign,
            canonical58_error=float(np.max(per_slot)),
            per_slot_errors=per_slot.tolist(),
            physical_metric_rate_error=float(np.max(np.abs(gdot - oracle.gamma_rate))),
            physical_extrinsic_rate_error=float(
                np.max(np.abs(kdot - oracle.extrinsic_rate))
            ),
            hamiltonian_magnitude=float(np.max(np.abs(oracle.hamiltonian))),
            momentum_magnitude=float(np.max(np.abs(oracle.momentum))),
            momentum_feedback_magnitude=float(
                np.max(np.abs(oracle.momentum_gamma_feedback))
            ),
            gauge_product_magnitude=float(
                np.max(np.abs(oracle.shift_coefficient_gradient_term))
            ),
            derivative_calls=callback.calls,
        )
    )


@pytest.mark.parametrize("curvature", (-0.05, 0.0, 0.05))
def test_known_constant_curvature_geometry(curvature):
    x = np.array([[0.3, -0.4, 0.2], [-0.6, 0.1, 0.7], [0.2, 0.5, -0.8]])
    d = 1.0 + curvature * np.sum(x * x, axis=-1)
    scalar = 4.0 / d**2
    gradient = -16.0 * curvature * x / d[..., None] ** 3
    hessian = (
        -16.0 * curvature * np.eye(3) / d[..., None, None] ** 3
        + 96.0
        * curvature**2
        * x[..., :, None]
        * x[..., None, :]
        / d[..., None, None] ** 4
    )
    jet = zero_fields(scalar[..., None, None] * np.eye(3))
    jet = replace(
        jet,
        dgamma=gradient[..., :, None, None] * np.eye(3),
        ddgamma=hessian[..., :, :, None, None] * np.eye(3),
    )
    oracle = O.evaluate(jet)
    close(oracle.ricci, 2.0 * curvature * jet.gamma)
    close(oracle.hamiltonian, 6.0 * curvature)
    close(oracle.momentum, 0.0)


@pytest.mark.parametrize(
    "exponents", ((-1 / 3, 2 / 3, 2 / 3), (0.0, 0.0, 1.0), (-2 / 7, 3 / 7, 6 / 7))
)
@pytest.mark.parametrize("time", (0.5, 1.0, 2.0))
def test_kasner_instantaneous_physical_rates(exponents, time):
    p, q = np.array(exponents), rotation(2)
    close(np.sum(p), 1.0)
    close(np.sum(p * p), 1.0)

    def transform(diagonal):
        return q.T @ np.diag(diagonal) @ q

    jet = zero_fields(
        transform(time ** (2.0 * p)), transform(-p * time ** (2.0 * p - 1.0))
    )
    oracle = O.evaluate(jet)
    close(oracle.gamma_rate, transform(2.0 * p * time ** (2.0 * p - 1.0)))
    close(
        oracle.extrinsic_rate, transform(-p * (2.0 * p - 1.0) * time ** (2.0 * p - 2.0))
    )
    close(oracle.hamiltonian, 0.0)
    close(oracle.momentum, 0.0)
    # Proper-time Kasner lapse is not a positive-time solution of this gauge.
    close(oracle.rhs[6], 2.0 / time)


def numerical_gradient(function, points, axis):
    direction = np.eye(3)[axis] * 0.001
    return (
        function(points - 2 * direction)
        - 8 * function(points - direction)
        + 8 * function(points + direction)
        - function(points + 2 * direction)
    ) / 0.012


@pytest.mark.parametrize("axis", (0, 1, 2))
@pytest.mark.parametrize("orientation", (0, 1, 2))
def test_analytic_slot_jets_against_five_point_differences(axis, orientation):
    points = np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]])
    o = O.evaluate(manufactured(points, orientation=orientation))
    numerical = numerical_gradient(
        lambda p: O.evaluate(manufactured(p, orientation=orientation)).slots,
        points,
        axis,
    )
    close(o.slot_gradients[axis], numerical, 2e-11)


@pytest.mark.parametrize("axis", (0, 1, 2))
@pytest.mark.parametrize("sign", (-1.0, 1.0))
def test_auxiliary_rates_are_derivatives_of_base_rates(axis, sign):
    points = np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]])
    o = O.evaluate(manufactured(points, sign))
    d = numerical_gradient(
        lambda p: O.evaluate(manufactured(p, sign)).rhs, points, axis
    )
    close(o.rhs[25 + axis], d[6], 2e-11)
    close(o.rhs[28 + 3 * axis : 31 + 3 * axis], d[7:10], 2e-11)
    close(o.rhs[37 + 6 * axis : 43 + 6 * axis], 0.5 * d[:6], 2e-11)
    close(o.rhs[55 + axis], d[10], 2e-11)


@pytest.mark.parametrize(
    "omission", ("momentum", "gauge-product", "extrinsic-quadratic")
)
def test_nonzero_feedback_and_nonlinear_omission_negative_controls(omission):
    j = manufactured(np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]]))
    o = O.evaluate(j)
    if omission == "momentum":
        delta = o.momentum_gamma_feedback
    elif omission == "gauge-product":
        delta = o.shift_coefficient_gradient_term
    else:
        delta = (
            2.0
            * j.alpha[..., None, None]
            * j.extrinsic
            @ np.linalg.inv(j.gamma)
            @ j.extrinsic
        )
    assert np.max(np.abs(delta)) > 1e-5
    with pytest.raises(AssertionError):
        close(delta, np.zeros_like(delta))


@pytest.mark.parametrize(
    "bad",
    (
        "spd",
        "alpha-zero",
        "alpha-two",
        "nan",
        "complex",
        "symmetry",
        "ddgamma",
        "ddbeta",
        "shape",
        "infinity",
    ),
)
def test_invalid_physical_jets_rejected(bad):
    j = manufactured(np.array([1.6, 2.1, 2.4]))
    name, value = "gamma", j.gamma.copy()
    if bad == "spd":
        value[0, 0] = -1.0
    elif bad.startswith("alpha"):
        name, value = "alpha", np.array(0.0 if bad == "alpha-zero" else 2.0)
    elif bad == "nan":
        value[0, 0] = np.nan
    elif bad == "complex":
        value = value.astype(complex)
    elif bad == "symmetry":
        value[0, 1] += 0.1
    elif bad in ("ddgamma", "ddbeta"):
        name, value = bad, getattr(j, bad).copy()
        value[0, 1] += 0.1
    elif bad == "shape":
        name, value = "dextrinsic", np.zeros((3, 3))
    else:
        value[0, 0] = np.inf
    with pytest.raises(ValueError):
        replace(j, **{name: value})


def test_inputs_and_outputs_are_readonly_snapshots():
    j = manufactured(np.array([1.6, 2.1, 2.4]))
    o = O.evaluate(j)
    for instance in (j, o):
        for field in fields(instance):
            value = getattr(instance, field.name)
            assert not value.flags.writeable
            with pytest.raises(ValueError):
                value.flat[0] = 0.0


@pytest.mark.parametrize(
    "bad", ("unknown", "copy", "base", "axis-bool", "axis-range", "mutated")
)
def test_derivative_adapter_rejects_wrong_state_or_buffer(bad):
    grid = Grid3D(
        (9,) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4
    )
    o = O.evaluate(manufactured(np.stack(grid.coordinates, axis=-1)))
    state = state_from_slots(grid, o.slots)
    callback = ExactPhysicalDerivative(state, o)
    value, base, axis = state.base.a, state.base, 0
    if bad == "unknown":
        value = np.zeros(grid.shape)
    elif bad == "copy":
        value = value.copy()
    elif bad == "base":
        base = object()
    elif bad == "axis-bool":
        axis = False
    elif bad == "axis-range":
        axis = 3
    else:
        value.flat[0] += 1.0
    with pytest.raises(ValueError):
        callback(value, base, axis)


def test_independent_oracle_imports_no_solver_helpers():
    tree = ast.parse(Path(O.__file__).read_text(encoding="utf-8"))
    imports = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            imports.add(node.module)
    assert imports == {"__future__", "dataclasses", "numpy"}
