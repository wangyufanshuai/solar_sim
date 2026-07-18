"""Fit 0-30 day initial-state offsets and blind-test V9 at 1 and 10 years.

Raw propagation evidence remains authoritative and separate. A common set of
per-model linear residual offsets is estimated with the DOP853 research
implementation, barycentrically rebalanced, then evaluated by both DOP853 and
the independently implemented REBOUND IAS15 force model. No production,
browser, or Worker physics is imported or mutated.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from types import ModuleType

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DAYS = tuple(float(day) for day in range(1, 31))
HOLDOUT_DAYS = (365.0, 3652.5)
MODES = ("legacy-eih-1pn", "full-eih-1pn-2pn-lt")
POSITION_FLOOR_KM = 1e-6


def load_module(name: str, path: Path) -> ModuleType:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"unable to load research module: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


DOP = load_module("atlas_relativity_reference_v9", ROOT / "scripts" / "run-relativity-reference-v9.py")
IAS = load_module("atlas_relativity_ias15_v9", ROOT / "scripts" / "run-relativity-ias15-v9.py")


def canonical_hash(value: object) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    return hashlib.sha256(payload).hexdigest()


def fixture_state(checkpoint: dict, ids: list[str]) -> tuple[np.ndarray, np.ndarray]:
    source = {body["id"]: body for body in checkpoint["bodies"]}
    positions = np.array([
        [source[body_id][axis] for axis in ("x_au", "y_au", "z_au")]
        for body_id in ids
    ], dtype=float) * DOP.AU_M
    velocities = np.array([
        [source[body_id][axis] for axis in ("vx_au_d", "vy_au_d", "vz_au_d")]
        for body_id in ids
    ], dtype=float) * DOP.AU_M / DOP.DAY_S
    return positions, velocities


def relative_components(state: np.ndarray, count: int) -> tuple[np.ndarray, np.ndarray]:
    positions, velocities = DOP.unpack(state, count)
    return positions - positions[0], velocities - velocities[0]


def fit_offsets(initial, masses, mode, fixture_by_day, ids, args):
    simulated, evaluations = DOP.integrate_mode(
        initial, masses, mode, CALIBRATION_DAYS,
        args.dop_rtol, args.dop_atol, args.max_step_days,
    )
    times_days = np.asarray((0.0, *CALIBRATION_DAYS), dtype=float)
    design = np.column_stack((np.ones_like(times_days), times_days * DOP.DAY_S))
    count = len(ids)
    residuals = np.zeros((len(times_days), count, 3), dtype=float)
    initial_relative, _ = relative_components(initial, count)
    ref_initial, _ = fixture_state(fixture_by_day[0.0], ids)
    residuals[0] = initial_relative - (ref_initial - ref_initial[0])
    for index, (day, state) in enumerate(zip(CALIBRATION_DAYS, simulated), start=1):
        relative_position, _ = relative_components(state, count)
        reference_position, _ = fixture_state(fixture_by_day[day], ids)
        residuals[index] = relative_position - (reference_position - reference_position[0])

    position_offsets = np.zeros((count, 3), dtype=float)
    velocity_offsets = np.zeros((count, 3), dtype=float)
    fitted = np.zeros_like(residuals)
    for body_index in range(1, count):
        coefficients, *_ = np.linalg.lstsq(design, residuals[:, body_index, :], rcond=None)
        position_offsets[body_index] = -coefficients[0]
        velocity_offsets[body_index] = -coefficients[1]
        fitted[:, body_index, :] = design @ coefficients

    # A common translation/boost preserves every heliocentric correction and
    # restores barycentric center-of-mass and momentum constraints.
    total_mass = float(np.sum(masses))
    position_offsets -= np.sum(position_offsets * masses[:, None], axis=0) / total_mass
    velocity_offsets -= np.sum(velocity_offsets * masses[:, None], axis=0) / total_mass
    positions, velocities = DOP.unpack(initial.copy(), count)
    adjusted = DOP.state_vector(positions + position_offsets, velocities + velocity_offsets)
    corrections = [{
        "bodyId": body_id,
        "positionOffsetKm": [float(value / 1000.0) for value in position_offsets[index]],
        "velocityOffsetMS": [float(value) for value in velocity_offsets[index]],
        "positionOffsetNormKm": float(np.linalg.norm(position_offsets[index]) / 1000.0),
        "velocityOffsetNormMS": float(np.linalg.norm(velocity_offsets[index])),
    } for index, body_id in enumerate(ids)]
    return adjusted, {
        "mode": mode,
        "method": "per-body-heliocentric-linear-position-residual-fit-with-barycentric-rebalance",
        "calibrationDays": [0.0, *CALIBRATION_DAYS],
        "functionEvaluations": evaluations,
        "prefitPositionComponentRmsKm": float(np.sqrt(np.mean(residuals[:, 1:, :] ** 2)) / 1000.0),
        "linearDetrendedPositionComponentRmsKm": float(np.sqrt(np.mean((residuals[:, 1:, :] - fitted[:, 1:, :]) ** 2)) / 1000.0),
        "corrections": corrections,
    }


def initial_checkpoint(state: np.ndarray, ids: list[str]) -> dict:
    positions, velocities = DOP.unpack(state, len(ids))
    bodies = []
    for body_id, position, velocity in zip(ids, positions, velocities):
        bodies.append({
            "id": body_id,
            "x_au": float(position[0] / DOP.AU_M),
            "y_au": float(position[1] / DOP.AU_M),
            "z_au": float(position[2] / DOP.AU_M),
            "vx_au_d": float(velocity[0] * DOP.DAY_S / DOP.AU_M),
            "vy_au_d": float(velocity[1] * DOP.DAY_S / DOP.AU_M),
            "vz_au_d": float(velocity[2] * DOP.DAY_S / DOP.AU_M),
        })
    return {"label": "fitted-epoch", "offsetDays": 0.0, "bodies": bodies}


def residual_rows_dop(states, checkpoints, ids):
    rows = []
    for state, checkpoint in zip(states, checkpoints):
        reference = fixture_state(checkpoint, ids)
        rows.append({
            "offsetDays": float(checkpoint["offsetDays"]),
            "bodies": [{"bodyId": body_id, **values} for body_id, values in zip(ids, DOP.body_residuals(state, *reference))],
        })
    return rows


def residual_rows_ias(states, checkpoints, ids):
    rows = []
    for state, checkpoint in zip(states, checkpoints):
        values = IAS.residuals(state, checkpoint, ids)
        rows.append({
            "offsetDays": float(checkpoint["offsetDays"]),
            "bodies": [{"bodyId": body_id, **values[body_id]} for body_id in ids],
        })
    return rows


def by_body(rows, day, body_id):
    checkpoint = next(row for row in rows if row["offsetDays"] == day)
    return next(row for row in checkpoint["bodies"] if row["bodyId"] == body_id)


def aggregate(rows, day):
    bodies = next(row for row in rows if row["offsetDays"] == day)["bodies"]
    return {
        "positionRmsKm": math.sqrt(sum(row["positionResidualKm"] ** 2 for row in bodies) / len(bodies)),
        "velocityRmsMS": math.sqrt(sum(row["velocityResidualMS"] ** 2 for row in bodies) / len(bodies)),
    }


def one_run(fixture: dict, args: argparse.Namespace) -> dict:
    ids = list(fixture["bodyIds"])
    fixture_by_day = {float(row["offsetDays"]): row for row in fixture["checkpoints"]}
    holdouts = [fixture_by_day[day] for day in HOLDOUT_DAYS]
    positions, velocities = fixture_state(fixture_by_day[0.0], ids)
    initial = DOP.state_vector(positions, velocities)
    masses = np.array([DOP.GM[body_id] / DOP.G for body_id in ids], dtype=float)
    adjusted, fits = {}, []
    for mode in MODES:
        adjusted[mode], fit = fit_offsets(initial, masses, mode, fixture_by_day, ids, args)
        fits.append(fit)

    dop_runs = {}
    for label, rtol, atol in (
        ("fine", args.dop_rtol, args.dop_atol),
        ("finer", args.dop_finer_rtol, args.dop_finer_atol),
    ):
        dop_runs[label] = {}
        for mode in MODES:
            states, evaluations = DOP.integrate_mode(adjusted[mode], masses, mode, HOLDOUT_DAYS, rtol, atol, args.max_step_days)
            dop_runs[label][mode] = {
                "functionEvaluations": evaluations,
                "checkpoints": residual_rows_dop(states, holdouts, ids),
            }

    ias_runs = {}
    for epsilon in args.ias_epsilons:
        epsilon_key = format(epsilon, ".12g")
        ias_runs[epsilon_key] = {}
        for mode in MODES:
            result = IAS.run_mode(initial_checkpoint(adjusted[mode], ids), holdouts, ids, mode, epsilon)
            ias_runs[epsilon_key][mode] = {
                "additionalForceEvaluations": result["additionalForceEvaluations"],
                "checkpoints": residual_rows_ias(result["states"], holdouts, ids),
            }

    fine_ias = format(args.ias_epsilons[-1], ".12g")
    coarse_ias = format(args.ias_epsilons[0], ".12g")
    cross_solver = []
    for day in HOLDOUT_DAYS:
        bodies = []
        for body_id in ids:
            dl = by_body(dop_runs["finer"][MODES[0]]["checkpoints"], day, body_id)
            dc = by_body(dop_runs["finer"][MODES[1]]["checkpoints"], day, body_id)
            dcl = by_body(dop_runs["fine"][MODES[0]]["checkpoints"], day, body_id)
            dcc = by_body(dop_runs["fine"][MODES[1]]["checkpoints"], day, body_id)
            il = by_body(ias_runs[fine_ias][MODES[0]]["checkpoints"], day, body_id)
            ic = by_body(ias_runs[fine_ias][MODES[1]]["checkpoints"], day, body_id)
            icl = by_body(ias_runs[coarse_ias][MODES[0]]["checkpoints"], day, body_id)
            icc = by_body(ias_runs[coarse_ias][MODES[1]]["checkpoints"], day, body_id)
            dop_delta = dc["positionResidualKm"] - dl["positionResidualKm"]
            dop_coarse_delta = dcc["positionResidualKm"] - dcl["positionResidualKm"]
            ias_delta = ic["positionResidualKm"] - il["positionResidualKm"]
            ias_coarse_delta = icc["positionResidualKm"] - icl["positionResidualKm"]
            dop_u = max(POSITION_FLOOR_KM, 5.0 * abs(dop_delta - dop_coarse_delta))
            ias_u = max(POSITION_FLOOR_KM, 5.0 * abs(ias_delta - ias_coarse_delta))
            joint_u = dop_u + ias_u + POSITION_FLOOR_KM
            if dop_delta > dop_u and ias_delta > ias_u and abs(dop_delta - ias_delta) <= joint_u:
                outcome = "cross-solver-regression-confirmed"
            elif dop_delta < -dop_u and ias_delta < -ias_u and abs(dop_delta - ias_delta) <= joint_u:
                outcome = "cross-solver-improvement-confirmed"
            elif abs(dop_delta) <= dop_u and abs(ias_delta) <= ias_u:
                outcome = "unresolved-within-joint-uncertainty"
            else:
                outcome = "solver-disagreement"
            bodies.append({
                "bodyId": body_id,
                "dop853PositionDeltaKm": dop_delta,
                "ias15PositionDeltaKm": ias_delta,
                "positionJointUncertaintyKm": joint_u,
                "outcome": outcome,
            })
        cross_solver.append({"offsetDays": day, "bodies": bodies})

    aggregates = []
    for day in HOLDOUT_DAYS:
        aggregates.append({
            "offsetDays": day,
            "dop853": {
                "legacy": aggregate(dop_runs["finer"][MODES[0]]["checkpoints"], day),
                "candidate": aggregate(dop_runs["finer"][MODES[1]]["checkpoints"], day),
            },
            "ias15": {
                "legacy": aggregate(ias_runs[fine_ias][MODES[0]]["checkpoints"], day),
                "candidate": aggregate(ias_runs[fine_ias][MODES[1]]["checkpoints"], day),
            },
        })
    return {"fits": fits, "dop853": dop_runs, "ias15": ias_runs, "crossSolver": cross_solver, "aggregates": aggregates}


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas V9 fitted-initial-state blind validator")
    parser.add_argument("--fixture", default="dist/science/relativity-reference-fixture-v9.json")
    parser.add_argument("--output", default="dist/science/relativity-fitted-blind-v9.json")
    parser.add_argument("--reruns", type=int, choices=(1, 2), default=2)
    parser.add_argument("--dop-rtol", type=float, default=1e-12)
    parser.add_argument("--dop-atol", type=float, default=1e-15)
    parser.add_argument("--dop-finer-rtol", type=float, default=3e-13)
    parser.add_argument("--dop-finer-atol", type=float, default=3e-16)
    parser.add_argument("--max-step-days", type=float, default=0.25)
    parser.add_argument("--ias-epsilons", nargs=2, type=float, default=[1e-11, 3e-12])
    args = parser.parse_args()
    fixture_path = (ROOT / args.fixture).resolve()
    fixture_bytes = fixture_path.read_bytes()
    fixture = json.loads(fixture_bytes)
    if fixture.get("coordinateFrame") != "ICRF-J2000-barycentric" or fixture.get("timeScale") != "TDB":
        raise SystemExit("fitted blind V9 requires the barycentric ICRF/J2000 TDB fixture")
    available_days = {float(row["offsetDays"]) for row in fixture["checkpoints"]}
    if not {0.0, *CALIBRATION_DAYS, *HOLDOUT_DAYS}.issubset(available_days):
        raise SystemExit("fixture is missing daily 0-30 calibration or 365/3652.5 holdout checkpoints")

    runs = [one_run(fixture, args) for _ in range(args.reruns)]
    hashes = [canonical_hash(run) for run in runs]
    primary = runs[0]
    ten_year = next(row for row in primary["crossSolver"] if row["offsetDays"] == 3652.5)
    mercury = next(row for row in ten_year["bodies"] if row["bodyId"] == "mercury")
    ten_year_aggregate = next(row for row in primary["aggregates"] if row["offsetDays"] == 3652.5)
    aggregate_improvement = all(
        ten_year_aggregate[solver]["candidate"][metric] < ten_year_aggregate[solver]["legacy"][metric]
        for solver in ("dop853", "ias15") for metric in ("positionRmsKm", "velocityRmsMS")
    )
    report = {
        "version": "v204-relativity-fitted-blind-validation-v9",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "fixture": str(fixture_path),
        "fixtureSha256": hashlib.sha256(fixture_bytes).hexdigest(),
        "coordinateFrame": "ICRF-J2000-barycentric",
        "timeScale": "TDB",
        "calibration": {
            "windowDays": [0.0, 30.0], "sampleCount": 31,
            "owner": "scipy-dop853-research-runner",
            "method": "linear-heliocentric-position-residual-fit",
            "barycentricRebalance": True,
        },
        "holdoutsDays": list(HOLDOUT_DAYS),
        "solvers": {
            "dop853": {"rtol": [args.dop_rtol, args.dop_finer_rtol], "atol": [args.dop_atol, args.dop_finer_atol], "maxStepDays": args.max_step_days},
            "ias15": {"version": IAS.rebound.__version__, "epsilons": args.ias_epsilons},
        },
        "independentRerunCount": args.reruns,
        "rerunCanonicalHashes": hashes,
        "rerunHashesMatch": len(hashes) == 2 and hashes[0] == hashes[1],
        "results": primary,
        "mercuryTenYear": mercury,
        "aggregateImprovement": aggregate_improvement,
        "promotionQualified": False,
        "promotionDecision": "shadow-retained",
        "defaultKernel": "legacy-eih-1pn",
        "shadowKernel": "barycentric-eih-1pn-j2-2pn-lt-v9",
        "rawPropagationEvidence": "dist/science/relativity-joint-validation-v9.json",
        "rawPropagationReplaced": False,
        "physicalCauseEstablished": False,
        "liveStateMutated": False,
        "workerStateMutated": False,
        "boundary": "offline-fitted-blind-research-evidence-no-runtime-promotion",
    }
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "version": report["version"], "output": str(output),
        "rerunHashesMatch": report["rerunHashesMatch"],
        "mercuryTenYear": mercury,
        "aggregateImprovement": aggregate_improvement,
        "promotionDecision": report["promotionDecision"],
    }, indent=2))


if __name__ == "__main__":
    main()
