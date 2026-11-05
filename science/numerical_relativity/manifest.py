"""Stable result-manifest contract for numerical-relativity shadow runs."""

from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
import math
from typing import Any, Mapping

from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER
from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .fo_ccz4_constraint_control import constraint_control_identity, validate_tau_inverse
from .fo_ccz4_schwarzschild import SchwarzschildDomain, BOUNDARY, DOMAIN_KEY


FOCCZ4_CPP_PARAMETER_CONTRACT: Mapping[str, float] = {
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
}


def validate_fo_ccz4_cpp_manifest(
    payload: Mapping[str, Any],
    *,
    expected_solver_mode: str | None = None,
    expected_profile: FOCCZ4GaugeProfile | None = None,
    expected_spatial_order: int = 2,
    expected_tau_inverse: float = 0.0,
    expected_domain: SchwarzschildDomain | None = None,
) -> None:
    """Fail closed unless a C++ FO-CCZ4 manifest matches the K2 contract.

    This validator is intentionally independent of the C++ JSON writer.  It
    checks the language-neutral envelope, canonical 58-slot ordering, fixed
    shadow gauge/configuration, grid metadata, and checkpoint provenance.  It
    does not claim that the executable is a physical or production solver.

    Versions through 0.3.1 remain readable as historical envelopes ONLY. Their
    unconditional auxiliary reconstruction marker is ambiguous and must not be
    interpreted as evidence of reconstruction in a dynamic evolution/restart.
    Version 0.3.2 replaces it with an explicit, mode-bound algorithm policy, not
    an assertion about how a particular invocation obtained its initial state.
    """

    def require(condition: bool, message: str) -> None:
        if not condition:
            raise ValueError(message)

    rate = validate_tau_inverse(expected_tau_inverse)
    require(payload.get("schema_version") == "nr-run-manifest-v1", "manifest schema mismatch")
    kernel_version = payload.get("kernel_version")
    require(kernel_version in ("0.1.0", "0.2.0", "0.2.1", "0.3.0", "0.3.1", "0.3.2", "0.4.0", "0.5.0"),
            "manifest kernel version is not supported")
    require(
        payload.get("formulation") == "fo-ccz4-58-variable-shadow-contract",
        "manifest formulation mismatch",
    )
    require(payload.get("status") == "shadow", "manifest status is not shadow")
    promotion = payload.get("promotion")
    require(isinstance(promotion, str) and promotion.startswith("blocked-"), "manifest promotion is not blocked")
    require(payload.get("units") == "geometric-G=c=1", "manifest units mismatch")
    require(payload.get("coordinate_system") == "cartesian-3d", "manifest coordinate system mismatch")
    require(payload.get("gauge") == "advective-1+log-gamma-driver", "manifest gauge mismatch")
    require(expected_domain is None or isinstance(expected_domain, SchwarzschildDomain), "manifest expected domain invalid")
    require(payload.get("boundary") == (BOUNDARY if expected_domain else "periodic"), "manifest boundary mismatch")

    grid = payload.get("grid")
    require(isinstance(grid, Mapping), "manifest grid is missing")
    require(type(expected_spatial_order) is int and expected_spatial_order in (2,4),
            "expected spatial order must be integer 2 or 4")
    order = grid.get("spatial_order", 2)
    require(type(order) is int and order == expected_spatial_order, "manifest spatial order mismatch")
    explicit_order = ("spatial_order" in grid or expected_spatial_order == 4
                      or payload.get("kernel_version") not in ("0.1.0", "0.2.0", "0.2.1"))
    require(not explicit_order or "spatial_order" in grid, "manifest spatial order is missing")
    shape = grid.get("shape")
    require(
        isinstance(shape, list)
        and len(shape) == 3
        and all(isinstance(value, int) and value >= 5 for value in shape),
        "manifest grid shape mismatch",
    )
    spacing = grid.get("spacing")
    require(
        isinstance(spacing, list)
        and len(spacing) == 3
        and all(isinstance(value, (int, float)) and math.isfinite(float(value)) for value in spacing),
        "manifest grid spacing mismatch",
    )
    expected_spacing = ((expected_domain.upper - expected_domain.lower) / (shape[0] - 1)
                        if expected_domain else 1.0 / float(shape[0]))
    if expected_domain:
        require(len(set(shape)) == 1 and shape[0] >= 9, "Schwarzschild cubic shape required")
        require(grid.get("lower") == [expected_domain.lower]*3 and grid.get("upper") == [expected_domain.upper]*3,
                "manifest Schwarzschild bounds mismatch")
    require(
        all(math.isclose(float(value), expected_spacing, rel_tol=0.0, abs_tol=1.0e-15) for value in spacing),
        "manifest grid spacing is not periodic unit-domain spacing",
    )
    require(
        isinstance(grid.get("dt"), (int, float))
        and math.isfinite(float(grid["dt"]))
        and float(grid["dt"]) > 0.0,
        "manifest dt mismatch",
    )

    diagnostics = payload.get("diagnostics")
    require(isinstance(diagnostics, Mapping), "manifest diagnostics are missing")
    if explicit_order:
        expected_version = 5 if expected_domain else (4 if rate > 0. else (3 if order == 4 else (2 if expected_profile else 1)))
        require(diagnostics.get("checkpoint_version") == expected_version, "manifest order/checkpoint mismatch")
        require(diagnostics.get("spatial_order_bound_to_checkpoint") is True, "manifest order not bound to checkpoint")
        require(diagnostics.get("spatial_operator") == ("centered-interior-two-fixed-layers" if expected_domain
                                                      else "centered-periodic"), "manifest spatial operator mismatch")
        require(diagnostics.get("numerical_dissipation") == "none", "manifest numerical dissipation mismatch")
    scenario = diagnostics.get("scenario")
    require(scenario in (("schwarzschild-exterior",) if expected_domain else ("minkowski", "gauge-wave")),
            "manifest scenario mismatch")
    if expected_domain:
        require(kernel_version == "0.5.0" and diagnostics.get("domain_bound_to_checkpoint") is True,
                "manifest domain not versioned/bound to checkpoint")
        domain_identity = diagnostics.get(DOMAIN_KEY)
        expected_identity = expected_domain.identity()
        require(isinstance(domain_identity, Mapping) and set(domain_identity) == set(expected_identity),
                "manifest Schwarzschild identity fields mismatch")
        for name, expected in expected_identity.items():
            same_type = (type(domain_identity[name]) in (int, float) if name in ("lower", "upper", "mass")
                         else type(domain_identity[name]) is type(expected))
            require(same_type and domain_identity[name] == expected, "manifest Schwarzschild identity mismatch: "+name)
        require(diagnostics.get("solver_mode") == "fo-ccz4-rhs-shadow-rk4", "Schwarzschild requires dynamic mode")
    else:
        require(DOMAIN_KEY not in diagnostics and "domain_bound_to_checkpoint" not in diagnostics,
                "periodic manifest cannot contain Schwarzschild domain")
    solver_mode = diagnostics.get("solver_mode")
    require(
        solver_mode in ("analytic-3d-fo-ccz4-contract", "fo-ccz4-rhs-shadow-rk4"),
        "manifest solver mode mismatch",
    )
    if expected_solver_mode is not None:
        require(solver_mode == expected_solver_mode, "manifest solver mode does not match expected mode")
    require(
        bool(diagnostics.get("dynamic_rhs_implemented"))
        == (solver_mode == "fo-ccz4-rhs-shadow-rk4"),
        "manifest dynamic RHS flag mismatch",
    )
    require(diagnostics.get("variable_count") == 58, "manifest variable count mismatch")
    require(diagnostics.get("ode_variable_count") == 11, "manifest ODE variable count mismatch")
    require(diagnostics.get("pde_variable_count") == 47, "manifest PDE variable count mismatch")
    require(tuple(diagnostics.get("variables", ())) == tuple(FOCCZ4_VARIABLE_ORDER), "manifest variable order mismatch")
    parameters = diagnostics.get("fo_ccz4_parameters")
    require(isinstance(parameters, Mapping), "manifest FO-CCZ4 parameters are missing")
    if expected_profile is None:
        require("gauge_profile" not in diagnostics, "manifest gauge profile requires explicit expected profile")
    else:
        require(diagnostics.get("gauge_profile") == expected_profile.identity(), "manifest gauge profile mismatch")
        require(solver_mode == "fo-ccz4-rhs-shadow-rk4", "profile requires dynamic solver mode")
        require(diagnostics.get("checkpoint_version") == (5 if expected_domain else (4 if rate > 0. else (3 if order == 4 else 2))),
                "profile checkpoint version mismatch")
        require(diagnostics.get("gauge_profile_bound_to_checkpoint") is True, "profile not bound to checkpoint")
        require(diagnostics.get("runtime_writeback") is False, "profile forbids runtime writeback")
        require(diagnostics.get("dynamic_evolution_validated") is False, "profile not physically validated")
    for name, expected in FOCCZ4_CPP_PARAMETER_CONTRACT.items():
        if name == "tau_inverse":
            expected = rate
        value = parameters.get(name)
        if expected_profile is not None and name in ("ordering_mu", "shift_coefficient"):
            require(name in parameters and value is None, f"manifest variable coefficient must be null: {name}")
            continue
        require(
            isinstance(value, (int, float))
            and math.isfinite(float(value))
            and math.isclose(float(value), expected, rel_tol=0.0, abs_tol=1.0e-15),
            f"manifest FO-CCZ4 parameter mismatch: {name}",
        )
    if kernel_version in ("0.4.0", "0.5.0"):
        control = diagnostics.get("constraint_control")
        expected_control = constraint_control_identity(rate)
        require(isinstance(control, Mapping) and set(control) == set(expected_control),
                "manifest constraint control fields mismatch")
        for name, expected in expected_control.items():
            same_type = (type(control[name]) in (int, float) if name == "tau_inverse"
                         else type(control[name]) is type(expected))
            require(same_type and control[name] == expected,
                    f"manifest constraint control mismatch: {name}")
        require(diagnostics.get("constraint_control_bound_to_checkpoint") is True,
                "manifest constraint control not bound to checkpoint")
        require(rate == 0. or solver_mode == "fo-ccz4-rhs-shadow-rk4", "relaxation requires dynamic mode")
    else:
        require(rate == 0. and "constraint_control" not in diagnostics
                and "constraint_control_bound_to_checkpoint" not in diagnostics,
                "historical manifest cannot acquire constraint control")
    if kernel_version in ("0.3.2", "0.4.0", "0.5.0"):
        require(payload.get("kernel_id") == "nr-k2-cpp-openmp-fo-ccz4-shadow",
                "manifest kernel identity mismatch")
        dynamic = solver_mode == "fo-ccz4-rhs-shadow-rk4"
        require(diagnostics.get("dynamic_rhs_implemented") is dynamic,
                "manifest dynamic RHS flag must be a mode-bound boolean")
        require(diagnostics.get("dynamic_evolution_validated") is False,
                "manifest dynamic evolution is not physically validated")
        require("auxiliary_ordering_reconstructed" not in diagnostics,
                "manifest ambiguous legacy auxiliary marker is forbidden in current versions")
        auxiliary = diagnostics.get("auxiliary_evolution")
        expected_auxiliary = {
            "schema_version": "nr-fo-auxiliary-evolution-v1",
            "scope": "algorithm-policy-not-execution-history",
            "fresh_initialization": ("analytic-schwarzschild-fields-and-auxiliaries" if expected_domain
                                     else "analytic-fields-with-centered-derivative-auxiliaries"),
            "checkpoint_restore": "all-58-stored-slots-without-reconstruction",
            "step_policy": "independent-58-slot-rk4" if dynamic
            else "analytic-fields-with-centered-derivative-auxiliaries",
            "reconstruct_auxiliaries_during_step": not dynamic,
            "algebraic_projection_during_step": False,
        }
        require(isinstance(auxiliary, Mapping) and set(auxiliary) == set(expected_auxiliary),
                "manifest auxiliary evolution policy fields mismatch")
        for name, expected in expected_auxiliary.items():
            require(type(auxiliary[name]) is type(expected) and auxiliary[name] == expected,
                    f"manifest auxiliary evolution policy mismatch: {name}")
    else:
        require("auxiliary_evolution" not in diagnostics,
                "historical manifest cannot acquire a new auxiliary evolution policy")
        require(diagnostics.get("auxiliary_ordering_reconstructed") is True,
                "manifest historical auxiliary marker mismatch (semantics ambiguous)")
    require(diagnostics.get("checkpoint_deterministic") is True, "manifest checkpoint determinism flag mismatch")
    require(diagnostics.get("checkpoint_present") is True, "manifest checkpoint presence flag mismatch")
    for name in ("state_checksum_fnv1a64", "checkpoint_checksum_fnv1a64"):
        checksum = diagnostics.get(name)
        require(
            isinstance(checksum, str)
            and len(checksum) == 16
            and all(character in "0123456789abcdefABCDEF" for character in checksum),
            f"manifest checksum mismatch: {name}",
        )


