from __future__ import annotations

import argparse
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

import rebound

AU = 149_597_870_700.0
DAY = 86_400.0
G_SI = 6.67430e-11
C = 299_792_458.0
GM = {
    "sun": 1.3271244004127942e20,
    "mercury": 2.2031868551400003e13,
    "venus": 3.24858592079e14,
    "earth": 3.98600435436e14,
    "moon": 4.902800066e12,
    "mars": 4.2828375214e13,
    "jupiter": 1.267127648e17,
    "saturn": 3.79405852e16,
    "uranus": 5.7945486e15,
    "neptune": 6.836527100580397e15,
    "pluto": 8.696138177608748e11,
    "ceres": 6.26325e10,
}
SOLAR_SPIN = 1.92e41
RA = math.radians(286.13)
DEC = math.radians(63.87)
SPIN_AXIS = (
    math.cos(DEC) * math.cos(RA),
    math.cos(DEC) * math.sin(RA),
    math.sin(DEC),
)
MODES = (
    "newton",
    "legacy-eih-1pn",
    "legacy-plus-2pn-only",
    "legacy-plus-lense-thirring-only",
    "eih-1pn-2pn-lt",
)
EPSILONS = (1e-11, 3e-12)
POSITION_FLOOR_KM = 1e-6
VELOCITY_FLOOR_MS = 1e-9

Vector = tuple[float, float, float]


def add(a: Vector, b: Vector) -> Vector:
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def sub(a: Vector, b: Vector) -> Vector:
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def mul(a: Vector, scale: float) -> Vector:
    return (a[0] * scale, a[1] * scale, a[2] * scale)


def dot(a: Vector, b: Vector) -> float:
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def cross(a: Vector, b: Vector) -> Vector:
    return (
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )


def norm(a: Vector) -> float:
    return math.sqrt(dot(a, a))


def particle_state_si(simulation: rebound.Simulation) -> tuple[list[Vector], list[Vector]]:
    positions: list[Vector] = []
    velocities: list[Vector] = []
    for particle in simulation.particles:
        positions.append((particle.x * AU, particle.y * AU, particle.z * AU))
        velocities.append(
            (particle.vx * AU / DAY, particle.vy * AU / DAY, particle.vz * AU / DAY)
        )
    return positions, velocities


def scalar_newton(positions: list[Vector], masses_kg: list[float]) -> tuple[list[Vector], list[float]]:
    count = len(masses_kg)
    accelerations: list[Vector] = [(0.0, 0.0, 0.0) for _ in range(count)]
    potentials = [0.0 for _ in range(count)]
    for i in range(count):
        for j in range(count):
            if i == j:
                continue
            delta = sub(positions[j], positions[i])
            radius = norm(delta)
            gm = G_SI * masses_kg[j]
            potentials[i] += gm / radius
            accelerations[i] = add(accelerations[i], mul(delta, gm / radius**3))
    return accelerations, potentials


def scalar_eih_one_pn_delta(
    positions: list[Vector], velocities: list[Vector], masses_kg: list[float]
) -> list[Vector]:
    """Independent scalar EIH 1PN correction; Newtonian gravity is owned by REBOUND."""
    count = len(masses_kg)
    newton, potentials = scalar_newton(positions, masses_kg)
    correction: list[Vector] = [(0.0, 0.0, 0.0) for _ in range(count)]
    inv_c2 = 1.0 / C**2
    for i in range(count):
        vi = velocities[i]
        vi2 = dot(vi, vi)
        for j in range(count):
            if i == j:
                continue
            delta = sub(positions[j], positions[i])
            radius = norm(delta)
            n_ba = mul(delta, 1.0 / radius)
            n_ab = mul(n_ba, -1.0)
            vj = velocities[j]
            bracket = (
                vi2
                + 2.0 * dot(vj, vj)
                - 4.0 * dot(vi, vj)
                - 1.5 * dot(n_ab, vj) ** 2
                - 4.0 * potentials[i]
                - potentials[j]
                + 0.5 * dot(delta, newton[j])
            )
            gm = G_SI * masses_kg[j]
            scale = inv_c2 * gm / radius**2
            term = mul(n_ba, scale * bracket)
            scalar_n = dot(n_ab, sub(mul(vi, 4.0), mul(vj, 3.0)))
            term = add(term, mul(sub(vi, vj), scale * scalar_n))
            term = add(term, mul(newton[j], 3.5 * inv_c2 * gm / radius))
            correction[i] = add(correction[i], term)
    return correction


