"""Run the limited analytic flat-background FO-CCZ4 ODE-block contract."""

from __future__ import annotations

import argparse
from dataclasses import asdict
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from science.numerical_relativity import audit_fo_ccz4_ode_block_3d  # noqa: E402


def _source_digest() -> str:
    root = Path(__file__).resolve().parents[1]
    digest = hashlib.sha256()
    for relative in (
        "science/numerical_relativity/fo_ccz4.py",
        "science/numerical_relativity/fo_ccz4_principal_symbol.py",
        "science/numerical_relativity/fo_ccz4_analytic_contract.py",
        "scripts/run-nr-k1-fo-ccz4-ode-block.py",
    ):
        digest.update(relative.encode("utf-8"))
        digest.update((root / relative).read_bytes())
    return digest.hexdigest()


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
    parser.add_argument("--residual-tolerance", type=float, default=1.0e-10)
    args = parser.parse_args()
    axes = _parse_axes(args.normal_axes)
    if args.points < 8:
        raise SystemExit("--points must be at least eight")
    reports = [
        audit_fo_ccz4_ode_block_3d(
            points=args.points,
            normal_axis=axis,
            residual_tolerance=args.residual_tolerance,
        )
        for axis in axes
    ]
    serialized = [asdict(report) for report in reports]
    validated = all(report.flat_ode_block_validated for report in reports)
    replay = reports[0] == audit_fo_ccz4_ode_block_3d(
        points=args.points,
        normal_axis=axes[0],
        residual_tolerance=args.residual_tolerance,
    )
    receipt = {
        "benchmark": "nr-k1-fo-ccz4-flat-ode-block-shadow",
        "schema_version": "nr-k1-fo-ccz4-ode-block-v1",
        "source_digest": _source_digest(),
        "campaign": {
            "points": args.points,
            "normal_axes": list(axes),
            "residual_tolerance": args.residual_tolerance,
            "contract": "d_t(h_ij,ln_alpha,beta_i,ln_phi)|principal=0",
        },
        "reports": serialized,
        "validation": {
            "flat_ode_block_validated": validated,
            "deterministic_replay": replay,
            "analytic_full_eigenvectors_validated": False,
            "strong_hyperbolicity_validated": False,
            "constraint_preserving_validated": False,
            "physical_boundary_validated": False,
            "runtime_writeback": False,
            "promotion": "blocked-pending-full-analytic-eigenvectors-symmetrizer-cpbc",
        },
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    summary = {
        "output": str(args.output.resolve()),
        "normal_axes": list(axes),
        "flat_ode_block_validated": validated,
        "deterministic_replay": replay,
        "promotion": receipt["validation"]["promotion"],
    }
    print(json.dumps(summary, sort_keys=True))
    return 0 if validated and replay else 2


if __name__ == "__main__":
    raise SystemExit(main())
