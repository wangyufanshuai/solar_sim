from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path

import numpy as np
from scipy.integrate import solve_ivp

_v4_path = Path(__file__).with_name("run-relativity-dop853-v4.py")
_spec = importlib.util.spec_from_file_location("atlas_relativity_dop853_v4", _v4_path)
if _spec is None or _spec.loader is None:
    raise RuntimeError(f"Unable to load {_v4_path}")
_v4 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_v4)

AU, DAY, G, C, GM = _v4.AU, _v4.DAY, _v4.G, _v4.C, _v4.GM
SOLAR_SPIN, SPIN_AXIS = _v4.SOLAR_SPIN, _v4.SPIN_AXIS
MODES = ("newton", "legacy-eih-1pn", "legacy-plus-2pn-only", "legacy-plus-lense-thirring-only", "eih-1pn-2pn-lt")
EFFECT_MODES = {
    "solar-2pn": "legacy-plus-2pn-only",
    "lense-thirring": "legacy-plus-lense-thirring-only",
}
# Frozen fixture values are serialized decimal state vectors.  These floors
# conservatively cover sub-millimetre position and nanometre/second velocity
# quantization instead of treating identical adaptive solutions as exact.
POSITION_FLOOR_KM = 1e-6
VELOCITY_FLOOR_MS = 1e-9


def effect_delta(pos: np.ndarray, vel: np.ndarray, mass: np.ndarray, include_2pn: bool, include_lt: bool) -> np.ndarray:
    count = len(mass)
    out = np.zeros_like(pos)
    inv_c2 = 1 / C**2
    inv_c4 = inv_c2**2
    mu = GM["sun"]
    lt_numerator = 2 * G * SOLAR_SPIN * inv_c2
    for body in range(1, count):
        r_vec = pos[body] - pos[0]
        v_vec = vel[body] - vel[0]
        radius = np.linalg.norm(r_vec)
        if not radius:
            continue
        n = r_vec / radius
        radial_velocity = float(np.dot(v_vec, n))
        delta = np.zeros(3)
        if include_2pn:
            scalar = 2 * radial_velocity**2 - 9 * mu / radius
            delta += mu**2 * inv_c4 / radius**3 * (scalar * n - 2 * radial_velocity * v_vec)
        if include_lt:
            spin_dot_n = float(np.dot(SPIN_AXIS, n))
            delta += lt_numerator / radius**3 * (3 * spin_dot_n * np.cross(n, v_vec) + np.cross(v_vec, SPIN_AXIS))
        denominator = mass[0] + mass[body]
        out[body] += delta * mass[0] / denominator
        out[0] -= delta * mass[body] / denominator
    return out


def legacy_acceleration(pos: np.ndarray, vel: np.ndarray, mass: np.ndarray, include_1pn: bool) -> np.ndarray:
    count = len(mass)
    delta = pos[np.newaxis, :, :] - pos[:, np.newaxis, :]
    radius = np.linalg.norm(delta, axis=2)
    radius[np.diag_indices(count)] = np.inf
    gm = G * mass[np.newaxis, :]
    unit = delta / radius[:, :, np.newaxis]
    newton = np.sum(gm[:, :, np.newaxis] * delta / radius[:, :, np.newaxis] ** 3, axis=1)
    if not include_1pn:
        return newton
    phi = np.sum(gm / radius, axis=1)
    vi = vel[:, np.newaxis, :]
    vj = vel[np.newaxis, :, :]
    vi2 = np.sum(vel * vel, axis=1)[:, np.newaxis]
    vj2 = np.sum(vel * vel, axis=1)[np.newaxis, :]
    velocity_dot = np.sum(vi * vj, axis=2)
    n_ab = -unit
    radial_vj = np.sum(n_ab * vj, axis=2)
    acceleration_dot = np.sum(delta * newton[np.newaxis, :, :], axis=2)
    bracket = vi2 + 2 * vj2 - 4 * velocity_dot - 1.5 * radial_vj**2 - 4 * phi[:, np.newaxis] - phi[np.newaxis, :] + 0.5 * acceleration_dot
    scale = (1 / C**2) * gm / radius**2
    term_one = scale[:, :, np.newaxis] * bracket[:, :, np.newaxis] * unit
    scalar_n = np.sum(n_ab * (4 * vi - 3 * vj), axis=2)
    term_two = scale[:, :, np.newaxis] * scalar_n[:, :, np.newaxis] * (vi - vj)
    term_three = 3.5 * (1 / C**2) * (gm / radius)[:, :, np.newaxis] * newton[np.newaxis, :, :]
    return newton + np.sum(term_one + term_two + term_three, axis=1)