def scalar_solar_effect_delta(
    positions: list[Vector], velocities: list[Vector], masses_kg: list[float],
    include_2pn: bool, include_lt: bool,
) -> list[Vector]:
    count = len(masses_kg)
    out: list[Vector] = [(0.0, 0.0, 0.0) for _ in range(count)]
    inv_c2 = 1.0 / C**2
    mu = GM["sun"]
    for body in range(1, count):
        r_vec = sub(positions[body], positions[0])
        v_vec = sub(velocities[body], velocities[0])
        radius = norm(r_vec)
        if radius == 0.0:
            continue
        n = mul(r_vec, 1.0 / radius)
        radial_velocity = dot(v_vec, n)
        delta = (0.0, 0.0, 0.0)
        if include_2pn:
            scalar = 2.0 * radial_velocity**2 - 9.0 * mu / radius
            term = sub(mul(n, scalar), mul(v_vec, 2.0 * radial_velocity))
            delta = add(delta, mul(term, mu**2 * inv_c2**2 / radius**3))
        if include_lt:
            spin_dot_n = dot(SPIN_AXIS, n)
            term = add(
                mul(cross(n, v_vec), 3.0 * spin_dot_n),
                cross(v_vec, SPIN_AXIS),
            )
            delta = add(delta, mul(term, 2.0 * G_SI * SOLAR_SPIN * inv_c2 / radius**3))
        denominator = masses_kg[0] + masses_kg[body]
        out[body] = add(out[body], mul(delta, masses_kg[0] / denominator))
        out[0] = sub(out[0], mul(delta, masses_kg[body] / denominator))
    return out


def make_additional_forces(
    mode: str, masses_kg: list[float], evaluations: list[int]
) -> Callable:
    include_1pn = mode != "newton"
    include_2pn = mode in ("legacy-plus-2pn-only", "eih-1pn-2pn-lt")
    include_lt = mode in ("legacy-plus-lense-thirring-only", "eih-1pn-2pn-lt")

    def additional_forces(pointer) -> None:
        simulation = pointer.contents
        positions, velocities = particle_state_si(simulation)
        correction = [(0.0, 0.0, 0.0) for _ in masses_kg]
        if include_1pn:
            correction = scalar_eih_one_pn_delta(positions, velocities, masses_kg)
        if include_2pn or include_lt:
            effects = scalar_solar_effect_delta(
                positions, velocities, masses_kg, include_2pn, include_lt
            )
            correction = [add(one_pn, effect) for one_pn, effect in zip(correction, effects)]
        scale = DAY**2 / AU
        for particle, acceleration in zip(simulation.particles, correction):
            particle.ax += acceleration[0] * scale
            particle.ay += acceleration[1] * scale
            particle.az += acceleration[2] * scale
        evaluations[0] += 1

    return additional_forces


def create_simulation(initial: dict, ids: list[str], mode: str, epsilon: float):
    simulation = rebound.Simulation()
    simulation.G = GM["sun"] * DAY**2 / AU**3
    masses_kg = [GM[body_id] / G_SI for body_id in ids]
    bodies = {body["id"]: body for body in initial["bodies"]}
    for body_id in ids:
        body = bodies[body_id]
        simulation.add(
            m=GM[body_id] / GM["sun"],
            x=body["x_au"], y=body["y_au"], z=body["z_au"],
            vx=body["vx_au_d"], vy=body["vy_au_d"], vz=body["vz_au_d"],
        )
    simulation.integrator = "ias15"
    simulation.ri_ias15.epsilon = epsilon
    evaluations = [0]
    if mode != "newton":
        simulation.force_is_velocity_dependent = 1
        simulation.additional_forces = make_additional_forces(mode, masses_kg, evaluations)
    return simulation, evaluations


def snapshot(simulation: rebound.Simulation) -> dict[str, list[list[float]]]:
    return {
        "positionsAu": [[p.x, p.y, p.z] for p in simulation.particles],
        "velocitiesAuDay": [[p.vx, p.vy, p.vz] for p in simulation.particles],
    }


def run_mode(initial: dict, ids: list[str], checkpoints: list[dict], mode: str, epsilon: float):
    simulation, evaluations = create_simulation(initial, ids, mode, epsilon)
    states = []
    for checkpoint in checkpoints:
        simulation.integrate(float(checkpoint["offsetDays"]), exact_finish_time=1)
        states.append(snapshot(simulation))
    return {"states": states, "additionalForceEvaluations": evaluations[0]}


