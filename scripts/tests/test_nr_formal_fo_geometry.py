"""Published off-constraint 58-field profile, not scientific admission."""

import ast
from dataclasses import fields, replace
import json
import os
from pathlib import Path

import numpy as np
import pytest

from science.numerical_relativity import continuum_adm as A
from science.numerical_relativity import continuum_z4 as Q
from science.numerical_relativity import formal_fo_geometry as G
from science.numerical_relativity import reduction_constraint_oracle as R
from science.numerical_relativity import native_campaign as N
from science.numerical_relativity.fo_ccz4_principal_symbol import _rhs_components
from science.numerical_relativity.fo_ccz4_rhs import _fo_ccz4_volume_rhs_3d
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import CONFIG, GAUGE, PROFILE
from science.numerical_relativity.fo_ccz4_sbp_volume import state_from_slots
from scripts.tests import test_nr_continuum_adm as H
from scripts.tests import test_nr_nonzero_z4 as Z
from scripts.tests import test_nr_reduction_balance as C

# Reuse the already qualified, bounded native-call fixture. The runner sets its
# control-root/deadline only for this suite and unsets them for old regressions.
native_component = C.native_component


@pytest.fixture(scope="session")
def observations():
    result = dict(
        method=G.METHOD,
        python_cases=[],
        native_cases=[],
        native_calls=[],
        new_scientific_evolution=False,
        independent_einstein_rhs_validated=False,
    )
    yield result
    location = os.environ.get("NR_FORMAL_CONTROL_ROOT")
    if location:
        root = Path(location).resolve()
        assert root.parent == N.EVIDENCE
        with (root / "formal-profile-observations.json").open(
            "x", encoding="utf-8"
        ) as stream:
            json.dump(result, stream, sort_keys=True, allow_nan=False)


@pytest.mark.parametrize("mode", C.CASES)
@pytest.mark.parametrize("tau", (0.0, 1.0, 2.0))
@pytest.mark.parametrize("damping", ((0.1, 0.0), (0.2, 0.25)))
def test_python_full58_off_constraint_profile(mode, tau, damping, observations):
    grid = Z.mesh()
    jet = C.polynomial(np.stack(grid.coordinates, axis=-1), mode)
    oracle = G.evaluate(jet, tau_inverse=tau, kappa1=damping[0], kappa2=damping[1])
    state = state_from_slots(grid, jet.slots)
    callback = H.ExactPhysicalDerivative(state, jet)
    rhs = _fo_ccz4_volume_rhs_3d(
        state,
        gauge=GAUGE,
        config=replace(CONFIG, tau_inverse=tau, kappa1=damping[0], kappa2=damping[1]),
        gauge_profile=PROFILE,
        first_derivative=callback,
    )
    actual = np.array(_rhs_components(rhs))
    H.close(actual, oracle.rhs)
    for value, saved, _ in callback.entries.values():
        assert np.array_equal(value, saved)
    errors = np.max(abs(actual - oracle.rhs), axis=(1, 2, 3))
    observations["python_cases"].append(
        dict(
            mode=mode,
            tau=tau,
            damping=list(damping),
            full58_error=float(np.max(errors)),
            per_slot_errors=errors.tolist(),
        )
    )


@pytest.mark.parametrize("mode", ("theta", "z", "both"))
@pytest.mark.parametrize("orientation", (1, 2))
@pytest.mark.parametrize("sign", (-1.0, 1.0))
def test_formal_profile_recovers_independent_physical_z4(mode, orientation, sign):
    points = np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]])
    physical = H.manufactured(points, sign, orientation)
    reference = Q.evaluate(physical, Z.z_profile(points, mode, sign))
    current = G.evaluate(R.CanonicalJet(reference.slots, reference.slot_gradients))
    H.close(current.rhs, reference.rhs)
    H.close(current.formal_metric, physical.gamma)
    H.close(current.formal_metric_gradient, physical.dgamma)
    H.close(current.formal_metric_hessian, physical.ddgamma)
    H.close(current.formal_ricci, A.physical_geometry(physical)[3])


