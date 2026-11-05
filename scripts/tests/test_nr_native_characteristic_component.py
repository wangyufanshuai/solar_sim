"""Explicitly enabled native ABI/spectral tests; never an evolution admission."""

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
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import (
    CONFIG,
    GAUGE,
    PROFILE,
    local_split,
)

ROOT = Path(__file__).resolve().parents[2]
PRIMARY = (
    ROOT
    / "tmp/nr-shadow-evidence/nr-k3-schwarzschild-gauge-pulse-v1-20261009/receipt.json"
)
PRIMARY_SHA = "ffa0b0a5e81388138daa835508a1ec3cbd74c87f718a0043931c542f86546ee0"
DLL_SHA = "6547e9fb966e9773caee2755e91a8bf4d6f3a2f0eebf9646b0158f8675ea4ab5"
COMPONENT = ROOT / "science/numerical_relativity/cpp/characteristic_component"
SOURCES = (
    *sorted(COMPONENT.glob("*.hpp")),
    COMPONENT / "main.cpp",
    COMPONENT / "CMakeLists.txt",
    Path(__file__),
    ROOT
    / "science/numerical_relativity/EXPERIMENT-20261009-native-characteristic-component.md",
)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def reserve():
    assert shutil.disk_usage("C:/").free >= 3 * 1024**3, "C reserve reached"
    assert shutil.disk_usage(ROOT).free >= 4 * 1024**3 + 32 * 1024**2 + 64 * 1024**2, (
        "E component reserve reached"
    )


@pytest.fixture(scope="session")
def native():
    if "NR_NATIVE_COMPONENT_EXE" not in os.environ:
        pytest.skip("explicit qualified Windows native build required")
    assert os.name == "nt"
    reserve()
    executable = Path(os.environ["NR_NATIVE_COMPONENT_EXE"]).resolve()
    directory = Path(os.environ["NR_NATIVE_COMPONENT_EVIDENCE"]).resolve()
    dll = Path(os.environ["NR_NATIVE_COMPONENT_DLL"]).resolve()
    assert executable.is_relative_to(ROOT / "tmp") and executable.is_file()
    assert (
        directory.parent == (ROOT / "tmp/nr-shadow-evidence").resolve()
        and not directory.exists()
    )
    assert sha(PRIMARY) == PRIMARY_SHA and sha(dll) == DLL_SHA
    primary = json.loads(PRIMARY.read_text(encoding="utf-8"))
    assert primary["completed"] is True
    before = {p.relative_to(ROOT).as_posix(): sha(p) for p in SOURCES}
    assert len(before) == 6
    for name, digest in primary["source_after"].items():
        assert sha(ROOT / name) == digest
    directory.mkdir()
    started = time.monotonic()
    identity = dict(
        schema="nr-native-characteristic-tests-v1",
        source_before=before,
        executable=str(executable),
        executable_sha256=sha(executable),
        dll=str(dll),
        dll_sha256=sha(dll),
        parent_sha256=PRIMARY_SHA,
        evolution_backend=False,
        physical_gate=False,
        scientificPayloadWriteback=False,
    )
    (directory / "identity-before.json").write_text(
        json.dumps(identity, sort_keys=True, indent=2) + "\n", encoding="utf-8"
    )
    calls = []

    def invoke(payload="", mode="--split", dll_path=None):
        reserve()
        assert time.monotonic() - started < 600, "component batch timeout"
        assert (
            sum(p.stat().st_size for p in directory.rglob("*") if p.is_file())
            < 64 * 1024**2
        )
        index = len(calls)
        stem = f"call-{index:04d}"
        command = [str(executable), "--lapack", str(dll_path or dll), mode]
        row = dict(index=index, command=command, status="attempted", returncode=None)
        calls.append(row)
        (directory / (stem + ".input.txt")).write_text(payload, encoding="ascii")
        (directory / (stem + ".json")).write_text(
            json.dumps(row, sort_keys=True) + "\n", encoding="utf-8"
        )
        env = dict(
            os.environ,
            OPENBLAS_NUM_THREADS="1",
            OMP_NUM_THREADS="1",
            MKL_NUM_THREADS="1",
            TEMP=str(ROOT / "tmp"),
            TMP=str(ROOT / "tmp"),
            PYTHONDONTWRITEBYTECODE="1",
        )
        process = subprocess.run(
            command,
            input=payload.encode("ascii"),
            capture_output=True,
            cwd=ROOT,
            env=env,
            timeout=30,
            check=False,
        )
        (directory / (stem + ".stdout")).write_bytes(process.stdout)
        (directory / (stem + ".stderr")).write_bytes(process.stderr)
        row.update(status="terminal", returncode=process.returncode)
        (directory / (stem + ".json")).write_text(
            json.dumps(row, sort_keys=True) + "\n", encoding="utf-8"
        )
        reserve()
        return process

    yield invoke
    reserve()
    after = {name: sha(ROOT / name) for name in before}
    unchanged = all(
        sha(ROOT / name) == digest for name, digest in primary["source_after"].items()
    )
    identity.update(
        source_after=after,
        source_unchanged=before == after,
        frozen_reference_unchanged=unchanged,
        calls=calls,
        executable_unchanged=sha(executable) == identity["executable_sha256"],
        dll_unchanged=sha(dll) == DLL_SHA,
        seconds=time.monotonic() - started,
    )
    identity["artifact_hashes"] = {
        p.relative_to(directory).as_posix(): sha(p)
        for p in sorted(directory.rglob("*"))
        if p.is_file()
    }
    (directory / "receipt.json").write_text(
        json.dumps(identity, sort_keys=True, indent=2) + "\n", encoding="utf-8"
    )
    assert (
        before == after
        and unchanged
        and identity["executable_unchanged"]
        and identity["dll_unchanged"]
    )


