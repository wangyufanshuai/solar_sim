from __future__ import annotations

import gc
import hashlib
import json
import math
import os
import platform
import shutil
import sys
import ctypes
import ctypes.wintypes
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import scipy
from scipy.interpolate import CubicSpline, PchipInterpolator
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import spsolve
from scipy.special import roots_legendre

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "dist" / "science" / "kerr-scattering-atmosphere-v407" / "short-gate.json"
OUTPUT = ROOT / "dist" / "science" / "kerr-scattering-oracle-v408" / "numerical-oracle.json"
V407_ARTIFACT_SHA256 = "3b493dbf281acc6c93b72d6faaed70ec89e1b2aa12e8f3633b3bf708363c9ae7"
ADS_SOURCE_SHA256 = "e6f53fb301aca1378d373c13388966e8eccf923660aafd73670151028cbc0f4b"
VERSION = "v408-kerr-scattering-discrete-ordinates-oracle-v1"
RAY_IDS = ("disk-00", "disk-01", "disk-02", "disk-03")
CURVE_MU_MIN = 0.05
CURVE_MU_MAX = 0.95
CURVE_SAMPLE_COUNT = 181
MINIMUM_FREE_MEMORY_GIB = 3.0
MINIMUM_FREE_DISK_GIB = 30.0
MAXIMUM_PEAK_RSS_GIB = 2.0
EQUATION_TEXT = "mu*dI(tau,mu)/dtau+I(tau,mu)=(3/8)*integral[-1,1]K(mu,mu_prime)I(tau,mu_prime)dmu_prime"
KERNEL_TEXT = "[[2(1-mu^2)(1-mu_prime^2)+mu^2*mu_prime^2,mu^2],[mu_prime^2,1]]"


@dataclass(frozen=True)
class SolverConfig:
    id: str
    angle_count: int
    depth_count: int
    tau_max: float


@dataclass
class SolverResult:
    config: SolverConfig
    mu: np.ndarray
    intensity_l: np.ndarray
    intensity_r: np.ndarray
    polarization: np.ndarray
    linear_system_residual: float
    relative_flux_drift: float
    kernel_equilibrium_residual: float
    minimum_intensity: float
    matrix_shape: tuple[int, int]
    matrix_nnz: int


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in {"generatedAt", "evidenceSha256", "availableMemoryGiBBefore", "freeDiskGiBBefore", "peakRssGiB"}}
    return value


