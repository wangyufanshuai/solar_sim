from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-polarization-v297.py"
SPEC = importlib.util.spec_from_file_location("orbit_atlas_kerr_v297", SOURCE)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class KerrPolarizationV297Tests(unittest.TestCase):
    def test_formal_gate_is_qualified_and_conserves_applicable_rows(self) -> None:
        path = ROOT / "dist/science/kerr-reference-v297/polarization-short-gate.json"
        evidence = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(evidence["status"], "full-kerr-short-authority-qualified")
        self.assertTrue(evidence["qualified"])
        self.assertEqual(evidence["applicableExecutionCount"], 16)
        self.assertEqual(evidence["captureEscapeNotApplicableCount"], 96)
        self.assertEqual(evidence["sourceDiskHitExecutionCount"], 32)
        self.assertTrue(all(payload["passed"] for payload in evidence["payloads"]))
        self.assertLess(evidence["thresholds"]["maxInternalEvpaDifferenceDeg"], 0.1)
        self.assertLess(evidence["resource"]["peakRssGiB"], 2.0)

    def test_walker_penrose_constant_is_linear_and_fixtures_pass(self) -> None:
        spin, radius, theta = 0.7, 12.0, 1.1
        coordinates = np.asarray((0.0, radius, theta, 0.0))
        tetrad = MODULE.BASE.zamo_tetrad(radius, theta, spin)
        wave = tetrad @ np.asarray((1.0, -0.8, 0.2, 0.3))
        polarization = tetrad @ np.asarray((0.0, 0.3, 0.7, -0.2))
        left = MODULE.walker_penrose_constant(spin, radius, theta, wave, polarization)
        right = MODULE.walker_penrose_constant(spin, radius, theta, wave, 2.0 * polarization)
        self.assertAlmostEqual(right.real, 2.0 * left.real, places=12)
        self.assertAlmostEqual(right.imag, 2.0 * left.imag, places=12)
        self.assertTrue(MODULE.symmetry_fixtures()["passed"])

    def test_exact_face_on_is_unavailable_not_zero_evpa(self) -> None:
        radius, spin = 12.0, 0.0
        coordinates = np.asarray((0.0, radius, MODULE.math.pi / 2.0, 0.0))
        tetrad = MODULE.BASE.zamo_tetrad(radius, MODULE.math.pi / 2.0, spin)
        emitter = MODULE.emitter_four_velocity(radius, spin)
        with self.assertRaises(RuntimeError):
            MODULE.projected_disk_normal_polarization(coordinates, emitter + tetrad[:, 2], spin)


if __name__ == "__main__":
    unittest.main()