def acceleration(pos: np.ndarray, vel: np.ndarray, mass: np.ndarray, mode: str) -> np.ndarray:
    if mode == "newton":
        return legacy_acceleration(pos, vel, mass, False)
    if mode == "legacy-eih-1pn":
        return legacy_acceleration(pos, vel, mass, True)
    if mode == "legacy-plus-2pn-only":
        return legacy_acceleration(pos, vel, mass, True) + effect_delta(pos, vel, mass, True, False)
    if mode == "legacy-plus-lense-thirring-only":
        return legacy_acceleration(pos, vel, mass, True) + effect_delta(pos, vel, mass, False, True)
    if mode == "eih-1pn-2pn-lt":
        return legacy_acceleration(pos, vel, mass, True) + effect_delta(pos, vel, mass, True, True)
    raise ValueError(f"unknown mode: {mode}")


def body_residual(state: np.ndarray, ids: list[str], checkpoint: dict) -> dict[str, dict[str, float]]:
    count = len(ids)
    pos = state[:3 * count].reshape(count, 3)
    vel = state[3 * count:].reshape(count, 3)
    refs = {body["id"]: body for body in checkpoint["bodies"]}
    result: dict[str, dict[str, float]] = {}
    for index, body_id in enumerate(ids):
        reference = refs.get(body_id)
        if reference is None:
            continue
        measured_pos = (pos[index] - pos[0]) / AU
        measured_vel = (vel[index] - vel[0]) * DAY / AU
        reference_pos = np.array([reference["x_au"], reference["y_au"], reference["z_au"]])
        reference_vel = np.array([reference["vx_au_d"], reference["vy_au_d"], reference["vz_au_d"]])
        result[body_id] = {
            "positionResidualKm": float(np.linalg.norm(measured_pos - reference_pos) * AU / 1000),
            "velocityResidualMS": float(np.linalg.norm(measured_vel - reference_vel) * AU / DAY),
        }
    return result


def integrate_series(initial: np.ndarray, ids: list[str], mass: np.ndarray, checkpoints: list[dict], mode: str, max_step_days: float, rtol: float, atol: float) -> tuple[list[np.ndarray], int]:
    count = len(ids)
    times = np.array([checkpoint["offsetDays"] * DAY for checkpoint in checkpoints])

    def derivative(_, state):
        pos = state[:3 * count].reshape(count, 3)
        vel = state[3 * count:].reshape(count, 3)
        return np.concatenate((vel.reshape(-1), acceleration(pos, vel, mass, mode).reshape(-1)))

    solution = solve_ivp(derivative, (0, float(times[-1])), initial, method="DOP853", t_eval=times, rtol=rtol, atol=atol, max_step=max_step_days * DAY)
    if not solution.success:
        raise RuntimeError(solution.message)
    return [solution.y[:, index].copy() for index in range(solution.y.shape[1])], int(solution.nfev)


def rms(values: list[float]) -> float:
    return float(math.sqrt(np.mean(np.square(values)))) if values else float("nan")


