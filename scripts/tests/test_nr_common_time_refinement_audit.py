"""Independent temporal classification, tampering, and unresolvable controls."""
import copy
from pathlib import Path
import runpy

import pytest

ROOT = Path(__file__).resolve().parents[2]
A = runpy.run_path(str(ROOT/"scripts/audit-nr-k3-common-time-refinement.py"))
F = runpy.run_path(str(ROOT/"scripts/tests/test_nr_common_time_refinement.py"))


@pytest.mark.parametrize("order,status", [(4, "passed"), (2, "failed"), (0, "unresolved"), (-1, "failed")])
def test_independent_tensor_weighted_convergence_agrees(order, status):
    cases, store, driver = F["fixture"](order)
    reported = F["R"]["summary"](cases, driver, store.__getitem__)
    independent = A["independent_screen"](cases, store.__getitem__)
    assert independent["status"] == status
    assert A["compare_screen"](reported, independent) <= 1.e-12
    assert not independent["physical_gate"] and not independent["spatial_order_validated"]


@pytest.mark.parametrize("tamper", ["norm", "order", "region", "passed", "scope", "floor", "null-order"])
def test_false_scientific_screen_cannot_pass_independent_audit(tamper):
    cases, store, driver = F["fixture"](0 if tamper == "null-order" else 4)
    reported = F["R"]["summary"](cases, driver, store.__getitem__)
    independent = A["independent_screen"](cases, store.__getitem__)
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
        A["independent_screen"](cases, store.__getitem__)


def test_independent_audit_does_not_change_saved_data():
    cases, store, _ = F["fixture"]()
    records = copy.deepcopy(cases)
    hashes = {name: array.tobytes() for name, array in store.items()}
    A["independent_screen"](cases, store.__getitem__)
    assert cases == records and {name: a.tobytes() for name, a in store.items()} == hashes