def canonical_sha(value: Any) -> str:
    encoded = json.dumps(canonicalize(value), sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def available_memory_gib() -> float:
    if os.name == "nt":
        class MemoryStatus(ctypes.Structure):
            _fields_ = [("length", ctypes.wintypes.DWORD), ("memory_load", ctypes.wintypes.DWORD), ("total_phys", ctypes.c_ulonglong), ("available_phys", ctypes.c_ulonglong), ("total_page_file", ctypes.c_ulonglong), ("available_page_file", ctypes.c_ulonglong), ("total_virtual", ctypes.c_ulonglong), ("available_virtual", ctypes.c_ulonglong), ("available_extended", ctypes.c_ulonglong)]
        status = MemoryStatus()
        status.length = ctypes.sizeof(MemoryStatus)
        if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
            return float(status.available_phys) / 2**30
    try:
        return float(os.sysconf("SC_AVPHYS_PAGES") * os.sysconf("SC_PAGE_SIZE")) / 2**30
    except (AttributeError, ValueError):
        return 0.0


def free_disk_gib() -> float:
    return shutil.disk_usage(ROOT).free / 2**30


def peak_rss_gib() -> float:
    if os.name == "nt":
        class Counters(ctypes.Structure):
            _fields_ = [("cb", ctypes.wintypes.DWORD), ("page_fault_count", ctypes.wintypes.DWORD), ("peak_working_set_size", ctypes.c_size_t), ("working_set_size", ctypes.c_size_t), ("quota_peak_paged_pool_usage", ctypes.c_size_t), ("quota_paged_pool_usage", ctypes.c_size_t), ("quota_peak_non_paged_pool_usage", ctypes.c_size_t), ("quota_non_paged_pool_usage", ctypes.c_size_t), ("pagefile_usage", ctypes.c_size_t), ("peak_pagefile_usage", ctypes.c_size_t)]
        counters = Counters()
        counters.cb = ctypes.sizeof(Counters)
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        psapi = ctypes.WinDLL("psapi", use_last_error=True)
        kernel32.GetCurrentProcess.restype = ctypes.wintypes.HANDLE
        psapi.GetProcessMemoryInfo.argtypes = (ctypes.wintypes.HANDLE, ctypes.POINTER(Counters), ctypes.wintypes.DWORD)
        psapi.GetProcessMemoryInfo.restype = ctypes.wintypes.BOOL
        if psapi.GetProcessMemoryInfo(kernel32.GetCurrentProcess(), ctypes.byref(counters), counters.cb):
            return float(counters.peak_working_set_size) / 2**30
    try:
        import resource
        return float(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss) / (1 if sys.platform == "darwin" else 1024)
    except (ImportError, AttributeError):
        return 0.0


def atomic_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def load_v407() -> dict[str, Any]:
    artifact = json.loads(INPUT.read_text(encoding="utf-8"))
    # The TypeScript v407 builder/server is the canonical JSON serializer. Python's
    # float spelling is intentionally not used to recompute that cross-language SHA.
    if artifact.get("artifactSha256") != V407_ARTIFACT_SHA256:
        raise RuntimeError("v408-v407-canonical-lock")
    view = artifact.get("view", {})
    if view.get("status") != "qualified-sparse-scattering-atmosphere-approximation":
        raise RuntimeError("v408-v407-status")
    records = view.get("angleAudit", {}).get("records", [])
    if [record.get("rayId") for record in records] != list(RAY_IDS):
        raise RuntimeError("v408-v407-ray-identity")
    if view.get("model", {}).get("exactHFunctionTableAccuracy") != "not-qualified":
        raise RuntimeError("v408-v407-boundary")
    return artifact


def scattering_block(mu: np.ndarray, weights: np.ndarray) -> np.ndarray:
    angle_count = len(mu)
    block = np.empty((2 * angle_count, 2 * angle_count), dtype=np.float64)
    for i, value in enumerate(mu):
        value2 = value * value
        for j, source in enumerate(mu):
            source2 = source * source
            kernel = (
                (2.0 * (1.0 - value2) * (1.0 - source2) + value2 * source2, value2),
                (source2, 1.0),
            )
            for polarization_out in range(2):
                for polarization_in in range(2):
                    block[2 * i + polarization_out, 2 * j + polarization_in] = 0.375 * weights[j] * kernel[polarization_out][polarization_in]
    return block


def solve(config: SolverConfig) -> SolverResult:
    if config.angle_count % 2 or config.angle_count < 8 or config.depth_count < 3 or config.tau_max <= 0:
        raise RuntimeError("v408-solver-config")
    mu, weights = roots_legendre(config.angle_count)
    source = scattering_block(mu, weights)
    block_size = 2 * config.angle_count
    depth_interval_count = config.depth_count - 1
    raw_count = block_size + depth_interval_count * block_size * (2 + 2 * block_size)
    rows = np.empty(raw_count, dtype=np.int32)
    columns = np.empty(raw_count, dtype=np.int32)
    data = np.empty(raw_count, dtype=np.float64)
    right_hand_side = np.zeros(config.depth_count * block_size, dtype=np.float64)
    local_columns = np.arange(block_size, dtype=np.int32)
    delta_tau = config.tau_max / depth_interval_count
    cursor = 0

    def index(depth: int, angle: int, polarization: int) -> int:
        return depth * block_size + 2 * angle + polarization

    for angle, direction in enumerate(mu):
        for polarization in range(2):
            local_row = 2 * angle + polarization
            boundary_depth = 0 if direction > 0 else config.depth_count - 1
            boundary_row = index(boundary_depth, angle, polarization)
            rows[cursor] = boundary_row
            columns[cursor] = boundary_row
            data[cursor] = 1.0
            right_hand_side[boundary_row] = 0.0 if direction > 0 else 1.0
            cursor += 1
            for depth in range(depth_interval_count):
                row = index(depth + 1, angle, polarization) if direction > 0 else index(depth, angle, polarization)
                rows[cursor:cursor + 2] = row
                columns[cursor:cursor + 2] = (index(depth + 1, angle, polarization), index(depth, angle, polarization))
                data[cursor:cursor + 2] = (direction / delta_tau + 0.5, -direction / delta_tau + 0.5)
                cursor += 2
                rows[cursor:cursor + block_size] = row
                columns[cursor:cursor + block_size] = depth * block_size + local_columns
                data[cursor:cursor + block_size] = -0.5 * source[local_row]
                cursor += block_size
                rows[cursor:cursor + block_size] = row
                columns[cursor:cursor + block_size] = (depth + 1) * block_size + local_columns
                data[cursor:cursor + block_size] = -0.5 * source[local_row]
                cursor += block_size
    if cursor != raw_count:
        raise RuntimeError("v408-sparse-assembly-count")
    matrix = coo_matrix((data, (rows, columns)), shape=(config.depth_count * block_size, config.depth_count * block_size)).tocsr()
    solution = spsolve(matrix, right_hand_side)
    residual = matrix @ solution - right_hand_side
    linear_system_residual = float(np.max(np.abs(residual)) / max(1.0, float(np.max(np.abs(right_hand_side)))))
    field = solution.reshape(config.depth_count, config.angle_count, 2)
    flux = np.sum(weights[np.newaxis, :] * mu[np.newaxis, :] * np.sum(field, axis=2), axis=1)
    relative_flux_drift = float(np.max(np.abs(flux - np.mean(flux))) / max(1e-300, float(np.max(np.abs(flux)))))
    kernel_equilibrium_residual = float(np.max(np.abs(source @ np.ones(block_size) - 1.0)))
    outgoing = np.where(mu < 0)[0]
    reference_mu = -mu[outgoing][::-1]
    intensity_l = field[0, outgoing, 0][::-1]
    intensity_r = field[0, outgoing, 1][::-1]
    polarization = np.abs((intensity_l - intensity_r) / (intensity_l + intensity_r))
    minimum_intensity = float(np.min(field))
    if not all(np.all(np.isfinite(array)) for array in (solution, reference_mu, intensity_l, intensity_r, polarization, flux)):
        raise RuntimeError("v408-non-finite")
    if minimum_intensity < -1e-12 or np.any(np.diff(reference_mu) <= 0) or np.any(np.diff(polarization) > 1e-10):
        raise RuntimeError("v408-physical-solution")
    result = SolverResult(config=config, mu=reference_mu, intensity_l=intensity_l, intensity_r=intensity_r, polarization=polarization, linear_system_residual=linear_system_residual, relative_flux_drift=relative_flux_drift, kernel_equilibrium_residual=kernel_equilibrium_residual, minimum_intensity=minimum_intensity, matrix_shape=matrix.shape, matrix_nnz=int(matrix.nnz))
    del rows, columns, data, matrix, solution, field, residual, flux, source
    gc.collect()
    return result


def pchip(result: SolverResult, values: np.ndarray) -> np.ndarray:
    return np.asarray(PchipInterpolator(result.mu, result.polarization, extrapolate=False)(values), dtype=np.float64)


def cubic(result: SolverResult, values: np.ndarray) -> np.ndarray:
    return np.asarray(CubicSpline(result.mu, result.polarization, extrapolate=False)(values), dtype=np.float64)


def v407_fraction(mu_emission: np.ndarray) -> np.ndarray:
    return 0.1171 * (1.0 - mu_emission) / (1.0 + 3.582 * mu_emission)


def result_summary(result: SolverResult) -> dict[str, Any]:
    return {
        "id": result.config.id,
        "angleCount": result.config.angle_count,
        "depthCount": result.config.depth_count,
        "tauMax": result.config.tau_max,
        "minimumOutgoingMu": float(result.mu[0]),
        "maximumOutgoingMu": float(result.mu[-1]),
        "matrixShape": list(result.matrix_shape),
        "matrixNnz": result.matrix_nnz,
        "linearSystemResidual": result.linear_system_residual,
        "relativeFluxDrift": result.relative_flux_drift,
        "kernelEquilibriumResidual": result.kernel_equilibrium_residual,
        "minimumIntensity": result.minimum_intensity,
    }


def main() -> int:
    memory_before = available_memory_gib()
    disk_before = free_disk_gib()
    if memory_before < MINIMUM_FREE_MEMORY_GIB or disk_before < MINIMUM_FREE_DISK_GIB:
        print(json.dumps({"status": "resource-preflight-not-passed", "attemptConsumed": False, "availableMemoryGiB": memory_before, "freeDiskGiB": disk_before}, indent=2))
        return 2
    v407 = load_v407()
    records = v407["view"]["angleAudit"]["records"]
    ray_mu = np.asarray([float(record["muEmission"]) for record in records], dtype=np.float64)
    source_fraction = np.asarray([float(record["linearPolarizationFraction"]) for record in records], dtype=np.float64)

    configs = (
        SolverConfig("production-n80-d121-t20", 80, 121, 20.0),
        SolverConfig("deterministic-replay-n80-d121-t20", 80, 121, 20.0),
        SolverConfig("angular-cross-check-n64-d121-t20", 64, 121, 20.0),
        SolverConfig("spatial-cross-check-n48-d201-t20", 48, 201, 20.0),
        SolverConfig("half-space-cross-check-n48-d241-t40", 48, 241, 40.0),
        SolverConfig("shared-cross-check-n48-d121-t20", 48, 121, 20.0),
    )
    solved = [solve(config) for config in configs]
    production, replay, angular, spatial, half_space, shared = solved
    production_ray = pchip(production, ray_mu)
    replay_ray = pchip(replay, ray_mu)
    angular_ray = pchip(angular, ray_mu)
    spatial_ray = pchip(spatial, ray_mu)
    half_space_ray = pchip(half_space, ray_mu)
    shared_ray = pchip(shared, ray_mu)
    cubic_ray = cubic(production, ray_mu)
    replay_difference = float(np.max(np.abs(production_ray - replay_ray)))

    ray_comparisons = []
    for index, ray_id in enumerate(RAY_IDS):
        components = {
            "uAngularAbsolute": float(abs(production_ray[index] - angular_ray[index])),
            "uSpatialAbsolute": float(abs(shared_ray[index] - spatial_ray[index])),
            "uHalfSpaceAbsolute": float(abs(shared_ray[index] - half_space_ray[index])),
            "uInterpolationAbsolute": float(abs(production_ray[index] - cubic_ray[index])),
        }
        numerical_uncertainty = float(sum(components.values()))
        signed_error = float(source_fraction[index] - production_ray[index])
        ray_comparisons.append({
            "rayId": ray_id,
            "spinA": float(records[index]["spinA"]),
            "muEmission": float(ray_mu[index]),
            "v407ApproximationFraction": float(source_fraction[index]),
            "v408DiscreteOrdinatesFraction": float(production_ray[index]),
            "signedApproximationError": signed_error,
            "absoluteApproximationError": abs(signed_error),
            "relativeApproximationError": signed_error / float(production_ray[index]),
            "numericalUncertainty": {**components, "linearSumAbsolute": numerical_uncertainty, "linearSumRelative": numerical_uncertainty / float(production_ray[index]), "combination": "linear-no-rss-no-independence-claim"},
        })

    curve_mu = np.linspace(CURVE_MU_MIN, CURVE_MU_MAX, CURVE_SAMPLE_COUNT)
    curve_reference = pchip(production, curve_mu)
    curve_approximation = v407_fraction(curve_mu)
    curve_signed_error = curve_approximation - curve_reference
    curve_samples = [{"muEmission": float(mu_value), "v407ApproximationFraction": float(approximation), "v408DiscreteOrdinatesFraction": float(reference), "signedApproximationError": float(error), "relativeApproximationError": float(error / reference)} for mu_value, approximation, reference, error in zip(curve_mu, curve_approximation, curve_reference, curve_signed_error, strict=True)]

    maximum_linear_residual = max(result.linear_system_residual for result in solved)
    maximum_flux_drift = max(result.relative_flux_drift for result in solved)
    maximum_kernel_residual = max(result.kernel_equilibrium_residual for result in solved)
    maximum_numerical_uncertainty = max(entry["numericalUncertainty"]["linearSumAbsolute"] for entry in ray_comparisons)
    maximum_relative_underestimate = max(abs(min(0.0, entry["relativeApproximationError"])) for entry in ray_comparisons)
    peak_rss = peak_rss_gib()
    gates = {
        "sourceIdentityLocked": True,
        "v407CanonicalLocked": True,
        "kernelEquilibrium": bool(maximum_kernel_residual < 1e-13),
        "linearSystemResidual": bool(maximum_linear_residual < 1e-10),
        "fluxConservation": bool(maximum_flux_drift < 1e-10),
        "nonnegativeFiniteIntensityIncludingZeroBoundary": bool(all(result.minimum_intensity >= -1e-12 for result in solved)),
        "deterministicReplay": bool(replay_difference < 1e-14),
        "angularConvergence": bool(np.max(np.abs(production_ray - angular_ray)) < 2e-5),
        "spatialConvergence": bool(np.max(np.abs(shared_ray - spatial_ray)) < 1e-8),
        "halfSpaceConvergence": bool(np.max(np.abs(shared_ray - half_space_ray)) < 1e-8),
        "interpolationCrossCheck": bool(np.max(np.abs(production_ray - cubic_ray)) < 1e-6),
        "qualifiedDomainContainsAllRays": bool(np.all((ray_mu >= CURVE_MU_MIN) & (ray_mu <= CURVE_MU_MAX))),
        "resource": bool(peak_rss < MAXIMUM_PEAK_RSS_GIB),
    }
    if not all(gates.values()):
        raise RuntimeError(f"v408-qualification:{json.dumps(gates, sort_keys=True)}")

    unsigned = {
        "version": VERSION,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "qualified-independent-discrete-ordinates-reference-envelope",
        "qualified": True,
        "sourceReference": {
            "title": "A New Approach to Chandrasekhar's Scattering Matrix for a Semi-Infinite Rayleigh-Scattering Atmosphere",
            "author": "C. E. Siewert",
            "journal": "The Astrophysical Journal",
            "volume": "152",
            "page": "835",
            "year": 1968,
            "doi": "10.1086/149599",
            "adsBibcode": "1968ApJ...152..835S",
            "adsPdfUrl": "https://articles.adsabs.harvard.edu/cgi-bin/nph-iarticle_query?1968ApJ...152..835S&defaultprint=YES&filetype=.pdf",
            "adsPdfSha256": ADS_SOURCE_SHA256,
            "verification": "crossref-metadata-and-ads-scan-equations-1-2-verified",
            "equationTranscriptionSha256": hashlib.sha256(f"{EQUATION_TEXT}|{KERNEL_TEXT}".encode("utf-8")).hexdigest(),
        },
        "inputAuthority": {"v407ArtifactSha256": V407_ARTIFACT_SHA256, "v407Status": v407["view"]["status"], "diskRayCount": 4, "exactHFunctionTableAccuracy": "not-qualified"},
        "solver": {
            "equation": EQUATION_TEXT,
            "kernel": KERNEL_TEXT,
            "method": "gauss-legendre-discrete-ordinates-plus-diamond-difference-sparse-bvp",
            "topBoundary": "zero-reentrant-I(0,mu-positive)",
            "deepBoundary": "unit-unpolarized-I(tau-max,mu-negative)",
            "normalization": "arbitrary-polarization-ratio-invariant",
            "interpolation": "monotone-pchip-production-cubic-spline-cross-check",
            "qualifiedMuDomain": [CURVE_MU_MIN, CURVE_MU_MAX],
            "configurations": [result_summary(result) for result in solved],
        },
        "rayComparisons": ray_comparisons,
        "curveEnvelope": {"muDomain": [CURVE_MU_MIN, CURVE_MU_MAX], "sampleCount": CURVE_SAMPLE_COUNT, "samples": curve_samples, "maximumAbsoluteApproximationError": float(np.max(np.abs(curve_signed_error))), "maximumRelativeApproximationError": float(np.max(np.abs(curve_signed_error / curve_reference))), "approximationUnderestimatesAllSamples": bool(np.all(curve_signed_error < 0))},
        "maxima": {"linearSystemResidual": maximum_linear_residual, "relativeFluxDrift": maximum_flux_drift, "kernelEquilibriumResidual": maximum_kernel_residual, "deterministicReplayDifference": replay_difference, "rayNumericalUncertaintyLinearSumAbsolute": maximum_numerical_uncertainty, "rayRelativeUnderestimate": maximum_relative_underestimate},
        "thresholds": {"linearSystemResidual": 1e-10, "relativeFluxDrift": 1e-10, "kernelEquilibriumResidual": 1e-13, "deterministicReplayDifference": 1e-14, "angularConvergenceAbsolute": 2e-5, "spatialConvergenceAbsolute": 1e-8, "halfSpaceConvergenceAbsolute": 1e-8, "interpolationCrossCheckAbsolute": 1e-6, "maximumPeakRssGiB": MAXIMUM_PEAK_RSS_GIB},
        "gates": gates,
        "authorityBoundary": {"independentNumericalReferenceOnQualifiedMuDomain": True, "exactChandrasekharHFunctionTableAuthority": False, "limbEndpointMuZeroQualified": False, "faceOnEndpointMuOneQualified": False, "finiteSlabTruncationIncluded": True, "v407HistoricalArtifactMutated": False, "v407ApproximationPromotionApplied": False, "recommendedUse": "apply-v408-error-envelope-without-rewriting-v407"},
        "resource": {"availableMemoryGiBBefore": memory_before, "freeDiskGiBBefore": disk_before, "peakRssGiB": peak_rss, "maximumPeakRssGiB": MAXIMUM_PEAK_RSS_GIB, "qualified": True},
        "environment": {"python": platform.python_version(), "numpy": np.__version__, "scipy": scipy.__version__},
        "networkAttempted": False,
        "automaticRetryApplied": False,
        "denseShardExecuted": False,
        "release": {"formalProductPointer": "v263", "formalProductPointerAdvanced": False, "defaultKernel": "legacy-eih-1pn", "workerPhysicsMutation": "not-applied", "localShadowDefaultApplied": False},
        "boundary": "independent-finite-slab-discrete-ordinates-reference-envelope-not-exact-h-function-table-or-dense-image",
    }
    artifact = {**unsigned, "evidenceSha256": canonical_sha(unsigned)}
    atomic_json(OUTPUT, artifact)
    print(json.dumps({"status": artifact["status"], "evidenceSha256": artifact["evidenceSha256"], "rayCount": len(ray_comparisons), "curveSamples": CURVE_SAMPLE_COUNT, "rayRelativeErrors": [entry["relativeApproximationError"] for entry in ray_comparisons], "maxima": artifact["maxima"], "peakRssGiB": peak_rss, "output": str(OUTPUT.relative_to(ROOT)).replace("\\", "/")}, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
