from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

import numpy as np

SCRIPT = Path(__file__).with_name("run-kerr-authority-v288.py")
SPEC = importlib.util.spec_from_file_location("atlas_kerr_v288_test", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class KerrAuthorityV288Tests(unittest.TestCase):
    def test_signed_spin_zamo_tetrad_is_orthonormal(self):
        target = np.diag((-1.0, 1.0, 1.0, 1.0))
        for spin in (-0.9, 0.0, 0.9):
            tetrad = MODULE.zamo_tetrad(MODULE.R_OBSERVER, MODULE.THETA_OBSERVER, spin)
            metric = MODULE.bl_metric_cov(MODULE.R_OBSERVER, MODULE.THETA_OBSERVER, spin)
            self.assertLess(float(np.max(np.abs(tetrad.T @ metric @ tetrad - target))), 1e-12)

    def test_finite_observer_initial_null_shell(self):
        for fixture in MODULE.FIXTURES:
            self.assertLess(MODULE.initial_bl_state(fixture)["massShellResidual"], 1e-12)

    def test_reduced_gate_fails_closed_without_evpa_authority(self):
        evidence = MODULE.build_short_gate(limit_rays=1)
        self.assertFalse(evidence["gatePassed"])
        self.assertIn("walker-penrose-evpa-authority-unavailable", evidence["failureReasons"])
        self.assertTrue(all(row["evpaDeg"] is None for row in evidence["executions"]))

    def test_critical_bracket_has_measured_nonzero_width(self):
        bracket = MODULE.critical_bracket(0, 0.0)
        self.assertTrue(bracket["valid"])
        self.assertGreater(bracket["bracketWidthPx"], 0)
        self.assertLess(bracket["bracketWidthPx"], 0.5)
        self.assertNotEqual(bracket["leftClass"], bracket["rightClass"])

    def test_legacy_v283_is_not_imported(self):
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertNotIn("run-kerr-short-gate-v283", source)
        self.assertNotIn('"evpaDeg": 0', source)


if __name__ == "__main__":
    unittest.main()
