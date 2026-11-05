"""Opt-in native FO assembly and actual-RHS probes, not evolution admission."""

from __future__ import annotations

from dataclasses import replace
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import time

import numpy as np
import pytest

from science.numerical_relativity.fo_ccz4_frozen_characteristics import _speed_families
from science.numerical_relativity.fo_ccz4_frozen_symbol import (
    frozen_fo_ccz4_principal_matrix_3d,
)
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import (
    CONFIG,
    GAUGE,
    PROFILE,
    local_split,
)

ROOT = Path(__file__).resolve().parents[2]
COMPONENT = ROOT / "science/numerical_relativity/cpp/fo_principal_component"
CPP = COMPONENT.parent
PRIMARY = (
    ROOT
    / "tmp/nr-shadow-evidence/nr-k3-schwarzschild-gauge-pulse-v1-20261009/receipt.json"
)
PRIMARY_SHA = "ffa0b0a5e81388138daa835508a1ec3cbd74c87f718a0043931c542f86546ee0"
SPECTRAL_RECEIPT = (
    ROOT
    / "tmp/nr-shadow-evidence/nr-k3-native-characteristic-component-v1-20261009/receipt.json"
)
SPECTRAL_SHA = "7a6094ddfbae5685f5d6cd9dde9dc47bcccdb910d78a5281d15d77569f3b59fb"
DLL_SHA = "6547e9fb966e9773caee2755e91a8bf4d6f3a2f0eebf9646b0158f8675ea4ab5"
SOURCES = (
    *sorted(COMPONENT.glob("*.hpp")),
    *sorted(COMPONENT.glob("*.cpp")),
    COMPONENT / "CMakeLists.txt",
    CPP / "characteristic_component/ilp64_lapack.hpp",
    CPP / "characteristic_component/characteristic_split.hpp",
    CPP / "nr_k2_fo_ccz4_shadow.cpp",
    Path(__file__),
    ROOT
    / "science/numerical_relativity/EXPERIMENT-20261009-native-fo-principal-component.md",
)
CASES = (
    "flat",
    "curved",
    "offdiagonal",
    "saved-corner",
    "saved-face",
    "saved-center",
    "micro-shift",
    "positive-shift",
    "negative-shift",
    "seed-0",
    "seed-1",
    "seed-2",
)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def reserve():
    assert shutil.disk_usage("C:/").free >= 3 * 1024**3, "C reserve reached"
    assert shutil.disk_usage(ROOT).free >= 4 * 1024**3 + 32 * 1024**2 + 64 * 1024**2, (
        "E component reserve reached"
    )


def write_json(path, data):
    path.write_text(
        json.dumps(data, sort_keys=True, indent=2, allow_nan=False) + "\n",
        encoding="utf-8",
    )


