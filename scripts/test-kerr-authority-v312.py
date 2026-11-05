from __future__ import annotations

import importlib.util
import json
import math
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-authority-v312.py"
GATE = ROOT / "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"
NEGATIVE = ROOT / "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate-negative.json"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_kerr_v312_tests", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v312 authority")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V312 = load_module()


class KerrAuthorityV312Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.gate = json.loads(GATE.read_text(encoding="utf-8"))
        cls.negative = json.loads(NEGATIVE.read_text(encoding="utf-8"))

    def test_canonical_identity_and_negative_preservation(self) -> None:
        unsigned = {key: value for key, value in self.gate.items() if key != "evidenceSha256"}
        self.assertEqual(V312.value_sha(unsigned), self.gate["evidenceSha256"])
        self.assertEqual(self.gate["evidenceSha256"], "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e")
        self.assertEqual(self.negative["evidenceSha256"], "e35cf4f6abe9328e1bd11e4e9d30490bca82b6e1cf86b0cc8172310654226f17")
        self.assertEqual(self.gate["priorNegativeEvidence"]["evidenceSha256"], self.negative["evidenceSha256"])
        self.assertTrue(self.gate["priorNegativeEvidence"]["preserved"])

    def test_solver_ladder_and_ab_matrix_are_real(self) -> None:
        rows = self.gate["executions"]
        self.assertEqual(len(rows), 128)
        groups: dict[tuple[str, str, str], dict[str, dict]] = {}
        ab_groups: dict[tuple[str, str, str], list[dict]] = {}
        for row in rows:
            groups.setdefault((row["rayId"], row["formulation"], row["branch"]), {})[row["toleranceClass"]] = row
            ab_groups.setdefault((row["rayId"], row["formulation"], row["toleranceClass"]), []).append(row)
        self.assertEqual(len(groups), 64)
        for pair in groups.values():
            self.assertEqual(set(pair), {"release", "internal"})
            self.assertTrue(math.isclose(pair["release"]["solverTolerance"], 1e-11, rel_tol=1e-15))
            self.assertTrue(math.isclose(pair["internal"]["solverTolerance"], 1e-13, rel_tol=1e-15))
            self.assertGreater(pair["release"]["solverTolerance"], pair["internal"]["solverTolerance"])
        self.assertEqual(len(ab_groups), 64)
        for rows_ab in ab_groups.values():
            self.assertEqual(len(rows_ab), 2)
            left = {key: value for key, value in rows_ab[0].items() if key != "branch"}
            right = {key: value for key, value in rows_ab[1].items() if key != "branch"}
            self.assertEqual(left, right)

    def test_thresholds_and_campaign_boundary_fail_closed(self) -> None:
        convergence = self.gate["toleranceConvergence"]
        self.assertEqual(convergence["strictSolverLadderPairCount"], 64)
        self.assertEqual(convergence["convergenceObservableCount"], 256)
        self.assertGreater(convergence["distinctConvergenceObservableCount"], 0)
        self.assertLess(self.gate["thresholds"]["maxMassShellResidualRaw"], 1e-10)
        self.assertLess(self.gate["thresholds"]["maxCarterResidualNormalized"], 1e-10)
        self.assertLess(self.gate["thresholds"]["maxRedshiftDifference"], 0.005)
        self.assertLess(self.gate["resource"]["peakRssGiB"], 2)
        self.assertFalse(self.gate["release"]["denseShardExecuted"])
        self.assertFalse(self.gate["release"]["correctedDenseCampaignCreated"])
        self.assertEqual(self.gate["release"]["formalProductPointer"], "v263")
        self.assertEqual(self.gate["science"]["defaultKernel"], "legacy-eih-1pn")


if __name__ == "__main__":
    unittest.main()
