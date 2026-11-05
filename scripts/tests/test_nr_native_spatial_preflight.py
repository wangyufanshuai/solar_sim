"""No-evolution preflight controls; fixtures never count as scientific runs."""

from copy import deepcopy
from dataclasses import FrozenInstanceError
from fractions import Fraction
import math

import numpy as np
import pytest

from science.numerical_relativity import native_campaign as N
from science.numerical_relativity import native_spatial_preflight as P


def fraction(value):
    return Fraction(value["numerator"], value["denominator"])


@pytest.mark.parametrize("n", P.GRIDS)
@pytest.mark.parametrize("denominator", P.DENOMINATORS)
def test_exact_end_time_and_closed_form_initial_cfl(n, denominator):
    row = P.case_report(P.Case(n, denominator))
    assert (
        fraction(row["dt"]) * row["end_step"]
        == fraction(row["end_time"])
        == Fraction(1, 8)
    )
    # For this fixed pulse the maximum occurs at the far corner, outside pulse
    # support. This is distinct from the all-node scalar oracle in production.
    u = 1 / (6 * math.sqrt(3))
    alpha, chi = (1 - u) / (1 + u), (1 + u) ** -4
    expected = 2 * math.sqrt(alpha * chi) * 3 * (n - 1) / (2 * denominator)
    assert abs(row["initial_cfl"] - expected) <= 2e-15
    assert abs(row["independent_initial_cfl"] - expected) <= 2e-15
    assert row["initial_cfl_accepted"] is (expected <= 0.25 * (1 + 1e-14))


@pytest.mark.parametrize("bad", [True, 9.0, "9", 8, 10, 65, None])
def test_grid_rejects_type_aliases_even_after_cache_fill(bad):
    P.initial_proof(9)
    for call in (
        lambda: P.initial_proof(bad),
        lambda: P.independent_initial_rate(bad),
        lambda: P.Case(bad, 112),
    ):
        with pytest.raises(ValueError, match="registered grid"):
            call()


@pytest.mark.parametrize("bad", [True, 112.0, "112", 111, 225, 0, None])
def test_timestep_rejects_unregistered_or_inexact_values(bad):
    with pytest.raises(ValueError, match="exact time step"):
        P.Case(9, bad)


def test_initial_state_hashes_are_distinct_and_proof_immutable():
    proofs = [P.initial_proof(n) for n in P.GRIDS]
    assert len({p.initial_sha256 for p in proofs}) == 3
    assert all(p.initial_sha256 != p.reference_sha256 for p in proofs)
    with pytest.raises(FrozenInstanceError):
        proofs[0].rate = 0
    assert (
        proofs[1].initial_sha256
        == "d3f5f2f9b3eb6297343dd33f9d3cbacd76b08c629cf1a0b09937a10ec16fad0c"
    )


@pytest.mark.parametrize("name", P.NAMES)
def test_partition_has_no_missing_or_overlapping_steps_or_time_reset(name):
    plan = P.proposal(name)
    assert P.validate_proposal(plan) == plan["status"]
    seen = set()
    for row in plan["cases"]:
        segments = [
            (b["id"], s)
            for b in plan["batches"]
            for s in b["segments"]
            if s["case"] == row["label"]
        ]
        if row["reuse_candidate"]:
            assert not segments
            assert row["reuse_verified_by_this_module"] is False
            continue
        step, previous = 0, None
        for batch, segment in segments:
            assert segment["start_step"] == step
            assert segment["depends_on"] == previous
            assert fraction(segment["start_time"]) == step * fraction(row["dt"])
            step = segment["end_step"]
            assert fraction(segment["end_time"]) == step * fraction(row["dt"])
            assert segment["start_kind"] == (
                "analytic-initial-data"
                if previous is None
                else "verified-parent-checkpoint-required"
            )
            keys = {(row["label"], k) for k in range(segment["start_step"], step)}
            assert not seen.intersection(keys)
            seen.update(keys)
            previous = batch
        assert step == row["end_step"]
    assert len(seen) == plan["counts"]["prospective_new_steps"]
    assert plan["counts"]["prospective_new_rk_stages"] == 4 * len(seen)


@pytest.mark.parametrize(
    "name,batches,new_steps,reused",
    [(P.NAMES[0], 8, 196, 98), (P.NAMES[1], 15, 294, 98), (P.NAMES[2], 20, 504, 84)],
)
def test_fixed_candidate_counts_and_budget_are_not_an_execution_claim(
    name, batches, new_steps, reused
):
    plan = P.proposal(name)
    assert plan["counts"]["batches"] == batches
    assert plan["counts"]["prospective_new_steps"] == new_steps
    assert plan["counts"]["historical_candidate_steps"] == reused
    assert (
        plan["counts"]["new_steps_executed"]
        == plan["counts"]["accepted_reused_steps"]
        == 0
    )
    assert all(plan[key] is False for key in P.FLAGS)
    budgets = plan["budgets"]
    assert budgets["per_batch_bytes"] == 832 * 1024**2
    assert budgets["per_batch_seconds"] == 2400
    assert budgets["c_reserve"] == 3 * 1024**3
    assert budgets["e_reserve"] == 4 * 1024**3 + 32 * 1024**2
    assert (
        budgets["launch_e_minimum"] == budgets["e_reserve"] + budgets["per_batch_bytes"]
    )
    assert budgets["cumulative_bytes_cap"] == batches * 832 * 1024**2
    assert budgets["cumulative_seconds_cap"] == batches * 2400
    assert budgets["conservative_retained_bytes"] == sum(
        b["worst_case_bytes"] for b in plan["batches"]
    )
    assert all(b["worst_case_bytes"] <= 832 * 1024**2 for b in plan["batches"])


