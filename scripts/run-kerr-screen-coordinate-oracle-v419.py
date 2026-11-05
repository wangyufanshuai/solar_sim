from __future__ import annotations

import hashlib
import importlib.util
import json
import math
import os
import sys
from pathlib import Path
from typing import Any

import numpy as np


ROOT = Path.cwd()
SOURCE = ROOT / "scripts/run-kerr-authority-v291.py"
PLAN = ROOT / "dist/science/kerr-campaign-v314/ray-plan.json"
GEOMETRY = ROOT / "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"
POLARIZATION = ROOT / "dist/science/kerr-reference-v313/polarization-short-gate.json"
OUTPUT = ROOT / "dist/science/kerr-screen-coordinate-provenance-v419/python-oracle.json"
EXPECTED_SOURCE_SHA = "03b609562dad3efb149976b17fee81b5bbd865ef8ca90d2a9b64eb79a3848884"
EXPECTED_PLAN_SHA = "89ce45769978650c177acb83a0c37ceb1c0a1a6f6db34655448f5c6fcb896c04"
EXPECTED_GEOMETRY_SHA = "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e"
EXPECTED_POLARIZATION_SHA = "e4b6044ed828f31b7eb511b4e722bc474414acdcab8cedbdf16484b20216ae6f"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_v291_for_v419", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("v419-v291-import")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


