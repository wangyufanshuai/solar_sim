"""Independent boundary algebra controls, not nonlinear/CPBC qualification."""

import ast
import json
import os
from pathlib import Path

import numpy as np
import pytest

from science.numerical_relativity import spectral_sat_oracle as S
from science.numerical_relativity import saved_sat_audit as P
from science.numerical_relativity.fo_ccz4_sbp_nonlinear import local_split


def close(actual, expected):
    assert np.max(abs(np.asarray(actual) - expected)) <= S.TOLERANCE


def cell(mode):
    if mode == 0:
        h, alpha, chi, beta = np.eye(3), 1.0, 1.0, np.zeros(3)
    else:
        lower = np.array([[1.0, 0, 0], [0.12, 1.0, 0], [-0.08, 0.06, 1.0]])
        h = lower @ lower.T
        if mode == 1:
            alpha, chi, beta = 0.85, 0.72, np.array([0.03, -0.04, 0.05])
        else:
            h = h[np.ix_([2, 0, 1], [2, 0, 1])]
            alpha, chi, beta = 1.4, 1.1, np.array([0.4, -0.35, 0.2])
    q = np.zeros(58)
    q[:11] = S.R.pack_base(h, np.log(alpha), beta, 0.5 * np.log(chi))
    return q


@pytest.fixture(scope="session")
def observations():
    result = dict(
        method=S.METHOD,
        coefficient_cases=[],
        new_scientific_evolution=False,
        native_calls=0,
        physical_boundary_validated=False,
        common_symmetrizer_validated=False,
    )
    yield result
    location = os.environ.get("NR_SPECTRAL_CONTROL_ROOT")
    if location:
        root = Path(location).resolve()
        assert root.parent == P.N.EVIDENCE
        with (root / "spectral-sat-observations.json").open(
            "x", encoding="utf-8"
        ) as stream:
            json.dump(result, stream, sort_keys=True, allow_nan=False)


@pytest.mark.parametrize("mode", range(3))
@pytest.mark.parametrize("axis", range(3))
def test_full_principal_and_absolute_against_production(mode, axis, observations):
    q = cell(mode)
    oracle = S.SpectralSAT.from_cell(q, axis)
    production = local_split(
        S.R.sym(q, 0), float(np.exp(2 * q[10])), float(np.exp(q[6])), q[7:10], axis
    )
    absolute = oracle.absolute(np.eye(58))
    close(oracle.matrix, production.principal)
    close(absolute, production.positive - production.negative)
    close(absolute @ absolute, oracle.matrix @ oracle.matrix)
    close(absolute @ oracle.matrix, oracle.matrix @ absolute)
    jump = 0.1 * np.sin(np.arange(58) + 0.3)
    close(oracle.absolute(jump), oracle.absolute(jump, precision=70))
    errors = []
    for side in (0, 1):
        weight = (17 / 48) * (1 / 6)
        actual = oracle.penalty(jump, side, weight)
        expected = production.penalty(jump, side, weight)
        close(actual, expected)
        close(oracle.penalty(jump, side, weight / 2), 2 * actual)
        errors.append(float(np.max(abs(actual - expected))))
    row = dict(
        mode=mode,
        axis=axis,
        principal_error=float(np.max(abs(oracle.matrix - production.principal))),
        absolute_error=float(
            np.max(abs(absolute - production.positive + production.negative))
        ),
        penalty_errors=errors,
        algebra_error=float(
            np.max(abs(absolute @ absolute - oracle.matrix @ oracle.matrix))
        ),
    )
    observations["coefficient_cases"].append(row)
    location = os.environ.get("NR_SPECTRAL_CONTROL_ROOT")
    if location:
        # Small persisted controls only; no production/native invocation is added.
        root = Path(location)
        for name, value in dict(
            principal=oracle.matrix,
            absolute=absolute,
            production_principal=production.principal,
            production_absolute=production.positive - production.negative,
        ).items():
            with (root / f"coefficient-{mode}-{axis}-{name}.npy").open("xb") as stream:
                np.save(stream, value, allow_pickle=False)


@pytest.mark.parametrize("shift", (-4.0, -0.3, 0.0, 0.3, 4.0))
@pytest.mark.parametrize("side", (0, 1))
def test_known_similarity_incoming_modes_and_scalar_energy(shift, side):
    roots = np.array([-2.0, -0.2, 0.0, 0.7, 2.0])
    basis = np.eye(5) + 0.1 * np.triu(np.ones((5, 5)), 1)
    inverse = np.linalg.inv(basis)
    centered = (basis * roots) @ inverse
    vector = np.array([0.3, -0.8, 0.7, 0.2, -0.4])
    absolute = S.interpolated_absolute(centered, roots, shift, vector)
    expected = (basis * abs(roots + shift)) @ inverse
    close(absolute, expected @ vector)
    full = centered + shift * np.eye(5)
    weight = 17 / 288
    penalty = (
        (full @ vector - absolute) if side == 0 else (-full @ vector - absolute)
    ) / (2 * weight)
    selected = (
        np.minimum(roots + shift, 0) if side == 0 else -np.maximum(roots + shift, 0)
    )
    close(penalty, (basis * selected) @ inverse @ vector / weight)
    metric = inverse.T @ inverse
    # Only this constant-coefficient one-direction synthetic system has this H.
    energy = (2 * side - 1) * (vector @ metric @ full @ vector) + 2 * weight * (
        vector @ metric @ penalty
    )
    close(energy, -vector @ metric @ expected @ vector)
    assert energy <= S.TOLERANCE


