"""Versioned policy semantics, distinct from execution history and physics."""
from copy import deepcopy

import pytest

from .fo_ccz4_gauge_profile import FOCCZ4GaugeProfile
from .manifest import validate_fo_ccz4_cpp_manifest
from .test_fo_ccz4_spatial_checkpoint import manifest as historical_manifest


def current_manifest(*, dynamic=True, order=2, profile=False):
    payload = historical_manifest(order, profile)
    payload.update(kernel_version="0.3.2", kernel_id="nr-k2-cpp-openmp-fo-ccz4-shadow")
    d = payload["diagnostics"]
    d.pop("auxiliary_ordering_reconstructed")
    d.update(solver_mode="fo-ccz4-rhs-shadow-rk4" if dynamic else "analytic-3d-fo-ccz4-contract",
             dynamic_rhs_implemented=dynamic, dynamic_evolution_validated=False)
    d["auxiliary_evolution"] = {
        "schema_version": "nr-fo-auxiliary-evolution-v1",
        "scope": "algorithm-policy-not-execution-history",
        "fresh_initialization": "analytic-fields-with-centered-derivative-auxiliaries",
        "checkpoint_restore": "all-58-stored-slots-without-reconstruction",
        "step_policy": "independent-58-slot-rk4" if dynamic else "analytic-fields-with-centered-derivative-auxiliaries",
        "reconstruct_auxiliaries_during_step": not dynamic,
        "algebraic_projection_during_step": False,
    }
    return payload


@pytest.mark.parametrize("dynamic,profile", ((False, False), (True, False), (True, True)))
@pytest.mark.parametrize("order", (2, 4))
@pytest.mark.parametrize("step", (0, 8))
def test_explicit_mode_policy_is_not_a_claim_about_actual_step_history(dynamic, profile, order, step):
    payload = current_manifest(dynamic=dynamic, order=order, profile=profile)
    payload["diagnostics"].update(step=step, time=step*payload["grid"]["dt"])
    saved = deepcopy(payload)
    validate_fo_ccz4_cpp_manifest(payload, expected_spatial_order=order,
                                  expected_profile=FOCCZ4GaugeProfile() if profile else None)
    assert payload == saved


@pytest.mark.parametrize("name", tuple(current_manifest()["diagnostics"]["auxiliary_evolution"]))
@pytest.mark.parametrize("change", ("delete", "wrong", "type"))
def test_every_policy_field_is_mandatory_exact_and_type_strict(name, change):
    payload = current_manifest()
    policy = payload["diagnostics"]["auxiliary_evolution"]
    if change == "delete":
        del policy[name]
    elif change == "wrong":
        policy[name] = not policy[name] if type(policy[name]) is bool else "unreviewed"
    else:
        policy[name] = int(policy[name]) if type(policy[name]) is bool else None
    with pytest.raises(ValueError, match="auxiliary evolution policy"):
        validate_fo_ccz4_cpp_manifest(payload)


@pytest.mark.parametrize("value", (None, [], "reconstructed", {}, {"extra": True}))
def test_missing_malformed_or_extended_policy_is_rejected(value):
    payload = current_manifest()
    payload["diagnostics"]["auxiliary_evolution"] = value
    with pytest.raises(ValueError, match="policy fields"):
        validate_fo_ccz4_cpp_manifest(payload)
    del payload["diagnostics"]["auxiliary_evolution"]
    with pytest.raises(ValueError, match="policy fields"):
        validate_fo_ccz4_cpp_manifest(payload)


@pytest.mark.parametrize("value", (True, False, None, 0))
def test_new_version_forbids_even_false_legacy_marker(value):
    payload = current_manifest()
    payload["diagnostics"]["auxiliary_ordering_reconstructed"] = value
    with pytest.raises(ValueError, match="ambiguous legacy"):
        validate_fo_ccz4_cpp_manifest(payload)


@pytest.mark.parametrize("version", ("0.1.0", "0.2.0", "0.2.1", "0.3.0", "0.3.1"))
@pytest.mark.parametrize("dynamic", (False, True))
def test_historical_envelopes_are_read_only_not_silently_reinterpreted(version, dynamic):
    payload = historical_manifest(2)
    payload["kernel_version"] = version
    d = payload["diagnostics"]
    d.update(solver_mode="fo-ccz4-rhs-shadow-rk4" if dynamic else "analytic-3d-fo-ccz4-contract",
             dynamic_rhs_implemented=dynamic)
    saved = deepcopy(payload)
    validate_fo_ccz4_cpp_manifest(payload)
    assert payload == saved and d["auxiliary_ordering_reconstructed"] is True
    assert "auxiliary_evolution" not in d
    d["auxiliary_evolution"] = current_manifest(dynamic=dynamic)["diagnostics"]["auxiliary_evolution"]
    with pytest.raises(ValueError, match="historical manifest"):
        validate_fo_ccz4_cpp_manifest(payload)


@pytest.mark.parametrize("version", (None, "0.3.3", "0.3.2-dev", "", 0.32, True))
def test_unknown_versions_cannot_bypass_policy_checks(version):
    payload = current_manifest()
    payload["kernel_version"] = version
    with pytest.raises(ValueError, match="kernel version"):
        validate_fo_ccz4_cpp_manifest(payload)


@pytest.mark.parametrize("field,value", (("dynamic_rhs_implemented", 1), ("dynamic_rhs_implemented", "true"),
                                       ("dynamic_evolution_validated", True), ("dynamic_evolution_validated", 0)))
def test_current_rhs_and_validation_flags_are_strict(field, value):
    payload = current_manifest()
    payload["diagnostics"][field] = value
    with pytest.raises(ValueError):
        validate_fo_ccz4_cpp_manifest(payload)


def test_opposite_mode_policy_and_wrong_kernel_are_rejected():
    payload = current_manifest()
    payload["diagnostics"]["auxiliary_evolution"] = current_manifest(dynamic=False)["diagnostics"]["auxiliary_evolution"]
    with pytest.raises(ValueError, match="step_policy"):
        validate_fo_ccz4_cpp_manifest(payload)
    payload = current_manifest()
    payload["kernel_id"] = "some-other-solver"
    with pytest.raises(ValueError, match="kernel identity"):
        validate_fo_ccz4_cpp_manifest(payload)