def pack(principal, groups, advection=0.0):
    rows = [f"nr-split-input-v1 58 {advection:.17g} {len(groups)}"]
    rows.extend(f"{value:.17g} {count}" for value, count in groups)
    rows.append(" ".join(f"{value:.17g}" for value in np.asarray(principal).ravel()))
    return "\n".join(rows) + "\n"


def analytic_case(advection=0.0, nonnormal=False):
    groups = [(-2.0, 10), (0.0, 15), (1.0, 12), (3.0, 10)]
    values = np.repeat([g[0] for g in groups], [g[1] for g in groups]) + advection
    basis = np.eye(47)
    if nonnormal:
        basis += 0.125 * np.eye(47, k=1) + 0.0625 * np.eye(47, k=7)
    inverse = np.linalg.inv(basis)
    out = []
    for speeds in (values, np.maximum(values, 0.0), np.minimum(values, 0.0)):
        a = np.zeros((58, 58))
        a[11:, 11:] = (basis * speeds) @ inverse
        out.append(a)
    return out, groups


def compare(native, principal, groups, advection, positive, negative):
    payload = pack(principal, groups, advection)
    first, second = native(payload), native(payload)
    assert first.returncode == second.returncode == 0, first.stderr.decode(
        errors="replace"
    )
    assert first.stdout == second.stdout and first.stderr == second.stderr == b""
    result = json.loads(first.stdout)
    assert result["component_only"] is True
    assert all(
        result[k] is False
        for k in (
            "native_einstein_symbol",
            "evolution_backend",
            "physical_gate",
            "scientificPayloadWriteback",
        )
    )
    scale = max(1.0, np.linalg.norm(principal, np.inf))
    for key, expected in (("positive", positive), ("negative", negative)):
        actual = np.asarray(result[key]).reshape(58, 58)
        assert np.isfinite(actual).all()
        assert np.count_nonzero(actual[:11]) == np.count_nonzero(actual[:, :11]) == 0
        assert np.max(abs(actual - expected)) / scale <= 2.0e-11
        jump = np.sin(0.13 * np.arange(58))
        for side in (0, 1):
            sign = 1.0 if side == 0 else -1.0
            weight = 17.0 / (48.0 * 6.0)
            assert (
                np.max(abs(sign * (actual @ jump - expected @ jump) / weight))
                / (scale / weight)
                <= 2.0e-11
            )
    assert result["condition"] <= 1.0e6 and result["residual"] <= 2.0e-11
    assert (
        result["symmetry_residual"] <= 2.0e-11
        and result["minimum_energy_eigenvalue"] > 0.0
    )
    return result


