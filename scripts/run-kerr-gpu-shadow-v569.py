"""CUDA float64 shadow of the Kerr observer-screen initial-state kernel.

The kernel is deliberately downstream of the v568 49/49 CPU authority.  It
recomputes E, Lz, Q, the null shell, and observer-frame momentum for every
dense ray and publishes only a differential receipt.  It never modifies the
CPU ray plan, shards, aggregate, or Atlas scientific payload.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CAMPAIGN = ROOT / "dist/science/kerr-campaign-v568"
STATE = CAMPAIGN / "campaign-state.json"
PLAN = CAMPAIGN / "ray-plan.json"
AGGREGATE = CAMPAIGN / "dense-aggregate.json"
OUT = ROOT / "dist/science/kerr-gpu-shadow-v569"
RECEIPT = OUT / "gpu-differential.json"
AUTHORITY_SOURCE = ROOT / "scripts/run-kerr-authority-v312.py"

THRESHOLDS = {
    "energyAbs": 5e-13,
    "angularMomentumAbs": 5e-12,
    "carterAbs": 5e-11,
    "momentumAbs": 5e-13,
    "gpuNullShellAbs": 5e-13,
}


def load_authority():
    spec = importlib.util.spec_from_file_location("orbit_atlas_v312_for_gpu_v569", AUTHORITY_SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v312 CPU authority")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module.BASE


CPU = load_authority()


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(item) for item in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "elapsedMilliseconds"}}
    return value


def value_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_verified(path: Path, field: str) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    expected = value.get(field)
    unsigned = {key: item for key, item in value.items() if key != field}
    if not isinstance(expected, str) or value_sha(unsigned) != expected:
        raise RuntimeError(f"canonical SHA mismatch: {path.relative_to(ROOT).as_posix()}")
    return value


def atomic_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    part = path.with_name(f"{path.name}.{os.getpid()}.part")
    with part.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(part, path)


def preflight() -> dict[str, Any]:
    state = read_verified(STATE, "stateSha256")
    aggregate_exists = AGGREGATE.is_file()
    eligible = state.get("status") == "complete" and state.get("completedShardCount") == 49 and state.get("aggregateAvailable") is True and aggregate_exists
    return {
        "version": "v569-kerr-cuda-shadow-preflight-v1",
        "status": "eligible" if eligible else "blocked-cpu-authority-incomplete",
        "eligible": eligible,
        "completedShardCount": state.get("completedShardCount"),
        "aggregateAvailable": state.get("aggregateAvailable"),
        "gpuScientificPayloadWritebackAllowed": False,
    }


CUDA_SOURCE = r"""
extern "C" __global__
void kerr_observer_initial(const double* alpha, const double* beta,
                           const double* spin, double* out, int n) {
  int i = blockDim.x * blockIdx.x + threadIdx.x;
  if (i >= n) return;
  const double r = 30.0;
  const double theta = 1.2217304763960306;
  const double s = sin(theta);
  const double c = cos(theta);
  const double s2 = s * s;
  const double a = spin[i];
  const double h = alpha[i] / r;
  const double v = beta[i] / r;
  const double transverse2 = h * h + v * v;
  const double local_r = -sqrt(1.0 - transverse2);
  const double sigma = r * r + a * a * c * c;
  const double delta = r * r - 2.0 * r + a * a;
  const double area = (r * r + a * a) * (r * r + a * a) - a * a * delta * s2;
  const double lapse = sqrt(sigma * delta / area);
  const double omega = 2.0 * a * r / area;
  const double gphiphi = area * s2 / sigma;
  const double up_t = 1.0 / lapse;
  const double up_r = sqrt(delta / sigma) * local_r;
  const double up_theta = v / sqrt(sigma);
  const double up_phi = omega / lapse - h / sqrt(gphiphi);
  const double gtt = -(1.0 - 2.0 * r / sigma);
  const double gtphi = -2.0 * a * r * s2 / sigma;
  const double down_t = gtt * up_t + gtphi * up_phi;
  const double down_r = (sigma / delta) * up_r;
  const double down_theta = sigma * up_theta;
  const double down_phi = gtphi * up_t + gphiphi * up_phi;
  const double energy = -down_t;
  const double lz = down_phi;
  const double q = down_theta * down_theta + c * c * (lz * lz / s2 - a * a * energy * energy);
  const double shell = fabs(up_t * down_t + up_r * down_r + up_theta * down_theta + up_phi * down_phi);
  out[i * 7 + 0] = energy;
  out[i * 7 + 1] = lz;
  out[i * 7 + 2] = q;
  out[i * 7 + 3] = shell;
  out[i * 7 + 4] = up_r;
  out[i * 7 + 5] = up_theta;
  out[i * 7 + 6] = up_phi;
}
"""


def run() -> dict[str, Any]:
    gate = preflight()
    if not gate["eligible"]:
        raise RuntimeError("v569 GPU shadow refused until v568 CPU authority is 49/49 complete")
    import cupy as cp

    plan = read_verified(PLAN, "planSha256")
    aggregate = read_verified(AGGREGATE, "aggregateSha256")
    aggregate_file_sha_before = file_sha(AGGREGATE)
    rays = plan["rays"]
    alpha = np.asarray([ray["alphaM"] for ray in rays], dtype=np.float64)
    beta = np.asarray([ray["betaM"] for ray in rays], dtype=np.float64)
    spin = np.asarray([ray["spinA"] for ray in rays], dtype=np.float64)
    cpu = np.empty((len(rays), 7), dtype=np.float64)
    for index, ray in enumerate(rays):
        fixture = CPU.RayFixture(ray["rayId"], float(ray["alphaM"]), float(ray["betaM"]), float(ray["spinA"]), ray["expectedFamily"])
        initial = CPU.initial_bl_state(fixture)
        momentum = np.asarray(initial["momentumUp"], dtype=np.float64)
        cpu[index] = (initial["E"], initial["Lz"], initial["Q"], initial["massShellResidual"], momentum[1], momentum[2], momentum[3])

    device = cp.cuda.Device()
    properties = cp.cuda.runtime.getDeviceProperties(device.id)
    kernel = cp.RawKernel(CUDA_SOURCE, "kerr_observer_initial", options=("-std=c++11", "--fmad=false"))
    d_alpha, d_beta, d_spin = cp.asarray(alpha), cp.asarray(beta), cp.asarray(spin)

    def launch() -> np.ndarray:
        output = cp.empty((len(rays), 7), dtype=cp.float64)
        threads = 256
        blocks = (len(rays) + threads - 1) // threads
        kernel((blocks,), (threads,), (d_alpha, d_beta, d_spin, output, np.int32(len(rays))))
        cp.cuda.runtime.deviceSynchronize()
        return cp.asnumpy(output)

    gpu_a = launch()
    gpu_b = launch()
    if not np.isfinite(gpu_a).all() or not np.isfinite(gpu_b).all():
        raise RuntimeError("v569 GPU kernel produced non-finite values")
    deterministic = gpu_a.tobytes() == gpu_b.tobytes()
    differences = np.abs(cpu - gpu_a)
    maxima = {
        "energyAbs": float(np.max(differences[:, 0])),
        "angularMomentumAbs": float(np.max(differences[:, 1])),
        "carterAbs": float(np.max(differences[:, 2])),
        "cpuVsGpuNullShellAbs": float(np.max(differences[:, 3])),
        "gpuNullShellAbs": float(np.max(gpu_a[:, 3])),
        "momentumAbs": float(np.max(differences[:, 4:])),
    }
    gates = {
        "energy": maxima["energyAbs"] <= THRESHOLDS["energyAbs"],
        "angularMomentum": maxima["angularMomentumAbs"] <= THRESHOLDS["angularMomentumAbs"],
        "carter": maxima["carterAbs"] <= THRESHOLDS["carterAbs"],
        "momentum": maxima["momentumAbs"] <= THRESHOLDS["momentumAbs"],
        "nullShell": maxima["gpuNullShellAbs"] <= THRESHOLDS["gpuNullShellAbs"],
        "deterministicReplay": deterministic,
        "invalidCount": int(np.size(gpu_a) - np.count_nonzero(np.isfinite(gpu_a))) == 0,
        "cpuAuthorityPreserved": file_sha(AGGREGATE) == aggregate_file_sha_before,
    }
    source_manifest = [
        {"path": Path(__file__).resolve().relative_to(ROOT).as_posix(), "sha256": file_sha(Path(__file__).resolve())},
        {"path": AUTHORITY_SOURCE.relative_to(ROOT).as_posix(), "sha256": file_sha(AUTHORITY_SOURCE)},
        {"path": PLAN.relative_to(ROOT).as_posix(), "sha256": file_sha(PLAN)},
        {"path": AGGREGATE.relative_to(ROOT).as_posix(), "sha256": aggregate_file_sha_before},
    ]
    name = properties.get("name", b"unknown")
    if isinstance(name, bytes):
        name = name.decode("utf-8", "replace")
    unsigned = {
        "version": "v569-kerr-cuda-float64-shadow-differential-v1",
        "generatedAt": utc(),
        "status": "qualified-gpu-shadow" if all(gates.values()) else "blocked-gpu-differential",
        "backend": "cupy-cuda-rawkernel-float64",
        "device": {"id": device.id, "name": str(name), "computeCapability": f"{properties.get('major')}.{properties.get('minor')}"},
        "rayCount": len(rays),
        "denseAuthority": {"aggregateSha256": aggregate["aggregateSha256"], "aggregateFileSha256": aggregate_file_sha_before, "planSha256": plan["planSha256"]},
        "observedMaxima": maxima,
        "thresholds": THRESHOLDS,
        "gates": gates,
        "qualified": all(gates.values()),
        "sourceManifest": source_manifest,
        "boundary": {"cpuAuthorityPreserved": True, "gpuScientificPayloadWritebackAllowed": False, "formalProductPointer": "v263", "scope": "observer-screen-initial-state-kernel-shadow-not-full-gpu-raytrace"},
    }
    receipt = {**unsigned, "receiptSha256": value_sha(unsigned)}
    atomic_json(RECEIPT, receipt)
    return receipt


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v569 Kerr CUDA shadow")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--preflight", action="store_true")
    group.add_argument("--run", action="store_true")
    args = parser.parse_args()
    value = preflight() if args.preflight else run()
    print(json.dumps(value, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
