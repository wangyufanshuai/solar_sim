from __future__ import annotations

import pytest

from .ccz4_reference import CCZ4State1D, Grid1D
from .manifest import (
    manifest_from_3d_state,
    manifest_from_bssn_state,
    manifest_from_constraint_report,
    validate_fo_ccz4_cpp_manifest,
)
from .nr3d import BSSNState3D, Grid3D
from .schwarzschild_oracle import run_constraint_convergence


def test_k0_manifest_is_deterministic_and_remains_blocked() -> None:
    report = run_constraint_convergence(
        grid_sizes=(101, 201, 401, 801),
        order=2,
    )
    first = manifest_from_constraint_report(report)
    second = manifest_from_constraint_report(report)
    assert first.canonical_json() == second.canonical_json()
    assert first.sha256() == second.sha256()
    assert first.payload()["status"] == "oracle-only"
    assert first.payload()["promotion"] == "blocked-pending-dynamic-evolution"
    assert first.payload()["diagnostics"]["refinement_passed"] is True


def test_bssn_manifest_matches_the_cpp_cross_backend_envelope() -> None:
    state = CCZ4State1D.minkowski(Grid1D(9, 0.0, 1.0), formulation="bssnok")
    manifest = manifest_from_bssn_state(state)
    payload = manifest.payload()
    assert payload["schema_version"] == "nr-run-manifest-v1"
    assert payload["kernel_id"] == "nr-k1b-python-bssnok-shadow"
    assert payload["formulation"] == "bssnok-1d-reference"
    assert payload["promotion"] == "blocked-pending-k2-compatibility-and-k3-3d"
    assert payload["grid"]["points"] == 9
    assert payload["diagnostics"]["variable_count"] == 25
    assert payload["diagnostics"]["variables"][0] == "chi"


def test_3d_manifest_records_geometry_constraints_and_blocked_promotion() -> None:
    state = BSSNState3D.minkowski(
        Grid3D((5, 6, 7), (-1.0, -2.0, -3.0), (1.0, 2.0, 3.0), boundary="periodic"),
        formulation="ccz4",
    )
    first = manifest_from_3d_state(state)
    second = manifest_from_3d_state(state)
    assert first.sha256() == second.sha256()
    payload = first.payload()
    assert payload["formulation"] == "ccz4-3d-reference"
    assert payload["promotion"] == "blocked-pending-k3-dynamic-amr-boundaries"
    assert payload["grid"]["shape"] == [5, 6, 7]
    assert payload["grid"]["spatial_order"] == 2
    assert payload["diagnostics"]["valid_cell_count"] == 5 * 6 * 7
    assert payload["diagnostics"]["boundary_operator"] == "periodic-centered"
    assert payload["diagnostics"]["constraint_norms"]["hamiltonian_l_inf"] == 0.0


def _valid_cpp_manifest() -> dict[str, object]:
    from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER

    return {
        "schema_version": "nr-run-manifest-v1",
        "kernel_version": "0.1.0",
        "formulation": "fo-ccz4-58-variable-shadow-contract",
        "status": "shadow",
        "promotion": "blocked-pending-fo-ccz4-cpp-rhs-and-cpbc",
        "units": "geometric-G=c=1",
        "coordinate_system": "cartesian-3d",
        "gauge": "advective-1+log-gamma-driver",
        "boundary": "periodic",
        "grid": {
            "shape": [8, 8, 8],
            "spacing": [0.125, 0.125, 0.125],
            "dt": 1.0e-5,
        },
        "diagnostics": {
            "scenario": "gauge-wave",
            "solver_mode": "analytic-3d-fo-ccz4-contract",
            "dynamic_rhs_implemented": False,
            "variable_count": 58,
            "ode_variable_count": 11,
            "pde_variable_count": 47,
            "variables": list(FOCCZ4_VARIABLE_ORDER),
            "fo_ccz4_parameters": {
                "kappa1": 0.1,
                "kappa2": 0.0,
                "kappa3": 1.0,
                "cleaning_speed": 1.0,
                "ordering_mu": 1.0,
                "shift_strength": 1.0,
                "tau_inverse": 0.0,
                "k0": 0.0,
                "c": 1.0,
                "lapse_coefficient": 2.0,
                "shift_coefficient": 1.0,
                "shift_damping": 0.0,
            },
            "auxiliary_ordering_reconstructed": True,
            "checkpoint_deterministic": True,
            "checkpoint_present": True,
            "state_checksum_fnv1a64": "0123456789abcdef",
            "checkpoint_checksum_fnv1a64": "fedcba9876543210",
        },
    }


def test_cpp_manifest_validator_accepts_the_canonical_shadow_envelope() -> None:
    validate_fo_ccz4_cpp_manifest(_valid_cpp_manifest(), expected_solver_mode="analytic-3d-fo-ccz4-contract")


def test_cpp_manifest_validator_rejects_parameter_or_mode_drift() -> None:
    payload = _valid_cpp_manifest()
    payload["diagnostics"]["fo_ccz4_parameters"]["ordering_mu"] = 0.5  # type: ignore[index]
    with pytest.raises(ValueError, match="ordering_mu"):
        validate_fo_ccz4_cpp_manifest(payload)
    payload = _valid_cpp_manifest()
    payload["diagnostics"]["solver_mode"] = "fo-ccz4-rhs-shadow-rk4"  # type: ignore[index]
    with pytest.raises(ValueError, match="expected mode"):
        validate_fo_ccz4_cpp_manifest(payload, expected_solver_mode="analytic-3d-fo-ccz4-contract")