def relative_vector(state: dict, body_index: int, key: str) -> Vector:
    values = state[key]
    return sub(tuple(values[body_index]), tuple(values[0]))


def body_residual(state: dict, ids: list[str], checkpoint: dict) -> dict[str, dict[str, float]]:
    references = {body["id"]: body for body in checkpoint["bodies"]}
    result = {}
    for index, body_id in enumerate(ids):
        reference = references.get(body_id)
        if reference is None:
            continue
        measured_position = relative_vector(state, index, "positionsAu")
        measured_velocity = relative_vector(state, index, "velocitiesAuDay")
        reference_position = (
            reference["x_au"], reference["y_au"], reference["z_au"]
        )
        reference_velocity = (
            reference["vx_au_d"], reference["vy_au_d"], reference["vz_au_d"]
        )
        result[body_id] = {
            "positionResidualKm": norm(sub(measured_position, reference_position)) * AU / 1000.0,
            "velocityResidualMS": norm(sub(measured_velocity, reference_velocity)) * AU / DAY,
        }
    return result


def effect_size(effect_state: dict, legacy_state: dict, body_index: int) -> tuple[float, float]:
    position = norm(sub(
        relative_vector(effect_state, body_index, "positionsAu"),
        relative_vector(legacy_state, body_index, "positionsAu"),
    )) * AU / 1000.0
    velocity = norm(sub(
        relative_vector(effect_state, body_index, "velocitiesAuDay"),
        relative_vector(legacy_state, body_index, "velocitiesAuDay"),
    )) * AU / DAY
    return position, velocity


def canonical_hash(value) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def build_per_body(runs, ids: list[str], checkpoints: list[dict]):
    primary = runs[0][str(EPSILONS[1])]
    coarse = runs[0][str(EPSILONS[0])]
    repeated = runs[1][str(EPSILONS[1])]
    rows = []
    for checkpoint_index, checkpoint in enumerate(checkpoints):
        residual_sets = {}
        for label, source in (("primary", primary), ("coarse", coarse), ("repeated", repeated)):
            residual_sets[label] = {
                mode: body_residual(source[mode]["states"][checkpoint_index], ids, checkpoint)
                for mode in ("legacy-eih-1pn", "eih-1pn-2pn-lt")
            }
        bodies = []
        for body_id in ids:
            legacy = residual_sets["primary"]["legacy-eih-1pn"][body_id]
            candidate = residual_sets["primary"]["eih-1pn-2pn-lt"][body_id]
            coarse_candidate = residual_sets["coarse"]["eih-1pn-2pn-lt"][body_id]
            repeated_candidate = residual_sets["repeated"]["eih-1pn-2pn-lt"][body_id]
            position_uncertainty = max(
                POSITION_FLOOR_KM,
                5.0 * abs(candidate["positionResidualKm"] - coarse_candidate["positionResidualKm"]),
                5.0 * abs(candidate["positionResidualKm"] - repeated_candidate["positionResidualKm"]),
            )
            velocity_uncertainty = max(
                VELOCITY_FLOOR_MS,
                5.0 * abs(candidate["velocityResidualMS"] - coarse_candidate["velocityResidualMS"]),
                5.0 * abs(candidate["velocityResidualMS"] - repeated_candidate["velocityResidualMS"]),
            )
            position_delta = candidate["positionResidualKm"] - legacy["positionResidualKm"]
            velocity_delta = candidate["velocityResidualMS"] - legacy["velocityResidualMS"]
            bodies.append({
                "bodyId": body_id,
                "legacyPositionResidualKm": legacy["positionResidualKm"],
                "candidatePositionResidualKm": candidate["positionResidualKm"],
                "positionDeltaKm": position_delta,
                "positionUncertaintyKm": position_uncertainty,
                "legacyVelocityResidualMS": legacy["velocityResidualMS"],
                "candidateVelocityResidualMS": candidate["velocityResidualMS"],
                "velocityDeltaMS": velocity_delta,
                "velocityUncertaintyMS": velocity_uncertainty,
                "noRegression": position_delta <= position_uncertainty and velocity_delta <= velocity_uncertainty,
            })
        rows.append({"label": checkpoint["label"], "offsetDays": checkpoint["offsetDays"], "bodies": bodies})
    return rows


