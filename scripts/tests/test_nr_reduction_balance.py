"""Off-constraint continuum balances and native polynomial component checks."""

import ast
from dataclasses import fields, replace
import io
import json
import os
from pathlib import Path
import subprocess
import time

import numpy as np
import pytest

from science.numerical_relativity import reduction_constraint_oracle as R
from science.numerical_relativity import native_campaign as N
from science.numerical_relativity.fo_ccz4_principal_symbol import _rhs_components
from science.numerical_relativity.fo_ccz4_rhs import _fo_ccz4_volume_rhs_3d
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import CONFIG, GAUGE, PROFILE
from science.numerical_relativity.fo_ccz4_sbp_volume import state_from_slots
from scripts.tests import test_nr_continuum_adm as H
from scripts.tests import test_nr_nonzero_z4 as Z
from scripts.tests import test_nr_native_sbp_volume_component as V

CASES = (
    "general-plus",
    "general-minus",
    "zero-shift",
    "zero-driver",
    "metric-consistent",
    "all-definitions",
)


def polynomial(points, mode="general-plus"):
    assert mode in CASES
    x = np.asarray(points) - 2.0
    shape = (58,) + (1,) * (x.ndim - 1)
    sign = -1.0 if mode == "general-minus" else 1.0
    c = 0.006 * sign * np.sin(np.arange(1.0, 59.0))
    c[:6] = [1.12, 0.035, -0.025, 0.98, 0.045, 1.07]
    c[6], c[10] = np.log(0.8), 0.5 * np.log(0.7)
    c[7:10], c[22:25] = (
        sign * np.array([0.02, -0.03, 0.01]),
        sign * np.array([0.01, -0.015, 0.02]),
    )
    c[11:17] = sign * np.array([0.03, 0.014, -0.012, 0.026, 0.009, -0.018])
    c[17], c[18] = 0.04 * sign, 0.012 * sign
    linear = (
        0.005
        * sign
        * np.cos((np.arange(58)[:, None] + 1) * (np.arange(3)[None, :] + 2))
    )
    hessian = np.empty((58, 3, 3))
    for s in range(3):
        for t in range(3):
            hessian[:, s, t] = 0.001 * sign * np.sin((np.arange(58) + 1) * (s + t + 2))
    q = (
        c.reshape(shape)
        + np.einsum("sk,...k->s...", linear, x)
        + 0.5 * np.einsum("skl,...k,...l->s...", hessian, x, x)
    )
    dq = np.array(
        [
            linear[:, k].reshape(shape)
            + np.einsum("sl,...l->s...", hessian[:, k, :], x)
            for k in range(3)
        ]
    )
    if mode == "zero-shift":
        q[7:10], dq[:, 7:10] = 0.0, 0.0
    if mode == "zero-driver":
        q[22:25], dq[:, 22:25] = 0.0, 0.0
    mappings = []
    if mode in ("metric-consistent", "all-definitions"):
        mappings += [(37 + 6 * k + j, k, j, 0.5) for k in range(3) for j in range(6)]
    if mode == "all-definitions":
        mappings += [(25 + k, k, 6, 1.0) for k in range(3)]
        mappings += [
            (28 + 3 * k + j, k, 7 + j, 1.0) for k in range(3) for j in range(3)
        ]
        mappings += [(55 + k, k, 10, 1.0) for k in range(3)]
    for target, axis, source, coefficient in mappings:
        q[target] = coefficient * dq[axis, source]
        for s in range(3):
            dq[s, target] = coefficient * hessian[source, axis, s]
    return R.CanonicalJet(q, dq)


def errors(jet, o, actual):
    H.close(actual[:11], o.base_rates)
    H.close(actual[25:], o.auxiliary_rates)
    H.close(actual[25:] - R.gradient_aux(o.base_gradients), o.defect_rates)
    state = R.unpack(jet.slots)
    inv = np.linalg.inv(state["h"])
    logdet = R.contract(inv, R.sym(actual, 0))
    trace = R.contract(inv, R.sym(actual, 11)) - R.contract(
        inv @ state["a"] @ inv, R.sym(actual, 0)
    )
    H.close(logdet, o.logdet_rate)
    H.close(trace, o.trace_rate)
    difference = np.concatenate(
        (actual[:11] - o.base_rates, actual[25:] - o.auxiliary_rates)
    )
    return dict(
        channel44_error=float(np.max(abs(difference))),
        per_channel_errors=np.max(abs(difference).reshape(44, -1), axis=1).tolist(),
        logdet_error=float(np.max(abs(logdet - o.logdet_rate))),
        trace_error=float(np.max(abs(trace - o.trace_rate))),
        defect_peak=float(np.max(abs(o.defects))),
        defect_rate_peak=float(np.max(abs(o.defect_rates))),
        determinant_error_peak=float(np.max(abs(o.determinant_error))),
        trace_peak=float(np.max(abs(o.trace))),
    )


