"""Semidiscrete33 controls; manufactured refinement is not Einstein convergence."""

import ast
from dataclasses import fields, replace
import json
import os
from pathlib import Path

import numpy as np
import pytest

from science.numerical_relativity import discrete_reduction_balance as D
from science.numerical_relativity import reduction_constraint_oracle as R
from science.numerical_relativity import native_campaign as N
from science.numerical_relativity.fo_ccz4_principal_symbol import _rhs_components
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import CONFIG, GAUGE, PROFILE
from science.numerical_relativity.fo_ccz4_sbp_volume import (
    SBPVolumeOperator,
    state_from_slots,
)
from science.numerical_relativity.nr3d import Grid3D
from science.numerical_relativity.sbp_boundary_operator import SBP42
from scripts.tests import test_nr_continuum_adm as H
from scripts.tests import test_nr_reduction_balance as C

native_component = C.native_component


def mesh(n):
    return Grid3D(
        (n,) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4
    )


def dense(grid):
    return D.DenseSBP(grid.shape, tuple(float(x) for x in grid.spacing))


def smooth(grid, sign=1.0):
    q0 = C.polynomial(np.array([2.0, 2.0, 2.0])).slots
    slots = np.arange(1, 59).reshape(58, 1, 1, 1)
    amplitude = sign * 0.015 * (1 + 0.25 * np.sin(slots))
    wave = (0.8, -0.6, 0.4)
    phase = 0.17 * slots + sum(
        w * (x - 2) for w, x in zip(wave, grid.coordinates, strict=True)
    )
    q = q0[:, None, None, None] + amplitude * np.sin(phase)
    dq = np.array([w * amplitude * np.cos(phase) for w in wave])
    return R.CanonicalJet(q, dq)


@pytest.fixture(scope="session")
def observations():
    result = dict(
        method=D.METHOD,
        python_cases=[],
        refinement=[],
        native_cases=[],
        native_calls=[],
        new_scientific_evolution=False,
        independent_einstein_rhs_validated=False,
    )
    yield result
    location = os.environ.get("NR_DISCRETE_CONTROL_ROOT")
    if location:
        root = Path(location).resolve()
        assert root.parent == N.EVIDENCE
        with (root / "discrete-reduction-observations.json").open(
            "x", encoding="utf-8"
        ) as stream:
            json.dump(result, stream, sort_keys=True, allow_nan=False)


@pytest.mark.parametrize("n", (9, 13, 17))
def test_exact_sbp_identity_and_positive_norm(n):
    matrix, weights = D.rational_operator(n)
    expected = np.zeros((n, n), dtype=int)
    expected[0, 0], expected[-1, -1] = -1, 1
    assert np.array_equal(
        weights[:, None] * matrix + matrix.T * weights[None, :], expected
    )
    assert all(w > 0 for w in weights)


@pytest.mark.parametrize("n", (9, 13, 17))
@pytest.mark.parametrize("degree", range(5))
def test_polynomial_moments(n, degree):
    x = np.linspace(-1, 1, n)
    matrix = np.asarray(D.rational_operator(n)[0], dtype=float) * (n - 1) / 2
    expected = np.zeros(n) if degree == 0 else degree * x ** (degree - 1)
    region = slice(None) if degree <= 2 else slice(4, -4)
    H.close((matrix @ (x**degree))[region], expected[region])


@pytest.mark.parametrize("axes", ((0, 1), (0, 2), (1, 2)))
def test_tensor_axes_commute(axes):
    grid = mesh(9)
    op, q = dense(grid), smooth(grid).slots
    i, j = axes
    H.close(
        op.derivative(op.derivative(q, i), j), op.derivative(op.derivative(q, j), i)
    )


@pytest.mark.parametrize("n", (9, 13, 17))
@pytest.mark.parametrize("axis", range(3))
def test_dense_derivative_matches_frozen_compact_rows(n, axis):
    grid = mesh(n)
    q = smooth(grid).slots
    actual = SBP42(n, grid.spacing[axis]).derivative(q, axis=axis + 1)
    H.close(actual, dense(grid).derivative(q, axis))


@pytest.mark.parametrize("n", (9, 13, 17))
@pytest.mark.parametrize("tau", (0.0, 1.0, 2.0))
@pytest.mark.parametrize("sign", (-1.0, 1.0))
def test_actual_python_semidiscrete_balance(n, tau, sign, observations):
    grid = mesh(n)
    q, op = smooth(grid, sign).slots, dense(grid)
    prediction = D.evaluate(q, op, tau_inverse=tau)
    actual = np.array(
        _rhs_components(
            SBPVolumeOperator(grid).rhs(
                state_from_slots(grid, q),
                gauge=GAUGE,
                config=replace(CONFIG, tau_inverse=tau),
                gauge_profile=PROFILE,
            )
        )
    )
    H.close(actual[:11], prediction.base_rates)
    H.close(actual[25:], prediction.auxiliary_rates)
    measured = op.measured_rates(actual)
    H.close(measured, prediction.predicted_rates)
    H.close(op.definition_defects(q), prediction.defects)
    observations["python_cases"].append(
        dict(
            n=n,
            tau=tau,
            sign=sign,
            base_error=float(np.max(abs(actual[:11] - prediction.base_rates))),
            auxiliary_error=float(
                np.max(abs(actual[25:] - prediction.auxiliary_rates))
            ),
            balance_error=float(np.max(abs(measured - prediction.predicted_rates))),
            per_slot_errors=np.max(
                abs(measured - prediction.predicted_rates), axis=(1, 2, 3)
            ).tolist(),
            chain_peaks=D.family_peaks(prediction.chain_defect),
        )
    )


