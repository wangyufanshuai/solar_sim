from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-dense-campaign-v572.py"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_v572_tests", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v572 campaign")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V572 = load_module()


class KerrDenseCampaignV572Tests(unittest.TestCase):
    def test_imports_only_fully_qualified_v568_shards(self) -> None:
        state = V572.status()
        envelope = V572.read_verified(V572.ENVELOPE, "envelopeSha256")
        self.assertEqual([row["shardIndex"] for row in envelope["importedShards"]], list(range(22)))
        self.assertEqual(envelope["v568FailureEvidence"]["failedShardIndex"], 22)
        self.assertFalse(envelope["v568FailureEvidence"]["automaticRetryApplied"])
        self.assertEqual(state["importedShardCount"], 22)

    def test_preregistered_ladder_keeps_original_threshold(self) -> None:
        self.assertEqual(V572.CONTROL_FACTORS, (1.0, 0.75, 0.5, 0.25, 0.1))
        self.assertEqual(V572.RESIDUAL_LIMIT, 1e-10)

    def test_failed_v568_ray_qualifies_without_branch_change(self) -> None:
        result = V572.diagnose_ray(1416)
        self.assertEqual(result["classifications"], ["escape"])
        self.assertLess(result["maxCarterResidualNormalized"], 1e-10)
        self.assertIn(0.75, result["selectedControlFactors"])
        self.assertFalse(result["stateMutationApplied"])


if __name__ == "__main__":
    unittest.main()
