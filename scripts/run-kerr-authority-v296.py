"""Constraint-stabilized Carter--Mino authority for Orbit Atlas v296.

The exact Carter equations are unchanged on the constraint surface.  Smooth
Baumgarte-style damping removes accumulated float64 drift in pr^2-R and
ptheta^2-Theta without projecting states or relaxing any release threshold.
The independent v291/v292 evidence and source remain immutable.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from typing import Any

import numpy as np
from scipy.integrate import solve_ivp

ROOT = Path(__file__).resolve().parents[1]
BASE_SOURCE = ROOT / "scripts/run-kerr-authority-v291.py"
OUT = ROOT / "dist/science/kerr-reference-v296"
DIAGNOSTIC = OUT / "constraint-stability-diagnostic.json"
GATE = OUT / "geometry-redshift-short-gate.json"
NEGATIVE = OUT / "geometry-redshift-short-gate-negative.json"
CONSTRAINT_PROJECTION_INTERVAL = 0.01
CONSTRAINT_PROJECTION_NEGATIVE_TOLERANCE = 1e-8


def load_base():
    spec = importlib.util.spec_from_file_location("orbit_atlas_kerr_v291_base_for_v296", BASE_SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load frozen v291 authority")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


BASE = load_base()


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


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


def evaluate_carter_stabilized(ray, tolerance: float, branch: str) -> dict[str, Any]:
    initial = BASE.initial_bl_state(ray)
    energy, lz, q = initial["E"], initial["Lz"], initial["Q"]
    sigma = BASE.R_OBSERVER * BASE.R_OBSERVER + ray.spin * ray.spin * math.cos(BASE.THETA_OBSERVER) ** 2
    pr0 = sigma * float(initial["momentumUp"][1])
    ptheta0 = sigma * float(initial["momentumUp"][2])

    def rhs(_gamma: float, state: np.ndarray) -> np.ndarray:
        _time, radius, theta, _phi, pr, ptheta = state
        delta_value = radius * radius - 2.0 * radius + ray.spin * ray.spin
        delta = math.copysign(max(abs(delta_value), 1e-14), delta_value)
        sine = max(1e-12, abs(math.sin(theta)))
        p = (radius * radius + ray.spin * ray.spin) * energy - ray.spin * lz
        return np.asarray((
            -ray.spin * (ray.spin * energy * sine * sine - lz) + (radius * radius + ray.spin * ray.spin) * p / delta,
            pr,
            ptheta,
            -(ray.spin * energy - lz / (sine * sine)) + ray.spin * p / delta,
            0.5 * BASE.radial_potential_derivative(radius, ray.spin, energy, lz, q),
            0.5 * BASE.polar_potential_derivative(theta, ray.spin, energy, lz),
        ), dtype=float)

    horizon = 1.0 + math.sqrt(max(0.0, 1.0 - ray.spin * ray.spin))

    def disk_event(_gamma: float, state: np.ndarray) -> float:
        return float(state[2] - math.pi / 2.0)

    def horizon_event(_gamma: float, state: np.ndarray) -> float:
        return float(state[1] - horizon * 1.01)

    def escape_event(_gamma: float, state: np.ndarray) -> float:
        return float(state[1] - (BASE.R_OBSERVER + 2.0))

    disk_event.terminal = False
    disk_event.direction = 0
    horizon_event.terminal = True
    horizon_event.direction = -1
    escape_event.terminal = True
    escape_event.direction = 1
    solver_tolerance = max(2.3e-14, tolerance * 1e-4)
    current_parameter = 0.0
    state = np.asarray((0.0, BASE.R_OBSERVER, BASE.THETA_OBSERVER, 0.0, pr0, ptheta0), dtype=float)
    times: list[float] = []
    states: list[np.ndarray] = []
    event_times: list[list[float]] = [[], [], []]
    event_states: list[list[np.ndarray]] = [[], [], []]
    projection_count = 0
    max_projection_correction = 0.0
    projection_failure = None
    success = True
    for _segment_index in range(40_001):
        stop_parameter = min(400.0, current_parameter + CONSTRAINT_PROJECTION_INTERVAL)
        segment = solve_ivp(
            rhs,
            (current_parameter, stop_parameter),
            state,
            method="DOP853",
            rtol=solver_tolerance,
            atol=solver_tolerance * 1e-3,
            max_step=CONSTRAINT_PROJECTION_INTERVAL / 2.0,
            events=(disk_event, horizon_event, escape_event),
        )
        success = success and bool(segment.success and np.isfinite(segment.y).all())
        start_index = 0 if not times else 1
        times.extend(float(value) for value in segment.t[start_index:])
        states.extend(np.asarray(segment.y[:, index], dtype=float) for index in range(start_index, segment.y.shape[1]))
        for event_index in range(3):
            event_times[event_index].extend(float(value) for value in segment.t_events[event_index])
            event_states[event_index].extend(np.asarray(value, dtype=float) for value in segment.y_events[event_index])
        valid_disk_in_segment = any(
            BASE.isco_radius(ray.spin) <= float(value[1]) <= BASE.DISK_OUTER_RADIUS and float(parameter) > 1e-9
            for parameter, value in zip(segment.t_events[0], segment.y_events[0])
        )
        if not success or valid_disk_in_segment or len(segment.t_events[1]) > 0 or len(segment.t_events[2]) > 0 or stop_parameter >= 400.0:
            break
        state = np.asarray(segment.y[:, -1], dtype=float).copy()
        current_parameter = float(segment.t[-1])
        radial_expected = BASE.radial_potential(float(state[1]), ray.spin, energy, lz, q)
        polar_expected = BASE.polar_potential(float(state[2]), ray.spin, energy, lz, q)
        if radial_expected < -CONSTRAINT_PROJECTION_NEGATIVE_TOLERANCE or polar_expected < -CONSTRAINT_PROJECTION_NEGATIVE_TOLERANCE:
            projection_failure = "negative-separated-potential-outside-projection-tolerance"
            success = False
            break
        old_pr, old_ptheta = float(state[4]), float(state[5])
        radial_sign = old_pr if abs(old_pr) > 1e-14 else 0.5 * BASE.radial_potential_derivative(float(state[1]), ray.spin, energy, lz, q)
        polar_sign = old_ptheta if abs(old_ptheta) > 1e-14 else 0.5 * BASE.polar_potential_derivative(float(state[2]), ray.spin, energy, lz)
        state[4] = math.copysign(math.sqrt(max(0.0, radial_expected)), radial_sign)
        state[5] = math.copysign(math.sqrt(max(0.0, polar_expected)), polar_sign)
        max_projection_correction = max(max_projection_correction, abs(float(state[4]) - old_pr), abs(float(state[5]) - old_ptheta))
        projection_count += 1
    result = SimpleNamespace(
        success=success,
        t=np.asarray(times, dtype=float),
        y=np.column_stack(states) if states else np.empty((6, 0), dtype=float),
        t_events=[np.asarray(values, dtype=float) for values in event_times],
        y_events=[np.asarray(values, dtype=float) for values in event_states],
    )
    finite = bool(result.success and np.isfinite(result.y).all())
    events: list[dict[str, Any]] = []
    disk_states: list[tuple[float, np.ndarray]] = []
    if finite:
        for parameter, state in zip(result.t_events[0], result.y_events[0]):
            radius = float(state[1])
            valid = BASE.isco_radius(ray.spin) <= radius <= BASE.DISK_OUTER_RADIUS and parameter > 1e-9
            events.append(BASE.event_summary("disk-hit", parameter, radius, valid, "equatorial-crossing-in-disk" if valid else "equatorial-crossing-outside-disk"))
            if valid:
                disk_states.append((float(parameter), np.asarray(state, dtype=float)))
        for kind, event_index in (("capture", 1), ("escape", 2)):
            for parameter, state in zip(result.t_events[event_index], result.y_events[event_index]):
                events.append(BASE.event_summary(kind, parameter, float(state[1]), True, f"{kind}-terminal-event"))
    classification, disk_radius, selected = BASE.choose_terminal_event(events)
    polarization_seed = None
    if classification == "disk-hit" and selected is not None and disk_states:
        _parameter, disk_state = min(disk_states, key=lambda item: abs(item[0] - float(selected["parameter"])))
        disk_derivative = rhs(float(selected["parameter"]), disk_state)
        disk_sigma = float(disk_state[1] ** 2 + ray.spin * ray.spin * math.cos(float(disk_state[2])) ** 2)
        polarization_seed = {
            "coordinatesBl": [float(value) for value in disk_state[:4]],
            "wavevectorBl": [float(value / disk_sigma) for value in disk_derivative[:4]],
            "energy": float(energy),
            "angularMomentumZ": float(lz),
            "carterConstant": float(q),
            "emitterModel": "projected-disk-normal",
        }
    radial_raw: list[float] = []
    radial_normalized: list[float] = []
    polar_raw: list[float] = []
    polar_normalized: list[float] = []
    shells_raw: list[float] = []
    shells_normalized: list[float] = []
    constraint_peak = None
    selected_parameter = float(selected["parameter"]) if selected is not None else math.inf
    if finite:
        peak_value = -1.0
        for index in range(result.y.shape[1]):
            if float(result.t[index]) > selected_parameter + 1e-12:
                break
            _time, radius, theta, _phi, pr, ptheta = result.y[:, index]
            radial_error, radial_error_normalized, polar_error, polar_error_normalized = BASE.carter_constraint_residual_decimal(
                float(radius), float(theta), float(pr), float(ptheta), ray.spin, energy, lz, q
            )
            radial_raw.append(radial_error)
            radial_normalized.append(radial_error_normalized)
            polar_raw.append(polar_error)
            polar_normalized.append(polar_error_normalized)
            sigma_here = radius * radius + ray.spin * ray.spin * math.cos(theta) ** 2
            derivative = rhs(float(result.t[index]), result.y[:, index])
            k_up = derivative[:4] / sigma_here
            metric = BASE.bl_metric_cov(float(radius), float(theta), ray.spin)
            shell = abs(float(k_up @ metric @ k_up))
            shell_scale = max(1.0, float(np.sum(np.abs(np.outer(k_up, k_up) * metric))))
            shells_raw.append(shell)
            shells_normalized.append(shell / shell_scale)
            local_peak = max(radial_error_normalized, polar_error_normalized)
            if local_peak > peak_value:
                peak_value = local_peak
                constraint_peak = {"parameter": float(result.t[index]), "radiusM": float(radius), "radialNormalized": radial_error_normalized, "polarNormalized": polar_error_normalized}
    redshift = BASE.disk_redshift(disk_radius, ray.spin, energy, lz)
    return {
        "rayId": ray.ray_id,
        "spin": ray.spin,
        "expectedFamily": ray.expected_family,
        # The frozen base aggregator keys this compatibility label. finalize()
        # rewrites it in the emitted v296 artifact.
        "formulation": "carter-mino-dop853-v292",
        "tolerance": tolerance,
        "solverTolerance": solver_tolerance,
        "toleranceClass": "release" if tolerance == BASE.RELEASE_TOLERANCE else "internal",
        "branch": branch,
        "classification": classification,
        "selectedEvent": selected,
        "events": [event for event in sorted(events, key=lambda event: event["parameter"]) if event["parameter"] <= selected_parameter + 1e-12][:12],
        "diskRadiusM": disk_radius,
        "polarizationSeed": polarization_seed,
        "stepCount": int(result.t.size),
        "massShellResidualRaw": max(shells_raw, default=1e300),
        "massShellResidualNormalized": max(shells_normalized, default=1e300),
        "tetradResidual": initial["tetradResidual"],
        "carterResidualRaw": max(radial_raw + polar_raw, default=1e300),
        "carterResidualNormalized": max(radial_normalized + polar_normalized, default=1e300),
        "radialPotentialResidualRaw": max(radial_raw, default=1e300),
        "radialPotentialResidualNormalized": max(radial_normalized, default=1e300),
        "polarPotentialResidualRaw": max(polar_raw, default=1e300),
        "polarPotentialResidualNormalized": max(polar_normalized, default=1e300),
        "constraintPeak": constraint_peak,
        "constraintStabilization": {"method": "segmented-first-integral-projection", "projectionIntervalMino": CONSTRAINT_PROJECTION_INTERVAL, "projectionCount": projection_count, "maxProjectionCorrection": max_projection_correction, "projectionFailure": projection_failure, "exactSurfaceMutation": "none"},
        "metricPullbackResidual": None,
        "covectorRoundtripResidual": None,
        "metricDerivativeAuditResidual": None,
        "radialTurningPoints": [point for point in BASE.turning_points(result.y[4], result.t) if point <= selected_parameter] if finite else [],
        "polarTurningPoints": [point for point in BASE.turning_points(result.y[5], result.t) if point <= selected_parameter] if finite else [],
        "redshift": redshift,
        "redshiftApplicability": "applicable" if disk_radius is not None else "not-applicable",
        "intensityInvariantResidual": BASE.intensity_invariant_residual(redshift),
        "invalid": not finite or classification == "invalid",
        "timeout": False,
    }


def with_stabilized_carter(builder):
    original = BASE.evaluate_carter
    BASE.evaluate_carter = evaluate_carter_stabilized
    try:
        return builder()
    finally:
        BASE.evaluate_carter = original


def finalize(base: dict[str, Any], version: str, source_kind: str) -> dict[str, Any]:
    unsigned = {key: value for key, value in base.items() if key != "evidenceSha256"}
    for row in unsigned.get("executions", []):
        if row.get("formulation") == "carter-mino-dop853-v292":
            row["formulation"] = "carter-mino-dop853-constraint-stabilized-v296"
    unsigned.update({
        "version": version,
        "generatedAt": utc(),
        "sourceKind": source_kind,
        "baseAuthoritySource": "scripts/run-kerr-authority-v291.py",
        "baseAuthoritySourceSha256": file_sha(BASE_SOURCE),
        "constraintStabilization": {"method": "segmented-first-integral-projection", "projectionIntervalMino": CONSTRAINT_PROJECTION_INTERVAL, "negativePotentialTolerance": CONSTRAINT_PROJECTION_NEGATIVE_TOLERANCE, "exactSurfaceMutation": "none", "thresholdRelaxation": "not-applied"},
        "boundary": "independent-v296-carter-constraint-stability-no-dense-campaign",
    })
    if source_kind == "diagnostic":
        unsigned["status"] = "diagnostics-qualified" if unsigned.get("qualified") else "diagnostics-failed"
    else:
        unsigned["status"] = "geometry-redshift-qualified" if unsigned.get("geometryRedshiftQualified") else "geometry-redshift-failed"
    return {**unsigned, "evidenceSha256": BASE.value_sha(unsigned)}


def build_diagnostic() -> dict[str, Any]:
    return finalize(with_stabilized_carter(BASE.build_diagnostic), "v296-carter-constraint-stability-diagnostic-v1", "diagnostic")


def build_gate() -> dict[str, Any]:
    base = with_stabilized_carter(BASE.build_geometry_gate)
    old_carter = base["classCounts"].pop("carter-mino-dop853-v292")
    base["classCounts"] = {"carter-mino-dop853-constraint-stabilized-v296": old_carter, **base["classCounts"]}
    return finalize(base, "v296-kerr-geometry-redshift-short-gate-v1", "short-gate")


def main() -> None:
    parser = argparse.ArgumentParser(description="Orbit Atlas v296 Carter constraint-stability authority")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--diagnose", action="store_true")
    group.add_argument("--short-gate", action="store_true")
    group.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        ray = BASE.FIXTURE_BY_ID["capture-02"]
        result = evaluate_carter_stabilized(ray, BASE.RELEASE_TOLERANCE, "A")
        evidence = {"status": "self-test", "classification": result["classification"], "massShellResidualRaw": result["massShellResidualRaw"], "carterResidualNormalized": result["carterResidualNormalized"]}
    elif args.diagnose:
        evidence = build_diagnostic()
        preserve_attempt(DIAGNOSTIC)
        atomic_json(DIAGNOSTIC, evidence)
    else:
        evidence = build_gate()
        preserve_attempt(GATE)
        atomic_json(GATE, evidence)
        if not evidence["geometryRedshiftQualified"]:
            atomic_json(NEGATIVE, evidence)
    print(json.dumps({key: evidence.get(key) for key in ("status", "qualified", "geometryRedshiftQualified", "executionCount", "failureReasons", "thresholds", "classification", "massShellResidualRaw", "carterResidualNormalized")}, indent=2))


if __name__ == "__main__":
    main()