@pytest.mark.parametrize("shift", (-1e-14, 1e-14))
def test_tiny_advected_zero_mode_not_clipped(shift):
    roots = np.array([-1.0, 0.0, 1.0])
    answer = S.interpolated_absolute(
        np.diag(roots), roots, shift, np.array([0.0, 1.0, 0.0])
    )
    assert answer[1] == abs(shift) and answer[1] > 0


@pytest.mark.parametrize("axis", range(3))
def test_principal_ignores_only_zero_order_fields(axis):
    q = cell(1)
    changed = q.copy()
    changed[11:] = 0.03 * np.sin(np.arange(47))
    assert np.array_equal(S.principal(q, axis), S.principal(changed, axis))


@pytest.mark.parametrize("point", P.points())
def test_all_incident_faces_and_distinct_targets_sum(point):
    q = np.ones(58)
    targets = [np.full(58, j + 2.0) for j in range(6)]

    class Fake:
        def __init__(self, axis):
            self.axis = axis

        def penalty(self, jump, side, weight):
            value = np.zeros(58)
            value[25 + self.axis] = (2 * side - 1) * jump[25 + self.axis] / weight
            return value

    actual, rows = S.assemble(
        point, (13,) * 3, q, targets, (1 / 6,) * 3, factory=lambda q, a: Fake(a)
    )
    expected = np.zeros(58)
    faces = []
    for axis in range(3):
        if point[axis] in (0, 12):
            side = int(point[axis] == 12)
            expected[25 + axis] = (
                (2 * side - 1) * (1 - (2 * axis + side + 2)) / (17 / 288)
            )
            faces.append((axis, side))
    close(actual, expected)
    assert [(a, s) for a, s, _ in rows] == faces
    if len(rows) > 1:
        assert np.max(abs(actual - expected / len(rows))) > 1


def test_interior_has_no_face_penalty():
    def forbidden(*args):
        raise AssertionError("interior requested a split")

    value, rows = S.assemble(
        (6, 6, 6),
        (13,) * 3,
        np.zeros(58),
        [np.zeros(58)] * 6,
        (1 / 6,) * 3,
        factory=forbidden,
    )
    assert not np.any(value) and rows == []


@pytest.mark.parametrize(
    "bad",
    (
        "axis",
        "shape",
        "lapse",
        "determinant",
        "root_order",
        "matrix_nan",
        "precision",
        "bool_side",
        "bool_weight",
    ),
)
def test_invalid_inputs_rejected(bad):
    q = cell(0)
    with pytest.raises(ValueError):
        if bad == "axis":
            S.coefficients(q, True)
        elif bad == "shape":
            S.coefficients(q[:-1], 0)
        elif bad == "lapse":
            q[6] = np.log(2.0)
            S.coefficients(q, 0)
        elif bad == "determinant":
            q[0] = 2.0
            S.coefficients(q, 0)
        elif bad in ("root_order", "matrix_nan", "precision"):
            S.interpolated_absolute(
                np.array([[np.nan]]) if bad == "matrix_nan" else np.eye(1),
                np.array([0.0, 0.0]) if bad == "root_order" else np.array([0.0]),
                0.0,
                np.ones(1),
                precision=40 if bad == "precision" else 50,
            )
        else:
            value = S.SpectralSAT.from_cell(q, 0)
            value.penalty(
                np.ones(58),
                True if bad == "bool_side" else 0,
                True if bad == "bool_weight" else 1.0,
            )


def test_readonly_oracle_and_output():
    value = S.SpectralSAT.from_cell(cell(0), 0)
    for array in (
        value.matrix,
        value.roots,
        value.absolute(np.ones(58)),
        value.penalty(np.ones(58), 0, 1.0),
    ):
        assert not array.flags.writeable
        with pytest.raises(ValueError):
            array.flat[0] = 1


def test_no_production_symbol_split_or_eigenvector_import():
    source = Path(S.__file__).read_text(encoding="utf-8")
    tree = ast.parse(source)
    forbidden = {
        "local_split",
        "_speed_families",
        "frozen_fo_ccz4_principal_matrix_3d",
        "svd",
        "eig",
        "eigh",
    }
    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            assert node.id not in forbidden
        if isinstance(node, ast.Attribute):
            assert node.attr not in forbidden
    imports = [n.module for n in ast.walk(tree) if isinstance(n, ast.ImportFrom)]
    assert not any("fo_ccz4_sbp" in (x or "") or "frozen" in (x or "") for x in imports)


@pytest.mark.parametrize("count", (7, 14, 28))
def test_saved_probe_selection_fixed_to_first_and_last(count):
    segments = [
        dict(start=i, steps=min(2, 2 * count - i)) for i in range(count, 2 * count, 2)
    ]
    first, last = P.selections(dict(segments=segments))
    assert first == ("first", segments[0], 0, 0)
    assert last == ("last", segments[-1], segments[-1]["steps"] - 1, 3)


def test_saved_probe_strata_exact():
    pts = P.points()
    counts = [sum(i in (0, 12) for i in p) for p in pts]
    assert len(pts) == len(set(pts)) == 26
    assert [counts.count(k) for k in (1, 2, 3)] == [6, 12, 8]
    assert sum(counts) == 54
