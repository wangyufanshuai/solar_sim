from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-authority-v296.py"
SPEC = importlib.util.spec_from_file_location("orbit_atlas_kerr_v296", SOURCE)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class KerrAuthorityV296Tests(unittest.TestCase):
    def test_constraint_stabilization_preserves_exact_surface(self):
        self.assertEqual(MODULE.CONSTRAINT_PROJECTION_INTERVAL, 0.01)
        ray = MODULE.BASE.FIXTURE_BY_ID["capture-02"]
        result = MODULE.evaluate_carter_stabilized(ray, MODULE.BASE.RELEASE_TOLERANCE, "A")
        self.assertEqual(result["classification"], "capture")
        self.assertLess(result["massShellResidualRaw"], 1e-10)
        self.assertLess(result["carterResidualNormalized"], 1e-10)
        self.assertEqual(result["constraintStabilization"]["exactSurfaceMutation"], "none")

    def test_base_v291_module_is_restored_after_builder(self):
        original = MODULE.BASE.evaluate_carter
        MODULE.with_stabilized_carter(lambda: None)
        self.assertIs(MODULE.BASE.evaluate_carter, original)


if __name__ == "__main__":
    unittest.main()
