"""Focused tests for dense Kerr v6 aggregation semantics."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "atlas_kerr_dense_v6",
    ROOT / "scripts/run-kerr-dense-shards-v6.py",
)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


SOLVERS = ["carter-mino-dop853", "kerr-schild-hamiltonian-dop853"]


def executions(status: str) -> list[dict]:
    return [
        {"solver": solver, "tolerance": tolerance, "run": run, "status": status}
        for solver in SOLVERS
        for tolerance in ("fine", "finer")
        for run in ("A", "B")
    ]


def bracket(pair: int, side: str, status: str, offset: float) -> dict:
    return {
        "rayClass": "critical-bracket",
        "source": {"pair": pair, "side": side, "offsetPx": offset},
        "executions": executions(status),
    }


class DenseKerrAggregationTests(unittest.TestCase):
    def test_symmetric_physical_transition_reports_half_width_bound(self):
        rays = [
            bracket(0, "inner", "captured", -0.25),
            bracket(0, "outer", "escaped", 0.25),
            bracket(1, "inner", "captured", -0.25),
            bracket(1, "outer", "escaped", 0.25),
        ]
        report = MODULE.critical_bracket_metrics(rays, SOLVERS)
        self.assertEqual(report["pairCount"], 2)
        self.assertEqual(report["transitionCount"], 16)
        self.assertEqual(report["transitionExpected"], 16)
        self.assertEqual(report["maxErrorPx"], 0.25)

    def test_incomplete_or_nonphysical_pair_fails_closed(self):
        rays = [
            bracket(0, "inner", "captured", -0.25),
            bracket(0, "outer", "max-steps", 0.25),
        ]
        report = MODULE.critical_bracket_metrics(rays, SOLVERS)
        self.assertEqual(report["transitionCount"], 0)
        self.assertIsNone(report["maxErrorPx"])


if __name__ == "__main__":
    unittest.main()
