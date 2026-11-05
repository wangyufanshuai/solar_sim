"""Physical nonzero-Z4 oracle controls, including direct qualified C++ probes."""

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

from science.numerical_relativity import continuum_adm as A
from science.numerical_relativity import continuum_z4 as Z
from science.numerical_relativity import native_campaign as N
from science.numerical_relativity.fo_ccz4_principal_symbol import _rhs_components
from science.numerical_relativity.fo_ccz4_rhs import _fo_ccz4_volume_rhs_3d
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import CONFIG, GAUGE, PROFILE
from science.numerical_relativity.fo_ccz4_sbp_volume import state_from_slots
from science.numerical_relativity.nr3d import Grid3D
from scripts.tests import test_nr_continuum_adm as H
from scripts.tests import test_nr_native_sbp_volume_component as V

EXE = (
    N.ROOT
    / "tmp/nr-native-sbp-volume-build-v2-20261010/Release/nr-sbp-volume-component.exe"
)
EXE_SHA = "b7459bdb251702ec51e6cf16282daaa05f835b4b624a1a494fb30c3753d01251"
DAMPING = ((0.1, 0.0), (0.2, 0.25))


def mesh():
    return Grid3D(
        (9,) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4
    )


def z_profile(points, mode="both", sign=1.0):
    x = np.asarray(points) - 2.0
    theta = sign * (
        0.011
        + np.einsum("i,...i->...", [0.002, -0.003, 0.004], x)
        + 0.001 * x[..., 0] * x[..., 1]
    )
    dtheta = np.broadcast_to(sign * np.array([0.002, -0.003, 0.004]), x.shape).copy()
    dtheta[..., 0] += sign * 0.001 * x[..., 1]
    dtheta[..., 1] += sign * 0.001 * x[..., 0]
    matrix = np.array(
        [[0.003, -0.002, 0.001], [0.004, 0.002, -0.003], [-0.002, 0.005, 0.004]]
    )
    z = sign * (
        np.array([0.018, -0.012, 0.015])
        + np.einsum("si,...s->...i", matrix, x)
        + 0.001 * x * x
    )
    dz = sign * (
        np.broadcast_to(matrix, (*x.shape[:-1], 3, 3)).copy()
        + 0.002 * x[..., None, :] * np.eye(3)
    )
    assert mode in ("zero", "theta", "z", "both")
    if mode in ("zero", "z"):
        theta, dtheta = np.zeros_like(theta), np.zeros_like(dtheta)
    if mode in ("zero", "theta"):
        z, dz = np.zeros_like(z), np.zeros_like(dz)
    return Z.Z4Jet(theta, dtheta, z, dz)


def flat_polynomial_fields(grid):
    points = np.stack(grid.coordinates, axis=-1)
    source = H.manufactured(points)
    q = H.rotation(2)
    g = q.T @ np.diag([1.1, 0.9, 1.2]) @ q
    k = np.array(
        [[0.021, 0.009, -0.006], [0.009, -0.018, 0.008], [-0.006, 0.008, 0.035]]
    )
    flat = H.zero_fields(
        np.broadcast_to(g, (*grid.shape, 3, 3)).copy(),
        np.broadcast_to(k, (*grid.shape, 3, 3)).copy(),
    )
    return replace(
        flat,
        alpha=source.alpha,
        dalpha=source.dalpha,
        ddalpha=source.ddalpha,
        beta=source.beta,
        dbeta=source.dbeta,
        ddbeta=source.ddbeta,
        driver=source.driver,
        ddriver=source.ddriver,
    )


@pytest.fixture(scope="session")
def observations():
    result = dict(
        method=Z.METHOD,
        python_cases=[],
        native_cases=[],
        native_calls=[],
        new_scientific_evolution=False,
        independent_einstein_rhs_validated=False,
    )
    yield result
    location = os.environ.get("NR_NONZERO_Z4_CONTROL_ROOT")
    if location:
        target = Path(location).resolve()
        assert target.parent == N.EVIDENCE
        with (target / "nonzero-z4-observations.json").open(
            "x", encoding="utf-8"
        ) as stream:
            json.dump(result, stream, sort_keys=True, allow_nan=False)


