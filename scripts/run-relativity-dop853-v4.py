import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from scipy.integrate import solve_ivp

AU = 149_597_870_700.0
DAY = 86_400.0
G = 6.67430e-11
C = 299_792_458.0
GM = {
    "sun": 1.3271244004127942e20, "mercury": 2.2031868551400003e13,
    "venus": 3.24858592079e14, "earth": 3.98600435436e14,
    "moon": 4.902800066e12, "mars": 4.2828375214e13,
    "jupiter": 1.267127648e17, "saturn": 3.79405852e16,
    "uranus": 5.7945486e15, "neptune": 6.836527100580397e15,
    "pluto": 8.696138177608748e11, "ceres": 6.26325e10,
}
SOLAR_SPIN = 1.92e41
RA = math.radians(286.13)
DEC = math.radians(63.87)
SPIN_AXIS = np.array([math.cos(DEC) * math.cos(RA), math.cos(DEC) * math.sin(RA), math.sin(DEC)])


def acceleration(pos, vel, mass, mode):
    count = len(mass)
    newton = np.zeros_like(pos)
    phi = np.zeros(count)
    for i in range(count):
        for j in range(count):
            if i == j:
                continue
            delta = pos[j] - pos[i]
            radius = np.linalg.norm(delta)
            gm = G * mass[j]
            phi[i] += gm / radius
            newton[i] += gm * delta / radius**3
    if mode == "newton":
        return newton

    inv_c2 = 1 / C**2
    out = np.zeros_like(pos)
    for i in range(count):
        vi = vel[i]
        vi2 = float(np.dot(vi, vi))
        for j in range(count):
            if i == j:
                continue
            delta = pos[j] - pos[i]
            radius = np.linalg.norm(delta)
            n_ba = delta / radius
            n_ab = -n_ba
            vj = vel[j]
            bracket = (
                vi2 + 2 * float(np.dot(vj, vj)) - 4 * float(np.dot(vi, vj))
                - 1.5 * float(np.dot(n_ab, vj))**2 - 4 * phi[i] - phi[j]
                + 0.5 * float(np.dot(delta, newton[j]))
            )
            gm = G * mass[j]
            out[i] += inv_c2 * gm / radius**2 * bracket * n_ba
            scalar_n = float(np.dot(n_ab, 4 * vi - 3 * vj))
            out[i] += inv_c2 * gm / radius**2 * scalar_n * (vi - vj)
            out[i] += 3.5 * inv_c2 * gm / radius * newton[j]
    out += newton
    if mode != "eih-1pn-2pn-lt":
        return out

    sun = 0
    mu = GM["sun"]
    inv_c4 = inv_c2**2
    lt_numerator = 2 * G * SOLAR_SPIN * inv_c2
    for body in range(1, count):
        r_vec = pos[body] - pos[sun]
        v_vec = vel[body] - vel[sun]
        radius = np.linalg.norm(r_vec)
        n = r_vec / radius
        radial_velocity = float(np.dot(v_vec, n))
        scalar = 2 * radial_velocity**2 - 9 * mu / radius
        delta = mu**2 * inv_c4 / radius**3 * (scalar * n - 2 * radial_velocity * v_vec)
        spin_dot_n = float(np.dot(SPIN_AXIS, n))
        delta += lt_numerator / radius**3 * (3 * spin_dot_n * np.cross(n, v_vec) + np.cross(v_vec, SPIN_AXIS))
        denominator = mass[sun] + mass[body]
        out[body] += delta * mass[sun] / denominator
        out[sun] -= delta * mass[body] / denominator
    return out