@pytest.mark.parametrize("orientation", (0, 1, 2))
def test_generic_taylor_geometry_matches_qualified_physical_geometry(orientation):
    j = H.manufactured(
        np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]]), orientation=orientation
    )
    current = G.metric_geometry(j.gamma, j.dgamma, j.ddgamma)
    inv, dinv, connection, ricci = A.physical_geometry(j)
    for actual, expected in (
        (current.inverse, inv),
        (current.inverse_gradient, dinv),
        (current.connection, connection),
        (current.ricci, ricci),
    ):
        H.close(actual, expected)


@pytest.mark.parametrize("curvature", (-0.05, 0.0, 0.05))
def test_generic_taylor_constant_curvature_oracle(curvature):
    points = np.array([[0.2, -0.3, 0.4], [-0.5, 0.1, 0.2]])
    k = curvature
    u = 1 + k * np.sum(points**2, axis=-1)
    g = 4 / u[..., None, None] ** 2 * np.eye(3)
    scalar_gradient = -16 * k * points / u[..., None] ** 3
    scalar_hessian = (
        -16 * k / u[..., None, None] ** 3 * np.eye(3)
        + 96
        * k
        * k
        * points[..., :, None]
        * points[..., None, :]
        / u[..., None, None] ** 4
    )
    dg = scalar_gradient[..., :, None, None] * np.eye(3)
    ddg = scalar_hessian[..., None, None] * np.eye(3)
    current = G.metric_geometry(g, dg, ddg)
    H.close(current.ricci, 2 * k * g)


@pytest.mark.parametrize("family", ("A", "B", "D", "P"))
def test_antisymmetric_ordering_gradient_does_not_leak_into_geometry(family):
    jet = C.polynomial(np.array([1.6, 2.1, 2.4]))
    gradients = jet.slot_gradients.copy()
    # Deliberate antisymmetry in derivative/reduction indices0/1.
    if family in ("A", "P"):
        start = 25 if family == "A" else 55
        gradients[0, start + 1] += 0.02
        gradients[1, start] -= 0.02
    elif family == "B":
        gradients[0, 28 + 3 + 2] += 0.02
        gradients[1, 28 + 2] -= 0.02
    else:
        gradients[0, 37 + 6 + 1] += 0.02
        gradients[1, 37 + 1] -= 0.02
    original = G.evaluate(jet)
    changed = G.evaluate(R.CanonicalJet(jet.slots, gradients))
    H.close(changed.formal_ricci, original.formal_ricci)
    H.close(changed.ricci_z, original.ricci_z)
    H.close(changed.rhs[11:25], original.rhs[11:25])
    assert np.max(abs(changed.rhs[25:] - original.rhs[25:])) > 1e-5


def test_formal_curvature_is_not_true_sampled_metric_curvature_off_constraint():
    jet = C.polynomial(np.array([1.6, 2.1, 2.4]))
    q, dq = jet.slots.copy(), jet.slot_gradients.copy()
    # Declare h and lnphi spatially constant. Their actual metric Ricci is0;
    # retain independent D/P and their gradients in the extended system.
    dq[:, :6], dq[:, 10] = 0.0, 0.0
    o = G.evaluate(R.CanonicalJet(q, dq))
    assert np.max(abs(o.formal_ricci)) > 1e-4
    h = R.sym(q, 0) / np.exp(2 * q[10])
    true = G.metric_geometry(h, np.zeros((3, 3, 3)), np.zeros((3, 3, 3, 3)))
    H.close(true.ricci, np.zeros((3, 3)))


def test_contracted_connection_cannot_use_unit_determinant_shortcut():
    jet = C.polynomial(np.array([1.6, 2.1, 2.4]))
    o = G.evaluate(jet)
    v = R.unpack(jet.slots)
    inv = np.linalg.inv(v["h"])
    dinv = -2 * np.einsum("im,kmn,nj->kij", inv, v["D"], inv)
    shortcut = -np.einsum("jij->i", dinv)
    correction = np.einsum("ik,mn,kmn->i", inv, inv, v["D"])
    # Gamma^i = -partial_j hInv^ij - hInv^ik partial_k log(sqrt(det(h))).
    H.close(o.contracted_connection, shortcut - correction)
    assert np.max(abs(correction)) > 1e-5
    with pytest.raises(AssertionError):
        H.close(o.contracted_connection, shortcut)