@pytest.fixture(scope="session")
def native_fo():
    if "NR_NATIVE_FO_EXE" not in os.environ:
        pytest.skip("explicit qualified native FO build required")
    assert os.name == "nt"
    reserve()
    executable = Path(os.environ["NR_NATIVE_FO_EXE"]).resolve()
    probe_executable = Path(os.environ["NR_NATIVE_FO_PROBE_EXE"]).resolve()
    directory = Path(os.environ["NR_NATIVE_FO_EVIDENCE"]).resolve()
    dll = Path(os.environ["NR_NATIVE_FO_DLL"]).resolve()
    for binary in (executable, probe_executable):
        assert binary.is_relative_to(ROOT / "tmp") and binary.is_file()
    assert (
        directory.parent == (ROOT / "tmp/nr-shadow-evidence").resolve()
        and not directory.exists()
    )
    assert sha(PRIMARY) == PRIMARY_SHA and sha(dll) == DLL_SHA
    assert sha(SPECTRAL_RECEIPT) == SPECTRAL_SHA
    primary = json.loads(PRIMARY.read_text(encoding="utf-8"))
    spectral = json.loads(SPECTRAL_RECEIPT.read_text(encoding="utf-8"))
    reference_sources = {
        **primary["source_after"],
        **spectral["source_after"],
    }
    for name, digest in reference_sources.items():
        assert sha(ROOT / name) == digest
    before = {p.relative_to(ROOT).as_posix(): sha(p) for p in SOURCES}
    assert len(before) == 10
    directory.mkdir()
    started = time.monotonic()
    identity = dict(
        schema="nr-native-fo-principal-tests-v1",
        source_before=before,
        executable=str(executable),
        executable_sha256=sha(executable),
        probe_executable=str(probe_executable),
        probe_executable_sha256=sha(probe_executable),
        dll=str(dll),
        dll_sha256=sha(dll),
        parent_sha256=PRIMARY_SHA,
        spectral_component_sha256=SPECTRAL_SHA,
        component_only=True,
        evolution_backend=False,
        physical_gate=False,
        scientificPayloadWriteback=False,
    )
    write_json(directory / "identity-before.json", identity)
    calls, comparisons = [], []

    def invoke(payload="", *, probe=False, order=2, epsilon=1.0e-5, mode=None):
        reserve()
        assert time.monotonic() - started < 600, "component batch timeout"
        assert (
            sum(p.stat().st_size for p in directory.rglob("*") if p.is_file())
            < 64 * 1024**2
        ), "component artifact cap"
        binary = probe_executable if probe else executable
        command = [str(binary), "--lapack", str(dll)]
        command += (
            [mode or "--rhs-probe", str(order), str(epsilon)]
            if probe
            else [mode or "--assemble-split"]
        )
        index = len(calls)
        stem = f"call-{index:04d}"
        row = dict(index=index, command=command, status="attempted", returncode=None)
        calls.append(row)
        (directory / (stem + ".input.txt")).write_text(payload, encoding="ascii")
        write_json(directory / (stem + ".json"), row)
        env = dict(
            os.environ,
            OPENBLAS_NUM_THREADS="1",
            OMP_NUM_THREADS="1",
            MKL_NUM_THREADS="1",
            TEMP=str(ROOT / "tmp"),
            TMP=str(ROOT / "tmp"),
            PYTHONDONTWRITEBYTECODE="1",
        )
        try:
            process = subprocess.run(
                command,
                input=payload.encode("ascii"),
                capture_output=True,
                cwd=ROOT,
                env=env,
                timeout=min(30.0, max(0.001, 600 - (time.monotonic() - started))),
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            (directory / (stem + ".stdout")).write_bytes(exc.stdout or b"")
            (directory / (stem + ".stderr")).write_bytes(exc.stderr or b"")
            row.update(status="timeout", error=str(exc))
            write_json(directory / (stem + ".json"), row)
            raise
        (directory / (stem + ".stdout")).write_bytes(process.stdout)
        (directory / (stem + ".stderr")).write_bytes(process.stderr)
        row.update(status="terminal", returncode=process.returncode)
        write_json(directory / (stem + ".json"), row)
        reserve()
        return process

    def record(**row):
        comparisons.append(row)
        write_json(directory / f"comparison-{len(comparisons) - 1:04d}.json", row)

    yield invoke, record
    after = {name: sha(ROOT / name) for name in before}
    unchanged = all(
        sha(ROOT / name) == digest for name, digest in reference_sources.items()
    )
    identity.update(
        source_after=after,
        source_unchanged=before == after,
        frozen_reference_unchanged=unchanged,
        frozen_reference_keys_checked=len(reference_sources),
        calls=calls,
        comparisons=comparisons,
        executable_unchanged=sha(executable) == identity["executable_sha256"],
        probe_executable_unchanged=sha(probe_executable)
        == identity["probe_executable_sha256"],
        dll_unchanged=sha(dll) == DLL_SHA,
        seconds=time.monotonic() - started,
    )
    identity["artifact_hashes"] = {
        p.relative_to(directory).as_posix(): sha(p)
        for p in sorted(directory.rglob("*"))
        if p.is_file()
    }
    write_json(directory / "receipt.json", identity)
    assert before == after and unchanged and identity["dll_unchanged"]
    assert identity["executable_unchanged"] and identity["probe_executable_unchanged"]
    reserve()


def pack(h, chi, alpha, beta, axis):
    values = [*np.asarray(h).ravel(), chi, alpha, *beta]
    return (
        f"nr-fo-principal-input-v1 58 {axis}\n"
        + " ".join(f"{value:.17g}" for value in values)
        + "\n"
    )


def coefficients(case):
    h, chi, alpha, beta = np.eye(3), 1.0, 1.0, np.zeros(3)
    if case == "curved":
        h, chi, alpha, beta = (
            np.diag([2.0, 0.5, 1.0]),
            0.4,
            0.65,
            np.array([0.2, -0.1, 0.05]),
        )
    elif case == "offdiagonal":
        transform = np.array([[1.0, 0.1, -0.05], [0.0, 1.0, 0.08], [0.0, 0.0, 1.0]])
        h, chi, alpha, beta = (
            transform @ transform.T,
            0.7,
            0.8,
            np.array([-0.1, 0.15, 0.03]),
        )
    elif case.startswith("saved-"):
        data = json.loads(PRIMARY.read_text(encoding="utf-8"))
        name = data["cases"][2]["trajectory"][-1]["array"]
        assert sha(PRIMARY.parent / name) == data["artifact_hashes"][name]
        q = np.load(PRIMARY.parent / name, allow_pickle=False)
        point = {
            "saved-corner": (0, 0, 0),
            "saved-face": (12, 6, 4),
            "saved-center": (6, 6, 6),
        }[case]
        cell = q[(slice(None), *point)]
        h = np.array(
            [
                [cell[0], cell[1], cell[2]],
                [cell[1], cell[3], cell[4]],
                [cell[2], cell[4], cell[5]],
            ]
        )
        chi, alpha, beta = np.exp(2.0 * cell[10]), np.exp(cell[6]), cell[7:10]
    elif case == "micro-shift":
        beta = np.array([1.0e-13, -1.0e-13, 2.0e-13])
    elif case in ("positive-shift", "negative-shift"):
        beta = np.array([3.0, 4.0, 5.0]) * (1 if case == "positive-shift" else -1)
    elif case.startswith("seed-"):
        rng = np.random.default_rng(20261009 + int(case[-1]))
        transform = np.eye(3)
        transform[np.triu_indices(3, 1)] = rng.uniform(-0.15, 0.15, 3)
        d0, d1 = np.exp(rng.uniform(-0.3, 0.3, 2))
        transform = transform @ np.diag([d0, d1, 1.0 / (d0 * d1)])
        h = transform @ transform.T
        chi, alpha = rng.uniform(0.3, 1.1), rng.uniform(0.4, 1.1)
        beta = rng.uniform(-0.2, 0.2, 3)
    else:
        assert case == "flat"
    return h, chi, alpha, beta


def reference_groups(h, chi, alpha, axis):
    f, mu = PROFILE.coefficients(alpha, chi)
    families = _speed_families(
        h,
        chi,
        alpha,
        np.zeros(3),
        np.eye(3)[axis],
        replace(GAUGE, shift_coefficient=float(f)),
        replace(CONFIG, ordering_mu=float(mu)),
    )
    families = [row for row in families if row[0] != "ODE"]
    scale = max(1.0, *(abs(row[1]) for row in families))
    groups = []
    for _, value, count in families:
        if groups and abs(value - groups[-1][0]) <= 1.0e-12 * scale:
            groups[-1][1] += count
        else:
            groups.append([value, count])
    return np.asarray(groups)


def repeated(invoke, payload, **kwargs):
    first, second = invoke(payload, **kwargs), invoke(payload, **kwargs)
    assert first.returncode == second.returncode == 0, first.stderr.decode(
        errors="replace"
    )
    assert first.stderr == second.stderr == b"" and first.stdout == second.stdout
    result = json.loads(first.stdout)
    assert result["component_only"] is True
    assert all(
        result[key] is False
        for key in ("evolution_backend", "physical_gate", "scientificPayloadWriteback")
    )
    return result


@pytest.mark.parametrize("axis", [0, 1, 2])
@pytest.mark.parametrize("case", CASES)
def test_native_principal_roots_and_split(native_fo, axis, case):
    invoke, record = native_fo
    h, chi, alpha, beta = coefficients(case)
    reference = local_split(h, chi, alpha, beta, axis)
    result = repeated(invoke, pack(h, chi, alpha, beta, axis))
    assert result["native_principal_assembly"] is True
    assert result["native_speed_families"] is True
    assert result["axis"] == axis and result["advection"] == beta[axis]
    expected_groups = reference_groups(h, chi, alpha, axis)
    actual_groups = np.asarray(result["centered_root_groups"])
    assert actual_groups.shape == expected_groups.shape
    assert np.array_equal(actual_groups[:, 1], expected_groups[:, 1])
    assert np.sum(actual_groups[:, 1]) == 47
    root_error = float(np.max(abs(actual_groups[:, 0] - expected_groups[:, 0]))) / max(
        1.0, float(np.max(abs(expected_groups[:, 0])))
    )
    assert root_error <= 2.0e-13
    scale = max(1.0, float(np.linalg.norm(reference.principal, np.inf)))
    errors, matrices = {}, {}
    for key, expected, limit in (
        ("principal", reference.principal, 2.0e-13),
        ("positive", reference.positive, 2.0e-11),
        ("negative", reference.negative, 2.0e-11),
    ):
        actual = np.asarray(result[key]).reshape(58, 58)
        matrices[key] = actual
        assert np.isfinite(actual).all()
        assert np.count_nonzero(actual[:11]) == np.count_nonzero(actual[:, :11]) == 0
        errors[key] = float(np.max(abs(actual - expected))) / scale
        assert errors[key] <= limit
    jump = np.sin(np.arange(58) * 0.13)
    action_errors = []
    for side in (0, 1):
        weight = 17.0 / (48.0 * 6.0)
        actual = (
            (matrices["negative"] if side == 0 else -matrices["positive"]) @ jump
        ) / weight
        expected = reference.penalty(jump, side, weight)
        action_errors.append(float(np.max(abs(actual - expected))) / (scale / weight))
    assert max(action_errors) <= 2.0e-11
    assert result["condition"] <= 1.0e6 and result["residual"] <= 2.0e-11
    assert result["symmetry_residual"] <= 2.0e-11
    assert result["minimum_energy_eigenvalue"] > 0.0
    record(
        kind="native-principal-roots-split",
        case=case,
        axis=axis,
        root_error_scaled=root_error,
        matrix_errors_scaled=errors,
        penalty_errors_scaled=action_errors,
        condition=result["condition"],
        residual=result["residual"],
        symmetry_residual=result["symmetry_residual"],
        minimum_energy_eigenvalue=result["minimum_energy_eigenvalue"],
        repeated_stdout_byte_exact=True,
    )


@pytest.mark.parametrize("epsilon", [1.0e-5, 2.0e-5])
@pytest.mark.parametrize("order", [2, 4])
@pytest.mark.parametrize("axis", [0, 1, 2])
@pytest.mark.parametrize("case", CASES[:6])
def test_actual_cpp_rhs_principal_columns(native_fo, case, axis, order, epsilon):
    invoke, record = native_fo
    h, chi, alpha, beta = coefficients(case)
    expected = frozen_fo_ccz4_principal_matrix_3d(
        h,
        chi,
        alpha,
        beta,
        np.eye(3)[axis],
        gauge=GAUGE,
        config=CONFIG,
        gauge_profile=PROFILE,
    )
    result = repeated(
        invoke,
        pack(h, chi, alpha, beta, axis),
        probe=True,
        order=order,
        epsilon=epsilon,
    )
    assert result["native_principal_assembly"] is False
    assert result["actual_frozen_rhs_probe"] is True
    assert result["spatial_order"] == order and result["epsilon"] == epsilon
    actual = np.asarray(result["principal"]).reshape(58, 58)
    scale = max(1.0, float(np.linalg.norm(expected, np.inf)))
    error = float(np.max(abs(actual - expected))) / scale
    assert np.count_nonzero(actual[:11]) == np.count_nonzero(actual[:, :11]) == 0
    assert error <= 5.0e-10
    record(
        kind="actual-native-rhs-probe",
        case=case,
        axis=axis,
        spatial_order=order,
        epsilon=epsilon,
        matrix_error_scaled=error,
        repeated_stdout_byte_exact=True,
    )


@pytest.mark.parametrize(
    "kind",
    [
        "nan-h",
        "infinite-chi",
        "nan-beta",
        "asymmetric",
        "indefinite",
        "singular",
        "determinant",
        "zero-chi",
        "negative-chi",
        "zero-lapse",
        "negative-lapse",
        "lapse-upper",
        "axis-negative",
        "axis-large",
        "missing",
        "trailing",
        "dimension",
        "schema",
        "empty",
        "overflow-profile",
    ],
)
def test_invalid_coefficient_contract_rejected(native_fo, kind):
    invoke, _ = native_fo
    h, chi, alpha, beta = coefficients("flat")
    axis = 0
    if kind == "nan-h":
        h[0, 0] = np.nan
    elif kind == "infinite-chi":
        chi = np.inf
    elif kind == "nan-beta":
        beta[1] = np.nan
    elif kind == "asymmetric":
        h[0, 1] = 0.01
    elif kind == "indefinite":
        h = np.diag([-1.0, -1.0, 1.0])
    elif kind == "singular":
        h[0, 0] = 0.0
    elif kind == "determinant":
        h[0, 0] += 2.0e-10
    elif kind in ("zero-chi", "negative-chi"):
        chi = 0.0 if kind == "zero-chi" else -1.0
    elif kind in ("zero-lapse", "negative-lapse", "lapse-upper"):
        alpha = {"zero-lapse": 0.0, "negative-lapse": -1.0, "lapse-upper": 2.0}[kind]
    elif kind in ("axis-negative", "axis-large"):
        axis = -1 if kind == "axis-negative" else 3
    elif kind == "overflow-profile":
        chi = 1.0e308
    payload = pack(h, chi, alpha, beta, axis)
    if kind == "missing":
        payload = " ".join(payload.split()[:-1])
    elif kind == "trailing":
        payload += "unexpected"
    elif kind == "dimension":
        payload = payload.replace("v1 58", "v1 57", 1)
    elif kind == "schema":
        payload = payload.replace("input-v1", "input-v2", 1)
    elif kind == "empty":
        payload = ""
    for is_probe in (False, True):
        result = invoke(payload, probe=is_probe)
        assert result.returncode != 0 and result.stdout == b""
        assert b"rejected:" in result.stderr


@pytest.mark.parametrize("order,epsilon", [(3, 1.0e-5), (2, 0.0), (4, 1.0), (2, "nan")])
def test_invalid_probe_controls_rejected(native_fo, order, epsilon):
    invoke, _ = native_fo
    result = invoke(
        pack(*coefficients("flat"), 0), probe=True, order=order, epsilon=epsilon
    )
    assert result.returncode != 0 and result.stdout == b""


@pytest.mark.parametrize("probe", [False, True])
def test_wrong_mode_rejected(native_fo, probe):
    invoke, _ = native_fo
    result = invoke(pack(*coefficients("flat"), 0), probe=probe, mode="--unknown")
    assert result.returncode != 0 and result.stdout == b""
