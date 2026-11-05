from __future__ import annotations

from dataclasses import replace

import numpy as np
import pytest

from .fo_ccz4 import (
    FOCCZ4_AUXILIARY_VARIABLES,
    FOCCZ4_BASE_VARIABLES,
    FOCCZ4_ODE_VARIABLES,
    FOCCZ4_PDE_VARIABLES,
    FOCCZ4_VARIABLE_ORDER,
    build_fo_ccz4_auxiliary_3d,
    fo_ccz4_ordering_constraints_3d,
    fo_ccz4_variable_contract_3d,
)
from .bssn3d import _d1
from .manifest import manifest_from_fo_ccz4_report
from .nr3d import BSSNState3D, Grid3D


def _periodic_grid(points: int, *, spatial_order: int = 2) -> Grid3D:
    return Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
        spatial_order=spatial_order,
    )


def test_fo_ccz4_variable_contract_is_58_fields_and_stable() -> None:
    contract = fo_ccz4_variable_contract_3d()
    assert contract["base_variable_count"] == 25
    assert contract["auxiliary_variable_count"] == 33
    assert contract["total_variable_count"] == 58
    assert tuple(contract["auxiliary_variables"]) == FOCCZ4_AUXILIARY_VARIABLES
    assert tuple(contract["base_variables"]) == FOCCZ4_BASE_VARIABLES
    assert FOCCZ4_VARIABLE_ORDER == (*FOCCZ4_BASE_VARIABLES, *FOCCZ4_AUXILIARY_VARIABLES)
    assert len(FOCCZ4_ODE_VARIABLES) == 11
    assert len(FOCCZ4_PDE_VARIABLES) == 47
    assert FOCCZ4_VARIABLE_ORDER == (*FOCCZ4_ODE_VARIABLES, *FOCCZ4_PDE_VARIABLES)
    assert contract["strong_hyperbolicity_validated"] is False
    assert contract["production_evolution_validated"] is False


def test_fo_ccz4_auxiliary_is_zero_and_replayable_on_minkowski() -> None:
    state = BSSNState3D.minkowski(_periodic_grid(9))
    first = build_fo_ccz4_auxiliary_3d(state)
    second = build_fo_ccz4_auxiliary_3d(state)
    report = fo_ccz4_ordering_constraints_3d(state, first)
    assert first.sha256() == second.sha256()
    assert report.auxiliary_sha256 == first.sha256()
    assert report.max_curl_l_inf == 0.0
    assert report.max_algebraic_l_inf == 0.0
    assert report.finite
    assert report.strong_hyperbolicity_validated is False
    assert report.constraint_preserving_validated is False


def test_fo_ccz4_ordering_audit_is_resolution_monotone_for_gauge_wave() -> None:
    reports = []
    for points in (9, 17, 33):
        state = BSSNState3D.gauge_wave(
            _periodic_grid(points), amplitude=1.0e-2, wavelength=1.0
        )
        auxiliary = build_fo_ccz4_auxiliary_3d(state)
        reports.append(fo_ccz4_ordering_constraints_3d(state, auxiliary))
    assert all(report.finite for report in reports)
    assert reports[1].max_algebraic_l_inf < reports[0].max_algebraic_l_inf
    assert reports[2].max_algebraic_l_inf < reports[1].max_algebraic_l_inf
    assert reports[0].max_curl_l_inf == 0.0


def test_fo_ccz4_auxiliary_tracks_fourth_order_periodic_stencil() -> None:
    state = BSSNState3D.gauge_wave(
        _periodic_grid(17, spatial_order=4), amplitude=1.0e-3, wavelength=1.0
    )
    auxiliary = build_fo_ccz4_auxiliary_3d(state)
    report = fo_ccz4_ordering_constraints_3d(state, auxiliary)
    assert auxiliary.derivative_order == 4
    assert report.derivative_order == 4
    assert report.finite


def test_fo_ccz4_p_gradient_matches_project_chi_convention() -> None:
    state = BSSNState3D.gauge_wave(_periodic_grid(17), amplitude=1.0e-3)
    auxiliary = build_fo_ccz4_auxiliary_3d(state)
    expected = np.stack(
        [_d1(0.5 * np.log(state.chi), state, axis) for axis in range(3)], axis=-1
    )
    assert np.array_equal(auxiliary.conformal_factor_gradient, expected)


def test_fo_ccz4_audit_detects_corrupted_auxiliary_ordering() -> None:
    state = BSSNState3D.minkowski(_periodic_grid(9))
    auxiliary = build_fo_ccz4_auxiliary_3d(state)
    corrupted = auxiliary.lapse_gradient.copy()
    x, _, _ = state.grid.coordinates
    corrupted[..., 1] = np.sin(2.0 * np.pi * x)
    corrupted_auxiliary = replace(auxiliary, lapse_gradient=corrupted)
    report = fo_ccz4_ordering_constraints_3d(state, corrupted_auxiliary)
    assert report.curl_l_inf["A:01"] > 0.0
    assert report.max_curl_l_inf > 0.0


def test_fo_ccz4_manifest_keeps_58_field_identity_and_blocked_promotion() -> None:
    state = BSSNState3D.gauge_wave(_periodic_grid(9), amplitude=1.0e-3)
    report = fo_ccz4_ordering_constraints_3d(state)
    manifest = manifest_from_fo_ccz4_report(state, report)
    payload = manifest.payload()
    assert payload["formulation"] == "fo-ccz4-58-variable-shadow-contract"
    assert payload["promotion"] == "blocked-pending-58-variable-principal-symbol-and-cpbc"
    assert payload["diagnostics"]["variable_count"] == 58
    assert payload["diagnostics"]["auxiliary_sha256"] == report.auxiliary_sha256
    assert len(payload["diagnostics"]["variables"]) == 58


def test_fo_ccz4_auxiliary_rejects_masked_or_unsupported_grid() -> None:
    with pytest.raises(ValueError, match="formulation='ccz4'"):
        build_fo_ccz4_auxiliary_3d(
            BSSNState3D.minkowski(_periodic_grid(9), formulation="bssnok")
        )
    masked = BSSNState3D.schwarzschild_isotropic(
        Grid3D((9, 9, 9), (-1.0, -1.0, -1.0), (1.0, 1.0, 1.0), boundary="excision"),
        excision_radius=0.2,
        lapse_seed="psi-minus-two",
    )
    with pytest.raises(ValueError, match="fully valid"):
        build_fo_ccz4_auxiliary_3d(masked)
    with pytest.raises(ValueError, match="periodic or Sommerfeld"):
        build_fo_ccz4_auxiliary_3d(
            BSSNState3D.minkowski(
                Grid3D((9, 9, 9), (0.0, 0.0, 0.0), (1.0, 1.0, 1.0), boundary="excision")
            )
        )