def test_trace_ordering_feedback_is_nonzero_and_cannot_be_omitted():
    o = G.evaluate(C.polynomial(np.array([1.6, 2.1, 2.4])))
    assert np.max(abs(o.trace_ordering_feedback)) > 1e-5
    with pytest.raises(AssertionError):
        H.close(o.rhs[19:22], o.rhs[19:22] - o.trace_ordering_feedback)


@pytest.mark.parametrize(
    "bad",
    ("kappa-negative", "kappa-boundary", "kappa-bool", "kappa-nan", "unvalidated-jet"),
)
def test_invalid_formal_profile_parameters(bad):
    jet = C.polynomial(np.array([1.6, 2.1, 2.4]))
    with pytest.raises(ValueError):
        if bad == "unvalidated-jet":
            G.evaluate(None)
        elif bad == "kappa-boundary":
            G.evaluate(jet, kappa2=-1.0)
        else:
            G.evaluate(
                jet,
                kappa1={
                    "kappa-negative": -0.1,
                    "kappa-bool": True,
                    "kappa-nan": float("nan"),
                }[bad],
            )


def test_formal_profile_outputs_are_readonly():
    o = G.evaluate(C.polynomial(np.array([1.6, 2.1, 2.4])))
    for item in fields(o):
        value = getattr(o, item.name)
        assert not value.flags.writeable
        with pytest.raises(ValueError):
            value.flat[0] = 0.0


def test_formal_profile_imports_no_production_geometry_or_rhs():
    imports = set()
    for node in ast.walk(ast.parse(Path(G.__file__).read_text(encoding="utf-8"))):
        if isinstance(node, ast.Import):
            imports.update(a.name for a in node.names)
        elif isinstance(node, ast.ImportFrom):
            if node.module is None:
                imports.update(a.name for a in node.names)
            else:
                imports.add(node.module)
    assert imports == {
        "__future__",
        "dataclasses",
        "math",
        "numpy",
        "reduction_constraint_oracle",
    }


@pytest.mark.parametrize("mode", C.CASES)
def test_native_full58_formal_profile(mode, native_component, observations):
    grid = Z.mesh()
    jet = C.polynomial(np.stack(grid.coordinates, axis=-1), mode)
    o = G.evaluate(jet)
    invoke, save = native_component
    for name, value in (
        ("state", jet.slots),
        ("derivatives", jet.slot_gradients),
        ("expected-rhs", o.rhs),
        ("formal-ricci", o.formal_ricci),
    ):
        save(mode + "-" + name, value)
    derivative_errors = []
    for axis, label in enumerate(("dx", "dy", "dz")):
        value, _, _ = invoke(grid, jet.slots, label, 1)
        H.close(value, jet.slot_gradients[axis])
        derivative_errors.append(float(np.max(abs(value - jet.slot_gradients[axis]))))
    actual, numeric, stdout = invoke(grid, jet.slots, "rhs", 1)
    H.close(actual, o.rhs)
    for threads in (2, 4, 1):
        other, otherdata, otherstdout = invoke(grid, jet.slots, "rhs", threads)
        assert otherdata == numeric
        if threads == 1:
            assert otherstdout == stdout
        H.close(other, o.rhs)
    indices = np.indices(grid.shape)
    surface = sum((indices[k] == 0) | (indices[k] == 8) for k in range(3))
    masks = dict(
        whole=np.ones(grid.shape, bool),
        faces=surface == 1,
        edges=surface == 2,
        corners=surface == 3,
    )
    delta = actual - o.rhs
    regions = {
        name: np.max(abs(delta[:, mask]), axis=1).tolist()
        for name, mask in masks.items()
    }
    observations["native_cases"].append(
        dict(
            mode=mode,
            derivative_errors=derivative_errors,
            full58_error=float(np.max(abs(delta))),
            region_errors=regions,
            thread_payload_byte_identical=True,
            fresh_process_stdout_byte_identical=True,
            native_calls=7,
            evolution_steps=0,
        )
    )
