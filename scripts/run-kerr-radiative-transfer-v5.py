"""Kerr V5 redshift, intensity-invariant and polarization cross validation.

This remains an analytic Novikov-Thorne teaching-disc reference.  It is not a
GRMHD, black-hole-merger or numerical-relativity solver.
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

import numpy as np
from scipy.integrate import solve_ivp

ROOT = Path(__file__).resolve().parents[1]
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from kerr_observer_frame_v5 import (
    bl_metric_covariant,
    bl_to_cartesian_ks_jacobian,
    outer_horizon,
    zamo_bl_phase_space,
    zamo_cartesian_ks_state,
)


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


KS = load_module("atlas_kerr_schild_analytic_v5", SCRIPT_DIR / "run-kerr-schild-reference-v5.py")

SPINS = (0.0, 0.5, 0.9, 0.998)
INCLINATIONS_DEG = (0.0, 30.0, 60.0, 80.0)


def isco_radius(spin: float) -> float:
    z1 = 1.0 + (1.0 - spin * spin) ** (1.0 / 3.0) * (
        (1.0 + spin) ** (1.0 / 3.0) + (1.0 - spin) ** (1.0 / 3.0)
    )
    z2 = math.sqrt(3.0 * spin * spin + z1 * z1)
    sign = 1.0 if spin >= 0 else -1.0
    return 3.0 + z2 - sign * math.sqrt((3.0 - z1) * (3.0 + z1 + 2.0 * z2))


def circular_emitter(spin: float, radius: float) -> tuple[np.ndarray, float, float]:
    theta = math.pi / 2
    metric = bl_metric_covariant(spin, radius, theta)
    omega = 1.0 / (radius ** 1.5 + spin)
    normalization = -(metric[0, 0] + 2.0 * omega * metric[0, 3] + omega * omega * metric[3, 3])
    if normalization <= 0:
        raise ValueError("teaching-disc circular emitter is not timelike")
    ut = 1.0 / math.sqrt(normalization)
    return np.array([ut, 0.0, 0.0, omega * ut]), omega, ut


def radial_potential(radius: float, spin: float, energy: float, axial: float, carter: float) -> float:
    delta = radius * radius - 2.0 * radius + spin * spin
    p = energy * (radius * radius + spin * spin) - spin * axial
    return p * p - delta * ((axial - spin * energy) ** 2 + carter)


def emission_covector(spin: float, radius: float, energy: float, axial: float, carter: float) -> np.ndarray:
    delta = radius * radius - 2.0 * radius + spin * spin
    pr = -math.sqrt(max(0.0, radial_potential(radius, spin, energy, axial, carter))) / max(delta, 1e-30)
    ptheta = math.sqrt(max(0.0, carter))
    return np.array([-energy, pr, ptheta, axial])


def algebraic_transfer_sample(spin: float, inclination_deg: float, sample_index: int, samples_per_configuration: int) -> dict:
    theta = math.radians(max(1e-3, inclination_deg))
    phase = (sample_index + 0.5) / samples_per_configuration
    polar = 0.16 * math.sin(2.0 * math.pi * phase)
    # Keep every comparison photon future-directed in the analytic emitter
    # frame.  Larger azimuthal screen offsets can make E - Omega L negative
    # at the innermost teaching-disc radii; those are not physical emission
    # samples and must not be allowed to masquerade as a redshift result.
    azimuthal = 0.08 * math.cos(2.0 * math.pi * phase)
    direction = np.array([-1.0, polar, azimuthal])
    frame = zamo_bl_phase_space(spin, 50.0, theta, direction)
    emission_radius = isco_radius(spin) + 0.75 + 10.0 * phase
    emitter, omega, ut = circular_emitter(spin, emission_radius)
    energy = float(frame["energy"])
    axial = float(frame["axialAngularMomentum"])
    carter = float(frame["carterQ"])
    emitted_energy_bl = -float(frame["covector"][0] * emitter[0] + frame["covector"][3] * emitter[3])
    if not math.isfinite(emitted_energy_bl) or emitted_energy_bl <= 0.0:
        raise ValueError("non-future-directed teaching-disc emission sample")
    redshift_bl = 1.0 / emitted_energy_bl

    p_emission_bl = emission_covector(spin, emission_radius, energy, axial, carter)
    _, jacobian = bl_to_cartesian_ks_jacobian(spin, emission_radius, math.pi / 2, 0.0)
    p_emission_ks = np.linalg.solve(jacobian.T, p_emission_bl)
    emitter_ks = jacobian @ emitter
    emitted_energy_ks = -float(p_emission_ks @ emitter_ks)
    if not math.isfinite(emitted_energy_ks) or emitted_energy_ks <= 0.0:
        raise ValueError("invalid Kerr-Schild teaching-disc emission energy")
    redshift_ks = 1.0 / emitted_energy_ks
    relative_error = abs(redshift_bl - redshift_ks) / max(1e-30, abs(redshift_bl), abs(redshift_ks))
    emitted_intensity = 1.0
    observed_intensity = redshift_bl**3 * emitted_intensity
    emitted_frequency = emitted_energy_bl
    observed_frequency = 1.0
    observed_invariant = observed_intensity / observed_frequency**3
    emitted_invariant = emitted_intensity / emitted_frequency**3
    invariant_error = abs(observed_invariant - emitted_invariant)
    invariant_relative_error = invariant_error / max(
        1e-30, abs(observed_invariant), abs(emitted_invariant)
    )
    return {
        "spinA": spin,
        "inclinationDeg": inclination_deg,
        "sampleIndex": sample_index,
        "emissionRadiusM": emission_radius,
        "iscoRadiusM": isco_radius(spin),
        "imageOrder": 0,
        "redshiftFactorBoyerLindquist": redshift_bl,
        "redshiftFactorKerrSchild": redshift_ks,
        "redshiftRelativeError": relative_error,
        "intensityInvariantAbsoluteError": invariant_error,
        "intensityInvariantRelativeError": invariant_relative_error,
        "futureDirectedEmission": True,
        "emitter": {"omega": omega, "uT": ut},
    }


def ks_covariant_metric_and_connection(position: np.ndarray, spin: float):
    inverse, d_inverse_spatial = KS.inverse_metric_with_derivatives(*position, spin)
    covariant = np.linalg.inv(inverse)
    d_covariant = np.zeros((4, 4, 4))
    for axis in range(3):
        d_covariant[axis + 1] = -covariant @ d_inverse_spatial[axis] @ covariant
    connection = np.zeros((4, 4, 4))
    for mu in range(4):
        for alpha in range(4):
            for beta in range(4):
                connection[mu, alpha, beta] = 0.5 * sum(
                    inverse[mu, nu] * (
                        d_covariant[alpha, nu, beta]
                        + d_covariant[beta, nu, alpha]
                        - d_covariant[nu, alpha, beta]
                    )
                    for nu in range(4)
                )
    return inverse, d_inverse_spatial, covariant, connection


def initial_polarization_bl(frame: dict) -> np.ndarray:
    direction = np.asarray(frame["localDirection"], dtype=float)
    reference = np.array([0.0, 0.0, 1.0])
    if abs(float(np.dot(direction, reference))) > 0.92:
        reference = np.array([0.0, 1.0, 0.0])
    polarization = np.cross(direction, reference)
    polarization /= np.linalg.norm(polarization)
    tetrad = np.asarray(frame["tetradContravariant"], dtype=float)
    return tetrad[:, 1:] @ polarization


def kerr_schild_to_bl(position: np.ndarray, spin: float) -> tuple[float, float, float, np.ndarray]:
    radius, _ = KS.kerr_radius_and_gradient(*position, spin)
    theta = math.acos(max(-1.0, min(1.0, position[2] / radius)))
    sin_theta = max(1e-15, math.sin(theta))
    denominator = radius * radius + spin * spin
    cos_phi = (radius * position[0] + spin * position[1]) / (denominator * sin_theta)
    sin_phi = (radius * position[1] - spin * position[0]) / (denominator * sin_theta)
    ks_azimuth = math.atan2(sin_phi, cos_phi)
    _, jacobian = bl_to_cartesian_ks_jacobian(spin, radius, theta, ks_azimuth)
    return radius, theta, ks_azimuth, jacobian


def penrose_walker_constant(spin: float, radius: float, theta: float, wave: np.ndarray, polarization: np.ndarray) -> complex:
    sin_theta = math.sin(theta)
    a_term = (
        wave[0] * polarization[1] - wave[1] * polarization[0]
        + spin * sin_theta * sin_theta * (wave[1] * polarization[3] - wave[3] * polarization[1])
    )
    b_term = sin_theta * (
        (radius * radius + spin * spin) * (wave[3] * polarization[2] - wave[2] * polarization[3])
        - spin * (wave[0] * polarization[2] - wave[2] * polarization[0])
    )
    return complex(a_term, -b_term) * complex(radius, -spin * math.cos(theta))


def transport_polarization(spin: float, inclination_deg: float, direction: np.ndarray, args) -> dict:
    theta = math.radians(max(1e-3, inclination_deg))
    initial, frame = zamo_cartesian_ks_state(spin, 50.0, theta, direction)
    _, observer_jacobian = bl_to_cartesian_ks_jacobian(spin, 50.0, theta, 0.0)
    f_bl_initial = initial_polarization_bl(frame)
    f_ks_initial = observer_jacobian @ f_bl_initial
    state_initial = np.concatenate((initial, f_ks_initial))

    def derivative(_, state):
        position = state[1:4]
        momentum = state[4:8]
        polarization = state[8:12]
        inverse, d_inverse, _, connection = ks_covariant_metric_and_connection(position, spin)
        wave = inverse @ momentum
        dp = -0.5 * np.einsum("i,kij,j->k", momentum, d_inverse, momentum)
        df = -np.einsum("mab,a,b->m", connection, wave, polarization)
        return np.concatenate((wave, [0.0], dp, df))

    def disk_crossing(_, state):
        return state[3]

    disk_crossing.terminal = True
    disk_crossing.direction = -1

    def captured(_, state):
        radius, _ = KS.kerr_radius_and_gradient(*state[1:4], spin)
        return radius - (outer_horizon(spin) + 1e-5)

    captured.terminal = True
    captured.direction = -1
    solution = solve_ivp(
        derivative,
        (0.0, args.max_affine),
        state_initial,
        method="DOP853",
        rtol=args.rtol,
        atol=args.atol,
        max_step=args.max_step,
        events=(disk_crossing, captured),
    )
    terminal = solution.y[:, -1]
    inverse_initial = KS.inverse_metric(*initial[1:4], spin)
    wave_ks_initial = inverse_initial @ initial[4:8]
    wave_bl_initial = np.linalg.solve(observer_jacobian, wave_ks_initial)
    kappa_initial = penrose_walker_constant(spin, 50.0, theta, wave_bl_initial, f_bl_initial)
    radius, terminal_theta, _, terminal_jacobian = kerr_schild_to_bl(terminal[1:4], spin)
    inverse_terminal = KS.inverse_metric(*terminal[1:4], spin)
    wave_bl_terminal = np.linalg.solve(terminal_jacobian, inverse_terminal @ terminal[4:8])
    f_bl_terminal = np.linalg.solve(terminal_jacobian, terminal[8:12])
    kappa_terminal = penrose_walker_constant(spin, radius, terminal_theta, wave_bl_terminal, f_bl_terminal)
    phase_error = math.degrees(abs(math.atan2(
        (kappa_terminal / kappa_initial).imag,
        (kappa_terminal / kappa_initial).real,
    ))) if abs(kappa_initial) > 1e-30 else math.inf
    metric_terminal = np.linalg.inv(inverse_terminal)
    orthogonality = abs(float((inverse_terminal @ terminal[4:8]) @ metric_terminal @ terminal[8:12]))
    status = "disk-hit" if len(solution.t_events[0]) else "captured" if len(solution.t_events[1]) else "max-affine" if solution.success else "invalid"
    return {
        "spinA": spin,
        "inclinationDeg": inclination_deg,
        "screenDirection": np.asarray(frame["localDirection"]).tolist(),
        "status": status,
        "emissionRadiusM": radius if status == "disk-hit" else None,
        "imageOrder": int(abs(float(terminal_theta - theta)) // math.pi),
        "evpaErrorDeg": phase_error,
        "wavePolarizationOrthogonality": orthogonality,
        "functionEvaluations": int(solution.nfev),
    }


def canonical_hash(document: dict) -> str:
    return hashlib.sha256(json.dumps(document, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas Kerr V5 radiative transfer cross validation")
    parser.add_argument("--output", default="dist/science/kerr-radiative-transfer-v5.json")
    parser.add_argument("--samples-per-configuration", type=int, default=16)
    parser.add_argument("--transport-rays-per-configuration", type=int, default=1)
    parser.add_argument("--rtol", type=float, default=3e-10)
    parser.add_argument("--atol", type=float, default=3e-12)
    parser.add_argument("--max-step", type=float, default=0.08)
    parser.add_argument("--max-affine", type=float, default=70.0)
    args = parser.parse_args()
    samples_per_configuration = max(1, args.samples_per_configuration)
    algebraic = [
        algebraic_transfer_sample(spin, inclination, index, samples_per_configuration)
        for spin in SPINS for inclination in INCLINATIONS_DEG
        for index in range(samples_per_configuration)
    ]
    transport_count = max(0, min(samples_per_configuration, args.transport_rays_per_configuration))
    polarization = []
    for spin in SPINS:
        for inclination in INCLINATIONS_DEG:
            for index in range(transport_count):
                phase = (index + 0.5) / max(1, transport_count)
                direction = np.array([-1.0, 0.12 * math.sin(2 * math.pi * phase), 0.16 * math.cos(2 * math.pi * phase)])
                polarization.append(transport_polarization(spin, inclination, direction, args))
    disk_hits = [sample for sample in polarization if sample["status"] == "disk-hit"]
    max_redshift_error = max(sample["redshiftRelativeError"] for sample in algebraic)
    max_invariant_error = max(sample["intensityInvariantAbsoluteError"] for sample in algebraic)
    max_invariant_relative_error = max(sample["intensityInvariantRelativeError"] for sample in algebraic)
    max_evpa_error = max((sample["evpaErrorDeg"] for sample in disk_hits), default=None)
    stable = {
        "version": "v222-kerr-radiative-transfer-and-polarization-v5",
        "model": "analytic-Novikov-Thorne-teaching-disc",
        "modelBoundary": "analytic-novikov-thorne-teaching-disc-not-grmhd",
        "observerFrame": "exact-ZAMO-shared-v5",
        "spins": list(SPINS),
        "inclinationsDeg": list(INCLINATIONS_DEG),
        "algebraicRayCount": len(algebraic),
        "polarizationRayCount": len(polarization),
        "polarizationDiskHitCount": len(disk_hits),
        "maxRedshiftRelativeError": max_redshift_error,
        "maxIntensityInvariantAbsoluteError": max_invariant_error,
        "maxIntensityInvariantRelativeError": max_invariant_relative_error,
        "maxEvpaErrorDeg": max_evpa_error,
        "gates": {
            "atLeast256StratifiedRays": len(algebraic) >= 256,
            "redshiftBelow005": max_redshift_error < 0.005,
            "redshiftInternalBelow001": max_redshift_error < 0.001,
            "allEmissionSamplesFutureDirected": all(sample["futureDirectedEmission"] for sample in algebraic),
            "intensityInvariantPassed": max_invariant_relative_error < 1e-12,
            "polarizationCoverageAtLeast256": len(disk_hits) >= 256,
            "polarizationBelow05Deg": max_evpa_error is not None and max_evpa_error < 0.5,
            "polarizationInternalBelow01Deg": max_evpa_error is not None and max_evpa_error < 0.1,
        },
        "algebraicSamples": algebraic,
        "polarizationSamples": polarization,
        "promotionDecision": "shadow-retained",
        "defaultSolarKernel": "legacy-eih-1pn",
        "liveStateMutated": False,
        "boundary": "offline-kerr-radiative-transfer-reference-no-runtime-promotion-no-grmhd-claim",
    }
    report = {"generatedAt": datetime.now(timezone.utc).isoformat(), **stable}
    report["canonicalEvidenceSha256"] = canonical_hash(stable)
    output = (ROOT / args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "algebraicRayCount": len(algebraic),
                      "polarizationRayCount": len(polarization), "polarizationDiskHitCount": len(disk_hits),
                      "maxRedshiftRelativeError": max_redshift_error, "maxEvpaErrorDeg": max_evpa_error,
                      "gates": stable["gates"], "canonicalEvidenceSha256": report["canonicalEvidenceSha256"]}, indent=2))


if __name__ == "__main__":
    main()
