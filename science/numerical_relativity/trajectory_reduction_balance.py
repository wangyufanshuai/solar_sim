"""Saved N13 stage reduction budgets; no integrator or independent SAT solver.

The boundary term is defined as saved total RHS minus an independent volume
reference. Its localization is checked, but this does NOT independently verify
the SAT formula or any physical boundary condition. No field is corrected.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
import argparse
import io
import json
import math
import os
from pathlib import Path
import time
import zlib

import numpy as np

from . import discrete_reduction_balance as D
from . import reduction_constraint_oracle as R
from . import native_campaign as N
from . import native_continuation_campaign as F
from .nr3d import Grid3D

METHOD = "nr-saved-trajectory-reduction-budget-v1"
DIRECTORY = N.EVIDENCE / "nr-k3-native-gauge-continuation-v2-20261011"
RECEIPT_SHA = "a7a7c8b7ebdc9447c31d4d70875e8b42f50a2a02d8b769a85457dce05e143583"
AUDIT = N.EVIDENCE / "nr-k3-native-gauge-continuation-v2-audit-20261011.json"
AUDIT_SHA = "60f60e1f989aabb2e987d44d74bf8a57bcf189b625ba9d66210ed2e3b8d1e40e"
TOLERANCE = 2e-12
PARTS = ("continuum", "chain", "boundary_residual")
require = N.require


def masks(shape):
    indices = np.indices(shape)
    count = sum((indices[k] == 0) | (indices[k] == n - 1) for k, n in enumerate(shape))
    center = np.logical_and.reduce(
        [
            (indices[k] >= (n - 1) / 4) & (indices[k] <= 3 * (n - 1) / 4)
            for k, n in enumerate(shape)
        ]
    )
    return dict(
        whole=np.ones(shape, bool),
        central_box=center,
        faces=count == 1,
        edges=count == 2,
        corners=count == 3,
    )


def norms(value, operator):
    q = np.asarray(value)
    require(
        q.shape == (33, *operator.shape)
        and q.dtype.kind in "fiu"
        and np.isfinite(q).all(),
        "finite33 field required",
    )
    edge = [
        np.asarray(D.rational_operator(n)[1], dtype=float) * dx
        for n, dx in zip(operator.shape, operator.spacing, strict=True)
    ]
    weights = np.einsum("i,j,k->ijk", *edge)
    multiplicity = np.array([1, 2, 2, 1, 2, 1] * 3)
    result = {}
    for region, mask in masks(operator.shape).items():
        result[region] = {}
        for family, part in D.FAMILIES.items():
            values = q[part]
            factors = multiplicity if family == "D" else np.ones(values.shape[0])
            node = np.sum(values**2 * factors[:, None, None, None], axis=0) / sum(
                factors
            )
            result[region][family] = float(
                np.sqrt(np.sum(node[mask] * weights[mask]) / np.sum(weights[mask]))
            )
    return result


@dataclass(frozen=True)
class StageBalance:
    continuum: np.ndarray
    chain: np.ndarray
    boundary_residual: np.ndarray
    measured: np.ndarray
    base_residual: np.ndarray
    auxiliary_residual: np.ndarray

    def __post_init__(self):
        for item in fields(self):
            value = getattr(self, item.name)
            require(np.isfinite(value).all(), "finite stage balance required")
            object.__setattr__(self, item.name, R.frozen(value))


def stage(q, saved_rhs, operator):
    raw = operator.validate(saved_rhs, 58)
    prediction = D.evaluate(q, operator, tau_inverse=1.0)
    base = raw[:11] - prediction.base_rates
    auxiliary = raw[25:] - prediction.auxiliary_rates
    interior = np.ones(operator.shape, bool)
    for mask in tuple(masks(operator.shape).values())[2:]:
        interior &= ~mask
    require(
        float(np.max(abs(base))) <= TOLERANCE,
        "saved RHS changes ODE block or volume identity",
    )
    require(
        float(np.max(abs(auxiliary[:, interior]))) <= TOLERANCE,
        "non-boundary residual invalidates SAT attribution",
    )
    boundary = auxiliary - R.gradient_aux(operator.gradient(base))
    measured = operator.measured_rates(raw)
    require(
        float(
            np.max(
                abs(
                    measured
                    - prediction.continuum_balance
                    - prediction.chain_defect
                    - boundary
                )
            )
        )
        <= TOLERANCE,
        "stage reduction budget does not close",
    )
    return StageBalance(
        prediction.continuum_balance,
        prediction.chain_defect,
        boundary,
        measured,
        base,
        auxiliary,
    )


def step_budget(start, end, stages, dt, operator):
    require(
        type(dt) in (float, int) and math.isfinite(dt) and dt > 0,
        "positive finite original dt required",
    )
    require(
        isinstance(stages, (list, tuple))
        and len(stages) == 4
        and all(isinstance(s, StageBalance) for s in stages),
        "four ordered saved stages required",
    )
    parts = {
        name: dt
        * (
            getattr(stages[0], name)
            + 2 * getattr(stages[1], name)
            + 2 * getattr(stages[2], name)
            + getattr(stages[3], name)
        )
        / 6
        for name in PARTS
    }
    measured = (
        dt
        * (
            stages[0].measured
            + 2 * stages[1].measured
            + 2 * stages[2].measured
            + stages[3].measured
        )
        / 6
    )
    delta = operator.definition_defects(end) - operator.definition_defects(start)
    errors = dict(
        linear_map=float(np.max(abs(delta - measured))),
        decomposition=float(np.max(abs(delta - sum(parts.values())))),
    )
    require(
        all(x <= TOLERANCE for x in errors.values()),
        "saved RK increment budget does not close",
    )
    return parts, delta, errors


def expand(raw, size):
    require(
        type(size) is int and 0 < size <= 2 * 9 * 58 * 17**3 * 8 + 65536,
        "bounded declared trace size required",
    )
    decoder = zlib.decompressobj()
    result = decoder.decompress(raw, size + 1)
    require(
        len(result) == size
        and decoder.eof
        and not decoder.unused_data
        and not decoder.unconsumed_tail,
        "complete exact compressed trace required",
    )
    return result


def case_contract(row, index):
    require(type(index) is int and index in (0, 1, 2), "registered case index required")
    steps = (7, 14, 28)[index]
    for key, value in dict(
        label=f"native-gauge-continuation-13-{steps}",
        n=13,
        additional_steps=steps,
        start_step=steps,
        end_step=2 * steps,
        dt=1 / (16 * steps),
        resume_time=1 / 16,
        end_time=1 / 8,
        additional_accepted_steps=steps,
        additional_native_published_steps=steps,
        status="completed",
        completed=True,
    ).items():
        require(
            row.get(key) == value and type(row.get(key)) is type(value),
            "fixed parent case mismatch: " + key,
        )
    require(
        len(row["trajectory"]) == steps + 1
        and len(row["segments"]) == (steps + 1) // 2,
        "complete case history required",
    )
    require(
        all(
            row.get(k) is False
            for k in ("physical_gate", "live_admission", "scientificPayloadWriteback")
        ),
        "unadmitted case required",
    )


def parent():
    require(
        N.sha(DIRECTORY / "receipt.json") == RECEIPT_SHA and N.sha(AUDIT) == AUDIT_SHA,
        "pinned scientific evidence changed",
    )
    receipt = json.loads((DIRECTORY / "receipt.json").read_text())
    audit = json.loads(AUDIT.read_text())
    require(
        receipt["completed"] is True
        and not receipt["errors"]
        and receipt["source_before"] == receipt["source_after"],
        "complete frozen science parent required",
    )
    require(
        audit["audit_completed"] is True
        and audit["receipt_sha256"] == RECEIPT_SHA
        and audit["additional_rhs_stages_audited"] == 196
        and audit["independent_temporal_screen"]["status"] == "unresolved",
        "unchanged196-stage parent audit required",
    )
    require(len(receipt["cases"]) == 3, "three parent cases required")
    for index, row in enumerate(receipt["cases"]):
        case_contract(row, index)
    F.verify_inventory(DIRECTORY, receipt, "receipt.json")
    for name, digest in receipt["source_after"].items():
        require(
            N.sha(N.contained(N.ROOT, name))
            == digest
            == N.sha(N.contained(DIRECTORY / "source-snapshot", name)),
            "parent source drift",
        )
    for name, digest in receipt["parent_dependencies"].items():
        require(
            N.sha(N.contained(N.ROOT, name))
            == digest
            == N.sha(N.contained(DIRECTORY / "parent-snapshot", name)),
            "parent dependency drift",
        )
    identity, binding, _ = N.native_identity()
    require(
        identity == receipt["native_identity"]
        and (DIRECTORY / "binding.txt").read_bytes() == binding,
        "parent binary/contract drift",
    )
    require(
        N.sha(DIRECTORY / receipt["global_plan"]) == receipt["global_plan_sha256"],
        "global plan identity drift",
    )
    return receipt, binding


def point_norm_error(q, point, operator):
    current = norms(operator.definition_defects(q), operator)
    error = max(
        abs(value - point["measurements"][region]["C_" + family])
        for region, row in current.items()
        for family, value in row.items()
    )
    require(error <= TOLERANCE, "saved endpoint auxiliary norm mismatch")
    return error


def save_array(budget, name, value):
    output = io.BytesIO()
    np.save(output, value, allow_pickle=False)
    budget.save(name, output.getvalue())


def analyze(budget):
    receipt, binding = parent()
    budget.record(
        "analysis-registration.json",
        dict(
            method=METHOD,
            parent_receipt_sha256=RECEIPT_SHA,
            parent_audit_sha256=AUDIT_SHA,
            cases=[r["label"] for r in receipt["cases"]],
            steps=49,
            stages=196,
            scope="saved RHS residual; SAT not independently recomputed",
            new_scientific_evolution=False,
            native_calls=0,
        ),
    )
    grid = Grid3D(
        (13,) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4
    )
    op = D.DenseSBP(grid.shape, tuple(float(x) for x in grid.spacing))
    reference = np.load(DIRECTORY / "reference.npy", allow_pickle=False)
    result = dict(
        method=METHOD,
        completed=False,
        cases=[],
        steps=0,
        stages=0,
        max_stage_error=0.0,
        max_step_error=0.0,
        max_endpoint_norm_error=0.0,
        max_base_residual=0.0,
        max_interior_auxiliary_residual=0.0,
        parent_receipt_sha256=RECEIPT_SHA,
        parent_audit_sha256=AUDIT_SHA,
        boundary_residual_independently_recomputed=False,
        new_scientific_evolution=False,
        independent_einstein_rhs_validated=False,
        old_failure_regraded=False,
        full_scientific_matrix_executed=False,
        nonlinear_constraint_stability_validated=False,
        native_calls=0,
        physical_gate=False,
        live_admission=False,
        scientificPayloadWriteback=False,
    )
    for row in receipt["cases"]:
        budget.guard()
        link = row["parent"]
        anchor = N.contained(N.ROOT, link["checkpoint"])
        require(N.sha(anchor) == link["checkpoint_sha256"], "accepted anchor changed")
        decoded = N.codec.decode(anchor.read_bytes(), binding, link["plan_sha256"])
        q = decoded["q"]
        require(
            decoded["step"] == row["start_step"]
            and decoded["state_sha256"] == link["state_sha256"],
            "wrong starting state",
        )
        initial = q.copy()
        initial_defects = op.definition_defects(initial)
        accumulated = {key: np.zeros_like(initial_defects) for key in PARTS}
        case = dict(
            label=row["label"],
            dt=row["dt"],
            start_time=1 / 16,
            end_time=1 / 8,
            steps=[],
            stage_count=0,
            initial_norms=norms(initial_defects, op),
            maximum_cumulative_error=0.0,
        )
        result["max_endpoint_norm_error"] = max(
            result["max_endpoint_norm_error"],
            point_norm_error(q, row["trajectory"][0], op),
        )
        for segment in row["segments"]:
            budget.guard()
            plan_raw = N.contained(DIRECTORY, segment["plan"]).read_bytes()
            require(
                N.codec.sha(plan_raw) == segment["plan_sha256"], "local plan changed"
            )
            plan = N.codec.read_plan(plan_raw)
            start, length, dt = segment["start"], segment["steps"], row["dt"]
            require(
                (
                    plan["shape"],
                    plan["lower"],
                    plan["upper"],
                    plan["start"],
                    plan["steps"],
                    plan["dt"],
                )
                == ((13,) * 3, (1.0,) * 3, (3.0,) * 3, start, length, dt),
                "local plan scope mismatch",
            )
            require(
                plan["initial"].tobytes() == q.tobytes(), "segment continuity changed"
            )
            for faces in plan["targets"]:
                require(
                    all(
                        face.tobytes() == expected.tobytes()
                        for face, expected in zip(
                            faces, N.targets(reference), strict=True
                        )
                    ),
                    "analytic face target changed",
                )
            raw = expand(
                N.contained(DIRECTORY, segment["trace"]).read_bytes(),
                segment["trace_bytes"],
            )
            require(
                N.codec.sha(raw) == segment["trace_sha256"], "saved stage bytes changed"
            )
            meta, blocks = N.unpack_trace(raw, grid, start, length, dt)
            for offset, block in enumerate(blocks):
                budget.guard()
                index = start + offset
                N.check_step(block, meta["trace"][offset], q, index, dt)
                checkpoint_meta = segment["native_points"][offset]
                path = N.contained(DIRECTORY, checkpoint_meta["checkpoint"])
                require(
                    N.sha(path) == checkpoint_meta["sha256"],
                    "accepted checkpoint changed",
                )
                endpoint = N.codec.decode(
                    path.read_bytes(), binding, segment["plan_sha256"]
                )
                require(
                    endpoint["state_raw"] == block[8].tobytes()
                    and endpoint["step"] == index + 1,
                    "stage/checkpoint mismatch",
                )
                stages = []
                for s in range(4):
                    budget.guard()
                    value = stage(block[2 * s], block[2 * s + 1], op)
                    stages.append(value)
                    report = meta["trace"][offset]["stages"][s]
                    interior = np.ones(grid.shape, bool)
                    for mask in tuple(masks(grid.shape).values())[2:]:
                        interior &= ~mask
                    error = float(
                        np.max(
                            abs(value.measured - sum(getattr(value, k) for k in PARTS))
                        )
                    )
                    base_error = float(np.max(abs(value.base_residual)))
                    interior_error = float(
                        np.max(abs(value.auxiliary_residual[:, interior]))
                    )
                    maxima = [f["sat_max_abs"] for f in report["faces"]]
                    require(
                        all(
                            type(x) in (int, float) and math.isfinite(x) and x >= 0
                            for x in maxima
                        ),
                        "finite saved face maxima required",
                    )
                    require(
                        float(np.max(abs(value.auxiliary_residual)))
                        <= sum(maxima) + TOLERANCE,
                        "boundary residual exceeds saved face envelope",
                    )
                    record = dict(
                        case=row["label"],
                        step=index,
                        stage=s + 1,
                        boundary_tick=report["boundary_tick"],
                        time=report["boundary_tick"] * dt / 2,
                        state_sha256=N.codec.sha(block[2 * s].tobytes()),
                        rhs_sha256=N.codec.sha(block[2 * s + 1].tobytes()),
                        trace=segment["trace"],
                        trace_sha256=segment["trace_sha256"],
                        balance_error=error,
                        base_residual_max=base_error,
                        interior_auxiliary_residual_max=interior_error,
                        part_norms={
                            key: norms(getattr(value, key), op) for key in PARTS
                        },
                    )
                    budget.record(
                        f"stages/{row['label']}-{index:04d}-{s + 1}.json", record
                    )
                    result["max_stage_error"] = max(result["max_stage_error"], error)
                    result["max_base_residual"] = max(
                        result["max_base_residual"], base_error
                    )
                    result["max_interior_auxiliary_residual"] = max(
                        result["max_interior_auxiliary_residual"], interior_error
                    )
                    case["stage_count"] += 1
                    result["stages"] += 1
                parts, delta, errors = step_budget(q, block[8], stages, dt, op)
                for key in PARTS:
                    accumulated[key] += parts[key]
                q = block[8].copy()
                cumulative = float(
                    np.max(
                        abs(
                            op.definition_defects(q)
                            - initial_defects
                            - sum(accumulated.values())
                        )
                    )
                )
                require(cumulative <= TOLERANCE, "cumulative33 budget mismatch")
                case["maximum_cumulative_error"] = max(
                    case["maximum_cumulative_error"], cumulative
                )
                result["max_step_error"] = max(
                    result["max_step_error"], *errors.values()
                )
                point = row["trajectory"][index + 1 - row["start_step"]]
                require(
                    point["point"] == index + 1
                    and point["time"] == (index + 1) * dt
                    and point["state_sha256"] == endpoint["state_sha256"],
                    "point time/state mismatch",
                )
                result["max_endpoint_norm_error"] = max(
                    result["max_endpoint_norm_error"], point_norm_error(q, point, op)
                )
                case["steps"].append(
                    dict(
                        step=index,
                        errors=errors,
                        cumulative_error=cumulative,
                        delta_norms=norms(delta, op),
                    )
                )
                result["steps"] += 1
            print(
                json.dumps(
                    dict(
                        status="saved-trajectory-reduction-audit",
                        case=row["label"],
                        steps=len(case["steps"]),
                        stages=case["stage_count"],
                    )
                ),
                flush=True,
            )
        final_defects = op.definition_defects(q)
        delta = final_defects - initial_defects
        require(
            len(case["steps"]) == row["additional_steps"]
            and case["stage_count"] == 4 * row["additional_steps"],
            "whole case coverage required",
        )
        for key, value in dict(
            initial_defects=initial_defects,
            final_defects=final_defects,
            delta=delta,
            **accumulated,
        ).items():
            save_array(budget, f"budgets/{row['label']}-{key}.npy", value)
        case.update(
            final_norms=norms(final_defects, op),
            delta_norms=norms(delta, op),
            integrated_norms={
                key: norms(value, op) for key, value in accumulated.items()
            },
        )
        result["cases"].append(case)
        budget.record(f"cases/{row['label']}.json", case)
    require(
        result["steps"] == 49 and result["stages"] == 196,
        "complete49/196 saved interval required",
    )
    parent()  # Includes original artifact/source identities; no old verdict mutation.
    result["completed"] = True
    budget.record("trajectory-reduction-result.json", result)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-directory", type=Path, required=True)
    parser.add_argument("--deadline", type=float, required=True)
    args = parser.parse_args()
    directory = args.output_directory.resolve()
    require(
        directory.parent == N.EVIDENCE and directory.is_dir(),
        "owned existing evidence directory required",
    )
    require(
        os.environ.get("NR_TRAJECTORY_ANALYSIS_ROOT") == str(directory),
        "owned bounded runner required",
    )
    remaining = args.deadline - time.monotonic()
    require(
        math.isfinite(remaining) and 0 < remaining <= 600,
        "original control deadline required",
    )
    budget = N.Budget(
        directory, seconds=remaining, cap=64 * 1024**2, headroom=2 * 1024**2
    )
    budget.deadline = args.deadline
    try:
        analyze(budget)
    except Exception as error:
        budget.record(
            "analysis-failure.json",
            dict(
                completed=False,
                error=f"{type(error).__name__}: {error}",
                retries=0,
                new_scientific_evolution=False,
            ),
            finalizing=True,
        )
        print(f"{type(error).__name__}: {error}", flush=True)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