def complex_base_rates(q, tau):
    # Complex-safe algebraic base rates: no production/reduction helper calls.
    def sym(start):
        value = np.empty((*q.shape[1:], 3, 3), dtype=q.dtype)
        for slot, (i, j) in enumerate(((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))):
            value[..., i, j] = value[..., j, i] = q[start + slot]
        return value

    h, a = sym(0), sym(11)
    beta, A, P, b = [
        np.moveaxis(q[start : start + 3], 0, -1) for start in (7, 25, 55, 22)
    ]
    B = np.moveaxis(q[28:37], 0, -1).reshape((*q.shape[1:], 3, 3))
    aux_d = np.stack([sym(37 + 6 * k) for k in range(3)], axis=-3)
    inv = np.linalg.inv(h)
    trace = np.einsum("...ij,...ij->...", inv, a)
    divergence = np.trace(B, axis1=-1, axis2=-2)
    alpha, chi = np.exp(q[6]), np.exp(2 * q[10])
    hdot = (
        2 * np.einsum("...k,...kij->...ij", beta, aux_d)
        + h @ np.swapaxes(B, -1, -2)
        + B @ h
        - 2 * h * divergence[..., None, None] / 3
        - 2 * alpha[..., None, None] * (a - h * trace[..., None, None] / 3)
        - tau * (np.linalg.det(h) - 1)[..., None, None] * h
    )
    Ldot = np.sum(beta * A, axis=-1) - 2 * (q[17] - 2 * q[18])
    betadot = np.einsum("...k,...ki->...i", beta, B) + 3 * (alpha * chi)[..., None] * b
    elldot = np.sum(beta * P, axis=-1) + (alpha * q[17] - divergence) / 3
    return np.array(
        [
            *[
                hdot[..., i, j]
                for i, j in ((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))
            ],
            Ldot,
            *[betadot[..., i] for i in range(3)],
            elldot,
        ]
    )


@pytest.mark.parametrize("tau", (0.0, 1.0, 2.0))
@pytest.mark.parametrize("axis", range(3))
def test_base_rate_jacobian_by_complex_directional_derivative(tau, axis):
    source = smooth(mesh(9))
    locations = ((0, 1, 2), (4, 4, 4), (8, 6, 1))
    q = np.stack([source.slots[:, *i] for i in locations], axis=1)
    dq = np.stack([source.slot_gradients[:, :, *i] for i in locations], axis=2)
    o = R.evaluate(R.CanonicalJet(q, dq), tau_inverse=tau)
    H.close(complex_base_rates(q, tau), o.base_rates)
    tangent = np.imag(complex_base_rates(q + 1j * 1e-30 * dq[axis], tau)) / 1e-30
    H.close(tangent, o.base_gradients[axis])


def test_definition_map_linear_rate_not_a_time_evolution():
    grid = mesh(9)
    op, q = dense(grid), smooth(grid).slots
    rhs = 0.2 * np.sin(q + np.arange(58)[:, None, None, None])
    eps = 1 / 16
    measured = (
        op.definition_defects(q + eps * rhs) - op.definition_defects(q - eps * rhs)
    ) / (2 * eps)
    H.close(measured, op.measured_rates(rhs))


@pytest.mark.parametrize("sign", (-1.0, 1.0))
def test_manufactured_chain_refinement(sign, observations):
    rows = []
    for n in (9, 17, 33):
        grid = mesh(n)
        o = D.evaluate(smooth(grid, sign).slots, dense(grid))
        rows.append(
            dict(
                n=n,
                whole=D.family_peaks(o.chain_defect),
                center=D.family_peaks(o.chain_defect, center=True),
            )
        )
        del o
    comparisons = []
    for coarse, fine in zip(rows[:-1], rows[1:], strict=True):
        for region, window in (("whole", (1.6, 2.4)), ("center", (3.6, 4.4))):
            for family in D.FAMILIES:
                p = D.orders(coarse[region][family], fine[region][family])
                comparisons.append(
                    dict(
                        coarse=coarse["n"],
                        fine=fine["n"],
                        region=region,
                        family=family,
                        order=p,
                        window=list(window),
                    )
                )
    # Persist all predeclared results before asserting the observation window.
    observations["refinement"].append(
        dict(sign=sign, levels=rows, comparisons=comparisons)
    )
    assert all(
        r["order"] is not None and r["window"][0] <= r["order"] <= r["window"][1]
        for r in comparisons
    )


