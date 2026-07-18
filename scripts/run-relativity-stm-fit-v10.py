"""Independent finite-difference STM Gauss-Newton fit for V10 research.

The runner owns its numerical fit and only imports the offline DOP853 research
equations. It never imports or mutates browser/Worker physics. Raw propagation
and fitted blind holdouts are emitted side by side.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
MODES = ("legacy-eih-1pn", "full-eih-1pn-2pn-lt")
CALIBRATION_DAYS = tuple(float(day) for day in range(1, 31))
HOLDOUT_DAYS = (365.0, 3652.5)
DIAGNOSTIC_DAYS = (36525.0,)


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


DOP = load_module("atlas_relativity_reference_v9", ROOT / "scripts/run-relativity-reference-v9.py")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def state_from_fixture(row: dict, ids: list[str]):
    source = {body["id"]: body for body in row["bodies"]}
    positions = np.array([[source[body_id][axis] for axis in ("x_au", "y_au", "z_au")] for body_id in ids], dtype=float) * DOP.AU_M
    velocities = np.array([[source[body_id][axis] for axis in ("vx_au_d", "vy_au_d", "vz_au_d")] for body_id in ids], dtype=float) * DOP.AU_M / DOP.DAY_S
    return DOP.state_vector(positions, velocities)


def state_from_bundle(row: dict, ids: list[str]):
    source = {body["id"]: body for body in row["bodies"]}
    positions = np.array([source[body_id]["positionAu"] for body_id in ids], dtype=float) * DOP.AU_M
    velocities = np.array([source[body_id]["velocityAuDay"] for body_id in ids], dtype=float) * DOP.AU_M / DOP.DAY_S
    return DOP.state_vector(positions, velocities)


def observation_residual(state: np.ndarray, reference: np.ndarray, count: int) -> np.ndarray:
    positions, velocities = DOP.unpack(state, count)
    ref_positions, ref_velocities = DOP.unpack(reference, count)
    relative_position = (positions - positions[0]) - (ref_positions - ref_positions[0])
    relative_velocity = (velocities - velocities[0]) - (ref_velocities - ref_velocities[0])
    # Position is km; velocity is m/s. This weighting keeps both observables
    # visible without allowing velocity units to dominate the fit.
    values = []
    for index in range(1, count):
        values.extend((relative_position[index] / 1000.0).tolist())
        values.extend((relative_velocity[index] * 10.0).tolist())
    return np.asarray(values, dtype=float)


def rebalance_delta(delta: np.ndarray, masses: np.ndarray) -> np.ndarray:
    output = delta.reshape(len(masses), 6).copy()
    total_mass = float(np.sum(masses))
    output[:, :3] -= np.sum(output[:, :3] * masses[:, None], axis=0) / total_mass
    output[:, 3:] -= np.sum(output[:, 3:] * masses[:, None], axis=0) / total_mass
    return output.reshape(-1)


def body6_to_state(delta: np.ndarray, count: int) -> np.ndarray:
    values = delta.reshape(count, 6)
    return np.concatenate((values[:, :3].reshape(-1), values[:, 3:].reshape(-1)))


def perturbation_matrix(count: int, masses: np.ndarray, position_step_m: float, velocity_step_ms: float):
    columns = []
    for body_index in range(1, count):
        for component in range(6):
            delta = np.zeros((count, 6), dtype=float)
            delta[body_index, component] = position_step_m if component < 3 else velocity_step_ms
            balanced = rebalance_delta(delta.reshape(-1), masses)
            columns.append(body6_to_state(balanced, count))
    return columns


def integrate_observations(initial: np.ndarray, masses: np.ndarray, mode: str, days: tuple[float, ...], args):
    states, evaluations = DOP.integrate_mode(initial, masses, mode, days, args.rtol, args.atol, args.max_step_days)
    return states, evaluations


def fit_mode(initial, masses, mode, references, ids, args):
    count = len(ids)
    perturbations = perturbation_matrix(count, masses, args.position_step_m, args.velocity_step_ms)
    adjusted = initial.copy()
    iterations = []
    for iteration in range(args.iterations):
        states, evaluations = integrate_observations(adjusted, masses, mode, CALIBRATION_DAYS, args)
        residual = np.concatenate([
            observation_residual(state, references[day], count)
            for day, state in zip(CALIBRATION_DAYS, states)
        ])
        jacobian_columns = []
        for delta in perturbations:
            perturbed_states, _ = integrate_observations(adjusted + delta, masses, mode, CALIBRATION_DAYS, args)
            perturbed_residual = np.concatenate([
                observation_residual(state, references[day], count)
                for day, state in zip(CALIBRATION_DAYS, perturbed_states)
            ])
            # One column is the residual response to one prior-scaled state
            # perturbation. Coefficients are therefore dimensionless and the
            # Tikhonov term has a direct "number of prior sigmas" meaning.
            jacobian_columns.append(perturbed_residual - residual)
        jacobian = np.column_stack(jacobian_columns)
        selected_lambda = args.regularization_lambda
        condition = math.inf
        step = None
        physical_delta = None
        max_position_offset_m = math.inf
        max_velocity_offset_ms = math.inf
        for exponent in range(13):
            selected_lambda = args.regularization_lambda * 10.0 ** exponent
            regularizer = math.sqrt(selected_lambda) * np.eye(jacobian.shape[1])
            rhs = np.concatenate((-residual, np.zeros(jacobian.shape[1])))
            lhs = np.vstack((jacobian, regularizer))
            singular_values = np.linalg.svd(lhs, compute_uv=False)
            condition = float(singular_values[0] / max(singular_values[-1], 1e-30))
            step, *_ = np.linalg.lstsq(lhs, rhs, rcond=None)
            candidate_delta = np.sum([
                coefficient * direction for coefficient, direction in zip(step, perturbations)
            ], axis=0)
            delta_positions, delta_velocities = DOP.unpack(candidate_delta, count)
            max_position_offset_m = float(np.max(np.linalg.norm(delta_positions, axis=1)))
            max_velocity_offset_ms = float(np.max(np.linalg.norm(delta_velocities, axis=1)))
            physical_delta = candidate_delta
            if max_position_offset_m <= args.max_position_offset_m and max_velocity_offset_ms <= args.max_velocity_offset_ms:
                break
        if step is None or physical_delta is None:
            raise RuntimeError("STM regularized solve did not produce a finite step")
        # The Jacobian columns are derivatives along normalized physical
        # perturbation directions, so coefficients map back through the same
        # directions without mixing the packed position/velocity layout.
        adjusted = adjusted + physical_delta
        iterations.append({
            "iteration": iteration + 1,
            "functionEvaluations": evaluations,
            "weightedResidualRms": float(np.sqrt(np.mean(residual ** 2))),
            "conditionNumber": condition,
            "selectedRegularizationLambda": selected_lambda,
            "stepNorm": float(np.linalg.norm(physical_delta)),
            "maxPositionOffsetM": max_position_offset_m,
            "maxVelocityOffsetMS": max_velocity_offset_ms,
        })
    final_states, final_evaluations = integrate_observations(adjusted, masses, mode, CALIBRATION_DAYS, args)
    final_by_day = [
        observation_residual(state, references[day], count)
        for day, state in zip(CALIBRATION_DAYS, final_states)
    ]
    final_residual = np.concatenate(final_by_day)
    normal_inverse = np.linalg.inv(
        jacobian.T @ jacobian + selected_lambda * np.eye(jacobian.shape[1])
    )
    residual_variance = float(
        np.dot(final_residual, final_residual)
        / max(final_residual.size - jacobian.shape[1], 1)
    )
    covariance_diagonal = np.diag(normal_inverse * residual_variance)
    day_residual_rms = [float(np.sqrt(np.mean(values ** 2))) for values in final_by_day]
    leave_one_day_out = []
    block_size = final_by_day[0].size
    for index, values in enumerate(final_by_day):
        start = index * block_size
        stop = start + block_size
        block_jacobian = jacobian[start:stop]
        block_hat = block_jacobian @ normal_inverse @ block_jacobian.T
        press_residual = np.linalg.solve(np.eye(block_size) - block_hat, values)
        leave_one_day_out.append(float(np.sqrt(np.mean(press_residual ** 2))))
    return adjusted, iterations, {
        "weightedResidualRms": float(np.sqrt(np.mean(final_residual ** 2))),
        "leaveOneDayOutRms": float(np.sqrt(np.mean(np.asarray(leave_one_day_out) ** 2))),
        "worstLeaveOneDayOutRms": max(leave_one_day_out),
        "dayResidualRms": [
            {"offsetDays": day, "weightedRms": value}
            for day, value in zip(CALIBRATION_DAYS, day_residual_rms)
        ],
        "leaveOneDayOut": [
            {"offsetDays": day, "weightedPressRms": value}
            for day, value in zip(CALIBRATION_DAYS, leave_one_day_out)
        ],
        "leaveOneDayOutMethod": "regularized-linearized-grouped-press",
        "coefficientCovarianceDiagonal": covariance_diagonal.tolist(),
        "observationWeights": {
            "position": "residual_m / 1000 (kilometres)",
            "velocity": "residual_m_s * 10",
        },
        "functionEvaluations": final_evaluations,
    }


def rms(values):
    values = np.asarray(values, dtype=float)
    return float(math.sqrt(np.mean(values * values)))


def position_rms_from_weighted(residual: np.ndarray, body_count: int) -> float:
    matrix = residual.reshape(body_count - 1, 6)
    return rms(np.linalg.norm(matrix[:, :3], axis=1))


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas V10 STM batch fit")
    parser.add_argument("--fixture", default="dist/science/relativity-reference-fixture-v9.json")
    parser.add_argument("--bundle", default="dist/science/relativity-reference-bundle-v10.json")
    parser.add_argument("--output", default="dist/science/relativity-stm-fit-v10.json")
    parser.add_argument("--iterations", type=int, default=2)
    parser.add_argument("--max-step-days", type=float, default=0.5)
    parser.add_argument("--rtol", type=float, default=1e-10)
    parser.add_argument("--atol", type=float, default=1e-12)
    parser.add_argument("--position-step-m", type=float, default=1000.0)
    parser.add_argument("--velocity-step-ms", type=float, default=1e-3)
    parser.add_argument("--regularization-lambda", type=float, default=1.0)
    parser.add_argument("--max-position-offset-m", type=float, default=5000.0)
    parser.add_argument("--max-velocity-offset-ms", type=float, default=0.01)
    parser.add_argument("--skip-diagnostic", action="store_true")
    args = parser.parse_args()
    fixture_path = (ROOT / args.fixture).resolve()
    bundle_path = (ROOT / args.bundle).resolve()
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    bundle = json.loads(bundle_path.read_text(encoding="utf-8"))
    if bundle.get("coordinateFrame") != "ICRF-J2000-barycentric" or bundle.get("timeScale") != "TDB" or not bundle.get("provenanceReady"):
        raise SystemExit("V10 STM fit requires a provenance-ready ICRF/TDB bundle")
    ids = list(fixture["bodyIds"])
    fixture_by_day = {float(row["offsetDays"]): row for row in fixture["checkpoints"]}
    bundle_by_day = {
        float(row["offsetDays"]): row for row in bundle["epochs"]
        if row["source"] == "horizons-frozen"
    }
    evaluation_days = HOLDOUT_DAYS if args.skip_diagnostic else HOLDOUT_DAYS + DIAGNOSTIC_DAYS
    required = {0.0, *CALIBRATION_DAYS, *evaluation_days}
    if not required.issubset(bundle_by_day):
        raise SystemExit("bundle missing required calibration/holdout/diagnostic epochs")
    initial = state_from_fixture(fixture_by_day[0.0], ids)
    masses = np.array([DOP.GM[body_id] / DOP.G for body_id in ids], dtype=float)
    references = {day: state_from_bundle(bundle_by_day[day], ids) for day in bundle_by_day if day in required or day in CALIBRATION_DAYS}
    reports = []
    for mode in MODES:
        adjusted, iterations, calibration = fit_mode(initial, masses, mode, references, ids, args)
        raw_states, raw_eval = integrate_observations(initial, masses, mode, evaluation_days, args)
        fitted_states, fitted_eval = integrate_observations(adjusted, masses, mode, evaluation_days, args)
        raw_rows, fitted_rows = [], []
        for day, raw_state, fitted_state in zip(evaluation_days, raw_states, fitted_states):
            reference = references[day]
            raw_residual = observation_residual(raw_state, reference, len(ids))
            fitted_residual = observation_residual(fitted_state, reference, len(ids))
            raw_rows.append({"offsetDays": day, "weightedRms": float(np.sqrt(np.mean(raw_residual ** 2))), "positionRmsKm": position_rms_from_weighted(raw_residual, len(ids))})
            fitted_rows.append({"offsetDays": day, "weightedRms": float(np.sqrt(np.mean(fitted_residual ** 2))), "positionRmsKm": position_rms_from_weighted(fitted_residual, len(ids))})
        reports.append({
            "mode": mode,
            "calibrationWindowDays": [0.0, 30.0],
            "observationCount": len(CALIBRATION_DAYS) * (len(ids) - 1) * 6,
            "parameterCount": (len(ids) - 1) * 6,
            "solver": "scipy-least-squares-stm",
            "regularizationLambda": args.regularization_lambda,
            "conditionNumber": max(item["conditionNumber"] for item in iterations),
            "iterations": iterations,
            "calibration": calibration,
            "raw": {"checkpoints": raw_rows, "functionEvaluations": raw_eval},
            "fitted": {"checkpoints": fitted_rows, "functionEvaluations": fitted_eval},
            "rawPropagationReplaced": False,
            "provenanceReady": True,
            "boundary": "offline-fit-only-no-runtime-promotion",
        })
    stable = {"version": "v209-relativity-stm-fit-v10", "fixtureSha256": sha256(fixture_path), "bundleSha256": sha256(bundle_path), "reports": reports}
    report = {"version": "v209-relativity-stm-fit-v10", "generatedAt": datetime.now(timezone.utc).isoformat(), **stable, "diagnosticComplete": not args.skip_diagnostic, "promotionDecision": "shadow-retained", "rawPropagationReplaced": False, "boundary": "offline-stm-fit-and-blind-holdout-no-runtime-promotion"}
    output = (ROOT / args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"version": report["version"], "output": str(output), "modeCount": len(reports), "promotionDecision": report["promotionDecision"]}, indent=2))


if __name__ == "__main__":
    main()