def main() -> None:
    parser = argparse.ArgumentParser(description="Independent per-body DOP853 V2 promotion evidence.")
    parser.add_argument("--fixture", default="public/data/horizons-validation-j2000-outer-system-barycenter-v84.json")
    parser.add_argument("--output", default="dist/science/relativity-dop853-v7-report.json")
    parser.add_argument("--max-days", type=float, default=3652.5)
    parser.add_argument("--max-step-days", type=float, default=32.0)
    parser.add_argument("--rtol", type=float, default=1e-11)
    parser.add_argument("--atol", type=float, default=1e-5)
    args = parser.parse_args()
    fixture_path = Path(args.fixture).resolve()
    dataset = json.loads(fixture_path.read_text(encoding="utf-8"))
    initial_checkpoint = dataset["checkpoints"][0]
    checkpoints = [checkpoint for checkpoint in dataset["checkpoints"][1:] if checkpoint["offsetDays"] <= args.max_days]
    if not checkpoints or checkpoints[-1]["offsetDays"] < 3652:
        raise SystemExit("V7 requires a ten-year checkpoint")
    ids = [body["id"] for body in initial_checkpoint["bodies"]]
    mass = np.array([GM[body_id] / G for body_id in ids])
    pos = np.array([[body["x_au"], body["y_au"], body["z_au"]] for body in initial_checkpoint["bodies"]]) * AU
    vel = np.array([[body["vx_au_d"], body["vy_au_d"], body["vz_au_d"]] for body in initial_checkpoint["bodies"]]) * AU / DAY
    initial = np.concatenate((pos.reshape(-1), vel.reshape(-1)))

    reference_newton = _v4.acceleration(pos, vel, mass, "newton")
    reference_legacy = _v4.acceleration(pos, vel, mass, "legacy-eih-1pn")
    if not np.allclose(legacy_acceleration(pos, vel, mass, False), reference_newton, rtol=1e-13, atol=1e-18):
        raise RuntimeError("Vectorized Newton reference does not match the frozen V4 formula")
    if not np.allclose(legacy_acceleration(pos, vel, mass, True), reference_legacy, rtol=1e-13, atol=1e-18):
        raise RuntimeError("Vectorized EIH 1PN reference does not match the frozen V4 formula")

    series: dict[str, list[np.ndarray]] = {}
    evaluations: dict[str, int] = {}
    fine_series: dict[str, list[np.ndarray]] = {}
    for mode in MODES:
        series[mode], evaluations[mode] = integrate_series(initial, ids, mass, checkpoints, mode, args.max_step_days, args.rtol, args.atol)
        if mode != "newton":
            fine_series[mode], fine_nfev = integrate_series(initial, ids, mass, checkpoints, mode, args.max_step_days / 2, args.rtol, args.atol)
            evaluations[f"{mode}:fine"] = fine_nfev

    legacy_body = [body_residual(state, ids, checkpoint) for state, checkpoint in zip(series["legacy-eih-1pn"], checkpoints)]
    candidate_body = [body_residual(state, ids, checkpoint) for state, checkpoint in zip(series["eih-1pn-2pn-lt"], checkpoints)]
    candidate_fine_body = [body_residual(state, ids, checkpoint) for state, checkpoint in zip(fine_series["eih-1pn-2pn-lt"], checkpoints)]
    per_body = []
    for index, checkpoint in enumerate(checkpoints):
        bodies = []
        for body_id in ids:
            legacy = legacy_body[index].get(body_id)
            candidate = candidate_body[index].get(body_id)
            fine = candidate_fine_body[index].get(body_id)
            if not legacy or not candidate or not fine:
                continue
            position_uncertainty = max(POSITION_FLOOR_KM, 5 * abs(candidate["positionResidualKm"] - fine["positionResidualKm"]))
            velocity_uncertainty = max(VELOCITY_FLOOR_MS, 5 * abs(candidate["velocityResidualMS"] - fine["velocityResidualMS"]))
            position_delta = candidate["positionResidualKm"] - legacy["positionResidualKm"]
            velocity_delta = candidate["velocityResidualMS"] - legacy["velocityResidualMS"]
            bodies.append({
                "bodyId": body_id,
                "legacyPositionResidualKm": legacy["positionResidualKm"], "candidatePositionResidualKm": candidate["positionResidualKm"],
                "positionDeltaKm": position_delta, "positionUncertaintyKm": position_uncertainty,
                "legacyVelocityResidualMS": legacy["velocityResidualMS"], "candidateVelocityResidualMS": candidate["velocityResidualMS"],
                "velocityDeltaMS": velocity_delta, "velocityUncertaintyMS": velocity_uncertainty,
                "noRegression": position_delta <= position_uncertainty and velocity_delta <= velocity_uncertainty,
            })
        per_body.append({"label": checkpoint["label"], "offsetDays": checkpoint["offsetDays"], "bodies": bodies})

    effects = []
    effect_complete = True
    for effect_id, mode in EFFECT_MODES.items():
        effect_checkpoints = []
        for index, checkpoint in enumerate(checkpoints):
            legacy_state = series["legacy-eih-1pn"][index]
            effect_state = series[mode][index]
            fine_legacy = fine_series["legacy-eih-1pn"][index]
            fine_effect = fine_series[mode][index]
            count = len(ids)
            legacy_pos = legacy_state[:3 * count].reshape(count, 3); effect_pos = effect_state[:3 * count].reshape(count, 3)
            legacy_vel = legacy_state[3 * count:].reshape(count, 3); effect_vel = effect_state[3 * count:].reshape(count, 3)
            fine_legacy_pos = fine_legacy[:3 * count].reshape(count, 3); fine_effect_pos = fine_effect[:3 * count].reshape(count, 3)
            fine_legacy_vel = fine_legacy[3 * count:].reshape(count, 3); fine_effect_vel = fine_effect[3 * count:].reshape(count, 3)
            bodies = []
            for body_index, body_id in enumerate(ids):
                position_effect = float(np.linalg.norm((effect_pos[body_index] - effect_pos[0]) - (legacy_pos[body_index] - legacy_pos[0])) * AU / 1000)
                velocity_effect = float(np.linalg.norm((effect_vel[body_index] - effect_vel[0]) - (legacy_vel[body_index] - legacy_vel[0])) * AU / DAY)
                fine_position_effect = float(np.linalg.norm((fine_effect_pos[body_index] - fine_effect_pos[0]) - (fine_legacy_pos[body_index] - fine_legacy_pos[0])) * AU / 1000)
                fine_velocity_effect = float(np.linalg.norm((fine_effect_vel[body_index] - fine_effect_vel[0]) - (fine_legacy_vel[body_index] - fine_legacy_vel[0])) * AU / DAY)
                position_uncertainty = max(POSITION_FLOOR_KM, 5 * abs(position_effect - fine_position_effect))
                velocity_uncertainty = max(VELOCITY_FLOOR_MS, 5 * abs(velocity_effect - fine_velocity_effect))
                position_snr = position_effect / position_uncertainty
                velocity_snr = velocity_effect / velocity_uncertainty
                # The central body is the origin of the relative frame, so its
                # relative effect is identically zero rather than unresolved.
                resolved = body_id == ids[0] or position_snr >= 5 or velocity_snr >= 5
                effect_complete = effect_complete and resolved
                bodies.append({"bodyId": body_id, "positionEffectKm": position_effect, "velocityEffectMS": velocity_effect, "positionUncertaintyKm": position_uncertainty, "velocityUncertaintyMS": velocity_uncertainty, "positionSnr": position_snr, "velocitySnr": velocity_snr, "resolved": resolved})
            effect_checkpoints.append({"label": checkpoint["label"], "offsetDays": checkpoint["offsetDays"], "bodies": bodies})
        effects.append({"effectId": effect_id, "mode": mode, "checkpoints": effect_checkpoints})

    legacy_last = legacy_body[-1].values(); candidate_last = candidate_body[-1].values(); fine_last = candidate_fine_body[-1].values()
    legacy_position = rms([value["positionResidualKm"] for value in legacy_last]); legacy_velocity = rms([value["velocityResidualMS"] for value in legacy_body[-1].values()])
    candidate_position = rms([value["positionResidualKm"] for value in candidate_last]); candidate_velocity = rms([value["velocityResidualMS"] for value in candidate_last])
    candidate_position_uncertainty = max(POSITION_FLOOR_KM, 5 * abs(candidate_position - rms([value["positionResidualKm"] for value in fine_last])))
    candidate_velocity_uncertainty = max(VELOCITY_FLOOR_MS, 5 * abs(candidate_velocity - rms([value["velocityResidualMS"] for value in candidate_fine_body[-1].values()])))
    aggregate_improvement = candidate_position < legacy_position - candidate_position_uncertainty and candidate_velocity < legacy_velocity - candidate_velocity_uncertainty
    per_body_no_regression = all(body["noRegression"] for checkpoint in per_body for body in checkpoint["bodies"])
    absolute_gate = candidate_position < 10_000 and candidate_velocity < 1
    promotion_qualified = absolute_gate and aggregate_improvement and per_body_no_regression and effect_complete
    report = {
        "version": "v188-scipy-dop853-per-body-effect-isolation-v7", "generatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "fixture": str(fixture_path), "fixtureSha256": hashlib.sha256(fixture_path.read_bytes()).hexdigest(),
        "coordinateFrame": "DE440-sun-centered-J2000-ecliptic", "timeScale": "TDB", "durationDays": args.max_days,
        "solver": {"name": "scipy.integrate.solve_ivp", "method": "DOP853", "scipyVersion": __import__("scipy").__version__, "rtol": args.rtol, "atol": args.atol, "maxStepDays": args.max_step_days, "fineMaxStepDays": args.max_step_days / 2},
        "uncertaintyPolicy": {"formula": "max(5*abs(coarse-fine),fixture-serialization-floor)", "positionFloorKm": POSITION_FLOOR_KM, "velocityFloorMS": VELOCITY_FLOOR_MS, "effectSnrMinimum": 5},
        "modes": [{"mode": mode, "functionEvaluations": evaluations[mode]} for mode in MODES],
        "perBodyComparison": per_body, "effectIsolation": effects,
        "promotionEvaluation": {"absoluteErrorGatePassed": absolute_gate, "aggregateImprovementBeyondUncertainty": aggregate_improvement, "perBodyNoRegression": per_body_no_regression, "effectIsolationComplete": effect_complete, "promotionQualified": promotion_qualified, "legacyTenYear": {"positionRmsKm": legacy_position, "velocityRmsMS": legacy_velocity}, "candidateTenYear": {"positionRmsKm": candidate_position, "velocityRmsMS": candidate_velocity}, "candidateUncertainty": {"positionRmsKm": candidate_position_uncertainty, "velocityRmsMS": candidate_velocity_uncertainty}},
        "liveStateMutated": False, "workerStateMutated": False, "defaultKernel": "legacy-eih-1pn", "shadowKernel": "eih-1pn-2pn-lt",
        "boundary": "checksummed-offline-research-evidence-no-runtime-promotion",
    }
    output = Path(args.output).resolve(); output.parent.mkdir(parents=True, exist_ok=True); output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"version": report["version"], "output": str(output), "promotionQualified": promotion_qualified, "legacyTenYear": report["promotionEvaluation"]["legacyTenYear"], "candidateTenYear": report["promotionEvaluation"]["candidateTenYear"], "effectIsolationComplete": effect_complete}, indent=2))


if __name__ == "__main__":
    main()