@pytest.fixture(scope="session")
def observations():
    result = dict(
        method=R.METHOD,
        python_cases=[],
        native_cases=[],
        native_calls=[],
        new_scientific_evolution=False,
        independent_einstein_rhs_validated=False,
    )
    yield result
    location = os.environ.get("NR_REDUCTION_CONTROL_ROOT")
    if location:
        root = Path(location).resolve()
        assert root.parent == N.EVIDENCE
        with (root / "reduction-observations.json").open(
            "x", encoding="utf-8"
        ) as stream:
            json.dump(result, stream, sort_keys=True, allow_nan=False)


@pytest.mark.parametrize("mode", CASES)
@pytest.mark.parametrize("tau", (0.0, 1.0, 2.0))
def test_python_off_constraint_balances(mode, tau, observations):
    grid = Z.mesh()
    jet = polynomial(np.stack(grid.coordinates, axis=-1), mode)
    oracle = R.evaluate(jet, tau_inverse=tau)
    state = state_from_slots(grid, jet.slots)
    callback = H.ExactPhysicalDerivative(state, jet)
    rhs = _fo_ccz4_volume_rhs_3d(
        state,
        gauge=GAUGE,
        config=replace(CONFIG, tau_inverse=tau),
        gauge_profile=PROFILE,
        first_derivative=callback,
    )
    row = errors(jet, oracle, np.array(_rhs_components(rhs)))
    for value, saved, _ in callback.entries.values():
        assert np.array_equal(value, saved)
    observations["python_cases"].append(dict(mode=mode, tau=tau, **row))


@pytest.mark.parametrize("mode", ("general-plus", "general-minus"))
@pytest.mark.parametrize("axis", (0, 1, 2))
def test_base_product_rule_gradients(mode, axis):
    points = np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]])
    o = R.evaluate(polynomial(points, mode))
    numeric = H.numerical_gradient(
        lambda p: R.evaluate(polynomial(p, mode)).base_rates, points, axis
    )
    H.close(o.base_gradients[axis], numeric, 2e-11)


@pytest.mark.parametrize("mode", CASES)
@pytest.mark.parametrize("axis", (0, 1, 2))
def test_polynomial_jet_derivatives(mode, axis):
    points = np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]])
    jet = polynomial(points, mode)
    numeric = H.numerical_gradient(lambda p: polynomial(p, mode).slots, points, axis)
    H.close(jet.slot_gradients[axis], numeric, 2e-11)


@pytest.mark.parametrize("tau", (0.0, 1.0))
def test_consistent_definitions_alone_do_not_close_algebraic_forcing(tau):
    jet = polynomial(np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]]), "all-definitions")
    o = R.evaluate(jet, tau_inverse=tau)
    H.close(o.defects, np.zeros_like(o.defects))
    H.close(o.defect_rates[:3], -2 * o.trace_gradient)
    H.close(o.defect_rates[3:12], np.zeros_like(o.defect_rates[3:12]))
    H.close(o.defect_rates[12:30], o.metric_trace_term + o.metric_relaxation_term)
    H.close(o.defect_rates[30:], np.exp(jet.slots[6]) * o.trace_gradient / 3)
    assert np.max(abs(o.defect_rates)) > 1e-5


@pytest.mark.parametrize("tau", (0.0, 1.0, 2.0))
def test_joint_homogeneous_constraint_surface_is_instantaneously_invariant(tau):
    q = np.zeros(58)
    q[[0, 3, 5]] = 1.0
    q[6], q[10] = np.log(0.8), 0.5 * np.log(0.7)
    q[7:10], q[22:25] = [0.02, -0.03, 0.01], [0.01, -0.015, 0.02]
    o = R.evaluate(R.CanonicalJet(q, np.zeros((3, 58))), tau_inverse=tau)
    H.close(o.defect_rates, np.zeros(33))
    H.close(o.logdet_rate, np.array(0.0))
    H.close(o.trace_rate, np.array(0.0))


