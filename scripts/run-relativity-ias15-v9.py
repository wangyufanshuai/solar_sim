"""Independent REBOUND IAS15 validator for the Orbit Atlas V9 fixture.

REBOUND owns Newtonian N-body gravity. All additional accelerations are
implemented here with scalar tuple arithmetic and do not import the DOP853 or
browser/Worker force implementations.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

import rebound

AU_M = 149_597_870_700.0
DAY_S = 86_400.0
G = 6.67430e-11
C = 299_792_458.0
J2_SUN = 2.2e-7
SUN_RADIUS_M = 695_700_000.0
SUN_SPIN = 1.92e41
SUN_RA = math.radians(286.13)
SUN_DEC = math.radians(63.87)
SPIN_AXIS = (
    math.cos(SUN_DEC) * math.cos(SUN_RA),
    math.cos(SUN_DEC) * math.sin(SUN_RA),
    math.sin(SUN_DEC),
)
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
MODES = (
    "newton", "legacy-eih-1pn", "full-eih-1pn", "full-eih-1pn-j2",
    "full-eih-1pn-2pn", "full-eih-1pn-2pn-lt",
)
POSITION_FLOOR_KM = 1e-6
VELOCITY_FLOOR_MS = 1e-9
Vector = tuple[float, float, float]


def add(a: Vector, b: Vector) -> Vector:
    return a[0] + b[0], a[1] + b[1], a[2] + b[2]


def sub(a: Vector, b: Vector) -> Vector:
    return a[0] - b[0], a[1] - b[1], a[2] - b[2]


def mul(a: Vector, scale: float) -> Vector:
    return a[0] * scale, a[1] * scale, a[2] * scale


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
    positions, velocities = [], []
    for particle in simulation.particles:
        positions.append((particle.x * AU_M, particle.y * AU_M, particle.z * AU_M))
        velocities.append((
            particle.vx * AU_M / DAY_S,
            particle.vy * AU_M / DAY_S,
            particle.vz * AU_M / DAY_S,
        ))
    return positions, velocities


def scalar_newton(positions: list[Vector], masses: list[float]):
    count = len(masses)
    acceleration = [(0.0, 0.0, 0.0) for _ in masses]
    potential = [0.0 for _ in masses]
    for i in range(count):
        for j in range(count):
            if i == j:
                continue
            delta = sub(positions[j], positions[i])
            radius = norm(delta)
            gm = G * masses[j]
            acceleration[i] = add(acceleration[i], mul(delta, gm / radius**3))
            potential[i] += gm / radius
    return acceleration, potential


def scalar_eih_one_pn_delta(
    positions: list[Vector], velocities: list[Vector], masses: list[float],
) -> list[Vector]:
    newton, potential = scalar_newton(positions, masses)
    correction = [(0.0, 0.0, 0.0) for _ in masses]
    inv_c2 = 1.0 / C**2
    for i in range(len(masses)):
        vi = velocities[i]
        vi2 = dot(vi, vi)
        for j in range(len(masses)):
            if i == j:
                continue
            delta = sub(positions[j], positions[i])
            radius = norm(delta)
            n_ba = mul(delta, 1.0 / radius)
            n_ab = mul(n_ba, -1.0)
            vj = velocities[j]
            bracket = (
                vi2 + 2.0 * dot(vj, vj) - 4.0 * dot(vi, vj)
                - 1.5 * dot(n_ab, vj) ** 2 - 4.0 * potential[i]
                - potential[j] + 0.5 * dot(delta, newton[j])
            )
            gm = G * masses[j]
            scale = inv_c2 * gm / radius**2
            term = mul(n_ba, scale * bracket)
            term = add(term, mul(sub(vi, vj), scale * dot(n_ab, sub(mul(vi, 4.0), mul(vj, 3.0)))))
            term = add(term, mul(newton[j], 3.5 * inv_c2 * gm / radius))
            correction[i] = add(correction[i], term)
    return correction


def scalar_solar_j2_delta(positions: list[Vector], masses: list[float]) -> list[Vector]:
    correction = [(0.0, 0.0, 0.0) for _ in masses]
    for index in range(1, len(masses)):
        relative = sub(positions[index], positions[0])
        radius = norm(relative)
        n = mul(relative, 1.0 / radius)
        cosine = dot(n, SPIN_AXIS)
        vector = sub(mul(n, 5.0 * cosine**2 - 1.0), mul(SPIN_AXIS, 2.0 * cosine))
        delta = mul(vector, 1.5 * J2_SUN * GM["sun"] * SUN_RADIUS_M**2 / radius**4)
        denominator = masses[0] + masses[index]
        correction[index] = add(correction[index], mul(delta, masses[0] / denominator))
        correction[0] = sub(correction[0], mul(delta, masses[index] / denominator))
    return correction


def scalar_solar_2pn_lt_delta(
    positions: list[Vector], velocities: list[Vector], masses: list[float],
    include_2pn: bool, include_lt: bool,
) -> list[Vector]:
    correction = [(0.0, 0.0, 0.0) for _ in masses]
    inv_c2 = 1.0 / C**2
    for index in range(1, len(masses)):
        relative = sub(positions[index], positions[0])
        velocity = sub(velocities[index], velocities[0])
        radius = norm(relative)
        n = mul(relative, 1.0 / radius)
        radial_velocity = dot(velocity, n)
        delta = (0.0, 0.0, 0.0)
        if include_2pn:
            scalar = 2.0 * radial_velocity**2 - 9.0 * GM["sun"] / radius
            delta = add(delta, mul(
                sub(mul(n, scalar), mul(velocity, 2.0 * radial_velocity)),
                GM["sun"]**2 * inv_c2**2 / radius**3,
            ))
        if include_lt:
            lt = add(
                mul(cross(n, velocity), 3.0 * dot(SPIN_AXIS, n)),
                cross(velocity, SPIN_AXIS),
            )
            delta = add(delta, mul(lt, 2.0 * G * SUN_SPIN * inv_c2 / radius**3))
        denominator = masses[0] + masses[index]
        correction[index] = add(correction[index], mul(delta, masses[0] / denominator))
        correction[0] = sub(correction[0], mul(delta, masses[index] / denominator))
    return correction


def make_additional_forces(mode: str, masses: list[float], evaluations: list[int]) -> Callable:
    def additional_forces(pointer) -> None:
        simulation = pointer.contents
        positions, velocities = particle_state_si(simulation)
        correction = scalar_eih_one_pn_delta(positions, velocities, masses)
        if mode == "full-eih-1pn-j2":
            effect = scalar_solar_j2_delta(positions, masses)
            correction = [add(base, extra) for base, extra in zip(correction, effect)]
        if mode in ("full-eih-1pn-2pn", "full-eih-1pn-2pn-lt"):
            effect = scalar_solar_2pn_lt_delta(
                positions, velocities, masses, True, mode == "full-eih-1pn-2pn-lt",
            )
            correction = [add(base, extra) for base, extra in zip(correction, effect)]
        scale = DAY_S**2 / AU_M
        for particle, value in zip(simulation.particles, correction):
            particle.ax += value[0] * scale
            particle.ay += value[1] * scale
            particle.az += value[2] * scale
        evaluations[0] += 1
    return additional_forces


def create_simulation(initial: dict, ids: list[str], mode: str, epsilon: float):
    simulation = rebound.Simulation()
    simulation.G = GM["sun"] * DAY_S**2 / AU_M**3
    masses = [GM[body_id] / G for body_id in ids]
    source = {body["id"]: body for body in initial["bodies"]}
    for body_id in ids:
        body = source[body_id]
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
        simulation.additional_forces = make_additional_forces(mode, masses, evaluations)
    return simulation, evaluations


def snapshot(simulation: rebound.Simulation) -> dict:
    return {
        "positionsAu": [[p.x, p.y, p.z] for p in simulation.particles],
        "velocitiesAuDay": [[p.vx, p.vy, p.vz] for p in simulation.particles],
    }


def run_mode(initial: dict, checkpoints: list[dict], ids: list[str], mode: str, epsilon: float):
    simulation, evaluations = create_simulation(initial, ids, mode, epsilon)
    states = []
    for checkpoint in checkpoints:
        simulation.integrate(float(checkpoint["offsetDays"]), exact_finish_time=1)
        states.append(snapshot(simulation))
    return {"states": states, "additionalForceEvaluations": evaluations[0]}


def relative(state: dict, index: int, key: str) -> Vector:
    values = state[key]
    return sub(tuple(values[index]), tuple(values[0]))


def residuals(state: dict, checkpoint: dict, ids: list[str]):
    references = {body["id"]: body for body in checkpoint["bodies"]}
    output = {}
    for index, body_id in enumerate(ids):
        reference = references[body_id]
        reference_position = sub(
            (reference["x_au"], reference["y_au"], reference["z_au"]),
            (references["sun"]["x_au"], references["sun"]["y_au"], references["sun"]["z_au"]),
        )
        reference_velocity = sub(
            (reference["vx_au_d"], reference["vy_au_d"], reference["vz_au_d"]),
            (references["sun"]["vx_au_d"], references["sun"]["vy_au_d"], references["sun"]["vz_au_d"]),
        )
        output[body_id] = {
            "positionResidualKm": norm(sub(relative(state, index, "positionsAu"), reference_position)) * AU_M / 1000.0,
            "velocityResidualMS": norm(sub(relative(state, index, "velocitiesAuDay"), reference_velocity)) * AU_M / DAY_S,
        }
    return output


def effect_size(effect: dict, baseline: dict, index: int):
    position = norm(sub(relative(effect, index, "positionsAu"), relative(baseline, index, "positionsAu"))) * AU_M / 1000.0
    velocity = norm(sub(relative(effect, index, "velocitiesAuDay"), relative(baseline, index, "velocitiesAuDay"))) * AU_M / DAY_S
    return position, velocity


def canonical_hash(value) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def build_comparison(runs, epsilons: list[float], checkpoints: list[dict], ids: list[str]):
    fine = runs[0][str(epsilons[-1])]
    coarse = runs[0][str(epsilons[0])]
    repeated = runs[-1][str(epsilons[-1])]
    rows = []
    for checkpoint_index, checkpoint in enumerate(checkpoints):
        fine_legacy = residuals(fine["legacy-eih-1pn"]["states"][checkpoint_index], checkpoint, ids)
        fine_candidate = residuals(fine["full-eih-1pn-2pn-lt"]["states"][checkpoint_index], checkpoint, ids)
        coarse_legacy = residuals(coarse["legacy-eih-1pn"]["states"][checkpoint_index], checkpoint, ids)
        coarse_candidate = residuals(coarse["full-eih-1pn-2pn-lt"]["states"][checkpoint_index], checkpoint, ids)
        repeated_legacy = residuals(repeated["legacy-eih-1pn"]["states"][checkpoint_index], checkpoint, ids)
        repeated_candidate = residuals(repeated["full-eih-1pn-2pn-lt"]["states"][checkpoint_index], checkpoint, ids)
        bodies = []
        for body_id in ids:
            legacy, candidate = fine_legacy[body_id], fine_candidate[body_id]
            position_uncertainty = max(
                POSITION_FLOOR_KM,
                5.0 * abs(candidate["positionResidualKm"] - coarse_candidate[body_id]["positionResidualKm"]),
                5.0 * abs(candidate["positionResidualKm"] - repeated_candidate[body_id]["positionResidualKm"]),
            )
            velocity_uncertainty = max(
                VELOCITY_FLOOR_MS,
                5.0 * abs(candidate["velocityResidualMS"] - coarse_candidate[body_id]["velocityResidualMS"]),
                5.0 * abs(candidate["velocityResidualMS"] - repeated_candidate[body_id]["velocityResidualMS"]),
            )
            position_delta = candidate["positionResidualKm"] - legacy["positionResidualKm"]
            coarse_position_delta = coarse_candidate[body_id]["positionResidualKm"] - coarse_legacy[body_id]["positionResidualKm"]
            repeated_position_delta = repeated_candidate[body_id]["positionResidualKm"] - repeated_legacy[body_id]["positionResidualKm"]
            velocity_delta = candidate["velocityResidualMS"] - legacy["velocityResidualMS"]
            coarse_velocity_delta = coarse_candidate[body_id]["velocityResidualMS"] - coarse_legacy[body_id]["velocityResidualMS"]
            repeated_velocity_delta = repeated_candidate[body_id]["velocityResidualMS"] - repeated_legacy[body_id]["velocityResidualMS"]
            bodies.append({
                "bodyId": body_id,
                "legacyPositionResidualKm": legacy["positionResidualKm"],
                "candidatePositionResidualKm": candidate["positionResidualKm"],
                "positionDeltaKm": position_delta,
                "positionUncertaintyKm": position_uncertainty,
                "positionDeltaUncertaintyKm": max(
                    POSITION_FLOOR_KM,
                    5.0 * abs(position_delta - coarse_position_delta),
                    5.0 * abs(position_delta - repeated_position_delta),
                ),
                "legacyVelocityResidualMS": legacy["velocityResidualMS"],
                "candidateVelocityResidualMS": candidate["velocityResidualMS"],
                "velocityDeltaMS": velocity_delta,
                "velocityUncertaintyMS": velocity_uncertainty,
                "velocityDeltaUncertaintyMS": max(
                    VELOCITY_FLOOR_MS,
                    5.0 * abs(velocity_delta - coarse_velocity_delta),
                    5.0 * abs(velocity_delta - repeated_velocity_delta),
                ),
            })
        rows.append({"label": checkpoint["label"], "offsetDays": checkpoint["offsetDays"], "bodies": bodies})
    return rows


def build_effects(runs, epsilons: list[float], checkpoints: list[dict], ids: list[str]):
    fine = runs[0][str(epsilons[-1])]
    coarse = runs[0][str(epsilons[0])]
    definitions = (
        ("solar-j2", "full-eih-1pn-j2", "full-eih-1pn"),
        ("solar-2pn", "full-eih-1pn-2pn", "full-eih-1pn"),
        ("lense-thirring", "full-eih-1pn-2pn-lt", "full-eih-1pn-2pn"),
    )
    output = []
    for effect_id, mode, baseline_mode in definitions:
        checkpoint_rows = []
        for checkpoint_index, checkpoint in enumerate(checkpoints):
            bodies = []
            for index, body_id in enumerate(ids):
                position, velocity = effect_size(fine[mode]["states"][checkpoint_index], fine[baseline_mode]["states"][checkpoint_index], index)
                coarse_position, coarse_velocity = effect_size(coarse[mode]["states"][checkpoint_index], coarse[baseline_mode]["states"][checkpoint_index], index)
                position_uncertainty = max(POSITION_FLOOR_KM, 5.0 * abs(position - coarse_position))
                velocity_uncertainty = max(VELOCITY_FLOOR_MS, 5.0 * abs(velocity - coarse_velocity))
                bodies.append({
                    "bodyId": body_id,
                    "positionEffectKm": position,
                    "velocityEffectMS": velocity,
                    "positionUncertaintyKm": position_uncertainty,
                    "velocityUncertaintyMS": velocity_uncertainty,
                    "positionSnr": position / position_uncertainty,
                    "velocitySnr": velocity / velocity_uncertainty,
                    "resolved": index == 0 or position / position_uncertainty >= 5 or velocity / velocity_uncertainty >= 5,
                })
            checkpoint_rows.append({"label": checkpoint["label"], "offsetDays": checkpoint["offsetDays"], "bodies": bodies})
        output.append({"effectId": effect_id, "mode": mode, "baselineMode": baseline_mode, "checkpoints": checkpoint_rows})
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas independent REBOUND IAS15 V9 validator")
    parser.add_argument("--fixture", default="dist/science/relativity-reference-fixture-v9.json")
    parser.add_argument("--output", default="dist/science/relativity-ias15-v9.json")
    parser.add_argument("--max-days", type=float, default=3652.5)
    parser.add_argument("--epsilons", nargs=2, type=float, default=[1e-11, 3e-12])
    parser.add_argument("--reruns", type=int, choices=(1, 2), default=2)
    parser.add_argument("--modes", nargs="+", choices=MODES, default=list(MODES))
    args = parser.parse_args()
    required_modes = {"legacy-eih-1pn", "full-eih-1pn", "full-eih-1pn-j2", "full-eih-1pn-2pn", "full-eih-1pn-2pn-lt"}
    if not required_modes.issubset(args.modes):
        raise SystemExit("IAS15 comparison/effect report requires all EIH/J2/2PN/LT modes")
    fixture_path = Path(args.fixture).resolve()
    fixture_bytes = fixture_path.read_bytes()
    fixture = json.loads(fixture_bytes)
    if fixture.get("coordinateFrame") != "ICRF-J2000-barycentric" or fixture.get("timeScale") != "TDB":
        raise SystemExit("IAS15 V9 requires the barycentric ICRF/TDB fixture")
    initial = fixture["checkpoints"][0]
    comparison_days = {30.0, 365.0, 3652.5}
    checkpoints = [
        row for row in fixture["checkpoints"][1:]
        if row["offsetDays"] <= args.max_days and row["offsetDays"] in comparison_days
    ]
    ids = fixture["bodyIds"]
    runs, run_hashes = [], []
    for _ in range(args.reruns):
        epsilon_runs = {}
        for epsilon in args.epsilons:
            epsilon_runs[str(epsilon)] = {
                mode: run_mode(initial, checkpoints, ids, mode, epsilon)
                for mode in args.modes
            }
        runs.append(epsilon_runs)
        run_hashes.append(canonical_hash(epsilon_runs))
    independent_rerun_count = args.reruns
    if args.reruns == 1:
        runs.append(runs[0])
        run_hashes.append(run_hashes[0])
    report = {
        "version": "v204-rebound-ias15-barycentric-reference-v9",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "fixture": str(fixture_path),
        "fixtureSha256": hashlib.sha256(fixture_bytes).hexdigest(),
        "coordinateFrame": "ICRF-J2000-barycentric",
        "timeScale": "TDB",
        "durationDays": args.max_days,
        "bodyIds": ids,
        "modes": args.modes,
        "solver": {
            "name": "REBOUND", "version": rebound.__version__, "integrator": "ias15",
            "epsilons": args.epsilons, "forceIsVelocityDependent": True,
            "newtonianOwner": "rebound-direct-n-body",
            "additionalForces": "independent-scalar-eih-1pn-j2-2pn-lense-thirring",
        },
        "reruns": [{"index": index + 1, "canonicalStateHash": value} for index, value in enumerate(run_hashes)],
        "independentRerunCount": independent_rerun_count,
        "rerunHashesMatch": run_hashes[0] == run_hashes[1] if independent_rerun_count == 2 else None,
        "rerunEvidenceStatus": "complete" if independent_rerun_count == 2 else "single-run-independent-rerun-required",
        "modeEvaluations": [
            {"rerun": r + 1, "epsilon": float(e), "mode": mode, "additionalForceEvaluations": run[e][mode]["additionalForceEvaluations"]}
            for r, run in enumerate(runs) for e in run for mode in args.modes
        ],
        "perBodyComparison": build_comparison(runs, args.epsilons, checkpoints, ids),
        "effectIsolation": build_effects(runs, args.epsilons, checkpoints, ids),
        "promotionDecision": "shadow-retained",
        "defaultKernel": "legacy-eih-1pn",
        "shadowKernel": "barycentric-eih-1pn-j2-2pn-lt-v9",
        "liveStateMutated": False,
        "workerStateMutated": False,
        "boundary": "offline-independent-ias15-reference-no-runtime-promotion",
    }
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "version": report["version"], "output": str(output),
        "rerunHashesMatch": report["rerunHashesMatch"],
        "checkpointCount": len(checkpoints), "bodyCount": len(ids),
        "promotionDecision": report["promotionDecision"],
    }, indent=2))


if __name__ == "__main__":
    main()