def build_effect_isolation(runs, ids: list[str], checkpoints: list[dict]):
    primary = runs[0][str(EPSILONS[1])]
    coarse = runs[0][str(EPSILONS[0])]
    effects = []
    for effect_id, mode in (
        ("solar-2pn", "legacy-plus-2pn-only"),
        ("lense-thirring", "legacy-plus-lense-thirring-only"),
    ):
        checkpoint_rows = []
        for checkpoint_index, checkpoint in enumerate(checkpoints):
            bodies = []
            for body_index, body_id in enumerate(ids):
                position, velocity = effect_size(
                    primary[mode]["states"][checkpoint_index],
                    primary["legacy-eih-1pn"]["states"][checkpoint_index], body_index,
                )
                coarse_position, coarse_velocity = effect_size(
                    coarse[mode]["states"][checkpoint_index],
                    coarse["legacy-eih-1pn"]["states"][checkpoint_index], body_index,
                )
                position_uncertainty = max(POSITION_FLOOR_KM, 5.0 * abs(position - coarse_position))
                velocity_uncertainty = max(VELOCITY_FLOOR_MS, 5.0 * abs(velocity - coarse_velocity))
                position_snr = position / position_uncertainty
                velocity_snr = velocity / velocity_uncertainty
                bodies.append({
                    "bodyId": body_id,
                    "positionEffectKm": position,
                    "velocityEffectMS": velocity,
                    "positionUncertaintyKm": position_uncertainty,
                    "velocityUncertaintyMS": velocity_uncertainty,
                    "positionSnr": position_snr,
                    "velocitySnr": velocity_snr,
                    "resolved": body_index == 0 or position_snr >= 5.0 or velocity_snr >= 5.0,
                })
            checkpoint_rows.append({
                "label": checkpoint["label"], "offsetDays": checkpoint["offsetDays"], "bodies": bodies
            })
        effects.append({"effectId": effect_id, "mode": mode, "checkpoints": checkpoint_rows})
    return effects


def build_attributions(dop_report: dict, ias_rows: list[dict], provenance_matches: bool):
    ias_index = {
        (checkpoint["offsetDays"], body["bodyId"]): body
        for checkpoint in ias_rows for body in checkpoint["bodies"]
    }
    attributions = []
    for checkpoint in dop_report["perBodyComparison"]:
        for dop in checkpoint["bodies"]:
            if dop["noRegression"]:
                continue
            ias = ias_index.get((checkpoint["offsetDays"], dop["bodyId"]))
            if not provenance_matches or ias is None:
                classification = "provenance-mismatch"
                metrics = []
            else:
                metrics = []
                for metric, delta_key, uncertainty_key in (
                    ("position", "positionDeltaKm", "positionUncertaintyKm"),
                    ("velocity", "velocityDeltaMS", "velocityUncertaintyMS"),
                ):
                    dop_resolved = dop[delta_key] > dop[uncertainty_key]
                    if not dop_resolved:
                        continue
                    joint = math.hypot(dop[uncertainty_key], ias[uncertainty_key])
                    agreement = abs(dop[delta_key] - ias[delta_key]) <= joint
                    reproduced = ias[delta_key] > ias[uncertainty_key]
                    metrics.append({
                        "metric": metric,
                        "dop853Delta": dop[delta_key],
                        "ias15Delta": ias[delta_key],
                        "jointUncertainty": joint,
                        "solverAgreement": agreement,
                        "horizonsRegressionReproduced": reproduced,
                    })
                if metrics and all(row["solverAgreement"] and row["horizonsRegressionReproduced"] for row in metrics):
                    classification = "cross-solver-regression-confirmed"
                elif any(not row["solverAgreement"] for row in metrics):
                    classification = "solver-disagreement"
                else:
                    classification = "inconclusive"
            attributions.append({
                "checkpoint": checkpoint["label"],
                "offsetDays": checkpoint["offsetDays"],
                "bodyId": dop["bodyId"],
                "classification": classification,
                "metrics": metrics,
            })
    return attributions