@dataclass(frozen=True)
class NRRunManifest:
    """A small, language-neutral envelope for a scientific backend result.

    The payload intentionally carries a blocked promotion state.  A future
    C++/CUDA backend must emit the same fields before its output can be
    compared with or consumed by the web adapter.
    """

    schema_version: str
    kernel_id: str
    kernel_version: str
    formulation: str
    status: str
    promotion: str
    units: str
    coordinate_system: str
    gauge: str
    boundary: str
    grid: Mapping[str, Any]
    diagnostics: Mapping[str, Any]

    def payload(self) -> dict[str, Any]:
        return {
            "boundary": self.boundary,
            "coordinate_system": self.coordinate_system,
            "diagnostics": dict(self.diagnostics),
            "formulation": self.formulation,
            "gauge": self.gauge,
            "grid": dict(self.grid),
            "kernel_id": self.kernel_id,
            "kernel_version": self.kernel_version,
            "promotion": self.promotion,
            "schema_version": self.schema_version,
            "status": self.status,
            "units": self.units,
        }

    def canonical_json(self) -> str:
        """Return deterministic JSON suitable for a cross-language digest."""

        return json.dumps(
            self.payload(),
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
            allow_nan=False,
        )

    def sha256(self) -> str:
        return hashlib.sha256(self.canonical_json().encode("utf-8")).hexdigest()