@pytest.mark.parametrize("orientation", (1, 2))
@pytest.mark.parametrize("sign", (-1.0, 1.0))
@pytest.mark.parametrize("mode", ("theta", "z", "both"))
@pytest.mark.parametrize("damping", DAMPING)
def test_full58_nonzero_z4_physical_reference(
    orientation, sign, mode, damping, observations
):
    grid = mesh()
    points = np.stack(grid.coordinates, axis=-1)
    j = H.manufactured(points, sign, orientation)
    z4 = z_profile(points, mode, sign * (-1) ** orientation)
    oracle = Z.evaluate(j, z4, kappa1=damping[0], kappa2=damping[1])
    state = state_from_slots(grid, oracle.slots)
    callback = H.ExactPhysicalDerivative(state, oracle)
    rhs = _fo_ccz4_volume_rhs_3d(
        state,
        gauge=GAUGE,
        config=replace(CONFIG, kappa1=damping[0], kappa2=damping[1]),
        gauge_profile=PROFILE,
        first_derivative=callback,
    )
    actual = np.array(_rhs_components(rhs))
    H.close(actual, oracle.rhs)
    gdot = (rhs.h - 2.0 * state.base.h * rhs.ln_phi[..., None, None]) / state.base.chi[
        ..., None, None
    ]
    kdot = (
        rhs.a
        + rhs.h * state.base.trace_k[..., None, None] / 3.0
        + state.base.h * rhs.trace_k[..., None, None] / 3.0
    ) / state.base.chi[..., None, None] - 2.0 * j.extrinsic * rhs.ln_phi[
        ..., None, None
    ]
    zero = A.evaluate(j)
    delta_gamma = np.moveaxis(oracle.slots[19:22] - zero.slots[19:22], 0, -1)
    reconstructed_zdot = 0.5 * np.einsum(
        "...ij,...j->...i", rhs.h, delta_gamma
    ) + 0.5 * np.einsum(
        "...ij,...j->...i",
        state.base.h,
        rhs.conformal_gamma - oracle.geometric_gamma_rate,
    )
    H.close(gdot, oracle.gamma_rate)
    H.close(kdot, oracle.extrinsic_rate)
    H.close(reconstructed_zdot, oracle.z_rate)
    for value, saved, _ in callback.entries.values():
        assert np.array_equal(value, saved)
    errors = np.max(np.abs(actual - oracle.rhs), axis=(1, 2, 3))
    observations["python_cases"].append(
        dict(
            orientation=orientation,
            sign=sign,
            mode=mode,
            damping=list(damping),
            all58_error=float(np.max(errors)),
            per_slot_errors=errors.tolist(),
            physical_metric_error=float(np.max(np.abs(gdot - oracle.gamma_rate))),
            physical_extrinsic_error=float(
                np.max(np.abs(kdot - oracle.extrinsic_rate))
            ),
            physical_z_error=float(np.max(np.abs(reconstructed_zdot - oracle.z_rate))),
        )
    )


@pytest.mark.parametrize("damping", ((0.0, 0.0), *DAMPING))
def test_zero_z4_limit_recovers_qualified_adm_reference(damping):
    points = np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]])
    j = H.manufactured(points)
    base, current = (
        A.evaluate(j),
        Z.evaluate(j, z_profile(points, "zero"), kappa1=damping[0], kappa2=damping[1]),
    )
    H.close(current.slots, base.slots)
    H.close(current.slot_gradients, base.slot_gradients)
    H.close(current.rhs, base.rhs)


@pytest.mark.parametrize("damping", ((0.0, 0.0), *DAMPING))
@pytest.mark.parametrize("sign", (-1.0, 1.0))
def test_homogeneous_damping_and_lapse_factor(damping, sign):
    k1, k2 = damping
    j = replace(H.zero_fields(np.eye(3)), alpha=np.array(0.8))
    theta, z = 0.02 * sign, sign * np.array([0.01, 0.02, -0.015])
    z4 = Z.Z4Jet(np.array(theta), np.zeros(3), z, np.zeros((3, 3)))
    o = Z.evaluate(j, z4, kappa1=k1, kappa2=k2)
    H.close(o.extrinsic_rate, -0.8 * k1 * (1 + k2) * theta * np.eye(3))
    H.close(o.theta_rate, -0.8 * k1 * (2 + k2) * theta)
    H.close(o.z_rate, -0.8 * k1 * z)
    H.close(o.rhs[19:22], -1.6 * k1 * z)
    H.close(o.rhs[17], -2.4 * k1 * (1 + k2) * theta)
    H.close(o.rhs[6], 4 * theta)


