"""Independent temporal classification, tampering, and unresolvable controls."""
import copy
from pathlib import Path
import runpy

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[2]
A = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-schwarzschild-gauge-pulse.py"))
F = runpy.run_path(str(ROOT/"scripts/tests/test_nr_schwarzschild_gauge_pulse.py"))


@pytest.mark.parametrize("order,status", [(4, "passed"), (2, "failed"), (0, "unresolved"), (-1, "failed")])
def test_independent_tensor_weighted_convergence_agrees(order, status):
    cases, store, driver = F["fixture"](order)
    reported = F["R"]["summary"](cases, driver, store.__getitem__)
    independent = A["independent_screen"](cases, store.__getitem__, "a"*64)
    assert independent["status"] == status
    assert A["compare_screen"](reported, independent) <= 1.e-12
    assert not independent["physical_gate"] and not independent["spatial_order_validated"]


@pytest.mark.parametrize("tamper", ["norm", "order", "region", "passed", "scope", "floor", "null-order"])
def test_false_scientific_screen_cannot_pass_independent_audit(tamper):
    cases, store, driver = F["fixture"](0 if tamper == "null-order" else 4)
    reported = F["R"]["summary"](cases, driver, store.__getitem__)
    independent = A["independent_screen"](cases, store.__getitem__, "a"*64)
    if tamper == "norm":
        reported["regions"]["whole"]["fine_error"] *= 1.02
    elif tamper == "order":
        reported["regions"]["whole"]["observed_order"] = 3.6
    elif tamper == "region":
        del reported["regions"]["corners"]
    elif tamper == "passed":
        reported["regions"]["whole"]["passed"] = False
    elif tamper == "scope":
        reported["physical_gate"] = True
    elif tamper == "floor":
        reported["regions"]["whole"]["floor"] = 1.e-15
    else:
        reported["regions"]["whole"]["observed_order"] = 4.
    with pytest.raises(ValueError):
        A["compare_screen"](reported, independent)


@pytest.mark.parametrize("tamper", ["time", "initial", "completed", "dt", "policy"])
def test_independent_screen_rejects_different_problems(tamper):
    cases, store, _ = F["fixture"]()
    if tamper == "time":
        cases[0]["trajectory"][-1]["time"] = 1./32
    elif tamper == "initial":
        cases[0]["common_initial_sha256"] = "different"
    elif tamper == "completed":
        cases[0]["completed"] = False
    elif tamper == "dt":
        cases[0]["dt"] *= 2
    else:
        cases[0]["policy"] = "endpoint"
    with pytest.raises(ValueError):
        A["independent_screen"](cases, store.__getitem__, "a"*64)


def test_independent_audit_does_not_change_saved_data():
    cases, store, _ = F["fixture"]()
    records = copy.deepcopy(cases)
    hashes = {name: array.tobytes() for name, array in store.items()}
    A["independent_screen"](cases, store.__getitem__, "a"*64)
    assert cases == records and {name: a.tobytes() for name, a in store.items()} == hashes



def test_independent_initial_oracle_without_production_geometry():
    initial, reference = F["R"]["initial_slots"](13)
    saved = initial.tobytes(), reference.tobytes()
    result = A["check_initial"](initial, reference, initial-reference)
    assert result["analytic_initial_max_difference"] <= 2.e-14
    assert result["physical_initial_slots_byte_exact"] and result["initial_boundary_byte_exact"]
    assert not result["einstein_constraint_solve"]
    assert saved == (initial.tobytes(), reference.tobytes())


@pytest.mark.parametrize("tamper", [None, "amplitude", "regularity", "physical_boundary_validated", "einstein_constraint_solve", "old_perturbed_problem_replaced"])
def test_initial_metadata_contract_is_not_replaceable(tamper):
    data = dict(identity=F["R"]["identity"](), new_gauge_initial_value_problem=True,
                old_perturbed_problem_replaced=False, algebraic_projection=False, einstein_constraint_solve=False)
    if tamper is None:
        A["check_initial_metadata"](data)
        return
    if tamper in ("einstein_constraint_solve", "old_perturbed_problem_replaced"):
        data[tamper] = True
    else:
        data["identity"][tamper] = "tampered"
    with pytest.raises(ValueError):
        A["check_initial_metadata"](data)


@pytest.mark.parametrize("tamper", ["physical", "lapse", "gradient", "reference", "delta", "dtype", "shape", "nan", "no-pulse"])
def test_initial_oracle_rejects_incompatible_or_missing_data(tamper):
    initial, reference = F["R"]["initial_slots"](13)
    if tamper == "physical":
        initial[11, 6, 6, 6] = 1.e-6
    elif tamper == "lapse":
        initial[6, 6, 6, 6] += 1.e-6
    elif tamper == "gradient":
        initial[25, 6, 6, 6] += 1.e-6
    elif tamper == "reference":
        reference[0, 6, 6, 6] += 1.e-6
        initial[0, 6, 6, 6] += 1.e-6
    elif tamper == "dtype":
        initial = initial.astype(np.float32)
    elif tamper == "shape":
        initial = initial[:, :-1]
    elif tamper == "nan":
        initial[6, 6, 6, 6] = np.nan
    elif tamper == "no-pulse":
        initial = reference.copy()
    delta = initial-reference if tamper != "shape" else initial.copy()
    if tamper == "delta":
        delta[6, 6, 6, 6] += 1.e-6
    with pytest.raises(ValueError):
        A["check_initial"](initial, reference, delta)
