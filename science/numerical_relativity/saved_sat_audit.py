"""Fixed stratified SAT probes of saved N13 stages, never a new evolution."""

from __future__ import annotations

import argparse
import itertools
import json
import math
import os
from pathlib import Path
import time

import numpy as np

from . import spectral_sat_oracle as S
from . import trajectory_reduction_balance as T

N = T.N
require = N.require
FALSE_FLAGS = (
    "full_trajectory_boundary_recomputed",
    "new_scientific_evolution",
    "full_scientific_matrix_executed",
    "physical_boundary_validated",
    "common_symmetrizer_validated",
    "nonlinear_constraint_stability_validated",
    "constraint_convergence_validated",
    "old_failure_regraded",
    "physical_gate",
    "live_admission",
    "scientificPayloadWriteback",
)


def points():
    return tuple(p for p in itertools.product((0, 6, 12), repeat=3) if p != (6, 6, 6))


def selections(row):
    return (
        ("first", row["segments"][0], 0, 0),
        ("last", row["segments"][-1], row["segments"][-1]["steps"] - 1, 3),
    )


def analyze(budget):
    receipt, _ = T.parent()
    result = dict(
        method=S.METHOD,
        completed=False,
        cases=[],
        stages=0,
        points=0,
        face_terms=0,
        max_rhs_error=0.0,
        max_interior_full58_error=0.0,
        max_ode_penalty=0.0,
        native_calls=0,
        parent_receipt_sha256=T.RECEIPT_SHA,
        parent_audit_sha256=T.AUDIT_SHA,
        **{key: False for key in FALSE_FLAGS},
    )
    budget.record(
        "sat-probe-registration.json",
        dict(
            method=S.METHOD,
            parent_receipt_sha256=T.RECEIPT_SHA,
            stages=6,
            points=156,
            face_terms=324,
            point_indices=points(),
            policy="first k1 and last k4 of each original continuation; all26 boundary strata",
            native_calls=0,
        ),
    )
    grid = T.Grid3D(
        (13,) * 3, (1.0,) * 3, (3.0,) * 3, boundary="sbp-volume", spatial_order=4
    )
    op = T.D.DenseSBP(grid.shape, tuple(float(x) for x in grid.spacing))
    reference = np.load(T.DIRECTORY / "reference.npy", allow_pickle=False)
    for case in receipt["cases"]:
        for phase, segment, offset, stage in selections(case):
            budget.guard()
            stem = f"{case['label']}-{phase}"
            plan_raw = N.contained(T.DIRECTORY, segment["plan"]).read_bytes()
            require(
                N.codec.sha(plan_raw) == segment["plan_sha256"], "pinned plan changed"
            )
            plan = N.codec.read_plan(plan_raw)
            require(
                (
                    plan["shape"],
                    plan["lower"],
                    plan["upper"],
                    plan["start"],
                    plan["steps"],
                    plan["dt"],
                )
                == (
                    grid.shape,
                    grid.lower,
                    grid.upper,
                    segment["start"],
                    segment["steps"],
                    case["dt"],
                ),
                "fixed saved plan required",
            )
            targets = N.targets(reference)
            require(
                all(
                    all(
                        np.array_equal(a, b)
                        for a, b in zip(face_set, targets, strict=True)
                    )
                    for face_set in plan["targets"]
                ),
                "unchanged analytic face targets required",
            )
            raw = T.expand(
                N.contained(T.DIRECTORY, segment["trace"]).read_bytes(),
                segment["trace_bytes"],
            )
            require(N.codec.sha(raw) == segment["trace_sha256"], "pinned trace changed")
            meta, blocks = N.unpack_trace(
                raw, grid, segment["start"], segment["steps"], case["dt"]
            )
            block = blocks[offset]
            index = segment["start"] + offset
            N.check_step(
                block,
                meta["trace"][offset],
                plan["initial"] if offset == 0 else blocks[offset - 1, 8],
                index,
                case["dt"],
            )
            q, rhs = block[2 * stage], block[2 * stage + 1]
            dq = op.gradient(q)
            volume = S.G.evaluate(S.R.CanonicalJet(q, dq)).rhs
            interior = float(np.max(abs((rhs - volume)[:, 1:-1, 1:-1, 1:-1])))
            require(
                interior <= S.TOLERANCE,
                "saved interior full58 volume reference mismatch",
            )
            report = meta["trace"][offset]["stages"][stage]
            rows, qs, dqs, rhss, bulks, penalties, face_rows, matrices, jumps, terms = (
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
                [],
            )
            for point in points():
                budget.guard()
                cell = q[(slice(None), *point)]
                target = reference[(slice(None), *point)]
                # All six targets are restrictions of the same immutable reference.
                cache = {}

                def factory(values, axis):
                    split = S.SpectralSAT.from_cell(values, axis)
                    cache[axis] = split
                    return split

                penalty, contributions = S.assemble(
                    point, grid.shape, cell, [target] * 6, op.spacing, factory=factory
                )
                actual = rhs[(slice(None), *point)]
                bulk = volume[(slice(None), *point)]
                error = float(np.max(abs(actual - bulk - penalty)))
                require(
                    error <= S.TOLERANCE,
                    "independent SAT differs from saved full58 RHS",
                )
                ode = float(np.max(abs(penalty[:11])))
                result["max_rhs_error"] = max(result["max_rhs_error"], error)
                result["max_ode_penalty"] = max(result["max_ode_penalty"], ode)
                region = {1: "faces", 2: "edges", 3: "corners"}[len(contributions)]
                rows.append(
                    dict(point=point, region=region, error=error, face_indices=[])
                )
                for axis, side, value in contributions:
                    split = cache[axis]
                    require(
                        float(np.max(abs(value)))
                        <= report["faces"][2 * axis + side]["sat_max_abs"]
                        + S.TOLERANCE,
                        "independent term exceeds saved face envelope",
                    )
                    rows[-1]["face_indices"].append(len(face_rows))
                    face_rows.append(
                        dict(
                            point=point,
                            axis=axis,
                            side=side,
                            weight=op.spacing[axis] * 17 / 48,
                            roots=split.roots.tolist(),
                            advection=split.advection,
                        )
                    )
                    matrices.append(split.matrix)
                    jumps.append(cell - target)
                    terms.append(value)
                qs.append(cell)
                dqs.append(dq[(slice(None), slice(None), *point)])
                rhss.append(actual)
                bulks.append(bulk)
                penalties.append(penalty)
            require(
                len(rows) == 26 and len(face_rows) == 54,
                "all face/edge/corner probes required",
            )
            arrays = dict(
                q=np.array(qs),
                dq=np.array(dqs),
                rhs=np.array(rhss),
                bulk=np.array(bulks),
                penalty=np.array(penalties),
                principal=np.array(matrices),
                jump=np.array(jumps),
                term=np.array(terms),
            )
            for name, value in arrays.items():
                T.save_array(budget, f"probes/{stem}-{name}.npy", value)
            record = dict(
                label=case["label"],
                phase=phase,
                step=index,
                stage=stage + 1,
                boundary_tick=report["boundary_tick"],
                time=report["boundary_tick"] * case["dt"] / 2,
                trace=segment["trace"],
                trace_sha256=segment["trace_sha256"],
                state_sha256=N.codec.sha(q.tobytes()),
                rhs_sha256=N.codec.sha(rhs.tobytes()),
                dt=case["dt"],
                interior_full58_error=interior,
                points=rows,
                faces=face_rows,
            )
            budget.record(f"probes/{stem}.json", record)
            result["cases"].append(record)
            result["stages"] += 1
            result["points"] += 26
            result["face_terms"] += 54
            result["max_interior_full58_error"] = max(
                result["max_interior_full58_error"], interior
            )
            print(
                json.dumps(
                    dict(
                        status="saved-independent-sat-probes",
                        case=stem,
                        stages=result["stages"],
                        points=result["points"],
                    )
                ),
                flush=True,
            )
    require(
        (result["stages"], result["points"], result["face_terms"]) == (6, 156, 324),
        "complete registered probes required",
    )
    T.parent()
    result["completed"] = True
    budget.record("saved-sat-result.json", result)
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
        os.environ.get("NR_SAVED_SAT_ROOT") == str(directory),
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
            "sat-analysis-failure.json",
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
