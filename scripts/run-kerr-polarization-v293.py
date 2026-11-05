"""Layered Kerr polarization authority for Orbit Atlas v293.

The formal gate fails closed when the v292 geometry authority is not
qualified.  The implementation contains both a Killing-Yano/Walker-Penrose
reconstruction and an independent Christoffel parallel-transport oracle so
that polarization can be qualified later without changing the geometry
artifact.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import itertools
import json
import math
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from scipy.integrate import solve_ivp

ROOT = Path(__file__).resolve().parents[1]
GEOMETRY = ROOT / "dist/science/kerr-reference-v292/geometry-redshift-short-gate.json"
OUT = ROOT / "dist/science/kerr-reference-v293"
EVIDENCE = OUT / "polarization-gate.json"
NEGATIVE = OUT / "polarization-gate-negative.json"
AUTHORITY_SOURCE = ROOT / "scripts/run-kerr-authority-v291.py"
CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8"
SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037"


def load_authority():
    spec = importlib.util.spec_from_file_location("orbit_atlas_kerr_v291_for_polarization", AUTHORITY_SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v291 authority")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


AUTHORITY = load_authority()


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "pid", "host", "absolutePath"}}
    return value


def value_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def levi_civita(indices: tuple[int, int, int, int]) -> int:
    if len(set(indices)) != 4:
        return 0
    inversions = sum(1 for left in range(4) for right in range(left + 1, 4) if indices[left] > indices[right])
    return -1 if inversions % 2 else 1


def carter_coframe(radius: float, theta: float, spin: float) -> np.ndarray:
    sigma = radius * radius + spin * spin * math.cos(theta) ** 2
    delta = radius * radius - 2.0 * radius + spin * spin
    sine = math.sin(theta)
    coframe = np.zeros((4, 4), dtype=float)
    coframe[0] = math.sqrt(delta / sigma) * np.asarray((1.0, 0.0, 0.0, -spin * sine * sine))
    coframe[1, 1] = math.sqrt(sigma / delta)
    coframe[2, 2] = math.sqrt(sigma)
    coframe[3] = sine / math.sqrt(sigma) * np.asarray((-spin, 0.0, 0.0, radius * radius + spin * spin))
    return coframe


def hodge_dual_two_form(form_cov: np.ndarray, metric_cov: np.ndarray) -> np.ndarray:
    inverse = np.linalg.inv(metric_cov)
    volume = math.sqrt(abs(float(np.linalg.det(metric_cov))))
    dual = np.zeros((4, 4), dtype=float)
    raised = inverse @ form_cov @ inverse
    for mu in range(4):
        for nu in range(4):
            total = 0.0
            for rho in range(4):
                for sigma in range(4):
                    total += 0.5 * volume * levi_civita((mu, nu, rho, sigma)) * raised[rho, sigma]
            dual[mu, nu] = total
    return dual


def killing_yano_forms(radius: float, theta: float, spin: float) -> tuple[np.ndarray, np.ndarray]:
    coframe = carter_coframe(radius, theta, spin)
    form = spin * math.cos(theta) * (np.outer(coframe[0], coframe[1]) - np.outer(coframe[1], coframe[0]))
    form += radius * (np.outer(coframe[2], coframe[3]) - np.outer(coframe[3], coframe[2]))
    metric = AUTHORITY.bl_metric_cov(radius, theta, spin)
    return form, hodge_dual_two_form(form, metric)


def emitter_four_velocity(radius: float, spin: float) -> np.ndarray:
    metric = AUTHORITY.bl_metric_cov(radius, math.pi / 2.0, spin)
    omega = 1.0 / (radius ** 1.5 + spin)
    normalization = -(metric[0, 0] + 2.0 * omega * metric[0, 3] + omega * omega * metric[3, 3])
    if normalization <= 0.0:
        raise RuntimeError("nonphysical circular emitter")
    u_t = 1.0 / math.sqrt(normalization)
    return np.asarray((u_t, 0.0, 0.0, omega * u_t), dtype=float)


def projected_disk_normal_polarization(radius: float, spin: float, wavevector: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    metric = AUTHORITY.bl_metric_cov(radius, math.pi / 2.0, spin)
    emitter = emitter_four_velocity(radius, spin)
    frequency = -float((metric @ wavevector) @ emitter)
    if abs(frequency) < 1e-14:
        raise RuntimeError("emitter photon frequency is degenerate")
    spatial_direction = wavevector / frequency - emitter
    normal = np.asarray((0.0, 0.0, 1.0 / radius, 0.0), dtype=float)
    projection = normal - float(normal @ metric @ spatial_direction) * spatial_direction
    projection -= float(projection @ metric @ emitter) * emitter / float(emitter @ metric @ emitter)
    norm = float(projection @ metric @ projection)
    if norm <= 0.0:
        raise RuntimeError("projected disk polarization is non-spacelike")
    polarization = projection / math.sqrt(norm)
    return emitter, polarization


def walker_penrose_constants(coordinates: np.ndarray, wavevector: np.ndarray, polarization: np.ndarray, spin: float) -> np.ndarray:
    form, dual = killing_yano_forms(float(coordinates[1]), float(coordinates[2]), spin)
    return np.asarray((float(wavevector @ form @ polarization), float(wavevector @ dual @ polarization)), dtype=float)


def reconstruct_polarization(
    coordinates: np.ndarray,
    wavevector: np.ndarray,
    observer: np.ndarray,
    constants: np.ndarray,
    spin: float,
) -> np.ndarray:
    metric = AUTHORITY.bl_metric_cov(float(coordinates[1]), float(coordinates[2]), spin)
    form, dual = killing_yano_forms(float(coordinates[1]), float(coordinates[2]), spin)
    matrix = np.vstack((metric @ wavevector, metric @ observer, wavevector @ form, wavevector @ dual))
    target = np.asarray((0.0, 0.0, float(constants[0]), float(constants[1])), dtype=float)
    polarization = np.linalg.solve(matrix, target)
    norm = float(polarization @ metric @ polarization)
    if norm <= 0.0:
        raise RuntimeError("Walker-Penrose reconstruction is non-spacelike")
    return polarization / math.sqrt(norm)


def screen_evpa_deg(coordinates: np.ndarray, polarization: np.ndarray, spin: float) -> float:
    radius, theta = float(coordinates[1]), float(coordinates[2])
    metric = AUTHORITY.bl_metric_cov(radius, theta, spin)
    tetrad = AUTHORITY.zamo_tetrad(radius, theta, spin)
    covector = metric @ polarization
    vertical = float(covector @ tetrad[:, 2])
    horizontal = float(covector @ (-tetrad[:, 3]))
    return math.degrees(math.atan2(horizontal, vertical)) % 180.0


def bl_metric_derivatives(radius: float, theta: float, spin: float) -> list[np.ndarray]:
    derivatives = [np.zeros((4, 4), dtype=float) for _ in range(4)]
    for coordinate, value in ((1, radius), (2, theta)):
        step = 2e-5 * max(1.0, abs(value))
        if coordinate == 1:
            samples = [AUTHORITY.bl_metric_cov(radius + multiplier * step, theta, spin) for multiplier in (2.0, 1.0, -1.0, -2.0)]
        else:
            samples = [AUTHORITY.bl_metric_cov(radius, theta + multiplier * step, spin) for multiplier in (2.0, 1.0, -1.0, -2.0)]
        derivatives[coordinate] = (-samples[0] + 8.0 * samples[1] - 8.0 * samples[2] + samples[3]) / (12.0 * step)
    return derivatives


def christoffel_bl(radius: float, theta: float, spin: float) -> np.ndarray:
    metric = AUTHORITY.bl_metric_cov(radius, theta, spin)
    inverse = np.linalg.inv(metric)
    derivatives = bl_metric_derivatives(radius, theta, spin)
    gamma = np.zeros((4, 4, 4), dtype=float)
    for upper, left, right in itertools.product(range(4), repeat=3):
        gamma[upper, left, right] = 0.5 * sum(
            inverse[upper, lower] * (derivatives[left][lower, right] + derivatives[right][lower, left] - derivatives[lower][left, right])
            for lower in range(4)
        )
    return gamma


def direct_parallel_transport(
    coordinates: np.ndarray,
    wavevector: np.ndarray,
    polarization: np.ndarray,
    spin: float,
    affine_stop: float,
    tolerance: float = 1e-10,
) -> dict[str, Any]:
    def rhs(_affine: float, state: np.ndarray) -> np.ndarray:
        position = state[:4]
        tangent = state[4:8]
        vector = state[8:12]
        gamma = christoffel_bl(float(position[1]), float(position[2]), spin)
        return np.concatenate((
            tangent,
            -np.einsum("mab,a,b->m", gamma, tangent, tangent),
            -np.einsum("mab,a,b->m", gamma, tangent, vector),
        ))

    initial = np.concatenate((coordinates, wavevector, polarization))
    result = solve_ivp(rhs, (0.0, affine_stop), initial, method="DOP853", rtol=tolerance, atol=tolerance * 1e-3, max_step=max(1e-6, affine_stop / 32.0))
    final = result.y[:, -1]
    metric = AUTHORITY.bl_metric_cov(float(final[1]), float(final[2]), spin)
    return {
        "success": bool(result.success and np.isfinite(final).all()),
        "coordinates": final[:4],
        "wavevector": final[4:8],
        "polarization": final[8:12],
        "orthogonalityResidual": abs(float(final[8:12] @ metric @ final[4:8])),
        "normResidual": abs(float(final[8:12] @ metric @ final[8:12]) - 1.0),
        "stepCount": int(result.t.size),
    }


def implementation_self_test() -> dict[str, Any]:
    radius, theta, spin = 12.0, math.pi / 2.0, 0.0
    coordinates = np.asarray((0.0, radius, theta, 0.0), dtype=float)
    tetrad = AUTHORITY.zamo_tetrad(radius, theta, spin)
    wavevector = tetrad @ np.asarray((1.0, -math.sqrt(0.99), 0.1, 0.0), dtype=float)
    emitter, polarization = projected_disk_normal_polarization(radius, spin, wavevector)
    constants = walker_penrose_constants(coordinates, wavevector, polarization, spin)
    reconstructed = reconstruct_polarization(coordinates, wavevector, emitter, constants, spin)
    metric = AUTHORITY.bl_metric_cov(radius, theta, spin)
    alignment = abs(float(reconstructed @ metric @ polarization))
    transported = direct_parallel_transport(coordinates, wavevector, polarization, spin, 1e-4, 1e-11)
    passed = alignment > 1.0 - 1e-10 and transported["success"] and transported["orthogonalityResidual"] < 1e-8 and transported["normResidual"] < 1e-8
    return {
        "passed": passed,
        "walkerPenroseRoundtripAlignment": alignment,
        "directTransportOrthogonalityResidual": transported["orthogonalityResidual"],
        "directTransportNormResidual": transported["normResidual"],
        "directTransportStepCount": transported["stepCount"],
        "evpaDeg": screen_evpa_deg(coordinates, reconstructed, spin),
        "boundary": "implementation-fixture-not-formal-polarization-qualification",
    }


def load_geometry() -> dict[str, Any] | None:
    if not GEOMETRY.exists():
        return None
    document = json.loads(GEOMETRY.read_text(encoding="utf-8"))
    expected = document.get("evidenceSha256")
    unsigned = {key: value for key, value in document.items() if key != "evidenceSha256"}
    if not isinstance(expected, str) or value_sha(unsigned) != expected:
        return None
    return document


def build_gate() -> dict[str, Any]:
    geometry = load_geometry()
    self_test = implementation_self_test()
    geometry_qualified = geometry is not None and geometry.get("geometryRedshiftQualified") is True
    reasons: list[str] = []
    if not geometry_qualified:
        reasons.append("blocked-by-v292-geometry")
    if not self_test["passed"]:
        reasons.append("polarization-implementation-self-test-failed")
    # Formal disk-ray propagation is deliberately fail-closed until geometry
    # qualifies; no placeholder EVPA values are emitted.
    qualified = False
    if geometry_qualified:
        reasons.append("formal-disk-ray-polarization-campaign-not-run")
    unsigned = {
        "version": "v293-kerr-polarization-gate-v1",
        "generatedAt": utc(),
        "status": "blocked-by-geometry" if not geometry_qualified else "polarization-failed",
        "qualified": qualified,
        "geometryEvidenceSha256": geometry.get("evidenceSha256") if geometry else None,
        "applicableExecutionCount": 0,
        "payloads": [],
        "implementationSelfTest": self_test,
        "failureReasons": reasons,
        "thresholds": {"releaseEvpaDifferenceDeg": 0.5, "internalEvpaDifferenceDeg": 0.1},
        "science": {"defaultKernel": "legacy-eih-1pn", "codeSha256": CODE_SHA, "screenSha256": SCREEN_SHA, "workerPhysicsMutation": "not-applied", "legacyKerrMutation": "not-applied"},
        "release": {"formalProductPointer": "v263", "formalProductPointerAdvanced": False, "denseShardExecuted": False},
        "boundary": "layered-polarization-fails-closed-without-qualified-geometry",
    }
    return {**unsigned, "evidenceSha256": value_sha(unsigned)}


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v293 layered Kerr polarization authority")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--gate", action="store_true")
    group.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        result = implementation_self_test()
    else:
        result = build_gate()
        atomic_json(EVIDENCE, result)
        if not result["qualified"]:
            atomic_json(NEGATIVE, result)
    print(json.dumps(result, indent=2, default=lambda value: value.tolist() if isinstance(value, np.ndarray) else value))


if __name__ == "__main__":
    main()
