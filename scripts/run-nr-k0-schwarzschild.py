"""Emit a reproducible NR-K0 Schwarzschild oracle receipt.

The command is deliberately independent of Next.js.  It prints a stable
scientific result envelope and exits non-zero if the requested refinement gate
fails.  It never changes the live EIH runtime or writes to the web app unless
an explicit output path is supplied.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Sequence

# Running ``python scripts/<name>.py`` places ``scripts/`` (not the repository
# root) on sys.path.  Resolve the package boundary explicitly so the CLI is
# reproducible from any current working directory.
_REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
if str(_REPOSITORY_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPOSITORY_ROOT))

from science.numerical_relativity import (
    manifest_from_constraint_report,
    run_constraint_convergence,
)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mass", type=float, default=1.0, dest="mass_length")
    parser.add_argument("--r-min", type=float, default=2.0)
    parser.add_argument("--r-max", type=float, default=20.0)
    parser.add_argument(
        "--order",
        type=int,
        choices=(2, 4),
        default=2,
        help="central finite-difference order used by the oracle",
    )
    parser.add_argument(
        "--grid",
        type=int,
        nargs="+",
        default=(101, 201, 401, 801),
        help="strictly increasing grid sizes",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="optional JSON receipt path; stdout is always emitted",
    )
    return parser


def _receipt(args: argparse.Namespace) -> dict[str, object]:
    report = run_constraint_convergence(
        mass_length=args.mass_length,
        radius_interval=(args.r_min, args.r_max),
        grid_sizes=args.grid,
        order=args.order,
    )
    manifest = manifest_from_constraint_report(report)
    return {
        "manifest": manifest.payload(),
        "manifest_sha256": manifest.sha256(),
        "samples": [
            {
                "derivative_l2": sample.derivative_l2,
                "derivative_l_inf": sample.derivative_l_inf,
                "hamiltonian_l2": sample.hamiltonian_l2,
                "hamiltonian_l_inf": sample.hamiltonian_l_inf,
                "points": sample.points,
                "spacing": sample.spacing,
            }
            for sample in report.samples
        ],
        "observed_orders": list(report.observed_orders),
    }


def main(argv: Sequence[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    receipt = _receipt(args)
    text = json.dumps(receipt, ensure_ascii=False, indent=2, sort_keys=True)
    print(text)
    if args.output is not None:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text + "\n", encoding="utf-8")
    return 0 if receipt["manifest"]["diagnostics"]["refinement_passed"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
