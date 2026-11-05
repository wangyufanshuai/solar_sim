from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/run-kerr-dense-campaign-v579.py"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_v579_tests", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v579 campaign")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V579 = load_module()


class KerrDenseCampaignV579Tests(unittest.TestCase):
    def test_axis_selector_is_physical_coordinate_family(self) -> None:
        plan = V579.ENGINE.read_verified(V579.V575_PLAN, "planSha256")
        selected = [ray for ray in plan["rays"] if V579.axis_selector(ray)]
        self.assertEqual(len(selected), 21)
        self.assertTrue(all(float(ray["alphaM"]) == 0.0 and float(ray["betaM"]) < 0.0 for ray in selected))

    def test_thresholds_are_not_relaxed(self) -> None:
        self.assertEqual(V579.CLASSIFICATION_AGREEMENT_MINIMUM, 0.999)
        self.assertEqual(V579.ENGINE.RESIDUAL_LIMIT, 1e-10)

    def test_v575_negative_aggregate_boundary_is_preserved(self) -> None:
        state = V579.ENGINE.read_verified(V579.V575_STATE, "stateSha256")
        self.assertEqual(state["completedShardCount"], 49)
        self.assertFalse(V579.AGGREGATE.parent.parent.joinpath("kerr-campaign-v575", "dense-aggregate.json").exists())
        plan = V579.ENGINE.read_verified(V579.V575_PLAN, "planSha256")
        diagnostic = V579.mismatch_diagnostic(plan)
        self.assertEqual(tuple(diagnostic["mismatchRayIndices"]), V579.EXPECTED_MISMATCH_RAYS)
        self.assertLess(diagnostic["classificationAgreement"], 0.999)


if __name__ == "__main__":
    unittest.main()