def compare(state, ids, checkpoint):
    count = len(ids)
    pos = state[:3 * count].reshape(count, 3)
    vel = state[3 * count:].reshape(count, 3)
    refs = {body["id"]: body for body in checkpoint["bodies"]}
    position_norms = []
    velocity_norms = []
    for index, body_id in enumerate(ids):
        ref = refs.get(body_id)
        if ref is None:
            continue
        measured_pos = (pos[index] - pos[0]) / AU
        measured_vel = (vel[index] - vel[0]) * DAY / AU
        reference_pos = np.array([ref["x_au"], ref["y_au"], ref["z_au"]])
        reference_vel = np.array([ref["vx_au_d"], ref["vy_au_d"], ref["vz_au_d"]])
        position_norms.append(float(np.linalg.norm(measured_pos - reference_pos) * AU / 1000))
        velocity_norms.append(float(np.linalg.norm(measured_vel - reference_vel) * AU / DAY))
    return {
        "label": checkpoint["label"], "offsetDays": checkpoint["offsetDays"],
        "rmsPositionKm": float(np.sqrt(np.mean(np.square(position_norms)))),
        "rmsVelocityMs": float(np.sqrt(np.mean(np.square(velocity_norms)))),
    }


def run_mode(initial, ids, mass, checkpoints, mode, max_step_days, rtol, atol):
    count = len(ids)
    times = np.array([checkpoint["offsetDays"] * DAY for checkpoint in checkpoints])

    def derivative(_, state):
        pos = state[:3 * count].reshape(count, 3)
        vel = state[3 * count:].reshape(count, 3)
        return np.concatenate((vel.reshape(-1), acceleration(pos, vel, mass, mode).reshape(-1)))

    solution = solve_ivp(derivative, (0, float(times[-1])), initial, method="DOP853", t_eval=times, rtol=rtol, atol=atol, max_step=max_step_days * DAY)
    if not solution.success:
        raise RuntimeError(solution.message)
    comparisons = [compare(solution.y[:, index], ids, checkpoint) for index, checkpoint in enumerate(checkpoints)]
    return {"mode": mode, "checkpoints": comparisons, "functionEvaluations": solution.nfev}


def main():
    parser = argparse.ArgumentParser(description="Independent SciPy DOP853 reference for the relativity V2 shadow campaign.")
    parser.add_argument("--fixture", default="public/data/horizons-validation-j2000-outer-system-barycenter-v84.json")
    parser.add_argument("--output", default="dist/science/relativity-dop853-v4-report.json")
    parser.add_argument("--max-days", type=float, default=3652.5)
    parser.add_argument("--max-step-days", type=float, default=2.0)
    parser.add_argument("--rtol", type=float, default=1e-11)
    parser.add_argument("--atol", type=float, default=1e-5)
    args = parser.parse_args()

    fixture_path = Path(args.fixture).resolve()
    dataset = json.loads(fixture_path.read_text(encoding="utf-8"))
    initial_checkpoint = dataset["checkpoints"][0]
    checkpoints = [checkpoint for checkpoint in dataset["checkpoints"][1:] if checkpoint["offsetDays"] <= args.max_days]
    if not checkpoints:
        raise SystemExit("No non-zero checkpoints are inside --max-days")
    ids = [body["id"] for body in initial_checkpoint["bodies"]]
    mass = np.array([GM[body_id] / G for body_id in ids])
    pos = np.array([[body["x_au"], body["y_au"], body["z_au"]] for body in initial_checkpoint["bodies"]]) * AU
    vel = np.array([[body["vx_au_d"], body["vy_au_d"], body["vz_au_d"]] for body in initial_checkpoint["bodies"]]) * AU / DAY
    initial = np.concatenate((pos.reshape(-1), vel.reshape(-1)))
    modes = [run_mode(initial, ids, mass, checkpoints, mode, args.max_step_days, args.rtol, args.atol) for mode in ("newton", "legacy-eih-1pn", "eih-1pn-2pn-lt")]
    report = {
        "version": "v145-scipy-dop853-independent-reference", "fixture": str(fixture_path),
        "fixtureSha256": hashlib.sha256(fixture_path.read_bytes()).hexdigest(),
        "coordinateFrame": "DE440-sun-centered-J2000-ecliptic", "eps2Meters": 0,
        "solver": {"name": "scipy.integrate.solve_ivp", "method": "DOP853", "rtol": args.rtol, "atol": args.atol, "maxStepDays": args.max_step_days},
        "modes": modes, "liveStateMutated": False,
    }
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"version": report["version"], "output": str(output), "modes": [{"mode": mode["mode"], "nfev": mode["functionEvaluations"], "last": mode["checkpoints"][-1]} for mode in modes]}, indent=2))


if __name__ == "__main__":
    main()
