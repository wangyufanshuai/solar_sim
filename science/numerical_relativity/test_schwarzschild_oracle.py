from __future__ import annotations

import numpy as np
import pytest

from .schwarzschild_oracle import (
    exact_hamiltonian_constraint,
    finite_difference_hamiltonian_constraint,
    run_constraint_convergence,
    schwarzschild_isotropic_lapse,
    schwarzschild_isotropic_slice,
)


def test_exact_exterior_slice_has_machine_scale_hamiltonian_constraint() -> None:
    radius = np.linspace(2.0, 20.0, 257)
    residual = exact_hamiltonian_constraint(radius, mass_length=1.0)
    assert float(np.max(np.abs(residual))) < 2.0e-14


def test_slice_contract_contains_time_symmetric_zero_shift_data() -> None:
    radius = np.linspace(2.0, 20.0, 17)
    data = schwarzschild_isotropic_slice(radius, mass_length=1.0)
    assert data.formulation == "time-symmetric-isotropic-schwarzschild"
    assert data.boundary == "analytic-oracle-only-no-time-evolution"
    assert data.shift.shape == (radius.size, 3)
    assert np.array_equal(data.shift, np.zeros_like(data.shift))
    assert np.array_equal(data.extrinsic_curvature_trace, np.zeros(radius.size))
    assert data.momentum_constraint_l2 == 0.0
    assert np.all((data.lapse > 0.0) & (data.lapse < 1.0))


def test_second_order_constraint_convergence_is_observed() -> None:
    report = run_constraint_convergence(
        grid_sizes=(101, 201, 401, 801),
        order=2,
    )
    assert report.passed
    assert report.observed_order >= 1.75


def test_fourth_order_constraint_convergence_is_observed() -> None:
    report = run_constraint_convergence(
        grid_sizes=(321, 641, 1281, 2561),
        order=4,
    )
    assert report.passed
    assert report.observed_order >= 3.6


def test_finite_difference_oracle_omits_boundary_points() -> None:
    radius = np.linspace(2.0, 20.0, 17)
    interior_radius, residual = finite_difference_hamiltonian_constraint(
        radius,
        order=2,
    )
    assert interior_radius.shape == (radius.size - 2,)
    assert residual.shape == interior_radius.shape
    assert np.all(np.isfinite(residual))


def test_exterior_contract_rejects_the_isotropic_throat() -> None:
    with pytest.raises(ValueError, match="M/2"):
        schwarzschild_isotropic_lapse(np.array([0.5, 1.0]), mass_length=1.0)
