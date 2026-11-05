"""Prospective CFL/storage screen; not an evolution entry or authorization.

The earlier common-dt proposal is deliberately retained as a rejected candidate.
Only the fixed initial data are evaluated. Passing this screen says nothing about
later RK stages, physical convergence, continuation qualification, or runtime.
"""

from __future__ import annotations

from dataclasses import dataclass
from fractions import Fraction
from functools import lru_cache
import math

from . import native_campaign as N
from .fo_ccz4_gauge_pulse import identity as pulse_identity, initial_slots
from .fo_ccz4_sbp_nonlinear import NonlinearSBPCube, PROFILE
from .nr3d import Grid3D

GRIDS = (9, 13, 17)
DENOMINATORS = (112, 224, 448, 896)
END_TIME = Fraction(1, 8)
CFL_CAP = 0.25
CFL_ROUNDING = 1e-14
PARENT_ALLOWANCE = 32 * 1024**2
NAMES = ("original-common-dt", "staggered-dt", "uniform-finer-dt")
FLAGS = dict(
    execution_supported=False,
    human_authorization_granted=False,
    continuation_chain_qualified=False,
    future_stage_cfl_validated=False,
    new_scientific_evolution=False,
    temporal_convergence_validated=False,
    spatial_convergence_validated=False,
    constraint_convergence_validated=False,
    physical_gate=False,
    live_admission=False,
    scientificPayloadWriteback=False,
)


def rational(value):
    N.require(type(value) is Fraction, "exact Fraction required")
    return dict(numerator=value.numerator, denominator=value.denominator)


@dataclass(frozen=True)
class Case:
    n: int
    denominator: int

    def __post_init__(self):
        N.require(type(self.n) is int and self.n in GRIDS, "registered grid required")
        N.require(
            type(self.denominator) is int and self.denominator in DENOMINATORS,
            "registered exact time step required",
        )

    @property
    def label(self):
        return f"n{self.n}-dt1over{self.denominator}"

    @property
    def dt(self):
        return Fraction(1, self.denominator)

    @property
    def steps(self):
        return int(END_TIME / self.dt)


@dataclass(frozen=True)
class InitialProof:
    rate: float
    independent_rate: float
    initial_sha256: str
    reference_sha256: str


def independent_initial_rate(n):
    """Scalar analytic oracle for this initial problem, not arbitrary evolved q.

    h_ij=delta_ij, beta=0, f=3 alpha chi, mu=.2 chi, 0<alpha<2.
    The longitudinal shift speed 2 sqrt(alpha chi) exceeds each of the other
    five families under these conditions. Compute it directly from r and the
    compact pulse, without canonical slots, the driver, or its CFL routine.
    """
    N.require(type(n) is int and n in GRIDS, "registered grid required")
    maximum = 0.0
    for i in range(n):
        for j in range(n):
            for k in range(n):
                xyz = tuple(1.0 + 2.0 * t / (n - 1) for t in (i, j, k))
                radius = math.sqrt(math.fsum(x * x for x in xyz))
                u = 1.0 / (2.0 * radius)
                bump = math.prod(
                    max(1.0 - ((x - 2.0) / 0.75) ** 2, 0.0) ** 6 for x in xyz
                )
                alpha = (1.0 - u) / (1.0 + u) * math.exp(0.001 * bump)
                chi = (1.0 + u) ** -4
                N.require(0.0 < alpha < 2.0, "initial oracle domain violated")
                maximum = max(maximum, 2.0 * math.sqrt(alpha * chi))
    return maximum * 3.0 * (n - 1) / 2.0


def initial_proof(n):
    # Validate before caching so True/9.0 cannot borrow an integer cache entry.
    N.require(type(n) is int and n in GRIDS, "registered grid required")
    return _initial_proof(n)