def main() -> None:
    parser = argparse.ArgumentParser(description="Independent REBOUND IAS15 V8 cross-validator")
    parser.add_argument("--fixture", default="public/data/horizons-validation-j2000-outer-system-barycenter-v84.json")
    parser.add_argument("--dop853-report", default="dist/science/relativity-dop853-v7-report.json")
    parser.add_argument("--output", default="dist/science/relativity-cross-validation-v8.json")
    parser.add_argument("--max-days", type=float, default=3652.5)
    parser.add_argument("--reruns", type=int, default=2)
    args = parser.parse_args()
    if args.reruns not in (1, 2):
        raise SystemExit("--reruns must be 1 or 2")

    fixture_path = Path(args.fixture).resolve()
    fixture_bytes = fixture_path.read_bytes()
    fixture_sha256 = hashlib.sha256(fixture_bytes).hexdigest()
    dataset = json.loads(fixture_bytes)
    initial = dataset["checkpoints"][0]
    checkpoints = [
        checkpoint for checkpoint in dataset["checkpoints"][1:]
        if checkpoint["offsetDays"] <= args.max_days
    ]
    if not checkpoints:
        raise SystemExit("No comparison checkpoints selected")
    ids = [body["id"] for body in initial["bodies"]]
    if set(ids) != set(GM):
        raise SystemExit("Fixture body set does not match the frozen mass provenance")

    required_reruns = 2 if args.reruns == 2 else 1
    runs = []
    run_hashes = []
    for rerun in range(required_reruns):
        epsilon_runs = {}
        for epsilon in EPSILONS:
            mode_runs = {}
            for mode in MODES:
                mode_runs[mode] = run_mode(initial, ids, checkpoints, mode, epsilon)
            epsilon_runs[str(epsilon)] = mode_runs
        runs.append(epsilon_runs)
        run_hashes.append(canonical_hash(epsilon_runs))
    if args.reruns == 1:
        runs.append(runs[0])
        run_hashes.append(run_hashes[0])

    per_body = build_per_body(runs, ids, checkpoints)
    effects = build_effect_isolation(runs, ids, checkpoints)
    dop_report_path = Path(args.dop853_report).resolve()
    dop_report = json.loads(dop_report_path.read_text(encoding="utf-8"))
    provenance_matches = dop_report.get("fixtureSha256") == fixture_sha256
    attributions = build_attributions(dop_report, per_body, provenance_matches)
    counts = {classification: 0 for classification in (
        "cross-solver-regression-confirmed", "solver-disagreement", "provenance-mismatch", "inconclusive"
    )}
    for row in attributions:
        counts[row["classification"]] += 1

    wheel = Path("tools/science-cache/wheels/rebound-4.6.0-cp312-cp312-win_amd64.whl").resolve()
    wheel_hash = hashlib.sha256(wheel.read_bytes()).hexdigest() if wheel.exists() else "missing"
    report = {
        "version": "v199-rebound-ias15-cross-validation-v8",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "fixture": str(fixture_path),
        "fixtureSha256": fixture_sha256,
        "coordinateFrame": "DE440-sun-centered-J2000-ecliptic",
        "timeScale": "TDB",
        "durationDays": args.max_days,
        "bodyCount": len(ids),
        "modes": list(MODES),
        "solver": {
            "name": "REBOUND", "version": rebound.__version__, "integrator": "ias15",
            "epsilons": list(EPSILONS), "forceIsVelocityDependent": True,
            "newtonianOwner": "rebound-direct-n-body",
            "additionalForces": "independent-scalar-eih-1pn-delta-plus-solar-2pn-lense-thirring",
        },
        "provenance": {
            "dop853Report": str(dop_report_path),
            "dop853ReportSha256": hashlib.sha256(dop_report_path.read_bytes()).hexdigest(),
            "fixtureMatchesDop853": provenance_matches,
            "reboundWheel": str(wheel), "reboundWheelSha256": wheel_hash,
            "reboundLicense": "GPL-3.0-or-later",
        },
        "reruns": [{"index": index + 1, "canonicalStateHash": value} for index, value in enumerate(run_hashes)],
        "rerunHashesMatch": run_hashes[0] == run_hashes[1],
        "modeEvaluations": [
            {
                "rerun": rerun_index + 1, "epsilon": float(epsilon), "mode": mode,
                "additionalForceEvaluations": run[epsilon][mode]["additionalForceEvaluations"],
            }
            for rerun_index, run in enumerate(runs)
            for epsilon in run for mode in MODES
        ],
        "perBodyComparison": per_body,
        "effectIsolation": effects,
        "regressionAttributions": attributions,
        "attributionCounts": counts,
        "promotionDecision": "shadow-retained",
        "defaultKernel": "legacy-eih-1pn",
        "shadowKernel": "eih-1pn-2pn-lt",
        "liveStateMutated": False,
        "workerStateMutated": False,
        "boundary": "offline-independent-cross-solver-evidence-no-runtime-promotion-no-causal-physics-claim",
    }
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "version": report["version"], "output": str(output),
        "rerunHashesMatch": report["rerunHashesMatch"],
        "attributionCounts": counts, "promotionDecision": report["promotionDecision"],
    }, indent=2))


if __name__ == "__main__":
    main()
