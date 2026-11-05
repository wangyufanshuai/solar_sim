"""Run the time-symmetric Brill--Lindquist binary initial-data shadow gate."""

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
    adm_mass_from_isotropic_state,
    constraint_report_3d,
    manifest_from_3d_state,
)


def _source_digest() -> str:
    digest = hashlib.sha256()
    root = Path(__file__).resolve().parents[1]
    for relative in (
        "science/numerical_relativity/nr3d.py",
        "science/numerical_relativity/constraints3d.py",
        "science/numerical_relativity/manifest.py",
        "scripts/run-nr-k3-binary-initial-shadow.py",
    ):
        path = root / relative
        digest.update(relative.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def _state_digest(state: BSSNState3D) -> str:
    digest = hashlib.sha256()
    for name in ("chi", "h", "trace_k", "a", "lapse", "valid_mask"):
        digest.update(name.encode("utf-8"))
        digest.update(np.ascontiguousarray(getattr(state, name)).tobytes())
    return digest.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--points", type=int, default=33)
    parser.add_argument("--separation", type=float, default=1.5)
    parser.add_argument("--mass-one", type=float, default=1.0)
    parser.add_argument("--mass-two", type=float, default=1.0)
    parser.add_argument("--excision-radius", type=float, default=0.3)
    parser.add_argument("--excision-buffer-cells", type=int, default=2)
    parser.add_argument("--adm-radius", type=float, default=3.0)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if (
        args.points < 17
        or not np.isfinite(args.separation)
        or args.separation <= 0.0
        or not np.isfinite(args.mass_one)
        or args.mass_one <= 0.0
        or not np.isfinite(args.mass_two)
        or args.mass_two <= 0.0
        or not np.isfinite(args.excision_radius)
        or args.excision_radius <= 0.0
        or args.excision_buffer_cells < 0
        or not np.isfinite(args.adm_radius)
        or args.adm_radius <= 0.0
    ):
        raise SystemExit("positive masses, separation, radii and points >= 17 are required")

    grid = Grid3D(
        (args.points, args.points, args.points),
        (-4.0, -4.0, -4.0),
        (4.0, 4.0, 4.0),
        boundary="excision",
    )
    centers = ((-0.5 * args.separation, 0.0, 0.0), (0.5 * args.separation, 0.0, 0.0))
    state = BSSNState3D.brill_lindquist_two_puncture(
        grid,
        masses=(args.mass_one, args.mass_two),
        centers=centers,
        excision_radius=args.excision_radius,
        excision_buffer_cells=args.excision_buffer_cells,
        formulation="ccz4",
    )
    constraints = constraint_report_3d(state)
    adm = adm_mass_from_isotropic_state(
        state,
        args.adm_radius,
        theta_samples=12,
        phi_samples=24,
        tolerance=0.05 * (args.mass_one + args.mass_two),
    )
    expected_mass = args.mass_one + args.mass_two
    diagnostics = {
        "benchmark": "time-symmetric-brill-lindquist-two-puncture",
        "separation": args.separation,
        "masses": [args.mass_one, args.mass_two],
        "centers": [list(center) for center in centers],
        "excision_radius": args.excision_radius,
        "excision_buffer_cells": args.excision_buffer_cells,
        "valid_cell_count": state.valid_cell_count,
        "constraint_norms": dict(constraints.norms),
        "adm_radius": args.adm_radius,
        "adm_mass": adm.mass,
        "expected_adm_mass": expected_mass,
        "adm_abs_error": abs(adm.mass - expected_mass),
        "adm_passed": adm.passed,
        "orbital_momentum_present": False,
        "physical_binary_black_hole_validated": False,
        "state_sha256": _state_digest(state),
        "source_sha256": _source_digest(),
    }
    manifest = manifest_from_3d_state(state, diagnostics=diagnostics)
    payload = manifest.payload()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({
        "manifest": str(args.output),
        "adm_mass": adm.mass,
        "expected_adm_mass": expected_mass,
        "adm_passed": adm.passed,
        "momentum_l_inf": constraints.norms["momentum_l_inf"],
        "promotion": payload["promotion"],
    }, sort_keys=True))
    return 0 if adm.passed else 2


if __name__ == "__main__":
    raise SystemExit(main())