def manifest_from_constraint_report(report: Any) -> NRRunManifest:
    """Build the NR-K0 envelope without promoting the scientific payload."""

    if not getattr(report, "samples", None):
        raise ValueError("a constraint report with samples is required")
    max_hamiltonian = max(sample.hamiltonian_l_inf for sample in report.samples)
    return NRRunManifest(
        schema_version="nr-run-manifest-v1",
        kernel_id="nr-k0-schwarzschild-oracle",
        kernel_version="0.1.0",
        formulation=report.formulation,
        status="oracle-only",
        promotion="blocked-pending-dynamic-evolution",
        units="geometric-G=c=1",
        coordinate_system="isotropic-spherical-radial",
        gauge="schwarzschild-isotropic-zero-shift",
        boundary="no-time-evolution-no-web-writeback",
        grid={
            "radius_interval": list(report.radius_interval),
            "refinement_order_requested": report.order,
            "samples": [sample.points for sample in report.samples],
        },
        diagnostics={
            "observed_derivative_order": report.observed_order,
            "max_hamiltonian_l_inf": max_hamiltonian,
            "refinement_passed": report.passed,
        },
    )


def manifest_from_reference_state(
    state: Any,
    *,
    diagnostics: Mapping[str, Any] | None = None,
    kernel_id: str = "nr-k1b-python-bssnok-shadow",
    kernel_version: str = "0.1.0",
) -> NRRunManifest:
    """Build the cross-language envelope for a Python BSSN/CCZ4 reference state.

    The returned field names intentionally match the K2 C++ manifest.  The
    promotion remains blocked because this helper describes a reference state,
    not a scientifically admitted production run.
    """

    grid = state.grid
    report_diagnostics = dict(diagnostics or {})
    report_diagnostics.setdefault("variable_count", len(state.variable_names))
    report_diagnostics.setdefault("variables", list(state.variable_names))
    if "constraint_norms" not in report_diagnostics:
        if hasattr(state, "chi") and hasattr(state, "grid"):
            from .ccz4_reference import constraint_report

            report_diagnostics["constraint_norms"] = dict(constraint_report(state).norms)
        else:
            report_diagnostics["constraint_norms"] = {}
    return NRRunManifest(
        schema_version="nr-run-manifest-v1",
        kernel_id=kernel_id,
        kernel_version=kernel_version,
        formulation="bssnok-1d-reference"
        if state.formulation == "bssnok"
        else "ccz4-1d-reference-contract",
        status="shadow",
        promotion="blocked-pending-k2-compatibility-and-k3-3d",
        units="geometric-G=c=1",
        coordinate_system="cartesian-1d-reduction",
        gauge="advective-1+log-gamma-driver",
        boundary=state.boundary_contract,
        grid={
            "points": grid.points,
            "x_min": grid.x_min,
            "x_max": grid.x_max,
            "dt": None,
        },
        diagnostics=report_diagnostics,
    )


