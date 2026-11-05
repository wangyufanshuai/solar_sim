from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-polarization-v293.py"
SPEC = importlib.util.spec_from_file_location("orbit_atlas_kerr_v293", SOURCE)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class KerrPolarizationV293Tests(unittest.TestCase):
    def test_killing_yano_forms_are_antisymmetric(self):
        for spin in (-0.9, 0.0, 0.9):
            form, dual = MODULE.killing_yano_forms(12.0, 1.1, spin)
            self.assertLess(float(np.max(np.abs(form + form.T))), 1e-12)
            self.assertLess(float(np.max(np.abs(dual + dual.T))), 1e-12)

    def test_walker_penrose_and_direct_transport_implementation_fixture(self):
        result = MODULE.implementation_self_test()
        self.assertTrue(result["passed"])
        self.assertGreater(result["walkerPenroseRoundtripAlignment"], 1.0 - 1e-10)
        self.assertLess(result["directTransportOrthogonalityResidual"], 1e-8)

    def test_formal_gate_is_blocked_when_geometry_failed(self):
        gate = MODULE.build_gate()
        self.assertFalse(gate["qualified"])
        self.assertIn(gate["status"], {"blocked-by-geometry", "polarization-failed"})
        self.assertEqual(gate["applicableExecutionCount"], 0)
        self.assertEqual(gate["payloads"], [])


if __name__ == "__main__":
    unittest.main()
