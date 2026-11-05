"""Sample the local frozen FO-CCZ4 principal-symbol proxy on outer faces."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D,
    FOCCZ4Config,
    FOCCZ4_VARIABLE_ORDER,
    GaugeConfig,
    Grid3D,
    linearized_fo_ccz4_local_principal_proxy_3d,
    probe_frozen_fo_ccz4_rhs_matrix_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/__init__.py",
        "science/numerical_relativity/nr3d.py",
        "science/numerical_relativity/ccz4_reference.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/bssn3d.py",
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_frozen_symbol.py",
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "science/numerical_relativity/fo_ccz4_analytic_symbol.py",
        "science/numerical_relativity/fo_ccz4_local_frame_shadow.py",
        "science/numerical_relativity/fo_ccz4_local_principal_proxy_shadow.py",
        "scripts/run-nr-k3-fo-ccz4-local-principal-proxy.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _axes(value: str) -> tuple[int, ...]:
    result = tuple(int(item.strip()) for item in value.split(",") if item.strip())
    if not result or any(axis not in (0, 1, 2) for axis in result):
        raise SystemExit("--axes must contain one or more values from 0,1,2")
    if len(set(result)) != len(result):
        raise SystemExit("--axes must not repeat an axis")
    return result


def _build_state(points: int, amplitude: float) -> BSSNState3D:
    grid = Grid3D(
        (points, points, points),
        (2.0, 2.0, 2.0),
        (8.0, 8.0, 8.0),
        boundary="sommerfeld",
        spatial_order=2,
    )
    state = BSSNState3D.schwarzschild_isotropic(
        grid,
        mass_length=1.0,
        center=(0.0, 0.0, 0.0),
        excision_radius=0.5,
        lapse_seed="schwarzschild",
        formulation="ccz4",
    )
    x, y, z = grid.coordinates
    state.h[..., 0, 0] *= 1.0 + amplitude * np.sin(x)
    state.h[..., 1, 1] *= 1.0 + 0.5 * amplitude * np.cos(y)
    state.h[..., 2, 2] *= 1.0 - 0.25 * amplitude * np.sin(z)
    cross = 0.2 * amplitude * np.sin(x + y + z)
    state.h[..., 0, 1] = cross
    state.h[..., 1, 0] = cross
    state.lapse *= 1.0 + 0.25 * amplitude * np.cos(x - y)
    state.shift[..., 0] = 0.1 * amplitude * np.sin(y)
    state.shift[..., 1] = 0.1 * amplitude * np.cos(z)
    return state


def _samples(state: BSSNState3D, axes: tuple[int, ...]):
    center = [points // 2 for points in state.grid.shape]
    for axis in axes:
        for side in (-1, 1):
            index = list(center)
            index[axis] = 0 if side < 0 else state.grid.shape[axis] - 1
            normal = np.zeros(3, dtype=np.float64)
            normal[axis] = float(side)
            yield tuple(index), axis, side, normal


def _actual_constant_background_symbol(
    conformal_metric: np.ndarray,
    lapse: float,
    shift: np.ndarray,
    *,
    chi: float,
    axis: int,
    side: int,
    gauge: GaugeConfig,
    config: FOCCZ4Config,
    amplitude: float = 1.0e-5,
) -> np.ndarray:
    """Probe the same conformal state, not gamma relabelled as h with chi=1."""

    normal = np.zeros(3)
    normal[axis] = float(side)
    return probe_frozen_fo_ccz4_rhs_matrix_3d(
        conformal_metric, chi, lapse, shift, normal,
        gauge=gauge, config=config, amplitude=amplitude,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--axes", default="0,1,2")
    parser.add_argument("--points", type=int, default=9)
    parser.add_argument("--amplitude", type=float, default=2.0e-2)
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit("output already exists; choose a fresh receipt path")
    axes = _axes(args.axes)
    if args.points < 5:
        raise SystemExit("--points must be at least five")
    if not np.isfinite(args.amplitude) or args.amplitude < 0.0:
        raise SystemExit("--amplitude must be finite and non-negative")
    source_before = _source_digest()
    state = _build_state(args.points, float(args.amplitude))
    gauge = GaugeConfig(theta_coupling=2.0)
    config = FOCCZ4Config(kappa1=0.0)
    samples = list(_samples(state, axes))
    first_reports = []
    second_reports = []
    first_consistency = []
    second_consistency = []
    audit_error: str | None = None
    try:
        for index, axis, side, normal in samples:
            metric = state.h[index] / float(state.chi[index])
            shift = state.shift[index]
            operator, report = linearized_fo_ccz4_local_principal_proxy_3d(
                metric,
                float(state.lapse[index]),
                shift,
                normal,
                gauge=gauge,
                config=config,
            )
            first_reports.append(report)
            actual = _actual_constant_background_symbol(
                state.h[index],
                float(state.lapse[index]),
                shift,
                chi=float(state.chi[index]),
                axis=axis,
                side=side,
                gauge=gauge,
                config=config,
            )
            difference = np.abs(actual - operator)
            row, column = np.unravel_index(int(np.argmax(difference)), difference.shape)
            first_consistency.append(
                {
                    "max_abs_error": float(difference[row, column]),
                    "row": FOCCZ4_VARIABLE_ORDER[row],
                    "column": FOCCZ4_VARIABLE_ORDER[column],
                    "actual_value": float(actual[row, column]),
                    "proxy_value": float(operator[row, column]),
                    "actual_sha256": hashlib.sha256(np.asarray(actual, dtype="<f8").tobytes()).hexdigest(),
                }
            )
        for index, axis, side, normal in samples:
            metric = state.h[index] / float(state.chi[index])
            shift = state.shift[index]
            operator, report = linearized_fo_ccz4_local_principal_proxy_3d(
                metric,
                float(state.lapse[index]),
                shift,
                normal,
                gauge=gauge,
                config=config,
            )
            second_reports.append(report)
            actual = _actual_constant_background_symbol(
                state.h[index],
                float(state.lapse[index]),
                shift,
                chi=float(state.chi[index]),
                axis=axis,
                side=side,
                gauge=gauge,
                config=config,
            )
            difference = np.abs(actual - operator)
            row, column = np.unravel_index(int(np.argmax(difference)), difference.shape)
            second_consistency.append(
                {
                    "max_abs_error": float(difference[row, column]),
                    "row": FOCCZ4_VARIABLE_ORDER[row],
                    "column": FOCCZ4_VARIABLE_ORDER[column],
                    "actual_value": float(actual[row, column]),
                    "proxy_value": float(operator[row, column]),
                    "actual_sha256": hashlib.sha256(np.asarray(actual, dtype="<f8").tobytes()).hexdigest(),
                }
            )
    except ValueError as exc:
        audit_error = f"{type(exc).__name__}: {exc}"
    consistency_deterministic = bool(first_consistency == second_consistency)
    source_unchanged = source_before == _source_digest()
    rhs_consistency_validated = bool(
        not audit_error
        and len(first_consistency) == len(samples)
        and all(item["max_abs_error"] <= 1.0e-8 for item in first_consistency)
    )
    deterministic = bool(
        not audit_error
        and len(first_reports) == len(second_reports)
        and first_reports == second_reports
        and consistency_deterministic
    )
    candidate = bool(
        deterministic
        and source_unchanged
        and first_reports
        and all(report.local_similarity_validated for report in first_reports)
        and all(report.operator_imaginary_l_inf < 1.0e-7 for report in first_reports)
        and rhs_consistency_validated
    )
    sample_records = []
    for (index, axis, side, _), report, consistency in zip(
        samples, first_reports, first_consistency
    ):
        sample_records.append(
            {
                "index": list(index),
                "axis": axis,
                "side": side,
                "conformal_metric": state.h[index].tolist(),
                "chi": float(state.chi[index]),
                "report": asdict(report),
                "rhs_consistency": consistency,
            }
        )
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-local-frozen-principal-proxy-rhs-crosscheck-shadow",
        "schema_version": "nr-k3-fo-ccz4-local-principal-proxy-v3-conformal-split",
        "source_digest": source_before,
        "source_unchanged_during_run": source_unchanged,
        "formulation": "FO-CCZ4 local frame similarity/scaling proxy plus implemented-RHS cross-check",
        "grid": asdict(state.grid),
        "gauge": asdict(gauge),
        "config": asdict(config),
        "axes": list(axes),
        "points": args.points,
        "amplitude": args.amplitude,
        "sample_count": len(samples),
        "samples": sample_records,
        "audit_error": audit_error,
        "rhs_consistency_deterministic": consistency_deterministic,
        "rhs_consistency_validated": rhs_consistency_validated,
        "validation": {
            "candidate": candidate,
            "deterministic_replay": deterministic,
            "local_similarity_validated": bool(
                not audit_error and len(first_reports) == len(samples)
                and all(report.local_similarity_validated for report in first_reports)
            ),
            "rhs_principal_consistency_validated": rhs_consistency_validated,
            "variable_coefficient_principal_proxy_validated": False,
            "variable_coefficient_boundary_validated": False,
            "nonlinear_cpbc_validated": False,
            "physical_boundary_validated": False,
            "cpbc_ready": False,
            "runtime_writeback": False,
            "promotion": (
                "blocked-pending-rhs-principal-consistency-coefficient-gradient-"
                "terms-analytic-uniform-symmetrizer-nonlinear-cpbc-physical-validation"
            ),
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x", encoding="utf-8") as stream:
        json.dump(receipt, stream, ensure_ascii=False, indent=2, sort_keys=True, allow_nan=False)
        stream.write("\n")
    print(
        json.dumps(
            {
                "output": str(args.output.resolve()),
                "candidate": candidate,
                "audit_error": audit_error,
                "deterministic_replay": deterministic,
                "sample_count": len(samples),
                "max_similarity_residual": (
                    max((report.operator_similarity_residual_l_inf for report in first_reports), default=None)
                ),
                "max_imaginary_eigenvalue": (
                    max((report.operator_imaginary_l_inf for report in first_reports), default=None)
                ),
                "max_rhs_consistency_error": (
                    max((item["max_abs_error"] for item in first_consistency), default=None)
                ),
                "rhs_consistency_validated": rhs_consistency_validated,
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if candidate else 2


if __name__ == "__main__":
    raise SystemExit(main())