def test_relaxation_forcing_is_exact_and_not_auxiliary_damping():
    jet = polynomial(np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]]), "all-definitions")
    without, current = R.evaluate(jet, tau_inverse=0.0), R.evaluate(jet)
    H.close(
        current.defect_rates[12:30] - without.defect_rates[12:30],
        current.metric_relaxation_term,
    )
    assert np.max(abs(current.metric_relaxation_term)) > 1e-5
    H.close(current.auxiliary_rates, without.auxiliary_rates)


@pytest.mark.parametrize(
    "term",
    (
        "metric_relaxation_term",
        "metric_trace_term",
        "variable_gauge_term",
        "ordering_term",
    ),
)
def test_nonzero_negative_omission_controls(term):
    o = R.evaluate(polynomial(np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]])))
    missing = getattr(o, term)
    assert np.max(abs(missing)) > 1e-6
    with pytest.raises(AssertionError):
        H.close(missing, np.zeros_like(missing))


@pytest.mark.parametrize(
    "bad",
    (
        "nan",
        "complex",
        "bool",
        "empty",
        "shape",
        "gradient-shape",
        "non-spd",
        "lapse-range",
        "phi-range",
        "tau-bool",
        "tau-negative",
        "tau-nan",
    ),
)
def test_invalid_reduction_inputs_rejected(bad):
    jet = polynomial(np.array([1.6, 2.1, 2.4]))
    q, dq = jet.slots.copy(), jet.slot_gradients.copy()
    with pytest.raises(ValueError):
        if bad.startswith("tau-"):
            R.evaluate(
                jet,
                tau_inverse={
                    "tau-bool": True,
                    "tau-negative": -1.0,
                    "tau-nan": float("nan"),
                }[bad],
            )
        else:
            if bad == "nan":
                q[0] = np.nan
            if bad == "complex":
                q = q.astype(complex)
            if bad == "bool":
                dq = dq.astype(bool)
            if bad == "empty":
                q, dq = np.empty((58, 0)), np.empty((3, 58, 0))
            if bad == "shape":
                q = q[:-1]
            if bad == "gradient-shape":
                dq = dq[:2]
            if bad == "non-spd":
                q[0] = -1.0
            if bad == "lapse-range":
                q[6] = 1.0
            if bad == "phi-range":
                q[10] = 21.0
            R.CanonicalJet(q, dq)


def test_reduction_inputs_and_predictions_are_readonly():
    jet = polynomial(np.array([1.6, 2.1, 2.4]))
    for obj in (jet, R.evaluate(jet)):
        for item in fields(obj):
            value = getattr(obj, item.name)
            assert not value.flags.writeable
            with pytest.raises(ValueError):
                value.flat[0] = 0.0


def test_reduction_reference_has_no_production_imports():
    tree = ast.parse(Path(R.__file__).read_text(encoding="utf-8"))
    imports = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports.update(a.name for a in node.names)
        if isinstance(node, ast.ImportFrom):
            imports.add(node.module)
    assert imports == {"__future__", "dataclasses", "math", "numpy"}


