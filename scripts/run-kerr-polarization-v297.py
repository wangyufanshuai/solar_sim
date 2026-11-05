"""Formal low-memory Kerr disk-ray polarization authority for Orbit Atlas v297.

The qualified v296 geometry artifact is immutable input.  Walker--Penrose
reconstruction and direct Cartesian Kerr--Schild parallel transport share only
the disk event, photon state and emitter polarization.  No dense campaign,
runtime physics, or legacy Kerr implementation is imported or mutated.
"""

from __future__ import annotations

import argparse
import ctypes
import hashlib
import importlib.util
import json
import math
import os
import shutil
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from scipy.integrate import solve_ivp

try:
    import psutil  # type: ignore
except ImportError:  # The science venv intentionally stays minimal.
    psutil = None

ROOT = Path(__file__).resolve().parents[1]
GEOMETRY = ROOT / "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"
OUT = ROOT / "dist/science/kerr-reference-v297"
EVIDENCE = OUT / "polarization-short-gate.json"
NEGATIVE = OUT / "polarization-short-gate-negative.json"
BASE_SOURCE = ROOT / "scripts/run-kerr-authority-v291.py"

CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8"
SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037"
CARTER_FORMULATION = "carter-mino-dop853-constraint-stabilized-v296"
KS_FORMULATION = "cartesian-kerr-schild-hamiltonian-dop853-v292"
EXPECTED_DISK_RAYS = ("disk-00", "disk-01", "disk-02", "disk-03")
MINIMUM_FREE_MEMORY_GIB = 4.0
MINIMUM_FREE_DISK_GIB = 30.0
MAX_PEAK_RSS_GIB = 2.0

RELEASE_EVPA_DEG = 0.5
INTERNAL_EVPA_DEG = 0.1
RELEASE_INVARIANT = 1e-10
INTERNAL_INVARIANT = 1e-11
ENDPOINT_RESIDUAL = 1e-8