@lru_cache(maxsize=3)
def _initial_proof(n):
    N.require(
        PROFILE.shift_scale == 3.0 and PROFILE.ordering_scale == 0.2,
        "analytic oracle is specific to the frozen gauge profile",
    )
    q, reference = initial_slots(n)
    driver = NonlinearSBPCube(
        Grid3D((n,) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4)
    )
    state = driver.state(q)
    # This smallest candidate dt is safe at T=0; never evaluate an RHS.
    rate = driver.cfl(state, 1.0 / 896) * 896
    oracle = independent_initial_rate(n)
    N.require(abs(rate - oracle) <= 2e-12, "initial CFL oracle mismatch")
    for denominator in DENOMINATORS:
        value = rate / denominator
        if value <= CFL_CAP * (1.0 + CFL_ROUNDING):
            N.require(
                abs(driver.cfl(state, 1.0 / denominator) - value) <= 2e-15,
                "initial CFL scaling mismatch",
            )
        else:
            try:
                driver.cfl(state, 1.0 / denominator)
            except ValueError as error:
                N.require(
                    str(error) == "stage exceeds declared reference CFL cap",
                    "unexpected initial rejection",
                )
            else:
                raise ValueError("frozen driver did not reject unsafe initial CFL")
    return InitialProof(
        rate, oracle, N.codec.sha(q.tobytes()), N.codec.sha(reference.tobytes())
    )


def case_report(case):
    N.require(type(case) is Case, "fixed case required")
    proof = initial_proof(case.n)
    cfl = proof.rate / case.denominator
    return dict(
        label=case.label,
        n=case.n,
        dt=rational(case.dt),
        end_time=rational(END_TIME),
        end_step=case.steps,
        initial_cfl=cfl,
        independent_initial_cfl=proof.independent_rate / case.denominator,
        initial_cfl_accepted=cfl <= CFL_CAP * (1.0 + CFL_ROUNDING),
        initial_sha256=proof.initial_sha256,
        reference_sha256=proof.reference_sha256,
        # Reuse still requires fresh whole-receipt/ancestry verification by a
        # future qualified entry; this planning module does not authenticate it.
        reuse_candidate=case.n == 13 and case.denominator in (112, 224, 448),
        reuse_verified_by_this_module=False,
    )


def storage_bound(n, lengths):
    N.require(type(n) is int and n in GRIDS, "registered grid required")
    N.require(
        type(lengths) is tuple
        and lengths
        and all(type(v) is int and 1 <= v <= 112 for v in lengths),
        "bounded positive step tuple required",
    )
    return N.worst_case_bytes(n, lengths) + PARENT_ALLOWANCE


def _cases(name):
    N.require(
        type(name) is str and name in NAMES, "fixed prospective candidate required"
    )
    return tuple(
        Case(n, denominator)
        for n in GRIDS
        for denominator in (
            (224, 448, 896)
            if name == "uniform-finer-dt" or (name == "staggered-dt" and n == 17)
            else (112, 224, 448)
        )
    )