@pytest.mark.parametrize("axis", (0, 1, 2))
@pytest.mark.parametrize("mode", ("theta", "z", "both"))
def test_nonzero_z4_spatial_jets(axis, mode):
    points = np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]])

    def compute(p):
        return Z.evaluate(H.manufactured(p), z_profile(p, mode))

    o = compute(points)
    numeric = H.numerical_gradient(lambda p: compute(p).slots, points, axis)
    H.close(o.slot_gradients[axis], numeric, 2e-11)


@pytest.mark.parametrize("axis", (0, 1, 2))
def test_nonzero_theta_lapse_auxiliary_product_rule(axis):
    points = np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]])

    def compute(p):
        return Z.evaluate(H.manufactured(p), z_profile(p))

    o = compute(points)
    numeric = H.numerical_gradient(lambda p: compute(p).rhs[6], points, axis)
    H.close(o.rhs[25 + axis], numeric, 2e-11)


@pytest.mark.parametrize(
    "omission", ("inverse-metric-rate", "covector-lie", "lapse-damping-factor")
)
def test_nonzero_z4_negative_controls(omission):
    points = np.array([[1.6, 2.1, 2.4], [2.3, 1.7, 1.8]])
    j, z4 = H.manufactured(points), z_profile(points)
    o = Z.evaluate(j, z4)
    if omission == "inverse-metric-rate":
        delta = o.inverse_metric_z_rate
    elif omission == "covector-lie":
        delta = np.einsum("...s,...is->...i", z4.z, j.dbeta)
    else:
        delta = (1.0 - j.alpha) * 0.1 * 2.0 * z4.theta
    assert np.max(np.abs(delta)) > 1e-6
    with pytest.raises(AssertionError):
        H.close(delta, np.zeros_like(delta))


@pytest.mark.parametrize(
    "bad",
    (
        "theta-nan",
        "z-complex",
        "theta-bool",
        "z-shape",
        "gradient-shape",
        "kappa-negative",
        "kappa-boundary",
        "kappa-bool",
        "physical-type",
        "shape-mismatch",
    ),
)
def test_invalid_nonzero_z4_inputs_rejected(bad):
    points = np.array([1.6, 2.1, 2.4])
    j, z4 = H.manufactured(points), z_profile(points)
    with pytest.raises(ValueError):
        if bad == "theta-nan":
            replace(z4, theta=np.array(np.nan))
        elif bad == "z-complex":
            replace(z4, z=z4.z.astype(complex))
        elif bad == "theta-bool":
            replace(z4, theta=np.array(True))
        elif bad == "z-shape":
            replace(z4, z=np.zeros(2))
        elif bad == "gradient-shape":
            replace(z4, dz=np.zeros((2, 3)))
        elif bad == "kappa-negative":
            Z.evaluate(j, z4, kappa1=-0.1)
        elif bad == "kappa-boundary":
            Z.evaluate(j, z4, kappa2=-1.0)
        elif bad == "kappa-bool":
            Z.evaluate(j, z4, kappa1=True)
        elif bad == "physical-type":
            Z.evaluate(None, z4)
        else:
            Z.evaluate(j, z_profile(np.array([points, points])))