@pytest.mark.parametrize("family", tuple(D.FAMILIES))
def test_omitting_chain_term_fails_each_auxiliary_family(family):
    grid = mesh(9)
    o = D.evaluate(smooth(grid).slots, dense(grid))
    part = D.FAMILIES[family]
    assert np.max(abs(o.chain_defect[part])) > 2e-13
    with pytest.raises(AssertionError):
        H.close(o.predicted_rates[part], o.continuum_balance[part])


@pytest.mark.parametrize("tau", (0.0, 1.0, 2.0))
def test_constant_flat_definition_surface(tau):
    grid = mesh(9)
    q = np.zeros((58, *grid.shape))
    q[[0, 3, 5]], q[6], q[10] = 1, np.log(0.8), 0.5 * np.log(0.7)
    o = D.evaluate(q, dense(grid), tau_inverse=tau)
    H.close(o.defects, np.zeros_like(o.defects))
    H.close(o.predicted_rates, np.zeros_like(o.predicted_rates))
    H.close(o.chain_defect, np.zeros_like(o.chain_defect))


@pytest.mark.parametrize(
    "mode",
    (
        "bool-points",
        "small-points",
        "large-points",
        "bool-spacing",
        "nan-spacing",
        "shape",
        "axis",
        "rhs",
        "unresolved",
        "order",
    ),
)
def test_invalid_and_unresolved_inputs(mode):
    if mode == "unresolved":
        assert D.orders(1e-14, 1e-15) is None
        return
    with pytest.raises(ValueError):
        if mode.endswith("points"):
            D.rational_operator(
                {"bool-points": True, "small-points": 8, "large-points": 66}[mode]
            )
        elif mode.endswith("spacing"):
            D.DenseSBP(
                (9,) * 3, (True if mode == "bool-spacing" else float("nan"), 0.25, 0.25)
            )
        elif mode == "order":
            D.orders(-1.0, 1.0)
        else:
            op = dense(mesh(9))
            q = smooth(mesh(9)).slots
            if mode == "shape":
                D.evaluate(q[:, :-1], op)
            elif mode == "axis":
                op.derivative(q, True)
            else:
                op.measured_rates(q[:57])


def test_readonly_diagnostic_outputs():
    op = dense(mesh(9))
    o = D.evaluate(smooth(mesh(9)).slots, op)
    for value in (*op.matrices, *[getattr(o, item.name) for item in fields(o)]):
        assert not value.flags.writeable
        with pytest.raises(ValueError):
            value.flat[0] = 0


def test_diagnostic_import_isolation():
    names = set()
    for node in ast.walk(ast.parse(Path(D.__file__).read_text(encoding="utf-8"))):
        if isinstance(node, ast.Import):
            names.update(a.name for a in node.names)
        elif isinstance(node, ast.ImportFrom):
            names.update([node.module] if node.module else [a.name for a in node.names])
    assert names == {
        "__future__",
        "dataclasses",
        "fractions",
        "math",
        "numpy",
        "reduction_constraint_oracle",
    }


@pytest.mark.parametrize("n", (9, 13, 17))
def test_native_semidiscrete_all33(n, native_component, observations):
    grid = mesh(n)
    op, q = dense(grid), smooth(grid).slots
    o = D.evaluate(q, op)
    invoke, save = native_component
    for suffix, value in (
        ("state", q),
        ("derivatives", o.gradients),
        ("base", o.base_rates),
        ("auxiliary", o.auxiliary_rates),
        ("balance", o.predicted_rates),
        ("chain", o.chain_defect),
    ):
        save(f"n{n}-" + suffix, value)
    derivative_errors = []
    for axis, mode in enumerate(("dx", "dy", "dz")):
        actual, _, _ = invoke(grid, q, mode, 1)
        H.close(actual, o.gradients[axis])
        derivative_errors.append(float(np.max(abs(actual - o.gradients[axis]))))
    actual, _, _ = invoke(grid, q, "rhs", 1)
    H.close(actual[:11], o.base_rates)
    H.close(actual[25:], o.auxiliary_rates)
    measured = op.measured_rates(actual)
    H.close(measured, o.predicted_rates)
    indices = np.indices(grid.shape)
    surface = sum((indices[k] == 0) | (indices[k] == n - 1) for k in range(3))
    masks = dict(
        whole=np.ones(grid.shape, bool),
        faces=surface == 1,
        edges=surface == 2,
        corners=surface == 3,
    )
    observations["native_cases"].append(
        dict(
            n=n,
            derivative_errors=derivative_errors,
            base_error=float(np.max(abs(actual[:11] - o.base_rates))),
            auxiliary_error=float(np.max(abs(actual[25:] - o.auxiliary_rates))),
            balance_error=float(np.max(abs(measured - o.predicted_rates))),
            region_errors={
                key: np.max(abs(measured - o.predicted_rates)[:, mask], axis=1).tolist()
                for key, mask in masks.items()
            },
            chain_peaks=D.family_peaks(o.chain_defect),
            native_calls=4,
            evolution_steps=0,
        )
    )