def proposal(name):
    cases = _cases(name)
    reports = [case_report(case) for case in cases]
    batches = []
    for case, row in zip(cases, reports, strict=True):
        if row["reuse_candidate"]:
            continue
        # Prospective fixed partition, not a retry or run-time budget adjustment.
        chunk = {9: 112, 13: 28, 17: 14}[case.n]
        previous = None
        for start in range(0, case.steps, chunk):
            end = min(start + chunk, case.steps)
            segment = dict(
                case=case.label,
                n=case.n,
                start_step=start,
                end_step=end,
                start_time=rational(start * case.dt),
                end_time=rational(end * case.dt),
                dt=rational(case.dt),
                depends_on=previous,
                start_kind="analytic-initial-data"
                if start == 0
                else "verified-parent-checkpoint-required",
            )
            can_pack = (
                case.n == 9
                and batches
                and batches[-1]["n"] == 9
                and storage_bound(
                    9,
                    tuple(
                        s["end_step"] - s["start_step"] for s in batches[-1]["segments"]
                    )
                    + (end - start,),
                )
                <= N.OUTPUT_CAP
            )
            if not can_pack:
                batches.append(
                    dict(id=f"batch-{len(batches) + 1:02}", n=case.n, segments=[])
                )
            batch = batches[-1]
            batch["segments"].append(segment)
            batch["worst_case_bytes"] = storage_bound(
                case.n,
                tuple(s["end_step"] - s["start_step"] for s in batch["segments"]),
            )
            N.require(
                batch["worst_case_bytes"] <= N.OUTPUT_CAP,
                "prospective batch exceeds original cap",
            )
            previous = batch["id"]
    common = sorted(
        set.intersection(*({c.denominator for c in cases if c.n == n} for n in GRIDS))
    )
    rejected = [row["label"] for row in reports if not row["initial_cfl_accepted"]]
    new_steps = sum(
        s["end_step"] - s["start_step"] for b in batches for s in b["segments"]
    )
    reused_steps = sum(row["end_step"] for row in reports if row["reuse_candidate"])
    return dict(
        schema="nr-spatial-preflight-v1",
        name=name,
        registration_only=True,
        status="rejected-initial-cfl"
        if rejected
        else "prospective-initial-cfl-and-storage-only",
        rejected_cases=rejected,
        initial_identity=pulse_identity(),
        method=N.codec.METHOD,
        gauge_profile=PROFILE.identity(),
        domain=dict(lower=[1.0] * 3, upper=[3.0] * 3, G=1.0, c=1.0, mass=1.0),
        end_time=rational(END_TIME),
        cfl_cap=CFL_CAP,
        cfl_rounding=CFL_ROUNDING,
        cases=reports,
        batches=batches,
        common_spatial_slice_dt=[rational(Fraction(1, d)) for d in common],
        counts=dict(
            new_cases=sum(not r["reuse_candidate"] for r in reports),
            reuse_candidate_cases=sum(r["reuse_candidate"] for r in reports),
            batches=len(batches),
            prospective_new_steps=new_steps,
            prospective_new_rk_stages=4 * new_steps,
            historical_candidate_steps=reused_steps,
            historical_candidate_rk_stages=4 * reused_steps,
            new_steps_executed=0,
            accepted_reused_steps=0,
        ),
        budgets=dict(
            per_batch_seconds=N.SECONDS,
            per_batch_bytes=N.OUTPUT_CAP,
            per_batch_headroom=N.HEADROOM,
            c_reserve=N.C_RESERVE,
            e_reserve=N.E_RESERVE,
            launch_e_minimum=N.E_RESERVE + N.OUTPUT_CAP,
            parent_allowance=PARENT_ALLOWANCE,
            cumulative_seconds_cap=len(batches) * N.SECONDS,
            cumulative_bytes_cap=len(batches) * N.OUTPUT_CAP,
            conservative_retained_bytes=sum(b["worst_case_bytes"] for b in batches),
            runtime_established=False,
        ),
        analysis_contract=dict(
            regions=["whole", "central_box", "faces", "edges", "corners"],
            temporal_floor=2e-13,
            temporal_order_interval=[3.5, 4.5],
            original_n13_status="unresolved",
            old_result_regraded=False,
            native_grid_constraints_required=True,
            full_constraint_field_differences_required=True,
            common_node_aliasing_excluded=False,
            state_departure_is_exact_error=False,
            spatial_promotion_thresholds_registered=False,
            time_error_isolated=False,
        ),
        failure_policy="stop entire attempted series; retain evidence; no automatic retry or timestep change",
        **FLAGS,
    )


def validate_proposal(data):
    """Exact prospective metadata check; does not authenticate scientific data."""
    N.require(
        type(data) is dict and type(data.get("name")) is str,
        "candidate object required",
    )
    expected = proposal(data["name"])
    N.require(
        N.json_bytes(data) == N.json_bytes(expected), "prospective contract changed"
    )
    return expected["status"]
