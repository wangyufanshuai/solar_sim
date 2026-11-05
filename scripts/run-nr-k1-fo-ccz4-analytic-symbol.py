"""Audit the independent flat-background FO-CCZ4 principal matrix."""

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
    FOCCZ4_VARIABLE_ORDER,
    GaugeConfig,
    FOCCZ4Config,
    analytic_fo_ccz4_principal_matrix_3d,
    linearized_fo_ccz4_principal_symbol_3d,
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "science/numerical_relativity/fo_ccz4_analytic_symbol.py",
        "scripts/run-nr-k1-fo-ccz4-analytic-symbol.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _digest_array(array: np.ndarray) -> str:
    digest = hashlib.sha256()
    digest.update(np.ascontiguousarray(array).tobytes())
    return digest.hexdigest()


def _digest_variable_order() -> str:
    return hashlib.sha256("\0".join(FOCCZ4_VARIABLE_ORDER).encode("ascii")).hexdigest()


def _parse_axes(raw: str) -> tuple[int, ...]:
    axes = tuple(int(value.strip()) for value in raw.split(",") if value.strip())
    if not axes or any(axis not in (0, 1, 2) for axis in axes):
        raise SystemExit("--normal-axes must contain one or more values from 0,1,2")
    if len(set(axes)) != len(axes):
        raise SystemExit("--normal-axes must not repeat an axis")
    return axes


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", type=int, default=8)
    parser.add_argument("--normal-axes", default="0,1,2")
    parser.add_argument("--residual-tolerance", type=float, default=1.0e-8)
    args = parser.parse_args()
    if args.points < 8:
        raise SystemExit("--points must be at least eight")
    if not np.isfinite(args.residual_tolerance) or args.residual_tolerance <= 0.0:
        raise SystemExit("--residual-tolerance must be finite and positive")
    axes = _parse_axes(args.normal_axes)

    gauge = GaugeConfig(
        shift_coefficient=1.0,
        shift_damping=0.0,
        theta_coupling=2.0,
    )
    config = FOCCZ4Config(kappa1=0.0)
    rows = []
    for normal_axis in axes:
        raw = linearized_fo_ccz4_principal_symbol_3d(
            points=args.points,
            normal_axis=normal_axis,
            gauge=gauge,
            config=config,
            return_raw=True,
        )
        direct = analytic_fo_ccz4_principal_matrix_3d(
            normal_axis=normal_axis,
            gauge=gauge,
            config=config,
        )
        extracted = raw.symbol / (1j * raw.effective_wave_number)
        error = float(np.max(np.abs(extracted - direct)))
        replay = analytic_fo_ccz4_principal_matrix_3d(
            normal_axis=normal_axis,
            gauge=gauge,
            config=config,
        )
        rows.append(
            {
                "normal_axis": normal_axis,
                "points": int(raw.report.points),
                "effective_wave_number": float(raw.effective_wave_number),
                "max_abs_error": error,
                "finite": bool(np.all(np.isfinite(direct))),
                "matrix_rank": int(np.linalg.matrix_rank(direct)),
                "direct_matrix_sha256": _digest_array(direct),
                "extracted_matrix_sha256": _digest_array(extracted),
                "deterministic_replay": bool(np.array_equal(direct, replay)),
                "crosscheck_validated": bool(
                    np.all(np.isfinite(direct)) and error <= args.residual_tolerance
                ),
            }
        )

    crosscheck = all(row["crosscheck_validated"] for row in rows)
    replay = all(row["deterministic_replay"] for row in rows)
    receipt = {
        "benchmark": "nr-k1-fo-ccz4-analytic-principal-symbol-crosscheck",
        "schema_version": "nr-k1-fo-ccz4-analytic-symbol-v1",
        "source_digest": _source_digest(),
        "formulation": "FO-CCZ4",
        "background": "flat-Minkowski-linearized-principal-part",
        "contract": {
            "equation": "q_t = i*k*A(n)*q",
            "variable_count": len(FOCCZ4_VARIABLE_ORDER),
            "variable_order_sha256": _digest_variable_order(),
            "gauge": asdict(gauge),
            "config": asdict(config),
            "independence": "direct tensor contraction, not finite-difference matrix assembly",
        },
        "campaign": {
            "points": args.points,
            "normal_axes": list(axes),
            "residual_tolerance": args.residual_tolerance,
        },
        "rows": rows,
        "validation": {
            "analytic_principal_matrix_crosscheck": crosscheck,
            "deterministic_replay": replay,
            "analytic_full_eigenvectors_validated": False,
            "strong_hyperbolicity_validated": False,
            "constraint_preserving_validated": False,
            "physical_boundary_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-analytic-eigenvectors-symmetrizer-cpbc",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "output": str(args.output.resolve()),
                "normal_axes": list(axes),
                "analytic_principal_matrix_crosscheck": crosscheck,
                "deterministic_replay": replay,
                "max_abs_error": max(row["max_abs_error"] for row in rows),
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0 if crosscheck and replay else 2


if __name__ == "__main__":
    raise SystemExit(main())
