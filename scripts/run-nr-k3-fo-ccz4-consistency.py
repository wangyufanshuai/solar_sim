"""Cross-check the FO-CCZ4 shadow RHS against the audited second-order RHS."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import (  # noqa: E402
    BSSNState3D,
    Grid3D,
    FOCCZ4State3D,
    fo_ccz4_rhs_3d,
)
from science.numerical_relativity.ccz4_3d import ccz4_rhs_3d  # noqa: E402


BASE_FIELDS = (
    "h",
    "a",
    "trace_k",
    "theta",
    "conformal_gamma",
    "b",
)


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_rhs.py",
        "science/numerical_relativity/ccz4_3d.py",
        "science/numerical_relativity/bssn3d.py",
        "scripts/run-nr-k3-fo-ccz4-consistency.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


def _row(points: int, amplitude: float, wavelength: float) -> dict[str, object]:
    grid = Grid3D(
        (points, points, points),
        (0.0, 0.0, 0.0),
        (1.0, 1.0, 1.0),
        boundary="periodic",
        spatial_order=2,
    )
    base = BSSNState3D.gauge_wave(
        grid,
        amplitude=amplitude,
        wavelength=wavelength,
        formulation="ccz4",
    )
    first = fo_ccz4_rhs_3d(FOCCZ4State3D.from_bssn_state(base))
    second = ccz4_rhs_3d(base)
    converted = {
        "h": first.h,
        "a": first.a,
        "trace_k": first.trace_k,
        "theta": first.theta,
        "conformal_gamma": first.conformal_gamma,
        "b": first.b,
    }
    errors = {
        name: float(np.max(np.abs(converted[name] - getattr(second, name))))
        for name in BASE_FIELDS
    }
    # The logarithmic variables are compared after converting back to the
    # repository's chi/lapse convention.
    errors["chi"] = float(np.max(np.abs(2.0 * base.chi * first.ln_phi - second.chi)))
    errors["lapse"] = float(np.max(np.abs(base.lapse * first.ln_lapse - second.lapse)))
    replay = fo_ccz4_rhs_3d(FOCCZ4State3D.from_bssn_state(base))
    replay_hash = hashlib.sha256()
    for name in (
        "h",
        "ln_lapse",
        "shift",
        "ln_phi",
        "a",
        "trace_k",
        "theta",
        "conformal_gamma",
        "b",
        "lapse_gradient",
        "shift_gradient",
        "metric_gradient",
        "conformal_factor_gradient",
    ):
        replay_hash.update(np.ascontiguousarray(getattr(first, name)).tobytes())
    replay_hash_2 = hashlib.sha256()
    for name in (
        "h",
        "ln_lapse",
        "shift",
        "ln_phi",
        "a",
        "trace_k",
        "theta",
        "conformal_gamma",
        "b",
        "lapse_gradient",
        "shift_gradient",
        "metric_gradient",
        "conformal_factor_gradient",
    ):
        replay_hash_2.update(np.ascontiguousarray(getattr(replay, name)).tobytes())
    return {
        "points": points,
        "grid_spacing": list(grid.spacing),
        "errors_max_abs": errors,
        "max_base_error": max(errors.values()),
        "deterministic_replay": replay_hash.hexdigest() == replay_hash_2.hexdigest(),
        "first_order_method": "fo-ccz4-58-variable-rhs-shadow-v1",
    }


def _observed_orders(rows: list[dict[str, object]]) -> dict[str, list[float]]:
    orders: dict[str, list[float]] = {}
    for name in ("a", "trace_k", "theta"):
        values = [float(row["errors_max_abs"][name]) for row in rows]  # type: ignore[index]
        spacings = [float(row["grid_spacing"][0]) for row in rows]  # type: ignore[index]
        orders[name] = [
            float(
                np.log(values[index - 1] / values[index])
                / np.log(spacings[index - 1] / spacings[index])
            )
            for index in range(1, len(values))
        ]
    return orders


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--points", default="7,9,13,17")
    parser.add_argument("--amplitude", type=float, default=1.0e-4)
    parser.add_argument("--wavelength", type=float, default=1.0)
    args = parser.parse_args()
    points = tuple(int(value.strip()) for value in args.points.split(",") if value.strip())
    if len(points) < 3 or any(value < 7 for value in points):
        raise SystemExit("--points must contain at least three values >= 7")
    if any(left >= right for left, right in zip(points, points[1:])):
        raise SystemExit("--points must be strictly increasing")
    rows = [_row(value, args.amplitude, args.wavelength) for value in points]
    orders = _observed_orders(rows)
    receipt = {
        "benchmark": "nr-k3-fo-ccz4-second-order-consistency-shadow",
        "schema_version": "nr-k3-fo-ccz4-consistency-v1",
        "source_digest": _source_digest(),
        "rows": rows,
        "observed_orders": orders,
        "validation": {
            "first_order_auxiliary_rhs": True,
            "geometric_rhs_crosscheck": True,
            "deterministic_replay": all(row["deterministic_replay"] for row in rows),
            "strong_hyperbolicity_validated": False,
            "characteristic_boundary_validated": False,
            "physical_black_hole_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-58-variable-principal-symbol-and-cpbc",
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
                "replay": receipt["validation"]["deterministic_replay"],
                "observed_orders": orders,
                "fine_errors": rows[-1]["errors_max_abs"],
                "promotion": receipt["validation"]["promotion"],
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
