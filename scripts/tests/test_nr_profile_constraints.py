"""Current-profile fixed physical rows; no envelope or physical promotion."""

import ast
import json
import os
from pathlib import Path

import numpy as np
import pytest

from science.numerical_relativity import profile_constraint_closure as P
from science.numerical_relativity import trajectory_reduction_balance as T


def close(actual, expected, tolerance=P.TOLERANCE):
    assert np.max(abs(np.asarray(actual) - expected)) <= tolerance


def save(name, value):
    location = os.environ.get("NR_PROFILE_CONSTRAINT_ROOT")
    if location:
        root = Path(location).resolve()
        assert root.parent == T.N.EVIDENCE
        with (root / (name + ".npy")).open("xb") as stream:
            np.save(stream, value, allow_pickle=False)


@pytest.fixture(scope="session")
def observations():
    result = dict(
        method=P.METHOD,
        coefficients=[],
        cases=[],
        target=None,
        native_calls=0,
        **{key: False for key in P.FALSE_FLAGS},
    )
    yield result
    location = os.environ.get("NR_PROFILE_CONSTRAINT_ROOT")
    if location:
        with (Path(location) / "profile-constraint-observations.json").open(
            "x", encoding="utf-8"
        ) as stream:
            json.dump(result, stream, sort_keys=True, allow_nan=False)


@pytest.mark.parametrize("mode", range(3))
def test_exact_source_tangent_against_independent_full58_probes(mode, observations):
    q = P.fixture(mode)
    source, probe = P.source_matrix(q), P.source_crosscheck(q)
    close(source, probe)
    assert np.max(abs(source)) > 1 and not source.flags.writeable
    save(f"source-{mode}", source)
    save(f"source-probe-{mode}", probe)
    observations["coefficients"].append(
        dict(mode=mode, error=float(np.max(abs(source - probe))))
    )


@pytest.mark.parametrize("mode", range(3))
@pytest.mark.parametrize("wave_index", range(7))
def test_fixed_physical_kernel_measurement_and_constructive_gauge_controls(
    mode, wave_index, observations
):
    q, wave = P.fixture(mode), P.WAVES[wave_index]
    rows, operator = P.constraint_rows(q, wave), P.generator(q, wave)
    report, B, null, witness = P.closure(rows, operator)
    assert rows.shape == (43, 58) and report["rows_added"] == 0
    assert report["rank"] == (39 if wave_index == 0 else 43)
    assert report["physical_subsidiary_equations_validated"] is False
    close(rows @ null, 0.0)
    close(null.conj().T @ null, np.eye(null.shape[1]))
    close(rows @ witness, 0.0)
    # Four independently specified pure gauge perturbations lie on all43 rows.
    # These are not constructed by the SVD used for the diagnostic null basis.
    for slot in range(6, 10):
        amplitude = np.zeros(58, dtype=complex)
        amplitude[slot] = 1
        gradient = 1j * np.array(wave)[:, None] * amplitude[None, :11]
        amplitude[25:] = P.R.gradient_aux(gradient)
        close(rows @ amplitude, 0.0)
        close(rows @ operator @ amplitude, 0.0)
    assert report["closed"] == (
        report["relative_row_residual"] <= P.TOLERANCE
        and report["relative_null_leak"] <= P.TOLERANCE
    )
    for name, value in dict(
        C=rows, L=operator, B=B, null=null, witness=witness
    ).items():
        save(f"case-{mode}-{wave_index}-{name}", value)
    observations["cases"].append(
        dict(mode=mode, wave_index=wave_index, wave=wave, **report)
    )


@pytest.mark.parametrize("axis", range(3))
def test_minkowski_H_M_rows_from_explicit_scalar_formula(axis):
    wave = np.eye(3)[axis]
    rows = P.constraint_rows(P.fixture(0), wave)
    expected = np.zeros((4, 58), dtype=complex)
    pair = {tuple(ij): offset for offset, ij in enumerate(P.R.PAIRS)}

    def index(i, j):
        return pair[tuple(sorted((i, j)))]

    for j in range(3):
        expected[0, 37 + 6 * j + index(axis, j)] += 2j
        expected[0, 37 + 6 * axis + index(j, j)] -= 2j
        expected[j + 1, 11 + index(j, axis)] += 1j
    expected[0, 55 + axis] += 4j
    expected[axis + 1, 17] -= (2 / 3) * 1j
    for j in range(3):
        expected[axis + 1, 11 + index(j, j)] -= 1j
    close(rows[35:39], expected)


@pytest.mark.parametrize("axis", range(3))
@pytest.mark.parametrize("polarization", (0, 1))
def test_transverse_traceless_metric_and_curvature_are_not_removed(axis, polarization):
    wave = np.eye(3)[axis]
    transverse = [k for k in range(3) if k != axis]
    i, j = transverse
    tensor = np.zeros((3, 3))
    if polarization:
        tensor[i, j] = tensor[j, i] = 1.0
    else:
        tensor[i, i], tensor[j, j] = 1.0, -1.0
    C, L = P.constraint_rows(P.fixture(0), wave), P.generator(P.fixture(0), wave)
    for offset in (0, 11):
        v = np.zeros(58, dtype=complex)
        v[offset : offset + 6] = [tensor[a, b] for a, b in P.R.PAIRS]
        if offset == 0:
            v[25:] = P.R.gradient_aux(1j * wave[:, None] * v[None, :11])
        close(C @ v, 0.0)
        close(C @ L @ v, 0.0)
        assert np.max(abs(L @ v)) > 0.1


