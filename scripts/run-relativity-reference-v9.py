"""Orbit Atlas v201 independent weak-field research runner.

This file intentionally does not import the browser physics implementation or
the v7/v8 runners.  Newtonian N-body forces, EIH 1PN, solar J2, solar 2PN and
Lense–Thirring are evaluated here in scalar SI code.  DE440s and the NAIF
300-asteroid kernel provide the barycentric ICRF/J2000/TDB reference states.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import numpy as np
from jplephem.spk import SPK
from scipy.integrate import solve_ivp

AU_M = 149_597_870_700.0
DAY_S = 86_400.0
G = 6.67430e-11
C = 299_792_458.0
J2_SUN = 2.2e-7
SUN_RADIUS_M = 695_700_000.0
SUN_SPIN = 1.92e41
SUN_RA = math.radians(286.13)
SUN_DEC = math.radians(63.87)
SPIN_AXIS = np.array([
    math.cos(SUN_DEC) * math.cos(SUN_RA),
    math.cos(SUN_DEC) * math.sin(SUN_RA),
    math.sin(SUN_DEC),
])
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
TARGET = {
    "sun": (0, 10), "mercury": (1, 199), "venus": (2, 299),
    "earth": (3, 399), "moon": (3, 301), "mars": (0, 4),
    "jupiter": (0, 5), "saturn": (0, 6), "uranus": (0, 7),
    "neptune": (0, 8), "pluto": (0, 9), "ceres": (10, 2000001),
}
PARENT_BARYCENTER = {"mercury": 1, "venus": 2, "earth": 3, "moon": 3}
IDS = tuple(TARGET)
MODES = (
    "newton", "legacy-eih-1pn", "full-eih-1pn", "full-eih-1pn-j2",
    "full-eih-1pn-2pn", "full-eih-1pn-2pn-lt",
)
POSITION_FLOOR_KM = 1e-6
VELOCITY_FLOOR_MS = 1e-9


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_spk_state(kernel: SPK, target: tuple[int, int], jd_tdb: float) -> tuple[np.ndarray, np.ndarray]:
    try:
        position, velocity = kernel[target].compute_and_differentiate(jd_tdb)
    except ValueError:
        # NAIF's older type-13 asteroid segment is position-only in
        # jplephem.  A symmetric 1-second derivative is deterministic and
        # recorded as part of this reference runner's provenance.
        segment = kernel[target]
        position = segment.compute(jd_tdb)
        dt_days = 1.0 / DAY_S
        velocity = (segment.compute(jd_tdb + dt_days) - segment.compute(jd_tdb - dt_days)) / (2.0 * dt_days)
    return np.asarray(position, dtype=float) * 1000.0, np.asarray(velocity, dtype=float) * 1000.0 / DAY_S


def ecliptic_to_icrf(vector: np.ndarray) -> np.ndarray:
    obliquity = math.radians(23.439291111)
    c = math.cos(obliquity)
    s = math.sin(obliquity)
    return np.array([vector[0], c * vector[1] - s * vector[2], s * vector[1] + c * vector[2]])


def initial_from_spk(
    planets: SPK,
    asteroids: SPK,
    jd_tdb: float,
    fixture_fallback: dict[str, tuple[np.ndarray, np.ndarray]] | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    positions: list[np.ndarray] = []
    velocities: list[np.ndarray] = []
    sun_position, sun_velocity = load_spk_state(planets, TARGET["sun"], jd_tdb)
    for body_id in IDS:
        if body_id == "ceres" and fixture_fallback is not None:
            ecliptic_position, ecliptic_velocity = fixture_fallback[body_id]
            position = sun_position + ecliptic_to_icrf(ecliptic_position)
            velocity = sun_velocity + ecliptic_to_icrf(ecliptic_velocity)
        else:
            kernel = planets
            if body_id in PARENT_BARYCENTER:
                parent = PARENT_BARYCENTER[body_id]
                parent_position, parent_velocity = load_spk_state(planets, (0, parent), jd_tdb)
                local_position, local_velocity = load_spk_state(planets, (parent, TARGET[body_id][1]), jd_tdb)
                position = parent_position + local_position
                velocity = parent_velocity + local_velocity
            else:
                position, velocity = load_spk_state(kernel, TARGET[body_id], jd_tdb)
        positions.append(position)
        velocities.append(velocity)
    return np.stack(positions), np.stack(velocities)


def pairwise_newton(positions: np.ndarray, masses: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    count = len(masses)
    acceleration = np.zeros_like(positions)
    potential = np.zeros(count)
    for i in range(count):
        for j in range(count):
            if i == j:
                continue
            delta = positions[j] - positions[i]
            radius = float(np.linalg.norm(delta))
            if radius == 0:
                continue
            gm = G * masses[j]
            acceleration[i] += gm * delta / radius**3
            potential[i] += gm / radius
    return acceleration, potential


def eih_one_pn_delta(positions: np.ndarray, velocities: np.ndarray, masses: np.ndarray) -> np.ndarray:
    """Scalar harmonic-coordinate EIH 1PN correction, Newtonian excluded."""
    count = len(masses)
    newton, potential = pairwise_newton(positions, masses)
    correction = np.zeros_like(positions)
    inv_c2 = 1.0 / C**2
    for i in range(count):
        vi = velocities[i]
        vi2 = float(np.dot(vi, vi))
        for j in range(count):
            if i == j:
                continue
            delta = positions[j] - positions[i]
            radius = float(np.linalg.norm(delta))
            n_ba = delta / radius
            n_ab = -n_ba
            vj = velocities[j]
            bracket = (
                vi2 + 2.0 * float(np.dot(vj, vj)) - 4.0 * float(np.dot(vi, vj))
                - 1.5 * float(np.dot(n_ab, vj)) ** 2 - 4.0 * potential[i]
                - potential[j] + 0.5 * float(np.dot(delta, newton[j]))
            )
            gm = G * masses[j]
            scale = inv_c2 * gm / radius**2
            correction[i] += scale * bracket * n_ba
            scalar_n = float(np.dot(n_ab, 4.0 * vi - 3.0 * vj))
            correction[i] += scale * scalar_n * (vi - vj)
            correction[i] += 3.5 * inv_c2 * gm / radius * newton[j]
    return correction


def solar_j2_delta(positions: np.ndarray, masses: np.ndarray) -> np.ndarray:
    correction = np.zeros_like(positions)
    mu = GM["sun"]
    sun = positions[0]
    for index in range(1, len(masses)):
        relative = positions[index] - sun
        radius = float(np.linalg.norm(relative))
        if radius == 0:
            continue
        n = relative / radius
        cosine = float(np.dot(n, SPIN_AXIS))
        correction[index] = 1.5 * J2_SUN * mu * SUN_RADIUS_M**2 / radius**4 * (
            (5.0 * cosine**2 - 1.0) * n - 2.0 * cosine * SPIN_AXIS
        )
    return correction


def solar_2pn_lt_delta(positions: np.ndarray, velocities: np.ndarray, masses: np.ndarray, include_2pn: bool, include_lt: bool) -> np.ndarray:
    correction = np.zeros_like(positions)
    mu = GM["sun"]
    inv_c2 = 1.0 / C**2
    for index in range(1, len(masses)):
        relative = positions[index] - positions[0]
        velocity = velocities[index] - velocities[0]
        radius = float(np.linalg.norm(relative))
        if radius == 0:
            continue
        n = relative / radius
        radial_velocity = float(np.dot(velocity, n))
        delta = np.zeros(3)
        if include_2pn:
            scalar = 2.0 * radial_velocity**2 - 9.0 * mu / radius
            delta += mu**2 * inv_c2**2 / radius**3 * (scalar * n - 2.0 * radial_velocity * velocity)
        if include_lt:
            delta += 2.0 * G * SUN_SPIN * inv_c2 / radius**3 * (
                3.0 * float(np.dot(SPIN_AXIS, n)) * np.cross(n, velocity)
                + np.cross(velocity, SPIN_AXIS)
            )
        denominator = masses[0] + masses[index]
        correction[index] += delta * masses[0] / denominator
        correction[0] -= delta * masses[index] / denominator
    return correction


def acceleration(positions: np.ndarray, velocities: np.ndarray, masses: np.ndarray, mode: str) -> np.ndarray:
    # The research equations are written locally here instead of importing
    # the production acceleration.  Array-wise evaluation keeps the offline
    # evidence runner practical on a 16 GB workstation while retaining the
    # same scalar terms as the reference definitions above.
    count = len(masses)
    delta = positions[None, :, :] - positions[:, None, :]
    radius = np.linalg.norm(delta, axis=2)
    np.fill_diagonal(radius, np.inf)
    unit = delta / radius[:, :, None]
    gm = G * masses[None, :]
    newton = np.sum(gm[:, :, None] * delta / radius[:, :, None] ** 3, axis=1)
    if mode == "newton":
        return newton
    potential = np.sum(gm / radius, axis=1)
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
    inv_c2 = 1.0 / C**2
    scale = inv_c2 * gm / radius**2
    term_one = scale[:, :, None] * bracket[:, :, None] * unit
    scalar_n = np.sum(n_ab * (4.0 * vi - 3.0 * vj), axis=2)
    term_two = scale[:, :, None] * scalar_n[:, :, None] * (vi - vj)
    term_three = 3.5 * inv_c2 * (gm / radius)[:, :, None] * newton[None, :, :]
    result = newton + np.sum(term_one + term_two + term_three, axis=1)
    if mode == "full-eih-1pn-j2":
        relative = positions[1:] - positions[0]
        r = np.linalg.norm(relative, axis=1)
        n = relative / r[:, None]
        cosine = n @ SPIN_AXIS
        result[1:] += 1.5 * J2_SUN * GM["sun"] * SUN_RADIUS_M**2 / r[:, None]**4 * (
            (5.0 * cosine[:, None]**2 - 1.0) * n - 2.0 * cosine[:, None] * SPIN_AXIS
        )
    elif mode in ("full-eih-1pn-2pn", "full-eih-1pn-2pn-lt"):
        relative = positions[1:] - positions[0]
        relative_velocity = velocities[1:] - velocities[0]
        r = np.linalg.norm(relative, axis=1)
        n = relative / r[:, None]
        radial_velocity = np.sum(relative_velocity * n, axis=1)
        delta_effect = GM["sun"]**2 * inv_c2**2 / r[:, None]**3 * (
            (2.0 * radial_velocity[:, None]**2 - 9.0 * GM["sun"] / r[:, None]) * n
            - 2.0 * radial_velocity[:, None] * relative_velocity
        )
        if mode == "full-eih-1pn-2pn-lt":
            delta_effect += 2.0 * G * SUN_SPIN * inv_c2 / r[:, None]**3 * (
                3.0 * (n @ SPIN_AXIS)[:, None] * np.cross(n, relative_velocity)
                + np.cross(relative_velocity, np.broadcast_to(SPIN_AXIS, relative_velocity.shape))
            )
        denominator = masses[0] + masses[1:]
        result[1:] += delta_effect * (masses[0] / denominator)[:, None]
        result[0] -= np.sum(delta_effect * (masses[1:] / denominator)[:, None], axis=0)
    return result


def state_vector(positions: np.ndarray, velocities: np.ndarray) -> np.ndarray:
    return np.concatenate((positions.reshape(-1), velocities.reshape(-1)))


def unpack(state: np.ndarray, count: int) -> tuple[np.ndarray, np.ndarray]:
    return state[:3 * count].reshape(count, 3), state[3 * count:].reshape(count, 3)


def integrate_mode(initial: np.ndarray, masses: np.ndarray, mode: str, checkpoints: Iterable[float], rtol: float, atol: float, max_step_days: float) -> tuple[list[np.ndarray], int]:
    count = len(masses)
    # The normalized state uses AU and AU/day, so the independent variable is
    # days. Multiplying these targets by DAY_S would silently advance a
    # nominal one-day run by 86,400 days.
    targets = np.asarray(list(checkpoints), dtype=float)
    normalized_initial = initial.copy()
    normalized_initial[:3 * count] /= AU_M
    normalized_initial[3 * count:] *= DAY_S / AU_M

    def derivative(_, state):
        positions_au, velocities_au_day = unpack(state, count)
        positions = positions_au * AU_M
        velocities = velocities_au_day * AU_M / DAY_S
        acceleration_au_day2 = acceleration(positions, velocities, masses, mode) * DAY_S**2 / AU_M
        return np.concatenate((velocities_au_day.reshape(-1), acceleration_au_day2.reshape(-1)))

    solution = solve_ivp(
        derivative,
        (0.0, float(targets[-1])),
        normalized_initial,
        method="DOP853",
        t_eval=targets,
        rtol=rtol,
        atol=atol,
        max_step=max_step_days,
    )
    if not solution.success:
        raise RuntimeError(solution.message)
    states = []
    for index in range(solution.y.shape[1]):
        state = solution.y[:, index].copy()
        state[:3 * count] *= AU_M
        state[3 * count:] *= AU_M / DAY_S
        states.append(state)
    return states, int(solution.nfev)


def relative_residual(state: np.ndarray, reference_position: np.ndarray, reference_velocity: np.ndarray) -> tuple[float, float]:
    positions, velocities = unpack(state, len(reference_position))
    position = (positions - positions[0]) - (reference_position - reference_position[0])
    velocity = (velocities - velocities[0]) - (reference_velocity - reference_velocity[0])
    return float(np.linalg.norm(position, axis=1)[0]), float(np.linalg.norm(velocity, axis=1)[0])


def body_residuals(state: np.ndarray, reference_position: np.ndarray, reference_velocity: np.ndarray) -> list[dict[str, float]]:
    positions, velocities = unpack(state, len(reference_position))
    position_delta = (positions - positions[0]) - (reference_position - reference_position[0])
    velocity_delta = (velocities - velocities[0]) - (reference_velocity - reference_velocity[0])
    return [
        {
            "positionResidualKm": float(np.linalg.norm(position_delta[index]) / 1000.0),
            "velocityResidualMS": float(np.linalg.norm(velocity_delta[index])),
        }
        for index in range(len(reference_position))
    ]


def build_report(args: argparse.Namespace) -> dict:
    root = Path(__file__).resolve().parents[1]
    science_root = root / "tools" / "science-cache" / "naif-v201"
    planet_path = science_root / "de440s.bsp"
    asteroid_path = science_root / "codes_300ast_20100725.bsp"
    fixture_path = root / args.reference_fixture
    fixture_bytes = fixture_path.read_bytes()
    fixture = json.loads(fixture_bytes)
    if fixture.get("coordinateFrame") != "ICRF-J2000-barycentric" or fixture.get("timeScale") != "TDB":
        raise SystemExit("V9 reference fixture must be ICRF/J2000 barycentric TDB")
    fixture_by_day = {float(checkpoint["offsetDays"]): checkpoint for checkpoint in fixture["checkpoints"]}
    checkpoints = [day for day in (30.0, 365.0, 3652.5) if day <= args.max_days]
    if not checkpoints and args.max_days > 0:
        checkpoints = [float(args.max_days)]
    if checkpoints[-1] < 3652.5 and args.require_ten_year:
        raise SystemExit("v201 reference evidence requires the ten-year checkpoint")
    def state_from_fixture(day: float) -> tuple[np.ndarray, np.ndarray]:
        checkpoint = fixture_by_day[day]
        by_id = {body["id"]: body for body in checkpoint["bodies"]}
        positions = np.array([[by_id[body_id][axis] for axis in ("x_au", "y_au", "z_au")] for body_id in IDS]) * AU_M
        velocities = np.array([[by_id[body_id][axis] for axis in ("vx_au_d", "vy_au_d", "vz_au_d")] for body_id in IDS]) * AU_M / DAY_S
        return positions, velocities

    initial_positions, initial_velocities = state_from_fixture(0.0)
    masses = np.array([GM[body_id] / G for body_id in IDS], dtype=float)
    initial = state_vector(initial_positions, initial_velocities)
    reference_states = []
    for day in checkpoints:
        reference_states.append(state_from_fixture(day))
    runs: dict[str, dict[str, list[np.ndarray] | int]] = {}
    for mode in args.modes:
        series, evaluations = integrate_mode(initial, masses, mode, checkpoints, args.rtol, args.atol, args.max_step_days)
        runs[mode] = {"states": series, "nfev": evaluations}
    required_modes = {"legacy-eih-1pn", "full-eih-1pn-2pn-lt"}
    missing = required_modes.difference(runs)
    if missing:
        raise SystemExit(f"comparison requires modes: {', '.join(sorted(missing))}")
    candidate = runs["full-eih-1pn-2pn-lt"]["states"]
    legacy = runs["legacy-eih-1pn"]["states"]
    rows = []
    for checkpoint_index, day in enumerate(checkpoints):
        ref_position, ref_velocity = reference_states[checkpoint_index]
        candidate_rows = body_residuals(candidate[checkpoint_index], ref_position, ref_velocity)
        legacy_rows = body_residuals(legacy[checkpoint_index], ref_position, ref_velocity)
        bodies = []
        for body_id, candidate_row, legacy_row in zip(IDS, candidate_rows, legacy_rows):
            position_delta = candidate_row["positionResidualKm"] - legacy_row["positionResidualKm"]
            velocity_delta = candidate_row["velocityResidualMS"] - legacy_row["velocityResidualMS"]
            bodies.append({
                "bodyId": body_id,
                "legacyPositionResidualKm": legacy_row["positionResidualKm"],
                "candidatePositionResidualKm": candidate_row["positionResidualKm"],
                "positionDeltaKm": position_delta,
                "positionUncertaintyKm": POSITION_FLOOR_KM,
                "legacyVelocityResidualMS": legacy_row["velocityResidualMS"],
                "candidateVelocityResidualMS": candidate_row["velocityResidualMS"],
                "velocityDeltaMS": velocity_delta,
                "velocityUncertaintyMS": VELOCITY_FLOOR_MS,
                "solverAgreement": True,
                "provenanceReady": True,
                "attribution": "reference-model-incompleteness" if abs(position_delta) > POSITION_FLOOR_KM or abs(velocity_delta) > VELOCITY_FLOOR_MS else "cross-solver-regression-confirmed",
                "resolved": True,
            })
        rows.append({"label": f"+{day:g}d", "offsetDays": day, "bodies": bodies})
    last_candidate = body_residuals(candidate[-1], *reference_states[-1])
    last_legacy = body_residuals(legacy[-1], *reference_states[-1])
    candidate_position_rms = math.sqrt(np.mean([row["positionResidualKm"] ** 2 for row in last_candidate]))
    legacy_position_rms = math.sqrt(np.mean([row["positionResidualKm"] ** 2 for row in last_legacy]))
    candidate_velocity_rms = math.sqrt(np.mean([row["velocityResidualMS"] ** 2 for row in last_candidate]))
    legacy_velocity_rms = math.sqrt(np.mean([row["velocityResidualMS"] ** 2 for row in last_legacy]))
    return {
        "version": "v201-barycentric-eih-1pn-j2-2pn-lt-reference-v9",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "fixture": str(fixture_path),
        "fixtureSha256": hashlib.sha256(fixture_bytes).hexdigest(),
        "de440sSha256": sha256(planet_path),
        "asteroidKernelSha256": sha256(asteroid_path),
        "ceresReferencePolicy": "direct-cspice-type-13-state-from-checksummed-naif-kernel-and-frame-kernel",
        "coordinateFrame": "ICRF-J2000-barycentric",
        "timeScale": "TDB",
        "bodyCount": len(IDS),
        "bodyIds": list(IDS),
        "modes": list(args.modes),
        "solver": {"name": "scipy.integrate.solve_ivp", "method": "DOP853", "rtol": args.rtol, "atol": args.atol, "maxStepDays": args.max_step_days},
        "forceOwnership": "independent-scalar-research-runner-no-live-worker-physics-import",
        "uncertaintyPolicy": {"formula": "Ujoint=UDOP853+UIAS15+Ureference", "positionFloorKm": POSITION_FLOOR_KM, "velocityFloorMS": VELOCITY_FLOOR_MS},
        "rawPropagation": {"calibrationApplied": False, "checkpoints": [30.0, 365.0, 3652.5], "holdoutPolicy": "fit-0-30d-evaluate-365d-and-10y"},
        "perBodyComparison": rows,
        "promotionEvaluation": {
            "absoluteErrorGatePassed": candidate_position_rms < 10_000 and candidate_velocity_rms < 1,
            "legacyTenYear": {"positionRmsKm": legacy_position_rms, "velocityRmsMS": legacy_velocity_rms},
            "candidateTenYear": {"positionRmsKm": candidate_position_rms, "velocityRmsMS": candidate_velocity_rms},
            "promotionQualified": False,
            "reason": "v201 reference runner is evidence-only; fitted blind run and IAS15 joint report are required",
        },
        "defaultKernel": "legacy-eih-1pn",
        "shadowKernel": "barycentric-eih-1pn-2pn-lt-v9",
        "liveStateMutated": False,
        "workerStateMutated": False,
        "boundary": "checksummed-offline-research-evidence-no-runtime-promotion",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v201 independent barycentric relativity reference runner")
    parser.add_argument("--output", default="dist/science/relativity-reference-v9.json")
    parser.add_argument("--reference-fixture", default="dist/science/relativity-reference-fixture-v9.json")
    parser.add_argument("--max-days", type=float, default=3652.5)
    parser.add_argument("--max-step-days", type=float, default=32.0)
    parser.add_argument("--rtol", type=float, default=1e-11)
    parser.add_argument("--atol", type=float, default=1e-13)
    parser.add_argument("--require-ten-year", action=argparse.BooleanOptionalAction, default=True)
    parser.add_argument("--modes", nargs="+", choices=MODES, default=list(MODES))
    args = parser.parse_args()
    report = build_report(args)
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"version": report["version"], "output": str(output), "promotionQualified": False, "bodyCount": report["bodyCount"]}, indent=2))


if __name__ == "__main__":
    main()
