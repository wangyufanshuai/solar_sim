from __future__ import annotations

from dataclasses import asdict
import json
from fractions import Fraction
from pathlib import Path
import runpy

import numpy as np
import pytest

from .ccz4_reference import GaugeConfig
from .fo_ccz4_frozen_characteristics import audit_frozen_fo_ccz4_eigenspaces_3d as audit
from .fo_ccz4_frozen_symbol import probe_frozen_fo_ccz4_rhs_matrix_3d
from .fo_ccz4_frozen_symbol import frozen_fo_ccz4_principal_matrix_3d
from .fo_ccz4_rhs import FOCCZ4Config


@pytest.mark.parametrize("normal", ((1., 0., 0.), (0., -1., 0.), (1., -2., .3)))
def test_complete_eigenspaces_at_nonflat_points(normal):
    h = np.asarray(((1.1, .13, -.1), (.13, .9, .02), (-.1, .02, 1.2)))
    h /= np.linalg.det(h)**(1./3.)
    args = (h, .61, .7, (.2, -.1, .05), normal)
    first, second = audit(*args), audit(*args)
    assert first == second
    assert first.pointwise_eigenbasis_validated
    assert first.basis_rank == first.basis_columns == 58
    assert sum(root.algebraic_multiplicity for root in first.roots) == 58
    assert all(root.nullity_stable and root.multiplicity_matches for root in first.roots)
    assert first.basis_condition_number < 1.e6
    assert not first.strong_hyperbolicity_validated
    assert not first.variable_coefficient_energy_estimate_validated
    assert not first.cpbc_ready and not first.runtime_writeback
    json.dumps(asdict(first), allow_nan=False)


@pytest.mark.parametrize("chi,f,rank", ((1., .75, 56), (2./3., 1., 56), (.5, 1., 54)))
def test_real_speed_collisions_are_not_promoted(chi, f, rank):
    result = audit(np.eye(3), chi, 1., (0., 0., 0.), (1., 0., 0.),
                   gauge=GaugeConfig(theta_coupling=2., shift_coefficient=f))
    assert not result.pointwise_eigenbasis_validated
    assert result.basis_rank == result.basis_columns == rank
    assert result.basis_condition_number is None
    bad = [root for root in result.roots if not root.multiplicity_matches]
    assert len(bad) == 2  # Both signs of the coincident characteristic speed.
    assert all(root.nullity_stable and len(root.families) >= 2 for root in bad)
    assert all(root.numerical_nullities[0] < root.algebraic_multiplicity for root in bad)
    json.dumps(asdict(result), allow_nan=False)


def test_benign_collision_is_not_rejected_merely_for_equal_speeds():
    result = audit(np.eye(3), 1., 1., (0., 0., 0.), (1., 0., 0.))
    assert result.pointwise_eigenbasis_validated
    assert any(len(row.families) > 1 for row in result.roots)


def test_advection_respects_ode_pde_split_and_normal_scaling():
    args = (np.eye(3), .6, .8, (.03, 0., 0.))
    first = audit(*args, (1., 0., 0.))
    small = audit(*args, (1.e-14, 0., 0.))
    reverse = audit(*args, (-1., 0., 0.))
    assert first.pointwise_eigenbasis_validated and small.pointwise_eigenbasis_validated
    assert first.basis_condition_number == small.basis_condition_number
    assert first.normalized_principal_sha256 == small.normalized_principal_sha256
    np.testing.assert_allclose([r.value for r in first.roots], [r.value/1.e-14 for r in small.roots], atol=1.e-14)
    np.testing.assert_allclose([r.value for r in reverse.roots], [-r.value for r in first.roots[::-1]], atol=1.e-14)
    assert next(r for r in first.roots if r.families == ("ODE",)).algebraic_multiplicity == 11
    assert next(r for r in first.roots if r.families == ("PDE-advection",)).value == .03


def test_published_speeds_agree_with_actual_rhs_not_only_assembly():
    args = (np.eye(3), .6, .8, (.03, 0., 0.), (1., 0., 0.))
    result = audit(*args)
    reference = probe_frozen_fo_ccz4_rhs_matrix_3d(*args)
    actual = np.linalg.eigvals(reference)
    assert np.max(abs(actual.imag)) < 1.e-10
    expected = [root.value for root in result.roots for _ in range(root.algebraic_multiplicity)]
    np.testing.assert_allclose(np.sort(actual.real), np.sort(expected), rtol=0., atol=1.e-10)


def test_unsupported_formulations_and_invalid_thresholds_rejected():
    args = (np.eye(3), 1., 1., (0., 0., 0.), (1., 0., 0.))
    for config in (FOCCZ4Config(cleaning_speed=2.), FOCCZ4Config(shift_strength=0.)):
        with pytest.raises(ValueError, match="speed contract"):
            audit(*args, config=config)
    with pytest.raises(ValueError, match="det"):
        audit(2.*np.eye(3), *args[1:])
    with pytest.raises(ValueError, match="rank tolerances"):
        audit(*args, rank_relative_tolerances=())
    with pytest.raises(ValueError, match="condition_number_limit"):
        audit(*args, condition_number_limit=float("nan"))


def test_condition_bound_is_a_separate_gate():
    result = audit(np.eye(3), 1., 1., (0., 0., 0.), (1., 0., 0.), condition_number_limit=1.)
    assert result.basis_rank == 58
    assert all(row.multiplicity_matches for row in result.roots)
    assert not result.pointwise_eigenbasis_validated


@pytest.fixture(scope="module")
def rational_certificate():
    pytest.importorskip("sympy", reason="exact rational certificate requires SymPy")
    driver = runpy.run_path(str(Path(__file__).resolve().parents[2] / "scripts/run-nr-k3-fo-ccz4-frozen-eigenspaces.py"))
    return driver["rational_collision_certificate"]


@pytest.mark.parametrize("chi,f,square,expected", (
    (1., .75, Fraction(1), (12, 14)),
    (2./3., 1., Fraction(4,3), (2, 4)),
    (.5, 1., Fraction(1,2), (12, 16)),
    (1., 1., Fraction(4,3), (2, 2)),
))
def test_exact_rational_kernel_growth_is_not_a_float_rank_artifact(rational_certificate, chi, f, square, expected):
    matrix = frozen_fo_ccz4_principal_matrix_3d(np.eye(3), chi, 1., (0.,0.,0.), (1.,0.,0.),
                                             gauge=GaugeConfig(theta_coupling=2., shift_coefficient=f))
    result = rational_certificate(matrix, square)
    assert (result["nullity_pA"], result["nullity_pA_squared"]) == expected
    assert result["nonsemisimple_rational_reconstruction"] == (expected[1] > expected[0])
    assert result["reconstruction_l_inf"] < 2.e-14


def test_rational_reconstruction_rejects_unjustified_rounding(rational_certificate):
    matrix = np.eye(58)
    matrix[0, 1] = np.sqrt(2.)
    with pytest.raises(ValueError, match="reconstruction tolerance"):
        rational_certificate(matrix, Fraction(1))