def load_base():
    spec = importlib.util.spec_from_file_location("orbit_atlas_kerr_v291_for_v297", BASE_SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v291 coordinate authority")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


BASE = load_base()


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {
            key: canonical(value[key])
            for key in sorted(value)
            if key not in {"generatedAt", "pid", "host", "absolutePath", "peakRssGiB"}
        }
    return value


def value_sha(value: Any) -> str:
    encoded = json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()
    return hashlib.sha256(encoded).hexdigest()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def preserve_attempt(path: Path) -> None:
    if not path.exists():
        return
    previous = json.loads(path.read_text(encoding="utf-8"))
    previous_sha = previous.get("evidenceSha256")
    if isinstance(previous_sha, str):
        atomic_json(path.parent / "attempts" / f"{previous_sha}.json", previous)


class PeakRssSampler:
    def __init__(self) -> None:
        self.peak = process_rss_bytes()
        self.stop_event = threading.Event()
        self.thread = threading.Thread(target=self._sample, daemon=True)

    def _sample(self) -> None:
        while not self.stop_event.wait(0.02):
            self.peak = max(self.peak, process_rss_bytes())

    def __enter__(self) -> "PeakRssSampler":
        self.thread.start()
        return self

    def __exit__(self, *_args: object) -> None:
        self.stop_event.set()
        self.thread.join()
        self.peak = max(self.peak, process_rss_bytes())

    @property
    def peak_gib(self) -> float:
        return self.peak / 1024**3


def resource_preflight() -> dict[str, Any]:
    memory_gib = available_memory_bytes() / 1024**3
    disk_gib = shutil.disk_usage(ROOT).free / 1024**3
    return {
        "freeMemoryGiB": memory_gib,
        "freeDiskGiB": disk_gib,
        "minimumFreeMemoryGiB": MINIMUM_FREE_MEMORY_GIB,
        "minimumFreeDiskGiB": MINIMUM_FREE_DISK_GIB,
        "passed": memory_gib >= MINIMUM_FREE_MEMORY_GIB and disk_gib >= MINIMUM_FREE_DISK_GIB,
    }


def available_memory_bytes() -> int:
    if psutil is not None:
        return int(psutil.virtual_memory().available)
    if os.name == "nt":
        class MemoryStatus(ctypes.Structure):
            _fields_ = [("length", ctypes.c_ulong), ("memoryLoad", ctypes.c_ulong), ("totalPhys", ctypes.c_ulonglong), ("availPhys", ctypes.c_ulonglong), ("totalPageFile", ctypes.c_ulonglong), ("availPageFile", ctypes.c_ulonglong), ("totalVirtual", ctypes.c_ulonglong), ("availVirtual", ctypes.c_ulonglong), ("availExtended", ctypes.c_ulonglong)]
        status = MemoryStatus()
        status.length = ctypes.sizeof(MemoryStatus)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            return int(status.availPhys)
    return int(os.sysconf("SC_AVPHYS_PAGES") * os.sysconf("SC_PAGE_SIZE"))


def process_rss_bytes() -> int:
    if psutil is not None:
        return int(psutil.Process(os.getpid()).memory_info().rss)
    if os.name == "nt":
        class Counters(ctypes.Structure):
            _fields_ = [("cb", ctypes.c_ulong), ("pageFaultCount", ctypes.c_ulong), ("peakWorkingSetSize", ctypes.c_size_t), ("workingSetSize", ctypes.c_size_t), ("quotaPeakPagedPoolUsage", ctypes.c_size_t), ("quotaPagedPoolUsage", ctypes.c_size_t), ("quotaPeakNonPagedPoolUsage", ctypes.c_size_t), ("quotaNonPagedPoolUsage", ctypes.c_size_t), ("pagefileUsage", ctypes.c_size_t), ("peakPagefileUsage", ctypes.c_size_t)]
        counters = Counters()
        counters.cb = ctypes.sizeof(Counters)
        process = ctypes.windll.kernel32.GetCurrentProcess()
        if ctypes.windll.psapi.GetProcessMemoryInfo(process, ctypes.byref(counters), counters.cb):
            return int(counters.workingSetSize)
    try:
        import resource
        return int(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * (1024 if os.name != "darwin" else 1))
    except (ImportError, AttributeError):
        return 0


def load_geometry() -> dict[str, Any]:
    document = json.loads(GEOMETRY.read_text(encoding="utf-8"))
    expected = document.get("evidenceSha256")
    unsigned = {key: value for key, value in document.items() if key != "evidenceSha256"}
    if not isinstance(expected, str) or value_sha(unsigned) != expected:
        raise RuntimeError("v296 geometry canonical SHA mismatch")
    if document.get("geometryRedshiftQualified") is not True:
        raise RuntimeError("v296 geometry is not qualified")
    return document


def emitter_four_velocity(radius: float, spin: float) -> np.ndarray:
    metric = BASE.bl_metric_cov(radius, math.pi / 2.0, spin)
    omega = 1.0 / (radius**1.5 + spin)
    normalization = -(metric[0, 0] + 2.0 * omega * metric[0, 3] + omega * omega * metric[3, 3])
    if normalization <= 0.0:
        raise RuntimeError("nonphysical circular emitter")
    u_t = 1.0 / math.sqrt(normalization)
    return np.asarray((u_t, 0.0, 0.0, omega * u_t), dtype=float)


def projected_disk_normal_polarization(
    coordinates: np.ndarray, wavevector: np.ndarray, spin: float
) -> tuple[np.ndarray, np.ndarray, dict[str, float]]:
    radius = float(coordinates[1])
    metric = BASE.bl_metric_cov(radius, float(coordinates[2]), spin)
    emitter = emitter_four_velocity(radius, spin)
    frequency = -float(emitter @ metric @ wavevector)
    if frequency <= 1e-14:
        raise RuntimeError("emitter photon frequency is nonpositive or degenerate")
    direction = wavevector / frequency - emitter
    normal = np.asarray((0.0, 0.0, 1.0 / radius, 0.0), dtype=float)
    projection = normal - float(normal @ metric @ direction) * direction
    projection += float(projection @ metric @ emitter) * emitter
    norm = float(projection @ metric @ projection)
    if norm <= 1e-20:
        raise RuntimeError("projected disk-normal polarization is degenerate")
    polarization = projection / math.sqrt(norm)
    residuals = {
        "waveOrthogonality": abs(float(polarization @ metric @ wavevector)),
        "emitterOrthogonality": abs(float(polarization @ metric @ emitter)),
        "norm": abs(float(polarization @ metric @ polarization) - 1.0),
    }
    return emitter, polarization, residuals


def walker_penrose_constant(
    spin: float, radius: float, theta: float, wavevector: np.ndarray, polarization: np.ndarray
) -> complex:
    sine = math.sin(theta)
    a_term = (
        wavevector[0] * polarization[1]
        - wavevector[1] * polarization[0]
        + spin * sine * sine * (wavevector[1] * polarization[3] - wavevector[3] * polarization[1])
    )
    b_term = sine * (
        (radius * radius + spin * spin) * (wavevector[3] * polarization[2] - wavevector[2] * polarization[3])
        - spin * (wavevector[0] * polarization[2] - wavevector[2] * polarization[0])
    )
    return complex(float(a_term), float(-b_term)) * complex(radius, -spin * math.cos(theta))


def wp_coefficients(spin: float, radius: float, theta: float, wavevector: np.ndarray) -> np.ndarray:
    coefficients = []
    for index in range(4):
        basis = np.zeros(4, dtype=float)
        basis[index] = 1.0
        coefficients.append(walker_penrose_constant(spin, radius, theta, wavevector, basis))
    return np.asarray(coefficients, dtype=complex)


def observer_gauge(
    coordinates: np.ndarray, wavevector: np.ndarray, polarization: np.ndarray, observer: np.ndarray, spin: float
) -> np.ndarray:
    metric = BASE.bl_metric_cov(float(coordinates[1]), float(coordinates[2]), spin)
    denominator = float(observer @ metric @ wavevector)
    if abs(denominator) < 1e-14:
        raise RuntimeError("observer gauge is degenerate")
    adjusted = polarization - float(observer @ metric @ polarization) / denominator * wavevector
    norm = float(adjusted @ metric @ adjusted)
    if norm <= 0.0:
        raise RuntimeError("observer polarization is non-spacelike")
    return adjusted / math.sqrt(norm)


def reconstruct_walker_penrose(
    coordinates: np.ndarray,
    wavevector: np.ndarray,
    observer: np.ndarray,
    constant: complex,
    spin: float,
) -> np.ndarray:
    metric = BASE.bl_metric_cov(float(coordinates[1]), float(coordinates[2]), spin)
    coefficients = wp_coefficients(spin, float(coordinates[1]), float(coordinates[2]), wavevector)
    matrix = np.vstack((metric @ wavevector, metric @ observer, coefficients.real, coefficients.imag))
    target = np.asarray((0.0, 0.0, constant.real, constant.imag), dtype=float)
    condition = float(np.linalg.cond(matrix))
    if not math.isfinite(condition) or condition > 1e14:
        raise RuntimeError("Walker-Penrose observer reconstruction is ill-conditioned")
    return observer_gauge(coordinates, wavevector, np.linalg.solve(matrix, target), observer, spin)


def ingoing_offsets(radius: float, spin: float) -> tuple[float, float]:
    root = math.sqrt(max(0.0, 1.0 - spin * spin))
    r_plus, r_minus = 1.0 + root, 1.0 - root
    difference = r_plus - r_minus
    if difference <= 1e-12:
        raise RuntimeError("extremal Kerr is outside the v297 fixture domain")

    def log_ratio(horizon: float) -> float:
        return math.log(abs((radius - horizon) / (BASE.R_OBSERVER - horizon)))

    time_offset = 2.0 * r_plus / difference * log_ratio(r_plus) - 2.0 * r_minus / difference * log_ratio(r_minus)
    azimuth_offset = spin / difference * (log_ratio(r_plus) - log_ratio(r_minus))
    return time_offset, azimuth_offset


def bl_event_to_ks(coordinates: np.ndarray, spin: float) -> tuple[np.ndarray, np.ndarray]:
    radius, theta, phi_bl = float(coordinates[1]), float(coordinates[2]), float(coordinates[3])
    time_offset, azimuth_offset = ingoing_offsets(radius, spin)
    phi_ks = phi_bl + azimuth_offset
    transformed, jacobian = BASE.bl_to_ks_jacobian(radius, theta, spin, phi_ks)
    transformed[0] = float(coordinates[0]) + time_offset
    return transformed, jacobian


def ks_event_to_bl(coordinates: np.ndarray, spin: float) -> tuple[np.ndarray, np.ndarray]:
    radius, _gradient = BASE.ks_radius_and_gradient(coordinates[1:4], spin)
    theta = math.acos(max(-1.0, min(1.0, float(coordinates[3]) / radius)))
    sine = max(1e-15, math.sin(theta))
    base = radius * radius + spin * spin
    cos_phi = (radius * float(coordinates[1]) + spin * float(coordinates[2])) / (base * sine)
    sin_phi = (radius * float(coordinates[2]) - spin * float(coordinates[1])) / (base * sine)
    phi_ks = math.atan2(sin_phi, cos_phi)
    time_offset, azimuth_offset = ingoing_offsets(radius, spin)
    phi_bl = phi_ks - azimuth_offset
    _event, jacobian = BASE.bl_to_ks_jacobian(radius, theta, spin, phi_ks)
    return np.asarray((float(coordinates[0]) - time_offset, radius, theta, phi_bl), dtype=float), jacobian


def ks_connection(position: np.ndarray, spin: float) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    metric, inverse, inverse_derivatives = BASE.ks_metric_with_derivatives(position, spin)
    covariant_derivatives = [np.zeros((4, 4), dtype=float)]
    covariant_derivatives.extend(-metric @ derivative @ metric for derivative in inverse_derivatives)
    gamma = np.zeros((4, 4, 4), dtype=float)
    for upper in range(4):
        for left in range(4):
            for right in range(4):
                gamma[upper, left, right] = 0.5 * sum(
                    inverse[upper, lower]
                    * (
                        covariant_derivatives[left][lower, right]
                        + covariant_derivatives[right][lower, left]
                        - covariant_derivatives[lower][left, right]
                    )
                    for lower in range(4)
                )
    return metric, inverse, gamma


def normalized_bilinear(left: np.ndarray, metric: np.ndarray, right: np.ndarray) -> float:
    numerator = abs(float(left @ metric @ right))
    scale = max(1.0, float(np.sum(np.abs(np.outer(left, right) * metric))))
    return numerator / scale


def direct_parallel_transport(
    coordinates_bl: np.ndarray,
    wavevector_bl: np.ndarray,
    polarization_bl: np.ndarray,
    spin: float,
    tolerance: float,
    expected_constant: complex,
) -> dict[str, Any]:
    coordinates_ks, jacobian = bl_event_to_ks(coordinates_bl, spin)
    metric_bl = BASE.bl_metric_cov(float(coordinates_bl[1]), float(coordinates_bl[2]), spin)
    covector_bl = metric_bl @ wavevector_bl
    covector_ks_forward = np.linalg.inv(jacobian).T @ covector_bl
    polarization_ks = jacobian @ polarization_bl
    initial = np.concatenate((coordinates_ks, -covector_ks_forward, polarization_ks))
    solver_tolerance = max(2.3e-14, tolerance * 1e-2)

    def rhs(_parameter: float, state: np.ndarray) -> np.ndarray:
        position = state[:4]
        covector = state[4:8]
        vector = state[8:12]
        _metric, inverse, gamma = ks_connection(position[1:4], spin)
        tangent = inverse @ covector
        _covariant, _contravariant, derivatives = BASE.ks_metric_with_derivatives(position[1:4], spin)
        momentum_derivative = np.zeros(4, dtype=float)
        for axis, derivative in enumerate(derivatives, start=1):
            momentum_derivative[axis] = -0.5 * float(covector @ derivative @ covector)
        vector_derivative = -np.einsum("mab,a,b->m", gamma, tangent, vector)
        return np.concatenate((tangent, momentum_derivative, vector_derivative))

    def observer_event(_parameter: float, state: np.ndarray) -> float:
        return float(BASE.ks_radius(*state[1:4], spin) - BASE.R_OBSERVER)

    observer_event.terminal = True
    observer_event.direction = 1
    result = solve_ivp(
        rhs,
        (0.0, 100.0),
        initial,
        method="DOP853",
        rtol=solver_tolerance,
        atol=solver_tolerance * 1e-3,
        max_step=0.05,
        events=(observer_event,),
    )
    if not result.success or len(result.t_events[0]) != 1 or not np.isfinite(result.y).all():
        return {"success": False, "failure": result.message, "stepCount": int(result.t.size)}

    sample_indices = sorted(set(np.linspace(0, result.y.shape[1] - 1, min(64, result.y.shape[1]), dtype=int).tolist()))
    null_residual = 0.0
    orthogonality_residual = 0.0
    norm_residual = 0.0
    invariant_drift = 0.0
    for index in sample_indices:
        state = result.y[:, index]
        metric, inverse, _gamma = ks_connection(state[1:4], spin)
        tangent_return = inverse @ state[4:8]
        vector = state[8:12]
        null_residual = max(null_residual, normalized_bilinear(tangent_return, metric, tangent_return))
        orthogonality_residual = max(orthogonality_residual, normalized_bilinear(tangent_return, metric, vector))
        norm_residual = max(norm_residual, abs(float(vector @ metric @ vector) - 1.0))
        coordinates_here_bl, jacobian_here = ks_event_to_bl(state[:4], spin)
        tangent_forward_bl = np.linalg.inv(jacobian_here) @ (-tangent_return)
        vector_bl = np.linalg.inv(jacobian_here) @ vector
        constant_here = walker_penrose_constant(
            spin, float(coordinates_here_bl[1]), float(coordinates_here_bl[2]), tangent_forward_bl, vector_bl
        )
        invariant_drift = max(invariant_drift, abs(constant_here - expected_constant) / max(1.0, abs(expected_constant)))

    final = result.y[:, -1]
    final_metric, final_inverse, _gamma = ks_connection(final[1:4], spin)
    final_tangent_return = final_inverse @ final[4:8]
    final_bl, final_jacobian = ks_event_to_bl(final[:4], spin)
    final_wavevector_bl = np.linalg.inv(final_jacobian) @ (-final_tangent_return)
    final_polarization_bl = np.linalg.inv(final_jacobian) @ final[8:12]

    phi_residual = abs(math.atan2(math.sin(float(final_bl[3])), math.cos(float(final_bl[3]))))
    endpoint_residual = max(
        abs(float(final_bl[0])),
        abs(float(final_bl[1]) - BASE.R_OBSERVER),
        abs(float(final_bl[2]) - BASE.THETA_OBSERVER),
        phi_residual,
    )
    return {
        "success": True,
        "coordinatesBl": final_bl,
        "wavevectorBl": final_wavevector_bl,
        "polarizationBl": final_polarization_bl,
        "nullResidualNormalized": null_residual,
        "orthogonalityResidualNormalized": orthogonality_residual,
        "normResidual": norm_residual,
        "walkerPenroseInvariantDrift": invariant_drift,
        "endpointResidual": endpoint_residual,
        "stepCount": int(result.t.size),
        "solverTolerance": solver_tolerance,
        "sampleCount": len(sample_indices),
        "finalKsNormResidual": abs(float(final[8:12] @ final_metric @ final[8:12]) - 1.0),
    }


def screen_basis(local_wavevector: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    direction = local_wavevector[1:] / local_wavevector[0]
    direction /= np.linalg.norm(direction)
    vertical_seed = np.asarray((0.0, 1.0, 0.0), dtype=float)
    vertical = vertical_seed - float(vertical_seed @ direction) * direction
    vertical /= np.linalg.norm(vertical)
    horizontal_seed = np.asarray((0.0, 0.0, -1.0), dtype=float)
    horizontal = horizontal_seed - float(horizontal_seed @ direction) * direction
    horizontal -= float(horizontal @ vertical) * vertical
    horizontal /= np.linalg.norm(horizontal)
    return vertical, horizontal


def screen_evpa_deg(
    coordinates: np.ndarray, wavevector: np.ndarray, polarization: np.ndarray, observer: np.ndarray, spin: float
) -> float:
    tetrad = BASE.zamo_tetrad(float(coordinates[1]), float(coordinates[2]), spin)
    gauged = observer_gauge(coordinates, wavevector, polarization, observer, spin)
    local_wavevector = np.linalg.inv(tetrad) @ wavevector
    local_polarization = np.linalg.inv(tetrad) @ gauged
    vertical, horizontal = screen_basis(local_wavevector)
    angle = math.degrees(math.atan2(float(local_polarization[1:] @ horizontal), float(local_polarization[1:] @ vertical)))
    return angle % 180.0


def evpa_difference(left: float, right: float) -> float:
    difference = abs(left - right) % 180.0
    return min(difference, 180.0 - difference)


def evaluate_seed(row: dict[str, Any]) -> dict[str, Any]:
    seed = row["polarizationSeed"]
    ray = BASE.FIXTURE_BY_ID[row["rayId"]]
    coordinates = np.asarray(seed["coordinatesBl"], dtype=float)
    wavevector = np.asarray(seed["wavevectorBl"], dtype=float)
    emitter, polarization, emitter_residuals = projected_disk_normal_polarization(coordinates, wavevector, ray.spin)
    constant = walker_penrose_constant(ray.spin, float(coordinates[1]), float(coordinates[2]), wavevector, polarization)
    observer_coordinates = np.asarray((0.0, BASE.R_OBSERVER, BASE.THETA_OBSERVER, 0.0), dtype=float)
    observer_tetrad = BASE.zamo_tetrad(BASE.R_OBSERVER, BASE.THETA_OBSERVER, ray.spin)
    observer = observer_tetrad[:, 0]
    expected_wavevector = BASE.initial_bl_state(ray)["momentumUp"]
    reconstructed = reconstruct_walker_penrose(observer_coordinates, expected_wavevector, observer, constant, ray.spin)
    direct = direct_parallel_transport(coordinates, wavevector, polarization, ray.spin, float(row["tolerance"]), constant)
    if not direct.get("success"):
        raise RuntimeError(f"direct parallel transport failed for {row['rayId']}: {direct.get('failure')}")
    direct_wavevector = np.asarray(direct["wavevectorBl"], dtype=float)
    direct_polarization = np.asarray(direct["polarizationBl"], dtype=float)
    direct_observer = BASE.zamo_tetrad(float(direct["coordinatesBl"][1]), float(direct["coordinatesBl"][2]), ray.spin)[:, 0]
    wp_evpa = screen_evpa_deg(observer_coordinates, expected_wavevector, reconstructed, observer, ray.spin)
    direct_evpa = screen_evpa_deg(
        np.asarray(direct["coordinatesBl"]), direct_wavevector, direct_polarization, direct_observer, ray.spin
    )
    expected_local = BASE.initial_bl_state(ray)["local"]
    direct_local = np.linalg.inv(BASE.zamo_tetrad(float(direct["coordinatesBl"][1]), float(direct["coordinatesBl"][2]), ray.spin)) @ direct_wavevector
    expected_direction = expected_local[1:] / expected_local[0]
    direct_direction = direct_local[1:] / direct_local[0]
    screen_direction_residual = float(np.max(np.abs(expected_direction - direct_direction)))
    tolerance_class = str(row["toleranceClass"])
    invariant_threshold = RELEASE_INVARIANT if tolerance_class == "release" else INTERNAL_INVARIANT
    evpa_threshold = RELEASE_EVPA_DEG if tolerance_class == "release" else INTERNAL_EVPA_DEG
    difference = evpa_difference(wp_evpa, direct_evpa)
    passed = (
        difference < evpa_threshold
        and direct["nullResidualNormalized"] < invariant_threshold
        and direct["orthogonalityResidualNormalized"] < invariant_threshold
        and direct["normResidual"] < invariant_threshold
        and direct["walkerPenroseInvariantDrift"] < invariant_threshold
        and direct["endpointResidual"] < ENDPOINT_RESIDUAL
        and screen_direction_residual < ENDPOINT_RESIDUAL
        and max(emitter_residuals.values()) < RELEASE_INVARIANT
    )
    return {
        "rayId": row["rayId"],
        "spin": row["spin"],
        "tolerance": row["tolerance"],
        "toleranceClass": tolerance_class,
        "branch": row["branch"],
        "geometryFormulation": row["formulation"],
        "emissionRadiusM": row["diskRadiusM"],
        "emitterModel": seed["emitterModel"],
        "walkerPenroseConstant": {"real": constant.real, "imaginary": constant.imag},
        "walkerPenroseEvpaDeg": wp_evpa,
        "parallelTransportEvpaDeg": direct_evpa,
        "evpaDifferenceDeg": difference,
        "emitterResiduals": emitter_residuals,
        "parallelTransport": {
            key: value
            for key, value in direct.items()
            if key not in {"coordinatesBl", "wavevectorBl", "polarizationBl"}
        },
        "screenDirectionResidual": screen_direction_residual,
        "applicability": "applicable-disk-hit",
        "passed": passed,
    }


def local_roundtrip(spin: float, theta: float, direction: np.ndarray) -> dict[str, Any]:
    radius = 12.0
    coordinates = np.asarray((0.0, radius, theta, 0.0), dtype=float)
    tetrad = BASE.zamo_tetrad(radius, theta, spin)
    local = np.concatenate(([1.0], direction / np.linalg.norm(direction)))
    wavevector = tetrad @ local
    if abs(theta - math.pi / 2.0) < 1e-12:
        emitter, polarization, residuals = projected_disk_normal_polarization(coordinates, wavevector, spin)
    else:
        observer = tetrad[:, 0]
        normal_local = np.asarray((0.0, 0.0, 1.0, 0.0), dtype=float)
        candidate = tetrad @ normal_local
        polarization = observer_gauge(coordinates, wavevector, candidate, observer, spin)
        emitter, residuals = observer, {}
    constant = walker_penrose_constant(spin, radius, theta, wavevector, polarization)
    reconstructed = reconstruct_walker_penrose(coordinates, wavevector, emitter, constant, spin)
    metric = BASE.bl_metric_cov(radius, theta, spin)
    alignment = abs(float(reconstructed @ metric @ polarization))
    return {"alignment": alignment, "residuals": residuals, "finite": bool(np.isfinite(reconstructed).all())}


def symmetry_fixtures() -> dict[str, Any]:
    schwarzschild = local_roundtrip(0.0, math.pi / 2.0, np.asarray((-0.9, 0.25, 0.15)))
    reflection_left = local_roundtrip(0.0, math.pi / 2.0, np.asarray((-0.9, 0.25, -0.15)))
    reflection_right = local_roundtrip(0.0, math.pi / 2.0, np.asarray((-0.9, 0.25, 0.15)))
    signed_negative = local_roundtrip(-0.9, math.pi / 2.0, np.asarray((-0.9, 0.25, -0.15)))
    signed_positive = local_roundtrip(0.9, math.pi / 2.0, np.asarray((-0.9, 0.25, 0.15)))

    radius = 12.0
    spin = 0.0
    coordinates = np.asarray((0.0, radius, math.pi / 2.0, 0.0), dtype=float)
    tetrad = BASE.zamo_tetrad(radius, math.pi / 2.0, spin)
    emitter = emitter_four_velocity(radius, spin)
    radial = tetrad[:, 1]
    normal = tetrad[:, 2]
    epsilon = math.radians(1.0)
    near_face_on = []
    for sign in (-1.0, 1.0):
        direction = math.cos(epsilon) * normal + sign * math.sin(epsilon) * radial
        wavevector = emitter + direction
        _emitter, polarization, residuals = projected_disk_normal_polarization(coordinates, wavevector, spin)
        near_face_on.append({"sign": sign, "finite": bool(np.isfinite(polarization).all()), "residuals": residuals})
    exact_face_on_unavailable = False
    try:
        projected_disk_normal_polarization(coordinates, emitter + normal, spin)
    except RuntimeError:
        exact_face_on_unavailable = True

    roundtrips = (schwarzschild, reflection_left, reflection_right, signed_negative, signed_positive)
    passed = (
        all(item["finite"] and item["alignment"] > 1.0 - 1e-10 for item in roundtrips)
        and all(item["finite"] and max(item["residuals"].values()) < RELEASE_INVARIANT for item in near_face_on)
        and exact_face_on_unavailable
    )
    return {
        "passed": passed,
        "schwarzschild": schwarzschild,
        "reflection": {"left": reflection_left, "right": reflection_right},
        "signedSpin": {"negative": signed_negative, "positive": signed_positive},
        "nearFaceOn": near_face_on,
        "exactFaceOn": {"applicability": "not-applicable-degenerate-emission-basis", "unavailable": exact_face_on_unavailable},
    }


def canonical_payload_for_branch_check(payload: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in payload.items() if key != "branch"}


def build_gate() -> dict[str, Any]:
    preflight = resource_preflight()
    if not preflight["passed"]:
        raise RuntimeError("v297 resource preflight failed without consuming a formal attempt")
    geometry = load_geometry()
    executions = geometry.get("executions", [])
    capture_escape = [row for row in executions if row.get("classification") in {"capture", "escape"}]
    carter_rows = [
        row
        for row in executions
        if row.get("formulation") == CARTER_FORMULATION
        and row.get("classification") == "disk-hit"
        and isinstance(row.get("polarizationSeed"), dict)
    ]
    ks_rows = [
        row for row in executions if row.get("formulation") == KS_FORMULATION and row.get("classification") == "disk-hit"
    ]
    if len(executions) != 128 or len(capture_escape) != 96 or len(carter_rows) != 16 or len(ks_rows) != 16:
        raise RuntimeError("v296 polarization input conservation failed")
    if tuple(sorted({row["rayId"] for row in carter_rows})) != EXPECTED_DISK_RAYS:
        raise RuntimeError("v296 canonical disk-ray identity mismatch")
    keys = lambda row: (row["rayId"], row["toleranceClass"], row["branch"])
    ks_by_key = {keys(row): row for row in ks_rows}
    geometry_differences = [abs(float(row["diskRadiusM"]) - float(ks_by_key[keys(row)]["diskRadiusM"])) for row in carter_rows]

    started = time.perf_counter()
    with PeakRssSampler() as sampler:
        payloads = [evaluate_seed(row) for row in carter_rows]
        fixtures = symmetry_fixtures()
    elapsed = time.perf_counter() - started

    branch_pairs: list[bool] = []
    for ray_id in EXPECTED_DISK_RAYS:
        for tolerance_class in ("release", "internal"):
            pair = [row for row in payloads if row["rayId"] == ray_id and row["toleranceClass"] == tolerance_class]
            if len(pair) != 2:
                branch_pairs.append(False)
            else:
                branch_pairs.append(
                    value_sha(canonical_payload_for_branch_check(pair[0]))
                    == value_sha(canonical_payload_for_branch_check(pair[1]))
                )
    release_rows = [row for row in payloads if row["toleranceClass"] == "release"]
    internal_rows = [row for row in payloads if row["toleranceClass"] == "internal"]
    max_release_evpa = max(row["evpaDifferenceDeg"] for row in release_rows)
    max_internal_evpa = max(row["evpaDifferenceDeg"] for row in internal_rows)
    peak_rss_gib = sampler.peak_gib
    gates = {
        "inputConservation": True,
        "allApplicableFiniteAndPassed": all(row["passed"] for row in payloads),
        "releaseEvpaBelowHalfDegree": max_release_evpa < RELEASE_EVPA_DEG,
        "internalEvpaBelowTenthDegree": max_internal_evpa < INTERNAL_EVPA_DEG,
        "branchDeterministic": all(branch_pairs),
        "symmetryFixtures": fixtures["passed"],
        "ksGeometryCrossCheck": max(geometry_differences) < 1e-10,
        "peakRssBelow2GiB": peak_rss_gib < MAX_PEAK_RSS_GIB,
        "zeroInvalidTimeout": all(row["parallelTransport"]["success"] for row in payloads),
    }
    qualified = all(gates.values())
    reasons = [name for name, passed in gates.items() if not passed]
    unsigned = {
        "version": "v297-kerr-disk-polarization-short-gate-v1",
        "generatedAt": utc(),
        "status": "full-kerr-short-authority-qualified" if qualified else "polarization-short-gate-failed",
        "qualified": qualified,
        "geometryEvidenceSha256": geometry["evidenceSha256"],
        "geometryFileSha256": file_sha(GEOMETRY),
        "baseAuthoritySourceSha256": file_sha(BASE_SOURCE),
        "sourceExecutionCount": len(executions),
        "captureEscapeNotApplicableCount": len(capture_escape),
        "sourceDiskHitExecutionCount": len(carter_rows) + len(ks_rows),
        "applicableExecutionCount": len(payloads),
        "ksGeometryCrossCheckExecutionCount": len(ks_rows),
        "uniqueDiskRayCount": len({row["rayId"] for row in payloads}),
        "payloads": payloads,
        "symmetryFixtures": fixtures,
        "thresholds": {
            "maxReleaseEvpaDifferenceDeg": max_release_evpa,
            "maxInternalEvpaDifferenceDeg": max_internal_evpa,
            "releaseEvpaDifferenceLimitDeg": RELEASE_EVPA_DEG,
            "internalEvpaDifferenceLimitDeg": INTERNAL_EVPA_DEG,
            "releaseInvariantLimit": RELEASE_INVARIANT,
            "internalInvariantLimit": INTERNAL_INVARIANT,
            "endpointResidualLimit": ENDPOINT_RESIDUAL,
            "maxKsDiskRadiusDifferenceM": max(geometry_differences),
        },
        "gates": gates,
        "failureReasons": reasons,
        "resource": {**preflight, "peakRssGiB": peak_rss_gib, "elapsedSeconds": elapsed},
        "science": {
            "emitterModel": "projected-disk-normal",
            "walkerPenroseModel": "standard-complex-kerr-walker-penrose",
            "parallelTransportModel": "independent-cartesian-kerr-schild-hamiltonian-dop853",
            "evpaPeriodDeg": 180.0,
            "defaultKernel": "legacy-eih-1pn",
            "codeSha256": CODE_SHA,
            "screenSha256": SCREEN_SHA,
            "workerPhysicsMutation": "not-applied",
            "legacyKerrMutation": "not-applied",
        },
        "release": {
            "formalProductPointer": "v263",
            "formalProductPointerAdvanced": False,
            "denseShardExecuted": False,
            "browserQualificationRun": False,
        },
        "boundary": "formal-short-authority-only-dense-campaign-remains-zero-of-49",
    }
    return {**unsigned, "evidenceSha256": value_sha(unsigned)}


def json_default(value: Any) -> Any:
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(f"unsupported JSON type: {type(value).__name__}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v297 formal Kerr disk-ray polarization gate")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--gate", action="store_true")
    group.add_argument("--fixtures", action="store_true")
    group.add_argument("--inspect", action="store_true")
    args = parser.parse_args()
    if args.inspect:
        result = {"resource": resource_preflight(), "geometryExists": GEOMETRY.exists()}
    elif args.fixtures:
        result = symmetry_fixtures()
    else:
        result = build_gate()
        preserve_attempt(EVIDENCE)
        atomic_json(EVIDENCE, result)
        if not result["qualified"]:
            preserve_attempt(NEGATIVE)
            atomic_json(NEGATIVE, result)
    print(json.dumps(result, indent=2, allow_nan=False, default=json_default))


if __name__ == "__main__":
    main()