def test_original_eight_batch_proposal_is_retained_but_rejected():
    plan = P.proposal("original-common-dt")
    assert plan["status"] == "rejected-initial-cfl"
    assert plan["rejected_cases"] == ["n17-dt1over112"]
    assert plan["batches"][0]["worst_case_bytes"] == 663852768
    assert all(b["worst_case_bytes"] == 543202688 for b in plan["batches"][1:])


@pytest.mark.parametrize(
    "name,denominators",
    [("staggered-dt", (224, 448)), ("uniform-finer-dt", (224, 448, 896))],
)
def test_safe_candidates_expose_only_actual_common_spatial_slices(name, denominators):
    plan = P.proposal(name)
    assert plan["status"] == "prospective-initial-cfl-and-storage-only"
    assert not plan["rejected_cases"]
    assert [fraction(dt) for dt in plan["common_spatial_slice_dt"]] == [
        Fraction(1, d) for d in denominators
    ]
    assert plan["analysis_contract"]["time_error_isolated"] is False
    assert plan["analysis_contract"]["original_n13_status"] == "unresolved"


def test_n17_large_chunk_exceeds_original_cap():
    assert P.storage_bound(17, (14,)) < N.OUTPUT_CAP
    assert P.storage_bound(17, (28,)) > N.OUTPUT_CAP
    assert P.storage_bound(17, (14, 14)) > N.OUTPUT_CAP


@pytest.mark.parametrize(
    "n,lengths",
    [
        (9.0, (14,)),
        (13, (0,)),
        (17, (True,)),
        (17, (14.0,)),
        (17, [14]),
        (17, (113,)),
        (17, ()),
    ],
)
def test_storage_input_is_exact_bounded_and_not_bool(n, lengths):
    with pytest.raises(ValueError):
        P.storage_bound(n, lengths)


@pytest.mark.parametrize(
    "key,value",
    [
        ("physical_gate", True),
        ("human_authorization_granted", True),
        ("execution_supported", True),
        ("new_scientific_evolution", True),
        ("cfl_cap", 0.34),
        ("cfl_rounding", 0.3),
        ("extra_unregistered_field", True),
    ],
)
def test_coherent_top_level_tampering_rejected(key, value):
    plan = P.proposal("staggered-dt")
    plan[key] = value
    with pytest.raises(ValueError, match="contract changed"):
        P.validate_proposal(plan)


@pytest.mark.parametrize(
    "kind",
    [
        "time-reset",
        "missing-step",
        "overlap",
        "missing-batch",
        "reordered-batch",
        "unverified-reuse",
        "wrong-dt",
        "budget",
        "hide-region",
        "regrade",
        "initial-hash",
        "hide-unsafe-case",
    ],
)
def test_nested_schedule_or_scientific_metadata_tampering_rejected(kind):
    plan = deepcopy(P.proposal("original-common-dt"))
    segment = plan["batches"][-1]["segments"][0]
    if kind == "time-reset":
        segment["start_time"] = P.rational(Fraction(0))
    elif kind == "missing-step":
        segment["start_step"] += 1
    elif kind == "overlap":
        segment["start_step"] -= 1
    elif kind == "missing-batch":
        plan["batches"].pop()
    elif kind == "reordered-batch":
        plan["batches"].reverse()
    elif kind == "unverified-reuse":
        plan["cases"][3]["reuse_verified_by_this_module"] = True
    elif kind == "wrong-dt":
        segment["dt"] = P.rational(Fraction(1, 896))
    elif kind == "budget":
        plan["budgets"]["cumulative_seconds_cap"] = 2400
    elif kind == "hide-region":
        plan["analysis_contract"]["regions"].remove("edges")
    elif kind == "regrade":
        plan["analysis_contract"]["original_n13_status"] = "passed"
    elif kind == "initial-hash":
        plan["cases"][0]["initial_sha256"] = "0" * 64
    else:
        plan["rejected_cases"] = []
        plan["status"] = "prospective-initial-cfl-and-storage-only"
    with pytest.raises(ValueError, match="contract changed"):
        P.validate_proposal(plan)


@pytest.mark.parametrize("value", [None, [], {}, {"name": "unknown"}, {"name": True}])
def test_unregistered_candidate_rejected(value):
    with pytest.raises(ValueError):
        P.validate_proposal(value)


def test_initial_preflight_has_no_evolution_or_native_invocation(monkeypatch):
    def forbidden(*args, **kwargs):
        raise AssertionError("preflight must not evolve or invoke native solver")

    monkeypatch.setattr(N, "invoke", forbidden)
    monkeypatch.setattr(P.NonlinearSBPCube, "rhs", forbidden)
    P._initial_proof.cache_clear()
    for name in P.NAMES:
        assert P.proposal(name)["new_scientific_evolution"] is False


def test_plan_mutation_does_not_poison_initial_cache_or_other_candidate():
    plan = P.proposal("staggered-dt")
    plan["cases"][0]["initial_cfl"] = np.nan
    assert math.isfinite(P.proposal("staggered-dt")["cases"][0]["initial_cfl"])
    with pytest.raises(ValueError):
        P.validate_proposal(plan)
