from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-authority-v291.py"
SPEC = importlib.util.spec_from_file_location("orbit_atlas_kerr_v291", SOURCE)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class KerrAuthorityV291Tests(unittest.TestCase):
    def test_bl_ks_metric_and_covector_roundtrip(self):
        for spin in (-0.9, 0.0, 0.9):
            ray = MODULE.RayFixture("roundtrip", -2.0, -2.0, spin, "capture")
            initial = MODULE.initial_bl_state(ray)
            transformed = MODULE.initial_ks_state(ray, initial)
            self.assertLess(transformed["metricPullbackResidual"], 1e-12)
            self.assertLess(transformed["covectorRoundtripResidual"], 1e-12)
            self.assertLess(transformed["initialHamiltonianResidual"], 1e-12)

    def test_analytic_ks_derivatives_match_five_point_oracle(self):
        position = np.asarray((20.0, 0.4, 7.0), dtype=float)
        for spin in (-0.9, 0.0, 0.9):
            _covariant, _inverse, analytic = MODULE.ks_metric_with_derivatives(position, spin)
            finite = MODULE.finite_difference_ks_derivatives(position, spin)
            residual = max(float(np.max(np.abs(left - right))) for left, right in zip(analytic, finite))
            self.assertLess(residual, 1e-8)

    def test_canonical_fixture_families_are_non_degenerate(self):
        counts = {"capture": 0, "escape": 0, "disk-hit": 0}
        for fixture in MODULE.FIXTURES:
            counts[fixture.expected_family] += 1
        self.assertEqual(counts, {"capture": 6, "escape": 6, "disk-hit": 4})

    def test_generated_geometry_gate_is_fail_closed_and_deterministic(self):
        path = ROOT / "dist/science/kerr-reference-v292/geometry-redshift-short-gate.json"
        if not path.exists():
            self.skipTest("geometry gate has not been generated")
        evidence = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(evidence["executionCount"], 128)
        self.assertEqual(evidence["criticalBracketCount"], 40)
        self.assertTrue(evidence["thresholds"]["abDeterministic"])
        self.assertEqual(evidence["thresholds"]["invalidOrTimeout"], 0)
        self.assertFalse(evidence["fullKerrAuthorityQualified"])


if __name__ == "__main__":
    unittest.main()
