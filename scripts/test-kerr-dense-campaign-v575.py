from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-dense-campaign-v575.py"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_v575_tests", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v575 campaign")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V575 = load_module()


class KerrDenseCampaignV575Tests(unittest.TestCase):
    def test_two_dimensional_ladder_is_preregistered(self) -> None:
        self.assertEqual(V575.PROJECTION_INTERVALS, (0.005, 0.0025, 0.001))
        self.assertEqual(V575.CONTROL_FACTORS, (1.0, 0.75, 0.5, 0.25, 0.1, 0.05, 0.02, 0.01))
        self.assertEqual(V575.ENGINE.RESIDUAL_LIMIT, 1e-10)

    def test_previous_failures_and_import_boundary_are_preserved(self) -> None:
        state = V575.ENGINE.status()
        envelope = V575.ENGINE.read_verified(V575.ENVELOPE, "envelopeSha256")
        self.assertEqual(state["importedShardCount"], 22)
        self.assertEqual(envelope["v568FailureEvidence"]["failedShardIndex"], 22)
        self.assertEqual(envelope["v572FailureEvidence"]["failedShardIndex"], 22)
        self.assertFalse(envelope["v572FailureEvidence"]["automaticRetryApplied"])

    def test_both_failed_rays_qualify_without_branch_change(self) -> None:
        for index in (1416, 1456):
            result = V575.diagnose(index)
            self.assertEqual(result["classifications"], ["escape"])
            self.assertLess(result["maxCarterResidualNormalized"], 1e-10)
            self.assertFalse(result["stateMutationApplied"])


if __name__ == "__main__":
    unittest.main()