def test_analytic_lapack_abi(native):
    first, second = native(mode="--self-test"), native(mode="--self-test")
    assert first.returncode == second.returncode == 0, first.stderr.decode(
        errors="replace"
    )
    assert first.stdout == second.stdout
    data = json.loads(first.stdout)
    assert data["lapack_integer_bytes"] == 8 and data["windows_long_bytes"] == 4
    assert data["blas_threads"] == 1 and "USE64BITINT" in data["config"]
    assert (
        data["svd_reconstruction_error"] <= 1.0e-13 and data["inverse_error"] <= 1.0e-13
    )
    assert data["singular_inverse_rejected"] is True


@pytest.mark.parametrize("advection", [-3.0, -0.2, 0.0, 1.0e-13, 0.2, 2.0])
@pytest.mark.parametrize("nonnormal", [False, True])
def test_analytic_spectral_projectors(native, advection, nonnormal):
    (principal, positive, negative), groups = analytic_case(advection, nonnormal)
    result = compare(native, principal, groups, advection, positive, negative)
    if advection == 1.0e-13 and not nonnormal:
        assert np.asarray(result["positive"]).reshape(58, 58)[21, 21] > 0.0, (
            "small positive advection clipped"
        )


def grouped_roots(h, chi, alpha, beta, axis):
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
    return groups, float(beta[axis])


@pytest.mark.parametrize("axis", [0, 1, 2])
@pytest.mark.parametrize(
    "case",
    ["flat", "curved", "offdiagonal", "saved-corner", "saved-face", "saved-center"],
)
def test_actual_fo_principal_projectors(native, axis, case):
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
    reference = local_split(h, chi, alpha, beta, axis)
    groups, advection = grouped_roots(h, chi, alpha, beta, axis)
    compare(
        native,
        reference.principal,
        groups,
        advection,
        reference.positive,
        reference.negative,
    )


@pytest.mark.parametrize(
    "kind",
    [
        "ode-row",
        "ode-column",
        "nan",
        "infinity",
        "wrong-multiplicity",
        "duplicates",
        "unsorted",
        "jordan",
        "ill-conditioned",
        "empty",
        "wrong-dimension",
        "trailing",
        "bad-advection",
    ],
)
def test_bad_contracts_rejected(native, kind):
    (principal, _, _), groups = analytic_case()
    advection = 0.0
    if kind == "ode-row":
        principal[0, 12] = 1.0
    elif kind == "ode-column":
        principal[12, 0] = 1.0
    elif kind == "nan":
        principal[13, 14] = np.nan
    elif kind == "infinity":
        principal[13, 14] = np.inf
    elif kind == "wrong-multiplicity":
        groups = [(-2.0, 9), (0.0, 16), (1.0, 12), (3.0, 10)]
    elif kind == "duplicates":
        groups = [(-2.0, 10), (0.0, 10), (0.0, 5), (1.0, 12), (3.0, 10)]
    elif kind == "unsorted":
        groups = list(reversed(groups))
    elif kind == "jordan":
        principal[11, 12] = 1.0
    elif kind == "ill-conditioned":
        principal[11, 21] = 2.0e7
    elif kind == "bad-advection":
        advection = np.inf
    payload = pack(principal, groups, advection)
    if kind == "empty":
        payload = ""
    elif kind == "wrong-dimension":
        payload = payload.replace("v1 58", "v1 59", 1)
    elif kind == "trailing":
        payload += "unexpected\n"
    result = native(payload)
    assert result.returncode != 0 and result.stdout == b""
    assert b"native component rejected:" in result.stderr


def test_missing_library_rejected(native):
    result = native(
        mode="--self-test", dll_path=ROOT / "tmp/absent-nr-component-library.dll"
    )
    assert result.returncode != 0 and result.stdout == b""


def test_unknown_mode_rejected(native):
    result = native(mode="--unknown")
    assert result.returncode != 0 and result.stdout == b""