@pytest.mark.parametrize("mode", range(3))
def test_reduction_forcing_mutation_has_a_concrete_kernel_witness(mode):
    q, wave = P.fixture(mode), (1.0, 2.0, -1.0)
    C, L = P.constraint_rows(q, wave), P.generator(q, wave)
    L[25, 6] += 1.0
    result, _, _, witness = P.closure(C, L)
    assert not result["closed"] and result["witness_rate"] > 0.01
    close(C @ witness, 0.0)
    assert np.max(abs(C @ L @ witness)) > 0.01


@pytest.mark.parametrize("mode", range(3))
def test_omitting_full_source_is_detected_not_principal_only_promoted(mode):
    q, wave = P.fixture(mode), (1.0, 2.0, -1.0)
    C = P.constraint_rows(q, wave)
    incomplete = P.generator(q, wave) - P.source_matrix(q)
    report, _, _, _ = P.closure(C, incomplete)
    assert not report["closed"] and report["relative_null_leak"] > 1e-4


@pytest.mark.parametrize("slot", (17, 25, 55))
def test_curved_or_dynamic_seed_cannot_be_silently_flattened(slot):
    q = P.fixture(0).copy()
    q[slot] = 1e-10
    with pytest.raises(ValueError, match="constant flat"):
        P.source_matrix(q)
    with pytest.raises(ValueError, match="constant flat"):
        P.constraint_rows(q, (1.0, 0.0, 0.0))


@pytest.mark.parametrize(
    "wave", ((float("inf"), 0.0, 0.0), (1j, 0, 0), (9.0, 0.0, 0.0), (1.0, 0.0))
)
def test_bad_waves_rejected(wave):
    with pytest.raises(ValueError):
        P.constraint_rows(P.fixture(0), wave)
    with pytest.raises(ValueError):
        P.generator(P.fixture(0), wave)


@pytest.mark.parametrize("mutation", ("shape", "nonfinite", "ambiguous-rank"))
def test_invalid_diagnostic_operator_rejected(mutation):
    C, L = np.eye(58)[:43].copy(), np.eye(58)
    if mutation == "shape":
        L = L[:-1]
    elif mutation == "nonfinite":
        C[0, 0] = np.nan
    else:
        C[-1, -16] = 1e-10
    with pytest.raises(ValueError):
        P.closure(C, L)


def test_known_closed_and_nonclosed_linear_systems():
    C, L = np.eye(58)[:43], np.eye(58)
    assert P.closure(C, L)[0]["closed"]
    L[0, 57] = 2.0
    report, _, _, witness = P.closure(C, L)
    assert not report["closed"]
    close(C @ witness, 0.0)
    assert report["witness_rate"] > 1


def test_all866_static_boundary_targets_and_initial_pulse_compatibility(observations):
    # The runner verifies the pinned original parent receipt and its inventory.
    reference = np.load(T.DIRECTORY / "reference.npy", allow_pickle=False)
    report, arrays = P.target_compatibility(reference)
    assert report["boundary_points"] == 866 and report["incident_face_nodes"] == 1014
    for key in (
        "static_target_error",
        "static_full58_rate",
        "initial_boundary_full58_rate",
        "initial_boundary_value_difference",
        "initial_boundary_gradient_difference",
        "static_hamiltonian",
        "static_z",
        "static_definition",
    ):
        assert report[key] <= P.TOLERANCE
    assert report["pulse_interior_rate"] > 1e-3
    assert not report["evolved_solution_checked"]
    assert all(report[key] is False for key in P.FALSE_FLAGS)
    for name, value in arrays.items():
        save("target-" + name, value)
    observations["target"] = report


def test_changed_static_target_rejected():
    reference = np.load(T.DIRECTORY / "reference.npy", allow_pickle=False)
    reference[6, 0, 0, 0] += 1e-6
    with pytest.raises(ValueError, match="original static target"):
        P.target_compatibility(reference)


def test_no_production_rhs_or_invariant_envelope_imports():
    tree = ast.parse(Path(P.__file__).read_text(encoding="utf-8"))
    imports = {
        node.module for node in ast.walk(tree) if isinstance(node, ast.ImportFrom)
    }
    assert imports == {"__future__", None}
    names = {
        alias.name
        for node in ast.walk(tree)
        if isinstance(node, ast.ImportFrom)
        for alias in node.names
    }
    assert names == {"annotations", "spectral_sat_oracle", "schwarzschild_initial_adm"}
    assert "_complete_invariant_rows" not in Path(P.__file__).read_text(
        encoding="utf-8"
    )
