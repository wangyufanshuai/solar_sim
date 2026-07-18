"""Integrated 72-state + 72x66 variational STM research runner (v229/v12).

This is offline-only.  It imports the independent V9 research force model,
never browser/Worker physics, and keeps raw, finite-difference and variational
results as separate evidence channels.  Newton and solar J2 Jacobians are
analytic; the velocity-dependent PN remainder uses a holomorphic complex-step
Jacobian plus deterministic directional finite-difference checks.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from scipy.integrate import solve_ivp

ROOT = Path(__file__).resolve().parents[1]
VERSION = "v229-relativity-integrated-variational-stm-v12"
BODY_COUNT = 12
STATE_DIM = 72
PARAM_DIM = 66
JOINT_DIM = STATE_DIM * (PARAM_DIM + 1)


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


DOP = load_module("atlas_relativity_variational_v9", ROOT / "scripts/run-relativity-reference-v9.py")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def canonical_hash(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def normalized_state_from_row(row: dict, ids: list[str]) -> np.ndarray:
    source = {body["id"]: body for body in row["bodies"]}
    positions = np.asarray([source[body]["positionAu"] for body in ids], dtype=float)
    velocities = np.asarray([source[body]["velocityAuDay"] for body in ids], dtype=float)
    return np.concatenate((positions.reshape(-1), velocities.reshape(-1)))


def si_state(normalized: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    positions = normalized[:36].reshape(BODY_COUNT, 3) * DOP.AU_M
    velocities = normalized[36:].reshape(BODY_COUNT, 3) * DOP.AU_M / DOP.DAY_S
    return positions, velocities


def normalized_derivative(state: np.ndarray, masses: np.ndarray, mode: str) -> np.ndarray:
    positions, velocities = si_state(state)
    acceleration = DOP.acceleration(np.asarray(positions, dtype=float), np.asarray(velocities, dtype=float), masses, mode)
    return np.concatenate((state[36:], (acceleration * DOP.DAY_S**2 / DOP.AU_M).reshape(-1)))


def constrained_basis(masses: np.ndarray, position_step_m: float, velocity_step_ms: float) -> np.ndarray:
    basis = np.zeros((STATE_DIM, PARAM_DIM), dtype=float)
    column = 0
    for body in range(1, BODY_COUNT):
        mass_ratio = masses[body] / masses[0]
        for axis in range(3):
            scale = position_step_m / DOP.AU_M
            basis[3 * body + axis, column] = scale
            basis[axis, column] = -mass_ratio * scale
            column += 1
        for axis in range(3):
            scale = velocity_step_ms * DOP.DAY_S / DOP.AU_M
            basis[36 + 3 * body + axis, column] = scale
            basis[36 + axis, column] = -mass_ratio * scale
            column += 1
    if column != PARAM_DIM:
        raise RuntimeError("66-dimensional constrained basis construction failed")
    position_com = np.sum(basis[:36].reshape(BODY_COUNT, 3, PARAM_DIM) * masses[:, None, None], axis=0)
    momentum = np.sum(basis[36:].reshape(BODY_COUNT, 3, PARAM_DIM) * masses[:, None, None], axis=0)
    position_scale = np.max(np.sum(np.abs(basis[:36].reshape(BODY_COUNT, 3, PARAM_DIM) * masses[:, None, None]), axis=0))
    momentum_scale = np.max(np.sum(np.abs(basis[36:].reshape(BODY_COUNT, 3, PARAM_DIM) * masses[:, None, None]), axis=0))
    if (np.max(np.abs(position_com)) > max(1e-30, position_scale) * 1e-14 or
            np.max(np.abs(momentum)) > max(1e-30, momentum_scale) * 1e-14):
        raise RuntimeError("constrained basis violates COM or momentum conservation")
    return basis


def analytic_newton_jacobian(positions_au: np.ndarray, masses: np.ndarray) -> np.ndarray:
    jacobian = np.zeros((36, 36), dtype=float)
    mu = DOP.G * masses * DOP.DAY_S**2 / DOP.AU_M**3
    identity = np.eye(3)
    for body in range(BODY_COUNT):
        row = slice(3 * body, 3 * body + 3)
        for source in range(BODY_COUNT):
            if body == source:
                continue
            delta = positions_au[source] - positions_au[body]
            radius = float(np.linalg.norm(delta))
            tensor = mu[source] * (identity / radius**3 - 3.0 * np.outer(delta, delta) / radius**5)
            jacobian[row, 3 * source:3 * source + 3] += tensor
            jacobian[row, 3 * body:3 * body + 3] -= tensor
    return jacobian


def solar_j2_si(relative: np.ndarray) -> np.ndarray:
    radius = np.sqrt(np.sum(relative * relative))
    normal = relative / radius
    cosine = np.sum(normal * DOP.SPIN_AXIS)
    coefficient = 1.5 * DOP.J2_SUN * DOP.GM["sun"] * DOP.SUN_RADIUS_M**2
    return coefficient / radius**4 * ((5.0 * cosine**2 - 1.0) * normal - 2.0 * cosine * DOP.SPIN_AXIS)


def analytic_j2_jacobian(positions_au: np.ndarray) -> np.ndarray:
    jacobian = np.zeros((36, 36), dtype=float)
    identity = np.eye(3)
    coefficient = 1.5 * DOP.J2_SUN * DOP.GM["sun"] * DOP.SUN_RADIUS_M**2
    for body in range(1, BODY_COUNT):
        relative = (positions_au[body] - positions_au[0]) * DOP.AU_M
        radius = float(np.linalg.norm(relative))
        normal = relative / radius
        projection = identity - np.outer(normal, normal)
        cosine = float(np.dot(normal, DOP.SPIN_AXIS))
        grad_cosine = DOP.SPIN_AXIS @ projection / radius
        vector = (5.0 * cosine**2 - 1.0) * normal - 2.0 * cosine * DOP.SPIN_AXIS
        vector_jacobian = (
            np.outer(10.0 * cosine * normal - 2.0 * DOP.SPIN_AXIS, grad_cosine)
            + (5.0 * cosine**2 - 1.0) * projection / radius
        )
        derivative_si = coefficient * (
            np.outer(vector, -4.0 * normal / radius**5) + vector_jacobian / radius**4
        )
        derivative_normalized = derivative_si * DOP.DAY_S**2
        row = slice(3 * body, 3 * body + 3)
        jacobian[row, 3 * body:3 * body + 3] += derivative_normalized
        jacobian[row, 0:3] -= derivative_normalized
    return jacobian


def holo_radius(values: np.ndarray, axis: int) -> np.ndarray:
    return np.sqrt(np.sum(values * values, axis=axis))


def holomorphic_acceleration(positions: np.ndarray, velocities: np.ndarray, masses: np.ndarray, mode: str) -> np.ndarray:
    dtype = np.result_type(positions, velocities)
    delta = positions[None, :, :] - positions[:, None, :]
    radius = holo_radius(delta, axis=2).astype(dtype, copy=False)
    np.fill_diagonal(radius, 1.0)
    inverse_radius = 1.0 / radius
    np.fill_diagonal(inverse_radius, 0.0)
    unit = delta * inverse_radius[:, :, None]
    gm = DOP.G * masses[None, :]
    newton = np.sum(gm[:, :, None] * delta * inverse_radius[:, :, None] ** 3, axis=1)
    if mode == "newton":
        return newton
    potential = np.sum(gm * inverse_radius, axis=1)
    vi = velocities[:, None, :]
    vj = velocities[None, :, :]
    vi2 = np.sum(velocities * velocities, axis=1)[:, None]
    vj2 = np.sum(velocities * velocities, axis=1)[None, :]
    velocity_dot = np.sum(vi * vj, axis=2)
    n_ab = -unit
    radial_vj = np.sum(n_ab * vj, axis=2)
    acceleration_dot = np.sum(delta * newton[None, :, :], axis=2)
    bracket = (vi2 + 2.0 * vj2 - 4.0 * velocity_dot - 1.5 * radial_vj**2
               - 4.0 * potential[:, None] - potential[None, :] + 0.5 * acceleration_dot)
    inv_c2 = 1.0 / DOP.C**2
    scale = inv_c2 * gm * inverse_radius**2
    term_one = scale[:, :, None] * bracket[:, :, None] * unit
    scalar_n = np.sum(n_ab * (4.0 * vi - 3.0 * vj), axis=2)
    term_two = scale[:, :, None] * scalar_n[:, :, None] * (vi - vj)
    term_three = 3.5 * inv_c2 * (gm * inverse_radius)[:, :, None] * newton[None, :, :]
    result = newton + np.sum(term_one + term_two + term_three, axis=1)
    if mode == "full-eih-1pn-j2":
        for body in range(1, BODY_COUNT):
            result[body] += solar_j2_si(positions[body] - positions[0])
    elif mode in ("full-eih-1pn-2pn", "full-eih-1pn-2pn-lt"):
        relative = positions[1:] - positions[0]
        relative_velocity = velocities[1:] - velocities[0]
        radii = holo_radius(relative, axis=1)
        normals = relative / radii[:, None]
        radial_velocity = np.sum(relative_velocity * normals, axis=1)
        effect = DOP.GM["sun"]**2 * inv_c2**2 / radii[:, None]**3 * (
            (2.0 * radial_velocity[:, None]**2 - 9.0 * DOP.GM["sun"] / radii[:, None]) * normals
            - 2.0 * radial_velocity[:, None] * relative_velocity
        )
        if mode == "full-eih-1pn-2pn-lt":
            effect += 2.0 * DOP.G * DOP.SUN_SPIN * inv_c2 / radii[:, None]**3 * (
                3.0 * np.sum(normals * DOP.SPIN_AXIS, axis=1)[:, None] * np.cross(normals, relative_velocity)
                + np.cross(relative_velocity, np.broadcast_to(DOP.SPIN_AXIS, relative_velocity.shape))
            )
        denominator = masses[0] + masses[1:]
        result[1:] += effect * (masses[0] / denominator)[:, None]
        result[0] -= np.sum(effect * (masses[1:] / denominator)[:, None], axis=0)
    return result


def normalized_pn_remainder(state: np.ndarray, masses: np.ndarray, mode: str) -> np.ndarray:
    positions = state[:36].reshape(BODY_COUNT, 3) * DOP.AU_M
    velocities = state[36:].reshape(BODY_COUNT, 3) * DOP.AU_M / DOP.DAY_S
    total = holomorphic_acceleration(positions, velocities, masses, mode)
    newton = holomorphic_acceleration(positions, velocities, masses, "newton")
    remainder = total - newton
    if mode == "full-eih-1pn-j2":
        for body in range(1, BODY_COUNT):
            remainder[body] -= solar_j2_si(positions[body] - positions[0])
    return (remainder * DOP.DAY_S**2 / DOP.AU_M).reshape(-1)


def system_jacobian(state: np.ndarray, masses: np.ndarray, mode: str, complex_step: float) -> np.ndarray:
    matrix = np.zeros((STATE_DIM, STATE_DIM), dtype=float)
    matrix[:36, 36:] = np.eye(36)
    positions = state[:36].reshape(BODY_COUNT, 3)
    acceleration_position = analytic_newton_jacobian(positions, masses)
    if mode == "full-eih-1pn-j2":
        acceleration_position += analytic_j2_jacobian(positions)
    matrix[36:, :36] = acceleration_position
    if mode != "newton":
        for column in range(STATE_DIM):
            perturbed = np.asarray(state, dtype=complex)
            perturbed[column] += 1j * complex_step
            matrix[36:, column] += np.imag(normalized_pn_remainder(perturbed, masses, mode)) / complex_step
    return matrix


def observation_operator() -> np.ndarray:
    rows = []
    for body in range(1, BODY_COUNT):
        for axis in range(3):
            row = np.zeros(STATE_DIM)
            row[3 * body + axis] = DOP.AU_M / 1000.0
            row[axis] = -DOP.AU_M / 1000.0
            rows.append(row)
        for axis in range(3):
            row = np.zeros(STATE_DIM)
            row[36 + 3 * body + axis] = DOP.AU_M / DOP.DAY_S * 10.0
            row[36 + axis] = -DOP.AU_M / DOP.DAY_S * 10.0
            rows.append(row)
    return np.stack(rows)


OBSERVATION = observation_operator()


def weighted_residual(state: np.ndarray, reference: np.ndarray) -> np.ndarray:
    return OBSERVATION @ (state - reference)


def integrate_variational(initial: np.ndarray, basis: np.ndarray, masses: np.ndarray, mode: str, days: list[float], args):
    initial_joint = np.concatenate((initial, basis.reshape(-1)))
    counters = {"derivatives": 0, "jacobians": 0}

    def derivative(_, joint):
        state = joint[:STATE_DIM]
        phi = joint[STATE_DIM:].reshape(STATE_DIM, PARAM_DIM)
        dynamics = normalized_derivative(state, masses, mode)
        jacobian = system_jacobian(state, masses, mode, args.complex_step)
        counters["derivatives"] += 1
        counters["jacobians"] += 1
        return np.concatenate((dynamics, (jacobian @ phi).reshape(-1)))

    solution = solve_ivp(derivative, (0.0, days[-1]), initial_joint, method="DOP853", t_eval=days,
                         rtol=args.rtol, atol=args.atol, max_step=args.max_step_days)
    if not solution.success:
        raise RuntimeError(solution.message)
    states = [solution.y[:STATE_DIM, index].copy() for index in range(solution.y.shape[1])]
    phis = [solution.y[STATE_DIM:, index].reshape(STATE_DIM, PARAM_DIM).copy()
            for index in range(solution.y.shape[1])]
    return states, phis, int(solution.nfev), counters


def directional_validation(state: np.ndarray, masses: np.ndarray, mode: str, args) -> dict:
    jacobian = system_jacobian(state, masses, mode, args.complex_step)
    rng = np.random.default_rng(229)
    errors = []
    for _ in range(args.direction_checks):
        direction = rng.normal(size=STATE_DIM)
        direction /= np.linalg.norm(direction)
        step = args.direction_step
        numeric = (normalized_derivative(state + step * direction, masses, mode)
                   - normalized_derivative(state - step * direction, masses, mode)) / (2.0 * step)
        analytic = jacobian @ direction
        errors.append(float(np.linalg.norm(analytic - numeric) / max(1e-30, np.linalg.norm(numeric))))
    maximum = max(errors)
    return {"sampleCount": len(errors), "errors": errors, "maxRelativeError": maximum,
            "passed": maximum < args.direction_threshold}


def checkpoint_metrics(state: np.ndarray, reference: np.ndarray, day: float, solver: str) -> dict:
    position = (state[:36].reshape(BODY_COUNT, 3) - state[:3]) - (
        reference[:36].reshape(BODY_COUNT, 3) - reference[:3]
    )
    velocity = (state[36:].reshape(BODY_COUNT, 3) - state[36:39]) - (
        reference[36:].reshape(BODY_COUNT, 3) - reference[36:39]
    )
    position_km = position * DOP.AU_M / 1000.0
    velocity_ms = velocity * DOP.AU_M / DOP.DAY_S
    return {
        "offsetDays": day,
        "positionRmsKm": float(np.sqrt(np.mean(np.sum(position_km ** 2, axis=1)))),
        "velocityRmsMS": float(np.sqrt(np.mean(np.sum(velocity_ms ** 2, axis=1)))),
        "solver": solver,
        "perBody": [
            {
                "body": body,
                "positionResidualKm": float(np.linalg.norm(position_km[index])),
                "velocityResidualMS": float(np.linalg.norm(velocity_ms[index])),
            }
            for index, body in enumerate(DOP.IDS)
        ],
    }


def propagate_normalized(initial: np.ndarray, masses: np.ndarray, mode: str, days: list[float], args):
    si_initial = initial.copy()
    si_initial[:36] *= DOP.AU_M
    si_initial[36:] *= DOP.AU_M / DOP.DAY_S
    states, evaluations = DOP.integrate_mode(si_initial, masses, mode, days, args.rtol, args.atol, args.max_step_days)
    normalized = []
    for state in states:
        copy = state.copy()
        copy[:36] /= DOP.AU_M
        copy[36:] *= DOP.DAY_S / DOP.AU_M
        normalized.append(copy)
    return normalized, evaluations


def rebound_initial(initial: np.ndarray, ids: list[str]) -> dict:
    positions = initial[:36].reshape(BODY_COUNT, 3)
    velocities = initial[36:].reshape(BODY_COUNT, 3)
    return {
        "offsetDays": 0.0,
        "bodies": [
            {
                "id": body,
                "x_au": float(positions[index, 0]),
                "y_au": float(positions[index, 1]),
                "z_au": float(positions[index, 2]),
                "vx_au_d": float(velocities[index, 0]),
                "vy_au_d": float(velocities[index, 1]),
                "vz_au_d": float(velocities[index, 2]),
            }
            for index, body in enumerate(ids)
        ],
    }


def propagate_ias15(initial: np.ndarray, ids: list[str], mode: str, days: list[float], epsilon: float):
    rebound_runner = load_module("atlas_relativity_variational_rebound_v8", ROOT / "scripts/run-relativity-rebound-v8.py")
    mode_map = {
        "newton": "newton",
        "legacy-eih-1pn": "legacy-eih-1pn",
        "full-eih-1pn-2pn-lt": "eih-1pn-2pn-lt",
    }
    if mode not in mode_map:
        return [], None
    result = rebound_runner.run_mode(
        rebound_initial(initial, ids),
        ids,
        [{"offsetDays": day} for day in days],
        mode_map[mode],
        epsilon,
    )
    states = []
    for row in result["states"]:
        states.append(np.concatenate((np.asarray(row["positionsAu"]).reshape(-1),
                                      np.asarray(row["velocitiesAuDay"]).reshape(-1))))
    return states, canonical_hash(result)


def fit_mode(initial: np.ndarray, references: dict[float, np.ndarray], masses: np.ndarray, ids: list[str], mode: str, calibration_days: list[float], holdouts: list[float], finite_difference: dict, args) -> dict:
    basis = constrained_basis(masses, args.position_step_m, args.velocity_step_ms)
    adjusted = initial.copy()
    iteration_rows = []
    total_evaluations = 0
    total_counters = {"derivatives": 0, "jacobians": 0}
    design = None
    singular_values = None
    tolerance = None
    effective_rank = None
    unregularized = None
    regularized_matrix = None
    regularized_condition = None
    covariance = None
    for iteration in range(args.fit_iterations):
        states, phis, evaluations, counters = integrate_variational(
            adjusted, basis, masses, mode, calibration_days, args
        )
        total_evaluations += evaluations
        total_counters["derivatives"] += counters["derivatives"]
        total_counters["jacobians"] += counters["jacobians"]
        residual = np.concatenate([
            weighted_residual(state, references[day])
            for state, day in zip(states, calibration_days)
        ])
        design = np.vstack([OBSERVATION @ phi for phi in phis])
        singular_values = np.linalg.svd(design, compute_uv=False)
        tolerance = max(design.shape) * np.finfo(float).eps * singular_values[0]
        effective_rank = int(np.sum(singular_values > tolerance))
        unregularized = float(
            singular_values[0] / max(singular_values[-1], 1e-300)
        )
        regularized_matrix = (
            design.T @ design
            + args.regularization_lambda * np.eye(PARAM_DIM)
        )
        coefficients = np.linalg.solve(
            regularized_matrix,
            -design.T @ residual,
        )
        normalized_step = basis @ coefficients
        adjusted += normalized_step
        position_step_m = normalized_step[:36].reshape(BODY_COUNT, 3) * DOP.AU_M
        velocity_step_ms = (
            normalized_step[36:].reshape(BODY_COUNT, 3)
            * DOP.AU_M
            / DOP.DAY_S
        )
        regularized_singular = np.linalg.svd(
            np.vstack((
                design,
                math.sqrt(args.regularization_lambda) * np.eye(PARAM_DIM),
            )),
            compute_uv=False,
        )
        regularized_condition = float(
            regularized_singular[0] / regularized_singular[-1]
        )
        covariance = np.linalg.inv(regularized_matrix)
        iteration_rows.append({
            "iteration": iteration + 1,
            "weightedResidualRmsBeforeStep": float(
                np.sqrt(np.mean(residual * residual))
            ),
            "coefficientNorm": float(np.linalg.norm(coefficients)),
            "maxPositionStepM": float(
                np.max(np.linalg.norm(position_step_m, axis=1))
            ),
            "maxVelocityStepMS": float(
                np.max(np.linalg.norm(velocity_step_ms, axis=1))
            ),
            "effectiveRank": effective_rank,
            "unregularizedConditionNumber": unregularized,
            "regularizedConditionNumber": regularized_condition,
            "functionEvaluations": evaluations,
        })
    assert design is not None and singular_values is not None
    assert tolerance is not None and effective_rank is not None
    assert unregularized is not None and regularized_matrix is not None
    assert regularized_condition is not None and covariance is not None

    final_calibration_states, final_calibration_evaluations = propagate_normalized(
        adjusted, masses, mode, calibration_days, args
    )
    final_residuals = [
        weighted_residual(state, references[day])
        for state, day in zip(final_calibration_states, calibration_days)
    ]
    calibration_residuals = [
        {"offsetDays": day, "weightedRms": float(np.sqrt(np.mean(values * values)))}
        for day, values in zip(calibration_days, final_residuals)
    ]
    block_size = final_residuals[0].size
    leave_one_out = []
    for index, (day, values) in enumerate(zip(calibration_days, final_residuals)):
        start = index * block_size
        stop = start + block_size
        block_design = design[start:stop]
        block_hat = block_design @ covariance @ block_design.T
        press_residual = np.linalg.solve(
            np.eye(block_size) - block_hat,
            values,
        )
        leave_one_out.append({
            "offsetDays": day,
            "weightedRms": float(np.sqrt(np.mean(press_residual * press_residual))),
        })
    raw_states, _ = propagate_normalized(initial, masses, mode, holdouts, args)
    fitted_states, _ = propagate_normalized(adjusted, masses, mode, holdouts, args)
    raw = [checkpoint_metrics(state, references[day], day, "scipy-dop853") for state, day in zip(raw_states, holdouts)]
    fitted = [checkpoint_metrics(state, references[day], day, "scipy-dop853") for state, day in zip(fitted_states, holdouts)]
    ias_states = []
    ias_hash = None
    if not args.skip_ias15:
        ias_states, ias_hash = propagate_ias15(adjusted, ids, mode, holdouts, args.ias15_epsilon)
    ias_fitted = [checkpoint_metrics(state, references[day], day, "rebound-ias15")
                  for state, day in zip(ias_states, holdouts)]
    finite_rows = finite_difference.get(mode, {}).get("fitted", {}).get("checkpoints", [])
    finite_checkpoints = [{"offsetDays": row["offsetDays"], "positionRmsKm": row["positionRmsKm"],
                           "velocityRmsMS": row.get("velocityRmsMS"), "solver": "scipy-dop853"}
                          for row in finite_rows if row.get("offsetDays") in holdouts]
    validation = directional_validation(adjusted, masses, mode, args)
    raw_by_day = {row["offsetDays"]: row for row in raw}
    ten_year_regressions = []
    for row in fitted:
        if row["offsetDays"] != 3652.5:
            continue
        baseline = raw_by_day[row["offsetDays"]]
        ten_year_regressions.append({
            "solver": row["solver"],
            "positionRegression": row["positionRmsKm"] > baseline["positionRmsKm"],
            "velocityRegression": row["velocityRmsMS"] > baseline["velocityRmsMS"],
            "positionDeltaKm": row["positionRmsKm"] - baseline["positionRmsKm"],
            "velocityDeltaMS": row["velocityRmsMS"] - baseline["velocityRmsMS"],
        })
    ten_year_regression_detected = any(
        row["positionRegression"] or row["velocityRegression"]
        for row in ten_year_regressions
    )
    return {
        "version": VERSION,
        "mode": mode,
        "bodyCount": BODY_COUNT,
        "fullStateDimension": STATE_DIM,
        "independentParameterDimension": PARAM_DIM,
        "integratedStateAndPhiDimension": JOINT_DIM,
        "parameterBasis": "barycentric-com-and-momentum-constrained-66d",
        "calibrationWindowDays": [0, calibration_days[-1]],
        "propagation": {"primary": "scipy-dop853", "independentCheck": "rebound-ias15",
                        "stateAndPhiIntegratedTogether": True, "finiteDifferenceSensitivityKeptSeparate": True,
                        "ias15Available": len(ias_fitted) == len(holdouts), "ias15RunSha256": ias_hash},
        "jacobians": {"newtonAndJ2": "analytic", "velocityDependentPn": "complex-step",
                      "directionalValidationMaxRelativeError": validation["maxRelativeError"],
                      "directionalValidationPassed": validation["passed"], "directionalValidation": validation},
        "conditioning": {"unregularizedConditionNumber": unregularized, "effectiveRank": effective_rank,
                         "rankTolerance": float(tolerance), "singularValues": singular_values.tolist(),
                         "regularizationLambda": args.regularization_lambda,
                         "regularizedConditionNumber": regularized_condition,
                         "covarianceDiagonal": np.diag(covariance).tolist()},
        "nonlinearBatchFit": {
            "method": "deterministic-variational-gauss-newton",
            "requestedIterations": args.fit_iterations,
            "completedIterations": len(iteration_rows),
            "iterations": iteration_rows,
            "finalCalibrationFunctionEvaluations": final_calibration_evaluations,
        },
        "calibrationResiduals": calibration_residuals,
        "leaveOneDayOut": leave_one_out,
        "leaveOneDayOutMethod": "regularized-linearized-grouped-press",
        "comparisons": {"raw": raw, "finiteDifferenceFit": finite_checkpoints,
                        "variationalSTMFit": fitted, "ias15VariationalFit": ias_fitted},
        "integration": {
            "functionEvaluations": total_evaluations,
            **total_counters,
        },
        "provenanceReady": True,
        "deterministicRerunPassed": False,
        "rankDeficient": effective_rank != PARAM_DIM,
        "tenYearRegressionDetected": ten_year_regression_detected,
        "tenYearRegressionDetails": ten_year_regressions,
        "rawPropagationReplaced": False,
        "promotionDecision": "shadow-retained",
        "boundary": "offline-integrated-variational-stm-no-runtime-promotion",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v229 integrated variational STM")
    parser.add_argument("--bundle", default="dist/science/relativity-reference-bundle-v10.json")
    parser.add_argument("--finite-difference", default="dist/science/relativity-stm-fit-v10.json")
    parser.add_argument("--output", default="dist/science/relativity-variational-stm-v12.json")
    default_modes = ["legacy-eih-1pn", "full-eih-1pn-2pn-lt"]
    parser.add_argument("--modes", nargs="+", choices=("newton", "legacy-eih-1pn", "full-eih-1pn-j2", "full-eih-1pn-2pn-lt"),
                        default=default_modes)
    parser.add_argument("--calibration-days", type=int, default=30)
    parser.add_argument("--profile", choices=("release", "gate", "smoke"), default="release")
    parser.add_argument("--smoke", action="store_true")
    parser.add_argument("--jacobian-only", action="store_true")
    parser.add_argument("--jacobian-output")
    parser.add_argument("--skip-ias15", action="store_true")
    parser.add_argument("--ias15-epsilon", type=float, default=3e-12)
    parser.add_argument("--rtol", type=float, default=1e-10)
    parser.add_argument("--atol", type=float, default=1e-12)
    parser.add_argument("--max-step-days", type=float, default=0.5)
    parser.add_argument("--complex-step", type=float, default=1e-20)
    parser.add_argument("--direction-step", type=float, default=1e-7)
    parser.add_argument("--direction-checks", type=int, default=4)
    parser.add_argument("--direction-threshold", type=float, default=5e-5)
    parser.add_argument("--position-step-m", type=float, default=1000.0)
    parser.add_argument("--velocity-step-ms", type=float, default=1e-3)
    parser.add_argument("--regularization-lambda", type=float, default=1.0)
    parser.add_argument("--fit-iterations", type=int, default=3)
    args = parser.parse_args()
    if args.smoke and args.profile not in ("release", "smoke"):
        raise SystemExit("--smoke cannot be combined with --profile gate")
    if args.smoke:
        args.profile = "smoke"
    if args.profile == "smoke":
        args.calibration_days = min(args.calibration_days, 2)
        args.fit_iterations = 1
        if args.modes == default_modes:
            args.modes = ["newton"]
    elif args.profile == "gate":
        args.calibration_days = 30
        args.fit_iterations = 1
    bundle_path = (ROOT / args.bundle).resolve()
    finite_path = (ROOT / args.finite_difference).resolve()
    bundle = json.loads(bundle_path.read_text(encoding="utf-8"))
    finite_document = json.loads(finite_path.read_text(encoding="utf-8")) if finite_path.exists() else {"reports": []}
    if bundle.get("coordinateFrame") != "ICRF-J2000-barycentric" or bundle.get("timeScale") != "TDB" or not bundle.get("provenanceReady"):
        raise SystemExit("V12 requires the provenance-ready ICRF/J2000 barycentric TDB bundle")
    ids = list(DOP.IDS)
    rows = [row for row in bundle["epochs"] if row.get("source") == "horizons-frozen"]
    by_day = {float(row["offsetDays"]): row for row in rows}
    calibration_days = [float(day) for day in range(1, args.calibration_days + 1)]
    holdouts = [365.0] if args.profile in ("smoke", "gate") else [365.0, 3652.5]
    required = {0.0, *calibration_days, *holdouts}
    if not required.issubset(by_day):
        raise SystemExit("reference bundle lacks required calibration or blind holdout epochs")
    initial = normalized_state_from_row(by_day[0.0], ids)
    references = {day: normalized_state_from_row(by_day[day], ids) for day in required}
    masses = np.asarray([DOP.GM[body] / DOP.G for body in ids], dtype=float)
    if args.jacobian_only:
        rows = []
        for mode in args.modes:
            validation = directional_validation(initial, masses, mode, args)
            rows.append({"mode": mode, **validation})
        stable = {
            "version": VERSION,
            "profile": f"{args.profile}-jacobian-only",
            "bundleSha256": sha256(bundle_path),
            "fullStateDimension": STATE_DIM,
            "independentParameterDimension": PARAM_DIM,
            "integratedStateAndPhiDimension": JOINT_DIM,
            "complexStep": args.complex_step,
            "directionStep": args.direction_step,
            "directionThreshold": args.direction_threshold,
            "rows": rows,
            "boundary": "offline-jacobian-direction-validation-no-runtime-promotion",
        }
        document = {**stable, "canonicalEvidenceSha256": canonical_hash(stable)}
        if args.jacobian_output:
            jacobian_output = (ROOT / args.jacobian_output).resolve()
            jacobian_output.parent.mkdir(parents=True, exist_ok=True)
            jacobian_output.write_text(
                json.dumps(document, indent=2, allow_nan=False) + "\n",
                encoding="utf-8",
            )
        print(json.dumps(document, indent=2))
        return
    finite = {row["mode"]: row for row in finite_document.get("reports", [])}
    reports = [fit_mode(initial, references, masses, ids, mode, calibration_days, holdouts, finite, args)
               for mode in args.modes]
    stable = {"version": VERSION, "bundleSha256": sha256(bundle_path),
              "finiteDifferenceSha256": sha256(finite_path) if finite_path.exists() else None,
              "profile": args.profile, "reports": reports,
              "defaultScientificKernel": "legacy-eih-1pn", "liveStateMutated": False,
              "promotionDecision": "shadow-retained",
              "boundary": "offline-integrated-variational-stm-no-runtime-promotion"}
    document = {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable,
                "canonicalEvidenceSha256": canonical_hash(stable)}
    output = (ROOT / args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(document, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "profile": stable["profile"], "modeCount": len(reports),
                      "jointDimension": JOINT_DIM,
                      "reports": [{"mode": row["mode"], "effectiveRank": row["conditioning"]["effectiveRank"],
                                   "directionalValidationMaxRelativeError": row["jacobians"]["directionalValidationMaxRelativeError"],
                                   "promotionDecision": row["promotionDecision"]} for row in reports]}, indent=2))


if __name__ == "__main__":
    main()