def manifest_from_bssn_state(
    state: Any,
    *,
    diagnostics: Mapping[str, Any] | None = None,
    kernel_id: str = "nr-k1b-python-bssnok-shadow",
    kernel_version: str = "0.1.0",
) -> NRRunManifest:
    """Backward-compatible name for the generic reference-state envelope."""

    return manifest_from_reference_state(
        state,
        diagnostics=diagnostics,
        kernel_id=kernel_id,
        kernel_version=kernel_version,
    )


def manifest_from_3d_state(
    state: Any,
    *,
    diagnostics: Mapping[str, Any] | None = None,
    kernel_id: str = "nr-k3-python-3d-shadow",
    kernel_version: str = "0.1.0",
) -> NRRunManifest:
    """Build the shared manifest envelope for a bounded 3-D reference state."""

    grid = state.grid
    report_diagnostics = dict(diagnostics or {})
    report_diagnostics.setdefault("variable_count", len(state.variable_names))
    report_diagnostics.setdefault("variables", list(state.variable_names))
    report_diagnostics.setdefault("valid_cell_count", int(state.valid_cell_count))
    report_diagnostics.setdefault("spatial_order", int(grid.spatial_order))
    report_diagnostics.setdefault(
        "boundary_operator",
        {
            "periodic": "periodic-centered",
            "sommerfeld": "sommerfeld-scalar-proxy",
            "excision": "excision-mask-diagnostic-only",
        }[grid.boundary],
    )
    if "constraint_norms" not in report_diagnostics:
        from .constraints3d import constraint_report_3d

        report = constraint_report_3d(state)
        report_diagnostics["constraint_norms"] = dict(report.norms)
        report_diagnostics.setdefault(
            "constraint_valid_cell_count", int(report.valid_mask.sum())
        )
    formulation = "bssnok-3d-reference" if state.formulation == "bssnok" else "ccz4-3d-reference"
    return NRRunManifest(
        schema_version="nr-run-manifest-v1",
        kernel_id=kernel_id,
        kernel_version=kernel_version,
        formulation=formulation,
        status="shadow",
        promotion="blocked-pending-k3-dynamic-amr-boundaries",
        units="geometric-G=c=1",
        coordinate_system="cartesian-3d",
        gauge="advective-1+log-gamma-driver",
        boundary=grid.boundary,
        grid={
            "shape": list(grid.shape),
            "lower": list(grid.lower),
            "upper": list(grid.upper),
            "spacing": list(grid.spacing),
            "spatial_order": int(grid.spatial_order),
        },
        diagnostics=report_diagnostics,
    )