@pytest.fixture(scope="session")
def native_component(observations):
    location = os.environ.get("NR_REDUCTION_CONTROL_ROOT")
    assert location, "bounded reduction control runner required"
    root = Path(location).resolve()
    assert root.parent == N.EVIDENCE and os.name == "nt"
    assert N.sha(Z.EXE) == Z.EXE_SHA and N.sha(N.OMP) == V.RUNTIME_SHA
    budget = N.Budget(
        root,
        seconds=float(os.environ["NR_REDUCTION_DEADLINE"]) - time.monotonic(),
        cap=64 * 1024**2,
        headroom=2 * 1024**2,
    )
    calls = observations["native_calls"]

    def save(name, value):
        stream = io.BytesIO()
        np.save(stream, value, allow_pickle=False)
        budget.save("native/" + name + ".npy", stream.getvalue())

    def invoke(grid, q, mode, threads):
        remaining = budget.guard(2 * q.nbytes + 128 * 1024)
        stem = "native/call-" + str(len(calls)).zfill(3)
        payload = V.pack(grid, q, 1.0)
        budget.save(stem + ".input.bin", payload)
        command = [str(Z.EXE), "--mode", mode, "--threads", str(threads)]
        row = dict(
            index=len(calls),
            mode=mode,
            threads=threads,
            command=command,
            returncode=None,
            pid=None,
        )
        calls.append(row)
        budget.record(stem + ".attempt.json", row)
        environment = dict(
            os.environ, TEMP=str(root), TMP=str(root), OMP_NUM_THREADS=str(threads)
        )
        with subprocess.Popen(
            command,
            cwd=N.ROOT,
            env=environment,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            creationflags=subprocess.CREATE_NO_WINDOW,
        ) as child:
            row["pid"] = child.pid
            budget.record(
                stem + ".process.json", dict(pid=child.pid, owned=True, command=command)
            )
            try:
                stdout, stderr = child.communicate(
                    payload, timeout=min(30.0, remaining)
                )
            except subprocess.TimeoutExpired:
                child.kill()
                stdout, stderr = child.communicate()
                row.update(returncode=child.returncode, timeout=True)
                budget.save(stem + ".timeout-stdout", stdout, finalizing=True)
                budget.save(stem + ".timeout-stderr", stderr, finalizing=True)
                budget.record(stem + ".terminal.json", row, finalizing=True)
                raise
            row["returncode"] = child.returncode
        assert len(stdout) <= q.nbytes + 65536 and len(stderr) <= 65536
        budget.save(stem + ".stdout.bin", stdout, finalizing=bool(row["returncode"]))
        budget.save(stem + ".stderr", stderr, finalizing=bool(row["returncode"]))
        row.update(input_sha256=N.codec.sha(payload), stdout_sha256=N.codec.sha(stdout))
        budget.record(stem + ".terminal.json", row, finalizing=bool(row["returncode"]))
        values, numeric = V.unpack(
            subprocess.CompletedProcess(command, row["returncode"], stdout, stderr),
            grid,
            mode,
            threads,
        )
        header = json.loads(stdout.split(b"\n", 1)[0])
        assert (
            header["tau_inverse"] == 1.0
            and header["encoding"] == "little-endian-float64"
            and header["values"] == q.size
        )
        budget.guard()
        return values.reshape(q.shape), numeric, stdout

    yield invoke, save
    assert N.sha(Z.EXE) == Z.EXE_SHA and N.sha(N.OMP) == V.RUNTIME_SHA


@pytest.mark.parametrize("mode", CASES)
def test_native_off_constraint_polynomial_balances(
    mode, native_component, observations
):
    grid = Z.mesh()
    jet = polynomial(np.stack(grid.coordinates, axis=-1), mode)
    o = R.evaluate(jet)
    invoke, save = native_component
    for name, value in (
        ("state", jet.slots),
        ("derivatives", jet.slot_gradients),
        ("base-rates", o.base_rates),
        ("base-gradients", o.base_gradients),
        ("auxiliary-rates", o.auxiliary_rates),
        ("defect-rates", o.defect_rates),
        ("algebraic-rates", np.array([o.logdet_rate, o.trace_rate])),
    ):
        save(mode + "-" + name, value)
    derivative_errors = []
    for axis, label in enumerate(("dx", "dy", "dz")):
        value, _, _ = invoke(grid, jet.slots, label, 1)
        H.close(value, jet.slot_gradients[axis])
        derivative_errors.append(float(np.max(abs(value - jet.slot_gradients[axis]))))
    actual, numeric, stdout = invoke(grid, jet.slots, "rhs", 1)
    row = errors(jet, o, actual)
    for threads in (2, 4, 1):
        other, otherdata, otherstdout = invoke(grid, jet.slots, "rhs", threads)
        assert otherdata == numeric
        if threads == 1:
            assert otherstdout == stdout
        errors(jet, o, other)
    indices = np.indices(grid.shape)
    surface = sum((indices[k] == 0) | (indices[k] == 8) for k in range(3))
    masks = dict(
        whole=np.ones(grid.shape, bool),
        faces=surface == 1,
        edges=surface == 2,
        corners=surface == 3,
    )
    delta = np.concatenate(
        (actual[:11] - o.base_rates, actual[25:] - o.auxiliary_rates)
    )
    regions = {
        name: np.max(abs(delta[:, mask]), axis=1).tolist()
        for name, mask in masks.items()
    }
    observations["native_cases"].append(
        dict(
            mode=mode,
            derivative_errors=derivative_errors,
            **row,
            region_errors=regions,
            thread_payload_byte_identical=True,
            fresh_process_stdout_byte_identical=True,
            native_calls=7,
            evolution_steps=0,
        )
    )