@pytest.fixture(scope="session")
def native_component(observations):
    location = os.environ.get("NR_NONZERO_Z4_CONTROL_ROOT")
    assert location, (
        "explicit bounded control runner required; do not skip native tests"
    )
    root = Path(location).resolve()
    assert root.parent == N.EVIDENCE and os.name == "nt"
    assert N.sha(EXE) == EXE_SHA
    assert N.sha(Path("C:/Windows/System32/vcomp140.dll")) == V.RUNTIME_SHA
    remaining = float(os.environ["NR_NONZERO_Z4_DEADLINE"]) - time.monotonic()
    budget = N.Budget(root, seconds=remaining, cap=64 * 1024**2, headroom=2 * 1024**2)
    calls = observations["native_calls"]

    def save_array(name, value):
        stream = io.BytesIO()
        np.save(stream, value, allow_pickle=False)
        budget.save("native/" + name + ".npy", stream.getvalue())

    def invoke(grid, q, mode, threads):
        remaining = budget.guard(2 * q.nbytes + 128 * 1024)
        stem = "native/call-" + str(len(calls)).zfill(3)
        payload = V.pack(grid, q, 1.0)
        budget.save(stem + ".input.bin", payload)
        command = [str(EXE), "--mode", mode, "--threads", str(threads)]
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
        env = dict(
            os.environ, TEMP=str(root), TMP=str(root), OMP_NUM_THREADS=str(threads)
        )
        with subprocess.Popen(
            command,
            cwd=N.ROOT,
            env=env,
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
                budget.save(stem + ".timeout-stdout", stdout, finalizing=True)
                budget.save(stem + ".timeout-stderr", stderr, finalizing=True)
                row.update(returncode=child.returncode, timeout=True)
                raise
            row["returncode"] = child.returncode
        assert len(stdout) <= q.nbytes + 65536 and len(stderr) <= 65536
        budget.save(stem + ".stdout.bin", stdout, finalizing=bool(row["returncode"]))
        budget.save(stem + ".stderr", stderr, finalizing=bool(row["returncode"]))
        row.update(input_sha256=N.codec.sha(payload), stdout_sha256=N.codec.sha(stdout))
        budget.record(stem + ".terminal.json", row, finalizing=bool(row["returncode"]))
        result = subprocess.CompletedProcess(command, row["returncode"], stdout, stderr)
        values, numeric = V.unpack(result, grid, mode, threads)
        header = json.loads(stdout.split(b"\n", 1)[0])
        assert (
            header["tau_inverse"] == 1.0
            and header["encoding"] == "little-endian-float64"
        )
        assert type(header["values"]) is int and header["values"] == q.size
        budget.guard()
        return values.reshape(q.shape), numeric, stdout

    yield invoke, save_array
    assert N.sha(EXE) == EXE_SHA
    assert N.sha(Path("C:/Windows/System32/vcomp140.dll")) == V.RUNTIME_SHA


@pytest.mark.parametrize("mode", ("zero", "theta", "z", "both"))
def test_native_sbp_polynomial_fields_against_independent_z4(
    mode, native_component, observations
):
    grid = mesh()
    points = np.stack(grid.coordinates, axis=-1)
    oracle = Z.evaluate(flat_polynomial_fields(grid), z_profile(points, mode))
    invoke, save = native_component
    save(mode + "-state", oracle.slots)
    save(mode + "-expected-rhs", oracle.rhs)
    save(mode + "-expected-derivatives", oracle.slot_gradients)
    derivative_errors = []
    for axis, label in enumerate(("dx", "dy", "dz")):
        derivative, _, _ = invoke(grid, oracle.slots, label, 1)
        H.close(derivative, oracle.slot_gradients[axis])
        derivative_errors.append(
            float(np.max(np.abs(derivative - oracle.slot_gradients[axis])))
        )
    actual, data, stdout = invoke(grid, oracle.slots, "rhs", 1)
    H.close(actual, oracle.rhs)
    for threads in (2, 4, 1):
        other, numeric, repeated_stdout = invoke(grid, oracle.slots, "rhs", threads)
        assert numeric == data
        if threads == 1:
            assert repeated_stdout == stdout
        H.close(other, oracle.rhs)
    indices = np.indices(grid.shape)
    surface = sum((indices[s] == 0) | (indices[s] == 8) for s in range(3))
    masks = {
        "whole": np.ones(grid.shape, bool),
        "faces": surface == 1,
        "edges": surface == 2,
        "corners": surface == 3,
    }
    regions = {
        name: np.max(np.abs(actual[:, mask] - oracle.rhs[:, mask]), axis=1).tolist()
        for name, mask in masks.items()
    }
    observations["native_cases"].append(
        dict(
            mode=mode,
            all58_error=float(np.max(np.abs(actual - oracle.rhs))),
            per_region_slot_errors=regions,
            derivative_errors=derivative_errors,
            thread_payload_byte_identical=True,
            fresh_process_stdout_byte_identical=True,
            native_calls=7,
            evolution_steps=0,
        )
    )


def test_nonzero_z4_outputs_are_read_only():
    points = np.array([1.6, 2.1, 2.4])
    z4 = z_profile(points)
    result = Z.evaluate(H.manufactured(points), z4)
    for instance in (z4, result):
        for item in fields(instance):
            value = getattr(instance, item.name)
            assert not value.flags.writeable
            with pytest.raises(ValueError):
                value.flat[0] = 0.0


def test_z4_oracle_imports_only_independent_adm_and_standard_modules():
    tree = ast.parse(Path(Z.__file__).read_text(encoding="utf-8"))
    imports = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            imports.add(node.module)
    assert imports == {"__future__", "dataclasses", "math", "numpy", "continuum_adm"}