BASE = load_module()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def canonical(value: Any) -> Any:
    if isinstance(value, list):
        return [canonical(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonical(value[key]) for key in sorted(value) if key not in {"generatedAt", "artifactSha256"}}
    return value


def value_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonical(value), sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def atomic(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{os.getpid()}.part")
    with temporary.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, allow_nan=False)
        handle.write("\n")
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def screen(local: np.ndarray) -> tuple[float, float]:
    return (-BASE.R_OBSERVER * float(local[3]) / float(local[0]), BASE.R_OBSERVER * float(local[2]) / float(local[0]))


def coordinate_residual(actual: tuple[float, float], alpha: float, beta: float) -> float:
    return max(abs(actual[0] - alpha), abs(actual[1] - beta))


def main() -> None:
    plan = json.loads(PLAN.read_text(encoding="utf-8"))
    geometry = json.loads(GEOMETRY.read_text(encoding="utf-8"))
    polarization = json.loads(POLARIZATION.read_text(encoding="utf-8"))
    if file_sha(SOURCE) != EXPECTED_SOURCE_SHA or plan.get("planSha256") != EXPECTED_PLAN_SHA:
        raise RuntimeError("v419-plan-source-lock")
    if geometry.get("evidenceSha256") != EXPECTED_GEOMETRY_SHA or polarization.get("evidenceSha256") != EXPECTED_POLARIZATION_SHA:
        raise RuntimeError("v419-authority-lock")
    rows = []
    for index, ray_id in zip(range(12, 16), ("disk-00", "disk-01", "disk-02", "disk-03")):
        ray = next(row for row in plan["rays"] if row["rayIndex"] == index and row["rayId"] == ray_id)
        geometry_row = next(row for row in geometry["executions"] if row["rayId"] == ray_id and row["toleranceClass"] == "release" and row["branch"] == "A" and row["formulation"].startswith("carter-mino"))
        fixture = BASE.RayFixture(ray_id, float(ray["alphaM"]), float(ray["betaM"]), float(ray["spinA"]), "disk-hit")
        initial = BASE.initial_bl_state(fixture)
        tetrad = BASE.zamo_tetrad(BASE.R_OBSERVER, BASE.THETA_OBSERVER, fixture.spin)
        metric = BASE.bl_metric_cov(BASE.R_OBSERVER, BASE.THETA_OBSERVER, fixture.spin)
        local_from_tetrad = np.linalg.solve(tetrad, np.asarray(initial["momentumUp"], dtype=float))
        momentum_from_covector = np.linalg.solve(metric, np.asarray(initial["momentumDown"], dtype=float))
        local_from_covector = np.linalg.solve(tetrad, momentum_from_covector)
        ks = BASE.initial_ks_state(fixture, initial)
        metric_ks = BASE.ks_metric(np.asarray(ks["coordinates"][1:4], dtype=float), fixture.spin, True)
        momentum_ks = metric_ks @ np.asarray(ks["covector"], dtype=float)
        momentum_bl = np.linalg.solve(np.asarray(ks["jacobian"], dtype=float), momentum_ks)
        local_from_ks = np.linalg.solve(tetrad, momentum_bl)
        coordinate_replay = max(
            coordinate_residual(screen(np.asarray(initial["local"], dtype=float)), ray["alphaM"], ray["betaM"]),
            coordinate_residual(screen(local_from_tetrad), ray["alphaM"], ray["betaM"]),
            coordinate_residual(screen(local_from_covector), ray["alphaM"], ray["betaM"]),
            coordinate_residual(screen(local_from_ks), ray["alphaM"], ray["betaM"]),
        )
        seed = geometry_row["polarizationSeed"]
        constant_residual = max(abs(initial["E"] - seed["energy"]), abs(initial["Lz"] - seed["angularMomentumZ"]), abs(initial["Q"] - seed["carterConstant"]))
        rows.append({
            "rayIndex": index,
            "rayId": ray_id,
            "spinA": ray["spinA"],
            "alphaM": ray["alphaM"],
            "betaM": ray["betaM"],
            "energy": float(initial["E"]),
            "angularMomentumZ": float(initial["Lz"]),
            "carterConstant": float(initial["Q"]),
            "coordinateReplayResidualM": float(coordinate_replay),
            "nullResidual": float(initial["massShellResidual"]),
            "tetradResidual": float(initial["tetradResidual"]),
            "metricPullbackResidual": float(ks["metricPullbackResidual"]),
            "covectorRoundtripResidual": float(ks["covectorRoundtripResidual"]),
            "initialKsHamiltonianResidual": float(ks["initialHamiltonianResidual"]),
            "constantResidual": float(constant_residual),
        })
    maxima = {
        "coordinateReplayResidualM": max(row["coordinateReplayResidualM"] for row in rows),
        "nullResidual": max(row["nullResidual"] for row in rows),
        "tetradResidual": max(row["tetradResidual"] for row in rows),
        "metricPullbackResidual": max(row["metricPullbackResidual"] for row in rows),
        "covectorRoundtripResidual": max(row["covectorRoundtripResidual"] for row in rows),
        "initialKsHamiltonianResidual": max(row["initialKsHamiltonianResidual"] for row in rows),
        "constantResidual": max(row["constantResidual"] for row in rows),
    }
    if max(maxima.values()) >= 1e-12:
        raise RuntimeError(f"v419-oracle-gate:{maxima}")
    generated_at = max(value["generatedAt"] for value in (plan, geometry, polarization))
    unsigned = {
        "version": "v419-kerr-screen-coordinate-python-oracle-v1",
        "generatedAt": generated_at,
        "status": "qualified-independent-screen-coordinate-replay",
        "source": {
            "v291SourceSha256": EXPECTED_SOURCE_SHA,
            "v312GeometryEvidenceSha256": EXPECTED_GEOMETRY_SHA,
            "v313PolarizationEvidenceSha256": EXPECTED_POLARIZATION_SHA,
            "v314RayPlanSha256": EXPECTED_PLAN_SHA,
        },
        "observer": {"family": "finite-distance-ZAMO", "radiusM": 30.0, "inclinationDeg": 70.0, "azimuthDeg": 0.0},
        "convention": {"alpha": "minus-R-times-local-phi-over-local-time", "beta": "R-times-local-theta-over-local-time", "opticalAxis": "negative-local-radial"},
        "rows": rows,
        "maxima": maxima,
        "denseShardExecuted": False,
        "networkAttempted": False,
        "boundary": "four-canonical-screen-coordinate-replays-no-geodesic-integration-or-dense-shard",
    }
    artifact = {**unsigned, "artifactSha256": value_sha(unsigned)}
    atomic(OUTPUT, artifact)
    print(json.dumps({"status": artifact["status"], "artifactSha256": artifact["artifactSha256"], "rows": len(rows), "maxima": maxima}, indent=2))


if __name__ == "__main__":
    main()