def manifest_from_fo_ccz4_report(
    state: Any,
    report: Any,
    *,
    diagnostics: Mapping[str, Any] | None = None,
    kernel_id: str = "nr-k3e-python-fo-ccz4-contract-shadow",
    kernel_version: str = "0.1.0",
) -> NRRunManifest:
    """Build the shared manifest envelope for the 58-field FO-CCZ4 audit.

    The result stays in the same ``nr-run-manifest-v1`` envelope as K1/K2/K3,
    while the diagnostics explicitly carry the expanded first-order variable
    order and the ordering-constraint report.  No live-runtime consumer is
    implied by this helper.
    """

    from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER

    if tuple(int(value) for value in state.grid.shape) != tuple(report.grid_shape):
        raise ValueError("FO-CCZ4 report grid does not match the state")
    report_diagnostics = dict(diagnostics or {})
    report_diagnostics.update(
        {
            "variable_count": len(FOCCZ4_VARIABLE_ORDER),
            "variables": list(FOCCZ4_VARIABLE_ORDER),
            "auxiliary_sha256": report.auxiliary_sha256,
            "ordering_constraint_method": report.method,
            "ordering_constraint_curl_l2": dict(report.curl_l2),
            "ordering_constraint_curl_l_inf": dict(report.curl_l_inf),
            "ordering_constraint_algebraic_l2": dict(report.algebraic_l2),
            "ordering_constraint_algebraic_l_inf": dict(report.algebraic_l_inf),
            "strong_hyperbolicity_validated": bool(report.strong_hyperbolicity_validated),
            "constraint_preserving_validated": bool(report.constraint_preserving_validated),
            "physical_validation_validated": bool(report.physical_validation_validated),
        }
    )
    return NRRunManifest(
        schema_version="nr-run-manifest-v1",
        kernel_id=kernel_id,
        kernel_version=kernel_version,
        formulation="fo-ccz4-58-variable-shadow-contract",
        status="shadow",
        promotion="blocked-pending-58-variable-principal-symbol-and-cpbc",
        units="geometric-G=c=1",
        coordinate_system="cartesian-3d",
        gauge="advective-1+log-gamma-driver",
        boundary=state.grid.boundary,
        grid={
            "shape": list(state.grid.shape),
            "lower": list(state.grid.lower),
            "upper": list(state.grid.upper),
            "spacing": list(state.grid.spacing),
            "spatial_order": int(state.grid.spatial_order),
        },
        diagnostics=report_diagnostics,
    )
