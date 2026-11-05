"""Receipt guards; numerical evidence comes from the real campaign, not mocks."""

from __future__ import annotations

import hashlib
from pathlib import Path
import runpy
import sys

import pytest


@pytest.fixture
def driver():
    path = Path(__file__).resolve().parents[2]/"scripts/run-nr-k3-fo-ccz4-state-dependent-gauge.py"
    return runpy.run_path(str(path))


def _rows(power, factor=1.):
    return [{"spacing": 1./points, "final": {"constraint_norms": {
        name: factor*(1./points)**power for name in
        ("hamiltonian_l2", "momentum_l2", "conformal_gamma_l_inf", "theta_l_inf")
    }}} for points in (9,13,17)]


def test_manufactured_constraint_order_calculation(driver):
    reports = driver["constraint_orders"](_rows(2))
    assert len(reports) == 4
    for report in reports.values():
        assert report["measurable"] and report["second_order_gate"]
        assert report["observed_orders"] == pytest.approx([2.,2.])


@pytest.mark.parametrize("power,factor", ((0.,1.), (1.,1.), (2.,1.e-16)))
def test_nonconvergence_and_roundoff_are_not_promoted(driver, power, factor):
    reports = driver["constraint_orders"](_rows(power, factor))
    assert not any(row["second_order_gate"] for row in reports.values())
    if factor == 1.e-16:
        assert all(not row["measurable"] and not row["observed_orders"] for row in reports.values())


def test_missing_refinement_level_is_not_enough(driver):
    reports = driver["constraint_orders"](_rows(2)[:2])
    assert not any(row["second_order_gate"] for row in reports.values())


def test_aggregate_rejects_one_failed_independent_constraint(driver):
    orders = driver["constraint_orders"](_rows(2))
    orders["hamiltonian_l2"]["second_order_gate"] = False
    result = driver["validation_summary"]({"component": True}, orders)
    assert result["bounded_components_passed"]
    assert not result["bounded_campaign_passed"]
    assert not result["all_four_constraint_convergence"]
    assert not result["independent_constraint_gates"]["hamiltonian_l2"]


def test_even_complete_bounded_campaign_cannot_promote_live(driver):
    result = driver["validation_summary"]({"component": True}, driver["constraint_orders"](_rows(2)))
    assert result["bounded_campaign_passed"]
    for key in ("strong_hyperbolicity_validated", "physical_boundary_validated", "cpbc_ready",
                "black_hole_evolution_validated", "runtime_writeback", "scientificPayloadWriteback"):
        assert result[key] is False


def test_receipt_refuses_existing_output_before_running(driver, tmp_path, monkeypatch):
    output = tmp_path/"receipt.json"
    output.write_text("original evidence", encoding="utf-8")
    def unexpected_run():
        raise AssertionError("must refuse before running a campaign")
    monkeypatch.setitem(driver["main"].__globals__, "run_campaign", unexpected_run)
    monkeypatch.setattr(sys, "argv", ["campaign", "--output", str(output)])
    with pytest.raises(SystemExit, match="output already exists"):
        driver["main"]()
    assert output.read_text(encoding="utf-8") == "original evidence"


def test_nonfinite_receipt_is_not_written(driver, tmp_path, monkeypatch):
    output = tmp_path/"receipt.json"
    monkeypatch.setitem(driver["main"].__globals__, "run_campaign", lambda: {"bad_value": float("nan")})
    monkeypatch.setattr(sys, "argv", ["campaign", "--output", str(output)])
    with pytest.raises(ValueError, match="JSON compliant"):
        driver["main"]()
    assert not output.exists()


def test_source_hash_covers_profile_rhs_and_campaign(driver):
    identity = driver["source_identity"]()
    assert identity == driver["source_identity"]()
    for relative in ("science/numerical_relativity/fo_ccz4_rhs.py",
                     "science/numerical_relativity/fo_ccz4_gauge_profile.py",
                     "scripts/run-nr-k3-fo-ccz4-state-dependent-gauge.py"):
        assert identity["files"][relative] == hashlib.sha256((driver["ROOT"]/relative).read_bytes()).hexdigest()
